package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"regexp"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"somsing.local/backend/auth"
	"somsing.local/backend/db"
	"somsing.local/backend/finance"
	"somsing.local/backend/orders"
)

// Minimal valid 1x1 JPEG
var validJPEG = []byte{
	0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 'J', 'F', 'I', 'F', 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
	0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
	0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
	0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
	0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
	0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
	0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
	0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
	0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
	0x00, 0x7F, 0x00, 0xFF, 0xD9,
}

// Minimal valid 1x1 PNG
var validPNG = []byte{
	0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
	0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
	0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
	0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
	0x42, 0x60, 0x82,
}

// Generate valid single-page PDF with specified title
func makeValidPDF(title string) []byte {
	return []byte(fmt.Sprintf("%%PDF-1.4\n1 0 obj\n<< /Title (%s) /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000136 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n212\n%%%%EOF\n", title))
}

// SeedFixtureAssets populates the given directory with valid binary assets for review
func SeedFixtureAssets(tempDir string) error {
	artworksDir := filepath.Join(tempDir, "artworks")
	preflightDir := filepath.Join(tempDir, "preflight")
	if err := os.MkdirAll(artworksDir, 0755); err != nil {
		return err
	}
	if err := os.MkdirAll(preflightDir, 0755); err != nil {
		return err
	}

	_ = os.WriteFile(filepath.Join(artworksDir, "single_master.jpg"), validJPEG, 0644)
	_ = os.WriteFile(filepath.Join(artworksDir, "sample_document.pdf"), makeValidPDF("Sample Master Document"), 0644)
	_ = os.WriteFile(filepath.Join(artworksDir, "cover_booklet.pdf"), makeValidPDF("Hardcover Booklet Front Cover"), 0644)
	_ = os.WriteFile(filepath.Join(artworksDir, "inner_booklet.pdf"), makeValidPDF("Booklet Inner Pages Content"), 0644)
	_ = os.WriteFile(filepath.Join(artworksDir, "batch_01.jpg"), validJPEG, 0644)
	_ = os.WriteFile(filepath.Join(artworksDir, "batch_02.png"), validPNG, 0644)
	_ = os.WriteFile(filepath.Join(artworksDir, "batch_03.pdf"), makeValidPDF("Batch Item 3 Approved PDF"), 0644)
	_ = os.WriteFile(filepath.Join(artworksDir, "restricted_failure.pdf"), makeValidPDF("Restricted Asset - 403 Target"), 0644)
	_ = os.WriteFile(filepath.Join(preflightDir, "public_sample.pdf"), makeValidPDF("Public Preflight Document"), 0644)
	return nil
}

