package domain

import (
	"time"

	"github.com/shopspring/decimal"
)

// ScanJobStatus represents the lifecycle state of an ingested file scan job
type ScanJobStatus string

const (
	ScanJobStatusQueuedScan                ScanJobStatus = "QUEUED_SCAN"
	ScanJobStatusProcessing                ScanJobStatus = "PROCESSING"
	ScanJobStatusAutoVerified              ScanJobStatus = "AUTO_VERIFIED"
	ScanJobStatusPendingManualVerification ScanJobStatus = "PENDING_MANUAL_VERIFICATION"
	ScanJobStatusFailed                    ScanJobStatus = "FAILED"
)

// FileScanJob represents a persistent scan job entry in PostgreSQL
type FileScanJob struct {
	ID            string           `json:"id" db:"id"`
	OrderItemID   string           `json:"order_item_id" db:"order_item_id"`
	DriveURL      string           `json:"drive_url" db:"drive_url"`
	Status        ScanJobStatus    `json:"status" db:"status"`
	FileSizeBytes *int64           `json:"file_size_bytes,omitempty" db:"file_size_bytes"`
	PageCount     *int             `json:"page_count,omitempty" db:"page_count"`
	AvgCPct       *decimal.Decimal `json:"avg_c_pct,omitempty" db:"avg_c_pct"`
	AvgMPct       *decimal.Decimal `json:"avg_m_pct,omitempty" db:"avg_m_pct"`
	AvgYPct       *decimal.Decimal `json:"avg_y_pct,omitempty" db:"avg_y_pct"`
	AvgKPct       *decimal.Decimal `json:"avg_k_pct,omitempty" db:"avg_k_pct"`
	AvgTACPct     *decimal.Decimal `json:"avg_tac_pct,omitempty" db:"avg_tac_pct"`
	ErrorMessage  *string          `json:"error_message,omitempty" db:"error_message"`
	CreatedAt     time.Time        `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at" db:"updated_at"`
}

// PageCoverageResult captures per-page CMYK density
type PageCoverageResult struct {
	PageNumber int             `json:"page_number"`
	CPct       decimal.Decimal `json:"c_pct"`
	MPct       decimal.Decimal `json:"m_pct"`
	YPct       decimal.Decimal `json:"y_pct"`
	KPct       decimal.Decimal `json:"k_pct"`
	TACPct     decimal.Decimal `json:"tac_pct"`
}

// FileScanResult represents the completed analysis outcome from the scanner service
type FileScanResult struct {
	FileSizeBytes int64                `json:"file_size_bytes"`
	PageCount     int                  `json:"page_count"`
	AvgCPct       decimal.Decimal      `json:"avg_c_pct"`
	AvgMPct       decimal.Decimal      `json:"avg_m_pct"`
	AvgYPct       decimal.Decimal      `json:"avg_y_pct"`
	AvgKPct       decimal.Decimal      `json:"avg_k_pct"`
	AvgTACPct     decimal.Decimal      `json:"avg_tac_pct"`
	IsFallback    bool                 `json:"is_fallback"`
	Status        ScanJobStatus        `json:"status"`
	ErrorMessage  string               `json:"error_message,omitempty"`
	PageBreakdown []PageCoverageResult `json:"page_breakdown,omitempty"`
}
