package customers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"somsing.local/backend/db"
	"somsing.local/backend/orders"

	"github.com/gin-gonic/gin"
)

// HandleGetCustomers retrieves all customers from PostgreSQL DB or memory fallback
func HandleGetCustomers(c *gin.Context) {
	if db.DB != nil {
		customers, err := getCustomersFromDB()
		if err == nil {
			if customers == nil {
				customers = []Customer{}
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": customers})
			return
		}
	}

	storeMutex.RLock()
	defer storeMutex.RUnlock()

	list := make([]Customer, 0, len(customerStore))
	for _, cust := range customerStore {
		list = append(list, cust)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
}

// HandleGetCustomerByID retrieves a single customer by ID
func HandleGetCustomerByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer ID is required"})
		return
	}

	if db.DB != nil {
		cust, err := getCustomerByIDFromDB(id)
		if err == nil {
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": cust})
			return
		}
	}

	storeMutex.RLock()
	cust, exists := customerStore[id]
	storeMutex.RUnlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": cust})
}

// HandleGetCustomerOrders retrieves order history for a customer
func HandleGetCustomerOrders(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer ID is required"})
		return
	}

	var phone string
	if db.DB != nil {
		_ = db.DB.QueryRow("SELECT COALESCE(phone, '') FROM customers WHERE id = $1", id).Scan(&phone)
	}
	if phone == "" {
		storeMutex.RLock()
		if cust, ok := customerStore[id]; ok {
			phone = cust.Phone
		}
		storeMutex.RUnlock()
	}

	custOrders, err := orders.GetOrdersByCustomer(id, phone)
	if err != nil {
		custOrders = []orders.Order{}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": custOrders})
}

// HandleCreateCustomer adds a new customer
func HandleCreateCustomer(c *gin.Context) {
	var cust Customer
	if err := c.ShouldBindJSON(&cust); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if cust.ID == "" {
		cust.ID = "cust-" + time.Now().Format("150405")
	}
	if cust.Tier == "" {
		cust.Tier = "STANDARD"
	}
	cust.CreatedAt = time.Now()
	cust.UpdatedAt = time.Now()

	if db.DB != nil {
		err := saveCustomerToDB(cust)
		if err != nil {
			log.Printf("[DB ERROR] Failed to save customer: %v", err)
		}
	}

	storeMutex.Lock()
	customerStore[cust.ID] = cust
	storeMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": cust})
}

// HandleUpdateCustomer updates existing customer details
func HandleUpdateCustomer(c *gin.Context) {
	id := c.Param("id")
	var cust Customer
	if err := c.ShouldBindJSON(&cust); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cust.ID = id
	if cust.Tier == "" {
		cust.Tier = "STANDARD"
	}
	cust.UpdatedAt = time.Now()

	if db.DB != nil {
		err := saveCustomerToDB(cust)
		if err != nil {
			log.Printf("[DB ERROR] Failed to update customer: %v", err)
		}
	}

	storeMutex.Lock()
	customerStore[id] = cust
	storeMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": cust})
}

// HandleDeleteCustomer deletes a customer by ID with strict Block Delete enforcement
func HandleDeleteCustomer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer ID is required"})
		return
	}

	// 1. Fetch current info to check order linkage
	var phone, name string
	if db.DB != nil {
		_ = db.DB.QueryRow("SELECT COALESCE(phone, ''), COALESCE(name, '') FROM customers WHERE id = $1", id).Scan(&phone, &name)
	}
	if phone == "" || name == "" {
		storeMutex.RLock()
		if cust, ok := customerStore[id]; ok {
			phone = cust.Phone
			name = cust.Name
		}
		storeMutex.RUnlock()
	}

	// 2. Block Delete Policy: Cannot delete customer if they have order history
	custOrders, _ := orders.GetOrdersByCustomer(id, phone)
	if len(custOrders) > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"status":     "error",
			"error":      "CANNOT_DELETE_HAS_ORDERS",
			"message":    fmt.Sprintf("ບໍ່ສາມາດລຶບລູກຄ້າ \"%s\" ໄດ້ ເນື່ອງຈາກມີປະຫວັດການສັ່ງຊື້ %d ອໍເດີ (ກະລຸນາລຶບອໍເດີອອກກ່ອນ)", name, len(custOrders)),
			"orderCount": len(custOrders),
			"customerId": id,
		})
		return
	}

	if db.DB != nil {
		_, err := db.DB.Exec("DELETE FROM customers WHERE id = $1", id)
		if err != nil {
			log.Printf("[DB ERROR] Failed to delete customer %s: %v", id, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete customer from database", "details": err.Error()})
			return
		}
	}

	storeMutex.Lock()
	delete(customerStore, id)
	storeMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Customer deleted successfully", "id": id})
}

// HandleBulkDeleteCustomers deletes multiple customers while protecting customers with orders
func HandleBulkDeleteCustomers(c *gin.Context) {
	var req BulkDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil || len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: customer IDs array required"})
		return
	}

	deleted := make([]string, 0)
	blocked := make([]BlockedCustomerInfo, 0)

	for _, id := range req.IDs {
		var phone, name string
		if db.DB != nil {
			_ = db.DB.QueryRow("SELECT COALESCE(phone, ''), COALESCE(name, '') FROM customers WHERE id = $1", id).Scan(&phone, &name)
		}
		if phone == "" || name == "" {
			storeMutex.RLock()
			if cust, ok := customerStore[id]; ok {
				phone = cust.Phone
				name = cust.Name
			}
			storeMutex.RUnlock()
		}

		custOrders, _ := orders.GetOrdersByCustomer(id, phone)
		if len(custOrders) > 0 {
			blocked = append(blocked, BlockedCustomerInfo{
				ID:         id,
				Name:       name,
				OrderCount: len(custOrders),
				Reason:     fmt.Sprintf("ມີປະຫວັດການສັ່ງຊື້ %d ອໍເດີ", len(custOrders)),
			})
			continue
		}

		if db.DB != nil {
			_, err := db.DB.Exec("DELETE FROM customers WHERE id = $1", id)
			if err != nil {
				log.Printf("[DB ERROR] Failed to bulk delete customer %s: %v", id, err)
				continue
			}
		}

		storeMutex.Lock()
		delete(customerStore, id)
		storeMutex.Unlock()

		deleted = append(deleted, id)
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"deleted": deleted,
		"blocked": blocked,
		"message": fmt.Sprintf("ລຶບສຳເລັດ %d ຄົນ, ຖືກບລັອກ %d ຄົນ", len(deleted), len(blocked)),
	})
}
