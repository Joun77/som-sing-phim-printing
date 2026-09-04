package auth

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// ValidateJWTSecretOnStartup checks if JWT_SECRET is present when running in production
func ValidateJWTSecretOnStartup() error {
	secret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	env := strings.ToLower(strings.TrimSpace(os.Getenv("ENVIRONMENT")))
	if env == "production" && secret == "" {
		return fmt.Errorf("FATAL: JWT_SECRET environment variable is missing or empty in production mode")
	}
	return nil
}

func getSecret() []byte {
	secret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if secret == "" {
		env := strings.ToLower(strings.TrimSpace(os.Getenv("ENVIRONMENT")))
		if env == "production" {
			log.Fatalf("FATAL: JWT_SECRET must be set in production mode")
		}
		return []byte("som-sing-phim-super-secret-key-2026")
	}
	return []byte(secret)
}

func GetJWTSecretKey() []byte {
	return getSecret()
}

type LoginRequest struct {
	Username   string `json:"username" binding:"required"`
	Password   string `json:"password" binding:"required"`
	RememberMe bool   `json:"remember_me"`
}

type LoginResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	Role         string `json:"role"`
	FullName     string `json:"fullname"`
	ExpiresAt    int64  `json:"expires_at"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type OwnerClaims struct {
	Username string `json:"username"`
	UserID   string `json:"user_id,omitempty"`
	Role     string `json:"role"`
	Email    string `json:"email,omitempty"`
	FullName string `json:"fullname"`
	jwt.RegisteredClaims
}

// HandleLogin authenticates single owner / admin credentials and issues real JWT token
func HandleLogin(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid login payload"})
		return
	}

	var role, fullname, email, userId string

	// 1. Try real PostgreSQL database authentication with bcrypt
	dbUser, dbErr := AuthenticateUserAgainstDB(req.Username, req.Password)
	if dbErr == nil && dbUser != nil {
		role = dbUser.Role
		fullname = dbUser.FullName
		email = dbUser.Email
		userId = dbUser.ID
	} else if dbErr != nil && dbErr.Error() == "ACCOUNT_DEACTIVATED" {
		c.JSON(http.StatusForbidden, gin.H{"error": "ບັນຊີນີ້ຖືກປິດການໃຊ້ງານ ກະລຸນາຕິດຕໍ່ Super Admin (Account is deactivated)"})
		return
	} else {
		// 2. Fallback to environment variables or seed accounts
		ownerUser := os.Getenv("OWNER_USERNAME")
		if ownerUser == "" {
			ownerUser = "admin"
		}
		ownerPass := os.Getenv("OWNER_PASSWORD")
		if ownerPass == "" {
			ownerPass = "admin123"
		}

		if req.Username == ownerUser && req.Password == ownerPass {
			role = "admin"
			fullname = "Som-Sing Printing Owner (Super Admin)"
			email = "owner@somsingphim.la"
			userId = "usr_admin_001"
		} else if req.Username == "admin" && req.Password == "admin123" {
			role = "admin"
			fullname = "Som-Sing Printing Owner (Super Admin)"
			email = "admin@somsingphim.la"
			userId = "usr_admin_001"
		} else if req.Username == "manager" && req.Password == "manager123" {
			role = "manager"
			fullname = "Som Sing General Manager"
			email = "manager@somsingphim.la"
			userId = "usr_mgr_001"
		} else if req.Username == "prepress" && req.Password == "prepress123" {
			role = "prepress"
			fullname = "Som Sing Prepress Specialist"
			email = "prepress@somsingphim.la"
			userId = "usr_prep_001"
		} else if req.Username == "sales" && req.Password == "sales123" {
			role = "sales"
			fullname = "Som Sing Sales Representative"
			email = "sales@somsingphim.la"
			userId = "usr_sales_001"
		} else if (req.Username == "production" && req.Password == "production123") || (req.Username == "production" && req.Password == "prod123") {
			role = "production"
			fullname = "Som Sing Lead Printer"
			email = "production@somsingphim.la"
			userId = "usr_prod_001"
		} else if (req.Username == "finance" && req.Password == "finance123") || (req.Username == "accountant" && req.Password == "acc123") {
			role = "finance"
			fullname = "Som Sing Lead Accountant"
			email = "finance@somsingphim.la"
			userId = "usr_fin_001"
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "ຊື່ຜູ້ໃຊ້ງານ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ (Invalid username or password)"})
			return
		}
	}

	// 24 hours standard token expiration
	accessDuration := 24 * time.Hour
	refreshDuration := 14 * 24 * time.Hour
	if req.RememberMe {
		accessDuration = 7 * 24 * time.Hour
		refreshDuration = 30 * 24 * time.Hour
	}
	expirationTime := time.Now().Add(accessDuration)

	claims := &OwnerClaims{
		Username: req.Username,
		UserID:   userId,
		Role:     role,
		Email:    email,
		FullName: fullname,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userId,
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "som-sing-phim-erp",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(GetJWTSecretKey())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate security token"})
		return
	}

	// Generate Refresh Token
	refreshClaims := &OwnerClaims{
		Username: req.Username,
		UserID:   userId,
		Role:     role,
		Email:    email,
		FullName: fullname,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userId,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(refreshDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "som-sing-phim-erp-refresh",
		},
	}
	refreshTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, _ := refreshTokenObj.SignedString(GetJWTSecretKey())

	c.JSON(http.StatusOK, LoginResponse{
		Token:        tokenString,
		RefreshToken: refreshTokenString,
		Role:         role,
		FullName:     fullname,
		ExpiresAt:    expirationTime.Unix(),
	})
}

// HandleRefreshToken silently issues a fresh access token without forcing user logout
func HandleRefreshToken(c *gin.Context) {
	var req RefreshRequest
	_ = c.ShouldBindJSON(&req)

	authHeader := c.GetHeader("Authorization")
	rawToken := req.RefreshToken
	if rawToken == "" && authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
		rawToken = strings.TrimPrefix(authHeader, "Bearer ")
	}

	if rawToken == "" || rawToken == "preview-token" {
		// Mock preview token fallback
		expirationTime := time.Now().Add(30 * time.Minute)
		c.JSON(http.StatusOK, LoginResponse{
			Token:        "preview-token",
			RefreshToken: "preview-refresh-token",
			Role:         "admin",
			FullName:     "Som-Sing Printing Owner (Super Admin)",
			ExpiresAt:    expirationTime.Unix(),
		})
		return
	}

	claims := &OwnerClaims{}
	_, err := jwt.ParseWithClaims(rawToken, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return GetJWTSecretKey(), nil
	})

	if err != nil && !strings.Contains(err.Error(), "expired") {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	// Issue fresh token
	newExpiration := time.Now().Add(24 * time.Hour)
	newClaims := &OwnerClaims{
		Username: claims.Username,
		UserID:   claims.UserID,
		Role:     claims.Role,
		Email:    claims.Email,
		FullName: claims.FullName,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   claims.UserID,
			ExpiresAt: jwt.NewNumericDate(newExpiration),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "som-sing-phim-erp",
		},
	}

	newToken := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)
	newTokenString, err := newToken.SignedString(GetJWTSecretKey())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		Token:        newTokenString,
		RefreshToken: rawToken,
		Role:         claims.Role,
		FullName:     claims.FullName,
		ExpiresAt:    newExpiration.Unix(),
	})
}

// RequireAuth middleware verifies JWT token and optionally checks role permissions
func RequireAuth(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Support fallback legacy mock tokens for local dev/testing
		if strings.HasPrefix(tokenString, "mock-jwt-token-for-") || tokenString == "preview-token" {
			role := "admin"
			if strings.HasPrefix(tokenString, "mock-jwt-token-for-") {
				role = strings.TrimPrefix(tokenString, "mock-jwt-token-for-")
			}
			c.Set("user_role", role)
			c.Set("username", role)
			c.Set("user_fullname", "Som Sing Staff")
			if !CheckRole(role, allowedRoles) {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: insufficient permissions for role " + role})
				c.Abort()
				return
			}
			c.Next()
			return
		}

		claims := &OwnerClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return GetJWTSecretKey(), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("username", claims.Username)
		c.Set("user_id", claims.UserID)
		c.Set("user_role", claims.Role)
		c.Set("user_email", claims.Email)
		c.Set("user_fullname", claims.FullName)

		if !CheckRole(claims.Role, allowedRoles) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: insufficient permissions for role " + claims.Role})
			c.Abort()
			return
		}

		c.Next()
	}
}

// CheckRole determines if user role is authorized for given endpoints
func CheckRole(userRole string, allowedRoles []string) bool {
	if len(allowedRoles) == 0 {
		return true
	}
	userRoleLower := strings.ToLower(strings.TrimSpace(userRole))
	// Super admin / Owner always has system-wide access
	if userRoleLower == "admin" || userRoleLower == "owner" || userRoleLower == "super_admin" {
		return true
	}
	for _, r := range allowedRoles {
		allowed := strings.ToLower(strings.TrimSpace(r))
		if allowed == userRoleLower {
			return true
		}
		// Account alias compatibility
		if (allowed == "finance" || allowed == "accountant") && (userRoleLower == "finance" || userRoleLower == "accountant") {
			return true
		}
	}
	return false
}

// RequireRole is an alias for RequireAuth with specific roles
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return RequireAuth(allowedRoles...)
}

// RequireRoles is an alias for RequireAuth with specific roles
func RequireRoles(allowedRoles ...string) gin.HandlerFunc {
	return RequireAuth(allowedRoles...)
}

// AuthMiddleware legacy compatibility helper
func AuthMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return RequireAuth(allowedRoles...)
}

// HandleLogout handles user logout session termination
func HandleLogout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Logged out successfully",
	})
}
