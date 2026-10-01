package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"somsing.local/backend/middleware"
)

func TestCORSMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		env            string
		allowedOrigins string
		origin         string
		expectAllow    bool
	}{
		{
			name:           "Production explicit allow",
			env:            "production",
			allowedOrigins: "https://example.com",
			origin:         "https://example.com",
			expectAllow:    true,
		},
		{
			name:           "Production reject unknown",
			env:            "production",
			allowedOrigins: "https://example.com",
			origin:         "https://attacker.com",
			expectAllow:    false,
		},
		{
			name:           "Production reject wildcard",
			env:            "production",
			allowedOrigins: "*",
			origin:         "https://any.com",
			expectAllow:    false, // Fail closed on wildcard in production
		},
		{
			name:           "Development allow wildcard",
			env:            "development",
			allowedOrigins: "*",
			origin:         "https://any.com",
			expectAllow:    true,
		},
		{
			name:           "Development exact localhost allow",
			env:            "development",
			allowedOrigins: "https://example.com",
			origin:         "http://localhost:5173",
			expectAllow:    true, // Fallback for explicit dev environments
		},
		{
			name:           "Development evil localhost reject",
			env:            "development",
			allowedOrigins: "https://example.com",
			origin:         "http://localhost.evil.com",
			expectAllow:    false, // net/url hostname parsing prevents bypass
		},
		{
			name:           "Blank environment reject localhost fallback",
			env:            "",
			allowedOrigins: "https://example.com",
			origin:         "http://localhost:5173",
			expectAllow:    false, // Blank/staging no longer get localhost convenience
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Setenv("ENVIRONMENT", tt.env)
			os.Setenv("ALLOWED_ORIGINS", tt.allowedOrigins)

			router := gin.New()
			router.Use(middleware.CORSMiddleware())
			router.GET("/test", func(c *gin.Context) {
				c.String(http.StatusOK, "ok")
			})

			req, _ := http.NewRequest("GET", "/test", nil)
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			allowOrigin := w.Header().Get("Access-Control-Allow-Origin")
			if tt.expectAllow && allowOrigin != tt.origin {
				t.Errorf("Expected CORS to allow %v, got %v", tt.origin, allowOrigin)
			}
			if !tt.expectAllow && allowOrigin != "" {
				t.Errorf("Expected CORS to reject %v, but allowed", tt.origin)
			}
		})
	}
}
