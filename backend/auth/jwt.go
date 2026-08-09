package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token    string `json:"token"`
	Role     string `json:"role"`
	FullName string `json:"fullname"`
}

// HandleLogin authenticates credentials and issues a mock token
func HandleLogin(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid login payload"})
		return
	}

	// Simple hardcoded RBAC mock users for development
	var role, fullname string
	if req.Username == "admin" && req.Password == "admin123" {
		role = "admin"
		fullname = "Som Sing Admin"
	} else if req.Username == "sales" && req.Password == "sales123" {
		role = "sales"
		fullname = "Som Sing Sales Representative"
	} else if req.Username == "production" && req.Password == "prod123" {
		role = "production"
		fullname = "Som Sing Lead Printer"
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// Issue mock JWT token
	mockToken := "mock-jwt-token-for-" + role

	c.JSON(http.StatusOK, LoginResponse{
		Token:    mockToken,
		Role:     role,
		FullName: fullname,
	})
}

// AuthMiddleware inspects mock token for role access control
func AuthMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		var role string
		if strings.HasSuffix(token, "admin") {
			role = "admin"
		} else if strings.HasSuffix(token, "sales") {
			role = "sales"
		} else if strings.HasSuffix(token, "production") {
			role = "production"
		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid session token"})
			c.Abort()
			return
		}

		// Verify role match
		matched := false
		for _, r := range allowedRoles {
			if r == role {
				matched = true
				break
			}
		}

		if !matched && len(allowedRoles) > 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied for this role"})
			c.Abort()
			return
		}

		c.Set("user_role", role)
		c.Next()
	}
}