// BuildFixtureEngine configures the complete Gin router for the disposable fixture server
func BuildFixtureEngine(tempDir string, port string, shutdownCh chan struct{}) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())

	// Dynamic CORS allowing requests from any localhost origin (e.g. 5173, 3000)
	router.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" && (strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "http://127.0.0.1:")) {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, Origin, X-Requested-With")
			c.Header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, DELETE, PUT")
		}
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Fixture Utility Endpoints
	router.GET("/fixture/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":      "ready",
			"origin":      fmt.Sprintf("http://127.0.0.1:%s", port),
			"storage_dir": tempDir,
			"assets": []string{
				"/uploads/artworks/single_master.jpg",
				"/uploads/artworks/sample_document.pdf",
				"/uploads/artworks/cover_booklet.pdf",
				"/uploads/artworks/inner_booklet.pdf",
				"/uploads/artworks/batch_01.jpg",
				"/uploads/artworks/batch_02.png",
				"/uploads/artworks/batch_03.pdf",
				"/uploads/artworks/restricted_failure.pdf",
				"/uploads/preflight/public_sample.pdf",
			},
		})
	})

	// Sign valid operator JWT token for authorized staff (Prepress role)
	router.GET("/fixture/token", func(c *gin.Context) {
		claims := &auth.OwnerClaims{
			Username: "fixture_operator",
			UserID:   "usr_fixture_01",
			Role:     auth.RolePrepress,
			RegisteredClaims: jwt.RegisteredClaims{
				Issuer:    "som-sing-phim-erp",
				Subject:   "usr_fixture_01",
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Hour)),
				IssuedAt:  jwt.NewNumericDate(time.Now()),
			},
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		signed, err := token.SignedString(auth.GetJWTSecretKey())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sign token"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"token":      signed,
			"role":       auth.RolePrepress,
			"username":   "fixture_operator",
			"expires_in": 7200,
		})
	})

	// Unauthorized token (guest role) to test 403 Forbidden handling
	router.GET("/fixture/unauthorized-token", func(c *gin.Context) {
		claims := &auth.OwnerClaims{
			Username: "unauthorized_guest",
			UserID:   "usr_guest_99",
			Role:     "guest",
			RegisteredClaims: jwt.RegisteredClaims{
				Issuer:    "som-sing-phim-erp",
				Subject:   "usr_guest_99",
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Hour)),
				IssuedAt:  jwt.NewNumericDate(time.Now()),
			},
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		signed, _ := token.SignedString(auth.GetJWTSecretKey())
		c.JSON(http.StatusOK, gin.H{
			"token":      signed,
			"role":       "guest",
			"username":   "unauthorized_guest",
			"expires_in": 7200,
		})
	})

	// Endpoint simulating broken server route or Vite SPA fallback returning HTTP 200 with HTML
	router.GET("/fixture/simulate-html-fallback", func(c *gin.Context) {
		c.Header("Content-Type", "text/html; charset=utf-8")
		c.String(http.StatusOK, "<!DOCTYPE html><html lang=\"en\"><head><title>Som Sing Phim Admin</title></head><body><div id=\"root\">Overview Dashboard</div></body></html>")
	})

	// Teardown endpoint to trigger graceful exit
	router.POST("/fixture/teardown", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "teardown_initiated"})
		if shutdownCh != nil {
			go func() {
				time.Sleep(100 * time.Millisecond)
				shutdownCh <- struct{}{}
			}()
		}
	})

	// Registered Production File Serving Routes with 403 partial failure simulation
	serveProtectedWithRestrictedCheck := func(c *gin.Context) {
		if strings.Contains(c.Param("filepath"), "restricted_failure") {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access to restricted asset is forbidden by policy"})
			return
		}
		orders.HandleServeProtectedFile(c)
	}

	router.GET("/uploads/*filepath", serveProtectedWithRestrictedCheck)
	router.HEAD("/uploads/*filepath", serveProtectedWithRestrictedCheck)
	router.GET("/api/v1/orders/files/*filepath", serveProtectedWithRestrictedCheck)
	router.HEAD("/api/v1/orders/files/*filepath", serveProtectedWithRestrictedCheck)

	// Explicitly disposable persistence fixture storage
	var fixtureOrders = make(map[string]map[string]interface{})

	router.POST("/api/orders", func(c *gin.Context) {
		c.Request.URL.Path = "/api/v1/orders"
		router.HandleContext(c)
	})
	router.POST("/api/v1/orders", func(c *gin.Context) {
		var payload map[string]interface{}
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		id, _ := payload["id"].(string)
		if id == "" {
			id = fmt.Sprintf("ord-fixture-%d", len(fixtureOrders)+1)
		}
		payload["id"] = id
		fixtureOrders[id] = payload
		c.JSON(http.StatusOK, payload)
	})

	router.GET("/api/v1/orders/:id", func(c *gin.Context) {
		id := c.Param("id")
		if order, exists := fixtureOrders[id]; exists {
			c.JSON(http.StatusOK, order)
		} else {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		}
	})

	// Production upload routes
	artworkAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RolePrepress, auth.RoleProduction)
	router.POST("/api/upload/artwork", artworkAuth, orders.HandleArtworkUpload)
	router.POST("/api/v1/upload/artwork", artworkAuth, orders.HandleArtworkUpload)

	return router
}

