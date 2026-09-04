package auth

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"somsing.local/backend/db"
)

var ensureAdminUsersOnce sync.Once

// AdminUser represents a staff/employee login account with RBAC roles & permissions
type AdminUser struct {
	ID          string     `json:"id"`
	EmployeeID  *string    `json:"employeeId,omitempty"`
	Username    string     `json:"username"`
	Password    string     `json:"password,omitempty"` // plain password (write-only)
	PasswordHash string    `json:"-"`
	FullName    string     `json:"fullName"`
	Email       string     `json:"email"`
	Phone       string     `json:"phone"`
	Role        string     `json:"role"` // admin, manager, sales, production, finance, prepress
	Permissions []string   `json:"permissions"`
	IsActive    bool       `json:"isActive"`
	LastLoginAt *time.Time `json:"lastLoginAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// EnsureAdminUsersTable creates the admin_users table and seeds default accounts if empty
func EnsureAdminUsersTable() {
	ensureAdminUsersOnce.Do(func() {
		if db.DB == nil {
			return
		}

		schema := `
			CREATE TABLE IF NOT EXISTS admin_users (
				id VARCHAR(100) PRIMARY KEY,
				employee_id VARCHAR(100),
				username VARCHAR(100) NOT NULL UNIQUE,
				password_hash VARCHAR(255) NOT NULL,
				fullname VARCHAR(255) NOT NULL,
				email VARCHAR(100),
				phone VARCHAR(100),
				role VARCHAR(50) NOT NULL DEFAULT 'sales',
				permissions JSONB DEFAULT '[]'::jsonb,
				is_active BOOLEAN DEFAULT TRUE,
				last_login_at TIMESTAMP WITH TIME ZONE,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);
			CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
			CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
			CREATE INDEX IF NOT EXISTS idx_admin_users_employee_id ON admin_users(employee_id);
		`
		if _, err := db.DB.Exec(schema); err != nil {
			log.Printf("[DB ERROR] Failed to create admin_users table: %v", err)
			return
		}

		// Check if table is empty, seed defaults
		var count int
		_ = db.DB.QueryRow("SELECT COUNT(*) FROM admin_users").Scan(&count)
		if count == 0 {
			seedAccounts := []struct {
				id, username, pass, name, email, role string
			}{
				{"usr_admin_001", "admin", "admin123", "Som-Sing Printing Owner (Super Admin)", "owner@somsingphim.la", "admin"},
				{"usr_mgr_001", "manager", "manager123", "Som Sing General Manager", "manager@somsingphim.la", "manager"},
				{"usr_sales_001", "sales", "sales123", "Som Sing Sales Representative", "sales@somsingphim.la", "sales"},
				{"usr_prod_001", "production", "production123", "Som Sing Lead Printer", "production@somsingphim.la", "production"},
				{"usr_fin_001", "finance", "finance123", "Som Sing Lead Accountant", "finance@somsingphim.la", "finance"},
				{"usr_prep_001", "prepress", "prepress123", "Som Sing Prepress Specialist", "prepress@somsingphim.la", "prepress"},
			}

			for _, sa := range seedAccounts {
				hashed, err := bcrypt.GenerateFromPassword([]byte(sa.pass), bcrypt.DefaultCost)
				if err != nil {
					continue
				}
				_, _ = db.DB.Exec(`
					INSERT INTO admin_users (id, username, password_hash, fullname, email, role, permissions, is_active, created_at, updated_at)
					VALUES ($1, $2, $3, $4, $5, $6, '[]'::jsonb, true, NOW(), NOW())
					ON CONFLICT (username) DO NOTHING
				`, sa.id, sa.username, string(hashed), sa.name, sa.email, sa.role)
			}
			log.Println("[AUTH INIT] Seeded default staff admin accounts into database successfully.")
		}
	})
}

// HandleGetAdminUsers lists all staff/employee user accounts
func HandleGetAdminUsers(c *gin.Context) {
	EnsureAdminUsersTable()
	if db.DB == nil {
		c.JSON(http.StatusOK, gin.H{"status": "success", "data": []AdminUser{}})
		return
	}

	query := `
		SELECT id, employee_id, username, fullname, COALESCE(email, ''), COALESCE(phone, ''),
		       role, permissions, is_active, last_login_at, created_at, updated_at
		FROM admin_users
		ORDER BY created_at ASC
	`
	rows, err := db.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users", "details": err.Error()})
		return
	}
	defer rows.Close()

	users := make([]AdminUser, 0)
	for rows.Next() {
		var u AdminUser
		var permJSON []byte
		err := rows.Scan(
			&u.ID, &u.EmployeeID, &u.Username, &u.FullName, &u.Email, &u.Phone,
			&u.Role, &permJSON, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			log.Printf("[DB ERROR] Scan user: %v", err)
			continue
		}
		if len(permJSON) > 0 {
			_ = json.Unmarshal(permJSON, &u.Permissions)
		}
		if u.Permissions == nil {
			u.Permissions = []string{}
		}
		users = append(users, u)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": users})
}

// HandleCreateAdminUser creates a new staff user with encrypted password
func HandleCreateAdminUser(c *gin.Context) {
	EnsureAdminUsersTable()
	if db.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	var req AdminUser
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username and password are required"})
		return
	}
	if req.FullName == "" {
		req.FullName = req.Username
	}
	if req.Role == "" {
		req.Role = "sales"
	}
	if req.ID == "" {
		req.ID = fmt.Sprintf("usr_%s_%d", req.Role, time.Now().Unix())
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	permBytes, _ := json.Marshal(req.Permissions)
	if permBytes == nil {
		permBytes = []byte("[]")
	}

	query := `
		INSERT INTO admin_users (
			id, employee_id, username, password_hash, fullname, email, phone,
			role, permissions, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
	`
	_, err = db.DB.Exec(query, req.ID, req.EmployeeID, req.Username, string(hashed), req.FullName, req.Email, req.Phone, req.Role, string(permBytes), req.IsActive)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists or database error", "details": err.Error()})
		return
	}

	req.Password = ""
	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": req, "message": "ສ້າງຜູ້ໃຊ້ງານສຳເລັດ (User created successfully)"})
}

// HandleUpdateAdminUser updates user details, role, permissions, and optional password
func HandleUpdateAdminUser(c *gin.Context) {
	EnsureAdminUsersTable()
	if db.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	var req AdminUser
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	permBytes, _ := json.Marshal(req.Permissions)
	if permBytes == nil {
		permBytes = []byte("[]")
	}

	if req.Password != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}

		query := `
			UPDATE admin_users SET
				fullname = $1, email = $2, phone = $3, role = $4,
				permissions = $5, is_active = $6, password_hash = $7,
				employee_id = $8, updated_at = NOW()
			WHERE id = $9
		`
		_, err = db.DB.Exec(query, req.FullName, req.Email, req.Phone, req.Role, string(permBytes), req.IsActive, string(hashed), req.EmployeeID, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user", "details": err.Error()})
			return
		}
	} else {
		query := `
			UPDATE admin_users SET
				fullname = $1, email = $2, phone = $3, role = $4,
				permissions = $5, is_active = $6, employee_id = $7, updated_at = NOW()
			WHERE id = $8
		`
		_, err := db.DB.Exec(query, req.FullName, req.Email, req.Phone, req.Role, string(permBytes), req.IsActive, req.EmployeeID, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user", "details": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "ອັບເດດຜູ້ໃຊ້ງານສຳເລັດ (User updated successfully)"})
}

// HandleDeleteAdminUser deletes or deactivates a staff user
func HandleDeleteAdminUser(c *gin.Context) {
	EnsureAdminUsersTable()
	if db.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	// Protect super admin account
	var username string
	_ = db.DB.QueryRow("SELECT username FROM admin_users WHERE id = $1", id).Scan(&username)
	if username == "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "ບໍ່ສາມາດລຶບບັນຊີ Super Admin ຫຼັກໄດ້ (Cannot delete primary admin account)"})
		return
	}

	_, err := db.DB.Exec("DELETE FROM admin_users WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "ລຶບຜູ້ໃຊ້ງານສຳເລັດ (User deleted successfully)"})
}

// AuthenticateUserAgainstDB checks admin_users table for matching username and bcrypt password
func AuthenticateUserAgainstDB(username, password string) (*AdminUser, error) {
	EnsureAdminUsersTable()
	if db.DB == nil {
		return nil, sql.ErrNoRows
	}

	query := `
		SELECT id, employee_id, username, password_hash, fullname, COALESCE(email, ''), COALESCE(phone, ''),
		       role, permissions, is_active, last_login_at, created_at, updated_at
		FROM admin_users
		WHERE LOWER(username) = LOWER($1)
	`
	var u AdminUser
	var permJSON []byte
	err := db.DB.QueryRow(query, username).Scan(
		&u.ID, &u.EmployeeID, &u.Username, &u.PasswordHash, &u.FullName, &u.Email, &u.Phone,
		&u.Role, &permJSON, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if !u.IsActive {
		return nil, fmt.Errorf("ACCOUNT_DEACTIVATED")
	}

	// Verify password hash
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return nil, fmt.Errorf("INVALID_PASSWORD")
	}

	if len(permJSON) > 0 {
		_ = json.Unmarshal(permJSON, &u.Permissions)
	}

	// Record last login time
	now := time.Now()
	_, _ = db.DB.Exec("UPDATE admin_users SET last_login_at = $1 WHERE id = $2", now, u.ID)
	u.LastLoginAt = &now

	return &u, nil
}
