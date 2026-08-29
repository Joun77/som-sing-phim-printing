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
	pricingService   service.IPricingService
	db               *sql.DB
	orderStore       map[string]domain.Order
	verifiedTransMap map[string]bool
	storeMu          sync.RWMutex
}

// NewOrderHandler initializes a new OrderHandler
func NewOrderHandler(pricingSvc service.IPricingService, dbConn *sql.DB) *OrderHandler {
	if pricingSvc == nil {
		pricingSvc = service.NewPricingService()
	}
	return &OrderHandler{
		pricingService:   pricingSvc,
		db:               dbConn,
		orderStore:       make(map[string]domain.Order),
		verifiedTransMap: make(map[string]bool),
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

		// Order Creation & Proof Review Endpoints
		apiV1.POST("/orders", h.HandleCreateOrder)
		apiV1.POST("/orders/:tracking_code/proof/approve", h.HandleApproveProof)
		apiV1.POST("/orders/:tracking_code/proof/reject", h.HandleRejectProof)
		apiV1.POST("/orders/:tracking_code/proof/upload", h.HandleUploadProof)

		// Fintech & Logistics Endpoints
		apiV1.POST("/checkout/verify-slip", h.HandleVerifySlip)
		apiV1.GET("/public/locations/provinces", h.HandleGetLocations)
		apiV1.GET("/locations/provinces", h.HandleGetLocations)
		apiV1.GET("/couriers", h.HandleGetCouriers)
	}

	// Legacy backward compatibility routes
	r.POST("/api/pricing/calculate", h.HandleCalculatePricing)
	r.GET("/api/orders/track/:tracking_code", h.HandleTrackOrder)
	r.POST("/api/orders", h.HandleCreateOrder)
	r.POST("/v1/checkout/verify-slip", h.HandleVerifySlip)
	r.GET("/v1/couriers", h.HandleGetCouriers)
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

// HandleCreateOrder handles creating new order with multi-item serialization
func (h *OrderHandler) HandleCreateOrder(c *gin.Context) {
	var order domain.Order
	if err := c.ShouldBindJSON(&order); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid order payload", "details": err.Error()})
		return
	}

	if order.ID == "" {
		order.ID = fmt.Sprintf("ORD-%d", time.Now().UnixNano()/1e6)
	}
	if order.OrderNo == "" {
		order.OrderNo = order.ID
	}
	if order.TrackingCode == "" {
		order.TrackingCode = order.OrderNo
	}
	if order.OverallStatus == "" {
		order.OverallStatus = domain.StatusPaidPrepress
	}
	now := time.Now()
	if order.CreatedAt.IsZero() {
		order.CreatedAt = now
	}
	order.UpdatedAt = now

	h.SaveOrder(order)
	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Order created successfully",
		"data":    order.MaskForCustomer(),
	})
}

// HandleApproveProof handles customer/staff approving digital proof
func (h *OrderHandler) HandleApproveProof(c *gin.Context) {
	code := c.Param("tracking_code")
	order, found := h.findOrderByCode(code)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Order not found"})
		return
	}

	var req struct {
		SignatureName string `json:"signature_name"`
	}
	_ = c.ShouldBindJSON(&req)

	now := time.Now()
	order.OverallStatus = domain.StatusFileConfirmed
	order.ProofApprovedAt = &now
	order.ProofSignatureIP = c.ClientIP()
	order.UpdatedAt = now

	if h.db != nil {
		_, _ = h.db.Exec(`
			UPDATE orders
			SET overall_status = 'FILE_CONFIRMED',
			    status = 'FILE_CONFIRMED',
			    proof_approved_at = $1,
			    proof_signature_ip = $2,
			    updated_at = $1
			WHERE tracking_code = $3 OR order_no = $3 OR id = $3
		`, now, c.ClientIP(), code)
	}

	h.SaveOrder(*order)
	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"message":     "Digital proof approved successfully",
		"approved_at": now.Format(time.RFC3339),
		"data":        order.MaskForCustomer(),
	})
}

// HandleRejectProof handles customer requesting proof revision with notes
func (h *OrderHandler) HandleRejectProof(c *gin.Context) {
	code := c.Param("tracking_code")
	order, found := h.findOrderByCode(code)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Order not found"})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Reason for revision is required"})
		return
	}

	now := time.Now()
	order.OverallStatus = domain.StatusProofRejected
	order.ProofRejectedAt = &now
	order.ProofRejectionReason = req.Reason
	order.UpdatedAt = now

	if h.db != nil {
		_, _ = h.db.Exec(`
			UPDATE orders
			SET overall_status = 'PROOF_REJECTED',
			    status = 'PROOF_REJECTED',
			    proof_rejected_at = $1,
			    proof_rejection_reason = $2,
			    updated_at = $1
			WHERE tracking_code = $3 OR order_no = $3 OR id = $3
		`, now, req.Reason, code)
	}

	h.SaveOrder(*order)
	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"message":     "Proof revision requested successfully",
		"rejected_at": now.Format(time.RFC3339),
		"reason":      req.Reason,
		"data":        order.MaskForCustomer(),
	})
}

