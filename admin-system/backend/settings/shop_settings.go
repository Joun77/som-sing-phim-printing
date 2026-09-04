package settings

import (
	"encoding/json"
	"net/http"
	"os"
	"sync"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

type ShopInfo struct {
	ShopName       string `json:"shop_name"`
	Phone          string `json:"phone"`
	WhatsAppNumber string `json:"whatsapp_number"`
	Email          string `json:"email"`
	Address        string `json:"address"`
	FacebookUrl    string `json:"facebook_url"`
	WorkingHours   string `json:"working_hours"`
}

var (
	shopInfoLock sync.RWMutex
	currentShopInfo = ShopInfo{
		ShopName:       "ຮ້ານ ສົມສິ່ງພິມ (Som Sing Phim Printing)",
		Phone:          "+856 20 5555 8888",
		WhatsAppNumber: "8562055558888",
		Email:          "som.sing.phim@gmail.com",
		Address:        "ນະຄອນຫຼວງວຽງຈັນ (Vientiane Capital, Lao PDR)",
		FacebookUrl:    "https://facebook.com/somsingphim",
		WorkingHours:   "ຈັນ - ເສົາ: 08:00 - 18:00",
	}
)

const shopSettingsFile = "./shop_settings.json"

func init() {
	loadShopInfo()
}

func loadShopInfo() {
	shopInfoLock.Lock()
	defer shopInfoLock.Unlock()

	data, err := os.ReadFile(shopSettingsFile)
	if err == nil {
		_ = json.Unmarshal(data, &currentShopInfo)
	}
}

func saveShopInfoToFile(info ShopInfo) {
	data, err := json.MarshalIndent(info, "", "  ")
	if err == nil {
		_ = os.WriteFile(shopSettingsFile, data, 0644)
	}
}

// HandleGetShopInfo returns shop contact and location info (Public & Admin)
func HandleGetShopInfo(c *gin.Context) {
	shopInfoLock.RLock()
	defer shopInfoLock.RUnlock()

	if db.DB != nil {
		var infoJSON string
		err := db.DB.QueryRow(`
			SELECT spec_groups::text 
			FROM public_products 
			WHERE slug = 'system-shop-profile'
		`).Scan(&infoJSON)
		if err == nil && infoJSON != "" {
			var dbInfo ShopInfo
			if err := json.Unmarshal([]byte(infoJSON), &dbInfo); err == nil {
				c.JSON(http.StatusOK, gin.H{"status": "success", "data": dbInfo})
				return
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": currentShopInfo})
}

// HandleUpdateShopInfo saves shop profile settings from Admin
func HandleUpdateShopInfo(c *gin.Context) {
	var req ShopInfo
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}

	shopInfoLock.Lock()
	if req.ShopName != "" {
		currentShopInfo.ShopName = req.ShopName
	}
	if req.Phone != "" {
		currentShopInfo.Phone = req.Phone
	}
	if req.WhatsAppNumber != "" {
		currentShopInfo.WhatsAppNumber = req.WhatsAppNumber
	}
	if req.Email != "" {
		currentShopInfo.Email = req.Email
	}
	if req.Address != "" {
		currentShopInfo.Address = req.Address
	}
	if req.FacebookUrl != "" {
		currentShopInfo.FacebookUrl = req.FacebookUrl
	}
	if req.WorkingHours != "" {
		currentShopInfo.WorkingHours = req.WorkingHours
	}
	savedInfo := currentShopInfo
	shopInfoLock.Unlock()

	saveShopInfoToFile(savedInfo)

	if db.DB != nil {
		infoBytes, _ := json.Marshal(savedInfo)
		_, _ = db.DB.Exec(`
			INSERT INTO public_products (id, slug, name, category, spec_groups, created_at, updated_at)
			VALUES (99999, 'system-shop-profile', 'System Shop Profile', 'System', $1::jsonb, NOW(), NOW())
			ON CONFLICT (slug) DO UPDATE SET
				spec_groups = EXCLUDED.spec_groups,
				updated_at = NOW()
		`, string(infoBytes))
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Shop settings updated successfully",
		"data":    savedInfo,
	})
}
