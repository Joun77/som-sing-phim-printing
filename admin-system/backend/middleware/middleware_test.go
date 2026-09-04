package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestRateLimitMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Allow only 2 requests per 500ms
	router.Use(RateLimitMiddleware(2, 500*time.Millisecond))
	router.GET("/test-limit", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// Req 1: OK
	w1 := httptest.NewRecorder()
	req1, _ := http.NewRequest("GET", "/test-limit", nil)
	router.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Fatalf("Req 1: expected 200, got %d", w1.Code)
	}

	// Req 2: OK
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/test-limit", nil)
	router.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("Req 2: expected 200, got %d", w2.Code)
	}

	// Req 3: Exceeded -> 429
	w3 := httptest.NewRecorder()
	req3, _ := http.NewRequest("GET", "/test-limit", nil)
	router.ServeHTTP(w3, req3)
	if w3.Code != http.StatusTooManyRequests {
		t.Fatalf("Req 3: expected 429, got %d", w3.Code)
	}
}

func TestSecurityHeadersAndLoggerMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	router.Use(RequestLoggerMiddleware())
	router.Use(SecurityHeadersMiddleware())

	router.GET("/test-headers", func(c *gin.Context) {
		c.String(http.StatusOK, "secure")
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test-headers", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d", w.Code)
	}

	if w.Header().Get("X-Request-ID") == "" {
		t.Errorf("Expected X-Request-ID header to be present")
	}

	if w.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Errorf("Expected X-Content-Type-Options: nosniff")
	}

	if w.Header().Get("X-Frame-Options") != "DENY" {
		t.Errorf("Expected X-Frame-Options: DENY")
	}
}

func TestCORSMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(CORSMiddleware())

	router.GET("/test-cors", func(c *gin.Context) {
		c.String(http.StatusOK, "cors-ok")
	})

	// 1. Preflight OPTIONS request
	optReq, _ := http.NewRequest("OPTIONS", "/test-cors", nil)
	optReq.Header.Set("Origin", "http://localhost:5173")
	optW := httptest.NewRecorder()
	router.ServeHTTP(optW, optReq)

	if optW.Code != http.StatusNoContent {
		t.Errorf("Expected 204 No Content for OPTIONS preflight, got %d", optW.Code)
	}
	if optW.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
		t.Errorf("Expected CORS origin header to match requested origin, got %s", optW.Header().Get("Access-Control-Allow-Origin"))
	}

	// 2. GET request with Origin
	getReq, _ := http.NewRequest("GET", "/test-cors", nil)
	getReq.Header.Set("Origin", "http://localhost:3000")
	getW := httptest.NewRecorder()
	router.ServeHTTP(getW, getReq)

	if getW.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for GET, got %d", getW.Code)
	}
	if getW.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
		t.Errorf("Expected CORS origin header to match http://localhost:3000, got %s", getW.Header().Get("Access-Control-Allow-Origin"))
	}
}
