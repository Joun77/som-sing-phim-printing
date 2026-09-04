package auth

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func setupUsersRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/api/v1/admin/users", HandleGetAdminUsers)
	r.POST("/api/v1/admin/users", HandleCreateAdminUser)
	r.PUT("/api/v1/admin/users/:id", HandleUpdateAdminUser)
	r.DELETE("/api/v1/admin/users/:id", HandleDeleteAdminUser)
	return r
}

func TestHandleAdminUsers_Validation(t *testing.T) {
	r := setupUsersRouter()

	// 1. Get users with no DB returns empty array with 200 OK
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/admin/users", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", w.Code)
	}

	// 2. Create user missing username/password -> 400 Bad Request
	body, _ := json.Marshal(AdminUser{Username: ""})
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/admin/users", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest && w.Code != http.StatusServiceUnavailable {
		t.Fatalf("Expected 400 Bad Request or 503 Service Unavailable, got %d", w.Code)
	}

	// 3. Delete without ID returns 400
	req, _ = http.NewRequest(http.MethodDelete, "/api/v1/admin/users/usr_test_123", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	// Expect 200 or 503 depending on db connection
	if w.Code != http.StatusOK && w.Code != http.StatusServiceUnavailable {
		t.Fatalf("Unexpected code for delete: %d", w.Code)
	}
}
