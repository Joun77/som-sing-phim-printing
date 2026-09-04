package settings

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

type Courier struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	ShortName string    `json:"shortName"`
	LogoURL   string    `json:"logoUrl"`
	Fee       float64   `json:"fee"`
	ETA       string    `json:"eta"`
	FreeAbove float64   `json:"freeAbove"`
	Color     string    `json:"color"`
	IsActive  bool      `json:"isActive"`
	IsDefault bool      `json:"isDefault"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type PaymentMethod struct {
	ID            string    `json:"id"`
	BankName      string    `json:"bankName"`
	AccountName   string    `json:"accountName"`
	AccountNumber string    `json:"accountNumber"`
	Branch        string    `json:"branch"`
	QRCodeURL     string    `json:"qrCodeUrl"`
	LogoURL       string    `json:"logoUrl"`
	PromptPayName string    `json:"promptpayName"`
	ShopName      string    `json:"shopName"`
	IsActive      bool      `json:"isActive"`
	IsDefault     bool      `json:"isDefault"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

const (
	courierDataFile = "./couriers_data.json"
	paymentDataFile = "./payment_methods_data.json"
)

var (
	courierStore = make(map[string]Courier)
	paymentStore = make(map[string]PaymentMethod)
	storeMutex   sync.RWMutex
)

func saveCouriersToFile() {
	list := make([]Courier, 0, len(courierStore))
	for _, c := range courierStore {
		list = append(list, c)
	}
	data, err := json.MarshalIndent(list, "", "  ")
	if err == nil {
		os.WriteFile(courierDataFile, data, 0644)
	}
}

func loadCouriersFromFile() bool {
	data, err := os.ReadFile(courierDataFile)
	if err != nil {
		return false
	}
	var list []Courier
	if err := json.Unmarshal(data, &list); err != nil || len(list) == 0 {
		return false
	}
	courierStore = make(map[string]Courier)
	for _, c := range list {
		courierStore[c.ID] = c
	}
	return true
}

func savePaymentMethodsToFile() {
	list := make([]PaymentMethod, 0, len(paymentStore))
	for _, p := range paymentStore {
		list = append(list, p)
	}
	data, err := json.MarshalIndent(list, "", "  ")
	if err == nil {
		os.WriteFile(paymentDataFile, data, 0644)
	}
}

func loadPaymentMethodsFromFile() bool {
	data, err := os.ReadFile(paymentDataFile)
	if err != nil {
		return false
	}
	var list []PaymentMethod
	if err := json.Unmarshal(data, &list); err != nil || len(list) == 0 {
		return false
	}
	paymentStore = make(map[string]PaymentMethod)
	for _, p := range list {
		paymentStore[p.ID] = p
	}
	return true
}

func init() {
	// Try loading from saved JSON files first
	if loadCouriersFromFile() && loadPaymentMethodsFromFile() {
		return
	}

	// Seed default in-memory couriers if no saved file
	now := time.Now()
	if len(courierStore) == 0 {
		courierStore["anousith_express"] = Courier{
			ID:        "anousith_express",
			Name:      "Anousith Express (ອະນຸສິດ ເອັກສະເປຣັສ)",
			ShortName: "Anousith",
			LogoURL:   "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=150",
			Fee:       15000,
			ETA:       "1-2 ວັນ (1-2 Days)",
			FreeAbove: 300000,
			Color:     "#d97706",
			IsActive:  true,
			IsDefault: true,
			CreatedAt: now,
			UpdatedAt: now,
		}
		courierStore["hal_logistics"] = Courier{
			ID:        "hal_logistics",
			Name:      "HAL Logistics (ຮົງອາລຸນ ຂົນສົ່ງ)",
			ShortName: "HAL",
			LogoURL:   "/api/v1/orders/files/logo_1787356736419680000.png",
			Fee:       20000,
			ETA:       "1-2 ວັນ (1-2 Days)",
			FreeAbove: 350000,
			Color:     "#2563eb",
			IsActive:  true,
			IsDefault: false,
			CreatedAt: now,
			UpdatedAt: now,
		}
		saveCouriersToFile()
	}

	// Seed default in-memory payment methods if no saved file
	if len(paymentStore) == 0 {
		paymentStore["bcel_one"] = PaymentMethod{
			ID:            "bcel_one",
			BankName:      "BCEL (ທະນາຄານການຄ້າຕ່າງປະເທດລາວ ມະຫາຊົນ)",
			AccountName:   "Som-Sing Phim Printing Shop",
			AccountNumber: "160-12-00-01234567-001",
			Branch:        "Vientiane Head Office",
			QRCodeURL:     "",
			PromptPayName: "Som-Sing Phim",
			ShopName:      "ຮ້ານ ສົມສິ່ງພິມ (Som-Sing Phim)",
			IsActive:      true,
			IsDefault:     true,
			CreatedAt:     now,
			UpdatedAt:     now,
		}
		savePaymentMethodsToFile()
	}
}

