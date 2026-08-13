package hr

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"backend/db"

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

var (
	employeeStoreMutex  sync.RWMutex
	employeeMemoryStore = map[string]Employee{}
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