func main() {
	port := flag.String("port", "8089", "Port for disposable fixture server")
	connected := flag.Bool("connected", false, "Owned synthetic DB session only")
	workspace := flag.String("workspace", "", "Owned connected workspace")
	uiOrigin := flag.String("ui-origin", "", "Exact owned browser origin")
	flag.Parse()
	if *connected {
		runConnectedFixture(*port, *workspace, *uiOrigin)
		return
	}

	// 1. Establish dedicated random fixture key BEFORE any auth package functions or routes
	// Never inherits or reads live shop JWT_SECRET from environment.
	randBytes := make([]byte, 32)
	if _, err := rand.Read(randBytes); err != nil {
		log.Fatalf("Failed to generate random fixture secret: %v", err)
	}
	fixtureSecret := hex.EncodeToString(randBytes)

	// Unconditionally overwrite environment variables to enforce complete fixture isolation
	_ = os.Setenv("ENVIRONMENT", "test")
	_ = os.Setenv("JWT_SECRET", fixtureSecret)

	// 2. Create isolated temporary directory for storage
	tempDir, err := os.MkdirTemp("", "somsing-disposable-fixture-*")
	if err != nil {
		log.Fatalf("Failed to create temporary directory: %v", err)
	}
	_ = os.Setenv("UPLOAD_STORAGE_DIR", tempDir)

	cleanup := func() {
		log.Printf("[Fixture Server] Cleaning up temporary storage: %s", tempDir)
		_ = os.RemoveAll(tempDir)
	}
	defer cleanup()

	// 3. Seed realistic disposable artwork assets
	if err := SeedFixtureAssets(tempDir); err != nil {
		log.Fatalf("Failed to seed fixture assets: %v", err)
	}
	log.Printf("[Fixture Server] Seeded realistic disposable assets in: %s", tempDir)

	// 4. Build Router using unified engine builder
	shutdownCh := make(chan struct{}, 1)
	router := BuildFixtureEngine(tempDir, *port, shutdownCh)

	// 5. Start HTTP Server
	server := &http.Server{
		Addr:    fmt.Sprintf("127.0.0.1:%s", *port),
		Handler: router,
	}

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("[Fixture Server] Listening on http://127.0.0.1:%s (Origin: http://127.0.0.1:%s)", *port, *port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server ListenAndServe: %v", err)
		}
	}()

	select {
	case <-sigCh:
		log.Println("[Fixture Server] Received shutdown signal")
	case <-shutdownCh:
		log.Println("[Fixture Server] Received teardown request via API")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	_ = server.Shutdown(ctx)
	cleanup()
	log.Println("[Fixture Server] Graceful teardown complete")
}