// ----------------------------------------------------
// Courier Handlers
// ----------------------------------------------------

func HandleGetCouriers(c *gin.Context) {
	if db.DB != nil {
		rows, err := db.DB.Query(`
			SELECT id, name, COALESCE(short_name, ''), COALESCE(logo_url, ''), fee, 
			       COALESCE(eta, ''), free_above, COALESCE(color, '#2563eb'), 
			       is_active, is_default, created_at, updated_at 
			FROM couriers 
			ORDER BY is_default DESC, created_at ASC
		`)
		if err == nil {
			defer rows.Close()
			var list []Courier
			for rows.Next() {
				var cr Courier
				if err := rows.Scan(
					&cr.ID, &cr.Name, &cr.ShortName, &cr.LogoURL, &cr.Fee,
					&cr.ETA, &cr.FreeAbove, &cr.Color,
					&cr.IsActive, &cr.IsDefault, &cr.CreatedAt, &cr.UpdatedAt,
				); err == nil {
					list = append(list, cr)
				}
			}
			if err := rows.Err(); err == nil {
				if list == nil {
					list = []Courier{}
				}
				c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
				return
			}
		}
	}

	storeMutex.RLock()
	defer storeMutex.RUnlock()
	list := make([]Courier, 0, len(courierStore))
	for _, cr := range courierStore {
		list = append(list, cr)
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
}

func HandleCreateCourier(c *gin.Context) {
	var req Courier
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ID == "" {
		req.ID = fmt.Sprintf("courier_%d", time.Now().UnixNano())
	}
	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Courier name is required"})
		return
	}
	if req.ShortName == "" {
		req.ShortName = req.Name
	}
	if req.Color == "" {
		req.Color = "#2563eb"
	}
	req.IsActive = true
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()

	if db.DB != nil {
		_, err := db.DB.Exec(`
			INSERT INTO couriers (id, name, short_name, logo_url, fee, eta, free_above, color, is_active, is_default, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				short_name = EXCLUDED.short_name,
				logo_url = EXCLUDED.logo_url,
				fee = EXCLUDED.fee,
				eta = EXCLUDED.eta,
				free_above = EXCLUDED.free_above,
				color = EXCLUDED.color,
				is_active = EXCLUDED.is_active,
				updated_at = EXCLUDED.updated_at
		`, req.ID, req.Name, req.ShortName, req.LogoURL, req.Fee, req.ETA, req.FreeAbove, req.Color, req.IsActive, req.IsDefault, req.CreatedAt, req.UpdatedAt)
		if err != nil {
			fmt.Printf("[DB LOGISTICS WARNING] Failed to save courier to DB: %v (saved to memory store)\n", err)
		}
	}

	storeMutex.Lock()
	courierStore[req.ID] = req
	saveCouriersToFile()
	storeMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": req})
}

