package handler

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"backend/server/domain"
	"backend/server/service"

	"github.com/gin-gonic/gin"
)

// SSEConnectionEvent represents typed initial handshake payload for stream clients
type SSEConnectionEvent struct {
	Event     string `json:"event"`
	Message   string `json:"message"`
	Tracking  string `json:"tracking,omitempty"`
	Timestamp int64  `json:"timestamp"`
}

// SSEPingEvent represents typed heartbeat keep-alive payload
type SSEPingEvent struct {
	Event     string `json:"event"`
	Timestamp int64  `json:"timestamp"`
}

// SSEBroadcaster manages active SSE client channels for per-order and broadcast updates
type SSEBroadcaster struct {
	mu      sync.RWMutex
	clients map[chan domain.PublicOrderTrackingDTO]string
}

var broadcaster = &SSEBroadcaster{
	clients: make(map[chan domain.PublicOrderTrackingDTO]string),
}

// Subscribe adds a client channel to broadcaster with optional per-order tracking filter
func (b *SSEBroadcaster) Subscribe(trackingCode string) chan domain.PublicOrderTrackingDTO {
	b.mu.Lock()
	defer b.mu.Unlock()
	ch := make(chan domain.PublicOrderTrackingDTO, 10)
	b.clients[ch] = trackingCode
	return ch
}

// Unsubscribe removes a client channel
func (b *SSEBroadcaster) Unsubscribe(ch chan domain.PublicOrderTrackingDTO) {
	b.mu.Lock()
	defer b.mu.Unlock()
	delete(b.clients, ch)
	close(ch)
}

// Broadcast sends order event to connected SSE clients, respecting per-order filters
func (b *SSEBroadcaster) Broadcast(event domain.PublicOrderTrackingDTO) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	for ch, filter := range b.clients {
		if filter != "" && filter != event.TrackingCode && filter != event.OrderNo && filter != event.OrderID {
			continue
		}
		select {
		case ch <- event:
		default:
		}
	}
}

// OrderHandler handles HTTP requests for pricing calculation, tracking, and SSE lifecycle streaming
type OrderHandler struct {
	pricingService service.IPricingService
	db             *sql.DB
	orderStore     map[string]domain.Order
	storeMu        sync.RWMutex
}

// NewOrderHandler initializes a new OrderHandler
func NewOrderHandler(pricingSvc service.IPricingService, dbConn *sql.DB) *OrderHandler {
	if pricingSvc == nil {
		pricingSvc = service.NewPricingService()
	}
	return &OrderHandler{
		pricingService: pricingSvc,
		db:             dbConn,
		orderStore:     make(map[string]domain.Order),
	}
}

// RegisterRoutes registers endpoints to Gin router engine
func (h *OrderHandler) RegisterRoutes(r *gin.Engine) {
	apiV1 := r.Group("/api/v1")
	{
		// Pricing Calculation endpoint (Admin full cost breakdown)
		apiV1.POST("/pricing/calculate", h.HandleCalculatePricing)

		// Public & Customer Tracking endpoints (Masked internal operational costs)
		apiV1.GET("/orders/track/:tracking_code", h.HandleTrackOrder)

		// Real-time lifecycle Server-Sent Events (SSE) stream (Supports ?tracking=:code)
		apiV1.GET("/orders/stream", h.HandleOrderStream)
	}

	// Legacy backward compatibility routes
	r.POST("/api/pricing/calculate", h.HandleCalculatePricing)
	r.GET("/api/orders/track/:tracking_code", h.HandleTrackOrder)
}

// HandleCalculatePricing calculates authoritative pricing with full internal breakdown for Admin
func (h *OrderHandler) HandleCalculatePricing(c *gin.Context) {
	var req domain.PricingCalculationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid pricing calculation payload",
			"details": err.Error(),
		})
		return
	}

	res, err := h.pricingService.CalculatePricing(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to compute pricing breakdown",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   res,
	})
}

// HandleTrackOrder retrieves order status by tracking_code or order_no with internal operational costs strictly masked
func (h *OrderHandler) HandleTrackOrder(c *gin.Context) {
	code := c.Param("tracking_code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Tracking code parameter is required",
		})
		return
	}

	order, found := h.findOrderByCode(code)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": fmt.Sprintf("Order with tracking code '%s' not found", code),
		})
		return
	}

	// Mask all internal operational metrics before responding to customer client
	publicPayload := order.MaskForCustomer()

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   publicPayload,
	})
}

