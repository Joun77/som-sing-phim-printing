package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type clientVisitor struct {
	lastSeen time.Time
	tokens   float64
}

// IPRateLimiter provides thread-safe IP-based token bucket rate limiting
type IPRateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*clientVisitor
	rate     float64 // tokens per second
	capacity float64 // max burst capacity
}

// NewIPRateLimiter creates a rate limiter with specified max requests per duration
func NewIPRateLimiter(maxRequests int, window time.Duration) *IPRateLimiter {
	rate := float64(maxRequests) / window.Seconds()
	limiter := &IPRateLimiter{
		visitors: make(map[string]*clientVisitor),
		rate:     rate,
		capacity: float64(maxRequests),
	}

	// Periodic cleanup of stale visitors (every 5 minutes)
	go limiter.cleanupStaleVisitors(5 * time.Minute)

	return limiter
}

func (l *IPRateLimiter) allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	v, exists := l.visitors[ip]
	if !exists {
		l.visitors[ip] = &clientVisitor{
			lastSeen: now,
			tokens:   l.capacity - 1,
		}
		return true
	}

	// Calculate tokens added since last seen
	elapsed := now.Sub(v.lastSeen).Seconds()
	v.lastSeen = now
	v.tokens += elapsed * l.rate
	if v.tokens > l.capacity {
		v.tokens = l.capacity
	}

	if v.tokens >= 1.0 {
		v.tokens -= 1.0
		return true
	}

	return false
}

func (l *IPRateLimiter) cleanupStaleVisitors(interval time.Duration) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		l.mu.Lock()
		now := time.Now()
		for ip, v := range l.visitors {
			if now.Sub(v.lastSeen) > 10*time.Minute {
				delete(l.visitors, ip)
			}
		}
		l.mu.Unlock()
	}
}

// RateLimitMiddleware creates a Gin middleware with specified limit
func RateLimitMiddleware(maxRequests int, window time.Duration) gin.HandlerFunc {
	limiter := NewIPRateLimiter(maxRequests, window)

	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		if !limiter.allow(clientIP) {
			c.Header("Retry-After", "60")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "Too Many Requests",
				"message": "Rate limit exceeded. Please try again later.",
			})
			return
		}
		c.Next()
	}
}
