package notifications

import (
	"testing"
)

func TestWhatsAppClient_SimulationMode(t *testing.T) {
	client := &WhatsAppClient{
		PhoneNumberID: "",
		AccessToken:   "",
		BaseURL:       "https://graph.facebook.com/v19.0",
		DB:            nil,
	}

	err := client.SendTemplateMessage("2055558888", "payment_confirmed", []string{"ORD-001", "500,000"}, "ORD-001")
	if err != nil {
		t.Fatalf("Expected simulation mode to succeed, got error: %v", err)
	}
}

func TestWhatsAppClient_EmptyRecipient(t *testing.T) {
	client := &WhatsAppClient{
		PhoneNumberID: "12345",
		AccessToken:   "token",
		BaseURL:       "https://graph.facebook.com/v19.0",
		DB:            nil,
	}

	err := client.SendTemplateMessage("", "order_confirmation", []string{"ORD-001"}, "ORD-001")
	if err == nil {
		t.Fatalf("Expected error for empty recipient phone, got nil")
	}
}
