package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"somsing.local/backend/auth"
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
	flag.Parse()

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
