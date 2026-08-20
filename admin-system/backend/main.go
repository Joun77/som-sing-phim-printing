package main

import (
	"log"
	"net/http"

	"backend/auth"
	"backend/catalog"
	"backend/customers"
	"backend/db"
	"backend/finance"
	"backend/hr"
	"backend/inbound"
	"backend/inventory"
	"backend/middleware"
	"backend/orders"
	"backend/preflight"
	"backend/pricing"
	"backend/spoilage"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize PostgreSQL connection pool
	if _, err := db.InitDB(); err != nil {
		log.Printf("Starting with fallback mode (DB connection error: %v)", err)
	}

	router := gin.Default()

	// Enable CORS
	router.Use(middleware.CORSMiddleware())

	// Static file server for uploaded order files & preflight uploads
	router.Static("/api/v1/orders/files", "./uploads")

	// Server status health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
		})
	})

	// Auth routes
	router.POST("/api/auth/login", auth.HandleLogin)
	router.POST("/api/v1/auth/login", auth.HandleLogin)

	// Web Product Catalog routes (Admin & Public)
	router.GET("/api/v1/admin/catalog/products", catalog.HandleAdminGetProducts)
	router.POST("/api/v1/admin/catalog/products", catalog.HandleAdminCreateProduct)
	router.PUT("/api/v1/admin/catalog/products/:id", catalog.HandleAdminUpdateProduct)
	router.PATCH("/api/v1/admin/catalog/products/:id/toggle", catalog.HandleAdminToggleProduct)
	router.DELETE("/api/v1/admin/catalog/products/:id", catalog.HandleAdminSoftDeleteProduct)
	router.POST("/api/v1/admin/catalog/upload", catalog.HandleAdminUploadImage)
	router.GET("/api/v1/public/products", catalog.HandlePublicGetProducts)
	router.GET("/api/v1/public/products/:slug", catalog.HandlePublicGetProductBySlug)

	// PDF Preflight CMYK Extraction routes
	router.POST("/api/v1/orders/preflight", preflight.HandlePreflightPDF)
	router.POST("/api/v1/preflight", preflight.HandlePreflightPDF)

	// Owner Finance & Slip Verification routes
	router.GET("/api/v1/finance/summary", finance.HandleGetFinanceSummary)
	router.POST("/api/v1/finance/verify-slip", finance.HandleVerifyPaymentSlip)
	router.POST("/api/v1/checkout/verify-slip", finance.HandleVerifySlip)
	router.POST("/api/checkout/verify-slip", finance.HandleVerifySlip)
	router.GET("/api/v1/finance/ar-aging", finance.HandleGetARAging)

	// Daily rates & Currency proxy routes
	router.GET("/api/rates", pricing.HandleGetRates)
	router.PUT("/api/rates", pricing.HandleUpdateRate)
	router.GET("/api/v1/public/exchange-rates", pricing.HandleGetPublicExchangeRates)
	router.GET("/api/public/exchange-rates", pricing.HandleGetPublicExchangeRates)

	// Pricing engine route
	router.POST("/api/pricing/calculate", pricing.HandleCalculatePrice)
	router.POST("/api/v1/pricing/calculate", pricing.HandleCalculatePrice)

	// Order management, Quotation & Shop Floor Tracker routes
	router.GET("/api/orders", orders.HandleGetOrders)
	router.GET("/api/v1/orders", orders.HandleGetOrders)
	router.POST("/api/orders", orders.HandleCreateOrder)
	router.POST("/api/v1/orders", orders.HandleCreateOrder)
	router.POST("/api/v1/quotations/:id/approve", orders.HandleApproveQuotation)
	router.POST("/api/v1/quotations/:id/reject", orders.HandleRejectQuotation)
	router.POST("/api/quotations/:id/approve", orders.HandleApproveQuotation)
	router.POST("/api/quotations/:id/reject", orders.HandleRejectQuotation)
	router.POST("/api/v1/orders/upload", orders.HandleUploadOrderFile)
	router.PATCH("/api/v1/orders/items/:id/step", orders.HandleUpdateOrderItemStep)
	router.GET("/api/v1/orders/track/:order_no", orders.HandleGetOrderByOrderNo)
	router.PUT("/api/orders/:id/deposit", orders.HandleRecordDeposit)
	router.PUT("/api/orders/:id/status", orders.HandleUpdateOrderStatus)
	router.GET("/api/v1/orders/stream", orders.HandleOrderProgressSSEStream)
	router.GET("/api/v1/orders/:id/job-ticket", orders.HandleGenerateJobTicketPDF)
	router.GET("/api/v1/orders/by-number/:order_no/job-ticket", orders.HandleGenerateJobTicketPDF)
	router.POST("/api/v1/orders/:id/preflight-report", orders.HandleSavePreflightReport)
	router.GET("/api/v1/orders/:id/preflight-report", orders.HandleGetPreflightReport)

	// Digital Proof Management routes
	router.POST("/api/v1/orders/:id/proof", orders.HandleUploadDigitalProof)
	router.POST("/api/orders/:id/proof", orders.HandleUploadDigitalProof)
	router.POST("/api/v1/orders/:id/proof/approve", orders.HandleApproveDigitalProof)
	router.POST("/api/orders/:id/proof/approve", orders.HandleApproveDigitalProof)
	router.POST("/api/v1/orders/:id/proof/reject", orders.HandleRejectDigitalProof)
	router.POST("/api/orders/:id/proof/reject", orders.HandleRejectDigitalProof)
	router.GET("/api/v1/orders/:id/proof", orders.HandleGetDigitalProof)
	router.GET("/api/orders/:id/proof", orders.HandleGetDigitalProof)

	// Production Scheduling & Machine Queue routes
	router.GET("/api/v1/production/machines/schedule", spoilage.HandleGetMachineSchedule)
	router.GET("/api/production/machines/schedule", spoilage.HandleGetMachineSchedule)
	router.POST("/api/v1/production/spoilage", spoilage.HandleCreateSpoilageLog)
	router.GET("/api/v1/analytics/spoilage-profit", spoilage.HandleGetSpoilageProfitAnalytics)
	router.GET("/api/analytics/spoilage-profit", spoilage.HandleGetSpoilageProfitAnalytics)

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

	// Inventory Material SKU CRUD & Stock Discharge & FIFO Batches routes
	router.GET("/api/inventory/offcuts", inventory.HandleGetOffcuts)
	router.POST("/api/inventory/offcuts", inventory.HandleRegisterOffcut)
	router.GET("/api/inventory/batches", inventory.HandleGetInventoryBatches)
	router.GET("/api/inventory/items", inventory.HandleGetInventoryItems)
	router.GET("/api/inventory", inventory.HandleGetInventoryItems)
	router.POST("/api/inventory", inventory.HandleSaveInventorySKU)
	router.PUT("/api/inventory/:id", inventory.HandleUpdateInventorySKU)
	// Genuine & Compatible Ink Analytics routes
	router.GET("/api/admin/inks/genuine", inventory.HandleGetGenuineInks)
	router.GET("/api/admin/inks/compatible", inventory.HandleGetCompatibleInks)
	router.GET("/api/admin/inks/analytics", inventory.HandleGetInkYieldAnalytics)

	// Supplier Paper Price Sheet Versioning routes
	router.POST("/api/v1/inventory/supplier-price-sheets", inventory.HandleUploadSupplierPriceSheet)
	router.GET("/api/v1/inventory/supplier-price-sheets", inventory.HandleGetPaperPriceVersions)
	router.GET("/api/v1/inventory/paper-prices/latest", inventory.HandleGetLatestPaperPrices)
	router.POST("/api/inventory/supplier-price-sheets", inventory.HandleUploadSupplierPriceSheet)

	// Predictive Maintenance (PPM) routes
	router.GET("/api/v1/inventory/equipment/health", inventory.HandleGetEquipmentHealth)
	router.GET("/api/v1/inventory/equipment/maintenance-tickets", inventory.HandleGetMaintenanceTickets)
	router.POST("/api/v1/inventory/equipment/check-ppm", inventory.HandleTriggerPPMCheck)
	router.PATCH("/api/v1/inventory/equipment/maintenance-tickets/:id/resolve", inventory.HandleResolveMaintenanceTicket)
	router.GET("/api/equipment/health", inventory.HandleGetEquipmentHealth)
	router.GET("/api/equipment/maintenance-tickets", inventory.HandleGetMaintenanceTickets)

	// Start Daily Predictive Maintenance Background Cron
	inventory.StartPPMDailyCron()

	log.Println("Starting Go server on port 8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}

