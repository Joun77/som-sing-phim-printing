package customers

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"backend/db"
	"backend/orders"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

type Customer struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	Phone            string    `json:"phone"`
	Email            string    `json:"email"`
	Address          string    `json:"address"`
	CreditLimit      float64   `json:"creditLimit"`
	PaymentTerms     string    `json:"paymentTerms"`
	Instagram        string    `json:"instagram"`
	LineID           string    `json:"line"`
	Facebook         string    `json:"facebook"`
	WhatsApp         string    `json:"whatsapp"`
	Province         string    `json:"province"`
	District         string    `json:"district"`
	Village          string    `json:"village"`
	BranchCode       string    `json:"branchCode"`
	TaxID            string    `json:"taxId"`
	Tier             string    `json:"tier"`             // RETAIL, ONLINE, CORPORATE, CONTRACT_PARTNER
	PreferredCourier string    `json:"preferredCourier"` // Courier ID or name
	Notes            string    `json:"notes"`
	TotalSpentLAK    float64   `json:"totalSpentLAK"`
	TotalOrdersCount int       `json:"totalOrdersCount"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

var (
	customerStore = make(map[string]Customer)
	storeMutex    sync.RWMutex
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
		cust.Tier = "RETAIL"
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
		cust.Tier = "RETAIL"
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

type BulkDeleteRequest struct {
	IDs []string `json:"ids"`
}

type BlockedCustomerInfo struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	OrderCount int    `json:"orderCount"`
	Reason     string `json:"reason"`
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

var ensureColumnsOnce sync.Once

func ensureCustomerColumns() {
	ensureColumnsOnce.Do(func() {
		if db.DB != nil {
			_, _ = db.DB.Exec(`
				ALTER TABLE customers 
				  ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'RETAIL',
				  ADD COLUMN IF NOT EXISTS preferred_courier VARCHAR(100);
			`)
		}
	})
}

func getCustomersFromDB() ([]Customer, error) {
	ensureCustomerColumns()
	query := `
		SELECT id, name, COALESCE(phone, ''), COALESCE(email, ''), COALESCE(address, ''),
		       COALESCE(credit_limit, 1000000.00), COALESCE(payment_terms, 'Net 30'),
		       COALESCE(instagram, ''), COALESCE(line_id, ''), COALESCE(facebook, ''),
		       COALESCE(whatsapp, ''), COALESCE(province, ''), COALESCE(district, ''),
		       COALESCE(village, ''), COALESCE(branch_code, ''), COALESCE(tax_id, ''),
		       COALESCE(tier, 'RETAIL'), COALESCE(preferred_courier, ''),
		       COALESCE(notes, ''), COALESCE(total_spent_lak, 0), COALESCE(total_orders_count, 0),
		       created_at, updated_at
		FROM customers
		ORDER BY created_at DESC
	`
	rows, err := db.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Customer
	for rows.Next() {
		var cust Customer
		err := rows.Scan(
			&cust.ID, &cust.Name, &cust.Phone, &cust.Email, &cust.Address,
			&cust.CreditLimit, &cust.PaymentTerms,
			&cust.Instagram, &cust.LineID, &cust.Facebook,
			&cust.WhatsApp, &cust.Province, &cust.District,
			&cust.Village, &cust.BranchCode, &cust.TaxID,
			&cust.Tier, &cust.PreferredCourier,
			&cust.Notes, &cust.TotalSpentLAK, &cust.TotalOrdersCount,
			&cust.CreatedAt, &cust.UpdatedAt,
		)
		if err != nil {
			log.Printf("[DB ERROR] Scan customer failed: %v", err)
			continue
		}
		list = append(list, cust)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return list, nil
}

func getCustomerByIDFromDB(id string) (Customer, error) {
	ensureCustomerColumns()
	var cust Customer
	query := `
		SELECT id, name, COALESCE(phone, ''), COALESCE(email, ''), COALESCE(address, ''),
		       COALESCE(credit_limit, 1000000.00), COALESCE(payment_terms, 'Net 30'),
		       COALESCE(instagram, ''), COALESCE(line_id, ''), COALESCE(facebook, ''),
		       COALESCE(whatsapp, ''), COALESCE(province, ''), COALESCE(district, ''),
		       COALESCE(village, ''), COALESCE(branch_code, ''), COALESCE(tax_id, ''),
		       COALESCE(tier, 'RETAIL'), COALESCE(preferred_courier, ''),
		       COALESCE(notes, ''), COALESCE(total_spent_lak, 0), COALESCE(total_orders_count, 0),
		       created_at, updated_at
		FROM customers
		WHERE id = $1
	`
	err := db.DB.QueryRow(query, id).Scan(
		&cust.ID, &cust.Name, &cust.Phone, &cust.Email, &cust.Address,
		&cust.CreditLimit, &cust.PaymentTerms,
		&cust.Instagram, &cust.LineID, &cust.Facebook,
		&cust.WhatsApp, &cust.Province, &cust.District,
		&cust.Village, &cust.BranchCode, &cust.TaxID,
		&cust.Tier, &cust.PreferredCourier,
		&cust.Notes, &cust.TotalSpentLAK, &cust.TotalOrdersCount,
		&cust.CreatedAt, &cust.UpdatedAt,
	)
	return cust, err
}

func saveCustomerToDB(cust Customer) error {
	ensureCustomerColumns()
	if cust.Tier == "" {
		cust.Tier = "RETAIL"
	}
	query := `
		INSERT INTO customers (
			id, name, phone, email, address, credit_limit, payment_terms,
			instagram, line_id, facebook, whatsapp, province, district, village,
			branch_code, tax_id, tier, preferred_courier, notes, total_spent_lak, total_orders_count,
			created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			phone = EXCLUDED.phone,
			email = EXCLUDED.email,
			address = EXCLUDED.address,
			credit_limit = EXCLUDED.credit_limit,
			payment_terms = EXCLUDED.payment_terms,
			instagram = EXCLUDED.instagram,
			line_id = EXCLUDED.line_id,
			facebook = EXCLUDED.facebook,
			whatsapp = EXCLUDED.whatsapp,
			province = EXCLUDED.province,
			district = EXCLUDED.district,
			village = EXCLUDED.village,
			branch_code = EXCLUDED.branch_code,
			tax_id = EXCLUDED.tax_id,
			tier = EXCLUDED.tier,
			preferred_courier = EXCLUDED.preferred_courier,
			notes = EXCLUDED.notes,
			total_spent_lak = EXCLUDED.total_spent_lak,
			total_orders_count = EXCLUDED.total_orders_count,
			updated_at = NOW()
	`
	_, err := db.DB.Exec(
		query,
		cust.ID, cust.Name, cust.Phone, cust.Email, cust.Address,
		cust.CreditLimit, cust.PaymentTerms,
		cust.Instagram, cust.LineID, cust.Facebook,
		cust.WhatsApp, cust.Province, cust.District,
		cust.Village, cust.BranchCode, cust.TaxID,
		cust.Tier, cust.PreferredCourier,
		cust.Notes, cust.TotalSpentLAK, cust.TotalOrdersCount,
	)
	return err
}

// HandlePublicCustomerAuth registers or signs in a customer via phone
func HandlePublicCustomerAuth(c *gin.Context) {
	var req struct {
		Phone string `json:"phone"`
		Name  string `json:"name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	phone := req.Phone
	if phone == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Phone number is required"})
		return
	}

	// Try lookup
	var cust Customer
	found := false

	if db.DB != nil {
		query := `
			SELECT id, name, COALESCE(phone, ''), COALESCE(email, ''), COALESCE(address, ''),
			       COALESCE(credit_limit, 1000000.00), COALESCE(payment_terms, 'Net 30'),
			       COALESCE(instagram, ''), COALESCE(line_id, ''), COALESCE(facebook, ''),
			       COALESCE(whatsapp, ''), COALESCE(province, ''), COALESCE(district, ''),
			       COALESCE(village, ''), COALESCE(branch_code, ''), COALESCE(tax_id, ''),
			       COALESCE(tier, 'STANDARD'), COALESCE(preferred_courier, ''),
			       COALESCE(notes, ''), COALESCE(total_spent_lak, 0), COALESCE(total_orders_count, 0),
			       created_at, updated_at
			FROM customers
			WHERE phone = $1
		`
		err := db.DB.QueryRow(query, phone).Scan(
			&cust.ID, &cust.Name, &cust.Phone, &cust.Email, &cust.Address,
			&cust.CreditLimit, &cust.PaymentTerms,
			&cust.Instagram, &cust.LineID, &cust.Facebook,
			&cust.WhatsApp, &cust.Province, &cust.District,
			&cust.Village, &cust.BranchCode, &cust.TaxID,
			&cust.Tier, &cust.PreferredCourier,
			&cust.Notes, &cust.TotalSpentLAK, &cust.TotalOrdersCount,
			&cust.CreatedAt, &cust.UpdatedAt,
		)
		if err == nil {
			found = true
		}
	} else {
		storeMutex.RLock()
		for _, v := range customerStore {
			if v.Phone == phone {
				cust = v
				found = true
				break
			}
		}
		storeMutex.RUnlock()
	}

	if !found {
		// Register a new customer
		cust.ID = "cust-" + time.Now().Format("150405")
		cust.Phone = phone
		if req.Name != "" {
			cust.Name = req.Name
		} else {
			cust.Name = "Customer " + phone
		}
		cust.CreatedAt = time.Now()
		cust.UpdatedAt = time.Now()

		if db.DB != nil {
			err := saveCustomerToDB(cust)
			if err != nil {
				log.Printf("[DB ERROR] Failed to save public auth customer: %v", err)
			}
		}

		storeMutex.Lock()
		customerStore[cust.ID] = cust
		storeMutex.Unlock()
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": cust})
}

