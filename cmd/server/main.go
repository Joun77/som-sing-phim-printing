package main

import (
	"log"
	"os"

	"backend/db"
	"backend/server/handler"
	"backend/server/service"

	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("[Server] Starting Som Sing Phim Root API Server...")

	dbConn, err := db.InitDB()
	if err != nil {
		log.Printf("[Server WARNING] DB initialization: %v", err)
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

	pricingSvc := service.NewPricingService()
	orderHdr := handler.NewOrderHandler(pricingSvc, dbConn)
	orderHdr.RegisterRoutes(r)

	healthHandler := func(c *gin.Context) {
		dbStatus := "disconnected"
		if dbConn != nil {
			if err := dbConn.Ping(); err == nil {
				dbStatus = "connected"
			}
		}
		c.JSON(200, gin.H{
			"status":   "healthy",
			"database": dbStatus,
		})
	}
	r.GET("/api/health", healthHandler)
	r.GET("/health", healthHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("[Server] Listening on port :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("[Server ERROR] %v", err)
	}
}
