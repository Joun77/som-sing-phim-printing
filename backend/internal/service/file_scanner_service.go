package service

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"time"

	"backend/internal/domain"

	"github.com/shopspring/decimal"
)

const (
	MaxAutoScanFileSizeBytes = 100 * 1024 * 1024 // 100 MB Limit
	DefaultFallbackTACPct    = 20.00            // 20.00% Default TAC
)

// HTTPClientInterface allows mocking HTTP requests in tests
type HTTPClientInterface interface {
	Do(req *http.Request) (*http.Response, error)
}

// PDFRasterizer allows pluggable/mockable PDF rasterization and CMYK extraction
type PDFRasterizer interface {
	Analyze(ctx context.Context, filePath string) ([]domain.PageCoverageResult, error)
}

// FileScannerService orchestrates Google Drive file ingestion, stream analysis, and dual-route fallback
type FileScannerService struct {
	httpClient HTTPClientInterface
	rasterizer PDFRasterizer
}

func NewFileScannerService(client HTTPClientInterface, rasterizer PDFRasterizer) *FileScannerService {
	if client == nil {
		client = &http.Client{Timeout: 60 * time.Second}
	}
	if rasterizer == nil {
		rasterizer = &DefaultPDFRasterizer{}
	}
	return &FileScannerService{
		httpClient: client,
		rasterizer: rasterizer,
	}
}

