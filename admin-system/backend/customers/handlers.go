package customers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin/binding"
	"math"
	"net/http"
	"somsing.local/backend/finance"
	"sort"
	"strings"

	"somsing.local/backend/db"
	"somsing.local/backend/orders"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// HandleGetCustomers retrieves all customers from PostgreSQL DB or memory fallback
func HandleGetCustomers(c *gin.Context) {
	if db.DB == nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
		return
	}
	list, err := getCustomersFromDB()
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if list == nil {
		list = []Customer{}
	}
	c.JSON(200, gin.H{"status": "success", "data": list})
}
func HandleGetCustomerByID(c *gin.Context) {
	if db.DB == nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
		return
	}
	cust, err := getCustomerByIDFromDB(c.Param("id"))
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	cust.Password = ""
	c.JSON(200, gin.H{"status": "success", "data": cust})
}
func HandleGetCustomerOrders(c *gin.Context) {
	if db.DB == nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
		return
	}
	var phone string
	if err := db.DB.QueryRowContext(c.Request.Context(), `SELECT COALESCE(phone,'') FROM customers WHERE id=$1`, c.Param("id")).Scan(&phone); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	list, err := orders.GetOrdersByCustomer(c.Param("id"), phone)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if list == nil {
		list = []orders.Order{}
	}
	c.JSON(200, gin.H{"status": "success", "data": list})
}
func HandleCreateCustomer(c *gin.Context) { saveStaffCustomer(c, true) }
func HandleUpdateCustomer(c *gin.Context) { saveStaffCustomer(c, false) }
func saveStaffCustomer(c *gin.Context, create bool) {
	if c.GetString("user_id") == "" {
		finance.WriteOperationError(c, &finance.OperationError{Status: 401, Code: "AUTHENTICATION_REQUIRED"})
		return
	}
	if db.DB == nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
		return
	}
	var raw map[string]any
	if c.ShouldBindBodyWith(&raw, binding.JSON) != nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 400, Code: "INVALID_JSON"})
		return
	}
	var cust Customer
	if c.ShouldBindBodyWith(&cust, binding.JSON) != nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 400, Code: "INVALID_JSON"})
		return
	}
	if strings.TrimSpace(cust.Name) == "" || math.IsNaN(cust.CreditLimit) || math.IsInf(cust.CreditLimit, 0) || cust.CreditLimit < 0 {
		finance.WriteOperationError(c, &finance.OperationError{Status: 422, Code: "INVALID_CUSTOMER"})
		return
	}
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	defer tx.Rollback()
	oldEligible := false
	if create {
		cust.ID, err = finance.NewOperationID()
		if err != nil {
			finance.WriteOperationError(c, err)
			return
		}
	} else {
		cust.ID = c.Param("id")
		err = tx.QueryRowContext(c.Request.Context(), `SELECT deposit_eligible FROM customers WHERE id=$1 FOR UPDATE`, cust.ID).Scan(&oldEligible)
		if err != nil {
			finance.WriteOperationError(c, err)
			return
		}
	}
	_, eligibilitySupplied := raw["depositEligible"]
	if !eligibilitySupplied {
		cust.DepositEligible = oldEligible
	}
	if cust.DepositEligible != oldEligible {
		role := c.GetString("user_role")
		if role != "admin" && role != "manager" && role != "owner" {
			finance.WriteOperationError(c, &finance.OperationError{Status: 403, Code: "DEPOSIT_ELIGIBILITY_ROLE_REQUIRED"})
			return
		}
	}
	if cust.Tier == "" {
		cust.Tier = "STANDARD"
	}
	if cust.Source == "" {
		cust.Source = "ADMIN_MANUAL"
	}
	if cust.AuthProvider == "" {
		cust.AuthProvider = "MANUAL"
	}
	if cust.Password != "" {
		hash, e := bcrypt.GenerateFromPassword([]byte(cust.Password), bcrypt.DefaultCost)
		if e != nil {
			finance.WriteOperationError(c, &finance.OperationError{Status: 422, Code: "INVALID_PASSWORD"})
			return
		}
		cust.PasswordHash = string(hash)
	}
	if err = saveCustomerInTransaction(tx, cust, create); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if eligibilitySupplied {
		_, err = tx.ExecContext(c.Request.Context(), `UPDATE customers SET deposit_eligible=$2 WHERE id=$1`, cust.ID, cust.DepositEligible)
		if err != nil {
			finance.WriteOperationError(c, err)
			return
		}
	}
	canonical, err := getCustomerByIDInTransaction(tx, cust.ID)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	canonical.Password = ""
	auditID, err := finance.NewOperationID()
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	newValues, err := json.Marshal(canonical)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	oldValues, _ := json.Marshal(gin.H{"depositEligible": oldEligible})
	_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO audit_logs(id,user_id,user_name,action,resource_type,resource_id,old_values,new_values,ip_address) VALUES($1,$2,$3,'CUSTOMER_SAVE','CUSTOMER',$4,$5,$6,$7)`, auditID, c.GetString("user_id"), c.GetString("username"), cust.ID, string(oldValues), string(newValues), c.ClientIP())
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	storeMutex.Lock()
	customerStore[canonical.ID] = canonical
	storeMutex.Unlock()
	code := 200
	if create {
		code = 201
	}
	c.JSON(code, gin.H{"status": "success", "committed": true, "data": canonical})
}

// Customer deletion serializes order history checks with all order writers.
func deleteCustomers(c *gin.Context, ids []string) ([]string, []BlockedCustomerInfo, error) {
	if c.GetString("user_id") == "" {
		return nil, nil, &finance.OperationError{Status: 401, Code: "AUTHENTICATION_REQUIRED"}
	}
	if db.DB == nil {
		return nil, nil, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"}
	}
	ids = append([]string(nil), ids...)
	sort.Strings(ids)
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		return nil, nil, err
	}
	defer tx.Rollback()
	// Prevent an order being inserted or linked between the history check and delete.
	if _, err = tx.ExecContext(c.Request.Context(), `LOCK TABLE orders IN SHARE ROW EXCLUSIVE MODE`); err != nil {
		return nil, nil, err
	}
	deleted := []string{}
	blocked := []BlockedCustomerInfo{}
	last := ""
	for _, id := range ids {
		if strings.TrimSpace(id) == "" {
			return nil, nil, &finance.OperationError{Status: 422, Code: "CUSTOMER_ID_REQUIRED"}
		}
		if id == last {
			continue
		}
		last = id
		var phone, name string
		if err = tx.QueryRowContext(c.Request.Context(), `SELECT COALESCE(phone,''),COALESCE(name,'') FROM customers WHERE id=$1 FOR UPDATE`, id).Scan(&phone, &name); err != nil {
			return nil, nil, err
		}
		var count int
		err = tx.QueryRowContext(c.Request.Context(), `SELECT COUNT(*) FROM orders WHERE customer_id=$1 OR (NULLIF($2,'') IS NOT NULL AND (customer_phone=$2 OR (LENGTH(REGEXP_REPLACE($2,'[^0-9]','','g'))>=7 AND REGEXP_REPLACE(customer_phone,'[^0-9]','','g') LIKE '%' || REGEXP_REPLACE($2,'[^0-9]','','g'))))`, id, phone).Scan(&count)
		if err != nil {
			return nil, nil, err
		}
		if count > 0 {
			blocked = append(blocked, BlockedCustomerInfo{ID: id, Name: name, OrderCount: count, Reason: fmt.Sprintf("ມີປະຫວັດການສັ່ງຊື້ %d ອໍເດີ", count)})
			continue
		}
		result, e := tx.ExecContext(c.Request.Context(), `DELETE FROM customers WHERE id=$1`, id)
		if e != nil {
			return nil, nil, e
		}
		n, e := result.RowsAffected()
		if e != nil {
			return nil, nil, e
		}
		if n != 1 {
			return nil, nil, sql.ErrNoRows
		}
		auditID, e := finance.NewOperationID()
		if e != nil {
			return nil, nil, e
		}
		oldValues, e := json.Marshal(gin.H{"id": id, "name": name})
		if e != nil {
			return nil, nil, e
		}
		_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO audit_logs(id,user_id,user_name,action,resource_type,resource_id,old_values,new_values,ip_address) VALUES($1,$2,$3,'CUSTOMER_DELETE','CUSTOMER',$4,$5,'{}',$6)`, auditID, c.GetString("user_id"), c.GetString("username"), id, string(oldValues), c.ClientIP())
		if err != nil {
			return nil, nil, err
		}
		deleted = append(deleted, id)
	}
	if err = tx.Commit(); err != nil {
		return nil, nil, err
	}
	storeMutex.Lock()
	for _, id := range deleted {
		delete(customerStore, id)
	}
	storeMutex.Unlock()
	return deleted, blocked, nil
}
func HandleDeleteCustomer(c *gin.Context) {
	deleted, blocked, err := deleteCustomers(c, []string{c.Param("id")})
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if len(blocked) > 0 {
		b := blocked[0]
		c.JSON(http.StatusConflict, gin.H{"status": "error", "code": "CANNOT_DELETE_HAS_ORDERS", "error": "CANNOT_DELETE_HAS_ORDERS", "message": b.Reason, "orderCount": b.OrderCount, "customerId": b.ID})
		return
	}
	c.JSON(200, gin.H{"status": "success", "committed": true, "id": deleted[0], "message": "ລຶບລູກຄ້າສຳເລັດ"})
}
func HandleBulkDeleteCustomers(c *gin.Context) {
	var req BulkDeleteRequest
	if c.ShouldBindJSON(&req) != nil || len(req.IDs) == 0 {
		finance.WriteOperationError(c, &finance.OperationError{Status: 400, Code: "CUSTOMER_IDS_REQUIRED"})
		return
	}
	deleted, blocked, err := deleteCustomers(c, req.IDs)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	c.JSON(200, gin.H{"status": "success", "committed": true, "deleted": deleted, "blocked": blocked, "message": fmt.Sprintf("ລຶບສຳເລັດ %d ຄົນ, ຖືກບລັອກ %d ຄົນ", len(deleted), len(blocked))})
}