// HandlePublicCustomerProfile returns customer profile by phone or id
func HandlePublicCustomerProfile(c *gin.Context) {
	phone := c.Query("phone")
	id := c.Query("id")
	if phone == "" && id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "phone or id query param is required"})
		return
	}

	var cust Customer
	found := false

	if db.DB != nil {
		var query string
		var arg string
		if id != "" {
			query = `SELECT id, name, COALESCE(phone, ''), COALESCE(email, ''), COALESCE(address, ''),
			       COALESCE(credit_limit, 1000000.00), COALESCE(payment_terms, 'Net 30'),
			       COALESCE(instagram, ''), COALESCE(line_id, ''), COALESCE(facebook, ''),
			       COALESCE(whatsapp, ''), COALESCE(province, ''), COALESCE(district, ''),
			       COALESCE(village, ''), COALESCE(branch_code, ''), COALESCE(tax_id, ''),
			       COALESCE(tier, 'STANDARD'), COALESCE(preferred_courier, ''),
			       COALESCE(notes, ''), COALESCE(total_spent_lak, 0), COALESCE(total_orders_count, 0),
			       created_at, updated_at FROM customers WHERE id = $1`
			arg = id
		} else {
			query = `SELECT id, name, COALESCE(phone, ''), COALESCE(email, ''), COALESCE(address, ''),
			       COALESCE(credit_limit, 1000000.00), COALESCE(payment_terms, 'Net 30'),
			       COALESCE(instagram, ''), COALESCE(line_id, ''), COALESCE(facebook, ''),
			       COALESCE(whatsapp, ''), COALESCE(province, ''), COALESCE(district, ''),
			       COALESCE(village, ''), COALESCE(branch_code, ''), COALESCE(tax_id, ''),
			       COALESCE(tier, 'STANDARD'), COALESCE(preferred_courier, ''),
			       COALESCE(notes, ''), COALESCE(total_spent_lak, 0), COALESCE(total_orders_count, 0),
			       created_at, updated_at FROM customers WHERE phone = $1`
			arg = phone
		}
		err := db.DB.QueryRow(query, arg).Scan(
			&cust.ID, &cust.Name, &cust.Phone, &cust.Email, &cust.Address,
			&cust.CreditLimit, &cust.PaymentTerms,
			&cust.Instagram, &cust.LineID, &cust.Facebook,
			&cust.WhatsApp, &cust.Province, &cust.District,
			&cust.Village, &cust.BranchCode, &cust.TaxID,
			&cust.Tier, &cust.PreferredCourier,
			&cust.Notes, &cust.TotalSpentLAK, &cust.TotalOrdersCount,
			&cust.CreatedAt, &cust.UpdatedAt,
		)
		if err == nil {
			found = true
		}
	} else {
		storeMutex.RLock()
		if id != "" {
			cust, found = customerStore[id]
		} else {
			for _, v := range customerStore {
				if v.Phone == phone {
					cust = v
					found = true
					break
				}
			}
		}
		storeMutex.RUnlock()
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": cust})
}

