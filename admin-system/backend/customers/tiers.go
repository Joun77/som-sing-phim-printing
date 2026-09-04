package customers

import (
	"net/http"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

// Default fallback VIP tiers
var defaultTiers = []TierDTO{
	{
		ID:              "STANDARD",
		NameLo:          "ສະມາຊິກທົ່ວໄປ (Standard Member)",
		NameEn:          "Standard Member",
		DiscountPercent: 0.0,
		MinSpendLAK:     0.0,
		MinOrders:       0,
		BadgeColor:      "slate",
		Perks: []string{
			"ສັ່ງພິມຊ້ຳ 1 ຄລິກ (1-Click Re-order)",
			"ບັນທຶກທີ່ຢູ່ຈັດສົ່ງ ແລະ ສາຂາຂົນສົ່ງອັດຕະໂນມັດ",
			"ກວດໄຟລ໌ Digital Proof ມາດຕະຖານ",
			"ຕິດຕາມສະຖານະງານພິມ Real-time",
		},
		SortOrder: 1,
		IsActive:  true,
	},
	{
		ID:              "SILVER",
		NameLo:          "ຊິລເວີ VIP (Silver Tier)",
		NameEn:          "Silver VIP",
		DiscountPercent: 5.0,
		MinSpendLAK:     3000000.0,
		MinOrders:       3,
		BadgeColor:      "cyan",
		Perks: []string{
			"ສ່ວນຫຼຸດພິເສດ 5% ທຸກງານພິມ",
			"ກວດໄຟລ໌ Proof ດ່ວນພາຍໃນ 2 ຊົ່ວໂມງ",
			"ຄັງເກັບໄຟລ໌ Artwork ສ່ວນຕົວ (Cloud Vault)",
			"ສັ່ງພິມຊ້ຳ 1 ຄລິກ",
		},
		SortOrder: 2,
		IsActive:  true,
	},
	{
		ID:              "GOLD",
		NameLo:          "ໂກລ VIP (Gold Tier)",
		NameEn:          "Gold VIP",
		DiscountPercent: 10.0,
		MinSpendLAK:     10000000.0,
		MinOrders:       10,
		BadgeColor:      "amber",
		Perks: []string{
			"ສ່ວນຫຼຸດພິເສດ 10% ທຸກງານພິມ",
			"ລຳດັບຄິວຜະລິດດ່ວນ Fast-Track 24 ຊມ.",
			"ຜູ້ດູແລງານພິມສ່ວນຕົວ VIP Concierge",
			"ຟຣີ ຄ່າຈັດສົ່ງໃນນະຄອນຫຼວງວຽງຈັນ (ຍອດ 500,000 ₭ ຂຶ້ນໄປ)",
		},
		SortOrder: 3,
		IsActive:  true,
	},
	{
		ID:              "PLATINUM",
		NameLo:          "ແພລຕິນໍາ VIP (Platinum Corporate)",
		NameEn:          "Platinum Corporate",
		DiscountPercent: 15.0,
		MinSpendLAK:     25000000.0,
		MinOrders:       25,
		BadgeColor:      "purple",
		Perks: []string{
			"ສ່ວນຫຼຸດສູງສຸດ 15% ທຸກງານພິມ",
			"ສິດທິເຄຣດິດ/ມັດຈຳພິເສດ B2B Partner",
			"ພິມຕົວຢ່າງສີຈິງ (Hard Proof) ຟຣີ",
			"ຄິວຜະລິດດ່ວນພິເສດ Ultra Fast-Track",
		},
		SortOrder: 4,
		IsActive:  true,
	},
}

// HandlePublicCustomerTiers returns dynamic VIP tiers and discounts
func HandlePublicCustomerTiers(c *gin.Context) {
	if db.DB == nil {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   defaultTiers,
		})
		return
	}

	tiers, err := GetTiersFromDB()
	if err != nil || len(tiers) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   defaultTiers,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": tiers})
}

// GetTiersFromDB loads active VIP tiers from the database
func GetTiersFromDB() ([]TierDTO, error) {
	if db.DB == nil {
		return defaultTiers, nil
	}

	rows, err := db.DB.Query(`
		SELECT id, name_lo, name_en, discount_percent, min_spend_lak, min_orders, badge_color, perks, sort_order, is_active
		FROM customer_vip_tiers
		WHERE is_active = TRUE
		ORDER BY sort_order ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tiers []TierDTO
	for rows.Next() {
		var t TierDTO
		var perks pq.StringArray
		if err := rows.Scan(&t.ID, &t.NameLo, &t.NameEn, &t.DiscountPercent, &t.MinSpendLAK, &t.MinOrders, &t.BadgeColor, &perks, &t.SortOrder, &t.IsActive); err == nil {
			t.Perks = []string(perks)
			tiers = append(tiers, t)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return tiers, nil
}

// EvaluateCustomerTier calculates which tier a customer qualifies for based on spend and orders
func EvaluateCustomerTier(totalSpent float64, totalOrders int, tiers []TierDTO) string {
	if len(tiers) == 0 {
		tiers = defaultTiers
	}

	// Tiers are sorted ascending by sort_order. Iterate from highest to lowest.
	var qualifiedTier = "STANDARD"
	for i := len(tiers) - 1; i >= 0; i-- {
		t := tiers[i]
		if totalSpent >= t.MinSpendLAK || totalOrders >= t.MinOrders {
			qualifiedTier = t.ID
			break
		}
	}

	return qualifiedTier
}
