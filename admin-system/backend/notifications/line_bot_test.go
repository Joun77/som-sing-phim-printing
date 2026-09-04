package notifications

import (
	"testing"
)

func TestBuildOrderStatusFlexMessage(t *testing.T) {
	events := []string{"PAID_PREPRESS", "IN_PRODUCTION", "SHIPPED"}

	for _, event := range events {
		t.Run(event, func(t *testing.T) {
			data := OrderNotificationData{
				ID:             "ORD-TEST-001",
				OrderNo:        "ORD-202608-001",
				CustomerName:   "Somphone Vongsa",
				CustomerPhone:  "020-5555-5555",
				CustomerLineID: "U1234567890abcdef",
				TotalAmountLAK: 1850000,
				Status:         event,
				TrackingNumber: "ANO-LAO-998877",
				CourierName:    "Anousith Express",
			}

			bubble := BuildOrderStatusFlexMessage(data)
			if bubble == nil {
				t.Fatalf("Expected non-nil bubble container for %s", event)
			}
			if bubble.Header == nil || bubble.Body == nil || bubble.Footer == nil {
				t.Errorf("Flex message structure incomplete for %s", event)
			}

			// Test SendOrderStatusFlexMessage simulation
			err := SendOrderStatusFlexMessage(data.CustomerLineID, data)
			if err != nil {
				t.Errorf("Unexpected error in simulation mode: %v", err)
			}
		})
	}
}