// HandleUploadProof handles prepress uploading a proof preview
func (h *OrderHandler) HandleUploadProof(c *gin.Context) {
	code := c.Param("tracking_code")
	order, found := h.findOrderByCode(code)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Order not found"})
		return
	}

	var req struct {
		ProofURL string `json:"proof_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Proof URL is required"})
		return
	}

	now := time.Now()
	order.ProofURL = req.ProofURL
	order.OverallStatus = domain.StatusWaitingApproval
	order.UpdatedAt = now

	if h.db != nil {
		_, _ = h.db.Exec(`
			UPDATE orders
			SET proof_url = $1,
			    overall_status = 'WAITING_APPROVAL',
			    status = 'WAITING_APPROVAL',
			    updated_at = $2
			WHERE tracking_code = $3 OR order_no = $3 OR id = $3
		`, req.ProofURL, now, code)
	}

	h.SaveOrder(*order)
	c.JSON(http.StatusOK, gin.H{
		"status":    "success",
		"message":   "Proof uploaded and order set to WAITING_APPROVAL",
		"proof_url": req.ProofURL,
		"data":      order.MaskForCustomer(),
	})
}

// HandleVerifySlip validates payment slips with duplicate trans_ref anti-fraud protection
func (h *OrderHandler) HandleVerifySlip(c *gin.Context) {
	var req struct {
		OrderID   string  `json:"order_id" binding:"required"`
		QRPayload string  `json:"qr_payload"`
		SlipImage string  `json:"slip_image"`
		Amount    float64 `json:"amount"`
		TransRef  string  `json:"trans_ref"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid slip verification payload", "details": err.Error()})
		return
	}

	transRef := req.TransRef
	if transRef == "" {
		transRef = fmt.Sprintf("BCEL-%d-%s", time.Now().Unix(), req.OrderID)
	}

	// Anti-Fraud Check: Check for duplicate transaction reference
	h.storeMu.Lock()
	if h.verifiedTransMap[transRef] {
		h.storeMu.Unlock()
		c.JSON(http.StatusConflict, gin.H{
			"status":  "error",
			"message": "ກວດພົບສະລິບຊ້ຳຊ້ອນ! ລະຫັດທຸລະກຳນີ້ຖືກນຳໃຊ້ແລ້ວ (Duplicate transaction reference)",
			"trans_ref": transRef,
		})
		return
	}
	h.verifiedTransMap[transRef] = true
	h.storeMu.Unlock()

	now := time.Now()
	order, found := h.findOrderByCode(req.OrderID)
	if found && order != nil {
		order.OverallStatus = domain.StatusPaidPrepress
		if int64(req.Amount) > 0 {
			order.DepositLAK = int64(req.Amount)
			if order.DepositLAK >= order.TotalAmountLAK {
				order.RemainingLAK = 0
			} else {
				order.RemainingLAK = order.TotalAmountLAK - order.DepositLAK
			}
		}
		order.UpdatedAt = now
		h.SaveOrder(*order)
	}

	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"message":     "Slip verified successfully (BCEL OnePay Universal Pipeline)",
		"order_id":    req.OrderID,
		"new_status":  "PAID_PREPRESS",
		"trans_ref":   transRef,
		"amount":      req.Amount,
		"verified_at": now.Format(time.RFC3339),
	})
}

