package orders

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"somsing.local/backend/db"
	"somsing.local/backend/notifications"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// ProofClaims custom JWT claims for proof URL token
type ProofClaims struct {
	OrderID string `json:"order_id"`
	jwt.RegisteredClaims
}

func getProofSecret() []byte {
	secret := os.Getenv("PROOF_JWT_SECRET")
	if secret == "" {
		secret = "som-sing-phim-proof-secret-2026"
	}
	return []byte(secret)
}

// GenerateProofToken generates a 48-hour signed token for customer digital proof review
func GenerateProofToken(orderID string) (string, error) {
	claims := ProofClaims{
		OrderID: orderID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(48 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   orderID,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getProofSecret())
}

// ValidateProofToken validates token signature and expiry
func ValidateProofToken(orderID, tokenString string) (*ProofClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &ProofClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return getProofSecret(), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*ProofClaims); ok && token.Valid {
		if claims.OrderID != orderID {
			return nil, errors.New("token order ID does not match")
		}
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// PublicProofDetails represents sanitized customer-facing order proof payload
type PublicProofDetails struct {
	OrderID       string `json:"order_id"`
	OrderNo       string `json:"order_no"`
	CustomerName  string `json:"customer_name"`
	ProofURL      string `json:"proof_url"`
	Status        string `json:"status"`
	ItemName      string `json:"item_name"`
	Quantity      int    `json:"quantity"`
	ExpiresAt     string `json:"expires_at"`
}

// HandleGetProofDetails handles public retrieval of proof details
func HandleGetProofDetails(c *gin.Context) {
	orderID := c.Param("order_id")
	token := c.Param("token")

	claims, err := ValidateProofToken(orderID, token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "ລິ້ງກວດສອບ Proof ໝົດອາຍຸ ຫຼື ບໍ່ຖືກຕ້ອງ (Token expired or invalid)",
		})
		return
	}

	var proof PublicProofDetails
	proof.OrderID = orderID
	proof.ExpiresAt = claims.ExpiresAt.Time.Format(time.RFC3339)

	if db.DB != nil {
		err := db.DB.QueryRow(`
			SELECT 
				COALESCE(order_no, order_number, id) AS order_no,
				COALESCE(customer_name, 'Customer'),
				COALESCE(proof_url, artwork_file_url, ''),
				COALESCE(status, 'WAITING_APPROVAL'),
				COALESCE(item_name, 'Print Artwork'),
				COALESCE(quantity, 1)
			FROM orders
			WHERE id = $1 OR order_no = $1
			LIMIT 1
		`, orderID).Scan(
			&proof.OrderNo,
			&proof.CustomerName,
			&proof.ProofURL,
			&proof.Status,
			&proof.ItemName,
			&proof.Quantity,
		)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Order not found"})
			return
		}
	} else {
		proof.OrderNo = orderID
		proof.CustomerName = "Direct Customer"
		proof.ProofURL = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000"
		proof.Status = "WAITING_APPROVAL"
		proof.ItemName = "Sample Brochure"
		proof.Quantity = 500
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": proof})
}

// HandleApproveProof handles customer approval of proof
func HandleApproveProof(c *gin.Context) {
	orderID := c.Param("order_id")
	token := c.Param("token")

	if _, err := ValidateProofToken(orderID, token); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Token expired or invalid"})
		return
	}

	if db.DB != nil {
		_, err := db.DB.Exec(`
			UPDATE orders
			SET status = 'READY_TO_PRINT',
			    overall_status = 'READY_TO_PRINT',
			    proof_approved_at = NOW(),
			    updated_at = NOW()
			WHERE id = $1 OR order_no = $1
		`, orderID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to update order status"})
			return
		}
	}

	// Dispatch non-blocking admin notification
	notifications.DispatchAsync(notifications.NotificationEvent{
		Type:      notifications.EventFileConfirmed,
		OrderID:   orderID,
		OrderNo:   orderID,
		ExtraInfo: "Customer approved digital proof via link",
	})

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Digital proof approved successfully. Proceeding to print queue.",
	})
}

// HandleRejectProof handles customer rejection of proof
func HandleRejectProof(c *gin.Context) {
	orderID := c.Param("order_id")
	token := c.Param("token")

	if _, err := ValidateProofToken(orderID, token); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Token expired or invalid"})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Reason is required"})
		return
	}

	if db.DB != nil {
		_, err := db.DB.Exec(`
			UPDATE orders
			SET status = 'PROOF_REJECTED',
			    overall_status = 'PROOF_REJECTED',
			    notes = COALESCE(notes, '') || ' [Proof Rejected: ' || $2 || ']',
			    updated_at = NOW()
			WHERE id = $1 OR order_no = $1
		`, orderID, req.Reason)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to update order"})
			return
		}
	}

	// Dispatch non-blocking admin notification
	notifications.DispatchAsync(notifications.NotificationEvent{
		Type:      notifications.EventFileConfirmed,
		OrderID:   orderID,
		OrderNo:   orderID,
		ExtraInfo: fmt.Sprintf("⚠️ Digital Proof Rejected by customer: %s", req.Reason),
	})

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Proof rejection recorded. Pre-press team notified.",
	})
}

