package main

import (
	"log"
	"net/http"

	"backend/inventory"
	"backend/orders"
	"backend/pricing"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware configuration
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
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
	router := gin.Default()

	// Enable CORS
	router.Use(CORSMiddleware())

	// Server status health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
		})
	})

	// Pricing engine route
	router.POST("/api/pricing/calculate", pricing.HandleCalculatePrice)

	// Order management routes
	router.GET("/api/orders", orders.HandleGetOrders)
	router.POST("/api/orders", orders.HandleCreateOrder)
	router.PUT("/api/orders/:id/deposit", orders.HandleRecordDeposit)
	router.PUT("/api/orders/:id/status", orders.HandleUpdateOrderStatus)

	// Inventory offcut routes
	router.GET("/api/inventory/offcuts", inventory.HandleGetOffcuts)
	router.POST("/api/inventory/offcuts", inventory.HandleRegisterOffcut)

	log.Println("Starting Go server on port 8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
