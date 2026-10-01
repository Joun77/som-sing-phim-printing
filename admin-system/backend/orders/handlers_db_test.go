package orders

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
	
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"somsing.local/backend/db"
)

func TestHandleGetOrderByOrderNo_DBFixture(t *testing.T) {
	// Setup sqlmock
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer mockDB.Close()

	// Override global db.DB for the scope of this test
	originalDB := db.DB
	db.DB = mockDB
	defer func() { db.DB = originalDB }()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Errorf("there were unfulfilled expectations: %s", err)
		}
	}()

	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.GET("/api/v1/orders/track/:order_no", HandleGetOrderByOrderNo)

	t.Run("Valid Token Lookup", func(t *testing.T) {
		token := "VALID_TOKEN_123"
		
		// The query string to match
		expectedQuery := `SELECT o.id, COALESCE\(o.order_no, ''\), COALESCE\(o.order_number, ''\), COALESCE\(o.status::text, ''\), COALESCE\(o.overall_status, ''\), COALESCE\(o.delivery_date, ''\), COALESCE\(o.customer_name, ''\), o.created_at, o.updated_at, \(SELECT COUNT\(\*\) FROM order_items oi WHERE oi.order_id = o.id\) as item_count FROM orders o WHERE o.public_tracking_token = \$1 AND o.public_tracking_token != '' LIMIT 1`
		
		rows := sqlmock.NewRows([]string{"id", "order_no", "order_number", "status", "overall_status", "delivery_date", "customer_name", "created_at", "updated_at", "item_count"}).
			AddRow("ord-001", "ORD-100", "ORD-100", "IN_PRODUCTION", "IN_PRODUCTION", "2026-10-15", "Somphone Vongsa", time.Now(), time.Now(), 2)
		
		mock.ExpectQuery(expectedQuery).WithArgs(token).WillReturnRows(rows)
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/orders/track/"+token, nil)
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK, got %d", w.Code)
		}
		
		var dto OrderTrackingDTO
		if err := json.Unmarshal(w.Body.Bytes(), &dto); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}
		
		if dto.ItemCount != 2 {
			t.Errorf("Expected ItemCount to be 2, got %d", dto.ItemCount)
		}
		
		if dto.CustomerName != "Som***" {
			t.Errorf("Expected obfuscated CustomerName 'Som***', got '%s'", dto.CustomerName)
		}
	})

	t.Run("Token Not Found (Zero Rows)", func(t *testing.T) {
		token := "INVALID_TOKEN"
		expectedQuery := `SELECT o.id, .* FROM orders o WHERE o.public_tracking_token = \$1`
		
		mock.ExpectQuery(expectedQuery).WithArgs(token).WillReturnError(sql.ErrNoRows)
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/orders/track/"+token, nil)
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusNotFound {
			t.Fatalf("Expected 404 Not Found, got %d", w.Code)
		}
	})

	t.Run("DB Failure", func(t *testing.T) {
		token := "ERROR_TOKEN"
		expectedQuery := `SELECT o.id, .* FROM orders o WHERE o.public_tracking_token = \$1`
		
		mock.ExpectQuery(expectedQuery).WithArgs(token).WillReturnError(sql.ErrConnDone)
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/orders/track/"+token, nil)
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusInternalServerError {
			t.Fatalf("Expected 500 Internal Server Error, got %d", w.Code)
		}
	})
}

