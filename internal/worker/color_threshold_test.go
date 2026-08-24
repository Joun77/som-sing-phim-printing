package worker

import (
	"context"
	"testing"
)

func TestClassifyPage_ColorThresholdRule(t *testing.T) {
	tests := []struct {
		name     string
		c, m, y  float64
		expected PageType
	}{
		{
			name:     "Pure black / zero color",
			c:        0.0,
			m:        0.0,
			y:        0.0,
			expected: PageTypeMonochrome,
		},
		{
			name:     "Below 0.5% total color (0.1 + 0.1 + 0.1 = 0.3%)",
			c:        0.1,
			m:        0.1,
			y:        0.1,
			expected: PageTypeMonochrome,
		},
		{
			name:     "Boundary below 0.5% (0.49%)",
			c:        0.49,
			m:        0.0,
			y:        0.0,
			expected: PageTypeMonochrome,
		},
		{
			name:     "Exact 0.5% threshold",
			c:        0.50,
			m:        0.0,
			y:        0.0,
			expected: PageTypeColor,
		},
		{
			name:     "Well above 0.5% (Standard color page)",
			c:        12.5,
			m:        20.0,
			y:        5.0,
			expected: PageTypeColor,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := ClassifyPage(tc.c, tc.m, tc.y)
			if got != tc.expected {
				t.Errorf("ClassifyPage(%v, %v, %v) = %v; want %v", tc.c, tc.m, tc.y, got, tc.expected)
			}
		})
	}
}

func TestBuildCoverageSummary(t *testing.T) {
	pages := []PageCMYKCoverage{
		{
			PageNumber: 1,
			Cyan:       0.1,
			Magenta:    0.1,
			Yellow:     0.1,
			Black:      15.0,
			TotalColor: 0.3,
			PageType:   PageTypeMonochrome,
		},
		{
			PageNumber: 2,
			Cyan:       10.0,
			Magenta:    10.0,
			Yellow:     5.0,
			Black:      2.0,
			TotalColor: 25.0,
			PageType:   PageTypeColor,
		},
	}

	summary := BuildCoverageSummary(pages)
	if summary.TotalPages != 2 {
		t.Errorf("expected 2 total pages, got %d", summary.TotalPages)
	}
	if summary.MonoPagesCount != 1 {
		t.Errorf("expected 1 mono page, got %d", summary.MonoPagesCount)
	}
	if summary.ColorPagesCount != 1 {
		t.Errorf("expected 1 color page, got %d", summary.ColorPagesCount)
	}
}

type mockPDFAnalyzer struct{}

func (m *mockPDFAnalyzer) Analyze(ctx context.Context, filePath string) (*JobCoverageSummary, error) {
	pages := []PageCMYKCoverage{
		{
			PageNumber: 1,
			Cyan:       10.0,
			Magenta:    5.0,
			Yellow:     5.0,
			Black:      2.0,
			TotalColor: 20.0,
			PageType:   PageTypeColor,
		},
	}
	res := BuildCoverageSummary(pages)
	return &res, nil
}

func TestMockPDFAnalyzer(t *testing.T) {
	analyzer := &mockPDFAnalyzer{}
	summary, err := analyzer.Analyze(context.Background(), "dummy.pdf")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if summary.ColorPagesCount != 1 {
		t.Errorf("expected 1 color page, got %d", summary.ColorPagesCount)
	}
}
