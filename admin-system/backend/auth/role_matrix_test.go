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

// TestActualRegisteredRoleMatrixAliases (Simulated Middleware Aliases)
// NOTE: This test honestly recreates middleware aliases manually. It DOES NOT exercise the actual
// registered routes from main.go because the router is encapsulated in main().
// To prevent drift, any changes to auth groupings in main.go MUST be replicated here.
// True actual registry linkage would require refactoring main.go to export a RegisterRoutes(r *gin.Engine) function
// so that a main_test.go could iterate over r.Routes() and assert on HandlerNames.
func TestActualRegisteredRoleMatrixAliases(t *testing.T) {
	// Setup test environment to bypass secret check
	os.Setenv("ENVIRONMENT", "test")
	os.Setenv("JWT_SECRET", "test-secret")
	defer func() {
		os.Setenv("ENVIRONMENT", "")
		os.Setenv("JWT_SECRET", "")
	}()

	gin.SetMode(gin.TestMode)
	r := gin.New()

	// 1. Recreate the EXACT aliases from main.go
	aliases := map[string][]string{
		"adminSettingsAuth":     {RoleAdmin, RoleManager, "owner"},
		"ppmAuth":               {RoleAdmin, RoleManager, RoleProduction, RolePrepress, "owner"},
		"inventoryReadAuth":     {RoleAdmin, RoleManager, RoleSales, RoleProduction, RoleFinance, RolePrepress, "owner"},
		"inventoryWriteAuth":    {RoleAdmin, RoleManager, RoleProduction, RolePrepress, "owner"},
		"assetReadAuth":         {RoleAdmin, RoleManager, RoleProduction, RolePrepress, RoleSales, RoleFinance, "owner"},
		"assetWriteAuth":        {RoleAdmin, RoleManager, RoleProduction, RolePrepress, "owner"},
		"financeAuth":           {RoleAdmin, RoleManager, RoleFinance, "owner"},
		"dashboardAuth":         {RoleAdmin, RoleManager, RoleFinance, "owner"},
		"artworkAuth":           {RoleAdmin, RoleManager, RoleSales, RolePrepress, RoleProduction},
		"batchZipAuth":          {RoleAdmin, RoleManager, RoleSales, RolePrepress, RoleProduction},
		"ordersAuth":            {RoleAdmin, RoleManager, RoleSales, RoleFinance, RoleProduction, RolePrepress},
		"ordersWriteAuth":       {RoleAdmin, RoleManager, RoleSales},
		"quotationAuth":         {RoleAdmin, RoleManager, RoleSales},
		"issueTrackingAuth":     {RoleAdmin, RoleManager, RoleOwner, "super_admin"}, // from HandleIssueTrackingToken route
		"productionAdminAuth":   {RoleAdmin, RoleManager, RoleOwner, "super_admin"},
		"productionGeneralAuth": {RoleAdmin, RoleManager, RoleOwner, RoleProduction, "super_admin", "staff"},
		"deliveryWriteAuth":     {RoleAdmin, RoleManager, RoleOwner, "super_admin"},
		"deliveryReadAuth":      {RoleAdmin, RoleManager, RoleSales, RoleProduction, RoleOwner, "super_admin", "staff"},
		"workflowWriteAuth":     {RoleAdmin, RoleManager, RoleOwner, RoleProduction, "super_admin"},
		"workflowReadAuth":      {RoleAdmin, RoleManager, RoleSales, RoleProduction, RoleOwner, "super_admin", "staff"},
	}

	// 2. Register dummy routes for each alias
	for alias, roles := range aliases {
		path := "/api/test/" + alias
		r.GET(path, RequireRoles(roles...), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok"})
		})
	}

	// 3. Helper to generate tokens
	makeToken := func(role string, expired bool, forged bool) string {
		claims := &OwnerClaims{
			Username: "testuser",
			UserID:   "usr_test",
			Role:     role,
			RegisteredClaims: jwt.RegisteredClaims{
				Issuer: "som-sing-phim-erp",
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(func() time.Duration {
					if expired {
						return -1 * time.Hour
					}
					return 1 * time.Hour
				}())),
			},
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		secret := GetJWTSecretKey()
		if forged {
			secret = []byte("forged-secret-key")
		}
		signed, _ := token.SignedString(secret)
		return signed
	}

	// 4. Test scenarios
	tests := []struct {
		name          string
		alias         string
		tokenType     string // "none", "forged", "expired", "sales", "finance", "super_admin"
		expectedCode  int
	}{
		// General token failures (applicable to any route)
		{"Anonymous missing token", "ordersWriteAuth", "none", http.StatusUnauthorized},
		{"Forged token", "ordersWriteAuth", "forged", http.StatusUnauthorized},
		{"Expired token", "ordersWriteAuth", "expired", http.StatusUnauthorized},
		
		// ordersWriteAuth: {admin, manager, sales}
		{"ordersWriteAuth with valid Sales", "ordersWriteAuth", "sales", http.StatusOK},
		{"ordersWriteAuth with invalid Finance", "ordersWriteAuth", "finance", http.StatusForbidden},
		
		// issueTrackingAuth: {admin, manager, owner, super_admin}
		{"issueTrackingAuth with valid super_admin", "issueTrackingAuth", "super_admin", http.StatusOK},
		{"issueTrackingAuth with valid owner", "issueTrackingAuth", "owner", http.StatusOK},
		{"issueTrackingAuth with invalid sales", "issueTrackingAuth", "sales", http.StatusForbidden},
		
		// financeAuth: {admin, manager, finance, owner}
		{"financeAuth with valid finance", "financeAuth", "finance", http.StatusOK},
		{"financeAuth with invalid production", "financeAuth", "production", http.StatusForbidden},
		
		// productionGeneralAuth: {admin, manager, owner, production, super_admin, staff}
		{"productionGeneralAuth with valid staff", "productionGeneralAuth", "staff", http.StatusOK},
		{"productionGeneralAuth with valid production", "productionGeneralAuth", "production", http.StatusOK},
		// Assuming 'finance' is NOT in productionGeneralAuth:
		{"productionGeneralAuth with invalid finance", "productionGeneralAuth", "finance", http.StatusForbidden},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest(http.MethodGet, "/api/test/"+tt.alias, nil)
			
			if tt.tokenType != "none" {
				expired := (tt.tokenType == "expired")
				forged := (tt.tokenType == "forged")
				
				// Determine role to sign
				role := tt.tokenType
				if expired || forged {
					role = "admin" // just pick a valid role that would pass if token was valid
				}
				
				tokenStr := makeToken(role, expired, forged)
				req.Header.Set("Authorization", "Bearer "+tokenStr)
			}
			
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			
			if w.Code != tt.expectedCode {
				t.Errorf("Scenario %q failed: expected %d, got %d", tt.name, tt.expectedCode, w.Code)
			}
		})
	}
}
