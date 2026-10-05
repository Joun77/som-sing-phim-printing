package hr

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"somsing.local/backend/auth"
	"somsing.local/backend/finance"
	"strings"
	"sync"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

type Employee struct {
	ID                     string   `json:"id"`
	NameLo                 string   `json:"nameLo"`
	NameEn                 string   `json:"nameEn"`
	Role                   string   `json:"role"`
	Department             string   `json:"department"`
	Phone                  string   `json:"phone"`
	Address                string   `json:"address"`
	SalaryLAK              float64  `json:"salaryLAK"`
	Status                 string   `json:"status"`
	Skills                 []string `json:"skills"`
	CreatedAt              string   `json:"createdAt"`
	UpdatedAt              string   `json:"updatedAt"`
	PieceRatePerImpression float64  `json:"pieceRatePerImpression"`
	SalesCommissionRate    float64  `json:"salesCommissionRate"`
}

type TechnicianEarning struct {
	ID                string  `json:"id"`
	EmployeeID        string  `json:"employeeId"`
	EmployeeName      string  `json:"employeeName"`
	OrderID           string  `json:"orderId"`
	OrderNumber       string  `json:"orderNumber,omitempty"`
	CustomerName      string  `json:"customerName,omitempty"`
	StepID            string  `json:"stepId"`
	StepName          string  `json:"stepName"`
	Impressions       int     `json:"impressions"`
	RatePerImpression float64 `json:"ratePerImpression"`
	EarnedAmountLAK   float64 `json:"earnedAmountLAK"`
	RecordedAt        string  `json:"recordedAt"`
}

var (
	employeeStoreMutex  sync.RWMutex
	employeeMemoryStore = map[string]Employee{}

	earningStoreMutex  sync.RWMutex
	earningMemoryStore = map[string]TechnicianEarning{}
)

