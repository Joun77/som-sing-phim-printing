package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// RequestLoggerMiddleware logs structured request metadata with latency and correlation ID
func RequestLoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Generate or reuse X-Request-ID
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			bytes := make([]byte, 8)
			if _, err := rand.Read(bytes); err == nil {
				requestID = hex.EncodeToString(bytes)
			} else {
				requestID = fmt.Sprintf("%d", time.Now().UnixNano())
			}
		}

		c.Header("X-Request-ID", requestID)
		c.Set("RequestID", requestID)

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(start)
		status := c.Writer.Status()
		clientIP := c.ClientIP()
		method := c.Request.Method
		path := c.Request.URL.Path

		// Format structured log output
		if len(c.Errors) > 0 {
			log.Printf("[REQ-ERR] [%s] %s %s | %d | %v | IP: %s | Errors: %s",
				requestID, method, path, status, latency, clientIP, c.Errors.String())
		} else if status >= 400 {
			log.Printf("[REQ-WARN] [%s] %s %s | %d | %v | IP: %s",
				requestID, method, path, status, latency, clientIP)
		} else {
			log.Printf("[REQ-OK] [%s] %s %s | %d | %v | IP: %s",
				requestID, method, path, status, latency, clientIP)
		}
	}
}

// SecurityHeadersMiddleware adds essential HTTP security headers
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Next()
	}
}
