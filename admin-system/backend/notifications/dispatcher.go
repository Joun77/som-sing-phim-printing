package notifications

import (
	"database/sql"
	"log"
	"sync"
)

// Event Types
const (
	EventOrderCreated    = "ORDER_CREATED"
	EventPaymentVerified = "PAYMENT_VERIFIED"
	EventFileConfirmed   = "FILE_CONFIRMED"
	EventInProduction    = "IN_PRODUCTION"
	EventOrderCompleted  = "ORDER_COMPLETED"
	EventProofReady      = "PROOF_READY"
	EventStockLow        = "STOCK_LOW"
	EventMaintenanceDue  = "MAINTENANCE_DUE"
)

// NotificationEvent represents standard trigger payload
type NotificationEvent struct {
	Type          string            `json:"type"`
	OrderID       string            `json:"order_id"`
	OrderNo       string            `json:"order_no"`
	CustomerName  string            `json:"customer_name"`
	CustomerPhone string            `json:"customer_phone"`
	Amount        string            `json:"amount"`
	ExtraInfo     string            `json:"extra_info"`
	ExtraData     map[string]string `json:"extra_data"`
}

// NotificationDispatcher orchestrates event distribution
type NotificationDispatcher struct {
	DB       *sql.DB
	WhatsApp *WhatsAppClient
	Telegram *TelegramClient
}

var (
	globalDispatcher *NotificationDispatcher
	once             sync.Once
)

// InitGlobalDispatcher initializes the singleton dispatcher
func InitGlobalDispatcher(db *sql.DB) *NotificationDispatcher {
	once.Do(func() {
		globalDispatcher = &NotificationDispatcher{
			DB:       db,
			WhatsApp: NewWhatsAppClient(db),
			Telegram: NewTelegramClient(db),
		}
	})
	return globalDispatcher
}

// GetGlobalDispatcher returns the global dispatcher instance
func GetGlobalDispatcher() *NotificationDispatcher {
	return globalDispatcher
}

// Dispatch processes an event by checking database configurations and sending through enabled channels
func (d *NotificationDispatcher) Dispatch(event NotificationEvent) error {
	if d == nil {
		return nil
	}

	orderNo := event.OrderNo
	if orderNo == "" {
		orderNo = event.OrderID
	}

	// 1. Check enabled channels in DB
	type channelConfig struct {
		Channel       string
		RecipientType string
		TemplateID    sql.NullString
	}
	var configs []channelConfig

	if d.DB != nil {
		rows, err := d.DB.Query(`
			SELECT channel, recipient_type, template_id
			FROM notification_configs
			WHERE event_type = $1 AND is_enabled = true
		`, event.Type)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var cfg channelConfig
				if err := rows.Scan(&cfg.Channel, &cfg.RecipientType, &cfg.TemplateID); err == nil {
					configs = append(configs, cfg)
				}
			}
		}
	} else {
		// Fallback defaults
		configs = append(configs,
			channelConfig{Channel: "telegram", RecipientType: "admin"},
			channelConfig{Channel: "whatsapp", RecipientType: "customer", TemplateID: sql.NullString{String: "order_update", Valid: true}},
		)
	}

	for _, cfg := range configs {
		switch cfg.Channel {
		case "telegram":
			if cfg.RecipientType == "admin" && d.Telegram != nil {
				msg := FormatOrderMarkdown(event.Type, orderNo, event.CustomerName, event.Amount, event.ExtraInfo)
				_ = d.Telegram.SendAdminMessage(msg, event.Type, event.OrderID)
			}

		case "whatsapp":
			if cfg.RecipientType == "customer" && d.WhatsApp != nil {
				phone := event.CustomerPhone
				if phone == "" && d.DB != nil && event.OrderID != "" {
					phone, _ = GetCustomerPhoneByOrderID(d.DB, event.OrderID)
				}
				if phone != "" {
					templateName := "order_update"
					if cfg.TemplateID.Valid && cfg.TemplateID.String != "" {
						templateName = cfg.TemplateID.String
					}
					params := []string{orderNo, event.CustomerName, event.Amount}
					_ = d.WhatsApp.SendTemplateMessage(phone, templateName, params, event.OrderID)
				}
			}
		}
	}

	return nil
}

// DispatchAsync triggers non-blocking background dispatch
func DispatchAsync(event NotificationEvent) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[NOTIF RECOVER] Panic in DispatchAsync: %v", r)
			}
		}()
		disp := GetGlobalDispatcher()
		if disp != nil {
			if err := disp.Dispatch(event); err != nil {
				log.Printf("[NOTIF ERROR] Dispatch failed: %v", err)
			}
		}
	}()
}