// HandleSendProof dispatches a prepress proof to customer (POST /api/orders/:id/send-proof)
func HandleSendProof(c *gin.Context) {
	id := c.Param("id")
	var req SendProofRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid send-proof payload", "details": err.Error()})
		return
	}

	token, _ := GenerateProofToken(id)
	now := time.Now()

	storeMutex.Lock()
	order, exists := ordersStore[id]
	if exists {
		order.ProofURL = req.ProofURL
		order.DigitalProofURL = req.ProofURL
		order.PrepressNotes = req.PrepressNotes
		order.ProofVersion++
		order.ProofStatus = "PENDING_CUSTOMER"
		order.Status = StatusWaitingApproval
		order.OverallStatus = StatusWaitingApproval
		order.UpdatedAt = now
		ordersStore[id] = order
	}
	storeMutex.Unlock()

	if db.DB != nil {
		_ = db.RunInTransaction(func(tx *sql.Tx) error {
			updateQuery := `
				UPDATE orders 
				SET proof_url = $1, digital_proof_url = $1, prepress_notes = $2,
				    proof_version = COALESCE(proof_version, 0) + 1,
				    proof_status = 'PENDING_CUSTOMER',
				    status = 'WAITING_APPROVAL', overall_status = 'WAITING_APPROVAL', updated_at = NOW()
				WHERE id = $3 OR order_no = $3 OR order_number = $3
			`
			_, err := tx.Exec(updateQuery, req.ProofURL, req.PrepressNotes, id)
			return err
		})
	}

	publicURL := fmt.Sprintf("/proof-review?orderId=%s&token=%s", id, token)

	// Trigger notifications
	notifications.DispatchAsync(notifications.NotificationEvent{
		Type:      notifications.EventFileConfirmed,
		OrderID:   id,
		OrderNo:   id,
		ExtraInfo: fmt.Sprintf("Digital proof v%d dispatched to customer: %s", order.ProofVersion, publicURL),
	})

	c.JSON(http.StatusOK, gin.H{
		"status":           "success",
		"message":          "Digital proof dispatched to customer",
		"order_id":         id,
		"proof_url":        req.ProofURL,
		"proof_version":    order.ProofVersion,
		"proof_token":      token,
		"public_proof_url": publicURL,
	})
}

// HandleProofAction handles customer approve/reject decision (POST /api/orders/:id/proof-action)
func HandleProofAction(c *gin.Context) {
	id := c.Param("id")
	var req ProofActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid proof action payload", "details": err.Error()})
		return
	}

	clientIP := c.ClientIP()
	now := time.Now()

	storeMutex.Lock()
	order, exists := ordersStore[id]
	if exists {
		order.ProofActionAt = &now
		order.ProofFeedback = req.Feedback
		order.ProofSignatureIP = clientIP

		if req.Action == "APPROVE" {
			order.ProofStatus = "APPROVED"
			order.ProofApprovedAt = &now
			order.Status = StatusFileConfirmed
			order.OverallStatus = StatusFileConfirmed
		} else {
			order.ProofStatus = "REJECTED"
			order.ProofRejectedAt = &now
			order.ProofRejectionReason = req.Feedback
			order.Status = StatusPrepressCheck
			order.OverallStatus = StatusPrepressCheck
		}
		order.UpdatedAt = now
		ordersStore[id] = order
	}
	storeMutex.Unlock()

	if db.DB != nil {
		_ = db.RunInTransaction(func(tx *sql.Tx) error {
			if req.Action == "APPROVE" {
				updateQuery := `
					UPDATE orders 
					SET proof_approved_at = NOW(), proof_action_at = NOW(), proof_signature_ip = $1,
					    proof_status = 'APPROVED', proof_feedback = $2,
					    status = 'FILE_CONFIRMED', overall_status = 'FILE_CONFIRMED', updated_at = NOW()
					WHERE id = $3 OR order_no = $3 OR order_number = $3
				`
				_, err := tx.Exec(updateQuery, clientIP, req.Feedback, id)
				return err
			} else {
				updateQuery := `
					UPDATE orders 
					SET proof_rejected_at = NOW(), proof_action_at = NOW(), proof_signature_ip = $1,
					    proof_rejection_reason = $2, proof_feedback = $2,
					    proof_status = 'REJECTED',
					    status = 'PREPRESS_CHECK', overall_status = 'PREPRESS_CHECK', updated_at = NOW()
					WHERE id = $3 OR order_no = $3 OR order_number = $3
				`
				_, err := tx.Exec(updateQuery, clientIP, req.Feedback, id)
				return err
			}
		})
	}

	// Dispatch notification
	notifications.DispatchAsync(notifications.NotificationEvent{
		Type:      notifications.EventFileConfirmed,
		OrderID:   id,
		OrderNo:   id,
		ExtraInfo: fmt.Sprintf("Proof action: %s - status: %s", req.Action, order.Status),
	})

	c.JSON(http.StatusOK, gin.H{
		"status":       "success",
		"message":      fmt.Sprintf("Proof action %s processed successfully", req.Action),
		"order_id":     id,
		"action":       req.Action,
		"proof_status": order.ProofStatus,
		"new_status":   string(order.Status),
	})
}