// HandleGetEmployees returns all employees from DB or memory fallback
func HandleGetEmployees(c *gin.Context) {
	employees, err := GetEmployeesList()
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	c.JSON(200, gin.H{"status": "success", "data": employees})
}
func HandleCreateEmployee(c *gin.Context) { saveEmployeeOperation(c, true) }
func HandleUpdateEmployee(c *gin.Context) { saveEmployeeOperation(c, false) }
func hrRole(c *gin.Context) bool {
	if c.GetString("user_role") != "admin" && c.GetString("user_role") != "owner" {
		finance.WriteOperationError(c, &finance.OperationError{Status: 403, Code: "HR_ROLE_REQUIRED"})
		return false
	}
	return true
}
func employeeError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, auth.ErrOwnerRequired):
		err = &finance.OperationError{Status: 403, Code: "OWNER_REQUIRED"}
	case errors.Is(err, auth.ErrAccountConflict):
		err = &finance.OperationError{Status: 409, Code: "ACCOUNT_LINK_OR_USERNAME_CONFLICT"}
	case errors.Is(err, auth.ErrInvalidAccount):
		err = &finance.OperationError{Status: 422, Code: "INVALID_ACCOUNT"}
	}
	finance.WriteOperationError(c, err)
}
func saveEmployeeOperation(c *gin.Context, create bool) {
	if !hrRole(c) {
		return
	}
	var req struct {
		Employee
		LoginAccount *auth.AdminUser `json:"login_account"`
	}
	if c.ShouldBindJSON(&req) != nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 400, Code: "INVALID_JSON"})
		return
	}
	for i, v := range []float64{req.SalaryLAK, req.PieceRatePerImpression, req.SalesCommissionRate} {
		places := int32(2)
		maximum := decimal.RequireFromString("10000000000000")
		if i == 2 {
			places = 4
			maximum = decimal.RequireFromString("100000")
		}
		if math.IsNaN(v) || math.IsInf(v, 0) || v < 0 {
			employeeError(c, &finance.OperationError{Status: 422, Code: "INVALID_RATE"})
			return
		}
		value := decimal.NewFromFloat(v)
		if !value.Equal(value.Round(places)) || !value.LessThan(maximum) {
			employeeError(c, &finance.OperationError{Status: 422, Code: "INVALID_RATE_PRECISION"})
			return
		}
	}

	if strings.TrimSpace(req.NameLo) == "" || strings.TrimSpace(req.NameEn) == "" || req.Role == "" || req.Department == "" {
		finance.WriteOperationError(c, &finance.OperationError{Status: 422, Code: "REQUIRED_EMPLOYEE_FIELD"})
		return
	}
	if req.Status == "" {
		req.Status = "ACTIVE"
	}
	if req.Skills == nil {
		req.Skills = []string{}
	}
	req.CreatedAt = ""
	req.UpdatedAt = ""
	req.ID = c.Param("id")
	if create {
		req.ID = ""
	}
	if req.LoginAccount != nil {
		if req.LoginAccount.ID != "" && create {
			employeeError(c, auth.ErrInvalidAccount)
			return
		}
		if !create && req.LoginAccount.ID == "" && req.LoginAccount.Password == "" {
			employeeError(c, auth.ErrInvalidAccount)
			return
		}
		req.LoginAccount.EmployeeID = nil
	}
	operation := "EMPLOYEE_UPDATE"
	if create {
		operation = "EMPLOYEE_CREATE"
	}
	tx, replay, fp, err := finance.BeginOperation(c, operation, req)
	if err != nil {
		employeeError(c, err)
		return
	}
	if replay != nil {
		c.Data(200, "application/json", replay)
		return
	}
	defer tx.Rollback()
	emp := req.Employee
	if create {
		emp.ID, err = finance.NewOperationID()
		if err != nil {
			employeeError(c, err)
			return
		}
	} else {
		var id string
		if err = tx.QueryRowContext(c.Request.Context(), `SELECT id FROM employees WHERE id=$1 FOR UPDATE`, emp.ID).Scan(&id); err != nil {
			employeeError(c, err)
			return
		}
	}
	skills, err := json.Marshal(emp.Skills)
	if err != nil {
		employeeError(c, err)
		return
	}
	if create {
		_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO employees(id,name_lo,name_en,role,department,phone,address,salary_lak,status,skills,piece_rate_per_impression,sales_commission_rate) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, emp.ID, emp.NameLo, emp.NameEn, emp.Role, emp.Department, emp.Phone, emp.Address, emp.SalaryLAK, emp.Status, string(skills), emp.PieceRatePerImpression, emp.SalesCommissionRate)
	} else {
		_, err = tx.ExecContext(c.Request.Context(), `UPDATE employees SET name_lo=$2,name_en=$3,role=$4,department=$5,phone=$6,address=$7,salary_lak=$8,status=$9,skills=$10,piece_rate_per_impression=$11,sales_commission_rate=$12,updated_at=NOW() WHERE id=$1`, emp.ID, emp.NameLo, emp.NameEn, emp.Role, emp.Department, emp.Phone, emp.Address, emp.SalaryLAK, emp.Status, string(skills), emp.PieceRatePerImpression, emp.SalesCommissionRate)
	}
	if err != nil {
		employeeError(c, err)
		return
	}
	var account *auth.AdminUser
	if req.LoginAccount != nil {
		login := *req.LoginAccount
		login.EmployeeID = &emp.ID
		account, err = auth.SaveLoginAccount(c, tx, login, login.ID == "")
		if err != nil {
			employeeError(c, err)
			return
		}
	}
	var created, updated time.Time
	err = tx.QueryRowContext(c.Request.Context(), `SELECT created_at,updated_at,salary_lak,piece_rate_per_impression,sales_commission_rate FROM employees WHERE id=$1`, emp.ID).Scan(&created, &updated, &emp.SalaryLAK, &emp.PieceRatePerImpression, &emp.SalesCommissionRate)
	if err != nil {
		employeeError(c, err)
		return
	}
	emp.CreatedAt = created.UTC().Format(time.RFC3339Nano)
	emp.UpdatedAt = updated.UTC().Format(time.RFC3339Nano)
	response := gin.H{"status": "success", "committed": true, "employee": emp, "login_account": account}
	if err = finance.CommitOperation(c, tx, operation, "EMPLOYEE", emp.ID, fp, response); err != nil {
		employeeError(c, err)
		return
	}
	employeeStoreMutex.Lock()
	employeeMemoryStore[emp.ID] = emp
	employeeStoreMutex.Unlock()
	code := 200
	if create {
		code = 201
	}
	c.JSON(code, response)
}
func HandleDeleteEmployee(c *gin.Context) {
	if !hrRole(c) {
		return
	}
	id := c.Param("id")
	tx, replay, fp, err := finance.BeginOperation(c, "EMPLOYEE_DELETE", gin.H{"id": id})
	if err != nil {
		employeeError(c, err)
		return
	}
	if replay != nil {
		c.Data(200, "application/json", replay)
		return
	}
	defer tx.Rollback()
	var actual string
	if err = tx.QueryRowContext(c.Request.Context(), `SELECT id FROM employees WHERE id=$1 FOR UPDATE`, id).Scan(&actual); err != nil {
		employeeError(c, err)
		return
	}
	var referenced bool
	err = tx.QueryRowContext(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM technician_earnings WHERE employee_id=$1) OR EXISTS(SELECT 1 FROM admin_users WHERE employee_id=$1)`, id).Scan(&referenced)
	if err != nil {
		employeeError(c, err)
		return
	}
	if referenced {
		employeeError(c, &finance.OperationError{Status: 409, Code: "EMPLOYEE_HISTORY_PRESENT"})
		return
	}
	result, err := tx.ExecContext(c.Request.Context(), `DELETE FROM employees WHERE id=$1`, id)
	if err == nil {
		var count int64
		count, err = result.RowsAffected()
		if err == nil && count != 1 {
			err = sql.ErrNoRows
		}
	}
	if err != nil {
		employeeError(c, err)
		return
	}
	response := gin.H{"status": "success", "committed": true, "data": gin.H{"id": id}}
	if err = finance.CommitOperation(c, tx, "EMPLOYEE_DELETE", "EMPLOYEE", id, fp, response); err != nil {
		employeeError(c, err)
		return
	}
	employeeStoreMutex.Lock()
	delete(employeeMemoryStore, id)
	employeeStoreMutex.Unlock()
	c.JSON(200, response)
}

func getEmployeesFromDB() ([]Employee, error) {
	rows, err := db.DB.Query(`SELECT id, name_lo, name_en, role, department, COALESCE(phone,''), COALESCE(address,''), salary_lak, status, COALESCE(skills, '[]'::jsonb), created_at,updated_at,piece_rate_per_impression,sales_commission_rate FROM employees ORDER BY created_at,id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []Employee
	for rows.Next() {
		var emp Employee
		var skillsJSON []byte
		var createdAt, updatedAt time.Time

		err := rows.Scan(&emp.ID, &emp.NameLo, &emp.NameEn, &emp.Role, &emp.Department, &emp.Phone, &emp.Address, &emp.SalaryLAK, &emp.Status, &skillsJSON, &createdAt, &updatedAt, &emp.PieceRatePerImpression, &emp.SalesCommissionRate)
		if err != nil {
			return nil, err
		}
		if err = json.Unmarshal(skillsJSON, &emp.Skills); err != nil {
			return nil, err
		}
		if emp.Skills == nil {
			emp.Skills = []string{}
		}
		emp.CreatedAt = createdAt.UTC().Format(time.RFC3339Nano)
		emp.UpdatedAt = updatedAt.UTC().Format(time.RFC3339Nano)
		result = append(result, emp)
	}
	return result, rows.Err()
}

