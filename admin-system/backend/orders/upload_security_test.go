package orders

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"somsing.local/backend/auth"
	"somsing.local/backend/db"
)

// Helper to make signed test JWT tokens
func makeUploadTestToken(role string, expired bool, forged bool) string {
	claims := &auth.OwnerClaims{
		Username: "staff_tester",
		UserID:   "usr_upload_tester",
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer: "som-sing-phim-erp",
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(func() time.Duration {
				if expired {
					return -1 * time.Hour
				}
				return 1 * time.Hour
			}())),
			IssuedAt: jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := auth.GetJWTSecretKey()
	if forged {
		secret = []byte("forged-secret-key-that-should-fail-32chars")
	}
	signed, _ := token.SignedString(secret)
	return signed
}

// setupUploadSecurityRouter creates an isolated test router backed by a temporary directory
func setupUploadSecurityRouter(t *testing.T) (*gin.Engine, string) {
	t.Helper()
	tempStorage := t.TempDir()
	t.Setenv("UPLOAD_STORAGE_DIR", tempStorage)
	t.Setenv("ENVIRONMENT", "test")
	t.Setenv("JWT_SECRET", "som-sing-phim-super-secret-key-2026-test")

	gin.SetMode(gin.TestMode)
	r := gin.New()

	artworkAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RolePrepress, auth.RoleProduction)

	// Upload routes
	r.POST("/api/upload/artwork", artworkAuth, HandleArtworkUpload)
	r.POST("/api/v1/upload/artwork", artworkAuth, HandleArtworkUpload)
	r.POST("/api/upload/batch-artworks", artworkAuth, HandleBatchArtworkUpload)
	r.POST("/api/v1/upload/batch-artworks", artworkAuth, HandleBatchArtworkUpload)
	r.POST("/api/v1/orders/upload", artworkAuth, HandleUploadOrderFile)
	r.POST("/api/orders/upload", artworkAuth, HandleUploadOrderFile)

	// Protected file serving routes
	r.GET("/api/v1/orders/files/*filepath", HandleServeProtectedFile)
	r.GET("/uploads/*filepath", HandleServeProtectedFile)
	r.HEAD("/api/v1/orders/files/*filepath", HandleServeProtectedFile)
	r.HEAD("/uploads/*filepath", HandleServeProtectedFile)

	// Batch zip download
	r.POST("/api/v1/orders/batch-download-zip", artworkAuth, HandleBatchDownloadZip)

	return r, tempStorage
}

// createMultipartPayload builds a multipart form with file content
func createMultipartPayload(fieldName, fileName string, fileContent []byte, extraFields map[string]string) (*bytes.Buffer, string, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile(fieldName, fileName)
	if err != nil {
		return nil, "", err
	}
	if _, err := part.Write(fileContent); err != nil {
		return nil, "", err
	}

	for k, v := range extraFields {
		if err := writer.WriteField(k, v); err != nil {
			return nil, "", err
		}
	}

	if err := writer.Close(); err != nil {
		return nil, "", err
	}

	return body, writer.FormDataContentType(), nil
}

// ---------------------------------------------------------------------------
// Acceptance U1: Validation Before Writing, Traversal, Oversize, Magic Bytes
// ---------------------------------------------------------------------------

func TestUploadValidation_U1_RejectsUnsupportedExtensionBeforeWriting(t *testing.T) {
	router, tempDir := setupUploadSecurityRouter(t)
	token := makeUploadTestToken("sales", false, false)

	dangerousFiles := []struct {
		name    string
		content []byte
	}{
		{"malicious.exe", []byte("MZ\x90\x00\x03\x00\x00\x00executable")},
		{"exploit.sh", []byte("#!/bin/bash\nrm -rf /")},
		{"webshell.php", []byte("<?php system($_GET['cmd']); ?>")},
		{"page.html", []byte("<html><script>alert(1)</script></html>")},
		{"script.js", []byte("console.log('pwned')")},
		{"vector.svg", []byte("<svg><script>alert(1)</script></svg>")},
	}

	for _, tc := range dangerousFiles {
		t.Run(tc.name, func(t *testing.T) {
			body, cType, err := createMultipartPayload("file", tc.name, tc.content, nil)
			if err != nil {
				t.Fatalf("failed to create multipart body: %v", err)
			}

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/v1/upload/artwork", body)
			req.Header.Set("Content-Type", cType)
			req.Header.Set("Authorization", "Bearer "+token)
			router.ServeHTTP(w, req)

			if w.Code != http.StatusBadRequest {
				t.Errorf("expected 400 Bad Request for %q, got %d. Body: %s", tc.name, w.Code, w.Body.String())
			}

			// Verify nothing was written to storage
			entries, _ := os.ReadDir(filepath.Join(tempDir, "artworks"))
			if len(entries) > 0 {
				t.Errorf("file was written to disk despite rejection! Found: %v", entries)
			}
		})
	}
}

