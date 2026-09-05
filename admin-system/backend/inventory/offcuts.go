package inventory

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

type Offcut struct {
	ID               string    `json:"id"`
	ParentMaterialID string    `json:"parent_material_id"`
	Name             string    `json:"name"`
	WidthMm          float64   `json:"width_mm"`
	LengthMm         float64   `json:"length_mm"`
	Quantity         float64   `json:"quantity"`
	Location         string    `json:"location"`
	CreatedAt        time.Time `json:"created_at"`
}

var (
	offcutsStore = make(map[string]Offcut)
	storeMutex   sync.RWMutex
	offcutSeq    int
)

// GetMatchingOffcut searches for available offcut scrap matching material, size and quantity
func GetMatchingOffcut(paperSku, paperName string, jobW, jobH float64, requiredQty int) *Offcut {
	if db.DB != nil {
		offcuts, err := getOffcutsFromDB()
		if err == nil && len(offcuts) > 0 {
			for _, o := range offcuts {
				skuMatch := paperSku == "" || o.ParentMaterialID == paperSku || o.ParentMaterialID == ""
				if skuMatch && o.Quantity >= float64(requiredQty) {
					// Check dimensions with or without rotation
					if (o.WidthMm >= jobW && o.LengthMm >= jobH) || (o.WidthMm >= jobH && o.LengthMm >= jobW) {
						return &o
					}
				}
			}
		}
	}

	storeMutex.RLock()
	defer storeMutex.RUnlock()
	for _, o := range offcutsStore {
		skuMatch := paperSku == "" || o.ParentMaterialID == paperSku
		if skuMatch && o.Quantity >= float64(requiredQty) {
			if (o.WidthMm >= jobW && o.LengthMm >= jobH) || (o.WidthMm >= jobH && o.LengthMm >= jobW) {
				match := o
				return &match
			}
		}
	}
	return nil
}

// RegisterOffcutItem adds an offcut to the in-memory store
func RegisterOffcutItem(o Offcut) {
	storeMutex.Lock()
	defer storeMutex.Unlock()
	offcutsStore[o.ID] = o
}

// ClearOffcutStore clears in-memory offcuts
func ClearOffcutStore() {
	storeMutex.Lock()
	defer storeMutex.Unlock()
	offcutsStore = make(map[string]Offcut)
}

// HandleGetOffcuts returns the list of offcut scraps
func HandleGetOffcuts(c *gin.Context) {
	if db.DB != nil {
		offcuts, err := getOffcutsFromDB()
		if err == nil {
			if offcuts == nil {
				offcuts = []Offcut{}
			}
			c.JSON(http.StatusOK, offcuts)
			return
		}
	}

	storeMutex.RLock()
	defer storeMutex.RUnlock()

	list := make([]Offcut, 0, len(offcutsStore))
	for _, o := range offcutsStore {
		list = append(list, o)
	}

	c.JSON(http.StatusOK, list)
}

// HandleRegisterOffcut creates an offcut entry
func HandleRegisterOffcut(c *gin.Context) {
	var req Offcut
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offcut input", "details": err.Error()})
		return
	}

	if req.ID == "" {
		req.ID = fmt.Sprintf("OFF-%d", time.Now().UnixNano())
	}
	if req.Location == "" {
		req.Location = "Main Stock"
	}
	req.CreatedAt = time.Now()

	if db.DB != nil {
		err := saveOffcutToDB(req)
		if err != nil {
			log.Printf("[DB ERROR] Failed to save offcut: %v", err)
		}
	}

	storeMutex.Lock()
	offcutsStore[req.ID] = req
	storeMutex.Unlock()

	c.JSON(http.StatusCreated, req)
}

func getOffcutsFromDB() ([]Offcut, error) {
	rows, err := db.DB.Query(`SELECT id, material_sku, material_name, width_mm, height_mm, quantity, location, created_at FROM offcuts`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []Offcut
	for rows.Next() {
		var o Offcut
		err := rows.Scan(&o.ID, &o.ParentMaterialID, &o.Name, &o.WidthMm, &o.LengthMm, &o.Quantity, &o.Location, &o.CreatedAt)
		if err != nil {
			continue
		}
		result = append(result, o)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

func saveOffcutToDB(o Offcut) error {
	_, err := db.DB.Exec(`
		INSERT INTO offcuts (id, material_sku, material_name, width_mm, height_mm, quantity, location, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (id) DO UPDATE SET
			material_sku = EXCLUDED.material_sku,
			material_name = EXCLUDED.material_name,
			width_mm = EXCLUDED.width_mm,
			height_mm = EXCLUDED.height_mm,
			quantity = EXCLUDED.quantity,
			location = EXCLUDED.location`,
		o.ID, o.ParentMaterialID, o.Name, o.WidthMm, o.LengthMm, int(o.Quantity), o.Location, o.CreatedAt)
	return err
}