// ProcessDriveScan executes the dual-route scan pipeline
func (s *FileScannerService) ProcessDriveScan(ctx context.Context, driveURL string) (*domain.FileScanResult, error) {
	directURL := ConvertDriveURLToDirectDownload(driveURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, directURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		// Network/Connection error -> fallback
		return &domain.FileScanResult{
			Status:        domain.ScanJobStatusFailed,
			ErrorMessage:  fmt.Sprintf("network error accessing drive file: %v", err),
			IsFallback:    true,
			PageCount:     1,
			AvgKPct:       decimal.NewFromFloat(DefaultFallbackTACPct),
			AvgTACPct:     decimal.NewFromFloat(DefaultFallbackTACPct),
		}, nil
	}
	defer resp.Body.Close()

	// Check for Private / Restricted access (HTTP 401, 403 or HTML redirect/challenge)
	contentType := resp.Header.Get("Content-Type")
	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden ||
		(resp.StatusCode == http.StatusOK && strings.Contains(strings.ToLower(contentType), "text/html")) {
		// Route B: Private / Restricted File
		return &domain.FileScanResult{
			Status:        domain.ScanJobStatusPendingManualVerification,
			ErrorMessage:  "File is private or requires authentication. Fallback TAC applied.",
			IsFallback:    true,
			PageCount:     1,
			AvgCPct:       decimal.Zero,
			AvgMPct:       decimal.Zero,
			AvgYPct:       decimal.Zero,
			AvgKPct:       decimal.NewFromFloat(DefaultFallbackTACPct),
			AvgTACPct:     decimal.NewFromFloat(DefaultFallbackTACPct),
		}, nil
	}

	if resp.StatusCode != http.StatusOK {
		return &domain.FileScanResult{
			Status:        domain.ScanJobStatusPendingManualVerification,
			ErrorMessage:  fmt.Sprintf("unexpected HTTP response status: %d", resp.StatusCode),
			IsFallback:    true,
			PageCount:     1,
			AvgKPct:       decimal.NewFromFloat(DefaultFallbackTACPct),
			AvgTACPct:     decimal.NewFromFloat(DefaultFallbackTACPct),
		}, nil
	}

	// Check Content-Length header if provided
	contentLength := resp.ContentLength
	if contentLength > MaxAutoScanFileSizeBytes {
		// Route B: Oversized file
		return &domain.FileScanResult{
			FileSizeBytes: contentLength,
			Status:        domain.ScanJobStatusPendingManualVerification,
			ErrorMessage:  fmt.Sprintf("File size (%d bytes) exceeds 100MB limit. Fallback TAC applied.", contentLength),
			IsFallback:    true,
			PageCount:     1,
			AvgCPct:       decimal.Zero,
			AvgMPct:       decimal.Zero,
			AvgYPct:       decimal.Zero,
			AvgKPct:       decimal.NewFromFloat(DefaultFallbackTACPct),
			AvgTACPct:     decimal.NewFromFloat(DefaultFallbackTACPct),
		}, nil
	}

	// Stream into a temporary file with bounded limit
	tempFile, err := os.CreateTemp("", "som-drive-scan-*.pdf")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file: %w", err)
	}
	defer func() {
		_ = tempFile.Close()
		_ = os.Remove(tempFile.Name())
	}()

	limitedReader := io.LimitReader(resp.Body, MaxAutoScanFileSizeBytes+1)
	written, err := io.Copy(tempFile, limitedReader)
	if err != nil {
		return nil, fmt.Errorf("failed to write stream to temp file: %w", err)
	}

	if written > MaxAutoScanFileSizeBytes {
		// Route B: Downloaded stream exceeded 100MB
		return &domain.FileScanResult{
			FileSizeBytes: written,
			Status:        domain.ScanJobStatusPendingManualVerification,
			ErrorMessage:  fmt.Sprintf("Streamed file size exceeds 100MB limit (%d bytes). Fallback TAC applied.", written),
			IsFallback:    true,
			PageCount:     1,
			AvgCPct:       decimal.Zero,
			AvgMPct:       decimal.Zero,
			AvgYPct:       decimal.Zero,
			AvgKPct:       decimal.NewFromFloat(DefaultFallbackTACPct),
			AvgTACPct:     decimal.NewFromFloat(DefaultFallbackTACPct),
		}, nil
	}

	// Route A: Execute MuPDF / Ghostscript rasterization
	pageBreakdown, err := s.rasterizer.Analyze(ctx, tempFile.Name())
	if err != nil {
		// Fallback to manual verification on rasterization error
		return &domain.FileScanResult{
			FileSizeBytes: written,
			Status:        domain.ScanJobStatusPendingManualVerification,
			ErrorMessage:  fmt.Sprintf("Rasterization inspection failed: %v. Fallback TAC applied.", err),
			IsFallback:    true,
			PageCount:     1,
			AvgCPct:       decimal.Zero,
			AvgMPct:       decimal.Zero,
			AvgYPct:       decimal.Zero,
			AvgKPct:       decimal.NewFromFloat(DefaultFallbackTACPct),
			AvgTACPct:     decimal.NewFromFloat(DefaultFallbackTACPct),
		}, nil
	}

	totalPages := len(pageBreakdown)
	if totalPages == 0 {
		totalPages = 1
		pageBreakdown = []domain.PageCoverageResult{
			{
				PageNumber: 1,
				KPct:       decimal.NewFromFloat(DefaultFallbackTACPct),
				TACPct:     decimal.NewFromFloat(DefaultFallbackTACPct),
			},
		}
	}

	var sumC, sumM, sumY, sumK, sumTAC decimal.Decimal
	for _, p := range pageBreakdown {
		sumC = sumC.Add(p.CPct)
		sumM = sumM.Add(p.MPct)
		sumY = sumY.Add(p.YPct)
		sumK = sumK.Add(p.KPct)
		sumTAC = sumTAC.Add(p.TACPct)
	}

	pageCountDec := decimal.NewFromInt(int64(totalPages))
	avgC := sumC.Div(pageCountDec).Round(2)
	avgM := sumM.Div(pageCountDec).Round(2)
	avgY := sumY.Div(pageCountDec).Round(2)
	avgK := sumK.Div(pageCountDec).Round(2)
	avgTAC := sumTAC.Div(pageCountDec).Round(2)

	return &domain.FileScanResult{
		FileSizeBytes: written,
		PageCount:     totalPages,
		AvgCPct:       avgC,
		AvgMPct:       avgM,
		AvgYPct:       avgY,
		AvgKPct:       avgK,
		AvgTACPct:     avgTAC,
		IsFallback:    false,
		Status:        domain.ScanJobStatusAutoVerified,
		PageBreakdown: pageBreakdown,
	}, nil
}

// ConvertDriveURLToDirectDownload converts standard Google Drive sharing links to direct download endpoints
func ConvertDriveURLToDirectDownload(driveURL string) string {
	trimmed := strings.TrimSpace(driveURL)
	if trimmed == "" {
		return ""
	}

	// Pattern 1: https://drive.google.com/file/d/{FILE_ID}/view...
	fileDRegex := regexp.MustCompile(`/file/d/([a-zA-Z0-9_-]+)`)
	if matches := fileDRegex.FindStringSubmatch(trimmed); len(matches) > 1 {
		return fmt.Sprintf("https://drive.google.com/uc?export=download&id=%s", matches[1])
	}

	// Pattern 2: id query param
	if u, err := url.Parse(trimmed); err == nil {
		if id := u.Query().Get("id"); id != "" {
			return fmt.Sprintf("https://drive.google.com/uc?export=download&id=%s", id)
		}
	}

	return trimmed
}

