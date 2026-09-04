package worker_test

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"sync"
	"testing"
	"time"

	"backend/internal/domain"
	"backend/internal/service"
	"backend/internal/worker"

	"github.com/shopspring/decimal"
)

// MockHTTPClient implements service.HTTPClientInterface
type MockHTTPClient struct {
	Response *http.Response
	Err      error
}

func (m *MockHTTPClient) Do(req *http.Request) (*http.Response, error) {
	if m.Err != nil {
		return nil, m.Err
	}
	return m.Response, nil
}

// MockRasterizer implements service.PDFRasterizer
type MockRasterizer struct {
	Results []domain.PageCoverageResult
	Err     error
}

func (m *MockRasterizer) Analyze(ctx context.Context, filePath string) ([]domain.PageCoverageResult, error) {
	if m.Err != nil {
		return nil, m.Err
	}
	return m.Results, nil
}

func TestWorker_RouteA_AutoVerified(t *testing.T) {
	pdfData := []byte("%PDF-1.4 sample stream content")
	resp := &http.Response{
		StatusCode:    http.StatusOK,
		ContentLength: int64(len(pdfData)),
		Header:        http.Header{"Content-Type": []string{"application/pdf"}},
		Body:          io.NopCloser(bytes.NewReader(pdfData)),
	}

	mockHTTP := &MockHTTPClient{Response: resp}
	mockRasterizer := &MockRasterizer{
		Results: []domain.PageCoverageResult{
			{
				PageNumber: 1,
				CPct:       decimal.NewFromFloat(10.00),
				MPct:       decimal.NewFromFloat(20.00),
				YPct:       decimal.NewFromFloat(10.00),
				KPct:       decimal.NewFromFloat(10.00),
				TACPct:     decimal.NewFromFloat(50.00),
			},
			{
				PageNumber: 2,
				CPct:       decimal.NewFromFloat(20.00),
				MPct:       decimal.NewFromFloat(10.00),
				YPct:       decimal.NewFromFloat(10.00),
				KPct:       decimal.NewFromFloat(20.00),
				TACPct:     decimal.NewFromFloat(60.00),
			},
		},
	}

	scannerSvc := service.NewFileScannerService(mockHTTP, mockRasterizer)
	w := worker.NewDriveIngestionWorker(nil, scannerSvc, 1, 10)

	job := &domain.FileScanJob{
		ID:          "job-1",
		OrderItemID: "item-101",
		DriveURL:    "https://drive.google.com/file/d/test_file_id/view",
		Status:      domain.ScanJobStatusQueuedScan,
	}

	err := w.ProcessJob(context.Background(), job)
	if err != nil {
		t.Fatalf("unexpected process error: %v", err)
	}

	if job.Status != domain.ScanJobStatusAutoVerified {
		t.Errorf("expected status AUTO_VERIFIED, got %s", job.Status)
	}
	if job.PageCount == nil || *job.PageCount != 2 {
		t.Errorf("expected 2 pages, got %v", job.PageCount)
	}
	if !job.AvgCPct.Equal(decimal.NewFromFloat(15.00)) {
		t.Errorf("expected AvgCPct 15.00, got %s", job.AvgCPct)
	}
	if !job.AvgTACPct.Equal(decimal.NewFromFloat(55.00)) {
		t.Errorf("expected AvgTACPct 55.00, got %s", job.AvgTACPct)
	}
}

func TestWorker_RouteB_OversizedFile(t *testing.T) {
	resp := &http.Response{
		StatusCode:    http.StatusOK,
		ContentLength: 120 * 1024 * 1024, // 120 MB
		Header:        http.Header{"Content-Type": []string{"application/pdf"}},
		Body:          io.NopCloser(bytes.NewReader([]byte{})),
	}

	mockHTTP := &MockHTTPClient{Response: resp}
	scannerSvc := service.NewFileScannerService(mockHTTP, nil)
	w := worker.NewDriveIngestionWorker(nil, scannerSvc, 1, 10)

	job := &domain.FileScanJob{
		ID:          "job-2",
		OrderItemID: "item-102",
		DriveURL:    "https://drive.google.com/file/d/large_file_id/view",
		Status:      domain.ScanJobStatusQueuedScan,
	}

	err := w.ProcessJob(context.Background(), job)
	if err != nil {
		t.Fatalf("unexpected process error: %v", err)
	}

	if job.Status != domain.ScanJobStatusPendingManualVerification {
		t.Errorf("expected status PENDING_MANUAL_VERIFICATION, got %s", job.Status)
	}
	if !job.AvgTACPct.Equal(decimal.NewFromFloat(20.00)) {
		t.Errorf("expected fallback TAC 20.00, got %s", job.AvgTACPct)
	}
}