// HandleGetTechnicianEarnings fetches technician earning records (optional ?employee_id= filter)
func HandleGetTechnicianEarnings(c *gin.Context) {
	if db.DB == nil {
		employeeError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
		return
	}
	employeeID := c.Query("employee_id")

	if db.DB != nil {
		query := `SELECT id, employee_id, employee_name, order_id, COALESCE(order_number, ''), COALESCE(customer_name, ''), step_id, step_name, impressions, rate_per_impression, earned_amount_lak, recorded_at FROM technician_earnings`
		var rows *sql.Rows
		var err error

		if employeeID != "" {
			query += ` WHERE employee_id = $1 ORDER BY recorded_at DESC`
			rows, err = db.DB.Query(query, employeeID)
		} else {
			query += ` ORDER BY recorded_at DESC`
			rows, err = db.DB.Query(query)
		}

		if err == nil {
			defer rows.Close()
			var list []TechnicianEarning
			for rows.Next() {
				var rec TechnicianEarning
				var recTime time.Time
				err := rows.Scan(&rec.ID, &rec.EmployeeID, &rec.EmployeeName, &rec.OrderID, &rec.OrderNumber, &rec.CustomerName, &rec.StepID, &rec.StepName, &rec.Impressions, &rec.RatePerImpression, &rec.EarnedAmountLAK, &recTime)
				if err != nil {
					employeeError(c, err)
					return
				}
				rec.RecordedAt = recTime.Format(time.RFC3339)
				list = append(list, rec)
			}
			if err = rows.Err(); err != nil {
				employeeError(c, err)
				return
			}
			if list == nil {
				list = []TechnicianEarning{}
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
			return
		}
	}

	employeeError(c, errors.New("EARNINGS_STORAGE_FAILURE"))
}

// HandleCreateTechnicianEarning creates a new technician piece-rate earning log
func HandleCreateTechnicianEarning(c *gin.Context) {
	if !hrRole(c) {
		return
	}
	if db.DB == nil {
		employeeError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
		return
	}
	var rec TechnicianEarning
	if c.ShouldBindJSON(&rec) != nil {
		employeeError(c, &finance.OperationError{Status: 400, Code: "INVALID_JSON"})
		return
	}
	if rec.EmployeeID == "" || rec.OrderID == "" || strings.TrimSpace(rec.StepID) == "" || rec.Impressions <= 0 {
		employeeError(c, &finance.OperationError{Status: 422, Code: "INVALID_EARNING"})
		return
	}
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		employeeError(c, err)
		return
	}
	defer tx.Rollback()
	// Lock parent before checking workflow and acquiring the earning/employee locks.
	var parent string
	err = tx.QueryRowContext(c.Request.Context(), `SELECT id FROM orders WHERE id=$1 FOR UPDATE`, rec.OrderID).Scan(&parent)
	var configured bool
	if err == nil {
		err = tx.QueryRowContext(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM audit_logs WHERE resource_type='ORDER' AND resource_id=$1 AND action='ORDER_DEMO_DETAILS_SAVED' AND new_values->'demo_state'->'productionWorkflow' IS NOT NULL)`, rec.OrderID).Scan(&configured)
	}
	if err == nil && configured {
		err = &finance.OperationError{Status: 409, Code: "EARNING_REQUIRES_WORKFLOW_COMMIT"}
	}
	if err == nil {
		rec, err = RecordTechnicianEarningTx(c, tx, rec)
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		employeeError(c, err)
		return
	}
	earningStoreMutex.Lock()
	earningMemoryStore[rec.ID] = rec
	earningStoreMutex.Unlock()
	c.JSON(201, gin.H{"status": "success", "committed": true, "data": rec})
}

// GetEmployeesList returns all employees from DB or in-memory fallback
func GetEmployeesList() ([]Employee, error) {
	if db.DB == nil {
		return nil, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"}
	}
	list, err := getEmployeesFromDB()
	if err != nil {
		return nil, err
	}
	if list == nil {
		list = []Employee{}
	}
	return list, nil
}

// GetEmployeeByID returns a single employee by ID
func GetEmployeeByID(id string) (*Employee, error) {
	list, err := GetEmployeesList()
	if err != nil {
		return nil, err
	}
	for _, emp := range list {
		if emp.ID == id {
			return &emp, nil
		}
	}
	return nil, fmt.Errorf("employee %s not found", id)
}

// RecordTechnicianEarningTx keeps earning insertion and its audit in the caller transaction.
func RecordTechnicianEarningTx(c *gin.Context, tx *sql.Tx, rec TechnicianEarning) (TechnicianEarning, error) {
	var err error
	if rec.EmployeeID == "" || rec.OrderID == "" || strings.TrimSpace(rec.StepID) == "" || rec.Impressions <= 0 || rec.Impressions > 1000000000 {
		return rec, &finance.OperationError{Status: 422, Code: "INVALID_EARNING"}
	}
	if err = tx.QueryRowContext(c.Request.Context(), `SELECT COALESCE(order_no,order_number),customer_name FROM orders WHERE id=$1 FOR UPDATE`, rec.OrderID).Scan(&rec.OrderNumber, &rec.CustomerName); err != nil {
		return rec, err
	}
	if _, err = tx.ExecContext(c.Request.Context(), `SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, "earning:"+rec.EmployeeID+":"+rec.OrderID+":"+rec.StepID); err != nil {
		return rec, err
	}
	var rateText string
	if err = tx.QueryRowContext(c.Request.Context(), `SELECT name_en,piece_rate_per_impression::text FROM employees WHERE id=$1 AND status='ACTIVE' FOR SHARE`, rec.EmployeeID).Scan(&rec.EmployeeName, &rateText); err != nil {
		return rec, err
	}
	rate, err := decimal.NewFromString(rateText)
	if err != nil || rate.IsNegative() {
		return rec, &finance.OperationError{Status: 409, Code: "EMPLOYEE_RATE_INCONSISTENT"}
	}
	var exists bool
	if err = tx.QueryRowContext(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM technician_earnings WHERE employee_id=$1 AND order_id=$2 AND step_id=$3)`, rec.EmployeeID, rec.OrderID, rec.StepID).Scan(&exists); err != nil {
		return rec, err
	}
	if exists {
		return rec, &finance.OperationError{Status: 409, Code: "EARNING_ALREADY_RECORDED"}
	}
	amount := rate.Mul(decimal.NewFromInt(int64(rec.Impressions))).Round(0)
	if !amount.LessThan(decimal.RequireFromString("10000000000000")) {
		return rec, &finance.OperationError{Status: 422, Code: "INVALID_EARNING_AMOUNT"}
	}
	rec.ID, err = finance.NewOperationID()
	if err != nil {
		return rec, err
	}
	rec.RatePerImpression, _ = rate.Float64()
	rec.EarnedAmountLAK, _ = amount.Float64()
	var recorded time.Time
	err = tx.QueryRowContext(c.Request.Context(), `INSERT INTO technician_earnings(id,employee_id,employee_name,order_id,order_number,customer_name,step_id,step_name,impressions,rate_per_impression,earned_amount_lak,recorded_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING recorded_at`, rec.ID, rec.EmployeeID, rec.EmployeeName, rec.OrderID, rec.OrderNumber, rec.CustomerName, rec.StepID, rec.StepName, rec.Impressions, rate.StringFixed(2), amount.StringFixed(2)).Scan(&recorded)
	if err != nil {
		return rec, err
	}
	rec.RecordedAt = recorded.UTC().Format(time.RFC3339Nano)
	auditID, err := finance.NewOperationID()
	if err != nil {
		return rec, err
	}
	values, err := json.Marshal(rec)
	if err != nil {
		return rec, err
	}
	_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO audit_logs(id,user_id,user_name,action,resource_type,resource_id,new_values,ip_address) VALUES($1,$2,$3,'TECHNICIAN_EARNING_CREATE','EMPLOYEE',$4,$5,$6)`, auditID, c.GetString("user_id"), c.GetString("username"), rec.EmployeeID, string(values), c.ClientIP())
	return rec, err
}
