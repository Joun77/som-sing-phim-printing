package main

import (
	"log"
	"os"

	"backend/db"
	"backend/internal/handler"

	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("[Server] Starting Som Sing Phim API Server...")

	// Initialize DB Connection
	if _, err := db.InitDB(); err != nil {
		log.Printf("[Server WARNING] DB initialization failed or running in fallback mode: %v", err)
	}

	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, Idempotency-Key")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Register API Route Handlers
	pricingHandler := handler.NewPricingHandler()
	pricingHandler.RegisterRoutes(r)

	inventoryHandler := handler.NewInventoryHandler()
	inventoryHandler.RegisterRoutes(r)

	orderHandler := handler.NewOrderHandler()
	orderHandler.RegisterRoutes(r)

	// Health Check
	healthHandler := func(c *gin.Context) {
		dbStatus := "disconnected"
		if db.DB != nil {
			if err := db.DB.Ping(); err == nil {
				dbStatus = "connected"
			}
		}
		c.JSON(200, gin.H{
			"status":   "healthy",
			"database": dbStatus,
			"service":  "som-sing-phim-api",
		})
	}
	r.GET("/api/health", healthHandler)
	r.GET("/health", healthHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("[Server] Listening and serving on port :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("[Server ERROR] Failed to start server: %v", err)
	}
}