// Connected mode belongs only to this disposable test executable; business main is never started.
func runConnectedFixture(port, workspace, uiOrigin string) {
	if !filepath.IsAbs(workspace) || !strings.HasPrefix(filepath.Base(workspace), "somsing-connected-") {
		log.Fatal("owned workspace required")
	}
	schemaBytes, err := os.ReadFile(filepath.Join(workspace, "owner-schema"))
	if err != nil {
		log.Fatal(err)
	}
	schema := strings.TrimSpace(string(schemaBytes))
	if !regexp.MustCompile(`^phase1_connected_[a-f0-9]{16}$`).MatchString(schema) {
		log.Fatal("invalid owned schema")
	}
	secret, err := os.ReadFile(filepath.Join(workspace, "jwt-key"))
	if err != nil || len(secret) != 64 {
		log.Fatal("owned fixture key required")
	}
	u, err := url.Parse(uiOrigin)
	if err != nil || u.Scheme != "http" || (u.Hostname() != "127.0.0.1" && u.Hostname() != "localhost") || u.Port() == "" || u.Path != "" {
		log.Fatal("exact loopback UI origin required")
	}
	dsn, err := db.ParseAndValidateDSN(os.Getenv("TEST_FIXTURE_DSN"))
	if err != nil {
		log.Fatal(err)
	}
	os.Setenv("ENVIRONMENT", "test")
	os.Setenv("JWT_SECRET", string(secret))
	storage := filepath.Join(workspace, "uploads")
	os.Setenv("UPLOAD_STORAGE_DIR", storage)
	if err := SeedFixtureAssets(storage); err != nil {
		log.Fatal(err)
	}
	control, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}
	control.SetMaxOpenConns(1)
	must := func(statement string, args ...any) {
		if _, err := control.Exec(statement, args...); err != nil {
			log.Fatal(err)
		}
	}
	must("CREATE SCHEMA IF NOT EXISTS " + schema)
	must("SET search_path TO " + schema + ",public")
	must("ALTER DATABASE somsing_fixture_db SET search_path TO " + schema + ",public")
	var exists bool
	if err := control.QueryRow("SELECT to_regclass($1) IS NOT NULL", schema+".quotations").Scan(&exists); err != nil {
		log.Fatal(err)
	}
	if !exists {
		must(`CREATE TABLE customers (id text PRIMARY KEY, name text DEFAULT '', company_name text, contact_person text, phone text DEFAULT '', email text DEFAULT '', address text DEFAULT '', province text DEFAULT '', district text DEFAULT '', village text DEFAULT '', credit_limit numeric DEFAULT 0, payment_terms text DEFAULT '', total_spent_lak numeric DEFAULT 0, total_orders_count numeric DEFAULT 0, created_at timestamptz, updated_at timestamptz);
CREATE TABLE orders (id text PRIMARY KEY, order_no text DEFAULT '', order_number text DEFAULT '', customer_id text DEFAULT '', customer_name text DEFAULT '', customer_phone text DEFAULT '', customer_email text DEFAULT '', customer_address text DEFAULT '', status text DEFAULT '', overall_status text DEFAULT '', deposit_amount numeric DEFAULT 0, deposit_lak numeric DEFAULT 0, remaining_lak numeric DEFAULT 0, total_price numeric DEFAULT 0, total_amount_lak numeric DEFAULT 0, total_cost numeric DEFAULT 0, delivery_date text DEFAULT '', google_drive_link text DEFAULT '', stock_deducted_at timestamptz, proof_url text DEFAULT '', digital_proof_url text DEFAULT '', proof_version numeric DEFAULT 0, proof_status text DEFAULT '', proof_feedback text DEFAULT '', prepress_notes text DEFAULT '', proof_approved_at timestamptz, proof_rejected_at timestamptz, proof_signature_ip text DEFAULT '', proof_rejection_reason text DEFAULT '', tracking_code text DEFAULT '', internal_tracking_code text DEFAULT '', public_tracking_token text DEFAULT '', courier_name text DEFAULT '', branch_code text DEFAULT '', idempotency_key text DEFAULT '', created_at timestamptz, updated_at timestamptz, notes text DEFAULT '');
CREATE TABLE order_items (id text PRIMARY KEY, order_id text DEFAULT '', job_name text DEFAULT '', item_name text DEFAULT '', quantity numeric DEFAULT 0, page_count numeric DEFAULT 0, paper_size text DEFAULT '', cover_paper_id text DEFAULT '', inner_paper_id text DEFAULT '', cover_file_url text DEFAULT '', inner_file_url text DEFAULT '', binding_type text DEFAULT '', spine_width_mm numeric DEFAULT 0, current_step text DEFAULT '', avg_cov_c numeric DEFAULT 0, avg_cov_m numeric DEFAULT 0, avg_cov_y numeric DEFAULT 0, avg_cov_k numeric DEFAULT 0, unit_cost_lak numeric DEFAULT 0, unit_price_lak numeric DEFAULT 0, total_price_lak numeric DEFAULT 0, unit_price_snapshot numeric DEFAULT 0, cost_price_snapshot numeric DEFAULT 0, specs jsonb, created_at timestamptz, updated_at timestamptz);
CREATE TABLE quotations (id text PRIMARY KEY, quotation_no text DEFAULT '', title text DEFAULT '', customer_name text DEFAULT '', customer_phone text DEFAULT '', customer_address text DEFAULT '', status text DEFAULT '', total_cost numeric DEFAULT 0, total_selling_price text DEFAULT '', overall_profit_percent numeric DEFAULT 0, discount_percent numeric DEFAULT 0, setup_fee numeric DEFAULT 0, packaging_cost numeric DEFAULT 0, shipping_fee numeric DEFAULT 0, expiry_date text DEFAULT '', notes text DEFAULT '', artwork_url text DEFAULT '', digital_proof_url text DEFAULT '', items_json jsonb, created_at timestamptz, updated_at timestamptz, quotation_id uuid);
CREATE TABLE audit_logs (id text PRIMARY KEY, user_id text DEFAULT '', user_name text DEFAULT '', action text DEFAULT '', resource_type text DEFAULT '', resource_id text DEFAULT '', old_values jsonb, new_values jsonb, ip_address text DEFAULT '', created_at timestamptz);
CREATE TABLE bank_transaction_logs(trans_ref text);`)
		must(`ALTER TABLE orders ADD COLUMN payment_slip_url text DEFAULT '';CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(100) PRIMARY KEY,
    employee_id VARCHAR(100),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'sales',
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`)
	}
	for _, name := range []string{"024_idempotency_and_order_persistence.sql", "000010_create_finance_tables.up.sql", "000011_seed_chart_of_accounts.up.sql"} {
		raw, err := os.ReadFile(filepath.Join(workspace, "migrations", name))
		if err != nil {
			log.Fatal(err)
		}
		must(string(raw))
	}
	password, err := bcrypt.GenerateFromPassword([]byte("Fixture-phase1-only!"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}
	for name, role := range map[string]string{"admin": auth.RoleAdmin, "manager": auth.RoleManager, "sales": auth.RoleSales, "finance": auth.RoleFinance, "prepress": auth.RolePrepress} {
		must("INSERT INTO admin_users(id,username,password_hash,fullname,email,role,is_active) VALUES($1,$2,$3,$4,'fixture@example.invalid',$5,true) ON CONFLICT(id) DO NOTHING", "fixture-"+name, "fixture_"+name, string(password), "Disposable "+name, role)
	}
	must("INSERT INTO customers(id,name,phone,email,address,province,district,village,credit_limit,payment_terms,total_spent_lak,total_orders_count,created_at,updated_at) VALUES('fixture-customer','Disposable Phase1 Customer','02000000000','','Fixture only','','','',0,'fixture',0,0,NOW(),NOW()) ON CONFLICT(id) DO NOTHING")
	legacy := []map[string]any{{"name": "Legacy incomplete disposable book", "quantity": float64(2), "unit_price_lak": float64(1125), "total_price_lak": float64(2250), "unit_cost_lak": float64(500), "specs": map[string]any{"commercial_cost_snapshot": map[string]any{"net_cost_lak": float64(1000), "labor_cost_lak": float64(300), "packaging_delivery_cost_lak": float64(200), "commercial_cost_lak": float64(1500)}}}}
	raw, _ := json.Marshal(legacy)
	must("INSERT INTO quotations(id,quotation_no,title,customer_name,customer_phone,customer_address,status,total_cost,total_selling_price,overall_profit_percent,items_json,created_at,updated_at) VALUES('fixture-legacy','FIXTURE-LEGACY','Disposable incomplete source','Disposable Phase1 Customer','02000000000','Fixture only','Pending',0,2600,40,$1::jsonb,NOW(),NOW()) ON CONFLICT(id) DO NOTHING", string(raw))
	for _, id := range []string{"fixture-payment-ok", "fixture-payment-audit", "fixture-payment-journal"} {
		must("INSERT INTO orders(id,order_no,order_number,customer_id,customer_name,customer_phone,status,overall_status,total_price,total_amount_lak,total_cost,deposit_lak,deposit_amount,remaining_lak,payment_slip_url,created_at,updated_at) VALUES($1,$1,$1,'fixture-customer','Disposable payment','02000000000','PENDING_SLIP_CHECK','PENDING_SLIP_CHECK',1500.25,1500.25,500,0,0,1500.25,'/uploads/artworks/sample_document.pdf',NOW(),NOW()) ON CONFLICT(id) DO NOTHING", id)
	}
	must(`CREATE TABLE IF NOT EXISTS fixture_fault(stage text PRIMARY KEY,resource_id text NOT NULL);
 CREATE OR REPLACE FUNCTION fixture_audit_fault() RETURNS trigger AS $$ BEGIN IF EXISTS(SELECT 1 FROM fixture_fault WHERE stage='audit' AND resource_id=NEW.resource_id) THEN RAISE EXCEPTION 'owned fixture audit fault'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;
 DROP TRIGGER IF EXISTS fixture_audit_fault ON audit_logs; CREATE TRIGGER fixture_audit_fault BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION fixture_audit_fault();
 CREATE OR REPLACE FUNCTION fixture_journal_fault() RETURNS trigger AS $$ BEGIN IF EXISTS(SELECT 1 FROM fixture_fault f JOIN journal_entries e ON e.reference_id=f.resource_id WHERE f.stage='journal' AND e.id=NEW.entry_id) THEN RAISE EXCEPTION 'owned fixture journal fault'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;
 DROP TRIGGER IF EXISTS fixture_journal_fault ON journal_lines; CREATE TRIGGER fixture_journal_fault BEFORE INSERT ON journal_lines FOR EACH ROW EXECUTE FUNCTION fixture_journal_fault();`)
	control.Close()
	pool, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()
	pool.SetMaxOpenConns(8)
	if err := pool.Ping(); err != nil {
		log.Fatal(err)
	}
	db.DB = pool
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" && origin != uiOrigin {
			c.AbortWithStatusJSON(403, gin.H{"error": "Outside owned fixture origin"})
			return
		}
		if origin != "" {
			c.Header("Access-Control-Allow-Origin", uiOrigin)
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type,X-Fixture-Drop-Response")
			c.Header("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,OPTIONS")
		}
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})
	shutdown := make(chan struct{}, 1)
	r.GET("/fixture/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ready", "mode": "connected", "pid": os.Getpid(), "origin": "http://127.0.0.1:" + port, "workspace": workspace, "storage_dir": storage, "schema": schema})
	})
	admin := auth.RequireRoles(auth.RoleAdmin)
	r.POST("/fixture/restart", admin, func(c *gin.Context) {
		c.JSON(200, gin.H{"restarting": true})
		go func() { time.Sleep(100 * time.Millisecond); shutdown <- struct{}{} }()
	})
	r.POST("/fixture/stop", admin, func(c *gin.Context) {
		if err := os.WriteFile(filepath.Join(workspace, "stop"), []byte("owned"), 0600); err != nil {
			c.AbortWithStatus(500)
			return
		}
		c.JSON(200, gin.H{"stopping": true})
		go func() { time.Sleep(100 * time.Millisecond); shutdown <- struct{}{} }()
	})
	r.POST("/fixture/fault", admin, func(c *gin.Context) {
		var body struct {
			Stage   string `json:"stage"`
			OrderID string `json:"order_id"`
			Enabled bool   `json:"enabled"`
		}
		if c.ShouldBindJSON(&body) != nil || (body.Stage != "audit" && body.Stage != "journal") {
			c.AbortWithStatus(400)
			return
		}
		var err error
		if body.Enabled {
			_, err = pool.Exec("INSERT INTO fixture_fault(stage,resource_id) VALUES($1,$2) ON CONFLICT(stage) DO UPDATE SET resource_id=excluded.resource_id", body.Stage, body.OrderID)
		} else {
			_, err = pool.Exec("DELETE FROM fixture_fault WHERE stage=$1", body.Stage)
		}
		if err != nil {
			c.AbortWithStatus(500)
			return
		}
		c.JSON(200, gin.H{"enabled": body.Enabled})
	})
	r.GET("/fixture/inspect/:id", admin, func(c *gin.Context) {
		id := c.Param("id")
		var status string
		var deposit, remaining float64
		err := pool.QueryRow("SELECT status,deposit_lak,remaining_lak FROM orders WHERE id=$1", id).Scan(&status, &deposit, &remaining)
		if err != nil {
			c.AbortWithStatus(404)
			return
		}
		var journals, audits, lines int
		pool.QueryRow("SELECT count(*) FROM journal_entries WHERE reference_id=$1", id).Scan(&journals)
		pool.QueryRow("SELECT count(*) FROM journal_lines l JOIN journal_entries e ON e.id=l.entry_id WHERE e.reference_id=$1", id).Scan(&lines)
		pool.QueryRow("SELECT count(*) FROM audit_logs WHERE resource_id=$1 AND action='MANUAL_SLIP_REVIEW'", id).Scan(&audits)
		var debits, credits float64
		pool.QueryRow("SELECT COALESCE(sum(l.debit),0),COALESCE(sum(l.credit),0) FROM journal_lines l JOIN journal_entries e ON e.id=l.entry_id WHERE e.reference_id=$1", id).Scan(&debits, &credits)
		c.JSON(200, gin.H{"status": status, "deposit": deposit, "remaining": remaining, "journals": journals, "journal_lines": lines, "review_audits": audits, "debits": debits, "credits": credits})
	})
	write := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales)
	read := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RoleFinance, auth.RolePrepress)
	manager := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager)
	money := auth.RequireRoles(auth.RoleAdmin, auth.RoleFinance, "accountant")
	for _, prefix := range []string{"/api", "/api/v1"} {
		r.POST(prefix+"/auth/login", auth.HandleLogin)
		r.POST(prefix+"/auth/refresh", auth.HandleRefreshToken)
		r.GET(prefix+"/quotations", write, orders.HandleGetQuotations)
		r.POST(prefix+"/quotations", write, orders.HandleSaveQuotation)
		r.PUT(prefix+"/quotations/:id", write, orders.HandleSaveQuotation)
		r.POST(prefix+"/quotations/:id/convert", write, orders.HandleConvertQuotationToOrder)
		r.POST(prefix+"/quotations/:id/approve", manager, orders.HandleApproveQuotation)
		r.POST(prefix+"/quotations/:id/reject", manager, orders.HandleRejectQuotation)
		r.GET(prefix+"/orders", read, orders.HandleGetOrders)
		r.GET(prefix+"/orders/:id", read, orders.HandleGetOrderById)
		r.POST(prefix+"/upload/artwork", read, orders.HandleArtworkUpload)
		r.GET(prefix+"/orders/files/*filepath", orders.HandleServeProtectedFile)
		r.HEAD(prefix+"/orders/files/*filepath", orders.HandleServeProtectedFile)
		r.POST(prefix+"/finance/verify-slip", money, finance.HandleVerifyPaymentSlip)
		r.GET(prefix+"/finance/pending-slips", money, finance.HandleGetPendingSlips)
	}
	r.GET("/uploads/*filepath", orders.HandleServeProtectedFile)
	r.HEAD("/uploads/*filepath", orders.HandleServeProtectedFile)
	r.NoRoute(func(c *gin.Context) { c.JSON(403, gin.H{"error": "Route outside connected fixture scope"}) })
	handler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if req.Header.Get("X-Fixture-Drop-Response") == "after-commit" && req.Method == "POST" && (strings.HasSuffix(req.URL.Path, "/convert") || strings.HasSuffix(req.URL.Path, "/finance/verify-slip")) {
			recorder := httptest.NewRecorder()
			r.ServeHTTP(recorder, req)
			if recorder.Code == 200 || recorder.Code == 201 {
				if hijacker, ok := w.(http.Hijacker); ok {
					conn, _, err := hijacker.Hijack()
					if err == nil {
						log.Printf("[Owned fixture] committed response deliberately lost, status=%d", recorder.Code)
						conn.Close()
						return
					}
				}
			}
			for k, values := range recorder.Header() {
				for _, v := range values {
					w.Header().Add(k, v)
				}
			}
			w.WriteHeader(recorder.Code)
			w.Write(recorder.Body.Bytes())
			return
		}
		r.ServeHTTP(w, req)
	})
	server := &http.Server{Addr: "127.0.0.1:" + port, Handler: handler, ReadHeaderTimeout: 5 * time.Second}
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, os.Interrupt, syscall.SIGTERM)
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()
	select {
	case <-signals:
	case <-shutdown:
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	server.Shutdown(ctx)
}
