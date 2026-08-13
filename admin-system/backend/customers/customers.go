package customers

import (
	"log"
	"net/http"
	"sync"
	"time"

	"backend/db"

	"github.com/gin-gonic/gin"
)

type Customer struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Phone        string    `json:"phone"`
	Email        string    `json:"email"`
	Address      string    `json:"address"`
	CreditLimit  float64   `json:"creditLimit"`
	PaymentTerms string    `json:"paymentTerms"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
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

func getCustomersFromDB() ([]Customer, error) {
	query := `
		SELECT id, name, COALESCE(phone, ''), COALESCE(email, ''), COALESCE(address, ''),
		       COALESCE(credit_limit, 1000000.00), COALESCE(payment_terms, 'Net 30'),
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
			&cust.CreditLimit, &cust.PaymentTerms, &cust.CreatedAt, &cust.UpdatedAt,
		)
		if err != nil {
			continue
		}
		list = append(list, cust)
	}

	return list, nil
}

func saveCustomerToDB(cust Customer) error {
	query := `
		INSERT INTO customers (id, name, phone, email, address, credit_limit, payment_terms, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			phone = EXCLUDED.phone,
			email = EXCLUDED.email,
			address = EXCLUDED.address,
			credit_limit = EXCLUDED.credit_limit,
			payment_terms = EXCLUDED.payment_terms,
			updated_at = NOW()
	`
	_, err := db.DB.Exec(query, cust.ID, cust.Name, cust.Phone, cust.Email, cust.Address, cust.CreditLimit, cust.PaymentTerms)
	return err
}
