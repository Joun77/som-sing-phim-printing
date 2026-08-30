package customers

import (
	"log"
	"net/http"
	"sync"
	"time"

	"backend/db"
	"backend/orders"

	"github.com/gin-gonic/gin"
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

// HandleDeleteCustomer deletes a customer by ID
func HandleDeleteCustomer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer ID is required"})
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

func getCustomersFromDB() ([]Customer, error) {
	query := `
		SELECT id, name, COALESCE(phone, ''), COALESCE(email, ''), COALESCE(address, ''),
		       COALESCE(credit_limit, 1000000.00), COALESCE(payment_terms, 'Net 30'),
		       COALESCE(instagram, ''), COALESCE(line_id, ''), COALESCE(facebook, ''),
		       COALESCE(whatsapp, ''), COALESCE(province, ''), COALESCE(district, ''),
		       COALESCE(village, ''), COALESCE(branch_code, ''), COALESCE(tax_id, ''),
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
	var cust Customer
	query := `
		SELECT id, name, COALESCE(phone, ''), COALESCE(email, ''), COALESCE(address, ''),
		       COALESCE(credit_limit, 1000000.00), COALESCE(payment_terms, 'Net 30'),
		       COALESCE(instagram, ''), COALESCE(line_id, ''), COALESCE(facebook, ''),
		       COALESCE(whatsapp, ''), COALESCE(province, ''), COALESCE(district, ''),
		       COALESCE(village, ''), COALESCE(branch_code, ''), COALESCE(tax_id, ''),
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
		&cust.Notes, &cust.TotalSpentLAK, &cust.TotalOrdersCount,
		&cust.CreatedAt, &cust.UpdatedAt,
	)
	return cust, err
}

func saveCustomerToDB(cust Customer) error {
	query := `
		INSERT INTO customers (
			id, name, phone, email, address, credit_limit, payment_terms,
			instagram, line_id, facebook, whatsapp, province, district, village,
			branch_code, tax_id, notes, total_spent_lak, total_orders_count,
			created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
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
			       COALESCE(notes, ''), COALESCE(total_spent_lak, 0), COALESCE(total_orders_count, 0),
			       created_at, updated_at FROM customers WHERE id = $1`
			arg = id
		} else {
			query = `SELECT id, name, COALESCE(phone, ''), COALESCE(email, ''), COALESCE(address, ''),
			       COALESCE(credit_limit, 1000000.00), COALESCE(payment_terms, 'Net 30'),
			       COALESCE(instagram, ''), COALESCE(line_id, ''), COALESCE(facebook, ''),
			       COALESCE(whatsapp, ''), COALESCE(province, ''), COALESCE(district, ''),
			       COALESCE(village, ''), COALESCE(branch_code, ''), COALESCE(tax_id, ''),
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

