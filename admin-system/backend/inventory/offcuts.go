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
	CostPerSheet     float64   `json:"cost_per_sheet"`
	GrammageGsm      int       `json:"grammage_gsm"`
	PaperType        string    `json:"paper_type"`
	PaperSurface     string    `json:"paper_surface"`
	CreatedAt        time.Time `json:"created_at"`
}

var (
	offcutsStore = make(map[string]Offcut)
	storeMutex   sync.RWMutex
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
	if req.CreatedAt.IsZero() {
		req.CreatedAt = time.Now()
	}

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

// HandleUpdateOffcut updates an existing offcut
func HandleUpdateOffcut(c *gin.Context) {
	id := c.Param("id")
	var req Offcut
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offcut input", "details": err.Error()})
		return
	}
	req.ID = id
	if req.CreatedAt.IsZero() {
		req.CreatedAt = time.Now()
	}

	if db.DB != nil {
		err := saveOffcutToDB(req)
		if err != nil {
			log.Printf("[DB ERROR] Failed to update offcut: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update offcut in DB", "details": err.Error()})
			return
		}
	}

	storeMutex.Lock()
	offcutsStore[id] = req
	storeMutex.Unlock()

	c.JSON(http.StatusOK, req)
}

// HandleDeleteOffcut deletes an offcut scrap
func HandleDeleteOffcut(c *gin.Context) {
	id := c.Param("id")

	if db.DB != nil {
		_, err := db.DB.Exec(`DELETE FROM offcuts WHERE id = $1`, id)
		if err != nil {
			log.Printf("[DB ERROR] Failed to delete offcut: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete offcut from DB", "details": err.Error()})
			return
		}
	}

	storeMutex.Lock()
	delete(offcutsStore, id)
	storeMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Offcut deleted successfully"})
}

func getOffcutsFromDB() ([]Offcut, error) {
	rows, err := db.DB.Query(`
		SELECT id, COALESCE(material_sku, ''), COALESCE(material_name, ''),
		       width_mm, height_mm, quantity, COALESCE(location, 'Main Stock'),
		       COALESCE(cost_per_sheet, 0), COALESCE(grammage_gsm, 0),
		       COALESCE(paper_type, 'Standard'), COALESCE(paper_surface, ''),
		       COALESCE(parent_material_id, ''), created_at
		FROM offcuts ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []Offcut
	for rows.Next() {
		var o Offcut
		var matSku string
		err := rows.Scan(&o.ID, &matSku, &o.Name, &o.WidthMm, &o.LengthMm, &o.Quantity, &o.Location,
			&o.CostPerSheet, &o.GrammageGsm, &o.PaperType, &o.PaperSurface, &o.ParentMaterialID, &o.CreatedAt)
		if err != nil {
			continue
		}
		if o.ParentMaterialID == "" {
			o.ParentMaterialID = matSku
		}
		result = append(result, o)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

func saveOffcutToDB(o Offcut) error {
	parentMat := o.ParentMaterialID
	if parentMat == "" {
		parentMat = "Standard"
	}
	if o.CreatedAt.IsZero() {
		o.CreatedAt = time.Now()
	}
	_, err := db.DB.Exec(`
		INSERT INTO offcuts (id, material_sku, material_name, width_mm, height_mm, quantity, location, cost_per_sheet, grammage_gsm, paper_type, paper_surface, parent_material_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		ON CONFLICT (id) DO UPDATE SET
			material_sku = EXCLUDED.material_sku,
			material_name = EXCLUDED.material_name,
			width_mm = EXCLUDED.width_mm,
			height_mm = EXCLUDED.height_mm,
			quantity = EXCLUDED.quantity,
			location = EXCLUDED.location,
			cost_per_sheet = EXCLUDED.cost_per_sheet,
			grammage_gsm = EXCLUDED.grammage_gsm,
			paper_type = EXCLUDED.paper_type,
			paper_surface = EXCLUDED.paper_surface,
			parent_material_id = EXCLUDED.parent_material_id`,
		o.ID, parentMat, o.Name, o.WidthMm, o.LengthMm, int(o.Quantity), o.Location,
		o.CostPerSheet, o.GrammageGsm, o.PaperType, o.PaperSurface, parentMat, o.CreatedAt)
	return err
}
