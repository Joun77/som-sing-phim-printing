package orders

import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"math"
	"mime/multipart"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"somsing.local/backend/auth"
)

// Allowed file extensions for print artwork and preflight analysis
var (
	AllowedArtworkExtensions = []string{
		".pdf", ".ai", ".eps", ".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".psd",
	}
	AllowedPreflightExtensions = []string{
		".pdf", ".ai", ".eps", ".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".psd",
	}
)

const (
	MaxArtworkFileSize = 50 * 1024 * 1024 // 50MB per file
	MaxBatchTotalFiles = 100              // Maximum 100 files per batch
)

// ValidatedUpload holds metadata for an upload that passed all pre-write checks.
type ValidatedUpload struct {
	SanitizedBaseName string
	Extension         string
	MimeType          string
	Size              int64
}

// GetUploadStorageDir returns the root storage directory for file uploads.
// Defaults to "./uploads", but can be overridden with UPLOAD_STORAGE_DIR (e.g. t.TempDir() in tests).
func GetUploadStorageDir() string {
	if dir := strings.TrimSpace(os.Getenv("UPLOAD_STORAGE_DIR")); dir != "" {
		return filepath.Clean(dir)
	}
	return "./uploads"
}

// GenerateServerAssetID returns a cryptographically unpredictable server asset ID.
func GenerateServerAssetID(prefix string) string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	hexPart := hex.EncodeToString(b)
	cleanPrefix := strings.TrimSpace(prefix)
	if cleanPrefix == "" {
		cleanPrefix = "asset"
	}
	return fmt.Sprintf("%s-%d-%s", cleanPrefix, time.Now().UnixNano()/1e6, hexPart)
}

// SanitizeFileName cleans user-supplied filename to prevent directory traversal and special chars.
func SanitizeFileName(filename string) string {
	base := filepath.Base(filename)
	base = strings.ReplaceAll(base, "\x00", "")
	base = strings.ReplaceAll(base, "/", "")
	base = strings.ReplaceAll(base, "\\", "")
	base = strings.ReplaceAll(base, "..", "")

	ext := filepath.Ext(base)
	nameWithoutExt := strings.TrimSuffix(base, ext)

	var sb strings.Builder
	for _, r := range nameWithoutExt {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '-' {
			sb.WriteRune(r)
		} else if r == ' ' {
			sb.WriteRune('_')
		}
	}
	clean := sb.String()
	if clean == "" {
		clean = "artwork"
	}
	if len(clean) > 40 {
		clean = clean[:40]
	}
	return clean + strings.ToLower(ext)
}

// SanitizeParam validates and cleans path parameter segments (such as order_no or item_id).
func SanitizeParam(param string) (string, error) {
	p := strings.TrimSpace(param)
	if p == "" {
		return "", fmt.Errorf("parameter cannot be empty")
	}
	if strings.Contains(p, "..") || strings.Contains(p, "/") || strings.Contains(p, "\\") || strings.Contains(p, "\x00") {
		return "", fmt.Errorf("parameter contains invalid path characters")
	}
	for _, r := range p {
		if !((r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '-') {
			return "", fmt.Errorf("parameter contains illegal character: %c", r)
		}
	}
	return p, nil
}

// ValidateAndSniffUpload inspects the file header before saving to disk.
// Enforces: non-empty, size <= maxBytes, allowed extension, and verified magic bytes.
func ValidateAndSniffUpload(fh *multipart.FileHeader, allowedExts []string, maxBytes int64) (*ValidatedUpload, error) {
	if fh == nil {
		return nil, fmt.Errorf("no file header provided")
	}
	if fh.Size <= 0 {
		return nil, fmt.Errorf("uploaded file is empty (0 bytes)")
	}
	if fh.Size > maxBytes {
		return nil, fmt.Errorf("file size (%d bytes) exceeds maximum allowed limit of %d bytes", fh.Size, maxBytes)
	}

	ext := strings.ToLower(filepath.Ext(fh.Filename))
	if ext == "" {
		return nil, fmt.Errorf("file has no extension")
	}

	isAllowed := false
	for _, a := range allowedExts {
		if strings.ToLower(a) == ext {
			isAllowed = true
			break
		}
	}
	if !isAllowed {
		return nil, fmt.Errorf("unsupported file extension %q", ext)
	}

	f, err := fh.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file for inspection: %w", err)
	}
	defer f.Close()

	buf := make([]byte, 512)
	n, err := io.ReadFull(f, buf)
	if err != nil && err != io.EOF && err != io.ErrUnexpectedEOF {
		return nil, fmt.Errorf("failed to read file header: %w", err)
	}
	header := buf[:n]

	// Reject disguised executables or web scripts
	if hasExecutableOrScriptSignature(header) {
		return nil, fmt.Errorf("security rejection: file contains unsafe executable or script signature")
	}

	mimeType, validMagic := verifyMagicBytesForExt(ext, header)
	if !validMagic {
		return nil, fmt.Errorf("magic byte mismatch: file content does not match declared extension %q", ext)
	}

	cleanBase := SanitizeFileName(fh.Filename)

	return &ValidatedUpload{
		SanitizedBaseName: cleanBase,
		Extension:         ext,
		MimeType:          mimeType,
		Size:              fh.Size,
	}, nil
}

