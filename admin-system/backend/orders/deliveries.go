package orders

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

type DeliveryDispatch struct {
	ID             string  `json:"id"`
	OrderID        string  `json:"orderId"`
	OrderNumber    string  `json:"orderNumber,omitempty"`
	CustomerName   string  `json:"customerName,omitempty"`
	CourierID      string  `json:"courierId"`
	CourierName    string  `json:"courierName"`
	TrackingCode   string  `json:"trackingCode,omitempty"`
	ShippingFeeLAK float64 `json:"shippingFeeLAK,omitempty"`
	Status         string  `json:"status"` // 'PENDING_PICKUP', 'IN_TRANSIT', 'DELIVERED'
	DispatchedAt   string  `json:"dispatchedAt,omitempty"`
	DeliveredAt    string  `json:"deliveredAt,omitempty"`
	DriverPhone    string  `json:"driverPhone,omitempty"`
	PODImageUrl    string  `json:"podImageUrl,omitempty"`
	CreatedAt      string  `json:"createdAt"`
}

var (
	deliveryStoreMutex  sync.RWMutex
	deliveryMemoryStore = map[string]DeliveryDispatch{}
)

// HandleGetDeliveries returns delivery dispatch records
func HandleGetDeliveries(c *gin.Context) {
	orderID := c.Query("order_id")

	if db.DB != nil {
		query := `SELECT id, order_id, COALESCE(order_number, ''), COALESCE(customer_name, ''), courier_id, courier_name, COALESCE(tracking_code, ''), shipping_fee_lak, status, dispatched_at, delivered_at, COALESCE(driver_phone, ''), COALESCE(pod_image_url, ''), created_at FROM delivery_dispatches`
		var rows *sql.Rows
		var err error

		if orderID != "" {
			query += ` WHERE order_id = $1 ORDER BY created_at DESC`
			rows, err = db.DB.Query(query, orderID)
		} else {
			query += ` ORDER BY created_at DESC`
			rows, err = db.DB.Query(query)
		}

		if err == nil {
			defer rows.Close()
			var list []DeliveryDispatch
			for rows.Next() {
				var del DeliveryDispatch
				var createdAt time.Time
				var dispatchedAt, deliveredAt sql.NullTime

				err := rows.Scan(&del.ID, &del.OrderID, &del.OrderNumber, &del.CustomerName, &del.CourierID, &del.CourierName, &del.TrackingCode, &del.ShippingFeeLAK, &del.Status, &dispatchedAt, &deliveredAt, &del.DriverPhone, &del.PODImageUrl, &createdAt)
				if err != nil {
					continue
				}
				if dispatchedAt.Valid {
					del.DispatchedAt = dispatchedAt.Time.Format(time.RFC3339)
				}
				if deliveredAt.Valid {
					del.DeliveredAt = deliveredAt.Time.Format(time.RFC3339)
				}
				del.CreatedAt = createdAt.Format(time.RFC3339)
				list = append(list, del)
			}
			if list == nil {
				list = []DeliveryDispatch{}
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
			return
		}
	}

	deliveryStoreMutex.RLock()
	defer deliveryStoreMutex.RUnlock()

	var result []DeliveryDispatch
	for _, del := range deliveryMemoryStore {
		if orderID == "" || del.OrderID == orderID {
			result = append(result, del)
		}
	}
	if result == nil {
		result = []DeliveryDispatch{}
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": result})
}

// HandleSaveDelivery creates a new delivery dispatch record
func HandleSaveDelivery(c *gin.Context) {
	var del DeliveryDispatch
	if err := c.ShouldBindJSON(&del); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if del.ID == "" {
		del.ID = fmt.Sprintf("DEL-%d", time.Now().UnixNano())
	}
	if del.Status == "" {
		del.Status = "PENDING_PICKUP"
	}

	if db.DB != nil {
		var dispVal, delivVal interface{} = nil, nil
		if del.DispatchedAt != "" {
			t, err := time.Parse(time.RFC3339, del.DispatchedAt)
			if err == nil {
				dispVal = t
			}
		}
		if del.DeliveredAt != "" {
			t, err := time.Parse(time.RFC3339, del.DeliveredAt)
			if err == nil {
				delivVal = t
			}
		}

		_, err := db.DB.Exec(`
			INSERT INTO delivery_dispatches (id, order_id, order_number, customer_name, courier_id, courier_name, tracking_code, shipping_fee_lak, status, dispatched_at, delivered_at, driver_phone, pod_image_url, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
			ON CONFLICT (id) DO UPDATE SET
				status = EXCLUDED.status,
				tracking_code = COALESCE(NULLIF(EXCLUDED.tracking_code, ''), delivery_dispatches.tracking_code),
				dispatched_at = COALESCE(EXCLUDED.dispatched_at, delivery_dispatches.dispatched_at),
				delivered_at = COALESCE(EXCLUDED.delivered_at, delivery_dispatches.delivered_at),
				driver_phone = COALESCE(NULLIF(EXCLUDED.driver_phone, ''), delivery_dispatches.driver_phone),
				pod_image_url = COALESCE(NULLIF(EXCLUDED.pod_image_url, ''), delivery_dispatches.pod_image_url)`,
			del.ID, del.OrderID, del.OrderNumber, del.CustomerName, del.CourierID, del.CourierName, del.TrackingCode, del.ShippingFeeLAK, del.Status, dispVal, delivVal, del.DriverPhone, del.PODImageUrl)
		if err != nil {
			log.Printf("[DB ERROR] Failed to save delivery dispatch: %v", err)
		}
	}

	deliveryStoreMutex.Lock()
	deliveryMemoryStore[del.ID] = del
	deliveryStoreMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": del})
}

// HandleUpdateDelivery updates dispatch status and parameters
func HandleUpdateDelivery(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status       string  `json:"status"`
		TrackingCode string  `json:"trackingCode"`
		DriverPhone  string  `json:"driverPhone"`
		PODImageUrl  string  `json:"podImageUrl"`
		DispatchedAt string  `json:"dispatchedAt"`
		DeliveredAt  string  `json:"deliveredAt"`
		ShippingFee  float64 `json:"shippingFeeLAK"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if db.DB != nil {
		var dispVal, delivVal interface{} = nil, nil
		if req.DispatchedAt != "" {
			t, err := time.Parse(time.RFC3339, req.DispatchedAt)
			if err == nil {
				dispVal = t
			}
		}
		if req.DeliveredAt != "" {
			t, err := time.Parse(time.RFC3339, req.DeliveredAt)
			if err == nil {
				delivVal = t
			}
		}

		_, err := db.DB.Exec(`
			UPDATE delivery_dispatches
			SET status = COALESCE(NULLIF($1, ''), status),
			    tracking_code = COALESCE(NULLIF($2, ''), tracking_code),
			    driver_phone = COALESCE(NULLIF($3, ''), driver_phone),
			    pod_image_url = COALESCE(NULLIF($4, ''), pod_image_url),
			    dispatched_at = COALESCE($5, dispatched_at),
			    delivered_at = COALESCE($6, delivered_at),
			    shipping_fee_lak = CASE WHEN $7 > 0 THEN $7 ELSE shipping_fee_lak END
			WHERE id = $8`,
			req.Status, req.TrackingCode, req.DriverPhone, req.PODImageUrl, dispVal, delivVal, req.ShippingFee, id)
		if err != nil {
			log.Printf("[DB ERROR] Failed to update delivery dispatch: %v", err)
		}
	}

	deliveryStoreMutex.Lock()
	if existing, exists := deliveryMemoryStore[id]; exists {
		if req.Status != "" {
			existing.Status = req.Status
		}
		if req.TrackingCode != "" {
			existing.TrackingCode = req.TrackingCode
		}
		if req.DriverPhone != "" {
			existing.DriverPhone = req.DriverPhone
		}
		if req.PODImageUrl != "" {
			existing.PODImageUrl = req.PODImageUrl
		}
		if req.DispatchedAt != "" {
			existing.DispatchedAt = req.DispatchedAt
		}
		if req.DeliveredAt != "" {
			existing.DeliveredAt = req.DeliveredAt
		}
		if req.ShippingFee > 0 {
			existing.ShippingFeeLAK = req.ShippingFee
		}
		deliveryMemoryStore[id] = existing
	}
	deliveryStoreMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "id": id})
}
