package production

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// ResolveAuthenticatedEmployeeID extracts and verifies the employee ID from Gin context and database
func ResolveAuthenticatedEmployeeID(c *gin.Context) string {
	empID := strings.TrimSpace(c.GetString("employee_id"))
	if empID != "" {
		return empID
	}

	userID := strings.TrimSpace(c.GetString("user_id"))
	username := strings.TrimSpace(c.GetString("username"))

	database, err := getDB()
	if err == nil && database != nil {
		if userID != "" {
			var dbEmpID sql.NullString
			_ = database.QueryRow(`SELECT employee_id FROM admin_users WHERE id = $1`, userID).Scan(&dbEmpID)
			if dbEmpID.Valid && strings.TrimSpace(dbEmpID.String) != "" {
				return strings.TrimSpace(dbEmpID.String)
			}
		}
		if username != "" {
			var dbEmpID sql.NullString
			_ = database.QueryRow(`SELECT employee_id FROM admin_users WHERE LOWER(username) = LOWER($1)`, username).Scan(&dbEmpID)
			if dbEmpID.Valid && strings.TrimSpace(dbEmpID.String) != "" {
				return strings.TrimSpace(dbEmpID.String)
			}
			// Check if username itself is an employee ID
			var foundID string
			_ = database.QueryRow(`SELECT id FROM employees WHERE id = $1`, username).Scan(&foundID)
			if foundID != "" {
				return foundID
			}
		}
	}
	return ""
}

// HandleGetDailyPlan returns planned assignments filtered by date, shift, staff, or machine directly from PostgreSQL
func HandleGetDailyPlan(c *gin.Context) {
	dateParam := c.Query("date")
	shiftParam := c.Query("shift")
	assigneeParam := c.Query("assignee_id")
	machineParam := c.Query("machine_id")
	statusParam := c.Query("status")

	assignments, err := GetAllAssignments()
	if err != nil {
		if errors.Is(err, ErrDatabaseDisconnected) {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "ບໍ່ສາມາດດຶງຂໍ້ມູນແຜນງານໄດ້ ເນື່ອງຈາກຖານຂໍ້ມູນບໍ່ໄດ້ເຊື່ອມຕໍ່ (Database disconnected; daily plan unavailable)",
				"code":    "DB_DISCONNECTED",
				"details": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query assignments", "details": err.Error()})
		return
	}

	userRole := c.GetString("user_role")
	empID := ResolveAuthenticatedEmployeeID(c)

	targetDate := dateParam
	if targetDate == "" {
		targetDate = time.Now().Format("2006-01-02")
	}

	filtered, filterErr := FilterAssignmentsForUser(assignments, targetDate, shiftParam, assigneeParam, machineParam, statusParam, userRole, empID)
	if filterErr != nil {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "ທ່ານບໍ່ໄດ້ຜູກກັບລະຫັດພະນັກງານໃນລະບົບ (Authenticated user is not linked to any active employee record)",
			"code":  "UNLINKED_EMPLOYEE",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"date":   targetDate,
		"count":  len(filtered),
		"data":   filtered,
	})
}

// HandleCreateAssignment handles dispatching an order item stage with strict PostgreSQL persistence
func HandleCreateAssignment(c *gin.Context) {
	var req CreateAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload", "details": err.Error()})
		return
	}

	createdBy := c.GetString("user_fullname")
	if createdBy == "" {
		createdBy = c.GetString("username")
	}
	if createdBy == "" {
		createdBy = "Admin/Manager"
	}

	assignment, conflict, err := CreateAssignment(req, createdBy)
	if err != nil {
		if errors.Is(err, ErrDatabaseDisconnected) {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "ບໍ່ສາມາດບັນທຶກການມອບໝາຍວຽກໄດ້ ເນື່ອງຈາກຖານຂໍ້ມູນບໍ່ໄດ້ເຊື່ອມຕໍ່ (Cannot persist assignment to database: disconnected)",
				"code":    "DB_DISCONNECTED",
				"details": err.Error(),
			})
			return
		}
		if conflict != nil && conflict.HasConflict {
			c.JSON(http.StatusConflict, gin.H{
				"error":    "Assignment collision detected",
				"conflict": conflict,
				"message":  conflict.Message,
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Assignment created successfully and persisted in database",
		"data":    assignment,
	})
}

// HandleUpdateAssignment updates an existing stage assignment in PostgreSQL
func HandleUpdateAssignment(c *gin.Context) {
	id := c.Param("id")
	var req UpdateAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload", "details": err.Error()})
		return
	}

	updatedBy := c.GetString("user_fullname")
	if updatedBy == "" {
		updatedBy = c.GetString("username")
	}

	assignment, conflict, err := UpdateAssignment(id, req, updatedBy)
	if err != nil {
		if errors.Is(err, ErrDatabaseDisconnected) {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "ບໍ່ສາມາດແກ້ໄຂການມອບໝາຍວຽກໄດ້ ເນື່ອງຈາກຖານຂໍ້ມູນບໍ່ໄດ້ເຊື່ອມຕໍ່ (Cannot update assignment: database disconnected)",
				"code":    "DB_DISCONNECTED",
				"details": err.Error(),
			})
			return
		}
		if conflict != nil && conflict.HasConflict {
			c.JSON(http.StatusConflict, gin.H{
				"error":    "Assignment collision detected",
				"conflict": conflict,
				"message":  conflict.Message,
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Assignment updated successfully in database",
		"data":    assignment,
	})
}