func hasExecutableOrScriptSignature(b []byte) bool {
	// DOS/PE executable (Windows exe/dll)
	if len(b) >= 2 && b[0] == 0x4D && b[1] == 0x5A { // MZ
		return true
	}
	// Linux/Unix ELF executable
	if len(b) >= 4 && b[0] == 0x7F && b[1] == 'E' && b[2] == 'L' && b[3] == 'F' {
		return true
	}
	// Java Class bytecode
	if len(b) >= 4 && b[0] == 0xCA && b[1] == 0xFE && b[2] == 0xBA && b[3] == 0xBE {
		return true
	}
	// Web scripts & HTML
	lower := strings.ToLower(string(b))
	if strings.Contains(lower, "<html") ||
		strings.Contains(lower, "<script") ||
		strings.Contains(lower, "<?php") ||
		strings.HasPrefix(lower, "<!doctype") ||
		strings.HasPrefix(lower, "#!/") {
		return true
	}
	return false
}

func verifyMagicBytesForExt(ext string, b []byte) (string, bool) {
	switch ext {
	case ".pdf":
		if len(b) >= 5 && bytes.HasPrefix(b, []byte("%PDF-")) {
			return "application/pdf", true
		}
		return "", false

	case ".jpg", ".jpeg":
		if len(b) >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF {
			return "image/jpeg", true
		}
		return "", false

	case ".png":
		if len(b) >= 8 && bytes.HasPrefix(b, []byte("\x89PNG\r\n\x1a\n")) {
			return "image/png", true
		}
		return "", false

	case ".webp":
		if len(b) >= 12 && string(b[0:4]) == "RIFF" && string(b[8:12]) == "WEBP" {
			return "image/webp", true
		}
		return "", false

	case ".tiff", ".tif":
		if len(b) >= 4 {
			// Little-endian "II*\x00"
			if b[0] == 0x49 && b[1] == 0x49 && b[2] == 0x2A && b[3] == 0x00 {
				return "image/tiff", true
			}
			// Big-endian "MM\x00*"
			if b[0] == 0x4D && b[1] == 0x4D && b[2] == 0x00 && b[3] == 0x2A {
				return "image/tiff", true
			}
		}
		return "", false

	case ".psd":
		if len(b) >= 4 && string(b[0:4]) == "8BPS" {
			return "image/vnd.adobe.photoshop", true
		}
		return "", false

	case ".ai", ".eps":
		// PDF-based AI files
		if len(b) >= 5 && bytes.HasPrefix(b, []byte("%PDF-")) {
			return "application/pdf", true
		}
		// PostScript AI or EPS: starts with "%!PS" or "%!"
		if len(b) >= 2 && b[0] == '%' && b[1] == '!' {
			return "application/postscript", true
		}
		// Binary EPS header: 0xC5, 0xD0, 0xD3, 0xC6
		if len(b) >= 4 && b[0] == 0xC5 && b[1] == 0xD0 && b[2] == 0xD3 && b[3] == 0xC6 {
			return "application/postscript", true
		}
		return "", false

	default:
		return "", false
	}
}