// HandleOrderStream provides real-time SSE streaming for live order status updates (per-order or global)
func (h *OrderHandler) HandleOrderStream(c *gin.Context) {
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")

	trackingCode := c.Query("tracking")
	if trackingCode == "" {
		trackingCode = c.Query("tracking_code")
	}

	clientChan := broadcaster.Subscribe(trackingCode)
	defer broadcaster.Unsubscribe(clientChan)

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	// Initial Connection Event
	initMsg := SSEConnectionEvent{
		Event:     "CONNECTED",
		Message:   "Order lifecycle real-time stream established",
		Tracking:  trackingCode,
		Timestamp: time.Now().Unix(),
	}
	initBytes, _ := json.Marshal(initMsg)
	c.SSEvent("connection", string(initBytes))
	c.Writer.Flush()

	c.Stream(func(w io.Writer) bool {
		select {
		case event, ok := <-clientChan:
			if !ok {
				return false
			}
			eventBytes, err := json.Marshal(event)
			if err == nil {
				c.SSEvent("order_status_update", string(eventBytes))
			}
			return true
		case <-ticker.C:
			pingMsg := SSEPingEvent{
				Event:     "PING",
				Timestamp: time.Now().Unix(),
			}
			pingBytes, _ := json.Marshal(pingMsg)
			c.SSEvent("ping", string(pingBytes))
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}

// SaveOrder stores an order in DB / memory and broadcasts status update
func (h *OrderHandler) SaveOrder(order domain.Order) {
	h.storeMu.Lock()
	h.orderStore[order.ID] = order
	if order.TrackingCode != "" {
		h.orderStore[order.TrackingCode] = order
	}
	if order.OrderNo != "" {
		h.orderStore[order.OrderNo] = order
	}
	h.storeMu.Unlock()

	// Broadcast masked payload to live clients
	broadcaster.Broadcast(order.MaskForCustomer())
}

// findOrderByCode searches PostgreSQL DB or in-memory fallback
func (h *OrderHandler) findOrderByCode(code string) (*domain.Order, bool) {
	h.storeMu.RLock()
	order, ok := h.orderStore[code]
	h.storeMu.RUnlock()
	if ok {
		return &order, true
	}

	if h.db == nil {
		return nil, false
	}

	query := `
		SELECT id, order_no, COALESCE(tracking_code, order_no), COALESCE(internal_tracking_code, ''),
		       COALESCE(courier_name, ''), customer_name, COALESCE(customer_phone, ''),
		       total_amount_lak, deposit_lak, remaining_lak, overall_status,
		       COALESCE(delivery_date, ''), COALESCE(google_drive_link, ''), COALESCE(proof_url, ''),
		       proof_approved_at, proof_rejected_at, COALESCE(proof_signature_ip, ''), COALESCE(proof_rejection_reason, ''),
		       stock_deducted_at, created_at, updated_at
		FROM orders
		WHERE tracking_code = $1 OR order_no = $1 OR id = $1
		LIMIT 1`

	var o domain.Order
	var totalAmt, depAmt, remAmt float64
	var status string
	err := h.db.QueryRow(query, code).Scan(
		&o.ID, &o.OrderNo, &o.TrackingCode, &o.InternalTrackingCode,
		&o.CourierName, &o.CustomerName, &o.CustomerPhone,
		&totalAmt, &depAmt, &remAmt, &status,
		&o.DeliveryDate, &o.GoogleDriveLink, &o.ProofURL,
		&o.ProofApprovedAt, &o.ProofRejectedAt, &o.ProofSignatureIP, &o.ProofRejectionReason,
		&o.StockDeductedAt, &o.CreatedAt, &o.UpdatedAt,
	)
	if err != nil {
		return nil, false
	}

	o.TotalAmountLAK = int64(totalAmt)
	o.DepositLAK = int64(depAmt)
	o.RemainingLAK = int64(remAmt)
	o.OverallStatus = domain.OrderStatus(status)

	// Fetch Order Items
	itemsQuery := `
		SELECT id, order_id, COALESCE(job_name, ''), COALESCE(item_name, ''), quantity,
		       COALESCE(page_count, 1), COALESCE(paper_size, 'A5'), COALESCE(binding_type, 'NONE'),
		       COALESCE(current_step, 'PENDING'), COALESCE(unit_price_lak, 0), COALESCE(total_price_lak, 0),
		       created_at, updated_at
		FROM order_items
		WHERE order_id = $1`

	rows, err := h.db.Query(itemsQuery, o.ID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var it domain.OrderItem
			var bType, cStep string
			var unitP, totalP float64
			if err := rows.Scan(
				&it.ID, &it.OrderID, &it.JobName, &it.ItemName, &it.Quantity,
				&it.PageCount, &it.PaperSize, &bType,
				&cStep, &unitP, &totalP,
				&it.CreatedAt, &it.UpdatedAt,
			); err == nil {
				it.BindingType = domain.BindingType(bType)
				it.CurrentStep = domain.ProductionStep(cStep)
				it.UnitPriceLAK = int64(unitP)
				it.TotalPriceLAK = int64(totalP)
				o.Items = append(o.Items, it)
			}
		}
	}

	return &o, true
}