// HandleDeleteAssignment deletes an assignment from PostgreSQL
func HandleDeleteAssignment(c *gin.Context) {
	id := c.Param("id")
	if err := DeleteAssignment(id); err != nil {
		if errors.Is(err, ErrDatabaseDisconnected) {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "ບໍ່ສາມາດລຶບການມອບໝາຍວຽກໄດ້ ເນື່ອງຈາກຖານຂໍ້ມູນບໍ່ໄດ້ເຊື່ອມຕໍ່ (Cannot delete assignment: database disconnected)",
				"code":    "DB_DISCONNECTED",
				"details": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Assignment removed from database"})
}

// HandleUpdateAssignmentProgress allows operator or manager to report execution progress with DB transaction
func HandleUpdateAssignmentProgress(c *gin.Context) {
	id := c.Param("id")
	var req UpdateProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid progress payload", "details": err.Error()})
		return
	}

	operatorRole := c.GetString("user_role")
	isManagerOrAdmin := strings.EqualFold(operatorRole, "admin") ||
		strings.EqualFold(operatorRole, "manager") ||
		strings.EqualFold(operatorRole, "owner") ||
		strings.EqualFold(operatorRole, "super_admin")

	// Identity must come strictly from authenticated JWT token, NOT from client payload!
	operatorID := ResolveAuthenticatedEmployeeID(c)
	if !isManagerOrAdmin {
		if operatorID == "" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "ທ່ານບໍ່ໄດ້ຜູກກັບລະຫັດພະນັກງານໃນລະບົບ (Authenticated user is not linked to any active employee record)",
				"code":  "UNLINKED_EMPLOYEE",
			})
			return
		}
	} else {
		// Manager/admin can use employee ID or fallback to user_id / username for auditing
		if operatorID == "" {
			operatorID = c.GetString("user_id")
			if operatorID == "" {
				operatorID = c.GetString("username")
			}
		}
	}

	assignment, err := UpdateAssignmentProgress(id, req, operatorID, operatorRole)
	if err != nil {
		if errors.Is(err, ErrDatabaseDisconnected) {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "ບໍ່ສາມາດອັບເດດສະຖານະໄດ້ ເນື່ອງຈາກຖານຂໍ້ມູນບໍ່ໄດ້ເຊື່ອມຕໍ່ (Cannot update progress: database disconnected)",
				"code":    "DB_DISCONNECTED",
				"details": err.Error(),
			})
			return
		}
		if strings.Contains(err.Error(), "ທ່ານບໍ່ມີສິດ") || strings.Contains(err.Error(), "Only assigned") || strings.Contains(err.Error(), "Unauthorized") {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Progress recorded successfully in database",
		"data":    assignment,
	})
}

// HandleGetReadyOrdersQueue returns orders eligible or blocked for production scheduling from PostgreSQL (Manager/Admin only)
func HandleGetReadyOrdersQueue(c *gin.Context) {
	userRole := c.GetString("user_role")
	isManagerOrAdmin := strings.EqualFold(userRole, "admin") ||
		strings.EqualFold(userRole, "manager") ||
		strings.EqualFold(userRole, "owner") ||
		strings.EqualFold(userRole, "super_admin")

	if !isManagerOrAdmin && userRole != "" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "ທ່ານບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນນີ້ (Only managers and admins can access the ready orders queue)",
			"code":  "FORBIDDEN",
		})
		return
	}

	queue, err := GetReadyOrdersQueue()
	if err != nil {
		if errors.Is(err, ErrDatabaseDisconnected) {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "ບໍ່ສາມາດດຶງຄິວອໍເດີໄດ້ ເນື່ອງຈາກຖານຂໍ້ມູນບໍ່ໄດ້ເຊື່ອມຕໍ່ (Database disconnected; orders queue unavailable)",
				"code":    "DB_DISCONNECTED",
				"details": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query ready orders queue", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"count":  len(queue),
		"data":   queue,
	})
}

// HandleGetAssignableStaff returns active staff with safe non-sensitive fields from PostgreSQL (Manager/Admin only)
func HandleGetAssignableStaff(c *gin.Context) {
	userRole := c.GetString("user_role")
	isManagerOrAdmin := strings.EqualFold(userRole, "admin") ||
		strings.EqualFold(userRole, "manager") ||
		strings.EqualFold(userRole, "owner") ||
		strings.EqualFold(userRole, "super_admin")

	if !isManagerOrAdmin && userRole != "" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "ທ່ານບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນນີ້ (Only managers and admins can access the staff list)",
			"code":  "FORBIDDEN",
		})
		return
	}

	staff, err := GetAssignableStaffList()
	if err != nil {
		if errors.Is(err, ErrDatabaseDisconnected) {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "ບໍ່ສາມາດດຶງລາຍຊື່ພະນັກງານໄດ້ ເນື່ອງຈາກຖານຂໍ້ມູນບໍ່ໄດ້ເຊື່ອມຕໍ່ (Database disconnected; staff list unavailable)",
				"code":    "DB_DISCONNECTED",
				"details": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query staff list", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"count":  len(staff),
		"data":   staff,
	})
}
