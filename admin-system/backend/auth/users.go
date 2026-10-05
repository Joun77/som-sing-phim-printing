package auth

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/lib/pq"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"somsing.local/backend/db"
)

var ensureAdminUsersOnce sync.Once

// AdminUser represents a staff/employee login account with RBAC roles & permissions
type AdminUser struct {
	ID           string     `json:"id"`
	EmployeeID   *string    `json:"employeeId,omitempty"`
	Username     string     `json:"username"`
	Password     string     `json:"password,omitempty"` // plain password (write-only)
	PasswordHash string     `json:"-"`
	FullName     string     `json:"fullName"`
	Email        string     `json:"email"`
	Phone        string     `json:"phone"`
	Role         string     `json:"role"` // admin, manager, sales, production, finance, prepress
	Permissions  []string   `json:"permissions"`
	IsActive     bool       `json:"isActive"`
	LastLoginAt  *time.Time `json:"lastLoginAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
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
			env := strings.ToLower(strings.TrimSpace(os.Getenv("ENVIRONMENT")))
			isExplicitlyDev := env == "development" || env == "dev" || env == "test" || env == ""
			if !isExplicitlyDev {
				// In production/staging, do NOT seed default accounts with well-known passwords.
				// Admins must create accounts manually via the admin API after first deploy.
				log.Printf("[AUTH INIT] Production environment detected (%s): skipping default account seeding. Create admin accounts via the API.", env)
			} else {
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
				log.Println("[AUTH INIT] Seeded default staff admin accounts into database (dev/test mode only).")
			}
		}
	})
}

// HandleGetAdminUsers lists all staff/employee user accounts
func HandleGetAdminUsers(c *gin.Context) {
	if db.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "code": "STORAGE_UNAVAILABLE"})
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
			accountFailure(c, err)
			return
		}
		if len(permJSON) > 0 {
			_ = json.Unmarshal(permJSON, &u.Permissions)
		}
		if u.Permissions == nil {
			u.Permissions = []string{}
		}
		users = append(users, u)
	}

	if err := rows.Err(); err != nil {
		accountFailure(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": users})
}

// HandleCreateAdminUser creates a new staff user with encrypted password
func HandleCreateAdminUser(c *gin.Context) { handleSaveAdminUser(c, true) }
func HandleUpdateAdminUser(c *gin.Context) { handleSaveAdminUser(c, false) }
func handleSaveAdminUser(c *gin.Context, create bool) {
	if db.DB == nil {
		c.JSON(503, gin.H{"status": "error", "code": "STORAGE_UNAVAILABLE"})
		return
	}
	var req AdminUser
	if c.ShouldBindJSON(&req) != nil {
		c.JSON(400, gin.H{"status": "error", "code": "INVALID_JSON"})
		return
	}
	if req.Role == "" && create {
		req.Role = "sales"
	}
	if req.FullName == "" && create {
		req.FullName = req.Username
	}
	if !create {
		req.ID = c.Param("id")
	} else {
		req.ID = ""
	}
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		accountFailure(c, err)
		return
	}
	defer tx.Rollback()
	user, err := SaveLoginAccount(c, tx, req, create)
	if err == nil {
		err = accountAudit(c, tx, "ACCOUNT_SAVE", user.ID, user)
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		accountFailure(c, err)
		return
	}
	status := 200
	if create {
		status = 201
	}
	c.JSON(status, gin.H{"status": "success", "committed": true, "data": user})
}
func HandleDeleteAdminUser(c *gin.Context) {
	if db.DB == nil {
		c.JSON(503, gin.H{"status": "error", "code": "STORAGE_UNAVAILABLE"})
		return
	}
	if c.GetString("user_role") != "admin" && c.GetString("user_role") != "owner" {
		accountFailure(c, ErrOwnerRequired)
		return
	}
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		accountFailure(c, err)
		return
	}
	defer tx.Rollback()
	id := c.Param("id")
	var role, username string
	err = tx.QueryRowContext(c.Request.Context(), `SELECT role,username FROM admin_users WHERE id=$1 FOR UPDATE`, id).Scan(&role, &username)
	if err != nil {
		accountFailure(c, err)
		return
	}
	if role == "owner" {
		if err = RequireLiteralOwner(c, tx); err != nil {
			accountFailure(c, err)
			return
		}
	}
	if username == "admin" {
		c.JSON(403, gin.H{"status": "error", "code": "PRIMARY_ADMIN_PROTECTED"})
		return
	}
	_, err = tx.ExecContext(c.Request.Context(), `UPDATE admin_users SET is_active=false,updated_at=NOW() WHERE id=$1`, id)
	if err == nil {
		err = accountAudit(c, tx, "ACCOUNT_DEACTIVATE", id, gin.H{"isActive": false})
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		accountFailure(c, err)
		return
	}
	c.JSON(200, gin.H{"status": "success", "committed": true})
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

// SaveLoginAccount is shared by standalone account and atomic employee writes.
// Its caller must commit the account, employee and audit in one transaction.
func SaveLoginAccount(c *gin.Context, tx *sql.Tx, req AdminUser, create bool) (*AdminUser, error) {
	if c.GetString("user_role") != "admin" && c.GetString("user_role") != "owner" {
		return nil, ErrOwnerRequired
	}
	validRoles := map[string]bool{"owner": true, "admin": true, "super_admin": true, "ceo": true, "manager": true, "sales": true, "production": true, "finance": true, "accountant": true, "prepress": true, "staff": true}
	if !validRoles[req.Role] || strings.TrimSpace(req.Username) == "" || strings.TrimSpace(req.FullName) == "" {
		return nil, ErrInvalidAccount
	}
	validPermissions := strings.Fields("ALL * dashboard preflight quotation orders crm tracker equipment inventory inbound shipping catalog materials finance hr settings calculator reports maintenance products customers delivery production wear-parts suppliers")
	seen := map[string]bool{}
	for _, permission := range req.Permissions {
		valid := false
		for _, allowed := range validPermissions {
			if permission == allowed {
				valid = true
				break
			}
		}
		if !valid || seen[permission] {
			return nil, ErrInvalidAccount
		}
		seen[permission] = true
	}
	if req.EmployeeID != nil && *req.EmployeeID != "" {
		var employeeID string
		if err := tx.QueryRowContext(c.Request.Context(), `SELECT id FROM employees WHERE id=$1 FOR UPDATE`, *req.EmployeeID).Scan(&employeeID); err != nil {
			return nil, err
		}
		var linked string
		err := tx.QueryRowContext(c.Request.Context(), `SELECT id FROM admin_users WHERE employee_id=$1 AND id<>$2 LIMIT 1`, employeeID, req.ID).Scan(&linked)
		if err == nil {
			return nil, ErrAccountConflict
		}
		if err != sql.ErrNoRows {
			return nil, err
		}
	}
	if _, err := tx.ExecContext(c.Request.Context(), `SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, "phase2-username:"+strings.ToLower(req.Username)); err != nil {
		return nil, err
	}
	var oldRole, hash string
	var oldEmployee sql.NullString
	if !create {
		if req.ID == "" {
			return nil, ErrInvalidAccount
		}
		if err := tx.QueryRowContext(c.Request.Context(), `SELECT role,password_hash,employee_id FROM admin_users WHERE id=$1 FOR UPDATE`, req.ID).Scan(&oldRole, &hash, &oldEmployee); err != nil {
			return nil, err
		}
		if req.EmployeeID == nil && oldEmployee.Valid {
			linkedID := oldEmployee.String
			req.EmployeeID = &linkedID
		}
		if oldEmployee.Valid && req.EmployeeID != nil && oldEmployee.String != *req.EmployeeID {
			return nil, ErrAccountConflict
		}
	}
	if oldRole == "owner" || req.Role == "owner" {
		if err := RequireLiteralOwner(c, tx); err != nil {
			return nil, err
		}
	}
	var existingID string
	err := tx.QueryRowContext(c.Request.Context(), `SELECT id FROM admin_users WHERE LOWER(username)=LOWER($1) AND id<>$2 LIMIT 1`, req.Username, req.ID).Scan(&existingID)
	if err == nil {
		return nil, ErrAccountConflict
	}
	if err != sql.ErrNoRows {
		return nil, err
	}
	if create && req.Password == "" {
		return nil, ErrInvalidAccount
	}
	if req.Password != "" {
		if len([]byte(req.Password)) > 72 {
			return nil, ErrInvalidAccount
		}
		hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		hash = string(hashed)
	}
	if req.Permissions == nil {
		req.Permissions = []string{}
	}
	perms, err := json.Marshal(req.Permissions)
	if err != nil {
		return nil, err
	}
	if create {
		b := make([]byte, 16)
		if _, err = rand.Read(b); err != nil {
			return nil, err
		}
		req.ID = "usr_" + hex.EncodeToString(b)
		_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO admin_users(id,employee_id,username,password_hash,fullname,email,phone,role,permissions,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, req.ID, req.EmployeeID, req.Username, hash, req.FullName, req.Email, req.Phone, req.Role, string(perms), req.IsActive)
	} else {
		_, err = tx.ExecContext(c.Request.Context(), `UPDATE admin_users SET employee_id=$2,username=$3,password_hash=$4,fullname=$5,email=$6,phone=$7,role=$8,permissions=$9,is_active=$10,updated_at=NOW() WHERE id=$1`, req.ID, req.EmployeeID, req.Username, hash, req.FullName, req.Email, req.Phone, req.Role, string(perms), req.IsActive)
	}
	if err != nil {
		return nil, err
	}
	req.Password = ""
	req.PasswordHash = ""
	err = tx.QueryRowContext(c.Request.Context(), `SELECT created_at,updated_at,last_login_at FROM admin_users WHERE id=$1`, req.ID).Scan(&req.CreatedAt, &req.UpdatedAt, &req.LastLoginAt)
	return &req, err
}