func TestHandleIssueTrackingToken_DBFixture(t *testing.T) {
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer mockDB.Close()

	originalDB := db.DB
	db.DB = mockDB
	defer func() { db.DB = originalDB }()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Errorf("there were unfulfilled expectations: %s", err)
		}
	}()

	gin.SetMode(gin.TestMode)
	router := gin.Default()
	
	// Add test auth middleware setup
	// We need a dummy handler to simulate JWT injection or just mock it in tests
	router.Use(func(c *gin.Context) {
		role := c.GetHeader("X-Test-Role")
		if role != "" {
			c.Set("role", role)
		}
		c.Next()
	})
	
	// Define required roles mapping just like in production
	roles := []string{"super_admin", "owner", "store_manager"}
	
	// The middleware RequireRoles expects strings
	router.POST("/api/v1/orders/:id/issue-tracking-token", func(c *gin.Context) {
		r, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}
		roleStr := r.(string)
		allowed := false
		for _, allowedRole := range roles {
			if roleStr == allowedRole {
				allowed = true
				break
			}
		}
		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
			c.Abort()
			return
		}
		c.Next()
	}, HandleIssueTrackingToken)
	
	// Map public tracking to verify the cache changes
	router.GET("/api/v1/orders/track", HandleTrackOrderQuery)

	t.Run("Success Issuance (New Token)", func(t *testing.T) {
		orderID := "ord-123"
		
		mock.ExpectQuery(`UPDATE orders SET public_tracking_token = COALESCE\(NULLIF\(public_tracking_token, ''\), \$1\), updated_at = CASE WHEN NULLIF\(public_tracking_token, ''\) IS NULL THEN NOW\(\) ELSE updated_at END WHERE id = \$2 RETURNING public_tracking_token`).
			WithArgs(sqlmock.AnyArg(), orderID).
			WillReturnRows(sqlmock.NewRows([]string{"public_tracking_token"}).AddRow("new_token_123"))
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/"+orderID+"/issue-tracking-token", nil)
		req.Header.Set("X-Test-Role", "store_manager")
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK, got %d: %s", w.Code, w.Body.String())
		}
		
		var resp map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &resp)
		if resp["public_tracking_token"] != "new_token_123" {
			t.Errorf("Expected new_token_123, got %v", resp["public_tracking_token"])
		}
	})

	t.Run("Repeated Issuance (Existing Token)", func(t *testing.T) {
		orderID := "ord-456"
		
		mock.ExpectQuery(`UPDATE orders SET public_tracking_token = COALESCE\(NULLIF\(public_tracking_token, ''\), \$1\), updated_at = CASE WHEN NULLIF\(public_tracking_token, ''\) IS NULL THEN NOW\(\) ELSE updated_at END WHERE id = \$2 RETURNING public_tracking_token`).
			WithArgs(sqlmock.AnyArg(), orderID).
			WillReturnRows(sqlmock.NewRows([]string{"public_tracking_token"}).AddRow("existing_token_456"))
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/"+orderID+"/issue-tracking-token", nil)
		req.Header.Set("X-Test-Role", "owner")
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK for repeated issuance, got %d: %s", w.Code, w.Body.String())
		}
		
		var resp map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &resp)
		if resp["public_tracking_token"] != "existing_token_456" {
			t.Errorf("Expected existing_token_456, got %v", resp["public_tracking_token"])
		}
	})

	t.Run("Stale Cache Sync from DB", func(t *testing.T) {
		orderID := "ord-stale-1"
		
		// Setup stale cache
		ordersStore[orderID] = Order{
			ID: orderID,
			PublicTrackingToken: "token_A_stale",
		}
		
		// DB has token B
		mock.ExpectQuery(`UPDATE orders SET public_tracking_token = COALESCE\(NULLIF\(public_tracking_token, ''\), \$1\), updated_at = CASE WHEN NULLIF\(public_tracking_token, ''\) IS NULL THEN NOW\(\) ELSE updated_at END WHERE id = \$2 RETURNING public_tracking_token`).
			WithArgs(sqlmock.AnyArg(), orderID).
			WillReturnRows(sqlmock.NewRows([]string{"public_tracking_token"}).AddRow("token_B_db"))
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/"+orderID+"/issue-tracking-token", nil)
		req.Header.Set("X-Test-Role", "owner")
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK, got %d", w.Code)
		}
		
		var resp map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &resp)
		if resp["public_tracking_token"] != "token_B_db" {
			t.Errorf("Expected token_B_db from DB, got %v", resp["public_tracking_token"])
		}
		
		// Verify cache was synced
		if ordersStore[orderID].PublicTrackingToken != "token_B_db" {
			t.Errorf("Cache was not synced, got %v", ordersStore[orderID].PublicTrackingToken)
		}
		
		// Test public GET token B (200) - use memory store for test speed
		// Temporarily set db to nil to force memory store test
		originalDB := db.DB
		db.DB = nil
		
		wGetB := httptest.NewRecorder()
		reqGetB, _ := http.NewRequest("GET", "/api/v1/orders/track?q=token_B_db", nil)
		router.ServeHTTP(wGetB, reqGetB)
		if wGetB.Code != http.StatusOK {
			t.Errorf("Expected public GET for token B to return 200, got %d", wGetB.Code)
		}
		
		wGetA := httptest.NewRecorder()
		reqGetA, _ := http.NewRequest("GET", "/api/v1/orders/track?q=token_A_stale", nil)
		router.ServeHTTP(wGetA, reqGetA)
		if wGetA.Code != http.StatusNotFound {
			t.Errorf("Expected public GET for stale token A to return 404, got %d", wGetA.Code)
		}
		
		db.DB = originalDB
	})

	t.Run("DB Returns Empty Token (Fail Closed)", func(t *testing.T) {
		orderID := "ord-empty-db"
		
		mock.ExpectQuery(`UPDATE orders SET public_tracking_token = COALESCE\(NULLIF\(public_tracking_token, ''\), \$1\), updated_at = CASE WHEN NULLIF\(public_tracking_token, ''\) IS NULL THEN NOW\(\) ELSE updated_at END WHERE id = \$2 RETURNING public_tracking_token`).
			WithArgs(sqlmock.AnyArg(), orderID).
			WillReturnRows(sqlmock.NewRows([]string{"public_tracking_token"}).AddRow(""))
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/"+orderID+"/issue-tracking-token", nil)
		req.Header.Set("X-Test-Role", "owner")
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusInternalServerError {
			t.Fatalf("Expected 500 when DB returns empty token, got %d", w.Code)
		}
	})

	t.Run("Order Not Found", func(t *testing.T) {
		orderID := "ord-999"
		
		mock.ExpectQuery(`UPDATE orders SET public_tracking_token = COALESCE\(NULLIF\(public_tracking_token, ''\), \$1\), updated_at = CASE WHEN NULLIF\(public_tracking_token, ''\) IS NULL THEN NOW\(\) ELSE updated_at END WHERE id = \$2 RETURNING public_tracking_token`).
			WithArgs(sqlmock.AnyArg(), orderID).
			WillReturnError(sql.ErrNoRows)
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/"+orderID+"/issue-tracking-token", nil)
		req.Header.Set("X-Test-Role", "super_admin")
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusNotFound {
			t.Fatalf("Expected 404 Not Found, got %d", w.Code)
		}
	})
	
	t.Run("DB Error on Issuance (No Cache Mutation)", func(t *testing.T) {
		orderID := "ord-error-mutation"
		
		ordersStore[orderID] = Order{
			ID: orderID,
			PublicTrackingToken: "token_clean",
		}

		mock.ExpectQuery(`UPDATE orders SET public_tracking_token = COALESCE\(NULLIF\(public_tracking_token, ''\), \$1\), updated_at = CASE WHEN NULLIF\(public_tracking_token, ''\) IS NULL THEN NOW\(\) ELSE updated_at END WHERE id = \$2 RETURNING public_tracking_token`).
			WithArgs(sqlmock.AnyArg(), orderID).
			WillReturnError(sql.ErrConnDone)
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/"+orderID+"/issue-tracking-token", nil)
		req.Header.Set("X-Test-Role", "owner")
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusInternalServerError {
			t.Fatalf("Expected 500 Internal Server Error, got %d", w.Code)
		}
		
		// Verify cache was not mutated
		if ordersStore[orderID].PublicTrackingToken != "token_clean" {
			t.Errorf("Cache was mutated despite DB error, got %v", ordersStore[orderID].PublicTrackingToken)
		}
	})
	
	t.Run("Unauthorized (No Role)", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/ord-123/issue-tracking-token", nil)
		router.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("Expected 401 Unauthorized, got %d", w.Code)
		}
	})

	t.Run("Forbidden (Sales Role)", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/ord-123/issue-tracking-token", nil)
		req.Header.Set("X-Test-Role", "sales")
		router.ServeHTTP(w, req)
		if w.Code != http.StatusForbidden {
			t.Fatalf("Expected 403 Forbidden, got %d", w.Code)
		}
	})
}

