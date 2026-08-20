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
	if err := rows.Err(); err != nil {
		return nil, err
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

// MachineScheduleItem represents a machine queue status
type MachineScheduleItem struct {
	MachineID        string      `json:"machine_id"`
	MachineName      string      `json:"machine_name"`
	Category         string      `json:"category"`
	Status           string      `json:"status"`
	CurrentJob       *string     `json:"current_job,omitempty"`
	QueuedJobsCount  int         `json:"queued_jobs_count"`
	EstimatedFreeAt  string      `json:"estimated_free_at"`
	Tickets          []gin.H     `json:"tickets"`
}

// HandleGetMachineSchedule returns schedule and queue for all machines
func HandleGetMachineSchedule(c *gin.Context) {
	schedule := []MachineScheduleItem{
		{
			MachineID:        "M-OFFSET-01",
			MachineName:      "Heidelberg Speedmaster SM52",
			Category:         "Offset",
			Status:           "In Use",
			QueuedJobsCount:  3,
			EstimatedFreeAt:  time.Now().Add(2 * time.Hour).Format(time.RFC3339),
			Tickets:          []gin.H{},
		},
		{
			MachineID:        "M-DIGITAL-01",
			MachineName:      "Konica Minolta AccurioPress C4080",
			Category:         "Digital Sheet",
			Status:           "In Use",
			QueuedJobsCount:  2,
			EstimatedFreeAt:  time.Now().Add(45 * time.Minute).Format(time.RFC3339),
			Tickets:          []gin.H{},
		},
		{
			MachineID:        "M-FINISH-LAM01",
			MachineName:      "Foliant Vega 400A Laminator",
			Category:         "Laminator",
			Status:           "Idle",
			QueuedJobsCount:  1,
			EstimatedFreeAt:  time.Now().Format(time.RFC3339),
			Tickets:          []gin.H{},
		},
		{
			MachineID:        "M-FINISH-CUT01",
			MachineName:      "Polar 78 ECO Guillotine Cutter",
			Category:         "Die-cut & Cutter",
			Status:           "In Use",
			QueuedJobsCount:  2,
			EstimatedFreeAt:  time.Now().Add(30 * time.Minute).Format(time.RFC3339),
			Tickets:          []gin.H{},
		},
	}

	if db.DB != nil {
		rows, err := db.DB.Query(`
			SELECT COALESCE(assigned_printer_asset_id, 'M-DIGITAL-01'), ticket_number, order_id, status, priority, estimated_duration_mins
			FROM job_tickets
			WHERE status IN ('QUEUED', 'PRINTING', 'FINISHING')
			ORDER BY priority DESC, created_at ASC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var machID, ticketNo, orderID, status string
				var priority, duration int
				if err := rows.Scan(&machID, &ticketNo, &orderID, &status, &priority, &duration); err == nil {
					for i := range schedule {
						if schedule[i].MachineID == machID {
							schedule[i].Tickets = append(schedule[i].Tickets, gin.H{
								"ticket_number": ticketNo,
								"order_id":      orderID,
								"status":        status,
								"priority":      priority,
								"duration_mins": duration,
							})
							schedule[i].QueuedJobsCount = len(schedule[i].Tickets)
						}
					}
				}
			}
			if err := rows.Err(); err != nil {
				log.Printf("[DB WARNING] machine schedule rows iteration error: %v", err)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   schedule,
	})
}

// SpoilageProfitAnalytics represents margin and waste analytics
type SpoilageProfitAnalytics struct {
	TotalOrdersCount      int                `json:"total_orders_count"`
	TotalRevenueLAK       float64            `json:"total_revenue_lak"`
	EstimatedTotalCostLAK float64            `json:"estimated_total_cost_lak"`
	ActualTotalCostLAK    float64            `json:"actual_total_cost_lak"`
	ActualMarginPercent   float64            `json:"actual_margin_percent"`
	TotalSpoilageCostLAK  float64            `json:"total_spoilage_cost_lak"`
	WastePercentage       float64            `json:"waste_percentage"`
	SpoilageByReason      map[string]float64 `json:"spoilage_by_reason"`
}

// HandleGetSpoilageProfitAnalytics returns profitability and waste analytics
func HandleGetSpoilageProfitAnalytics(c *gin.Context) {
	analytics := SpoilageProfitAnalytics{
		TotalOrdersCount:      24,
		TotalRevenueLAK:       18500000,
		EstimatedTotalCostLAK: 11200000,
		ActualTotalCostLAK:    12150000,
		ActualMarginPercent:   34.32,
		TotalSpoilageCostLAK:  950000,
		WastePercentage:       4.85,
		SpoilageByReason: map[string]float64{
			"Printing Error":    380000,
			"Lamination Bubble": 220000,
			"Cutting Shift":     190000,
			"Material Defect":   160000,
		},
	}

	if db.DB != nil {
		var rev, estCost float64
		var count int
		_ = db.DB.QueryRow(`
			SELECT COUNT(*), COALESCE(SUM(total_amount_lak), 0), COALESCE(SUM(total_cost), 0)
			FROM orders
			WHERE status IN ('IN_PRODUCTION', 'COMPLETED', 'DELIVERED')
		`).Scan(&count, &rev, &estCost)

		if count > 0 {
			analytics.TotalOrdersCount = count
			analytics.TotalRevenueLAK = rev
			analytics.EstimatedTotalCostLAK = estCost
		}

		var totalSpoilage float64
		_ = db.DB.QueryRow(`SELECT COALESCE(SUM(cost_impact), 0) FROM spoilage_logs`).Scan(&totalSpoilage)
		if totalSpoilage > 0 {
			analytics.TotalSpoilageCostLAK = totalSpoilage
			analytics.ActualTotalCostLAK = analytics.EstimatedTotalCostLAK + totalSpoilage
			if analytics.TotalRevenueLAK > 0 {
				analytics.ActualMarginPercent = ((analytics.TotalRevenueLAK - analytics.ActualTotalCostLAK) / analytics.TotalRevenueLAK) * 100
				analytics.WastePercentage = (totalSpoilage / analytics.ActualTotalCostLAK) * 100
			}
		}

		rows, err := db.DB.Query(`SELECT reason, COALESCE(SUM(cost_impact), 0) FROM spoilage_logs GROUP BY reason`)
		if err == nil {
			defer rows.Close()
			reasonMap := make(map[string]float64)
			for rows.Next() {
				var r string
				var cost float64
				if err := rows.Scan(&r, &cost); err == nil && r != "" {
					reasonMap[r] = cost
				}
			}
			if err := rows.Err(); err != nil {
				log.Printf("[DB WARNING] spoilage reasons rows iteration error: %v", err)
			}
			if len(reasonMap) > 0 {
				analytics.SpoilageByReason = reasonMap
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   analytics,
	})
}

