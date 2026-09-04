package notifications

import (
	"strings"
	"testing"
)

func TestTelegramClient_SimulationMode(t *testing.T) {
	client := &TelegramClient{
		BotToken:    "",
		AdminChatID: "",
		BaseURL:     "https://api.telegram.org",
		DB:          nil,
	}

	msg := FormatOrderMarkdown("NEW ORDER CREATED", "SSP-001", "Khamla Phomvihane", "1,250,000", "500 books")
	err := client.SendAdminMessage(msg, "ORDER_CREATED", "SSP-001")
	if err != nil {
		t.Fatalf("Expected simulation send to succeed, got %v", err)
	}
}

func TestFormatOrderMarkdown(t *testing.T) {
	formatted := FormatOrderMarkdown("PAYMENT VERIFIED", "ORD-999", "John Doe", "450,000", "BCEL Transfer")
	if !strings.Contains(formatted, "PAYMENT VERIFIED") {
		t.Fatalf("Expected formatted message to contain event name")
	}
	if !strings.Contains(formatted, "ORD-999") {
		t.Fatalf("Expected formatted message to contain order number")
	}
}
