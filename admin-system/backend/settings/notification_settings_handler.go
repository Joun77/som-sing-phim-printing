package settings

import (
	"database/sql"
	"net/http"
	"time"

	"somsing.local/backend/db"
	"somsing.local/backend/notifications"

	"github.com/gin-gonic/gin"
)

// NotificationConfigItem represents channel-event toggle
type NotificationConfigItem struct {
	ID            string  `json:"id"`
	Channel       string  `json:"channel"`
	EventType     string  `json:"event_type"`
	RecipientType string  `json:"recipient_type"`
	IsEnabled     bool    `json:"is_enabled"`
	TemplateID    *string `json:"template_id"`
}

// HandleGetNotificationConfig retrieves all notification event toggles
func HandleGetNotificationConfig(c *gin.Context) {
	var list []NotificationConfigItem

	if db.DB != nil {
		rows, err := db.DB.Query(`
			SELECT id::text, channel, event_type, recipient_type, is_enabled, template_id
			FROM notification_configs
			ORDER BY channel ASC, event_type ASC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var item NotificationConfigItem
				var tmpl sql.NullString
				if err := rows.Scan(&item.ID, &item.Channel, &item.EventType, &item.RecipientType, &item.IsEnabled, &tmpl); err == nil {
					if tmpl.Valid {
						item.TemplateID = &tmpl.String
					}
					list = append(list, item)
				}
			}
		}
	}

	if list == nil {
		list = []NotificationConfigItem{}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
}

// UpdateNotificationConfigRequest payload
type UpdateNotificationConfigRequest struct {
	Configs []struct {
		Channel       string `json:"channel" binding:"required"`
		EventType     string `json:"event_type" binding:"required"`
		RecipientType string `json:"recipient_type" binding:"required"`
		IsEnabled     bool   `json:"is_enabled"`
	} `json:"configs" binding:"required"`
}

// HandleUpdateNotificationConfig updates channel event toggles
func HandleUpdateNotificationConfig(c *gin.Context) {
	var req UpdateNotificationConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if db.DB != nil {
		for _, cfg := range req.Configs {
			_, _ = db.DB.Exec(`
				UPDATE notification_configs
				SET is_enabled = $1
				WHERE channel = $2 AND event_type = $3 AND recipient_type = $4
			`, cfg.IsEnabled, cfg.Channel, cfg.EventType, cfg.RecipientType)
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Notification configurations updated successfully"})
}

// TestNotificationRequest payload
type TestNotificationRequest struct {
	Channel   string `json:"channel" binding:"required"` // "whatsapp" | "telegram"
	Recipient string `json:"recipient"`                 // phone number if whatsapp
}

// HandleTestNotification triggers a test message
func HandleTestNotification(c *gin.Context) {
	var req TestNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	disp := notifications.GetGlobalDispatcher()
	if disp == nil {
		disp = notifications.InitGlobalDispatcher(db.DB)
	}

	var err error
	if req.Channel == "telegram" {
		if disp.Telegram != nil {
			err = disp.Telegram.SendAdminMessage("🧪 *Test Notification from Som Sing Phim Admin*\n\nລະບົບແຈ້ງເຕືອນ Telegram Bot ເຊື່ອມຕໍ່ສຳເລັດແລ້ວ!", "TEST", "TEST-001")
		}
	} else if req.Channel == "whatsapp" {
		phone := req.Recipient
		if phone == "" {
			phone = "2055558888"
		}
		if disp.WhatsApp != nil {
			err = disp.WhatsApp.SendTemplateMessage(phone, "order_update", []string{"TEST-001", "Admin Test", "0 LAK"}, "TEST-001")
		}
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Test notification dispatched successfully via " + req.Channel,
		"time":    time.Now().Format(time.RFC3339),
	})
}
