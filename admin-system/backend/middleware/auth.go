package middleware

import (
	"net/http"
	"net/url"
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
				if o == "*" {
					if env == "production" {
						continue // fail closed on wildcard in production
					}
					isAllowed = true
					break
				} else if strings.EqualFold(o, origin) {
					isAllowed = true
					break
				}
			}
			// Note: wildcard domain-suffix bypass removed \u2014 origins must match the explicit allowlist exactly.
			// To allow additional domains (e.g., custom Firebase hostnames), add them to ALLOWED_ORIGINS env var.
		}

		if isAllowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		} else if (env == "development" || env == "dev" || env == "test" || env == "local") && origin != "" {
			// In explicit non-production modes, allow exact localhost or 127.0.0.1 origins.
			// Intentionally using net/url to safely parse hostname and prevent "localhost.evil.com" bypass.
			parsedOrigin, err := url.Parse(origin)
			if err == nil {
				hostname := parsedOrigin.Hostname()
				if hostname == "localhost" || hostname == "127.0.0.1" {
					c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
					c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
				}
			}
			// Any other origin gets no CORS grant — do not add a wildcard fallback
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
