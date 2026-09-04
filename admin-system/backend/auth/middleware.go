package auth

import (
	"github.com/gin-gonic/gin"
)

// Standard system role constants
const (
	RoleAdmin      = "admin"
	RoleOwner      = "owner"
	RoleManager    = "manager"
	RolePrepress   = "prepress"
	RoleProduction = "production"
	RoleFinance    = "finance"
	RoleSales      = "sales"
)

// RoleMiddleware provides role-based access control checking
func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return RequireRoles(allowedRoles...)
}
