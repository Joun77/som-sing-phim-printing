package orders

import (
	"encoding/json"
	"io"
	"time"

	"github.com/gin-gonic/gin"
)

type ProgressEvent struct {
	OrderID          string `json:"order_id"`
	OrderNumber      string `json:"order_number"`
	Status           string `json:"status"`
	ProductionStatus string `json:"production_status"`
	UpdatedAt        string `json:"updated_at"`
}

// HandleOrderProgressSSEStream streams realtime production updates to Customer Portal via Server-Sent Events
func HandleOrderProgressSSEStream(c *gin.Context) {
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")

	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	notifyChan := make(chan ProgressEvent)

	// Send initial connection event
	initEvent := ProgressEvent{
		OrderID:          "connection-init",
		Status:           "CONNECTED",
		ProductionStatus: "Realtime Progress Stream Active",
		UpdatedAt:        time.Now().Format(time.RFC3339),
	}
	initBytes, _ := json.Marshal(initEvent)
	c.SSEvent("message", string(initBytes))
	c.Writer.Flush()

	c.Stream(func(w io.Writer) bool {
		select {
		case event := <-notifyChan:
			eventBytes, _ := json.Marshal(event)
			c.SSEvent("order_update", string(eventBytes))
			return true
		case <-ticker.C:
			// Heartbeat keepalive
			pingEvent := ProgressEvent{
				OrderID:          "ping",
				Status:           "PING",
				ProductionStatus: "Stream Heartbeat",
				UpdatedAt:        time.Now().Format(time.RFC3339),
			}
			pingBytes, _ := json.Marshal(pingEvent)
			c.SSEvent("ping", string(pingBytes))
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}
