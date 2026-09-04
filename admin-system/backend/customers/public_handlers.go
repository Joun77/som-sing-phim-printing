package customers

import (
	"log"
	"net/http"
	"strings"
	"time"

	"somsing.local/backend/db"
	"somsing.local/backend/orders"

	"github.com/gin-gonic/gin"
)

// HandlePublicCustomerAuth registers or signs in a customer via phone
func HandlePublicCustomerAuth(c *gin.Context) {
	var req PublicAuthRequest
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

	now := time.Now()
	if !found {
		// Register a new customer from Customer Service Storefront
		cust.ID = "cust-" + now.Format("150405")
		cust.Phone = phone
		if req.Name != "" {
			cust.Name = req.Name
		} else {
			cust.Name = "Customer " + phone
		}
		if req.Email != "" {
			cust.Email = req.Email
		}
		cust.Tier = "STANDARD"
		cust.Source = "CUSTOMER_SERVICE"
		cust.AuthProvider = "PHONE"
		cust.LastLoginAt = &now
		cust.CreatedAt = now
		cust.UpdatedAt = now

		if db.DB != nil {
			err := saveCustomerToDB(cust)
			if err != nil {
				log.Printf("[DB ERROR] Failed to save public auth customer: %v", err)
			}
		}

		storeMutex.Lock()
		customerStore[cust.ID] = cust
		storeMutex.Unlock()
	} else {
		// Existing customer login from Customer Service Storefront
		cust.LastLoginAt = &now
		if db.DB != nil {
			_, _ = db.DB.Exec("UPDATE customers SET last_login_at = $1 WHERE id = $2", now, cust.ID)
		}
		storeMutex.Lock()
		customerStore[cust.ID] = cust
		storeMutex.Unlock()
	}

	// Populate Tier discount and perks
	tiers, err := GetTiersFromDB()
	if err == nil {
		for _, t := range tiers {
			if strings.EqualFold(t.ID, cust.Tier) {
				cust.DiscountPercent = t.DiscountPercent
				cust.Perks = t.Perks
				break
			}
		}
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

	// Check if in-memory store has extended avatar/addresses
	storeMutex.RLock()
	if memCust, ok := customerStore[cust.ID]; ok {
		if memCust.AvatarURL != "" {
			cust.AvatarURL = memCust.AvatarURL
		}
		if len(memCust.Addresses) > 0 {
			cust.Addresses = memCust.Addresses
		}
	}
	storeMutex.RUnlock()

	// Populate Tier discount and perks
	tiers, err := GetTiersFromDB()
	if err == nil {
		for _, t := range tiers {
			if strings.EqualFold(t.ID, cust.Tier) {
				cust.DiscountPercent = t.DiscountPercent
				cust.Perks = t.Perks
				break
			}
		}
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

	// Mask financial backend margins & costs
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
	if req.Name != "" {
		original.Name = req.Name
	}
	if req.Phone != "" {
		original.Phone = req.Phone
	}
	if req.Province != "" {
		original.Province = req.Province
	}
	if req.District != "" {
		original.District = req.District
	}
	if req.Village != "" {
		original.Village = req.Village
	}
	if req.Address != "" {
		original.Address = req.Address
	}
	if req.BranchCode != "" {
		original.BranchCode = req.BranchCode
	}
	if req.Email != "" {
		original.Email = req.Email
	}
	if req.WhatsApp != "" {
		original.WhatsApp = req.WhatsApp
	}
	if req.AvatarURL != "" {
		original.AvatarURL = req.AvatarURL
	}
	if req.Addresses != nil {
		original.Addresses = req.Addresses
	}
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

	// Populate Tier discount and perks
	tiers, err := GetTiersFromDB()
	if err == nil {
		for _, t := range tiers {
			if strings.EqualFold(t.ID, original.Tier) {
				original.DiscountPercent = t.DiscountPercent
				original.Perks = t.Perks
				break
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": original})
}