func TestHandleTrackOrderQuery_DBFixture(t *testing.T) {
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer mockDB.Close()

	originalDB := db.DB
	db.DB = mockDB
	defer func() { db.DB = originalDB }()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Errorf("there were unfulfilled expectations: %s", err)
		}
	}()

	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.GET("/api/v1/orders/track", HandleTrackOrderQuery)
	router.GET("/api/orders/track", HandleTrackOrderQuery)

	t.Run("Valid Token Lookup (v1)", func(t *testing.T) {
		token := "VALID_TOKEN_V1"
		
		expectedQuery := `SELECT o.id, COALESCE\(o.order_no, ''\), COALESCE\(o.order_number, ''\), COALESCE\(o.status::text, ''\), COALESCE\(o.overall_status, ''\), COALESCE\(o.delivery_date, ''\), COALESCE\(o.customer_name, ''\), o.created_at, o.updated_at, \(SELECT COUNT\(\*\) FROM order_items oi WHERE oi.order_id = o.id\) as item_count FROM orders o WHERE o.public_tracking_token = \$1 AND o.public_tracking_token != '' LIMIT 1`
		
		rows := sqlmock.NewRows([]string{"id", "order_no", "order_number", "status", "overall_status", "delivery_date", "customer_name", "created_at", "updated_at", "item_count"}).
			AddRow("ord-001", "ORD-100", "ORD-100", "IN_PRODUCTION", "IN_PRODUCTION", "2026-10-15", "Somphone Vongsa", time.Now(), time.Now(), 2)
		
		mock.ExpectQuery(expectedQuery).WithArgs(token).WillReturnRows(rows)
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/orders/track?q="+token, nil)
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK, got %d", w.Code)
		}
	})
	
	t.Run("Valid Token Lookup (legacy)", func(t *testing.T) {
		token := "VALID_TOKEN_LEGACY"
		
		expectedQuery := `SELECT o.id, COALESCE\(o.order_no, ''\), COALESCE\(o.order_number, ''\), COALESCE\(o.status::text, ''\), COALESCE\(o.overall_status, ''\), COALESCE\(o.delivery_date, ''\), COALESCE\(o.customer_name, ''\), o.created_at, o.updated_at, \(SELECT COUNT\(\*\) FROM order_items oi WHERE oi.order_id = o.id\) as item_count FROM orders o WHERE o.public_tracking_token = \$1 AND o.public_tracking_token != '' LIMIT 1`
		
		rows := sqlmock.NewRows([]string{"id", "order_no", "order_number", "status", "overall_status", "delivery_date", "customer_name", "created_at", "updated_at", "item_count"}).
			AddRow("ord-002", "ORD-101", "ORD-101", "IN_PRODUCTION", "IN_PRODUCTION", "2026-10-15", "Somphone Vongsa", time.Now(), time.Now(), 2)
		
		mock.ExpectQuery(expectedQuery).WithArgs(token).WillReturnRows(rows)
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/orders/track?q="+token, nil)
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK, got %d", w.Code)
		}
	})

	t.Run("Token Not Found (Zero Rows)", func(t *testing.T) {
		token := "INVALID_TOKEN"
		expectedQuery := `SELECT o.id, .* FROM orders o WHERE o.public_tracking_token = \$1`
		
		mock.ExpectQuery(expectedQuery).WithArgs(token).WillReturnError(sql.ErrNoRows)
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/orders/track?q="+token, nil)
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusNotFound {
			t.Fatalf("Expected 404 Not Found, got %d", w.Code)
		}
	})

	t.Run("DB Failure", func(t *testing.T) {
		token := "ERROR_TOKEN"
		expectedQuery := `SELECT o.id, .* FROM orders o WHERE o.public_tracking_token = \$1`
		
		mock.ExpectQuery(expectedQuery).WithArgs(token).WillReturnError(sql.ErrConnDone)
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/orders/track?q="+token, nil)
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusInternalServerError {
			t.Fatalf("Expected 500 Internal Server Error, got %d", w.Code)
		}
	})
}
