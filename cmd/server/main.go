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
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
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

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("[Server] Listening on port :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("[Server ERROR] %v", err)
	}
}