func TestUploadValidation_U1_RejectsMagicByteMismatchBeforeWriting(t *testing.T) {
	router, tempDir := setupUploadSecurityRouter(t)
	token := makeUploadTestToken("prepress", false, false)

	mismatchCases := []struct {
		filename string
		content  []byte
		desc     string
	}{
		{
			filename: "fake_document.pdf",
			content:  []byte("This is plain text pretending to be a PDF file."),
			desc:     "Plain text disguised as PDF",
		},
		{
			filename: "disguised_virus.pdf",
			content:  []byte("MZ\x90\x00\x03\x00\x00\x00DOS executable pretending to be PDF"),
			desc:     "Executable with .pdf extension",
		},
		{
			filename: "fake_photo.jpg",
			content:  []byte("Not a JPEG at all - missing FF D8 FF signature"),
			desc:     "Text disguised as JPEG",
		},
		{
			filename: "fake_graphic.png",
			content:  []byte("<?php echo 'malicious code'; ?>"),
			desc:     "PHP web script disguised as PNG",
		},
		{
			filename: "fake_cmyk.tiff",
			content:  []byte("GIF89a corrupted image header"),
			desc:     "Non-TIFF signature with .tiff extension",
		},
		{
			filename: "fake_vector.ai",
			content:  []byte("Plain text without %! or %PDF header"),
			desc:     "Invalid AI content",
		},
	}

	for _, tc := range mismatchCases {
		t.Run(tc.desc, func(t *testing.T) {
			body, cType, err := createMultipartPayload("file", tc.filename, tc.content, nil)
			if err != nil {
				t.Fatalf("failed to create multipart body: %v", err)
			}

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/v1/upload/artwork", body)
			req.Header.Set("Content-Type", cType)
			req.Header.Set("Authorization", "Bearer "+token)
			router.ServeHTTP(w, req)

			if w.Code != http.StatusBadRequest {
				t.Errorf("expected 400 Bad Request for %s, got %d. Body: %s", tc.desc, w.Code, w.Body.String())
			}

			// Ensure nothing was saved on disk
			entries, _ := os.ReadDir(filepath.Join(tempDir, "artworks"))
			if len(entries) > 0 {
				t.Errorf("file written to disk despite magic byte mismatch! Found: %v", entries)
			}
		})
	}
}

func TestUploadValidation_U1_RejectsDirectoryTraversalAttempts(t *testing.T) {
	router, tempDir := setupUploadSecurityRouter(t)
	token := makeUploadTestToken("admin", false, false)

	validPDF := []byte("%PDF-1.4\n%Valid minimal PDF content\n%%EOF")

	traversalTests := []struct {
		name        string
		endpoint    string
		orderNo     string
		itemID      string
		fileType    string
		filename    string
		expectedErr string
	}{
		{
			name:        "Traversal in order_no",
			endpoint:    "/api/v1/orders/upload",
			orderNo:     "../../etc",
			itemID:      "item1",
			fileType:    "inner",
			filename:    "brochure.pdf",
			expectedErr: "Invalid order_no parameter",
		},
		{
			name:        "Traversal in item_id",
			endpoint:    "/api/v1/orders/upload",
			orderNo:     "ORD-2026-001",
			itemID:      "../system",
			fileType:    "inner",
			filename:    "brochure.pdf",
			expectedErr: "Invalid item_id parameter",
		},
		{
			name:        "Traversal in filename",
			endpoint:    "/api/v1/upload/artwork",
			filename:    "../../../../evil.pdf",
			expectedErr: "", // Filename is sanitized to safe base name without traversal
		},
	}

	for _, tc := range traversalTests {
		t.Run(tc.name, func(t *testing.T) {
			extra := map[string]string{
				"order_no":  tc.orderNo,
				"item_id":   tc.itemID,
				"file_type": tc.fileType,
			}
			body, cType, err := createMultipartPayload("file", tc.filename, validPDF, extra)
			if err != nil {
				t.Fatalf("failed to create multipart body: %v", err)
			}

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", tc.endpoint, body)
			req.Header.Set("Content-Type", cType)
			req.Header.Set("Authorization", "Bearer "+token)
			router.ServeHTTP(w, req)

			if tc.expectedErr != "" {
				if w.Code != http.StatusBadRequest {
					t.Errorf("expected 400 Bad Request, got %d. Body: %s", w.Code, w.Body.String())
				}
				if !strings.Contains(w.Body.String(), tc.expectedErr) {
					t.Errorf("expected error %q in body, got: %s", tc.expectedErr, w.Body.String())
				}
			} else {
				// For artwork upload with traversal filename, it sanitizes to safe name inside tempDir/artworks
				if w.Code != http.StatusOK {
					t.Errorf("expected 200 OK after sanitizing filename, got %d. Body: %s", w.Code, w.Body.String())
				}
			}

			// Crucial check: verify NO directory or file was created outside tempDir
			parentDir := filepath.Dir(tempDir)
			entries, _ := os.ReadDir(parentDir)
			for _, e := range entries {
				if e.Name() == "etc" || e.Name() == "system" || e.Name() == "evil.pdf" {
					t.Fatalf("CRITICAL SECURITY FAILURE: file was written outside tempDir into %s", e.Name())
				}
			}
		})
	}
}