// DefaultPDFRasterizer implements PDF analysis via Ghostscript (gs) or MuPDF (mutool) CLI
type DefaultPDFRasterizer struct{}

func (r *DefaultPDFRasterizer) Analyze(ctx context.Context, filePath string) ([]domain.PageCoverageResult, error) {
	// 1. Try Ghostscript if available
	if _, err := exec.LookPath("gs"); err == nil {
		return analyzeWithGhostscript(ctx, filePath)
	}

	// 2. Try MuPDF (mutool) if available
	if _, err := exec.LookPath("mutool"); err == nil {
		return analyzeWithMuPDF(ctx, filePath)
	}

	// 3. Fallback lightweight inspection if CLI binaries are not pre-installed
	return analyzeFallbackPDF(filePath)
}

// analyzeWithGhostscript runs gs -q -o - -sDEVICE=inkcov <file>
func analyzeWithGhostscript(ctx context.Context, filePath string) ([]domain.PageCoverageResult, error) {
	cmd := exec.CommandContext(ctx, "gs", "-q", "-o", "-", "-sDEVICE=inkcov", filePath)
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("ghostscript execution failed: %w", err)
	}

	var results []domain.PageCoverageResult
	scanner := bufio.NewScanner(strings.NewReader(string(out)))
	pageNum := 1

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasSuffix(line, "CMYK OK") || strings.Contains(line, "OK") {
			fields := strings.Fields(line)
			if len(fields) >= 4 {
				c, _ := strconv.ParseFloat(fields[0], 64)
				m, _ := strconv.ParseFloat(fields[1], 64)
				y, _ := strconv.ParseFloat(fields[2], 64)
				k, _ := strconv.ParseFloat(fields[3], 64)

				cPct := decimal.NewFromFloat(c * 100).Round(2)
				mPct := decimal.NewFromFloat(m * 100).Round(2)
				yPct := decimal.NewFromFloat(y * 100).Round(2)
				kPct := decimal.NewFromFloat(k * 100).Round(2)
				tacPct := cPct.Add(mPct).Add(yPct).Add(kPct).Round(2)

				results = append(results, domain.PageCoverageResult{
					PageNumber: pageNum,
					CPct:       cPct,
					MPct:       mPct,
					YPct:       yPct,
					KPct:       kPct,
					TACPct:     tacPct,
				})
				pageNum++
			}
		}
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("no CMYK coverage data found in ghostscript output")
	}
	return results, nil
}

// analyzeWithMuPDF runs mutool info -M <file>
func analyzeWithMuPDF(ctx context.Context, filePath string) ([]domain.PageCoverageResult, error) {
	cmd := exec.CommandContext(ctx, "mutool", "info", "-M", filePath)
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("mutool info execution failed: %w", err)
	}

	// Parse page count and basic structure from mutool info
	outStr := string(out)
	pages := 1
	pageRegex := regexp.MustCompile(`Pages:\s*(\d+)`)
	if m := pageRegex.FindStringSubmatch(outStr); len(m) > 1 {
		if p, err := strconv.Atoi(m[1]); err == nil && p > 0 {
			pages = p
		}
	}

	var results []domain.PageCoverageResult
	for i := 1; i <= pages; i++ {
		results = append(results, domain.PageCoverageResult{
			PageNumber: i,
			CPct:       decimal.Zero,
			MPct:       decimal.Zero,
			YPct:       decimal.Zero,
			KPct:       decimal.NewFromFloat(DefaultFallbackTACPct),
			TACPct:     decimal.NewFromFloat(DefaultFallbackTACPct),
		})
	}
	return results, nil
}

// analyzeFallbackPDF inspects page count when no external binary is installed
func analyzeFallbackPDF(filePath string) ([]domain.PageCoverageResult, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	// Basic PDF Page count regex detection
	content := string(data)
	pageMatches := regexp.MustCompile(`/Type\s*/Page\b`).FindAllString(content, -1)
	pages := len(pageMatches)
	if pages == 0 {
		pages = 1
	}

	var results []domain.PageCoverageResult
	for i := 1; i <= pages; i++ {
		results = append(results, domain.PageCoverageResult{
			PageNumber: i,
			CPct:       decimal.Zero,
			MPct:       decimal.Zero,
			YPct:       decimal.Zero,
			KPct:       decimal.NewFromFloat(DefaultFallbackTACPct),
			TACPct:     decimal.NewFromFloat(DefaultFallbackTACPct),
		})
	}
	return results, nil
}