// ResolveContainedPath evaluates canonical path and ensures the target resides strictly inside rootDir.
// It resolves all symlinks to prevent directory/file traversal and symlink escape attacks.
// If allowMissingFinal is true, it verifies that the existing parent directory resides inside rootDir
// and no component of the path attempts to escape.
// Returns canonicalTarget (absolute, symlinks resolved), canonicalRel (relative to canonical root), and error.
func ResolveContainedPath(rootDir, requestedPath string, allowMissingFinal bool) (string, string, error) {
	if rootDir == "" {
		rootDir = GetUploadStorageDir()
	}
	canonicalRoot, err := filepath.EvalSymlinks(rootDir)
	if err != nil {
		canonicalRoot = filepath.Clean(rootDir)
	}

	cleanReq := filepath.Clean(requestedPath)

	// If the target already exists, evaluate its real path directly (resolving all symlinks)
	if realTarget, err := filepath.EvalSymlinks(cleanReq); err == nil {
		rel, relErr := filepath.Rel(canonicalRoot, realTarget)
		if relErr != nil || strings.HasPrefix(rel, "..") || rel == ".." {
			return "", "", fmt.Errorf("security violation: path %q resolves outside storage root %q", requestedPath, canonicalRoot)
		}
		return realTarget, rel, nil
	}

	if !allowMissingFinal {
		return "", "", fmt.Errorf("file not found: %s", requestedPath)
	}

	// For new files being created, walk up to find the nearest existing directory
	cur := cleanReq
	var missingParts []string
	for {
		parent := filepath.Dir(cur)
		missingParts = append([]string{filepath.Base(cur)}, missingParts...)
		if parent == cur || parent == "." || parent == "/" {
			break
		}
		if realParent, err := filepath.EvalSymlinks(parent); err == nil {
			// Ensure realParent resides inside canonicalRoot
			relParent, relErr := filepath.Rel(canonicalRoot, realParent)
			if relErr != nil || strings.HasPrefix(relParent, "..") || relParent == ".." {
				return "", "", fmt.Errorf("security violation: parent directory %q resolves outside root %q", parent, canonicalRoot)
			}
			reconstructed := realParent
			for _, part := range missingParts {
				if part == ".." || part == "/" || strings.Contains(part, "\x00") {
					return "", "", fmt.Errorf("invalid path component in %q", requestedPath)
				}
				reconstructed = filepath.Join(reconstructed, part)
			}
			relReconstructed, err := filepath.Rel(canonicalRoot, reconstructed)
			if err != nil || strings.HasPrefix(relReconstructed, "..") || relReconstructed == ".." {
				return "", "", fmt.Errorf("security violation: constructed path %q escapes root %q", reconstructed, canonicalRoot)
			}
			return reconstructed, relReconstructed, nil
		}
		cur = parent
	}

	return "", "", fmt.Errorf("cannot resolve path %q within storage root", requestedPath)
}

// SaveSafeUploadedFile writes an uploaded file to dst, ensuring dst strictly resides inside GetUploadStorageDir()
// and does not write through symlinks outside or inside the storage root.
func SaveSafeUploadedFile(file *multipart.FileHeader, dst string) error {
	rootDir := GetUploadStorageDir()
	cleanDst, _, err := ResolveContainedPath(rootDir, dst, true)
	if err != nil {
		return err
	}

	// If destination already exists, verify it is not a symlink (prevent overwriting through symlink)
	if fi, err := os.Lstat(cleanDst); err == nil {
		if fi.Mode()&os.ModeSymlink != 0 {
			return fmt.Errorf("security violation: destination %q is a symlink", dst)
		}
	}

	dir := filepath.Dir(cleanDst)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create destination directory: %w", err)
	}

	src, err := file.Open()
	if err != nil {
		return fmt.Errorf("failed to open source uploaded file: %w", err)
	}
	defer src.Close()

	out, err := os.OpenFile(cleanDst, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0644)
	if err != nil {
		return fmt.Errorf("failed to create destination file: %w", err)
	}
	defer out.Close()

	written, err := io.Copy(out, io.LimitReader(src, MaxArtworkFileSize+1))
	if err == nil && (written != file.Size || written > MaxArtworkFileSize) {
		err = fmt.Errorf("upload length mismatch")
	}
	if err == nil {
		err = out.Sync()
	}
	if closeErr := out.Close(); err == nil {
		err = closeErr
	}
	if err != nil {
		os.Remove(cleanDst)
	}
	return err
}

// DetectSafeMimeType sniffs the initial bytes of a saved file to determine the safe MIME type.
func DetectSafeMimeType(filePath string) string {
	f, err := os.Open(filePath)
	if err != nil {
		return "application/octet-stream"
	}
	defer f.Close()

	buf := make([]byte, 512)
	n, _ := io.ReadFull(f, buf)
	header := buf[:n]

	ext := strings.ToLower(filepath.Ext(filePath))
	mime, ok := verifyMagicBytesForExt(ext, header)
	if ok {
		return mime
	}
	return "application/octet-stream"
}

