package spoilage

import (
	"log"
	"net/http"
	"sync"
	"time"

	"backend/db"

	"github.com/gin-gonic/gin"
)

type SpoilageLog struct {
	ID          string    `json:"id"`
	OrderID     string    `json:"orderId,omitempty"`
	MachineID   string    `json:"machineId,omitempty"`
	MaterialID  string    `json:"materialId,omitempty"`
	PaperSku    string    `json:"paperSku,omitempty"`
	SpoilageQty float64   `json:"spoilageQty"`
	Unit        string    `json:"unit"`
	Reason      string    `json:"reason"`
	CostImpact  float64   `json:"costImpact"`
	CreatedAt   time.Time `json:"createdAt"`
}

var (
	spoilageStore = make(map[string]SpoilageLog)
	storeMutex    sync.RWMutex
)

// HandleGetSpoilageLogs fetches all spoilage logs
func HandleGetSpoilageLogs(c *gin.Context) {
	if db.DB != nil {
		logs, err := getSpoilageLogsFromDB()
		if err == nil && len(logs) > 0 {
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": logs})
			return
		}
	}

	storeMutex.RLock()
	defer storeMutex.RUnlock()

	list := make([]SpoilageLog, 0, len(spoilageStore))
	for _, item := range spoilageStore {
		list = append(list, item)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
}

// HandleCreateSpoilageLog records a new spoilage entry
func HandleCreateSpoilageLog(c *gin.Context) {
	var item SpoilageLog
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if item.ID == "" {
		item.ID = "spoil-" + time.Now().Format("150405")
	}
	item.CreatedAt = time.Now()

	if db.DB != nil {
		err := saveSpoilageLogToDB(item)
		if err != nil {
			log.Printf("[DB ERROR] Failed to save spoilage log: %v", err)
		}
	}

	storeMutex.Lock()
	spoilageStore[item.ID] = item
	storeMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": item})
}

func getSpoilageLogsFromDB() ([]SpoilageLog, error) {
	query := `
		SELECT id, COALESCE(order_id, ''), COALESCE(machine_id, ''), COALESCE(material_id, ''),
		       COALESCE(paper_sku, ''), spoilage_qty, COALESCE(unit, 'Sheet'), COALESCE(reason, ''),
		       cost_impact, created_at
		FROM spoilage_logs
		ORDER BY created_at DESC
	`
	rows, err := db.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []SpoilageLog
	for rows.Next() {
		var item SpoilageLog
		err := rows.Scan(
			&item.ID, &item.OrderID, &item.MachineID, &item.MaterialID,
			&item.PaperSku, &item.SpoilageQty, &item.Unit, &item.Reason,
			&item.CostImpact, &item.CreatedAt,
		)
		if err != nil {
			continue
		}
		list = append(list, item)
	}

	return list, nil
}

func saveSpoilageLogToDB(item SpoilageLog) error {
	query := `
		INSERT INTO spoilage_logs (id, order_id, machine_id, material_id, paper_sku, spoilage_qty, unit, reason, cost_impact, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
		ON CONFLICT (id) DO UPDATE SET
			spoilage_qty = EXCLUDED.spoilage_qty,
			reason = EXCLUDED.reason,
			cost_impact = EXCLUDED.cost_impact
	`
	unit := item.Unit
	if unit == "" {
		unit = "Sheet"
	}
	_, err := db.DB.Exec(query, item.ID, item.OrderID, item.MachineID, item.MaterialID, item.PaperSku, item.SpoilageQty, unit, item.Reason, item.CostImpact)
	return err
}
