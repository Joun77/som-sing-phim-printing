package customers

import (
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"somsing.local/backend/db"
)

// CustomerCategory represents dynamic customer categories / tiers
type CustomerCategory struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Color       string    `json:"color"` // sky, violet, emerald, amber, rose, indigo, etc.
	IsDefault   bool      `json:"isDefault"`
	IsSystem    bool      `json:"isSystem"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

var (
	categoryStore      = make(map[string]CustomerCategory)
	categoryStoreMutex sync.RWMutex
	ensureCategoriesOnce sync.Once
)

var defaultCategories = []CustomerCategory{
	{
		ID:          "RETAIL",
		Name:        "ລູກຄ້າໜ້າຮ້ານ (Walk-in)",
		Description: "ລູກຄ້າທົ່ວໄປທີ່ມາຕິດຕໍ່ໜ້າຮ້ານ",
		Color:       "sky",
		IsDefault:   true,
		IsSystem:    true,
	},
	{
		ID:          "ONLINE",
		Name:        "ລູກຄ້າຊ່ອງທາງອອນລາຍ (Online)",
		Description: "ລູກຄ້າທີ່ສັ່ງຊື້ຜ່ານ Facebook, Line, WhatsApp, Website",
		Color:       "violet",
		IsDefault:   false,
		IsSystem:    true,
	},
	{
		ID:          "CORPORATE",
		Name:        "ລູກຄ້າອົງກອນ / ບໍລິສັດ (Corporate)",
		Description: "ບໍລິສັດ, ອົງການຈັດຕັ້ງ, ໂຮງຮຽນ ຫຼື ໜ່ວຍງານລັດ",
		Color:       "emerald",
		IsDefault:   false,
		IsSystem:    true,
	},
	{
		ID:          "CONTRACT_PARTNER",
		Name:        "ລູກຄ້າຄູ່ສັນຍາ (Contract Partner)",
		Description: "ຄູ່ຄ້າທີ່ມີສັນຍາຮ່ວມມືພິເສດ ຫຼື MOU",
		Color:       "amber",
		IsDefault:   false,
		IsSystem:    true,
	},
}

func init() {
	categoryStoreMutex.Lock()
	for _, cat := range defaultCategories {
		cat.CreatedAt = time.Now()
		cat.UpdatedAt = time.Now()
		categoryStore[cat.ID] = cat
	}
	categoryStoreMutex.Unlock()
}

func EnsureCustomerCategoriesTable() {
	ensureCategoriesOnce.Do(func() {
		if db.DB != nil {
			query := `
				CREATE TABLE IF NOT EXISTS customer_categories (
					id VARCHAR(50) PRIMARY KEY,
					name VARCHAR(150) NOT NULL,
					description TEXT DEFAULT '',
					color VARCHAR(50) DEFAULT 'sky',
					is_default BOOLEAN DEFAULT FALSE,
					is_system BOOLEAN DEFAULT FALSE,
					created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
				);
			`
			if _, err := db.DB.Exec(query); err != nil {
				log.Printf("[DB ERROR] Creating customer_categories table: %v", err)
			}

			// Seed defaults
			for _, cat := range defaultCategories {
				_, _ = db.DB.Exec(`
					INSERT INTO customer_categories (id, name, description, color, is_default, is_system)
					VALUES ($1, $2, $3, $4, $5, $6)
					ON CONFLICT (id) DO NOTHING;
				`, cat.ID, cat.Name, cat.Description, cat.Color, cat.IsDefault, cat.IsSystem)
			}
		}
	})
}

func GetCategoriesFromDB() ([]CustomerCategory, error) {
	EnsureCustomerCategoriesTable()
	if db.DB == nil {
		categoryStoreMutex.RLock()
		defer categoryStoreMutex.RUnlock()
		var list []CustomerCategory
		for _, cat := range categoryStore {
			list = append(list, cat)
		}
		return list, nil
	}

	rows, err := db.DB.Query(`
		SELECT id, name, COALESCE(description, ''), COALESCE(color, 'sky'),
		       is_default, is_system, created_at, updated_at
		FROM customer_categories
		ORDER BY is_system DESC, created_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []CustomerCategory
	for rows.Next() {
		var cat CustomerCategory
		if err := rows.Scan(
			&cat.ID, &cat.Name, &cat.Description, &cat.Color,
			&cat.IsDefault, &cat.IsSystem, &cat.CreatedAt, &cat.UpdatedAt,
		); err != nil {
			log.Printf("[DB ERROR] Scan customer category failed: %v", err)
			continue
		}
		list = append(list, cat)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return list, nil
}

// HandleGetCustomerCategories returns all customer categories
func HandleGetCustomerCategories(c *gin.Context) {
	list, err := GetCategoriesFromDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customer categories: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
}