var ErrOwnerRequired = errors.New("OWNER_REQUIRED")
var ErrInvalidAccount = errors.New("INVALID_ACCOUNT")
var ErrAccountConflict = errors.New("ACCOUNT_LINK_OR_USERNAME_CONFLICT")

func RequireLiteralOwner(c *gin.Context, tx *sql.Tx) error {
	if c.GetString("user_role") != "owner" || c.GetString("user_id") == "" {
		return ErrOwnerRequired
	}
	var role string
	var active bool
	if err := tx.QueryRowContext(c.Request.Context(), `SELECT role,COALESCE(is_active,false) FROM admin_users WHERE id=$1 FOR SHARE`, c.GetString("user_id")).Scan(&role, &active); err != nil {
		return err
	}
	if role != "owner" || !active {
		return ErrOwnerRequired
	}
	return nil
}
func accountFailure(c *gin.Context, err error) {
	status, code := 500, "STORAGE_FAILURE"
	var pg *pq.Error
	switch {
	case errors.Is(err, ErrOwnerRequired):
		status, code = 403, "OWNER_REQUIRED"
	case errors.Is(err, ErrInvalidAccount):
		status, code = 422, "INVALID_ACCOUNT"
	case errors.Is(err, ErrAccountConflict):
		status, code = 409, "ACCOUNT_LINK_OR_USERNAME_CONFLICT"
	case errors.Is(err, sql.ErrNoRows):
		status, code = 404, "NOT_FOUND"
	case errors.As(err, &pg):
		if pg.Code == "23505" {
			status, code = 409, "CONFLICT"
		}
	}
	c.AbortWithStatusJSON(status, gin.H{"status": "error", "code": code, "message": code})
}
func accountAudit(c *gin.Context, tx *sql.Tx, action, id string, value any) error {
	raw, err := json.Marshal(value)
	if err != nil {
		return err
	}
	b := make([]byte, 16)
	if _, err = rand.Read(b); err != nil {
		return err
	}
	_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO audit_logs(id,user_id,user_name,action,resource_type,resource_id,new_values,ip_address) VALUES($1,$2,$3,$4,'ADMIN_USER',$5,$6,$7)`, hex.EncodeToString(b), c.GetString("user_id"), c.GetString("username"), action, id, string(raw), c.ClientIP())
	return err
}
