package auth

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// makeSignedToken creates a real HMAC-signed JWT for the given role using the
// production GetJWTSecretKey() — tests import real production code, no clone.
func makeSignedToken(t *testing.T, username, role, userID string) string {
	t.Helper()
	claims := &OwnerClaims{
		Username: username,
		UserID:   userID,
		Role:     role,
		FullName: "Test " + role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "som-sing-phim-erp",
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString(GetJWTSecretKey())
	if err != nil {
		t.Fatalf("makeSignedToken: %v", err)
	}
	return signed
}

func setupAuthRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	adminGroup := r.Group("/api/admin")
	adminGroup.Use(RequireAuth("admin", "owner"))
	{
		adminGroup.GET("/finance", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "finance_data"})
		})
	}

	salesGroup := r.Group("/api/sales")
	salesGroup.Use(RequireAuth("sales", "admin"))
	{
		salesGroup.GET("/quotations", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "quotations_data"})
		})
	}

	return r
}

// TestHandleLogin_RejectsEmptyBody verifies 400 for malformed login body.
func TestHandleLogin_RejectsEmptyBody(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/auth/login", HandleLogin)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", nil)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for empty body, got %d", w.Code)
	}
}

// TestRequireAuth_SignedJWT verifies signed JWTs are accepted, role gating works,
// and unsigned/preview tokens are rejected with 401.
func TestRequireAuth_SignedJWT(t *testing.T) {
	os.Setenv("ENVIRONMENT", "development")
	os.Setenv("JWT_SECRET", "")
	defer func() {
		os.Setenv("ENVIRONMENT", "test")
		os.Setenv("JWT_SECRET", "")
	}()

	r := setupAuthRouter()
	adminToken := makeSignedToken(t, "admin", "admin", "usr_admin_001")
	salesToken := makeSignedToken(t, "sales", "sales", "usr_sales_001")

	check := func(method, path, token string, want int, desc string) {
		req, _ := http.NewRequest(method, path, nil)
		if token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != want {
			t.Errorf("%s: expected %d, got %d", desc, want, w.Code)
		}
	}

	check("GET", "/api/admin/finance", adminToken, http.StatusOK, "admin -> finance 200")
	check("GET", "/api/sales/quotations", salesToken, http.StatusOK, "sales -> quotations 200")
	check("GET", "/api/admin/finance", salesToken, http.StatusForbidden, "sales -> finance 403")
	check("GET", "/api/admin/finance", "", http.StatusUnauthorized, "no token -> 401")
	check("GET", "/api/admin/finance", "mock-jwt-token-for-admin", http.StatusUnauthorized, "unsigned mock -> 401")
	check("GET", "/api/admin/finance", "preview-token", http.StatusUnauthorized, "preview-token -> 401")
}

// TestHandleRefreshToken_RejectsUnsignedTokens verifies 401 for empty/unsigned refresh tokens.
func TestHandleRefreshToken_RejectsUnsignedTokens(t *testing.T) {
	os.Setenv("ENVIRONMENT", "development")
	os.Setenv("JWT_SECRET", "")
	defer func() {
		os.Setenv("ENVIRONMENT", "test")
		os.Setenv("JWT_SECRET", "")
	}()

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/auth/refresh", HandleRefreshToken)

	// Empty body -> 401
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 for empty refresh token, got %d", w.Code)
	}

	// preview-token -> 401 (must not grant admin)
	req2, _ := http.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	req2.Header.Set("Authorization", "Bearer preview-token")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 for preview-token on refresh, got %d -- must not grant admin", w2.Code)
	}
}

