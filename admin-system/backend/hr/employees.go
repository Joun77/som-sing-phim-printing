package hr

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/Joun77/som-sing-phim-printing/backend/db"

	"github.com/gin-gonic/gin"
)

type Employee struct {
	ID         string   `json:"id"`
	NameLo     string   `json:"nameLo"`
	NameEn     string   `json:"nameEn"`
	Role       string   `json:"role"`
	Department string   `json:"department"`
	Phone      string   `json:"phone"`
	Address    string   `json:"address"`
	SalaryLAK  float64  `json:"salaryLAK"`
	Status     string   `json:"status"`
	Skills     []string `json:"skills"`
	CreatedAt  string   `json:"createdAt"`
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
	if db.DB != nil {
		employees, err := getEmployeesFromDB()
		if err == nil {
			if employees == nil {
				employees = []Employee{}
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": employees})
			return
		}
	}

	employeeStoreMutex.RLock()
	defer employeeStoreMutex.RUnlock()

	var result []Employee
	for _, emp := range employeeMemoryStore {
		result = append(result, emp)
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": result})
}

// HandleCreateEmployee creates a new employee
func HandleCreateEmployee(c *gin.Context) {
	var emp Employee
	if err := c.ShouldBindJSON(&emp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if emp.ID == "" {
		emp.ID = fmt.Sprintf("EMP-%d", time.Now().Unix())
	}
	if emp.Status == "" {
		emp.Status = "ACTIVE"
	}
	emp.CreatedAt = time.Now().Format(time.RFC3339)

	if db.DB != nil {
		err := saveEmployeeToDB(emp)
		if err != nil {
			log.Printf("[DB ERROR] Failed to save employee: %v", err)
		}
	}

	employeeStoreMutex.Lock()
	employeeMemoryStore[emp.ID] = emp
	employeeStoreMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": emp})
}

// HandleUpdateEmployee updates an existing employee
func HandleUpdateEmployee(c *gin.Context) {
	id := c.Param("id")
	var emp Employee
	if err := c.ShouldBindJSON(&emp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	emp.ID = id

	if db.DB != nil {
		err := updateEmployeeInDB(emp)
		if err != nil {
			log.Printf("[DB ERROR] Failed to update employee: %v", err)
		}
	}

	employeeStoreMutex.Lock()
	employeeMemoryStore[id] = emp
	employeeStoreMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": emp})
}

// HandleDeleteEmployee deletes an employee by ID
func HandleDeleteEmployee(c *gin.Context) {
	id := c.Param("id")

	if db.DB != nil {
		_, err := db.DB.Exec("DELETE FROM employees WHERE id = $1", id)
		if err != nil {
			log.Printf("[DB ERROR] Failed to delete employee: %v", err)
		}
	}

	employeeStoreMutex.Lock()
	delete(employeeMemoryStore, id)
	employeeStoreMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Employee deleted"})
}

func getEmployeesFromDB() ([]Employee, error) {
	rows, err := db.DB.Query(`SELECT id, name_lo, name_en, role, department, phone, address, salary_lak, status, COALESCE(skills, '[]'::jsonb), created_at FROM employees`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []Employee
	for rows.Next() {
		var emp Employee
		var skillsJSON []byte
		var createdAt time.Time

		err := rows.Scan(&emp.ID, &emp.NameLo, &emp.NameEn, &emp.Role, &emp.Department, &emp.Phone, &emp.Address, &emp.SalaryLAK, &emp.Status, &skillsJSON, &createdAt)
		if err != nil {
			continue
		}
		_ = json.Unmarshal(skillsJSON, &emp.Skills)
		emp.CreatedAt = createdAt.Format(time.RFC3339)
		result = append(result, emp)
	}
	return result, nil
}

func saveEmployeeToDB(emp Employee) error {
	skillsJSON, _ := json.Marshal(emp.Skills)
	_, err := db.DB.Exec(`
		INSERT INTO employees (id, name_lo, name_en, role, department, phone, address, salary_lak, status, skills, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
		ON CONFLICT (id) DO UPDATE SET
			name_lo = EXCLUDED.name_lo,
			name_en = EXCLUDED.name_en,
			role = EXCLUDED.role,
			department = EXCLUDED.department,
			phone = EXCLUDED.phone,
			address = EXCLUDED.address,
			salary_lak = EXCLUDED.salary_lak,
			status = EXCLUDED.status,
			skills = EXCLUDED.skills,
			updated_at = CURRENT_TIMESTAMP`,
		emp.ID, emp.NameLo, emp.NameEn, emp.Role, emp.Department, emp.Phone, emp.Address, emp.SalaryLAK, emp.Status, skillsJSON)
	return err
}

func updateEmployeeInDB(emp Employee) error {
	return saveEmployeeToDB(emp)
}

// HandleGetTechnicianEarnings fetches technician earning records (optional ?employee_id= filter)
func HandleGetTechnicianEarnings(c *gin.Context) {
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
					continue
				}
				rec.RecordedAt = recTime.Format(time.RFC3339)
				list = append(list, rec)
			}
			if list == nil {
				list = []TechnicianEarning{}
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
			return
		}
	}

	earningStoreMutex.RLock()
	defer earningStoreMutex.RUnlock()

	var result []TechnicianEarning
	for _, rec := range earningMemoryStore {
		if employeeID == "" || rec.EmployeeID == employeeID {
			result = append(result, rec)
		}
	}
	if result == nil {
		result = []TechnicianEarning{}
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": result})
}

// HandleCreateTechnicianEarning creates a new technician piece-rate earning log
func HandleCreateTechnicianEarning(c *gin.Context) {
	var rec TechnicianEarning
	if err := c.ShouldBindJSON(&rec); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if rec.ID == "" {
		rec.ID = fmt.Sprintf("EARN-%d", time.Now().UnixNano())
	}
	if rec.RecordedAt == "" {
		rec.RecordedAt = time.Now().Format(time.RFC3339)
	}

	if db.DB != nil {
		_, err := db.DB.Exec(`
			INSERT INTO technician_earnings (id, employee_id, employee_name, order_id, order_number, customer_name, step_id, step_name, impressions, rate_per_impression, earned_amount_lak, recorded_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
			ON CONFLICT (id) DO NOTHING`,
			rec.ID, rec.EmployeeID, rec.EmployeeName, rec.OrderID, rec.OrderNumber, rec.CustomerName, rec.StepID, rec.StepName, rec.Impressions, rec.RatePerImpression, rec.EarnedAmountLAK)
		if err != nil {
			log.Printf("[DB ERROR] Failed to save technician earning: %v", err)
		}
	}

	earningStoreMutex.Lock()
	earningMemoryStore[rec.ID] = rec
	earningStoreMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": rec})
}
