package customers

import (
	"log"
	"sync"

	"somsing.local/backend/db"
)

var (
	customerStore = make(map[string]Customer)
	storeMutex    sync.RWMutex
	ensureColumnsOnce sync.Once
)

func ensureCustomerColumns() {
	ensureColumnsOnce.Do(func() {
		if db.DB != nil {
			_, _ = db.DB.Exec(`
				ALTER TABLE customers 
				  ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'STANDARD',
				  ADD COLUMN IF NOT EXISTS preferred_courier VARCHAR(100),
				  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'CUSTOMER_SERVICE',
				  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'PHONE',
				  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
				  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
				CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);
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
		       COALESCE(tier, 'STANDARD'), COALESCE(preferred_courier, ''),
		       COALESCE(source, 'CUSTOMER_SERVICE'), COALESCE(auth_provider, 'PHONE'),
		       COALESCE(password_hash, ''), last_login_at,
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
			&cust.Source, &cust.AuthProvider,
			&cust.PasswordHash, &cust.LastLoginAt,
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
		       COALESCE(tier, 'STANDARD'), COALESCE(preferred_courier, ''),
		       COALESCE(source, 'CUSTOMER_SERVICE'), COALESCE(auth_provider, 'PHONE'),
		       COALESCE(password_hash, ''), last_login_at,
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
		&cust.Source, &cust.AuthProvider,
		&cust.PasswordHash, &cust.LastLoginAt,
		&cust.Notes, &cust.TotalSpentLAK, &cust.TotalOrdersCount,
		&cust.CreatedAt, &cust.UpdatedAt,
	)
	return cust, err
}

func saveCustomerToDB(cust Customer) error {
	ensureCustomerColumns()
	if cust.Tier == "" {
		cust.Tier = "STANDARD"
	}
	if cust.Source == "" {
		cust.Source = "ADMIN_MANUAL"
	}
	if cust.AuthProvider == "" {
		if cust.Source == "CUSTOMER_SERVICE" {
			cust.AuthProvider = "PHONE"
		} else {
			cust.AuthProvider = "MANUAL"
		}
	}

	query := `
		INSERT INTO customers (
			id, name, phone, email, address, credit_limit, payment_terms,
			instagram, line_id, facebook, whatsapp, province, district, village,
			branch_code, tax_id, tier, preferred_courier,
			source, auth_provider, password_hash, last_login_at,
			notes, total_spent_lak, total_orders_count,
			created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW(), NOW())
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
			source = COALESCE(EXCLUDED.source, customers.source),
			auth_provider = COALESCE(EXCLUDED.auth_provider, customers.auth_provider),
			password_hash = CASE WHEN EXCLUDED.password_hash != '' THEN EXCLUDED.password_hash ELSE customers.password_hash END,
			last_login_at = COALESCE(EXCLUDED.last_login_at, customers.last_login_at),
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
		cust.Source, cust.AuthProvider, cust.PasswordHash, cust.LastLoginAt,
		cust.Notes, cust.TotalSpentLAK, cust.TotalOrdersCount,
	)
	return err
}
