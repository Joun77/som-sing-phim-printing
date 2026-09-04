package notifications

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// TelegramClient encapsulates Telegram Bot API interaction for Admin alerts
type TelegramClient struct {
	BotToken    string
	AdminChatID string
	BaseURL     string
	DB          *sql.DB
	HTTPClient  *http.Client
}

// NewTelegramClient initializes Telegram client from environment variables
func NewTelegramClient(db *sql.DB) *TelegramClient {
	token := os.Getenv("TELEGRAM_BOT_TOKEN")
	chatID := os.Getenv("TELEGRAM_ADMIN_CHAT_ID")

	return &TelegramClient{
		BotToken:    token,
		AdminChatID: chatID,
		BaseURL:     "https://api.telegram.org",
		DB:          db,
		HTTPClient:  &http.Client{Timeout: 10 * time.Second},
	}
}

// InlineKeyboardButton representation
type InlineKeyboardButton struct {
	Text string `json:"text"`
	URL  string `json:"url,omitempty"`
}

// InlineKeyboardMarkup representation
type InlineKeyboardMarkup struct {
	InlineKeyboard [][]InlineKeyboardButton `json:"inline_keyboard"`
}

// TelegramSendMessagePayload
type TelegramSendMessagePayload struct {
	ChatID      string                `json:"chat_id"`
	Text        string                `json:"text"`
	ParseMode   string                `json:"parse_mode"`
	ReplyMarkup *InlineKeyboardMarkup `json:"reply_markup,omitempty"`
}

// SendAdminMessage sends markdown message to the configured Admin Telegram chat
func (c *TelegramClient) SendAdminMessage(message, eventType, refID string) error {
	return c.send(message, nil, eventType, refID)
}

// SendAdminMessageWithButton sends markdown message with an interactive inline button
func (c *TelegramClient) SendAdminMessageWithButton(message, buttonText, buttonURL, eventType, refID string) error {
	markup := &InlineKeyboardMarkup{
		InlineKeyboard: [][]InlineKeyboardButton{
			{
				{Text: buttonText, URL: buttonURL},
			},
		},
	}
	return c.send(message, markup, eventType, refID)
}

// Internal send implementation
func (c *TelegramClient) send(message string, markup *InlineKeyboardMarkup, eventType, refID string) error {
	if message == "" {
		return errors.New("cannot send empty message")
	}

	// Simulation / Sandbox mode if bot token is not provided
	if c.BotToken == "" || c.AdminChatID == "" {
		preview := fmt.Sprintf("[TELEGRAM SIMULATION] %s", message)
		c.logNotification("telegram", eventType, refID, c.AdminChatID, preview, "SENT", "")
		return nil
	}

	payload := TelegramSendMessagePayload{
		ChatID:      c.AdminChatID,
		Text:        message,
		ParseMode:   "Markdown",
		ReplyMarkup: markup,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		c.logNotification("telegram", eventType, refID, c.AdminChatID, message, "FAILED", err.Error())
		return fmt.Errorf("failed to marshal telegram payload: %w", err)
	}

	reqURL := fmt.Sprintf("%s/bot%s/sendMessage", c.BaseURL, c.BotToken)
	req, err := http.NewRequest("POST", reqURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		c.logNotification("telegram", eventType, refID, c.AdminChatID, message, "FAILED", err.Error())
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		c.logNotification("telegram", eventType, refID, c.AdminChatID, message, "FAILED", err.Error())
		return fmt.Errorf("telegram API request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		errMsg := fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(respBody))
		c.logNotification("telegram", eventType, refID, c.AdminChatID, message, "FAILED", errMsg)
		return fmt.Errorf("telegram API error: %s", errMsg)
	}

	c.logNotification("telegram", eventType, refID, c.AdminChatID, message, "SENT", "")
	return nil
}

// FormatOrderMarkdown creates standard formatted notification template
func FormatOrderMarkdown(eventName, orderNo, customerName, amount, extraInfo string) string {
	dt := time.Now().Format("02/01/2006 15:04:05")
	msg := fmt.Sprintf("🖨️ *[%s]*\n─────────────────\n📋 Order: `%s`\n👤 ລູກຄ້າ: *%s*\n💰 ມູນຄ່າ: `%s` LAK\n📅 ວັນທີ: %s",
		eventName, orderNo, customerName, amount, dt)
	if extraInfo != "" {
		msg += fmt.Sprintf("\nℹ️ ຂໍ້ມູນເພີ່ມເຕີມ: %s", extraInfo)
	}
	return msg
}

// Log helper
func (c *TelegramClient) logNotification(channel, eventType, refID, recipient, preview, status, errMsg string) {
	if c.DB == nil {
		return
	}
	query := `
		INSERT INTO notification_logs (channel, event_type, reference_id, recipient, message_preview, status, error_message, sent_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6::notif_status, $7, CASE WHEN $6 = 'SENT' THEN NOW() ELSE NULL END, NOW())
	`
	_, _ = c.DB.Exec(query, channel, eventType, refID, recipient, preview, status, errMsg)
}