// HandlePublicCustomerOrders returns customer-masked order list
func HandlePublicCustomerOrders(c *gin.Context) {
	phone := c.Query("phone")
	if phone == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "phone query param is required"})
		return
	}

	// Find the customer's orders
	rawOrders, err := orders.GetOrdersByCustomer("", phone)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"status": "success", "data": []orders.Order{}})
		return
	}

	// Mask financial backend margins
	maskedOrders := make([]orders.Order, 0, len(rawOrders))
	for _, o := range rawOrders {
		o.TotalCost = 0
		o.RemainingLAK = 0
		// Mask item unit cost
		for i := range o.Items {
			o.Items[i].UnitCostLAK = 0
			o.Items[i].CostPriceSnapshot = 0
			o.Items[i].MachineOverheadLAK = 0
		}
		maskedOrders = append(maskedOrders, o)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": maskedOrders})
}

// HandleSavePublicCustomerProfile updates customer profile from public portal
func HandleSavePublicCustomerProfile(c *gin.Context) {
	var req Customer
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer ID is required"})
		return
	}

	req.UpdatedAt = time.Now()

	// Retrieve original customer to preserve fields we shouldn't change from storefront
	var original Customer
	found := false
	if db.DB != nil {
		query := `SELECT id, name, COALESCE(phone, ''), COALESCE(email, ''), COALESCE(address, ''),
		       COALESCE(credit_limit, 1000000.00), COALESCE(payment_terms, 'Net 30'),
		       COALESCE(instagram, ''), COALESCE(line_id, ''), COALESCE(facebook, ''),
		       COALESCE(whatsapp, ''), COALESCE(province, ''), COALESCE(district, ''),
		       COALESCE(village, ''), COALESCE(branch_code, ''), COALESCE(tax_id, ''),
		       COALESCE(notes, ''), COALESCE(total_spent_lak, 0), COALESCE(total_orders_count, 0),
		       created_at, updated_at FROM customers WHERE id = $1`
		err := db.DB.QueryRow(query, req.ID).Scan(
			&original.ID, &original.Name, &original.Phone, &original.Email, &original.Address,
			&original.CreditLimit, &original.PaymentTerms,
			&original.Instagram, &original.LineID, &original.Facebook,
			&original.WhatsApp, &original.Province, &original.District,
			&original.Village, &original.BranchCode, &original.TaxID,
			&original.Notes, &original.TotalSpentLAK, &original.TotalOrdersCount,
			&original.CreatedAt, &original.UpdatedAt,
		)
		if err == nil {
			found = true
		}
	} else {
		storeMutex.RLock()
		original, found = customerStore[req.ID]
		storeMutex.RUnlock()
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	// Merge/overwrite fields customer is allowed to update
	original.Name = req.Name
	original.Phone = req.Phone
	original.Province = req.Province
	original.District = req.District
	original.Village = req.Village
	original.Address = req.Address
	original.BranchCode = req.BranchCode
	original.Email = req.Email
	original.WhatsApp = req.WhatsApp
	original.UpdatedAt = time.Now()

	if db.DB != nil {
		err := saveCustomerToDB(original)
		if err != nil {
			log.Printf("[DB ERROR] Failed to save updated public customer profile: %v", err)
		}
	}

	storeMutex.Lock()
	customerStore[original.ID] = original
	storeMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": original})
}

