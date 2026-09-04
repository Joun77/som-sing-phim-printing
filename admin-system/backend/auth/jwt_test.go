package auth

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
)

func setupAuthRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/auth/login", HandleLogin)

	// Admin only endpoint
	adminGroup := r.Group("/api/admin")
	adminGroup.Use(RequireAuth("admin", "owner"))
	{
		adminGroup.GET("/finance", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "finance_data"})
		})
	}

	// Sales and Admin endpoint
	salesGroup := r.Group("/api/sales")
	salesGroup.Use(RequireAuth("sales", "admin"))
	{
		salesGroup.GET("/quotations", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "quotations_data"})
		})
	}

	return r
}

func TestHandleLogin_SuccessAndFailure(t *testing.T) {
	r := setupAuthRouter()

	// 1. Success Admin Login
	loginBody, _ := json.Marshal(LoginRequest{
		Username:   "admin",
		Password:   "admin123",
		RememberMe: true,
	})
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(loginBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for admin login, got %d", w.Code)
	}

	var resp LoginResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse login response: %v", err)
	}
	if resp.Token == "" || resp.Role != "admin" {
		t.Fatalf("Unexpected response payload: %+v", resp)
	}

	// 2. Failed Login
	badBody, _ := json.Marshal(LoginRequest{
		Username: "admin",
		Password: "wrongpassword",
	})
	badReq, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(badBody))
	badReq.Header.Set("Content-Type", "application/json")
	badW := httptest.NewRecorder()
	r.ServeHTTP(badW, badReq)

	if badW.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401 Unauthorized for bad credentials, got %d", badW.Code)
	}
}

func TestRequireAuth_RoleAccessAndForbidden(t *testing.T) {
	r := setupAuthRouter()

	// 1. Login as sales
	salesBody, _ := json.Marshal(LoginRequest{
		Username: "sales",
		Password: "sales123",
	})
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(salesBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var salesResp LoginResponse
	json.Unmarshal(w.Body.Bytes(), &salesResp)

	// 2. Sales accessing /api/sales/quotations -> Should SUCCEED (200)
	salesReq, _ := http.NewRequest(http.MethodGet, "/api/sales/quotations", nil)
	salesReq.Header.Set("Authorization", "Bearer "+salesResp.Token)
	salesW := httptest.NewRecorder()
	r.ServeHTTP(salesW, salesReq)

	if salesW.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for sales on quotations, got %d", salesW.Code)
	}

	// 3. Sales accessing /api/admin/finance -> Should be FORBIDDEN (403)
	forbiddenReq, _ := http.NewRequest(http.MethodGet, "/api/admin/finance", nil)
	forbiddenReq.Header.Set("Authorization", "Bearer "+salesResp.Token)
	forbiddenW := httptest.NewRecorder()
	r.ServeHTTP(forbiddenW, forbiddenReq)

	if forbiddenW.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for sales accessing finance, got %d", forbiddenW.Code)
	}

	// 4. Missing Token accessing /api/admin/finance -> Should be UNAUTHORIZED (401)
	unauthReq, _ := http.NewRequest(http.MethodGet, "/api/admin/finance", nil)
	unauthW := httptest.NewRecorder()
	r.ServeHTTP(unauthW, unauthReq)

	if unauthW.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for missing token, got %d", unauthW.Code)
	}
}

func TestHandleRefreshToken(t *testing.T) {
	r := gin.New()
	r.POST("/api/auth/login", HandleLogin)
	r.POST("/api/auth/refresh", HandleRefreshToken)

	// Step 1: Login
	loginBody, _ := json.Marshal(LoginRequest{
		Username:   "admin",
		Password:   "admin123",
		RememberMe: true,
	})
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(loginBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var loginResp LoginResponse
	json.Unmarshal(w.Body.Bytes(), &loginResp)
	if loginResp.RefreshToken == "" {
		t.Fatalf("Expected non-empty refresh token from login")
	}

	// Step 2: Refresh
	refreshBody, _ := json.Marshal(RefreshRequest{
		RefreshToken: loginResp.RefreshToken,
	})
	refreshReq, _ := http.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewBuffer(refreshBody))
	refreshReq.Header.Set("Content-Type", "application/json")
	refreshW := httptest.NewRecorder()
	r.ServeHTTP(refreshW, refreshReq)

	if refreshW.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for token refresh, got %d", refreshW.Code)
	}

	var refreshResp LoginResponse
	json.Unmarshal(refreshW.Body.Bytes(), &refreshResp)
	if refreshResp.Token == "" {
		t.Fatalf("Expected new access token from refresh endpoint")
	}
}

func TestValidateJWTSecretOnStartup(t *testing.T) {
	// 1. In dev environment without secret -> no error
	os.Setenv("ENVIRONMENT", "development")
	os.Setenv("JWT_SECRET", "")
	if err := ValidateJWTSecretOnStartup(); err != nil {
		t.Errorf("Expected nil in dev mode without secret, got %v", err)
	}

	// 2. In production environment with empty secret -> should fail
	os.Setenv("ENVIRONMENT", "production")
	os.Setenv("JWT_SECRET", "")
	if err := ValidateJWTSecretOnStartup(); err == nil {
		t.Errorf("Expected error in production mode with empty secret, got nil")
	}

	// 3. In production environment with valid secret -> should pass
	os.Setenv("ENVIRONMENT", "production")
	os.Setenv("JWT_SECRET", "super-secure-production-key-32-chars-long!")
	if err := ValidateJWTSecretOnStartup(); err != nil {
		t.Errorf("Expected nil in production mode with valid secret, got %v", err)
	}

	// Cleanup
	os.Setenv("ENVIRONMENT", "test")
	os.Setenv("JWT_SECRET", "")
}

func TestRequireAuth_ProductionAndFinanceRoles(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/auth/login", HandleLogin)

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

	// Login as production user
	loginBody, _ := json.Marshal(LoginRequest{
		Username: "production",
		Password: "production123",
	})
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(loginBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var prodResp LoginResponse
	json.Unmarshal(w.Body.Bytes(), &prodResp)

	// Production accessing /api/v1/production/schedule -> 200 OK
	prodReq, _ := http.NewRequest(http.MethodGet, "/api/v1/production/schedule", nil)
	prodReq.Header.Set("Authorization", "Bearer "+prodResp.Token)
	prodW := httptest.NewRecorder()
	r.ServeHTTP(prodW, prodReq)
	if prodW.Code != http.StatusOK {
		t.Errorf("Expected 200 for production accessing production schedule, got %d", prodW.Code)
	}

	// Production accessing /api/v1/finance/summary -> 403 Forbidden
	finReq, _ := http.NewRequest(http.MethodGet, "/api/v1/finance/summary", nil)
	finReq.Header.Set("Authorization", "Bearer "+prodResp.Token)
	finW := httptest.NewRecorder()
	r.ServeHTTP(finW, finReq)
	if finW.Code != http.StatusForbidden {
		t.Errorf("Expected 403 for production accessing finance summary, got %d", finW.Code)
	}

	// Production accessing /api/v1/hr/employees -> 403 Forbidden
	hrReq, _ := http.NewRequest(http.MethodGet, "/api/v1/hr/employees", nil)
	hrReq.Header.Set("Authorization", "Bearer "+prodResp.Token)
	hrW := httptest.NewRecorder()
	r.ServeHTTP(hrW, hrReq)
	if hrW.Code != http.StatusForbidden {
		t.Errorf("Expected 403 for production accessing HR, got %d", hrW.Code)
	}
}
