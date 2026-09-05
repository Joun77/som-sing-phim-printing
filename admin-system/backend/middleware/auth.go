package middleware

import (
	"net/http"
	"os"
	"strings"

	"somsing.local/backend/auth"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware configuration supporting multi-origin requests and environment-based whitelisting
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		allowedOriginsEnv := os.Getenv("ALLOWED_ORIGINS")
		env := strings.ToLower(strings.TrimSpace(os.Getenv("ENVIRONMENT")))

		var allowedOrigins []string
		if allowedOriginsEnv != "" {
			parts := strings.Split(allowedOriginsEnv, ",")
			for _, p := range parts {
				trimmed := strings.TrimSpace(p)
				if trimmed != "" {
					allowedOrigins = append(allowedOrigins, trimmed)
				}
			}
		}

		// Default development & production origins
		if len(allowedOrigins) == 0 {
			allowedOrigins = []string{
				"http://localhost:5173",
				"http://localhost:5174",
				"http://localhost:3000",
				"http://127.0.0.1:5173",
				"http://127.0.0.1:5174",
				"http://127.0.0.1:3000",
				"https://som-sing-phim-admin.web.app",
				"https://som-sing-phim-admin.firebaseapp.com",
				"https://som-sing-phim-service.web.app",
				"https://som-sing-phim-service.firebaseapp.com",
				"https://somsingphim.tail2bf83b.ts.net",
			}
		}

		isAllowed := false
		if origin != "" {
			for _, o := range allowedOrigins {
				if o == "*" || strings.EqualFold(o, origin) {
					isAllowed = true
					break
				}
			}
			// Fallback: automatically allow any Som Sing Phim firebase subdomains or Tailscale domains
			if !isAllowed && (strings.HasSuffix(origin, ".web.app") || strings.HasSuffix(origin, ".firebaseapp.com") || strings.HasSuffix(origin, ".ts.net") || strings.Contains(origin, "100.116.116.18")) {
				isAllowed = true
			}
		}

		if isAllowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		} else if env != "production" {
			// In dev mode with non-origin or fallback
			if origin != "" {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			} else {
				c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
			}
		}

		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, Pragma, Expires, X-Requested-With, Idempotency-Key, X-Request-ID")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// JWTAuthMiddleware enforces JWT token verification and optional role checks for admin routes
func JWTAuthMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return auth.RequireRoles(allowedRoles...)
}