func HandleUpdateCourier(c *gin.Context) {
	id := c.Param("id")
	var req Courier
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.ID = id
	req.UpdatedAt = time.Now()

	if db.DB != nil {
		res, err := db.DB.Exec(`
			UPDATE couriers SET
				name = $1,
				short_name = $2,
				logo_url = $3,
				fee = $4,
				eta = $5,
				free_above = $6,
				color = $7,
				is_active = $8,
				is_default = $9,
				updated_at = $10
			WHERE id = $11
		`, req.Name, req.ShortName, req.LogoURL, req.Fee, req.ETA, req.FreeAbove, req.Color, req.IsActive, req.IsDefault, req.UpdatedAt, id)
		if err != nil {
			fmt.Printf("[DB LOGISTICS WARNING] Failed to update courier in DB: %v\n", err)
		} else if rows, _ := res.RowsAffected(); rows == 0 {
			// create if not exists
			db.DB.Exec(`
				INSERT INTO couriers (id, name, short_name, logo_url, fee, eta, free_above, color, is_active, is_default, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			`, req.ID, req.Name, req.ShortName, req.LogoURL, req.Fee, req.ETA, req.FreeAbove, req.Color, req.IsActive, req.IsDefault, time.Now(), req.UpdatedAt)
		}
	}

	storeMutex.Lock()
	courierStore[id] = req
	saveCouriersToFile()
	storeMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": req})
}

func HandleDeleteCourier(c *gin.Context) {
	id := c.Param("id")
	if db.DB != nil {
		db.DB.Exec("DELETE FROM couriers WHERE id = $1", id)
	}

	storeMutex.Lock()
	delete(courierStore, id)
	saveCouriersToFile()
	storeMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Courier deleted"})
}

func HandleSyncCouriers(c *gin.Context) {
	var list []Courier
	if err := c.ShouldBindJSON(&list); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	storeMutex.Lock()
	courierStore = make(map[string]Courier)
	for _, cr := range list {
		courierStore[cr.ID] = cr
	}
	saveCouriersToFile()
	storeMutex.Unlock()

	if db.DB != nil {
		db.DB.Exec("DELETE FROM couriers")
		for _, cr := range list {
			db.DB.Exec(`
				INSERT INTO couriers (id, name, short_name, logo_url, fee, eta, free_above, color, is_active, is_default, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`, cr.ID, cr.Name, cr.ShortName, cr.LogoURL, cr.Fee, cr.ETA, cr.FreeAbove, cr.Color, cr.IsActive, cr.IsDefault)
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "count": len(list)})
}

// ----------------------------------------------------
// Image Upload for Logos & QR Codes
// ----------------------------------------------------

func HandleUploadLogo(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload dir"})
		return
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("logo_%d%s", time.Now().UnixNano(), ext)
	targetPath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, targetPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	fileURL := fmt.Sprintf("/api/v1/orders/files/%s", filename)
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"fileUrl": fileURL,
	})
}

// ----------------------------------------------------
// Payment Method (Bank Account) Handlers
// ----------------------------------------------------

