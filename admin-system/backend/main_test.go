package main

import (
	"bytes"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	_ "github.com/lib/pq"
	"somsing.local/backend/auth"
	"somsing.local/backend/db"
)

// Helper to create tokens
func makeTestToken(role string, expired bool, forged bool) string {
	claims := &auth.OwnerClaims{
		Username: "testuser",
		UserID:   "usr_test",
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
		secret = []byte("forged-secret-key")
	}
	signed, _ := token.SignedString(secret)
	return signed
}

func TestActualRegisteredPrivateRoutes_AuthBoundaries(t *testing.T) {
	// R3: Use t.Setenv to configure test environment and automatically restore previous env
	t.Setenv("ENVIRONMENT", "test")
	t.Setenv("JWT_SECRET", "test-secret")

	gin.SetMode(gin.TestMode)
	router := gin.New()

	// R1 & R2: Actual production registration with safe sentinel decorator
	// Preserves the full middleware chain and replaces only the terminal business handler
	RegisterRoutes(router, WithFinalHandlerSentinel())

	// Bounded table covering diverse route domains:
	// Every domain verifies Anonymous (401), Forged (401), Expired (401), and Role boundaries (200 / 403)
	tests := []struct {
		name         string
		method       string
		path         string
		tokenType    string // "none", "forged", "expired", "admin", "sales", "finance", "production", "hr", "manager"
		expectedCode int
	}{
		// 1. Orders Domain
		{"Orders - Anonymous", "GET", "/api/v1/orders", "none", http.StatusUnauthorized},
		{"Orders - Forged", "GET", "/api/v1/orders", "forged", http.StatusUnauthorized},
		{"Orders - Expired", "GET", "/api/v1/orders", "expired", http.StatusUnauthorized},
		{"Orders - Valid Sales", "GET", "/api/v1/orders", "sales", http.StatusOK},
		{"Orders - Invalid HR", "GET", "/api/v1/orders", "hr", http.StatusForbidden},
		{"Orders Write - Valid Sales", "POST", "/api/v1/orders", "sales", http.StatusOK},
		{"Orders Write - Invalid Finance", "POST", "/api/v1/orders", "finance", http.StatusForbidden},

		// 2. Finance Domain
		{"Finance - Anonymous", "GET", "/api/v1/finance/summary", "none", http.StatusUnauthorized},
		{"Finance - Forged", "GET", "/api/v1/finance/summary", "forged", http.StatusUnauthorized},
		{"Finance - Expired", "GET", "/api/v1/finance/summary", "expired", http.StatusUnauthorized},
		{"Finance Summary - Valid Finance", "GET", "/api/v1/finance/summary", "finance", http.StatusOK},
		{"Finance Summary - Invalid Sales", "GET", "/api/v1/finance/summary", "sales", http.StatusForbidden},

		// 3. HR Domain
		{"HR - Anonymous", "GET", "/api/employees", "none", http.StatusUnauthorized},
		{"HR - Forged", "GET", "/api/employees", "forged", http.StatusUnauthorized},
		{"HR - Expired", "GET", "/api/employees", "expired", http.StatusUnauthorized},
		{"HR Employees - Valid Admin", "GET", "/api/employees", "admin", http.StatusOK},
		{"HR Employees - Invalid Manager", "GET", "/api/employees", "manager", http.StatusForbidden},

		// 4. Inventory Domain
		{"Inventory - Anonymous", "GET", "/api/inventory/items", "none", http.StatusUnauthorized},
		{"Inventory - Forged", "GET", "/api/inventory/items", "forged", http.StatusUnauthorized},
		{"Inventory - Expired", "GET", "/api/inventory/items", "expired", http.StatusUnauthorized},
		{"Inventory Read - Valid Production", "GET", "/api/inventory/items", "production", http.StatusOK},
		{"Inventory Write - Valid Manager", "POST", "/api/inventory", "manager", http.StatusOK},
		{"Inventory Write - Invalid Sales", "POST", "/api/inventory", "sales", http.StatusForbidden},

		// 5. Quotations Domain
		{"Quotations - Anonymous", "GET", "/api/v1/quotations", "none", http.StatusUnauthorized},
		{"Quotations - Forged", "GET", "/api/v1/quotations", "forged", http.StatusUnauthorized},
		{"Quotations - Expired", "GET", "/api/v1/quotations", "expired", http.StatusUnauthorized},
		{"Quotation Read - Valid Sales", "GET", "/api/v1/quotations", "sales", http.StatusOK},
		{"Quotation Write - Invalid Finance", "POST", "/api/v1/quotations", "finance", http.StatusForbidden},

		// 6. Catalog Domain
		{"Catalog - Anonymous", "POST", "/api/v1/admin/catalog/categories", "none", http.StatusUnauthorized},
		{"Catalog - Forged", "POST", "/api/v1/admin/catalog/categories", "forged", http.StatusUnauthorized},
		{"Catalog - Expired", "POST", "/api/v1/admin/catalog/categories", "expired", http.StatusUnauthorized},
		{"Catalog Create Category - Valid Admin", "POST", "/api/v1/admin/catalog/categories", "admin", http.StatusOK},
		{"Catalog Create Category - Invalid Sales", "POST", "/api/v1/admin/catalog/categories", "sales", http.StatusForbidden},

		// 7. Settings Domain
		{"Settings - Anonymous", "POST", "/api/v1/admin/couriers", "none", http.StatusUnauthorized},
		{"Settings - Forged", "POST", "/api/v1/admin/couriers", "forged", http.StatusUnauthorized},
		{"Settings - Expired", "POST", "/api/v1/admin/couriers", "expired", http.StatusUnauthorized},
		{"Couriers Create - Valid Manager", "POST", "/api/v1/admin/couriers", "manager", http.StatusOK},
		{"Couriers Create - Invalid Production", "POST", "/api/v1/admin/couriers", "production", http.StatusForbidden},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest(tt.method, tt.path, nil)
			if tt.tokenType != "none" {
				expired := (tt.tokenType == "expired")
				forged := (tt.tokenType == "forged")
				role := tt.tokenType
				if expired || forged {
					role = "admin" // Base token role on an allowed role to isolate expiry/signature check
				}
				tokenStr := makeTestToken(role, expired, forged)
				req.Header.Set("Authorization", "Bearer "+tokenStr)
			}

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != tt.expectedCode {
				t.Fatalf("Path %s expected code %d, got %d. Body: %s", tt.path, tt.expectedCode, w.Code, w.Body.String())
			}

			// For authorized requests reaching 200 OK, verify the safe sentinel was reached
			if tt.expectedCode == http.StatusOK {
				var body map[string]interface{}
				if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
					t.Fatalf("Path %s expected valid JSON response, got: %s", tt.path, w.Body.String())
				}
				if body["sentinel"] != true || body["status"] != "authorized" {
					t.Fatalf("Path %s expected sentinel to be reached with status 'authorized', got: %v", tt.path, body)
				}
			}
		})
	}
}

