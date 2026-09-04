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
	"strings"
	"time"
)

// WhatsAppClient encapsulates Meta Graph Cloud API integration
type WhatsAppClient struct {
	PhoneNumberID string
	AccessToken   string
	BaseURL       string
	DB            *sql.DB
	HTTPClient    *http.Client
}

// NewWhatsAppClient initializes client from environment variables or custom params
func NewWhatsAppClient(db *sql.DB) *WhatsAppClient {
	phoneID := os.Getenv("WHATSAPP_PHONE_NUMBER_ID")
	token := os.Getenv("WHATSAPP_ACCESS_TOKEN")
	apiVersion := os.Getenv("WHATSAPP_API_VERSION")
	if apiVersion == "" {
		apiVersion = "v19.0"
	}

	return &WhatsAppClient{
		PhoneNumberID: phoneID,
		AccessToken:   token,
		BaseURL:       fmt.Sprintf("https://graph.facebook.com/%s", apiVersion),
		DB:            db,
		HTTPClient:    &http.Client{Timeout: 10 * time.Second},
	}
}

// WhatsAppTemplateComponent represents parameters inside template
type WhatsAppTemplateComponent struct {
	Type       string                 `json:"type"`
	Parameters []WhatsAppTemplateParam `json:"parameters"`
}

// WhatsAppTemplateParam represents text parameter
type WhatsAppTemplateParam struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

// WhatsAppTemplatePayload structure for Meta API
type WhatsAppTemplatePayload struct {
	MessagingProduct string `json:"messaging_product"`
	To               string `json:"to"`
	Type             string `json:"type"`
	Template         struct {
		Name     string `json:"name"`
		Language struct {
			Code string `json:"code"`
		} `json:"language"`
		Components []WhatsAppTemplateComponent `json:"components,omitempty"`
	} `json:"template"`
}

// SendTemplateMessage sends pre-approved template message to customer
func (c *WhatsAppClient) SendTemplateMessage(to, templateName string, params []string, refID string) error {
	cleanPhone := strings.ReplaceAll(strings.ReplaceAll(to, "+", ""), " ", "")
	if cleanPhone == "" {
		c.logNotification("whatsapp", templateName, refID, to, "Empty recipient phone", "FAILED", "Recipient phone number is required")
		return errors.New("recipient phone number is required")
	}

	var components []WhatsAppTemplateComponent
	if len(params) > 0 {
		var paramList []WhatsAppTemplateParam
		for _, p := range params {
			paramList = append(paramList, WhatsAppTemplateParam{
				Type: "text",
				Text: p,
			})
		}
		components = append(components, WhatsAppTemplateComponent{
			Type:       "body",
			Parameters: paramList,
		})
	}

	payload := WhatsAppTemplatePayload{
		MessagingProduct: "whatsapp",
		To:               cleanPhone,
		Type:             "template",
	}
	payload.Template.Name = templateName
	payload.Template.Language.Code = "lo" // Lao language template default
	payload.Template.Components = components

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		c.logNotification("whatsapp", templateName, refID, cleanPhone, string(bodyBytes), "FAILED", err.Error())
		return fmt.Errorf("failed to marshal whatsapp payload: %w", err)
	}

	// If token or phone ID is not configured (e.g. testing / sandbox mock)
	if c.AccessToken == "" || c.PhoneNumberID == "" {
		preview := fmt.Sprintf("[WHATSAPP SIMULATION] Template: %s | To: %s | Params: %v", templateName, cleanPhone, params)
		c.logNotification("whatsapp", templateName, refID, cleanPhone, preview, "SENT", "")
		return nil
	}

	reqURL := fmt.Sprintf("%s/%s/messages", c.BaseURL, c.PhoneNumberID)
	req, err := http.NewRequest("POST", reqURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		c.logNotification("whatsapp", templateName, refID, cleanPhone, string(bodyBytes), "FAILED", err.Error())
		return err
	}

	req.Header.Set("Authorization", "Bearer "+c.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		c.logNotification("whatsapp", templateName, refID, cleanPhone, string(bodyBytes), "FAILED", err.Error())
		return fmt.Errorf("whatsapp API request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		errMsg := fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(respBody))
		c.logNotification("whatsapp", templateName, refID, cleanPhone, string(bodyBytes), "FAILED", errMsg)
		return fmt.Errorf("whatsapp API error: %s", errMsg)
	}

	c.logNotification("whatsapp", templateName, refID, cleanPhone, string(bodyBytes), "SENT", "")
	return nil
}

// Helper to log notification result to database
func (c *WhatsAppClient) logNotification(channel, eventType, refID, recipient, preview, status, errMsg string) {
	if c.DB == nil {
		return
	}
	query := `
		INSERT INTO notification_logs (channel, event_type, reference_id, recipient, message_preview, status, error_message, sent_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6::notif_status, $7, CASE WHEN $6 = 'SENT' THEN NOW() ELSE NULL END, NOW())
	`
	_, _ = c.DB.Exec(query, channel, eventType, refID, recipient, preview, status, errMsg)
}

// GetCustomerPhoneByOrderID extracts customer phone from orders table
func GetCustomerPhoneByOrderID(db *sql.DB, orderID string) (string, error) {
	if db == nil {
		return "", errors.New("database connection is nil")
	}
	var phone string
	err := db.QueryRow(`
		SELECT COALESCE(customer_phone, phone, '')
		FROM orders
		WHERE id = $1 OR order_no = $1
		LIMIT 1
	`, orderID).Scan(&phone)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(phone), nil
}
