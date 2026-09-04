package inventory

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

type MachineDowntimeLog struct {
	ID              string `json:"id"`
	MachineID       string `json:"machineId"`
	MachineName     string `json:"machineName"`
	Status          string `json:"status"` // 'DOWNTIME', 'MAINTENANCE', 'SETUP'
	Reason          string `json:"reason"`
	TechnicianID    string `json:"technicianId,omitempty"`
	StartTime       string `json:"startTime"`
	EndTime         string `json:"endTime,omitempty"`
	DurationMinutes int    `json:"durationMinutes,omitempty"`
	CreatedAt       string `json:"createdAt"`
}

var (
	downtimeStoreMutex  sync.RWMutex
	downtimeMemoryStore = map[string]MachineDowntimeLog{}
)

// HandleGetDowntimeLogs returns machine downtime & maintenance logs
func HandleGetDowntimeLogs(c *gin.Context) {
	machineID := c.Query("machine_id")

	if db.DB != nil {
		query := `SELECT id, machine_id, machine_name, status, COALESCE(reason, ''), COALESCE(technician_id, ''), start_time, end_time, duration_minutes, created_at FROM machine_downtime_logs`
		var rows *sql.Rows
		var err error

		if machineID != "" {
			query += ` WHERE machine_id = $1 ORDER BY start_time DESC`
			rows, err = db.DB.Query(query, machineID)
		} else {
			query += ` ORDER BY start_time DESC`
			rows, err = db.DB.Query(query)
		}

		if err == nil {
			defer rows.Close()
			var list []MachineDowntimeLog
			for rows.Next() {
				var logItem MachineDowntimeLog
				var startTime, createdAt time.Time
				var endTime sql.NullTime

				err := rows.Scan(&logItem.ID, &logItem.MachineID, &logItem.MachineName, &logItem.Status, &logItem.Reason, &logItem.TechnicianID, &startTime, &endTime, &logItem.DurationMinutes, &createdAt)
				if err != nil {
					continue
				}
				logItem.StartTime = startTime.Format(time.RFC3339)
				if endTime.Valid {
					logItem.EndTime = endTime.Time.Format(time.RFC3339)
				}
				logItem.CreatedAt = createdAt.Format(time.RFC3339)
				list = append(list, logItem)
			}
			if list == nil {
				list = []MachineDowntimeLog{}
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
			return
		}
	}

	downtimeStoreMutex.RLock()
	defer downtimeStoreMutex.RUnlock()

	var result []MachineDowntimeLog
	for _, item := range downtimeMemoryStore {
		if machineID == "" || item.MachineID == machineID {
			result = append(result, item)
		}
	}
	if result == nil {
		result = []MachineDowntimeLog{}
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": result})
}

// HandleCreateDowntimeLog logs machine downtime or maintenance event
func HandleCreateDowntimeLog(c *gin.Context) {
	var item MachineDowntimeLog
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if item.ID == "" {
		item.ID = fmt.Sprintf("DT-%d", time.Now().UnixNano())
	}
	if item.StartTime == "" {
		item.StartTime = time.Now().Format(time.RFC3339)
	}

	if db.DB != nil {
		var endTimeVal interface{} = nil
		if item.EndTime != "" {
			t, err := time.Parse(time.RFC3339, item.EndTime)
			if err == nil {
				endTimeVal = t
			}
		}

		startTimeVal, err := time.Parse(time.RFC3339, item.StartTime)
		if err != nil {
			startTimeVal = time.Now()
		}

		_, execErr := db.DB.Exec(`
			INSERT INTO machine_downtime_logs (id, machine_id, machine_name, status, reason, technician_id, start_time, end_time, duration_minutes, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
			ON CONFLICT (id) DO NOTHING`,
			item.ID, item.MachineID, item.MachineName, item.Status, item.Reason, item.TechnicianID, startTimeVal, endTimeVal, item.DurationMinutes)
		if execErr != nil {
			log.Printf("[DB ERROR] Failed to save downtime log: %v", execErr)
		}
	}

	downtimeStoreMutex.Lock()
	downtimeMemoryStore[item.ID] = item
	downtimeStoreMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": item})
}