func TestWorker_RouteB_PrivateFile(t *testing.T) {
	resp := &http.Response{
		StatusCode: http.StatusForbidden,
		Header:     http.Header{"Content-Type": []string{"text/html"}},
		Body:       io.NopCloser(bytes.NewReader([]byte("Access Denied"))),
	}

	mockHTTP := &MockHTTPClient{Response: resp}
	scannerSvc := service.NewFileScannerService(mockHTTP, nil)
	w := worker.NewDriveIngestionWorker(nil, scannerSvc, 1, 10)

	job := &domain.FileScanJob{
		ID:          "job-3",
		OrderItemID: "item-103",
		DriveURL:    "https://drive.google.com/file/d/private_file_id/view",
		Status:      domain.ScanJobStatusQueuedScan,
	}

	err := w.ProcessJob(context.Background(), job)
	if err != nil {
		t.Fatalf("unexpected process error: %v", err)
	}

	if job.Status != domain.ScanJobStatusPendingManualVerification {
		t.Errorf("expected status PENDING_MANUAL_VERIFICATION, got %s", job.Status)
	}
	if !job.AvgTACPct.Equal(decimal.NewFromFloat(20.00)) {
		t.Errorf("expected fallback TAC 20.00, got %s", job.AvgTACPct)
	}
}

func TestWorker_ConcurrentQueueAndGracefulShutdown(t *testing.T) {
	pdfData := []byte("%PDF-1.4 sample")
	mockHTTP := &MockHTTPClient{
		Response: &http.Response{
			StatusCode:    http.StatusOK,
			ContentLength: int64(len(pdfData)),
			Header:        http.Header{"Content-Type": []string{"application/pdf"}},
			Body:          io.NopCloser(bytes.NewReader(pdfData)),
		},
	}
	mockRasterizer := &MockRasterizer{
		Results: []domain.PageCoverageResult{
			{PageNumber: 1, KPct: decimal.NewFromFloat(15.00), TACPct: decimal.NewFromFloat(15.00)},
		},
	}

	scannerSvc := service.NewFileScannerService(mockHTTP, mockRasterizer)
	w := worker.NewDriveIngestionWorker(nil, scannerSvc, 3, 20)
	w.Start()

	var wg sync.WaitGroup
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			_, err := w.EnqueueJob(context.Background(), "item-id", "https://drive.google.com/file/d/sample/view")
			if err != nil {
				t.Errorf("enqueue failed: %v", err)
			}
		}(i)
	}
	wg.Wait()

	// Allow brief time for workers to process
	time.Sleep(50 * time.Millisecond)

	// Graceful shutdown must finish cleanly without deadlock
	w.Stop()
}

func TestConvertDriveURLToDirectDownload(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{
			input:    "https://drive.google.com/file/d/1A2B3C4D5E/view?usp=sharing",
			expected: "https://drive.google.com/uc?export=download&id=1A2B3C4D5E",
		},
		{
			input:    "https://drive.google.com/open?id=XYZ987",
			expected: "https://drive.google.com/uc?export=download&id=XYZ987",
		},
		{
			input:    "https://example.com/direct/file.pdf",
			expected: "https://example.com/direct/file.pdf",
		},
	}

	for _, tt := range tests {
		res := service.ConvertDriveURLToDirectDownload(tt.input)
		if res != tt.expected {
			t.Errorf("ConvertDriveURLToDirectDownload(%q) = %q, expected %q", tt.input, res, tt.expected)
		}
	}
}