func TestUploadValidation_U1_ServerGeneratedAssetIDs(t *testing.T) {
	router, _ := setupUploadSecurityRouter(t)
	token := makeUploadTestToken("sales", false, false)

	validPDF := []byte("%PDF-1.4\n%Server asset ID test\n%%EOF")
	body, cType, err := createMultipartPayload("file", "original_client_filename.pdf", validPDF, nil)
	if err != nil {
		t.Fatalf("failed to create multipart body: %v", err)
	}

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/upload/artwork", body)
	req.Header.Set("Content-Type", cType)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d. Body: %s", w.Code, w.Body.String())
	}

	var resp struct {
		Status   string `json:"status"`
		AssetID  string `json:"asset_id"`
		FileName string `json:"file_name"`
		FileURL  string `json:"file_url"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse JSON response: %v", err)
	}

	if resp.AssetID == "" || !strings.HasPrefix(resp.AssetID, "art-") {
		t.Errorf("expected server-generated asset ID starting with 'art-', got: %q", resp.AssetID)
	}

	if !strings.Contains(resp.FileURL, resp.AssetID) {
		t.Errorf("file URL %q does not contain server-generated asset ID %q", resp.FileURL, resp.AssetID)
	}
}

// ---------------------------------------------------------------------------
// Acceptance U2: Authorization, Safe Headers, Old URL Compatibility
// ---------------------------------------------------------------------------

func TestProtectedFileServing_U2_AuthorizationBoundaries(t *testing.T) {
	router, tempDir := setupUploadSecurityRouter(t)

	// Plant a private artwork file in the isolated storage
	artworksDir := filepath.Join(tempDir, "artworks")
	_ = os.MkdirAll(artworksDir, 0755)
	testFile := "art-test123_print_job.pdf"
	pdfContent := []byte("%PDF-1.4\n%Private Artwork Confidential\n%%EOF")
	if err := os.WriteFile(filepath.Join(artworksDir, testFile), pdfContent, 0644); err != nil {
		t.Fatalf("failed to create test artwork file: %v", err)
	}

	routesToTest := []string{
		"/uploads/artworks/" + testFile,
		"/api/v1/orders/files/artworks/" + testFile,
	}

	for _, route := range routesToTest {
		t.Run("Anonymous Access "+route, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", route, nil)
			router.ServeHTTP(w, req)

			if w.Code != http.StatusUnauthorized {
				t.Errorf("expected 401 Unauthorized for anonymous caller on %s, got %d", route, w.Code)
			}
		})

		t.Run("Forged Token "+route, func(t *testing.T) {
			token := makeUploadTestToken("admin", false, true)
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", route, nil)
			req.Header.Set("Authorization", "Bearer "+token)
			router.ServeHTTP(w, req)

			if w.Code != http.StatusUnauthorized {
				t.Errorf("expected 401 Unauthorized for forged token on %s, got %d", route, w.Code)
			}
		})

		t.Run("Expired Token "+route, func(t *testing.T) {
			token := makeUploadTestToken("admin", true, false)
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", route, nil)
			req.Header.Set("Authorization", "Bearer "+token)
			router.ServeHTTP(w, req)

			if w.Code != http.StatusUnauthorized {
				t.Errorf("expected 401 Unauthorized for expired token on %s, got %d", route, w.Code)
			}
		})

		t.Run("Unauthorized Role (hr) "+route, func(t *testing.T) {
			token := makeUploadTestToken("hr", false, false)
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", route, nil)
			req.Header.Set("Authorization", "Bearer "+token)
			router.ServeHTTP(w, req)

			if w.Code != http.StatusForbidden {
				t.Errorf("expected 403 Forbidden for hr role on %s, got %d", route, w.Code)
			}
		})

		// Approved roles must all be able to retrieve the private file
		approvedRoles := []string{"admin", "manager", "sales", "prepress", "production", "finance", "owner", "super_admin"}
		for _, role := range approvedRoles {
			t.Run("Approved Role ("+role+") "+route, func(t *testing.T) {
				token := makeUploadTestToken(role, false, false)
				w := httptest.NewRecorder()
				req, _ := http.NewRequest("GET", route, nil)
				req.Header.Set("Authorization", "Bearer "+token)
				router.ServeHTTP(w, req)

				if w.Code != http.StatusOK {
					t.Errorf("expected 200 OK for role %q on %s, got %d. Body: %s", role, route, w.Code, w.Body.String())
				}
			})
		}

		t.Run("Query Token Support (?token=...) "+route, func(t *testing.T) {
			token := makeUploadTestToken("sales", false, false)
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", route+"?token="+token, nil)
			router.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("expected 200 OK via query token param on %s, got %d", route, w.Code)
			}
		})
	}
}

func TestProtectedFileServing_U2_SecurityHeadersAndMimeType(t *testing.T) {
	router, tempDir := setupUploadSecurityRouter(t)
	token := makeUploadTestToken("production", false, false)

	artworksDir := filepath.Join(tempDir, "artworks")
	_ = os.MkdirAll(artworksDir, 0755)

	files := []struct {
		filename    string
		content     []byte
		expectedMIME string
	}{
		{"sample.pdf", []byte("%PDF-1.4\n%Test PDF\n%%EOF"), "application/pdf"},
		{"photo.png", []byte("\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"), "image/png"},
		{"graphic.jpg", []byte("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00"), "image/jpeg"},
	}

	for _, tc := range files {
		_ = os.WriteFile(filepath.Join(artworksDir, tc.filename), tc.content, 0644)

		t.Run("Headers for "+tc.filename, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/uploads/artworks/"+tc.filename, nil)
			req.Header.Set("Authorization", "Bearer "+token)
			router.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Fatalf("expected 200 OK, got %d", w.Code)
			}

			// Verify X-Content-Type-Options: nosniff
			if nosniff := w.Header().Get("X-Content-Type-Options"); nosniff != "nosniff" {
				t.Errorf("expected nosniff header, got: %q", nosniff)
			}

			// Verify Content-Security-Policy
			if csp := w.Header().Get("Content-Security-Policy"); !strings.Contains(csp, "default-src 'none'") {
				t.Errorf("expected restrictive CSP header, got: %q", csp)
			}

			// Verify Content-Type
			if cType := w.Header().Get("Content-Type"); !strings.Contains(cType, tc.expectedMIME) {
				t.Errorf("expected Content-Type %q, got: %q", tc.expectedMIME, cType)
			}

			// Verify Cache-Control
			if cc := w.Header().Get("Cache-Control"); !strings.Contains(cc, "private") {
				t.Errorf("expected private Cache-Control header, got: %q", cc)
			}

			// Default disposition should be inline for preview
			if disp := w.Header().Get("Content-Disposition"); !strings.HasPrefix(disp, "inline") {
				t.Errorf("expected inline disposition, got: %q", disp)
			}
		})

		t.Run("Attachment Disposition when download requested "+tc.filename, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/uploads/artworks/"+tc.filename+"?download=true", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			router.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Fatalf("expected 200 OK, got %d", w.Code)
			}

			disp := w.Header().Get("Content-Disposition")
			if !strings.HasPrefix(disp, "attachment") {
				t.Errorf("expected attachment disposition when ?download=true, got: %q", disp)
			}
		})
	}
}

func TestProtectedFileServing_U2_PublicPreflightWorkspaceLimited(t *testing.T) {
	router, tempDir := setupUploadSecurityRouter(t)

	// Plant a preflight analysis file in tempDir/preflight/
	prefDir := filepath.Join(tempDir, "preflight")
	_ = os.MkdirAll(prefDir, 0755)
	prefFile := "pref_cmyk_report.pdf"
	_ = os.WriteFile(filepath.Join(prefDir, prefFile), []byte("%PDF-1.4\n%Preflight Public Report\n%%EOF"), 0644)

	// Plant a secret order file in tempDir/artworks/
	artDir := filepath.Join(tempDir, "artworks")
	_ = os.MkdirAll(artDir, 0755)
	artFile := "secret_customer_order.pdf"
	_ = os.WriteFile(filepath.Join(artDir, artFile), []byte("%PDF-1.4\n%Secret Artwork\n%%EOF"), 0644)

	t.Run("Public preflight analysis can be retrieved anonymously", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/uploads/preflight/"+prefFile, nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected 200 OK for public preflight file, got %d", w.Code)
		}
	})

	t.Run("Public preflight route via /api/v1/orders/files/preflight/", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/orders/files/preflight/"+prefFile, nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected 200 OK for public preflight file, got %d", w.Code)
		}
	})

	t.Run("Anonymous attempt to access secret artwork is rejected", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/uploads/artworks/"+artFile, nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("expected 401 Unauthorized for private artwork, got %d", w.Code)
		}
	})

	t.Run("Traversal attempt from preflight to artworks is rejected without auth", func(t *testing.T) {
		// Attempt: /uploads/preflight/../artworks/secret_customer_order.pdf
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/uploads/preflight/../artworks/"+artFile, nil)
		router.ServeHTTP(w, req)

		// Must be rejected as unauthorized or bad request — NEVER 200 OK leaking the file
		if w.Code == http.StatusOK {
			t.Fatalf("CRITICAL SECURITY LEAK: anonymous traversal from preflight leaked secret artwork!")
		}
		if w.Code != http.StatusUnauthorized && w.Code != http.StatusBadRequest {
			t.Errorf("expected 401 or 400, got %d", w.Code)
		}
	})
}

// ---------------------------------------------------------------------------
// Acceptance U3: Valid Single, Split, Batch Flows on Isolated Fixture
// ---------------------------------------------------------------------------

func TestSingleSplitBatchUploadPreviewDownload_U3_IsolatedFixture(t *testing.T) {
	router, tempDir := setupUploadSecurityRouter(t)
	token := makeUploadTestToken("sales", false, false)

	// 1. Single Artwork Upload
	var singleFileURL string
	t.Run("Single Artwork Upload & Download", func(t *testing.T) {
		validPDF := []byte("%PDF-1.4\n%Single Brochure CMYK Artwork\n%%EOF")
		body, cType, err := createMultipartPayload("file", "brochure_cover.pdf", validPDF, nil)
		if err != nil {
			t.Fatalf("failed to create multipart: %v", err)
		}

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/upload/artwork", body)
		req.Header.Set("Content-Type", cType)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("upload failed: %d, body: %s", w.Code, w.Body.String())
		}

		var resp struct {
			FileURL string `json:"file_url"`
			AssetID string `json:"asset_id"`
		}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		singleFileURL = resp.FileURL

		if singleFileURL == "" || !strings.HasPrefix(resp.AssetID, "art-") {
			t.Fatalf("invalid upload response: %+v", resp)
		}

		// Now download / preview with authentication
		wDL := httptest.NewRecorder()
		reqDL, _ := http.NewRequest("GET", singleFileURL, nil)
		reqDL.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(wDL, reqDL)

		if wDL.Code != http.StatusOK {
			t.Fatalf("download failed: %d, body: %s", wDL.Code, wDL.Body.String())
		}
		if !bytes.Equal(wDL.Body.Bytes(), validPDF) {
			t.Errorf("downloaded content does not match uploaded content")
		}
	})

	// 2. Split Order Files Upload (Cover & Inner)
	var coverURL, innerURL string
	t.Run("Split Order Files (Cover & Inner)", func(t *testing.T) {
		splitOrderID := "ORD-SPLIT-001"
		storeMutex.Lock()
		ordersStore[splitOrderID] = Order{
			ID:          splitOrderID,
			OrderNo:     splitOrderID,
			OrderNumber: splitOrderID,
			Items: []OrderItem{
				{
					ID:       "item1",
					OrderID:  splitOrderID,
					ItemName: "Booklet Item 1",
				},
			},
		}
		storeMutex.Unlock()
		t.Cleanup(func() {
			storeMutex.Lock()
			delete(ordersStore, splitOrderID)
			storeMutex.Unlock()
		})

		coverPDF := []byte("%PDF-1.4\n%Split Book Cover\n%%EOF")
		innerPDF := []byte("%PDF-1.4\n%Split Book Inner Pages\n%%EOF")

		// Upload Cover
		bodyCover, cTypeCover, _ := createMultipartPayload("file", "book_cover.pdf", coverPDF, map[string]string{
			"order_no":  splitOrderID,
			"item_id":   "item1",
			"file_type": "cover",
		})
		wCover := httptest.NewRecorder()
		reqCover, _ := http.NewRequest("POST", "/api/v1/orders/upload", bodyCover)
		reqCover.Header.Set("Content-Type", cTypeCover)
		reqCover.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(wCover, reqCover)

		if wCover.Code != http.StatusOK {
			t.Fatalf("cover upload failed: %d, body: %s", wCover.Code, wCover.Body.String())
		}
		var coverResp struct {
			FileURL string `json:"file_url"`
		}
		_ = json.Unmarshal(wCover.Body.Bytes(), &coverResp)
		coverURL = coverResp.FileURL

		// Upload Inner
		bodyInner, cTypeInner, _ := createMultipartPayload("file", "book_inner.pdf", innerPDF, map[string]string{
			"order_no":  "ORD-SPLIT-001",
			"item_id":   "item1",
			"file_type": "inner",
		})
		wInner := httptest.NewRecorder()
		reqInner, _ := http.NewRequest("POST", "/api/v1/orders/upload", bodyInner)
		reqInner.Header.Set("Content-Type", cTypeInner)
		reqInner.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(wInner, reqInner)

		if wInner.Code != http.StatusOK {
			t.Fatalf("inner upload failed: %d, body: %s", wInner.Code, wInner.Body.String())
		}
		var innerResp struct {
			FileURL string `json:"file_url"`
		}
		_ = json.Unmarshal(wInner.Body.Bytes(), &innerResp)
		innerURL = innerResp.FileURL

		// Verify both files can be retrieved via authorized download
		for _, u := range []string{coverURL, innerURL} {
			wDL := httptest.NewRecorder()
			reqDL, _ := http.NewRequest("GET", u, nil)
			reqDL.Header.Set("Authorization", "Bearer "+token)
			router.ServeHTTP(wDL, reqDL)

			if wDL.Code != http.StatusOK {
				t.Errorf("failed to retrieve split file %s: %d", u, wDL.Code)
			}
		}
	})

	// 3. Batch Artwork Upload (Multiple photos/images)
	var batchURLs []string
	t.Run("Batch Artwork Upload & Zip Archive Download", func(t *testing.T) {
		validPNG := []byte("\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01")
		validJPG := []byte("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00")

		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)

		p1, _ := writer.CreateFormFile("files", "photo_01.png")
		_, _ = p1.Write(validPNG)
		p2, _ := writer.CreateFormFile("files", "photo_02.jpg")
		_, _ = p2.Write(validJPG)
		_ = writer.Close()

		wBatch := httptest.NewRecorder()
		reqBatch, _ := http.NewRequest("POST", "/api/v1/upload/batch-artworks", body)
		reqBatch.Header.Set("Content-Type", writer.FormDataContentType())
		reqBatch.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(wBatch, reqBatch)

		if wBatch.Code != http.StatusOK {
			t.Fatalf("batch upload failed: %d, body: %s", wBatch.Code, wBatch.Body.String())
		}

		var batchResp struct {
			Status     string `json:"status"`
			TotalCount int    `json:"total_count"`
			Files      []struct {
				AssetID  string `json:"asset_id"`
				FileName string `json:"file_name"`
				FileURL  string `json:"file_url"`
			} `json:"files"`
		}
		_ = json.Unmarshal(wBatch.Body.Bytes(), &batchResp)

		if batchResp.TotalCount != 2 {
			t.Fatalf("expected 2 files in batch, got %d", batchResp.TotalCount)
		}

		for _, f := range batchResp.Files {
			batchURLs = append(batchURLs, f.FileURL)
		}

		// 4. Batch ZIP Download of uploaded files
		zipReqBody, _ := json.Marshal(map[string]any{
			"zip_name":  "test_batch_package.zip",
			"file_urls": batchURLs,
		})
		wZip := httptest.NewRecorder()
		reqZip, _ := http.NewRequest("POST", "/api/v1/orders/batch-download-zip", bytes.NewBuffer(zipReqBody))
		reqZip.Header.Set("Content-Type", "application/json")
		reqZip.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(wZip, reqZip)

		if wZip.Code != http.StatusOK {
			t.Fatalf("batch zip download failed: %d, body: %s", wZip.Code, wZip.Body.String())
		}

		if wZip.Header().Get("Content-Type") != "application/zip" {
			t.Errorf("expected application/zip Content-Type, got: %s", wZip.Header().Get("Content-Type"))
		}

		// Inspect ZIP archive contents
		zipReader, err := zip.NewReader(bytes.NewReader(wZip.Body.Bytes()), int64(wZip.Body.Len()))
		if err != nil {
			t.Fatalf("failed to read response as ZIP archive: %v", err)
		}

		if len(zipReader.File) != 2 {
			t.Errorf("expected 2 files in zip archive, got %d", len(zipReader.File))
		}
	})

	// Verify all created files reside ONLY inside tempDir
	t.Run("Verification of tempDir isolation", func(t *testing.T) {
		entries, err := os.ReadDir(tempDir)
		if err != nil {
			t.Fatalf("failed to read tempDir: %v", err)
		}
		if len(entries) == 0 {
			t.Errorf("expected test files inside tempDir, found none")
		}
	})
}

// TestSymlinkAndContainedResolution_Security verifies R2:
// - File and directory symlinks resolving outside storage root are rejected for direct GET, HEAD, ZIP, and upload write.
// - A symlink in public preflight/ pointing to private artwork is classified by its actual target (artworks/)
//   and requires authentication, preventing anonymous exposure.
func TestSymlinkAndContainedResolution_Security(t *testing.T) {
	router, tempStorage := setupUploadSecurityRouter(t)
	token := makeUploadTestToken(auth.RoleAdmin, false, false)

	// Setup directories
	artworksDir := filepath.Join(tempStorage, "artworks")
	preflightDir := filepath.Join(tempStorage, "preflight")
	_ = os.MkdirAll(artworksDir, 0755)
	_ = os.MkdirAll(preflightDir, 0755)

	// Valid sample PDF content
	validPDFContent := []byte("%PDF-1.4 sample secure test pdf content")

	// 1. Outside directory and file creation (disposable temp fixtures outside storage root)
	outsideDir := t.TempDir()
	outsideFile := filepath.Join(outsideDir, "secret_outside.pdf")
	if err := os.WriteFile(outsideFile, validPDFContent, 0644); err != nil {
		t.Fatalf("failed to write outside file: %v", err)
	}

	// 2. File Symlink outside root
	symlinkFile := filepath.Join(artworksDir, "symlink_outside.pdf")
	if err := os.Symlink(outsideFile, symlinkFile); err != nil {
		t.Fatalf("failed to create file symlink: %v", err)
	}

	t.Run("GET file symlink pointing outside root must be rejected", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/orders/files/artworks/symlink_outside.pdf", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code == http.StatusOK {
			t.Fatalf("expected non-200 for symlink escaping root, got: %d", w.Code)
		}
	})

	t.Run("HEAD file symlink pointing outside root must be rejected", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("HEAD", "/api/v1/orders/files/artworks/symlink_outside.pdf", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code == http.StatusOK {
			t.Fatalf("expected non-200 for HEAD symlink escaping root, got: %d", w.Code)
		}
	})

	// 3. Directory Symlink outside root
	symlinkDir := filepath.Join(artworksDir, "symlink_dir")
	if err := os.Symlink(outsideDir, symlinkDir); err != nil {
		t.Fatalf("failed to create directory symlink: %v", err)
	}

	t.Run("GET through directory symlink outside root must be rejected", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/orders/files/artworks/symlink_dir/secret_outside.pdf", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code == http.StatusOK {
			t.Fatalf("expected non-200 for directory symlink escaping root, got: %d", w.Code)
		}
	})

	t.Run("HEAD through directory symlink outside root must be rejected", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("HEAD", "/api/v1/orders/files/artworks/symlink_dir/secret_outside.pdf", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code == http.StatusOK {
			t.Fatalf("expected non-200 for HEAD directory symlink escaping root, got: %d", w.Code)
		}
	})

	t.Run("ZIP download must not include symlinks pointing outside root", func(t *testing.T) {
		zipReqBody, _ := json.Marshal(map[string]any{
			"zip_name": "symlink_test.zip",
			"file_urls": []string{
				"/api/v1/orders/files/artworks/symlink_outside.pdf",
				"/api/v1/orders/files/artworks/symlink_dir/secret_outside.pdf",
			},
		})
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/batch-download-zip", bytes.NewBuffer(zipReqBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code == http.StatusOK {
			zipReader, err := zip.NewReader(bytes.NewReader(w.Body.Bytes()), int64(w.Body.Len()))
			if err == nil && len(zipReader.File) > 0 {
				t.Fatalf("security violation: ZIP archive contained %d escaped symlink files", len(zipReader.File))
			}
		}
	})

	// 4. Preflight alias to private artwork
	privateArtworkFile := filepath.Join(artworksDir, "confidential_customer_order.pdf")
	if err := os.WriteFile(privateArtworkFile, validPDFContent, 0644); err != nil {
		t.Fatalf("failed to write private artwork: %v", err)
	}

	preflightAlias := filepath.Join(preflightDir, "preview_alias.pdf")
	if err := os.Symlink(privateArtworkFile, preflightAlias); err != nil {
		t.Fatalf("failed to create preflight alias to private artwork: %v", err)
	}

	t.Run("Anonymous GET to preflight alias pointing to private artwork must be rejected (401)", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/uploads/preflight/preview_alias.pdf", nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 Unauthorized for preflight alias to private artwork, got: %d (body: %s)", w.Code, w.Body.String())
		}
	})

	t.Run("Anonymous HEAD to preflight alias pointing to private artwork must be rejected (401)", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("HEAD", "/uploads/preflight/preview_alias.pdf", nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 Unauthorized for HEAD preflight alias to private artwork, got: %d", w.Code)
		}
	})

	t.Run("Authorized GET to preflight alias pointing to private artwork succeeds (200)", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/uploads/preflight/preview_alias.pdf", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for authorized staff on preflight alias to private artwork, got: %d", w.Code)
		}
	})

	// 5. Genuine preflight file serves anonymously
	genuinePreflight := filepath.Join(preflightDir, "genuine_public_preflight.pdf")
	if err := os.WriteFile(genuinePreflight, validPDFContent, 0644); err != nil {
		t.Fatalf("failed to write genuine preflight file: %v", err)
	}

	t.Run("Anonymous GET to genuine preflight file succeeds (200)", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/uploads/preflight/genuine_public_preflight.pdf", nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for genuine public preflight file, got: %d", w.Code)
		}
	})
}

// TestOrderUploadValidationAndDraftPreservation verifies R3:
// - Nonexistent order is rejected (404)
// TestOrderUploadValidationAndDraftPreservation covers R3 upload order/item validation:
// - Concrete orders require item binding (zero-item orders rejected with 400 and zero writes)
// - Matching requires stable item ID (ItemName matching rejected with 400)
// - Foreign item on concrete order is rejected (400)
// - Valid item on concrete order succeeds (200)
// - Persisted orders with draft/QT prefixes enforce strict item validation (not bypassed)
// - Unpersisted draft-*/QT-* prefixes return 404 Not Found (no broad unverified bypass)
// - Explicit pre-order staging contract (temp_order) succeeds (200)
// - Isolated DB-backed existing order lookup coverage validates schema columns and item binding
func TestOrderUploadValidationAndDraftPreservation(t *testing.T) {
	router, _ := setupUploadSecurityRouter(t)
	token := makeUploadTestToken(auth.RoleAdmin, false, false)
	validPDF := []byte("%PDF-1.4 test document content for order upload")

	// Set up an isolated in-memory order fixture
	storeMutex.Lock()
	testOrderID := "ORD-2026-TEST01"
	ordersStore[testOrderID] = Order{
		ID:          testOrderID,
		OrderNo:     testOrderID,
		OrderNumber: testOrderID,
		Items: []OrderItem{
			{
				ID:       "item-valid-101",
				OrderID:  testOrderID,
				ItemName: "Booklet A5",
			},
		},
	}
	storeMutex.Unlock()

	t.Cleanup(func() {
		storeMutex.Lock()
		delete(ordersStore, testOrderID)
		storeMutex.Unlock()
	})

	t.Run("Upload to nonexistent order returns 404 Not Found", func(t *testing.T) {
		body, contentType, err := createMultipartPayload("file", "artwork.pdf", validPDF, map[string]string{
			"order_no":  "ORD-999999-NONEXISTENT",
			"item_id":   "item-1",
			"file_type": "cover",
		})
		if err != nil {
			t.Fatalf("failed to create multipart: %v", err)
		}

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/upload", body)
		req.Header.Set("Content-Type", contentType)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for nonexistent order, got %d (body: %s)", w.Code, w.Body.String())
		}
	})

	t.Run("Zero-item concrete order returns 400 Bad Request with zero file writes", func(t *testing.T) {
		zeroOrderID := "ORD-ZERO-ITEMS-001"
		storeMutex.Lock()
		ordersStore[zeroOrderID] = Order{
			ID:          zeroOrderID,
			OrderNo:     zeroOrderID,
			OrderNumber: zeroOrderID,
			Items:       []OrderItem{}, // 0 items
		}
		storeMutex.Unlock()
		defer func() {
			storeMutex.Lock()
			delete(ordersStore, zeroOrderID)
			storeMutex.Unlock()
		}()

		body, contentType, err := createMultipartPayload("file", "artwork.pdf", validPDF, map[string]string{
			"order_no":  zeroOrderID,
			"item_id":   "any-item-id-1",
			"file_type": "cover",
		})
		if err != nil {
			t.Fatalf("failed to create multipart: %v", err)
		}

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/upload", body)
		req.Header.Set("Content-Type", contentType)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request for zero-item order, got %d (body: %s)", w.Code, w.Body.String())
		}

		// Verify NO directory or file writes occurred in storage root
		orderDir := filepath.Join(GetUploadStorageDir(), "orders", zeroOrderID)
		if _, err := os.Stat(orderDir); !os.IsNotExist(err) {
			t.Fatalf("expected order directory %s to NOT exist, but it was created", orderDir)
		}
	})

	t.Run("Stable item ID required: matching on ItemName returns 400 Bad Request", func(t *testing.T) {
		// testOrderID has item with ID: "item-valid-101", ItemName: "Booklet A5"
		// Passing "Booklet A5" as item_id must be rejected
		body, contentType, err := createMultipartPayload("file", "artwork.pdf", validPDF, map[string]string{
			"order_no":  testOrderID,
			"item_id":   "Booklet A5", // ItemName, not ID
			"file_type": "cover",
		})
		if err != nil {
			t.Fatalf("failed to create multipart: %v", err)
		}

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/upload", body)
		req.Header.Set("Content-Type", contentType)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request when matching by ItemName, got %d", w.Code)
		}
	})

	t.Run("Upload foreign item to existing order returns 400 Bad Request", func(t *testing.T) {
		body, contentType, err := createMultipartPayload("file", "artwork.pdf", validPDF, map[string]string{
			"order_no":  testOrderID,
			"item_id":   "foreign-item-id-999",
			"file_type": "cover",
		})
		if err != nil {
			t.Fatalf("failed to create multipart: %v", err)
		}

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/upload", body)
		req.Header.Set("Content-Type", contentType)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for foreign item on order, got %d (body: %s)", w.Code, w.Body.String())
		}
	})

	t.Run("Upload valid item to existing order succeeds with 200 OK", func(t *testing.T) {
		body, contentType, err := createMultipartPayload("file", "artwork.pdf", validPDF, map[string]string{
			"order_no":  testOrderID,
			"item_id":   "item-valid-101",
			"file_type": "cover",
		})
		if err != nil {
			t.Fatalf("failed to create multipart: %v", err)
		}

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/upload", body)
		req.Header.Set("Content-Type", contentType)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 for valid item on order, got %d (body: %s)", w.Code, w.Body.String())
		}
	})

	t.Run("Persisted draft-prefix order enforces item validation (foreign rejected, valid accepted)", func(t *testing.T) {
		draftOrderID := "draft-session-order-001"
		storeMutex.Lock()
		ordersStore[draftOrderID] = Order{
			ID:          draftOrderID,
			OrderNo:     draftOrderID,
			OrderNumber: draftOrderID,
			Items: []OrderItem{
				{ID: "draft-item-valid-1", OrderID: draftOrderID},
			},
		}
		storeMutex.Unlock()
		defer func() {
			storeMutex.Lock()
			delete(ordersStore, draftOrderID)
			storeMutex.Unlock()
		}()

		// Foreign item -> 400
		bodyForeign, ctForeign, _ := createMultipartPayload("file", "artwork.pdf", validPDF, map[string]string{
			"order_no":  draftOrderID,
			"item_id":   "foreign-item-999",
			"file_type": "cover",
		})
		wF := httptest.NewRecorder()
		reqF, _ := http.NewRequest("POST", "/api/v1/orders/upload", bodyForeign)
		reqF.Header.Set("Content-Type", ctForeign)
		reqF.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(wF, reqF)
		if wF.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for foreign item on persisted draft order, got %d", wF.Code)
		}

		// Valid item -> 200
		bodyValid, ctValid, _ := createMultipartPayload("file", "artwork.pdf", validPDF, map[string]string{
			"order_no":  draftOrderID,
			"item_id":   "draft-item-valid-1",
			"file_type": "cover",
		})
		wV := httptest.NewRecorder()
		reqV, _ := http.NewRequest("POST", "/api/v1/orders/upload", bodyValid)
		reqV.Header.Set("Content-Type", ctValid)
		reqV.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(wV, reqV)
		if wV.Code != http.StatusOK {
			t.Fatalf("expected 200 for valid item on persisted draft order, got %d", wV.Code)
		}
	})

	t.Run("Persisted QT-prefix quotation enforces item validation (foreign rejected, valid accepted)", func(t *testing.T) {
		qtOrderID := "QT-2026-PERSISTED-001"
		storeMutex.Lock()
		ordersStore[qtOrderID] = Order{
			ID:          qtOrderID,
			OrderNo:     qtOrderID,
			OrderNumber: qtOrderID,
			Items: []OrderItem{
				{ID: "qt-item-valid-1", OrderID: qtOrderID},
			},
		}
		storeMutex.Unlock()
		defer func() {
			storeMutex.Lock()
			delete(ordersStore, qtOrderID)
			storeMutex.Unlock()
		}()

		// Foreign item -> 400
		bodyForeign, ctForeign, _ := createMultipartPayload("file", "artwork.pdf", validPDF, map[string]string{
			"order_no":  qtOrderID,
			"item_id":   "foreign-item-999",
			"file_type": "cover",
		})
		wF := httptest.NewRecorder()
		reqF, _ := http.NewRequest("POST", "/api/v1/orders/upload", bodyForeign)
		reqF.Header.Set("Content-Type", ctForeign)
		reqF.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(wF, reqF)
		if wF.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for foreign item on persisted QT quotation, got %d", wF.Code)
		}

		// Valid item -> 200
		bodyValid, ctValid, _ := createMultipartPayload("file", "artwork.pdf", validPDF, map[string]string{
			"order_no":  qtOrderID,
			"item_id":   "qt-item-valid-1",
			"file_type": "cover",
		})
		wV := httptest.NewRecorder()
		reqV, _ := http.NewRequest("POST", "/api/v1/orders/upload", bodyValid)
		reqV.Header.Set("Content-Type", ctValid)
		reqV.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(wV, reqV)
		if wV.Code != http.StatusOK {
			t.Fatalf("expected 200 for valid item on persisted QT quotation, got %d", wV.Code)
		}
	})

	t.Run("Unpersisted draft-* or QT-* returns 404 (no broad prefix exemption)", func(t *testing.T) {
		for _, unpersistedNo := range []string{"draft-unknown-session-123", "QT-9999-NONEXISTENT"} {
			body, contentType, _ := createMultipartPayload("file", "artwork.pdf", validPDF, map[string]string{
				"order_no":  unpersistedNo,
				"item_id":   "item-1",
				"file_type": "cover",
			})
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/v1/orders/upload", body)
			req.Header.Set("Content-Type", contentType)
			req.Header.Set("Authorization", "Bearer "+token)
			router.ServeHTTP(w, req)
			if w.Code != http.StatusNotFound {
				t.Fatalf("expected 404 for unpersisted %s, got %d", unpersistedNo, w.Code)
			}
		}
	})

	t.Run("Pre-order draft workflow with temp_order succeeds under explicit staging contract (200)", func(t *testing.T) {
		body, contentType, err := createMultipartPayload("file", "artwork.pdf", validPDF, map[string]string{
			"order_no":  "temp_order",
			"item_id":   "temp-item-1",
			"file_type": "inner",
		})
		if err != nil {
			t.Fatalf("failed to create multipart: %v", err)
		}

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/upload", body)
		req.Header.Set("Content-Type", contentType)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 for temp_order pre-order draft, got %d", w.Code)
		}
	})

	t.Run("Isolated DB-backed existing order lookup validates schema columns and item binding", func(t *testing.T) {
		mockDB, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("failed to create sqlmock: %v", err)
		}
		defer mockDB.Close()

		origDB := db.DB
		db.DB = mockDB
		defer func() { db.DB = origDB }()

		dbOrderNo := "ORD-DB-SCHEMA-001"
		dbOrderID := "ord-uuid-001"
		validDBItemID := "item-uuid-101"

		// 1. Foreign item lookup: findOrder queries orders using order_number (schema.sql column) and order_items
		mock.ExpectQuery(`SELECT id::text, order_number FROM orders WHERE id::text = \$1 OR order_number = \$1 LIMIT 1`).
			WithArgs(dbOrderNo).
			WillReturnRows(sqlmock.NewRows([]string{"id", "order_number"}).AddRow(dbOrderID, dbOrderNo))

		mock.ExpectQuery(`SELECT id::text FROM order_items WHERE order_id::text = \$1`).
			WithArgs(dbOrderID).
			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(validDBItemID))

		bodyForeign, ctForeign, _ := createMultipartPayload("file", "artwork.pdf", validPDF, map[string]string{
			"order_no":  dbOrderNo,
			"item_id":   "foreign-item-999",
			"file_type": "cover",
		})
		wF := httptest.NewRecorder()
		reqF, _ := http.NewRequest("POST", "/api/v1/orders/upload", bodyForeign)
		reqF.Header.Set("Content-Type", ctForeign)
		reqF.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(wF, reqF)

		if wF.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request for foreign item on DB-backed order, got %d (body: %s)", wF.Code, wF.Body.String())
		}

		// 2. Valid item lookup: findOrder queries DB and accepts matching item ID
		mock.ExpectQuery(`SELECT id::text, order_number FROM orders WHERE id::text = \$1 OR order_number = \$1 LIMIT 1`).
			WithArgs(dbOrderNo).
			WillReturnRows(sqlmock.NewRows([]string{"id", "order_number"}).AddRow(dbOrderID, dbOrderNo))

		mock.ExpectQuery(`SELECT id::text FROM order_items WHERE order_id::text = \$1`).
			WithArgs(dbOrderID).
			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(validDBItemID))

		bodyValid, ctValid, _ := createMultipartPayload("file", "artwork.pdf", validPDF, map[string]string{
			"order_no":  dbOrderNo,
			"item_id":   validDBItemID,
			"file_type": "cover",
		})
		wV := httptest.NewRecorder()
		reqV, _ := http.NewRequest("POST", "/api/v1/orders/upload", bodyValid)
		reqV.Header.Set("Content-Type", ctValid)
		reqV.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(wV, reqV)

		if wV.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for valid item on DB-backed order, got %d (body: %s)", wV.Code, wV.Body.String())
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unfulfilled sqlmock expectations: %v", err)
		}
	})
}