// HandleCreateCustomerCategory creates a new customer category
func HandleCreateCustomerCategory(c *gin.Context) {
	var input struct {
		ID          string `json:"id"`
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Color       string `json:"color"`
		IsDefault   bool   `json:"isDefault"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required: " + err.Error()})
		return
	}

	id := strings.TrimSpace(input.ID)
	if id == "" {
		// Generate ID based on clean name or timestamp
		cleanName := strings.ToUpper(strings.ReplaceAll(input.Name, " ", "_"))
		if len(cleanName) > 20 {
			cleanName = cleanName[:20]
		}
		id = "CAT_" + time.Now().Format("150405")
	} else {
		id = strings.ToUpper(id)
	}

	color := input.Color
	if color == "" {
		color = "sky"
	}

	cat := CustomerCategory{
		ID:          id,
		Name:        input.Name,
		Description: input.Description,
		Color:       color,
		IsDefault:   input.IsDefault,
		IsSystem:    false,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	EnsureCustomerCategoriesTable()
	if db.DB != nil {
		_, err := db.DB.Exec(`
			INSERT INTO customer_categories (id, name, description, color, is_default, is_system, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				description = EXCLUDED.description,
				color = EXCLUDED.color,
				is_default = EXCLUDED.is_default,
				updated_at = EXCLUDED.updated_at;
		`, cat.ID, cat.Name, cat.Description, cat.Color, cat.IsDefault, cat.IsSystem, cat.CreatedAt, cat.UpdatedAt)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save category: " + err.Error()})
			return
		}
	}

	categoryStoreMutex.Lock()
	categoryStore[cat.ID] = cat
	categoryStoreMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": cat})
}

// HandleUpdateCustomerCategory updates existing category
func HandleUpdateCustomerCategory(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Color       string `json:"color"`
		IsDefault   bool   `json:"isDefault"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	EnsureCustomerCategoriesTable()
	now := time.Now()

	if db.DB != nil {
		res, err := db.DB.Exec(`
			UPDATE customer_categories
			SET name = $1, description = $2, color = $3, is_default = $4, updated_at = $5
			WHERE id = $6
		`, input.Name, input.Description, input.Color, input.IsDefault, now, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category: " + err.Error()})
			return
		}
		rowsAff, _ := res.RowsAffected()
		if rowsAff == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
			return
		}
	}

	categoryStoreMutex.Lock()
	if cat, ok := categoryStore[id]; ok {
		cat.Name = input.Name
		cat.Description = input.Description
		cat.Color = input.Color
		cat.IsDefault = input.IsDefault
		cat.UpdatedAt = now
		categoryStore[id] = cat
	}
	categoryStoreMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Category updated successfully"})
}

// HandleDeleteCustomerCategory deletes non-system categories with no associated customers
func HandleDeleteCustomerCategory(c *gin.Context) {
	id := c.Param("id")

	EnsureCustomerCategoriesTable()

	// 1. Check if category is system core
	for _, sysCat := range defaultCategories {
		if strings.EqualFold(sysCat.ID, id) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "CANNOT_DELETE_SYSTEM_CATEGORY",
				"message": "ໝວດໝູ່ຫຼັກຂອງລະບົບບໍ່ສາມາດລຶບໄດ້ (System Core Category cannot be deleted)",
			})
			return
		}
	}

	// 2. Check if any customers use this tier
	if db.DB != nil {
		var inUseCount int
		err := db.DB.QueryRow("SELECT COUNT(*) FROM customers WHERE tier = $1", id).Scan(&inUseCount)
		if err == nil && inUseCount > 0 {
			c.JSON(http.StatusConflict, gin.H{
				"error": "CATEGORY_IN_USE",
				"message": "ບໍ່ສາມາດລຶບໄດ້ ເນື່ອງຈາກມີລູກຄ້າທີ່ໃຊ້ໝວດໝູ່ນີ້ຢູ່ (Cannot delete category currently assigned to customers)",
				"customerCount": inUseCount,
			})
			return
		}

		_, err = db.DB.Exec("DELETE FROM customer_categories WHERE id = $1 AND is_system = FALSE", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category: " + err.Error()})
			return
		}
	} else {
		// Memory check
		storeMutex.RLock()
		inUse := false
		for _, cust := range customerStore {
			if cust.Tier == id {
				inUse = true
				break
			}
		}
		storeMutex.RUnlock()

		if inUse {
			c.JSON(http.StatusConflict, gin.H{
				"error": "CATEGORY_IN_USE",
				"message": "ບໍ່ສາມາດລຶບໄດ້ ເນື່ອງຈາກມີລູກຄ້າທີ່ໃຊ້ໝວດໝູ່ນີ້ຢູ່",
			})
			return
		}
	}

	categoryStoreMutex.Lock()
	delete(categoryStore, id)
	categoryStoreMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Category deleted successfully"})
}
