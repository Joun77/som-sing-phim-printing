package auth_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"somsing.local/backend/auth"
)

func generateTestToken(role string) string {
	claims := auth.OwnerClaims{
		Username:   "testuser",
		Role:       role,
		UserID:     "test-id",
		EmployeeID: "emp-id",
		Email:      "test@example.com",
		FullName:   "Test User",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "test-id",
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "som-sing-phim-erp",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString(auth.GetJWTSecretKey())
	return tokenString
}

func setupTestRouter(allowedRoles ...string) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/protected", auth.RequireRoles(allowedRoles...), func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})
	return router
}

func TestRequireRoles(t *testing.T) {
	tests := []struct {
		name         string
		allowedRoles []string
		userRole     string
		expectCode   int
	}{
		{"Admin has system-wide access", []string{"sales"}, "admin", http.StatusOK},
		{"Manager access allowed", []string{"manager", "admin"}, "manager", http.StatusOK},
		{"Sales denied on manager route", []string{"manager", "admin"}, "sales", http.StatusForbidden},
		{"Finance allowed on finance route", []string{"finance"}, "finance", http.StatusOK},
		{"Finance allowed via accountant alias", []string{"finance"}, "accountant", http.StatusOK},
		{"Accountant allowed on finance route", []string{"accountant"}, "finance", http.StatusOK},
		{"Unauthorized ceo rejected", []string{"manager"}, "ceo", http.StatusForbidden},
		{"Authorized owner allowed (canonical admin)", []string{"sales"}, "owner", http.StatusOK},
		{"Authorized super_admin allowed (canonical admin)", []string{"sales"}, "super_admin", http.StatusOK},
		{"Production allowed on prepress/production route", []string{"production", "prepress"}, "production", http.StatusOK},
		{"Prepress allowed on prepress/production route", []string{"production", "prepress"}, "prepress", http.StatusOK},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := setupTestRouter(tt.allowedRoles...)
			req, _ := http.NewRequest("GET", "/protected", nil)
			req.Header.Set("Authorization", "Bearer "+generateTestToken(tt.userRole))

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != tt.expectCode {
				t.Errorf("Expected status %d for role %s accessing %v, got %d", tt.expectCode, tt.userRole, tt.allowedRoles, w.Code)
			}
		})
	}
}