func HandleGetPaymentMethods(c *gin.Context) {
	if db.DB != nil {
		rows, err := db.DB.Query(`
			SELECT id, bank_name, account_name, account_number, COALESCE(branch, ''), 
			       COALESCE(qr_code_url, ''), COALESCE(logo_url, ''), COALESCE(promptpay_name, ''),
			       is_active, is_default, created_at, updated_at
			FROM payment_methods
			ORDER BY is_default DESC, created_at ASC
		`)
		if err == nil {
			defer rows.Close()
			var list []PaymentMethod
			for rows.Next() {
				var pm PaymentMethod
				if err := rows.Scan(
					&pm.ID, &pm.BankName, &pm.AccountName, &pm.AccountNumber, &pm.Branch,
					&pm.QRCodeURL, &pm.LogoURL, &pm.PromptPayName,
					&pm.IsActive, &pm.IsDefault, &pm.CreatedAt, &pm.UpdatedAt,
				); err == nil {
					list = append(list, pm)
				}
			}
			if err := rows.Err(); err == nil && len(list) > 0 {
				c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
				return
			}
		}
	}

	storeMutex.RLock()
	defer storeMutex.RUnlock()
	list := make([]PaymentMethod, 0, len(paymentStore))
	for _, pm := range paymentStore {
		list = append(list, pm)
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
}

func HandleCreatePaymentMethod(c *gin.Context) {
	var req PaymentMethod
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ID == "" {
		req.ID = fmt.Sprintf("bank_%d", time.Now().UnixNano())
	}
	if req.BankName == "" || req.AccountNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bank name and account number are required"})
		return
	}
	req.IsActive = true
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()

	if db.DB != nil {
		_, err := db.DB.Exec(`
			INSERT INTO payment_methods (id, bank_name, account_name, account_number, branch, qr_code_url, logo_url, promptpay_name, is_active, is_default, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			ON CONFLICT (id) DO UPDATE SET
				bank_name = EXCLUDED.bank_name,
				account_name = EXCLUDED.account_name,
				account_number = EXCLUDED.account_number,
				branch = EXCLUDED.branch,
				qr_code_url = EXCLUDED.qr_code_url,
				logo_url = EXCLUDED.logo_url,
				promptpay_name = EXCLUDED.promptpay_name,
				is_active = EXCLUDED.is_active,
				updated_at = EXCLUDED.updated_at
		`, req.ID, req.BankName, req.AccountName, req.AccountNumber, req.Branch, req.QRCodeURL, req.LogoURL, req.PromptPayName, req.IsActive, req.IsDefault, req.CreatedAt, req.UpdatedAt)
		if err != nil {
			fmt.Printf("[DB LOGISTICS WARNING] Failed to save payment method to DB: %v\n", err)
		}
	}

	storeMutex.Lock()
	paymentStore[req.ID] = req
	savePaymentMethodsToFile()
	storeMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": req})
}

func HandleUpdatePaymentMethod(c *gin.Context) {
	id := c.Param("id")
	var req PaymentMethod
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.ID = id
	req.UpdatedAt = time.Now()

	if db.DB != nil {
		_, err := db.DB.Exec(`
			UPDATE payment_methods SET
				bank_name = $1,
				account_name = $2,
				account_number = $3,
				branch = $4,
				qr_code_url = $5,
				logo_url = $6,
				promptpay_name = $7,
				is_active = $8,
				is_default = $9,
				updated_at = $10
			WHERE id = $11
		`, req.BankName, req.AccountName, req.AccountNumber, req.Branch, req.QRCodeURL, req.LogoURL, req.PromptPayName, req.IsActive, req.IsDefault, req.UpdatedAt, id)
		if err != nil {
			fmt.Printf("[DB LOGISTICS WARNING] Failed to update payment method in DB: %v\n", err)
		}
	}

	storeMutex.Lock()
	paymentStore[id] = req
	savePaymentMethodsToFile()
	storeMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": req})
}

func HandleDeletePaymentMethod(c *gin.Context) {
	id := c.Param("id")
	if db.DB != nil {
		db.DB.Exec("DELETE FROM payment_methods WHERE id = $1", id)
	}

	storeMutex.Lock()
	delete(paymentStore, id)
	savePaymentMethodsToFile()
	storeMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Payment method deleted"})
}

func HandleSyncPaymentMethods(c *gin.Context) {
	var list []PaymentMethod
	if err := c.ShouldBindJSON(&list); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	storeMutex.Lock()
	paymentStore = make(map[string]PaymentMethod)
	for _, pm := range list {
		paymentStore[pm.ID] = pm
	}
	savePaymentMethodsToFile()
	storeMutex.Unlock()

	if db.DB != nil {
		db.DB.Exec("DELETE FROM payment_methods")
		for _, pm := range list {
			db.DB.Exec(`
				INSERT INTO payment_methods (id, bank_name, account_name, account_number, branch, qr_code_url, logo_url, promptpay_name, is_active, is_default, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`, pm.ID, pm.BankName, pm.AccountName, pm.AccountNumber, pm.Branch, pm.QRCodeURL, pm.LogoURL, pm.PromptPayName, pm.IsActive, pm.IsDefault)
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "count": len(list)})
}
