package main

import (
	"log"
	"net/http"

	"backend/auth"
	"backend/customers"
	"backend/db"
	"backend/hr"
	"backend/inbound"
	"backend/inventory"
	"backend/orders"
	"backend/pricing"
	"backend/spoilage"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware configuration supporting multi-origin requests
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func main() {
	// Initialize PostgreSQL connection pool
	if _, err := db.InitDB(); err != nil {
		log.Printf("Starting with fallback mode (DB connection error: %v)", err)
	}

	router := gin.Default()

	// Enable CORS
	router.Use(CORSMiddleware())

	// Server status health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
		})
	})

	// Auth routes
	router.POST("/api/auth/login", auth.HandleLogin)

	// Daily rates routes
	router.GET("/api/rates", pricing.HandleGetRates)
	router.PUT("/api/rates", pricing.HandleUpdateRate)

	// Pricing engine route
	router.POST("/api/pricing/calculate", pricing.HandleCalculatePrice)

	// Order management routes
	router.GET("/api/orders", orders.HandleGetOrders)
	router.POST("/api/orders", orders.HandleCreateOrder)
	router.PUT("/api/orders/:id/deposit", orders.HandleRecordDeposit)
	router.PUT("/api/orders/:id/status", orders.HandleUpdateOrderStatus)

	// CRM Customer routes
	router.GET("/api/customers", customers.HandleGetCustomers)
	router.POST("/api/customers", customers.HandleCreateCustomer)
	router.PUT("/api/customers/:id", customers.HandleUpdateCustomer)

	// Spoilage audit log routes
	router.GET("/api/spoilage", spoilage.HandleGetSpoilageLogs)
	router.POST("/api/spoilage", spoilage.HandleCreateSpoilageLog)

	// PDF Generation routes
	router.GET("/api/orders/:id/pdf/quotation", orders.HandleGenerateQuotationPDF)
	router.GET("/api/orders/:id/pdf/delivery", orders.HandleGenerateDeliveryPDF)

	// Equipment / Printer Master routes
	router.GET("/api/equipment", inventory.HandleGetEquipment)
	router.POST("/api/equipment", inventory.HandleCreateEquipment)
	router.PUT("/api/equipment/:id", inventory.HandleUpdateEquipment)

	// HR Employee Management routes
	router.GET("/api/employees", hr.HandleGetEmployees)
	router.POST("/api/employees", hr.HandleCreateEmployee)
	router.PUT("/api/employees/:id", hr.HandleUpdateEmployee)
	router.DELETE("/api/employees/:id", hr.HandleDeleteEmployee)

	// Inbound Procurement routes
	router.GET("/api/inbound", inbound.HandleGetInboundTransactions)
	router.POST("/api/inbound", inbound.HandleCreateInboundTransaction)
	router.PUT("/api/inbound/:id", inbound.HandleUpdateInboundTransaction)
	router.DELETE("/api/inbound/:id", inbound.HandleDeleteInboundTransaction)

	// Phase 1 API v1 Assets & Inbound Procurement routes
	router.GET("/api/v1/assets", inventory.HandleGetAssetsV1)
	router.GET("/api/v1/assets/:id", inventory.HandleGetAssetByIDV1)
	router.POST("/api/v1/assets/inbound", inventory.HandleInboundAssetV1)
	router.PUT("/api/v1/assets/:id", inventory.HandleUpdateAssetV1)

	// Inventory Material SKU CRUD & Stock Discharge routes
	router.GET("/api/inventory/offcuts", inventory.HandleGetOffcuts)
	router.POST("/api/inventory/offcuts", inventory.HandleRegisterOffcut)
	router.GET("/api/inventory/items", inventory.HandleGetInventoryItems)
	router.GET("/api/inventory", inventory.HandleGetInventoryItems)
	router.POST("/api/inventory", inventory.HandleSaveInventorySKU)
	router.PUT("/api/inventory/:id", inventory.HandleUpdateInventorySKU)
	router.DELETE("/api/inventory/:id", inventory.HandleDeleteInventorySKU)
	router.POST("/api/inventory/:id/discharge", inventory.HandleDischargeInventoryStock)

	log.Println("Starting Go server on port 8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}

