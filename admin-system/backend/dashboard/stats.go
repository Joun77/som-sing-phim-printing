package dashboard

import (
	"net/http"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

// DashboardStatsResponse represents real-time KPI metrics aggregated from PostgreSQL
type DashboardStatsResponse struct {
	Period                  string  `json:"period"`
	TotalRevenue            float64 `json:"total_revenue"`
	TotalMaterialCost       float64 `json:"total_material_cost"`
	TotalMachineOverheadCost float64 `json:"total_machine_overhead_cost"`
	NetProfit               float64 `json:"net_profit"`
	NetProfitMarginPercent  float64 `json:"net_profit_margin_percent"`
	ActiveProductionJobs    int     `json:"active_production_jobs"`
	CompletedOrdersCount    int     `json:"completed_orders_count"`
	TotalOrdersCount        int     `json:"total_orders_count"`
	SpoilageRatePercent     float64 `json:"spoilage_rate_percent"`
	TotalSpoilageSheets     int     `json:"total_spoilage_sheets"`
	LowStockAlertsCount     int     `json:"low_stock_alerts_count"`
	UpdatedAt               string  `json:"updated_at"`
}

// DailyRevenuePoint represents one day in revenue trend chart
type DailyRevenuePoint struct {
	Date         string  `json:"date"`
	DisplayDate  string  `json:"display_date"`
	Revenue      float64 `json:"revenue"`
	MaterialCost float64 `json:"material_cost"`
	GrossProfit  float64 `json:"gross_profit"`
	OrdersCount  int     `json:"orders_count"`
}

// DailySpoilagePoint represents one day in spoilage timeline chart
type DailySpoilagePoint struct {
	Date             string `json:"date"`
	DisplayDate      string `json:"display_date"`
	TotalWasted      int    `json:"total_wasted"`
	PlateErrorCount  int    `json:"plate_error_count"`
	OperatorMistakes int    `json:"operator_mistakes"`
	MachineJamCount  int    `json:"machine_jam_count"`
	PaperFlawCount   int    `json:"paper_flaw_count"`
	OtherCount       int    `json:"other_count"`
}

// HandleGetDashboardStats calculates real KPI metrics from PostgreSQL
func HandleGetDashboardStats(c *gin.Context) {
	period := c.DefaultQuery("period", "month") // "day", "week", "month", "quarter", "year", "all"

	stats := DashboardStatsResponse{
		Period:    period,
		UpdatedAt: time.Now().Format(time.RFC3339),
	}

	if db.DB != nil {
		// 1. Calculate date interval
		intervalCondition := "created_at >= NOW() - INTERVAL '30 days'"
		switch period {
		case "today", "day":
			intervalCondition = "created_at >= CURRENT_DATE"
		case "week":
			intervalCondition = "created_at >= NOW() - INTERVAL '7 days'"
		case "quarter":
			intervalCondition = "created_at >= NOW() - INTERVAL '90 days'"
		case "year":
			intervalCondition = "created_at >= NOW() - INTERVAL '365 days'"
		case "all":
			intervalCondition = "1=1"
		}

		// 2. Revenue & Orders
		var totalRevenue, totalMachineCost float64
		var completedCount, totalCount int
		queryOrders := `
			SELECT 
				COALESCE(SUM(CASE WHEN status IN ('COMPLETED', 'DELIVERED', 'Paid', 'Completed') THEN COALESCE(total_price, total_amount_lak, 0) ELSE 0 END), 0) AS total_revenue,
				COALESCE(SUM(COALESCE(total_cost, 0)), 0) AS total_cost,
				COUNT(CASE WHEN status IN ('COMPLETED', 'DELIVERED', 'Completed') THEN 1 END) AS completed_orders,
				COUNT(*) AS total_orders
			FROM orders
			WHERE ` + intervalCondition
		_ = db.DB.QueryRow(queryOrders).Scan(&totalRevenue, &totalMachineCost, &completedCount, &totalCount)

		stats.TotalRevenue = totalRevenue
		stats.CompletedOrdersCount = completedCount
		stats.TotalOrdersCount = totalCount

		// 3. Material Deductions from stock_movements
		var totalMaterialCost float64
		queryMaterial := `
			SELECT COALESCE(SUM(quantity * unit_cost), 0)
			FROM stock_movements
			WHERE movement_type = 'PRODUCTION_DEDUCTION'
			  AND ` + intervalCondition
		_ = db.DB.QueryRow(queryMaterial).Scan(&totalMaterialCost)
		stats.TotalMaterialCost = totalMaterialCost
		stats.TotalMachineOverheadCost = totalMachineCost

		totalCosts := totalMaterialCost + totalMachineCost
		stats.NetProfit = totalRevenue - totalCosts
		if totalRevenue > 0 {
			stats.NetProfitMarginPercent = ((totalRevenue - totalCosts) / totalRevenue) * 100.0
		}

		// 4. Active Production Jobs
		var activeJobs int
		queryActive := `
			SELECT COUNT(*) 
			FROM orders 
			WHERE status IN ('IN_PRODUCTION', 'READY_TO_PRINT', 'POST_PRESS', 'PRINTING', 'FINISHING')
		`
		_ = db.DB.QueryRow(queryActive).Scan(&activeJobs)
		stats.ActiveProductionJobs = activeJobs

		// 5. Spoilage Stats
		var totalSpoilageSheets int
		querySpoilage := `
			SELECT COALESCE(SUM(quantity), 0)
			FROM spoilage_logs
			WHERE ` + intervalCondition
		_ = db.DB.QueryRow(querySpoilage).Scan(&totalSpoilageSheets)
		stats.TotalSpoilageSheets = totalSpoilageSheets

		// Calculate Spoilage Rate % (spoilage / total sheets consumed)
		var totalSheetsConsumed float64
		queryConsumed := `
			SELECT COALESCE(SUM(quantity), 0)
			FROM stock_movements
			WHERE movement_type = 'PRODUCTION_DEDUCTION'
			  AND ` + intervalCondition
		_ = db.DB.QueryRow(queryConsumed).Scan(&totalSheetsConsumed)

		if totalSheetsConsumed > 0 {
			stats.SpoilageRatePercent = (float64(totalSpoilageSheets) / totalSheetsConsumed) * 100.0
		}

		// 6. Low stock alerts
		var lowStockCount int
		queryLowStock := `
			SELECT COUNT(*)
			FROM materials
			WHERE stock_qty <= COALESCE(reorder_threshold, 500)
		`
		_ = db.DB.QueryRow(queryLowStock).Scan(&lowStockCount)
		stats.LowStockAlertsCount = lowStockCount
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": stats})
}

// HandleGetRevenueTrend returns daily breakdown of revenue vs costs
func HandleGetRevenueTrend(c *gin.Context) {
	daysCount := 30
	var trend []DailyRevenuePoint

	if db.DB != nil {
		rows, err := db.DB.Query(`
			WITH date_series AS (
				SELECT generate_series(
					CURRENT_DATE - INTERVAL '29 days',
					CURRENT_DATE,
					INTERVAL '1 day'
				)::date AS d
			)
			SELECT 
				ds.d::text AS date_str,
				TO_CHAR(ds.d, 'DD/MM') AS display_date,
				COALESCE(SUM(CASE WHEN o.status IN ('COMPLETED', 'DELIVERED', 'Paid', 'Completed', 'IN_PRODUCTION') THEN COALESCE(o.total_price, o.total_amount_lak, 0) ELSE 0 END), 0) AS revenue,
				COALESCE(SUM(COALESCE(o.total_cost, 0)), 0) AS cost,
				COUNT(o.id) AS orders_count
			FROM date_series ds
			LEFT JOIN orders o ON DATE(o.created_at) = ds.d
			GROUP BY ds.d
			ORDER BY ds.d ASC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var pt DailyRevenuePoint
				var cost float64
				if err := rows.Scan(&pt.Date, &pt.DisplayDate, &pt.Revenue, &cost, &pt.OrdersCount); err == nil {
					pt.MaterialCost = cost
					pt.GrossProfit = pt.Revenue - cost
					trend = append(trend, pt)
				}
			}
			if err := rows.Err(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to iterate revenue trend rows", "details": err.Error()})
				return
			}
		}
	}

	if len(trend) == 0 {
		// Fallback points
		now := time.Now()
		for i := daysCount - 1; i >= 0; i-- {
			d := now.AddDate(0, 0, -i)
			trend = append(trend, DailyRevenuePoint{
				Date:        d.Format("2006-01-02"),
				DisplayDate: d.Format("02/01"),
				Revenue:     0,
				MaterialCost: 0,
				GrossProfit: 0,
				OrdersCount: 0,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": trend})
}

// HandleGetSpoilageTrend returns daily spoilage breakdown by cause
func HandleGetSpoilageTrend(c *gin.Context) {
	var trend []DailySpoilagePoint

	if db.DB != nil {
		rows, err := db.DB.Query(`
			WITH date_series AS (
				SELECT generate_series(
					CURRENT_DATE - INTERVAL '29 days',
					CURRENT_DATE,
					INTERVAL '1 day'
				)::date AS d
			)
			SELECT 
				ds.d::text AS date_str,
				TO_CHAR(ds.d, 'DD/MM') AS display_date,
				COALESCE(SUM(s.quantity), 0) AS total_wasted,
				COALESCE(SUM(CASE WHEN s.reason ILIKE '%plate%' THEN s.quantity ELSE 0 END), 0) AS plate_errors,
				COALESCE(SUM(CASE WHEN s.reason ILIKE '%operator%' OR s.reason ILIKE '%human%' THEN s.quantity ELSE 0 END), 0) AS operator_mistakes,
				COALESCE(SUM(CASE WHEN s.reason ILIKE '%jam%' THEN s.quantity ELSE 0 END), 0) AS machine_jams,
				COALESCE(SUM(CASE WHEN s.reason ILIKE '%paper%' OR s.reason ILIKE '%flaw%' THEN s.quantity ELSE 0 END), 0) AS paper_flaws,
				COALESCE(SUM(CASE WHEN s.reason NOT ILIKE '%plate%' AND s.reason NOT ILIKE '%operator%' AND s.reason NOT ILIKE '%jam%' AND s.reason NOT ILIKE '%paper%' THEN s.quantity ELSE 0 END), 0) AS other_count
			FROM date_series ds
			LEFT JOIN spoilage_logs s ON DATE(s.created_at) = ds.d
			GROUP BY ds.d
			ORDER BY ds.d ASC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var pt DailySpoilagePoint
				if err := rows.Scan(&pt.Date, &pt.DisplayDate, &pt.TotalWasted, &pt.PlateErrorCount, &pt.OperatorMistakes, &pt.MachineJamCount, &pt.PaperFlawCount, &pt.OtherCount); err == nil {
					trend = append(trend, pt)
				}
			}
			if err := rows.Err(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to iterate spoilage trend rows", "details": err.Error()})
				return
			}
		}
	}

	if len(trend) == 0 {
		now := time.Now()
		for i := 29; i >= 0; i-- {
			d := now.AddDate(0, 0, -i)
			trend = append(trend, DailySpoilagePoint{
				Date:        d.Format("2006-01-02"),
				DisplayDate: d.Format("02/01"),
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": trend})
}
