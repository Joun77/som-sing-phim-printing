package notifications

import (
	"strings"
	"testing"
)

func TestBuildOrderEmailHTML(t *testing.T) {
	data := OrderNotificationData{
		ID:             "ord_123",
		OrderNo:        "SSP-2026-0001",
		CustomerName:   "Somchai Dee",
		TotalAmountLAK: 150000,
		Status:         "PAID_PREPRESS",
		ItemSummary:    "Hardcover Photobook 8x8 (1 pc)",
		CourierName:    "Anousith Express",
		TrackingNumber: "ANOUSITH-9988",
	}

	subject, body, err := BuildOrderEmailHTML(data)
	if err != nil {
		t.Fatalf("unexpected error building email HTML: %v", err)
	}

	if !strings.Contains(subject, "SSP-2026-0001") {
		t.Errorf("subject expected to contain order no, got: %s", subject)
	}

	if !strings.Contains(body, "Somchai Dee") {
		t.Errorf("email body expected to contain customer name")
	}

	if !strings.Contains(body, "150000") {
		t.Errorf("email body expected to contain total price")
	}

	if !strings.Contains(body, "SOM SING PHIM") {
		t.Errorf("email body expected to contain SOM SING PHIM header")
	}
}

func TestSendOrderStatusEmailMock(t *testing.T) {
	data := OrderNotificationData{
		OrderNo:        "SSP-2026-0002",
		CustomerName:   "Keo Many",
		TotalAmountLAK: 45000,
		Status:         "IN_PRODUCTION",
		ItemSummary:    "Die-cut Sticker PVC (100 pcs)",
	}

	// Should not fail when SMTP is unconfigured (safe mock fallback)
	err := SendOrderStatusEmail("customer@example.com", data)
	if err != nil {
		t.Errorf("expected no error in unconfigured SMTP mock mode, got: %v", err)
	}

	// Should return error on empty email
	errEmpty := SendOrderStatusEmail("", data)
	if errEmpty == nil {
		t.Errorf("expected error on empty recipient email")
	}
}