// TestActualRegisteredTracking_PersistenceFixture verifies D3 reopening through a new RegisterRoutes
// application instance connected to real disposable Postgres fixture data.
func TestActualRegisteredTracking_PersistenceFixture(t *testing.T) {
	fixtureDSN := os.Getenv("TEST_FIXTURE_DSN")
	if fixtureDSN == "" {
		t.Skip("TEST_FIXTURE_DSN not provided. Skipping isolated Postgres tracking restart test.")
	}

	canonicalDSN, err := db.ParseAndValidateDSN(fixtureDSN)
	if err != nil {
		t.Fatalf("Invalid TEST_FIXTURE_DSN: %v", err)
	}

	initDB, err := sql.Open("postgres", canonicalDSN)
	if err != nil {
		t.Fatalf("Failed to open fixture DB: %v", err)
	}
	defer initDB.Close()

	// Disposable schema for this test
	randBytes := make([]byte, 4)
	rand.Read(randBytes)
	schemaName := fmt.Sprintf("main_fixture_%s", hex.EncodeToString(randBytes))

	_, err = initDB.Exec(fmt.Sprintf("CREATE SCHEMA %s;", schemaName))
	if err != nil {
		t.Fatalf("Failed to create schema %s: %v", schemaName, err)
	}

	_, _ = initDB.Exec(fmt.Sprintf("ALTER DATABASE somsing_fixture_db SET search_path TO %s, public;", schemaName))
	_, _ = initDB.Exec(fmt.Sprintf("SET search_path TO %s, public;", schemaName))

	originalDB := db.DB
	t.Cleanup(func() {
		db.DB = originalDB
		cleanupDB, cErr := sql.Open("postgres", canonicalDSN)
		if cErr == nil {
			_, _ = cleanupDB.Exec("ALTER DATABASE somsing_fixture_db RESET search_path;")
			_, _ = cleanupDB.Exec(fmt.Sprintf("DROP SCHEMA %s CASCADE;", schemaName))
			_ = cleanupDB.Close()
		}
	})

	// Setup orders and order_items
	_, err = initDB.Exec(`
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
		t.Fatalf("Failed to create tables: %v", err)
	}

	// Apply migration 043
	migrationContent, err := os.ReadFile("migrations/043_add_public_tracking_token_to_orders.sql")
	if err != nil {
		migrationContent, err = os.ReadFile("../migrations/043_add_public_tracking_token_to_orders.sql")
		if err != nil {
			t.Fatalf("Failed to read 043 migration: %v", err)
		}
	}
	_, err = initDB.Exec(string(migrationContent))
	if err != nil {
		t.Fatalf("Failed to run 043 migration: %v", err)
	}

	testToken := "TEST_RESTART_TOKEN_SECURE_9876543210ABCDEF"
	_, err = initDB.Exec(`
		INSERT INTO orders (id, order_no, order_number, status, overall_status, delivery_date, customer_name, customer_phone, public_tracking_token)
		VALUES ('ord-restart-1', 'ORD-RST-001', 'ORD-RST-001', 'IN_PRODUCTION', 'IN_PRODUCTION', '2026-11-01', 'Bounmy Somphone', '02099998888', $1)
	`, testToken)
	if err != nil {
		t.Fatalf("Failed to seed restart order fixture: %v", err)
	}

	_, err = initDB.Exec(`
		INSERT INTO order_items (id, order_id, product_name, current_step)
		VALUES ('item-rst-1', 'ord-restart-1', 'Banners', 'PRINTING')
	`)
	if err != nil {
		t.Fatalf("Failed to seed restart item fixture: %v", err)
	}

	// Close initial DB connection pool
	_ = initDB.Close()

	// Simulate complete server restart: brand new DB connection pool + brand new router instance
	newAppDB, err := sql.Open("postgres", canonicalDSN)
	if err != nil {
		t.Fatalf("Failed to open new app DB: %v", err)
	}
	newAppDB.SetMaxOpenConns(1)
	_, _ = newAppDB.Exec(fmt.Sprintf("SET search_path TO %s, public;", schemaName))
	db.DB = newAppDB
	defer newAppDB.Close()

	gin.SetMode(gin.TestMode)
	newRouter := gin.New()
	RegisterRoutes(newRouter) // Using actual RegisterRoutes extraction

	// Send request through newRouter
	req, _ := http.NewRequest("GET", "/api/v1/orders/track/"+testToken, nil)
	w := httptest.NewRecorder()
	newRouter.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK through RegisterRoutes after restart, got %d: %s", w.Code, w.Body.String())
	}

	var dto map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &dto); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if dto["id"] != "ord-restart-1" {
		t.Errorf("Expected id 'ord-restart-1', got '%v'", dto["id"])
	}
	if dto["customer_name"] != "Bou***" {
		t.Errorf("Expected masked customer_name 'Bou***', got '%v'", dto["customer_name"])
	}
	if dto["item_count"] != float64(1) {
		t.Errorf("Expected item_count 1, got '%v'", dto["item_count"])
	}
}

// TestActualRegisterRoutes_IsolatedUploadAndPreflight provides R4 coverage:
// - Tests actual RegisterRoutes without synthetic router duplication.
// - Uses strictly isolated temporary working directory and storage root.
// - Tests upload auth, order validation, preflight analysis, and protected file serving.
func TestActualRegisterRoutes_IsolatedUploadAndPreflight(t *testing.T) {
	// Safety isolation: switch to temporary working dir to ensure no repository files are touched by settings init
	origWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to get current working directory: %v", err)
	}
	isolatedDir := t.TempDir()
	if err := os.Chdir(isolatedDir); err != nil {
		t.Fatalf("failed to chdir to isolatedDir: %v", err)
	}
	t.Cleanup(func() {
		_ = os.Chdir(origWd)
	})

	uploadStorage := filepath.Join(isolatedDir, "uploads")
	_ = os.MkdirAll(uploadStorage, 0755)

	t.Setenv("UPLOAD_STORAGE_DIR", uploadStorage)
	t.Setenv("ENVIRONMENT", "test")
	t.Setenv("JWT_SECRET", "som-sing-test-jwt-secret-key-32chars")

	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Actual production route registration (without sentinel replacement)
	RegisterRoutes(router)

	adminToken := makeTestToken(auth.RoleAdmin, false, false)
	validPDF := []byte("%PDF-1.4\n%Som Sing Phim Test PDF File Content\n%%EOF")

	// Helper to create multipart requests
	createForm := func(filename string, content []byte, fields map[string]string) (*bytes.Buffer, string) {
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)
		part, _ := writer.CreateFormFile("file", filename)
		_, _ = part.Write(content)
		for k, v := range fields {
			_ = writer.WriteField(k, v)
		}
		_ = writer.Close()
		return body, writer.FormDataContentType()
	}

	var uploadedFileURL string

	t.Run("Actual route: Anonymous order upload is rejected (401)", func(t *testing.T) {
		body, cType := createForm("draft.pdf", validPDF, map[string]string{
			"order_no":  "temp_order",
			"item_id":   "item1",
			"file_type": "inner",
		})
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/upload", body)
		req.Header.Set("Content-Type", cType)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 for anonymous upload, got %d", w.Code)
		}
	})

	t.Run("Actual route: Nonexistent concrete order upload is rejected (404)", func(t *testing.T) {
		body, cType := createForm("order.pdf", validPDF, map[string]string{
			"order_no":  "ORD-NONEXISTENT-TEST",
			"item_id":   "item1",
			"file_type": "cover",
		})
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/upload", body)
		req.Header.Set("Content-Type", cType)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for nonexistent order, got %d (body: %s)", w.Code, w.Body.String())
		}
	})

	t.Run("Actual route: Pre-order draft upload succeeds with 200 OK", func(t *testing.T) {
		body, cType := createForm("draft_booklet.pdf", validPDF, map[string]string{
			"order_no":  "temp_order",
			"item_id":   "temp-item-1",
			"file_type": "inner",
		})
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/orders/upload", body)
		req.Header.Set("Content-Type", cType)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 for draft order upload, got %d (body: %s)", w.Code, w.Body.String())
		}

		var resp struct {
			FileURL string `json:"file_url"`
		}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		uploadedFileURL = resp.FileURL
		if uploadedFileURL == "" {
			t.Fatalf("expected non-empty file_url in upload response")
		}
	})

	t.Run("Actual route: Preflight analyze succeeds anonymously (200)", func(t *testing.T) {
		body, cType := createForm("preflight_check.pdf", validPDF, nil)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/preflight/analyze", body)
		req.Header.Set("Content-Type", cType)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 for public preflight analyze, got %d (body: %s)", w.Code, w.Body.String())
		}
	})

	t.Run("Actual route: Private artwork serving rejects anonymous GET (401)", func(t *testing.T) {
		if uploadedFileURL == "" {
			t.Skip("skipping because upload did not set uploadedFileURL")
		}
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", uploadedFileURL, nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 for anonymous access to private artwork, got %d", w.Code)
		}
	})

	t.Run("Actual route: Private artwork serving rejects anonymous HEAD (401)", func(t *testing.T) {
		if uploadedFileURL == "" {
			t.Skip("skipping because upload did not set uploadedFileURL")
		}
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("HEAD", uploadedFileURL, nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 for anonymous HEAD to private artwork, got %d", w.Code)
		}
	})

	t.Run("Actual route: Private artwork serving accepts authorized GET via Bearer token (200)", func(t *testing.T) {
		if uploadedFileURL == "" {
			t.Skip("skipping because upload did not set uploadedFileURL")
		}
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", uploadedFileURL, nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 for authorized access to private artwork, got %d", w.Code)
		}
		if !strings.Contains(w.Header().Get("Content-Type"), "application/pdf") {
			t.Errorf("expected application/pdf Content-Type, got: %s", w.Header().Get("Content-Type"))
		}
	})

	t.Run("Actual route: Private artwork serving accepts authorized GET via ?token= query parameter (200)", func(t *testing.T) {
		if uploadedFileURL == "" {
			t.Skip("skipping because upload did not set uploadedFileURL")
		}
		targetURL := uploadedFileURL + "?token=" + adminToken
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", targetURL, nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 for ?token= query parameter access to private artwork, got %d", w.Code)
		}
	})
}

// Static source evidence only: do not start business main or initialize its side effects.
func TestStartupDBFailureGuard(t *testing.T) {
	source := os.Getenv("P1_STARTUP_SOURCE")
	if source == "" {
		t.Fatal("explicit frozen startup source required")
	}
	parsed, err := parser.ParseFile(token.NewFileSet(), source, nil, 0)
	if err != nil {
		t.Fatal(err)
	}
	var body *ast.BlockStmt
	for _, decl := range parsed.Decls {
		if fn, ok := decl.(*ast.FuncDecl); ok && fn.Name.Name == "main" {
			body = fn.Body
		}
	}
	if body == nil {
		t.Fatal("actual main function missing")
	}
	guard := -1
	effects := map[string]bool{"notifications.InitGlobalDispatcher": false, "settings.SeedLocationsToDB": false, "inventory.StartPPMDailyCron": false, "router.Run": false}
	for index, stmt := range body.List {
		if candidate, ok := stmt.(*ast.IfStmt); ok {
			if assign, ok := candidate.Init.(*ast.AssignStmt); ok && len(assign.Rhs) == 1 {
				if call, ok := assign.Rhs[0].(*ast.CallExpr); ok {
					if selectCall, ok := call.Fun.(*ast.SelectorExpr); ok && selectCall.Sel.Name == "InitDB" {
						owner, ok := selectCall.X.(*ast.Ident)
						if !ok || owner.Name != "db" {
							t.Fatal("unexpected initialization owner")
						}
						condition, ok := candidate.Cond.(*ast.BinaryExpr)
						if !ok || condition.Op != token.NEQ {
							t.Fatal("database failure guard missing")
						}
						left, lok := condition.X.(*ast.Ident)
						right, rok := condition.Y.(*ast.Ident)
						if !lok || !rok || left.Name != "err" || right.Name != "nil" || candidate.Else != nil || len(candidate.Body.List) != 1 {
							t.Fatal("database failure can fall through")
						}
						expression, ok := candidate.Body.List[0].(*ast.ExprStmt)
						if !ok {
							t.Fatal("failure branch must exit")
						}
						fatal, ok := expression.X.(*ast.CallExpr)
						if !ok {
							t.Fatal("failure branch must exit")
						}
						selected, ok := fatal.Fun.(*ast.SelectorExpr)
						if !ok || selected.Sel.Name != "Fatal" {
							t.Fatal("failure branch does not terminate")
						}
						logger, ok := selected.X.(*ast.Ident)
						if !ok || logger.Name != "log" {
							t.Fatal("unexpected termination call")
						}
						guard = index
					}
				}
			}
		}
		ast.Inspect(stmt, func(node ast.Node) bool {
			call, ok := node.(*ast.CallExpr)
			if !ok {
				return true
			}
			selected, ok := call.Fun.(*ast.SelectorExpr)
			if !ok {
				return true
			}
			owner, ok := selected.X.(*ast.Ident)
			if !ok {
				return true
			}
			name := owner.Name + "." + selected.Sel.Name
			if _, required := effects[name]; required {
				if guard < 0 || index <= guard {
					t.Fatalf("%s precedes database readiness", name)
				}
				effects[name] = true
			}
			return true
		})
	}
	if guard < 0 {
		t.Fatal("actual initialization failure guard missing")
	}
	for name, found := range effects {
		if !found {
			t.Fatalf("expected startup call missing: %s", name)
		}
	}
	t.Log("actual main AST exits on database failure before dispatcher/location seed/cron/listener; business main not run")
}