// HandlePublicCustomerTiers returns dynamic VIP tiers and discounts
func HandlePublicCustomerTiers(c *gin.Context) {
	if db.DB == nil {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data": []gin.H{
				{"id": "STANDARD", "name_lo": "ສະມາຊິກທົ່ວໄປ (Standard)", "discount_percent": 0.0, "badge_color": "slate"},
				{"id": "SILVER", "name_lo": "ຊິລເວີ VIP (Silver)", "discount_percent": 5.0, "badge_color": "cyan"},
				{"id": "GOLD", "name_lo": "ໂກລ VIP (Gold)", "discount_percent": 10.0, "badge_color": "amber"},
				{"id": "PLATINUM", "name_lo": "ແພລຕິນໍາ VIP (Platinum)", "discount_percent": 15.0, "badge_color": "purple"},
			},
		})
		return
	}

	rows, err := db.DB.Query(`
		SELECT id, name_lo, name_en, discount_percent, min_spend_lak, min_orders, badge_color, perks, sort_order, is_active
		FROM customer_vip_tiers
		WHERE is_active = TRUE
		ORDER BY sort_order ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query tiers: " + err.Error()})
		return
	}
	defer rows.Close()

	type TierDTO struct {
		ID              string   `json:"id"`
		NameLo          string   `json:"name_lo"`
		NameEn          string   `json:"name_en"`
		DiscountPercent float64  `json:"discount_percent"`
		MinSpendLAK     float64  `json:"min_spend_lak"`
		MinOrders       int      `json:"min_orders"`
		BadgeColor      string   `json:"badge_color"`
		Perks           []string `json:"perks"`
		SortOrder       int      `json:"sort_order"`
		IsActive        bool     `json:"is_active"`
	}

	var tiers []TierDTO
	for rows.Next() {
		var t TierDTO
		var perks pq.StringArray
		if err := rows.Scan(&t.ID, &t.NameLo, &t.NameEn, &t.DiscountPercent, &t.MinSpendLAK, &t.MinOrders, &t.BadgeColor, &perks, &t.SortOrder, &t.IsActive); err == nil {
			t.Perks = []string(perks)
			tiers = append(tiers, t)
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": tiers})
}