// HandleServeProtectedFile serves private artwork/order files with role-based authentication,
// while keeping public preflight analysis limited to the preflight workspace.
// Public vs private classification evaluates the CANONICAL resolved target asset (R2).
func HandleServeProtectedFile(c *gin.Context) {
	filepathParam := c.Param("filepath")
	if filepathParam == "" || filepathParam == "/" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing file path parameter"})
		return
	}

	cleanSubPath := filepath.Clean("/" + filepath.ToSlash(filepathParam))
	cleanSubPath = strings.TrimPrefix(cleanSubPath, "/")

	if strings.Contains(cleanSubPath, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Directory traversal detected"})
		return
	}

	rootDir := GetUploadStorageDir()
	fullPath := filepath.Clean(filepath.Join(rootDir, cleanSubPath))

	// Containment and symlink resolution (R2):
	canonicalTarget, canonicalRel, err := ResolveContainedPath(rootDir, fullPath, false)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Access denied"})
		return
	}

	// Policy Boundary (R2):
	// Public classification is based on the ACTUAL ASSET location (canonicalRel),
	// NOT purely on the requested URL alias.
	// E.g., a symlink in preflight/ pointing to artworks/ will resolve canonicalRel to artworks/*
	// and will therefore be classified as PRIVATE, preventing anonymous leakage.
	isPreflight := strings.HasPrefix(canonicalRel, "preflight/") || canonicalRel == "preflight"
	isPublicCatalog := strings.HasPrefix(canonicalRel, "products/") || strings.HasPrefix(canonicalRel, "logo_")

	isPublic := isPreflight || isPublicCatalog
	if !isPublic {
		// Authenticate via Authorization Bearer header or token query parameter
		rawToken := ""
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			rawToken = strings.TrimPrefix(authHeader, "Bearer ")
		} else if qToken := c.Query("token"); qToken != "" {
			rawToken = qToken
		}

		if rawToken == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required to access private order artwork"})
			c.Abort()
			return
		}

		claims := &auth.OwnerClaims{}
		token, err := jwt.ParseWithClaims(rawToken, claims, func(t *jwt.Token) (interface{}, error) {
			return auth.GetJWTSecretKey(), nil
		}, jwt.WithValidMethods([]string{"HS256"}), jwt.WithExpirationRequired(), jwt.WithIssuer("som-sing-phim-erp"))

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired authorization token"})
			c.Abort()
			return
		}

		// Authorized staff roles for private artwork access
		allowedRoles := []string{
			auth.RoleAdmin, auth.RoleManager, auth.RoleSales,
			auth.RoleFinance, auth.RoleProduction, auth.RolePrepress,
		}
		if !auth.CheckRole(claims.Role, allowedRoles) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: insufficient permissions to access artwork"})
			c.Abort()
			return
		}
	}

	stat, err := os.Stat(canonicalTarget)
	if err != nil || stat.IsDir() {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	mimeType := DetectSafeMimeType(canonicalTarget)
	c.Header("Content-Type", mimeType)
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox")
	c.Header("Cache-Control", "private, no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")

	download := c.Query("download") == "true" || c.Query("disposition") == "attachment"
	filename := filepath.Base(canonicalTarget)
	if download {
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	} else {
		c.Header("Content-Disposition", fmt.Sprintf("inline; filename=%q", filename))
	}

	http.ServeFile(c.Writer, c.Request, canonicalTarget)
}