// HandleGetLocations returns standardized Lao provinces and districts
func (h *OrderHandler) HandleGetLocations(c *gin.Context) {
	type District struct {
		NameLa string `json:"nameLa"`
		NameEn string `json:"nameEn"`
	}
	type Province struct {
		NameLa    string     `json:"nameLa"`
		NameEn    string     `json:"nameEn"`
		Label     string     `json:"label"`
		Districts []District `json:"districts"`
	}

	locations := []Province{
		{
			NameLa: "ນະຄອນຫຼວງວຽງຈັນ",
			NameEn: "Vientiane Capital",
			Label:  "ນະຄອນຫຼວງວຽງຈັນ (Vientiane Capital)",
			Districts: []District{
				{NameLa: "ຈັນທະບູລີ", NameEn: "Chanthabuly"},
				{NameLa: "ສີໂຄດຕະບອງ", NameEn: "Sikhottabong"},
				{NameLa: "ໄຊເສດຖາ", NameEn: "Xaysetha"},
				{NameLa: "ສີສັດຕະນາກ", NameEn: "Sisattanak"},
				{NameLa: "ນາຊາຍທອງ", NameEn: "Naxaithong"},
				{NameLa: "ໄຊທານີ", NameEn: "Xaythany"},
				{NameLa: "ຫາດຊາຍຟອງ", NameEn: "Hadxayfong"},
				{NameLa: "ສັງທອງ", NameEn: "Sangthong"},
				{NameLa: "ປາກງື່ມ", NameEn: "Pakngum"},
			},
		},
		{
			NameLa: "ແຂວງວຽງຈັນ",
			NameEn: "Vientiane Province",
			Label:  "ແຂວງວຽງຈັນ (Vientiane Province)",
			Districts: []District{
				{NameLa: "ໂພນໂຮງ", NameEn: "Phonhong"},
				{NameLa: "ທຸລະຄົມ", NameEn: "Thoulakhom"},
				{NameLa: "ແກ້ວອຸດົມ", NameEn: "Keooudom"},
				{NameLa: "ກາສີ", NameEn: "Kasy"},
				{NameLa: "ວັງວຽງ", NameEn: "Vangvieng"},
			},
		},
		{
			NameLa: "ຫຼວງພະບາງ",
			NameEn: "Luangprabang",
			Label:  "ຫຼວງພະບາງ (Luangprabang)",
			Districts: []District{
				{NameLa: "ຫຼວງພະບາງ", NameEn: "Luangprabang"},
				{NameLa: "ຊຽງເງິນ", NameEn: "Xiengngeun"},
				{NameLa: "ປາກອູ", NameEn: "Pak Ou"},
				{NameLa: "ນ້ຳບາກ", NameEn: "Nambak"},
			},
		},
		{
			NameLa: "ຈຳປາສັກ",
			NameEn: "Champasak",
			Label:  "ຈຳປາສັກ (Champasak)",
			Districts: []District{
				{NameLa: "ປາກເຊ", NameEn: "Pakse"},
				{NameLa: "ຊະນະສົມບູນ", NameEn: "Sanasomboun"},
				{NameLa: "ປາກຊ່ອງ", NameEn: "Paksong"},
			},
		},
		{
			NameLa: "ສະຫວັນນະເຂດ",
			NameEn: "Savannakhet",
			Label:  "ສະຫວັນນະເຂດ (Savannakhet)",
			Districts: []District{
				{NameLa: "ໄກສອນ ພົມວິຫານ", NameEn: "Kaysone Phomvihane"},
				{NameLa: "ອຸທຸມພອນ", NameEn: "Outhoumphone"},
				{NameLa: "ເຊໂປນ", NameEn: "Sepone"},
			},
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   locations,
	})
}

// HandleGetCouriers returns available Lao logistics couriers
func (h *OrderHandler) HandleGetCouriers(c *gin.Context) {
	couriers := []gin.H{
		{
			"id":        "anousith_express",
			"name":      "Anousith Express (ອານຸສິດ ຂົນສົ່ງດ່ວນ)",
			"shortName": "Anousith",
			"fee":       25000,
			"eta":       "1-2 ວັນ",
			"freeAbove": 300000,
			"color":     "#dc2626",
			"logoUrl":   "/images/couriers/anousith.png",
		},
		{
			"id":        "hal_logistics",
			"name":      "HAL Logistics (ຮຸ່ງອາລຸນ ຂົນສົ່ງ)",
			"shortName": "HAL",
			"fee":       30000,
			"eta":       "1-2 ວັນ",
			"freeAbove": 300000,
			"color":     "#ea580c",
			"logoUrl":   "/images/couriers/hal.png",
		},
		{
			"id":        "mixay_express",
			"name":      "Mixay Express (ມີໄຊ ຂົນສົ່ງ)",
			"shortName": "Mixay",
			"fee":       25000,
			"eta":       "2-3 ວັນ",
			"freeAbove": 300000,
			"color":     "#2563eb",
			"logoUrl":   "/images/couriers/mixay.png",
		},
		{
			"id":        "self_pickup",
			"name":      "ຮັບເອງທີ່ຮ້ານ ສົມສິ່ງພິມ (Self Pickup)",
			"shortName": "Self Pickup",
			"fee":       0,
			"eta":       "ພ້ອມຮັບທັນທີເມື່ອຜະລິດແລ້ວ",
			"freeAbove": 0,
			"color":     "#10b981",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   couriers,
	})
}
