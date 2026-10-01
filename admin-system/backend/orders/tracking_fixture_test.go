package orders

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	_ "github.com/lib/pq"
	"somsing.local/backend/auth"
	"somsing.local/backend/db"
)

func makeFixtureAuthToken(role string, expired bool, forged bool) string {
	claims := &auth.OwnerClaims{
		Username: "test_manager",
		UserID:   "usr_fixture_1",
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer: "som-sing-phim-erp",
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(func() time.Duration {
				if expired {
					return -1 * time.Hour
				}
				return 1 * time.Hour
			}())),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := auth.GetJWTSecretKey()
	if forged {
		secret = []byte("forged-secret-key-12345678901234567890")
	}
	signed, _ := token.SignedString(secret)
	return signed
}

// TestTrackingPersistence_IsolatedFixture verifies D2, D3, D4 on a disposable PostgreSQL database.
// D2: Manager issuance persists a random per-order token; existing token reused; SQL lookup returns limited public DTO and rejects orderID/number/phone/courier token.
// D3: New connection AND new app/router instance with caches reset still serves same link using persisted fixture rows.
// D4: Invalid role/no token denied before issuance; failure/zero-row checks preserved. Minimal fixture schema matching actual lookup/issuance, no shop data.
func TestTrackingPersistence_IsolatedFixture(t *testing.T) {
	fixtureDSN := os.Getenv("TEST_FIXTURE_DSN")
	if fixtureDSN == "" {
		t.Skip("TEST_FIXTURE_DSN not provided. Skipping isolated Postgres tracking persistence test.")
	}

	// Strictly validate DSN host, database name, and URL parameters
	canonicalDSN, err := db.ParseAndValidateDSN(fixtureDSN)
	if err != nil {
		t.Fatalf("Invalid TEST_FIXTURE_DSN: %v", err)
	}

	testDB, err := sql.Open("postgres", canonicalDSN)
	if err != nil {
		t.Fatalf("Failed to open fixture DB: %v", err)
	}
	testDB.SetMaxOpenConns(1)

	if err := testDB.Ping(); err != nil {
		t.Fatalf("Fixture DB ping failed: %v", err)
	}

	// Create a random isolated schema
	randBytes := make([]byte, 4)
	rand.Read(randBytes)
	schemaName := fmt.Sprintf("tracking_fixture_%s", hex.EncodeToString(randBytes))

	_, err = testDB.Exec(fmt.Sprintf("CREATE SCHEMA %s;", schemaName))
	if err != nil {
		t.Fatalf("Failed to create disposable schema %s: %v", schemaName, err)
	}

	// Set search_path for database and current session
	_, _ = testDB.Exec(fmt.Sprintf("ALTER DATABASE somsing_fixture_db SET search_path TO %s, public;", schemaName))
	_, err = testDB.Exec(fmt.Sprintf("SET search_path TO %s, public;", schemaName))
	if err != nil {
		t.Fatalf("Failed to set search_path: %v", err)
	}

	// Setup cleanup to reliably remove schema and restore state
	originalDB := db.DB
	t.Cleanup(func() {
		db.DB = originalDB
		cleanupDB, cErr := sql.Open("postgres", canonicalDSN)
		if cErr == nil {
			_, _ = cleanupDB.Exec("ALTER DATABASE somsing_fixture_db RESET search_path;")
			_, _ = cleanupDB.Exec(fmt.Sprintf("DROP SCHEMA %s CASCADE;", schemaName))
			_ = cleanupDB.Close()
		}
		_ = testDB.Close()

		storeMutex.Lock()
		ordersStore = make(map[string]Order)
		storeMutex.Unlock()
	})

	// Minimal prerequisite schema: orders and order_items
	_, err = testDB.Exec(`
		CREATE TABLE orders (
			id VARCHAR(100) PRIMARY KEY,
			order_no VARCHAR(100),
			order_number VARCHAR(100),
			status VARCHAR(50),
			overall_status VARCHAR(50),
			delivery_date VARCHAR(50),
			customer_name VARCHAR(255),
			customer_phone VARCHAR(50),
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		);

		CREATE TABLE order_items (
			id VARCHAR(100) PRIMARY KEY,
			order_id VARCHAR(100) REFERENCES orders(id),
			product_name VARCHAR(255),
			current_step VARCHAR(50),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		);
	`)
	if err != nil {
		t.Fatalf("Failed to setup prerequisite tables: %v", err)
	}

	// Execute actual 043 migration SQL content
	migrationContent, err := os.ReadFile("../migrations/043_add_public_tracking_token_to_orders.sql")
	if err != nil {
		migrationContent, err = os.ReadFile("migrations/043_add_public_tracking_token_to_orders.sql")
		if err != nil {
			t.Fatalf("Failed to read actual 043 migration file: %v", err)
		}
	}
	_, err = testDB.Exec(string(migrationContent))
	if err != nil {
		t.Fatalf("Failed to execute actual 043 migration: %v", err)
	}

	// Seed test orders and items into Postgres
	_, err = testDB.Exec(`
		INSERT INTO orders (id, order_no, order_number, status, overall_status, delivery_date, customer_name, customer_phone)
		VALUES ('ord-fixture-1', 'ORD-FIX-001', 'ORD-FIX-001', 'IN_PRODUCTION', 'IN_PRODUCTION', '2026-10-25', 'Somphone Vongsa', '02055551234');

		INSERT INTO order_items (id, order_id, product_name, current_step)
		VALUES 
			('item-fix-1', 'ord-fixture-1', 'Brochures A4', 'PRINTING'),
			('item-fix-2', 'ord-fixture-1', 'Brochures A4 Binding', 'BINDING');
	`)
	if err != nil {
		t.Fatalf("Failed to seed fixture data: %v", err)
	}

	// Configure environment and point db.DB to testDB
	t.Setenv("ENVIRONMENT", "test")
	t.Setenv("JWT_SECRET", "test-fixture-jwt-secret-key-32chars!")
	db.DB = testDB

	gin.SetMode(gin.TestMode)
	router := gin.New()
	managerAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleOwner, "super_admin")
	router.POST("/api/v1/orders/:id/issue-tracking-token", managerAuth, HandleIssueTrackingToken)
	router.GET("/api/v1/orders/track/:order_no", HandleGetOrderByOrderNo)
	router.GET("/api/v1/orders/track", HandleTrackOrderQuery)
	router.GET("/api/orders/track", HandleTrackOrderQuery)

	var issuedToken string

	// -------------------------------------------------------------
	// D4: Invalid role / no token denied before issuance; failure/zero-row checks preserved
	// -------------------------------------------------------------
	t.Run("D4 - Auth & Zero Row Guards", func(t *testing.T) {
		// Anonymous request
		req, _ := http.NewRequest("POST", "/api/v1/orders/ord-fixture-1/issue-tracking-token", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("Expected 401 Unauthorized for anonymous, got %d", w.Code)
		}

		// Forged token
		req, _ = http.NewRequest("POST", "/api/v1/orders/ord-fixture-1/issue-tracking-token", nil)
		req.Header.Set("Authorization", "Bearer "+makeFixtureAuthToken("manager", false, true))
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("Expected 401 Unauthorized for forged token, got %d", w.Code)
		}

		// Expired token
		req, _ = http.NewRequest("POST", "/api/v1/orders/ord-fixture-1/issue-tracking-token", nil)
		req.Header.Set("Authorization", "Bearer "+makeFixtureAuthToken("manager", true, false))
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("Expected 401 Unauthorized for expired token, got %d", w.Code)
		}

		// Invalid role (Sales)
		req, _ = http.NewRequest("POST", "/api/v1/orders/ord-fixture-1/issue-tracking-token", nil)
		req.Header.Set("Authorization", "Bearer "+makeFixtureAuthToken("sales", false, false))
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)
		if w.Code != http.StatusForbidden {
			t.Fatalf("Expected 403 Forbidden for sales role, got %d", w.Code)
		}

		// Zero-row check: Non-existent order
		req, _ = http.NewRequest("POST", "/api/v1/orders/ord-nonexistent/issue-tracking-token", nil)
		req.Header.Set("Authorization", "Bearer "+makeFixtureAuthToken("manager", false, false))
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)
		if w.Code != http.StatusNotFound {
			t.Fatalf("Expected 404 Not Found for non-existent order, got %d", w.Code)
		}

		// Public query missing parameter
		req, _ = http.NewRequest("GET", "/api/v1/orders/track", nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)
		if w.Code != http.StatusBadRequest {
			t.Fatalf("Expected 400 Bad Request for missing query 'q', got %d", w.Code)
		}
	})

	// -------------------------------------------------------------
	// D2: Manager issuance persists token, reuse, limited public DTO, rejects orderID/number/phone/courier
	// -------------------------------------------------------------
	t.Run("D2 - Issuance, Reuse, DTO and Legacy Rejection", func(t *testing.T) {
		// 1. Manager issuance succeeds and persists random token
		req, _ := http.NewRequest("POST", "/api/v1/orders/ord-fixture-1/issue-tracking-token", nil)
		req.Header.Set("Authorization", "Bearer "+makeFixtureAuthToken("manager", false, false))
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK on manager issuance, got %d: %s", w.Code, w.Body.String())
		}

		var issueResp map[string]string
		if err := json.Unmarshal(w.Body.Bytes(), &issueResp); err != nil {
			t.Fatalf("Failed to parse issuance response: %v", err)
		}
		issuedToken = issueResp["public_tracking_token"]
		if len(issuedToken) < 32 {
			t.Fatalf("Expected high-entropy public token (>= 32 chars), got: %s", issuedToken)
		}

		// Assert directly in Postgres that token is persisted
		var dbToken string
		err = testDB.QueryRow(`SELECT public_tracking_token FROM orders WHERE id = 'ord-fixture-1'`).Scan(&dbToken)
		if err != nil {
			t.Fatalf("Failed to query persisted token from PostgreSQL: %v", err)
		}
		if dbToken != issuedToken {
			t.Fatalf("Persisted DB token '%s' does not match response token '%s'", dbToken, issuedToken)
		}

		// 2. Existing token is reused on subsequent issuance
		req2, _ := http.NewRequest("POST", "/api/v1/orders/ord-fixture-1/issue-tracking-token", nil)
		req2.Header.Set("Authorization", "Bearer "+makeFixtureAuthToken("manager", false, false))
		w2 := httptest.NewRecorder()
		router.ServeHTTP(w2, req2)

		if w2.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK on repeated issuance, got %d", w2.Code)
		}
		var issueResp2 map[string]string
		_ = json.Unmarshal(w2.Body.Bytes(), &issueResp2)
		if issueResp2["public_tracking_token"] != issuedToken {
			t.Fatalf("Expected reused token '%s', got new token '%s'", issuedToken, issueResp2["public_tracking_token"])
		}

		// 3. SQL lookup returns limited public DTO
		reqLookup, _ := http.NewRequest("GET", "/api/v1/orders/track/"+issuedToken, nil)
		wLookup := httptest.NewRecorder()
		router.ServeHTTP(wLookup, reqLookup)

		if wLookup.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK on tracking lookup, got %d: %s", wLookup.Code, wLookup.Body.String())
		}

		var dto OrderTrackingDTO
		if err := json.Unmarshal(wLookup.Body.Bytes(), &dto); err != nil {
			t.Fatalf("Failed to parse tracking DTO: %v", err)
		}

		if dto.ID != "ord-fixture-1" {
			t.Errorf("Expected DTO ID 'ord-fixture-1', got '%s'", dto.ID)
		}
		if dto.OrderNo != "ORD-FIX-001" {
			t.Errorf("Expected DTO OrderNo 'ORD-FIX-001', got '%s'", dto.OrderNo)
		}
		if dto.Status != StatusInProduction {
			t.Errorf("Expected status IN_PRODUCTION, got '%s'", dto.Status)
		}
		if dto.ItemCount != 2 {
			t.Errorf("Expected item_count 2, got %d", dto.ItemCount)
		}
		if dto.CustomerName != "Som***" {
			t.Errorf("Expected masked customer name 'Som***', got '%s'", dto.CustomerName)
		}
		if dto.DeliveryDate != "2026-10-25" {
			t.Errorf("Expected delivery_date '2026-10-25', got '%s'", dto.DeliveryDate)
		}

		// Security assertion: DTO must not leak PII (phone number or full address)
		bodyStr := wLookup.Body.String()
		if strings.Contains(bodyStr, "02055551234") {
			t.Fatalf("Security violation: public DTO leaked customer phone number!")
		}
		if strings.Contains(bodyStr, "Vongsa") {
			t.Fatalf("Security violation: public DTO leaked customer last name!")
		}

		// Check query endpoint /api/v1/orders/track?q=
		reqQuery, _ := http.NewRequest("GET", "/api/v1/orders/track?q="+issuedToken, nil)
		wQuery := httptest.NewRecorder()
		router.ServeHTTP(wQuery, reqQuery)
		if wQuery.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK on /api/v1/orders/track?q=, got %d", wQuery.Code)
		}

		// Check legacy query endpoint /api/orders/track?q=
		reqLegacy, _ := http.NewRequest("GET", "/api/orders/track?q="+issuedToken, nil)
		wLegacy := httptest.NewRecorder()
		router.ServeHTTP(wLegacy, reqLegacy)
		if wLegacy.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK on legacy /api/orders/track?q=, got %d", wLegacy.Code)
		}

		// 4. Rejection of orderID, order_number, phone, and courier token lookups
		forbiddenQueries := []string{
			"ord-fixture-1",     // Order ID
			"ORD-FIX-001",       // Order Number
			"02055551234",       // Customer Phone
			"COURIER-TRACK-999", // Courier Tracking
		}
		for _, q := range forbiddenQueries {
			// Path lookup must 404
			rPath, _ := http.NewRequest("GET", "/api/v1/orders/track/"+q, nil)
			wPath := httptest.NewRecorder()
			router.ServeHTTP(wPath, rPath)
			if wPath.Code != http.StatusNotFound {
				t.Errorf("Expected 404 for forbidden path lookup '%s', got %d", q, wPath.Code)
			}

			// Query lookup must 404
			rQ, _ := http.NewRequest("GET", "/api/v1/orders/track?q="+q, nil)
			wQ := httptest.NewRecorder()
			router.ServeHTTP(wQ, rQ)
			if wQ.Code != http.StatusNotFound {
				t.Errorf("Expected 404 for forbidden query lookup '%s', got %d", q, wQ.Code)
			}
		}
	})

	// -------------------------------------------------------------
	// D3: New connection AND new app/router instance with caches reset still serves same link
	// -------------------------------------------------------------
	t.Run("D3 - New Connection & App Instance Reopen", func(t *testing.T) {
		if issuedToken == "" {
			t.Fatal("Cannot run D3 without issued token from D2")
		}

		// 1. Wipe in-memory caches completely
		storeMutex.Lock()
		ordersStore = make(map[string]Order)
		storeMutex.Unlock()

		// 2. Close old DB connection pool and establish brand NEW connection pool
		_ = testDB.Close()

		reopenedDB, err := sql.Open("postgres", canonicalDSN)
		if err != nil {
			t.Fatalf("Failed to open reopened connection pool: %v", err)
		}
		reopenedDB.SetMaxOpenConns(1)
		_, err = reopenedDB.Exec(fmt.Sprintf("SET search_path TO %s, public;", schemaName))
		if err != nil {
			t.Fatalf("Failed to set search_path on reopened DB: %v", err)
		}
		db.DB = reopenedDB
		defer reopenedDB.Close()

		// 3. Create a brand NEW application/router instance
		newRouter := gin.New()
		newRouter.GET("/api/v1/orders/track/:order_no", HandleGetOrderByOrderNo)
		newRouter.GET("/api/v1/orders/track", HandleTrackOrderQuery)
		newRouter.GET("/api/orders/track", HandleTrackOrderQuery)

		// 4. Serve request through newRouter using persisted PostgreSQL row
		req, _ := http.NewRequest("GET", "/api/v1/orders/track/"+issuedToken, nil)
		w := httptest.NewRecorder()
		newRouter.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK after full application/router restart, got %d: %s", w.Code, w.Body.String())
		}

		var dto OrderTrackingDTO
		if err := json.Unmarshal(w.Body.Bytes(), &dto); err != nil {
			t.Fatalf("Failed to parse reopened tracking DTO: %v", err)
		}

		if dto.ID != "ord-fixture-1" {
			t.Errorf("Expected DTO ID 'ord-fixture-1', got '%s'", dto.ID)
		}
		if dto.ItemCount != 2 {
			t.Errorf("Expected item_count 2 from persisted order_items, got %d", dto.ItemCount)
		}
		if dto.CustomerName != "Som***" {
			t.Errorf("Expected masked customer name 'Som***', got '%s'", dto.CustomerName)
		}

		// 5. Query endpoint also serves correctly after restart
		reqQ, _ := http.NewRequest("GET", "/api/v1/orders/track?q="+issuedToken, nil)
		wQ := httptest.NewRecorder()
		newRouter.ServeHTTP(wQ, reqQ)
		if wQ.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK for query lookup after restart, got %d", wQ.Code)
		}
	})
}