// analyzeOwnedArtwork has no simulation or guessed page fallback. Both sides
// must be real contained originals with verified pagination and equal ink work.
func analyzeOwnedArtwork(ctx context.Context, url string) (map[string]any, error) {
	var relative string
	if strings.HasPrefix(url, "/api/v1/orders/files/") {
		relative = strings.TrimPrefix(url, "/api/v1/orders/files/")
	} else if strings.HasPrefix(url, "/uploads/") {
		relative = strings.TrimPrefix(url, "/uploads/")
	} else {
		return nil, fmt.Errorf("private artwork URL required")
	}
	if strings.Contains(relative, "..") || strings.ContainsAny(relative, "\\\x00") {
		return nil, fmt.Errorf("invalid artwork path")
	}
	root, err := filepath.Abs(GetUploadStorageDir())
	if err != nil {
		return nil, err
	}
	path, _, err := ResolveContainedPath(root, filepath.Join(root, filepath.FromSlash(relative)), false)
	if err != nil {
		return nil, err
	}
	stat, err := os.Stat(path)
	if err != nil || !stat.Mode().IsRegular() || stat.Size() > MaxArtworkFileSize {
		return nil, fmt.Errorf("unavailable artwork")
	}
	mime := DetectSafeMimeType(path)
	if mime == "application/pdf" {
		timeout, cancel := context.WithTimeout(ctx, 20*time.Second)
		defer cancel()
		cmd := exec.CommandContext(timeout, "gs", "-dSAFER", "-dBATCH", "-dNOPAUSE", "-q", "-o", "-", "-sDEVICE=inkcov", path)
		output, err := cmd.StdoutPipe()
		if err != nil {
			return nil, err
		}
		cmd.Stderr = io.Discard
		if err = cmd.Start(); err != nil {
			return nil, err
		}
		raw, err := io.ReadAll(io.LimitReader(output, 2*1024*1024+1))
		if err != nil || len(raw) > 2*1024*1024 {
			cmd.Process.Kill()
			cmd.Wait()
			return nil, fmt.Errorf("artwork analysis limit")
		}
		if err = cmd.Wait(); err != nil {
			return nil, err
		}
		scanner := bufio.NewScanner(bytes.NewReader(raw))
		coverage := [][4]float64{}
		for scanner.Scan() {
			line := strings.Fields(scanner.Text())
			if len(line) != 6 || line[4] != "CMYK" || line[5] != "OK" {
				continue
			}
			values := [4]float64{}
			for i := 0; i < 4; i++ {
				number, e := strconv.ParseFloat(line[i], 64)
				if e != nil || math.IsNaN(number) || math.IsInf(number, 0) || number < 0 || number > 1 {
					return nil, fmt.Errorf("invalid coverage")
				}
				values[i] = math.Round(number*10000) / 100
			}
			coverage = append(coverage, values)
			if len(coverage) > 1000 {
				return nil, fmt.Errorf("page limit")
			}
		}
		if scanner.Err() != nil || len(coverage) == 0 {
			return nil, fmt.Errorf("unverified pagination")
		}
		return map[string]any{"pages": len(coverage), "coverage": coverage}, nil
	}
	if mime != "image/png" && mime != "image/jpeg" {
		return nil, fmt.Errorf("unsupported bounded artwork analysis")
	}
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	config, _, err := image.DecodeConfig(file)
	if err != nil || config.Width <= 0 || config.Height <= 0 || int64(config.Width)*int64(config.Height) > 16*1024*1024 {
		return nil, fmt.Errorf("image analysis limit")
	}
	if _, err = file.Seek(0, 0); err != nil {
		return nil, err
	}
	img, _, err := image.Decode(file)
	if err != nil {
		return nil, err
	}
	bounds := img.Bounds()
	coverage := [4]float64{}
	samples := float64(bounds.Dx() * bounds.Dy())
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		if err = ctx.Err(); err != nil {
			return nil, err
		}
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			r, g, b, a := img.At(x, y).RGBA()
			if a == 0 {
				continue
			}
			rf, gf, bf := float64(r)/65535, float64(g)/65535, float64(b)/65535
			k := 0.0
			rawK := 1 - math.Max(rf, math.Max(gf, bf))
			if rawK > 0.25 {
				k = (rawK - 0.25) / 0.75
			}
			denominator := 1 - k
			values := [4]float64{0, 0, 0, k}
			if denominator > 0.001 {
				values[0] = math.Max(0, math.Min(1, (1-rf-k)/denominator))
				values[1] = math.Max(0, math.Min(1, (1-gf-k)/denominator))
				values[2] = math.Max(0, math.Min(1, (1-bf-k)/denominator))
			} else {
				values[3] = 1
			}
			for i := 0; i < 4; i++ {
				coverage[i] += values[i] * 100
			}
		}
	}
	for i := 0; i < 4; i++ {
		coverage[i] = math.Round(coverage[i]/samples*100) / 100
	}
	return map[string]any{"pages": 1, "coverage": [][4]float64{coverage}, "width": bounds.Dx(), "height": bounds.Dy()}, nil
}