// TestHandleRefreshToken_AcceptsValidSignedToken verifies 200 + new token for a real signed refresh token.
func TestHandleRefreshToken_AcceptsValidSignedToken(t *testing.T) {
	os.Setenv("ENVIRONMENT", "development")
	os.Setenv("JWT_SECRET", "")
	defer func() {
		os.Setenv("ENVIRONMENT", "test")
		os.Setenv("JWT_SECRET", "")
	}()

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/auth/refresh", HandleRefreshToken)

	claims := &OwnerClaims{
		Username: "admin",
		UserID:   "usr_admin_001",
		Role:     "admin",
		FullName: "Admin",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "usr_admin_001",
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(14 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "som-sing-phim-erp-refresh",
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := tok.SignedString(GetJWTSecretKey())

	req, _ := http.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	req.Header.Set("Authorization", "Bearer "+signed)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 for valid signed refresh token, got %d", w.Code)
	}
}

func TestValidateJWTSecretOnStartup(t *testing.T) {
	defer func() {
		os.Setenv("ENVIRONMENT", "test")
		os.Setenv("JWT_SECRET", "")
	}()

	os.Setenv("ENVIRONMENT", "development")
	os.Setenv("JWT_SECRET", "")
	if err := ValidateJWTSecretOnStartup(); err != nil {
		t.Errorf("Expected nil in dev mode without secret, got %v", err)
	}

	os.Setenv("ENVIRONMENT", "test")
	os.Setenv("JWT_SECRET", "")
	if err := ValidateJWTSecretOnStartup(); err != nil {
		t.Errorf("Expected nil in test mode without secret, got %v", err)
	}

	// Blank ENVIRONMENT + no secret -> fail closed
	os.Setenv("ENVIRONMENT", "")
	os.Setenv("JWT_SECRET", "")
	if err := ValidateJWTSecretOnStartup(); err == nil {
		t.Errorf("Expected error when ENVIRONMENT is blank and JWT_SECRET is empty")
	}

	os.Setenv("ENVIRONMENT", "production")
	os.Setenv("JWT_SECRET", "")
	if err := ValidateJWTSecretOnStartup(); err == nil {
		t.Errorf("Expected error in production mode with empty secret, got nil")
	}

	os.Setenv("ENVIRONMENT", "production")
	os.Setenv("JWT_SECRET", "super-secure-production-key-32-chars-long!")
	if err := ValidateJWTSecretOnStartup(); err != nil {
		t.Errorf("Expected nil in production mode with valid secret, got %v", err)
	}
}

// TestRequireAuth_RoleMatrix verifies the RBAC matrix for production, finance, HR roles.
func TestRequireAuth_RoleMatrix(t *testing.T) {
	os.Setenv("ENVIRONMENT", "development")
	os.Setenv("JWT_SECRET", "")
	defer func() {
		os.Setenv("ENVIRONMENT", "test")
		os.Setenv("JWT_SECRET", "")
	}()

	gin.SetMode(gin.TestMode)
	r := gin.New()

	financeRoute := r.Group("/api/v1/finance")
	financeRoute.Use(RequireRoles("admin", "finance", "accountant"))
	{
		financeRoute.GET("/summary", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok"})
		})
	}

	hrRoute := r.Group("/api/v1/hr")
	hrRoute.Use(RequireRoles("admin"))
	{
		hrRoute.GET("/employees", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok"})
		})
	}

	prodRoute := r.Group("/api/v1/production")
	prodRoute.Use(RequireRoles("admin", "manager", "production"))
	{
		prodRoute.GET("/schedule", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok"})
		})
	}

	productionToken := makeSignedToken(t, "production", "production", "usr_prod_001")

	check := func(method, path, token string, want int, desc string) {
		req, _ := http.NewRequest(method, path, nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != want {
			t.Errorf("%s: expected %d, got %d", desc, want, w.Code)
		}
	}

	check("GET", "/api/v1/production/schedule", productionToken, http.StatusOK, "production -> schedule 200")
	check("GET", "/api/v1/finance/summary", productionToken, http.StatusForbidden, "production -> finance 403")
	check("GET", "/api/v1/hr/employees", productionToken, http.StatusForbidden, "production -> HR 403")
}

// TestHandleRefreshToken_RejectsExpiredToken verifies 401 for an expired refresh token.
func TestHandleRefreshToken_RejectsExpiredToken(t *testing.T) {
	os.Setenv("ENVIRONMENT", "development")
	os.Setenv("JWT_SECRET", "")
	defer func() {
		os.Setenv("ENVIRONMENT", "test")
	}()

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/auth/refresh", HandleRefreshToken)

	// Create an EXPIRED refresh token
	claims := &OwnerClaims{
		Username: "admin",
		UserID:   "usr_admin_001",
		Role:     "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "usr_admin_001",
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)), // Expired 1 hour ago
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			Issuer:    "som-sing-phim-erp-refresh",
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := tok.SignedString(GetJWTSecretKey())

	req, _ := http.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	req.Header.Set("Authorization", "Bearer "+signed)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401 for expired refresh token, got %d", w.Code)
	}
}

// TestHandleRefreshToken_RejectsAccessToken verifies an Access Token cannot be used to refresh.
func TestHandleRefreshToken_RejectsAccessToken(t *testing.T) {
	os.Setenv("ENVIRONMENT", "development")
	os.Setenv("JWT_SECRET", "")
	defer func() {
		os.Setenv("ENVIRONMENT", "test")
	}()

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/auth/refresh", HandleRefreshToken)

	// Create a valid ACCESS token (issuer is som-sing-phim-erp)
	accessToken := makeSignedToken(t, "admin", "admin", "usr_admin_001")

	req, _ := http.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401 for access token used as refresh, got %d", w.Code)
	}
}

// TestRequireAuth_RejectsRefreshToken verifies a Refresh Token cannot be used for API access.
func TestRequireAuth_RejectsRefreshToken(t *testing.T) {
	os.Setenv("ENVIRONMENT", "development")
	os.Setenv("JWT_SECRET", "")
	defer func() {
		os.Setenv("ENVIRONMENT", "test")
	}()

	r := setupAuthRouter()

	// Create a valid REFRESH token (issuer is som-sing-phim-erp-refresh)
	claims := &OwnerClaims{
		Username: "admin",
		UserID:   "usr_admin_001",
		Role:     "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "usr_admin_001",
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			Issuer:    "som-sing-phim-erp-refresh",
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	refreshToken, _ := tok.SignedString(GetJWTSecretKey())

	req, _ := http.NewRequest("GET", "/api/admin/finance", nil)
	req.Header.Set("Authorization", "Bearer "+refreshToken)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 for refresh token used for API access, got %d", w.Code)
	}
}
