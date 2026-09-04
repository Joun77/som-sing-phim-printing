package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"backend/auth"
	"backend/catalog"
	"backend/customers"
	"backend/dashboard"
	"backend/db"
	"backend/finance"
	"backend/hr"
	"backend/inbound"
	"backend/internal/handler"
	"backend/inventory"
	"backend/middleware"
	"backend/notifications"
	"backend/orders"
	"backend/preflight"
	"backend/pricing"
	"backend/settings"
	"backend/spoilage"
	"backend/suppliers"

	"github.com/gin-gonic/gin"
)

func main() {
	// Startup verification for production security
	if err := auth.ValidateJWTSecretOnStartup(); err != nil {
		log.Fatalf("Security startup check failed: %v", err)
	}

	// Initialize PostgreSQL connection pool
	if _, err := db.InitDB(); err != nil {
		log.Printf("Starting with fallback mode (DB connection error: %v)", err)
	}

	// Initialize Notification Dispatcher
	notifications.InitGlobalDispatcher(db.DB)

	router := gin.New()
	router.Use(gin.Recovery())

	// Observability & Security Middlewares
	router.Use(middleware.RequestLoggerMiddleware())
	router.Use(middleware.SecurityHeadersMiddleware())
	router.Use(middleware.CORSMiddleware())

	// General API Rate Limiting (180 req/min per IP)
	router.Use(middleware.RateLimitMiddleware(180, time.Minute))

	// Static file server for uploaded order files, artworks & preflight uploads
	router.Static("/api/v1/orders/files", "./uploads")
	router.Static("/uploads", "./uploads")
	router.POST("/api/upload/artwork", orders.HandleArtworkUpload)
	router.POST("/api/v1/upload/artwork", orders.HandleArtworkUpload)

	// Server status health check
	healthHandler := func(c *gin.Context) {
		dbStatus := "disconnected"
		if db.DB != nil {
			if err := db.DB.Ping(); err == nil {
				dbStatus = "connected"
			}
		}
		c.JSON(http.StatusOK, gin.H{
			"status":   "healthy",
			"database": dbStatus,
		})
	}
	router.GET("/health", healthHandler)
	router.GET("/api/health", healthHandler)

	// Auth routes
	router.POST("/api/auth/login", auth.HandleLogin)
	router.POST("/api/v1/auth/login", auth.HandleLogin)
	router.POST("/api/auth/refresh", auth.HandleRefreshToken)
	router.POST("/api/v1/auth/refresh", auth.HandleRefreshToken)
	router.POST("/api/auth/logout", auth.HandleLogout)
	router.POST("/api/v1/auth/logout", auth.HandleLogout)

	// Web Product Catalog & Categories routes (Admin & Public)
	router.GET("/api/v1/admin/catalog/categories", catalog.HandleGetCategories)
	router.POST("/api/v1/admin/catalog/categories", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), catalog.HandleAdminCreateCategory)
	router.PUT("/api/v1/admin/catalog/categories/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), catalog.HandleAdminUpdateCategory)
	router.DELETE("/api/v1/admin/catalog/categories/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), catalog.HandleAdminDeleteCategory)
	router.PUT("/api/v1/admin/catalog/categories/reorder", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), catalog.HandleAdminReorderCategories)

	router.GET("/api/v1/public/catalog/categories", catalog.HandleGetCategories)
	router.GET("/api/v1/public/categories", catalog.HandleGetCategories)
	router.GET("/api/categories", catalog.HandleGetCategories)
	router.GET("/api/catalog/categories", catalog.HandleGetCategories)

	router.GET("/api/v1/admin/catalog/products", catalog.HandleAdminGetProducts)
	router.POST("/api/v1/admin/catalog/products", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), catalog.HandleAdminCreateProduct)
	router.PUT("/api/v1/admin/catalog/products/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), catalog.HandleAdminUpdateProduct)
	router.PATCH("/api/v1/admin/catalog/products/:id/toggle", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), catalog.HandleAdminToggleProduct)
	router.PUT("/api/v1/admin/catalog/products/:id/toggle", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), catalog.HandleAdminToggleProduct)
	router.DELETE("/api/v1/admin/catalog/products/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), catalog.HandleAdminSoftDeleteProduct)
	router.POST("/api/v1/admin/catalog/upload", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), catalog.HandleAdminUploadImage)
	router.GET("/api/v1/public/products", catalog.HandlePublicGetProducts)
	router.GET("/api/v1/public/products/:slug", catalog.HandlePublicGetProductBySlug)
	router.GET("/api/products", catalog.HandlePublicGetProducts)
	router.GET("/api/products/:slug", catalog.HandlePublicGetProductBySlug)
	router.GET("/api/catalog/products", catalog.HandlePublicGetProducts)
	router.GET("/api/catalog/products/:slug", catalog.HandlePublicGetProductBySlug)

	// PDF & Image Preflight CMYK Extraction routes
	router.POST("/api/preflight/analyze", preflight.HandlePreflightPDF)
	router.POST("/api/preflight", preflight.HandlePreflightPDF)
	router.POST("/api/orders/preflight", preflight.HandlePreflightPDF)
	router.POST("/api/v1/preflight/analyze", preflight.HandlePreflightPDF)
	router.POST("/api/v1/orders/preflight", preflight.HandlePreflightPDF)
	router.POST("/api/v1/preflight", preflight.HandlePreflightPDF)

	// Owner Finance & Slip Verification routes (RBAC: Admin, Finance)
	financeAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleFinance, "accountant")
	router.GET("/api/v1/finance/summary", financeAuth, finance.HandleGetFinanceSummary)
	router.GET("/api/finance/summary", financeAuth, finance.HandleGetFinanceSummary)
	router.POST("/api/v1/finance/verify-slip", financeAuth, finance.HandleVerifyPaymentSlip)
	router.POST("/api/v1/checkout/verify-slip", finance.HandleVerifySlip)
	router.POST("/api/checkout/verify-slip", finance.HandleVerifySlip)
	router.GET("/api/v1/finance/ar-aging", financeAuth, finance.HandleGetARAging)
	router.GET("/api/v1/finance/pl-report", financeAuth, finance.HandleGetPLReport)
	router.GET("/api/finance/pl-report", financeAuth, finance.HandleGetPLReport)
	router.GET("/api/v1/finance/cash-flow", financeAuth, finance.HandleGetCashFlow)
	router.POST("/api/v1/finance/expenses", financeAuth, finance.HandleCreateExpense)
	router.GET("/api/v1/finance/expenses", financeAuth, finance.HandleGetExpenses)
	router.GET("/api/v1/finance/job-profitability", financeAuth, finance.HandleGetJobProfitability)
	router.GET("/api/v1/finance/ar", financeAuth, finance.HandleGetAR)
	router.POST("/api/v1/finance/ar/:id/payment", financeAuth, finance.HandleRecordARPayment)
	router.GET("/api/v1/finance/ap", financeAuth, finance.HandleGetAP)
	router.POST("/api/v1/finance/ap/:id/payment", financeAuth, finance.HandleRecordAPPayment)
	router.GET("/api/v1/finance/chart-of-accounts", financeAuth, finance.HandleGetChartOfAccounts)

	// Admin Dashboard Real-Data Aggregation routes
	dashboardAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleFinance, "owner")
	router.GET("/api/v1/dashboard/stats", dashboardAuth, dashboard.HandleGetDashboardStats)
	router.GET("/api/dashboard/stats", dashboardAuth, dashboard.HandleGetDashboardStats)
	router.GET("/api/v1/dashboard/revenue-trend", dashboardAuth, dashboard.HandleGetRevenueTrend)
	router.GET("/api/dashboard/revenue-trend", dashboardAuth, dashboard.HandleGetRevenueTrend)
	router.GET("/api/v1/dashboard/spoilage-trend", dashboardAuth, dashboard.HandleGetSpoilageTrend)
	router.GET("/api/dashboard/spoilage-trend", dashboardAuth, dashboard.HandleGetSpoilageTrend)

	// Daily rates & Currency proxy routes
	router.GET("/api/rates", pricing.HandleGetRates)
	router.PUT("/api/rates", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleFinance), pricing.HandleUpdateRate)
	router.GET("/api/v1/public/exchange-rates", pricing.HandleGetPublicExchangeRates)
	router.GET("/api/public/exchange-rates", pricing.HandleGetPublicExchangeRates)

	// Pricing engine route & margin approval
	router.POST("/api/pricing/calculate", pricing.HandleCalculatePrice)
	router.POST("/api/pricing/margin-approval", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "approved", "message": "Margin override authorized"})
	})

	// Order management, Quotation & Shop Floor Tracker routes
	router.GET("/api/orders", orders.HandleGetOrders)
	router.GET("/api/v1/orders", orders.HandleGetOrders)
	router.GET("/api/orders/:id", orders.HandleGetOrderById)
	router.GET("/api/v1/orders/:id", orders.HandleGetOrderById)
	router.POST("/api/orders", orders.HandleCreateOrder)
	router.POST("/api/v1/orders", orders.HandleCreateOrder)
	router.PUT("/api/orders/:id", orders.HandleUpdateOrder)
	router.PUT("/api/v1/orders/:id", orders.HandleUpdateOrder)
	router.PATCH("/api/orders/:id", orders.HandleUpdateOrder)
	router.PATCH("/api/v1/orders/:id", orders.HandleUpdateOrder)
	router.DELETE("/api/orders/:id", orders.HandleDeleteOrder)
	router.DELETE("/api/v1/orders/:id", orders.HandleDeleteOrder)
	router.GET("/api/v1/quotations", orders.HandleGetQuotations)
	router.GET("/api/quotations", orders.HandleGetQuotations)
	router.POST("/api/v1/quotations", orders.HandleSaveQuotation)
	router.POST("/api/quotations", orders.HandleSaveQuotation)
	router.PUT("/api/v1/quotations/:id", orders.HandleSaveQuotation)
	router.PUT("/api/quotations/:id", orders.HandleSaveQuotation)
	router.DELETE("/api/v1/quotations/:id", orders.HandleDeleteQuotation)
	router.DELETE("/api/quotations/:id", orders.HandleDeleteQuotation)
	router.POST("/api/v1/quotations/:id/approve", orders.HandleApproveQuotation)
	router.POST("/api/v1/quotations/:id/reject", orders.HandleRejectQuotation)
	router.POST("/api/quotations/:id/approve", orders.HandleApproveQuotation)
	router.POST("/api/quotations/:id/reject", orders.HandleRejectQuotation)
	router.POST("/api/v1/quotations/:id/convert", orders.HandleConvertQuotationToOrder)
	router.POST("/api/quotations/:id/convert", orders.HandleConvertQuotationToOrder)
	router.POST("/api/v1/orders/upload", orders.HandleUploadOrderFile)
	router.PATCH("/api/v1/orders/items/:id/step", orders.HandleUpdateOrderItemStep)
	router.GET("/api/v1/orders/track", orders.HandleTrackOrderQuery)
	router.GET("/api/orders/track", orders.HandleTrackOrderQuery)
	router.GET("/api/v1/orders/track/:order_no", orders.HandleGetOrderByOrderNo)
	router.GET("/api/orders/track/:order_no", orders.HandleGetOrderByOrderNo)
	router.PUT("/api/orders/:id/deposit", orders.HandleRecordDeposit)
	router.PUT("/api/orders/:id/status", orders.HandleUpdateOrderStatus)
	router.PATCH("/api/v1/orders/:id/status", orders.HandleUpdateOrderStatus)
	router.POST("/api/orders/:id/reverse-stock", orders.HandleReverseOrderStock)
	router.POST("/api/v1/orders/:id/reverse-stock", orders.HandleReverseOrderStock)
	router.GET("/api/v1/orders/stream", orders.HandleOrderProgressSSEStream)
	router.GET("/api/v1/orders/:id/job-ticket", orders.HandleGenerateJobTicketPDF)
	router.GET("/api/v1/orders/by-number/:order_no/job-ticket", orders.HandleGenerateJobTicketPDF)
	router.POST("/api/v1/orders/:id/preflight-report", orders.HandleSavePreflightReport)
	router.GET("/api/v1/orders/:id/preflight-report", orders.HandleGetPreflightReport)

	// Digital Proof Management routes
	router.POST("/api/v1/orders/:id/send-proof", orders.HandleSendProof)
	router.POST("/api/orders/:id/send-proof", orders.HandleSendProof)
	router.POST("/api/v1/orders/:id/proof-action", orders.HandleProofAction)
	router.POST("/api/orders/:id/proof-action", orders.HandleProofAction)
	router.POST("/api/v1/orders/:id/proof", orders.HandleUploadDigitalProof)
	router.POST("/api/orders/:id/proof", orders.HandleUploadDigitalProof)
	router.POST("/api/v1/orders/:id/proof/approve", orders.HandleApproveDigitalProof)
	router.POST("/api/orders/:id/proof/approve", orders.HandleApproveDigitalProof)
	router.POST("/api/v1/orders/:id/proof/reject", orders.HandleRejectDigitalProof)
	router.POST("/api/orders/:id/proof/reject", orders.HandleRejectDigitalProof)
	router.GET("/api/v1/orders/:id/proof", orders.HandleGetDigitalProof)
	router.GET("/api/orders/:id/proof", orders.HandleGetDigitalProof)

	// Public Digital Proof Review routes (Secure token-verified)
	router.GET("/api/v1/public/proof/:order_id/:token", orders.HandleGetProofDetails)
	router.POST("/api/v1/public/proof/:order_id/:token/approve", orders.HandleApproveProof)
	router.POST("/api/v1/public/proof/:order_id/:token/reject", orders.HandleRejectProof)
	router.GET("/api/v1/proof/:order_id/:token", orders.HandleGetProofDetails)
	router.POST("/api/v1/proof/:order_id/:token/approve", orders.HandleApproveProof)
	router.POST("/api/v1/proof/:order_id/:token/reject", orders.HandleRejectProof)

	// Public Customer Portal routes
	router.POST("/api/v1/public/customer/auth", customers.HandlePublicCustomerAuth)
	router.GET("/api/v1/public/customer/profile", customers.HandlePublicCustomerProfile)
	router.PUT("/api/v1/public/customer/profile", customers.HandleSavePublicCustomerProfile)
	router.GET("/api/v1/public/customer/orders", customers.HandlePublicCustomerOrders)

	// Admin Notification Settings routes
	router.GET("/api/v1/admin/notification-config", settings.HandleGetNotificationConfig)
	router.PUT("/api/v1/admin/notification-config", settings.HandleUpdateNotificationConfig)
	router.POST("/api/v1/admin/notification-test", settings.HandleTestNotification)

	// Production Scheduling & Machine Queue routes
	prodAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleProduction)
	router.GET("/api/v1/production/machines/schedule", prodAuth, spoilage.HandleGetMachineSchedule)
	router.GET("/api/production/machines/schedule", prodAuth, spoilage.HandleGetMachineSchedule)
	router.POST("/api/v1/production/spoilage", prodAuth, spoilage.HandleCreateSpoilageLog)
	router.GET("/api/v1/analytics/spoilage-profit", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleFinance), spoilage.HandleGetSpoilageProfitAnalytics)
	router.GET("/api/analytics/spoilage-profit", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleFinance), spoilage.HandleGetSpoilageProfitAnalytics)

	// CRM Customer routes
	crmAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales)
	router.GET("/api/customers", crmAuth, customers.HandleGetCustomers)
	router.GET("/api/customers/:id", crmAuth, customers.HandleGetCustomerByID)
	router.GET("/api/customers/:id/orders", crmAuth, customers.HandleGetCustomerOrders)
	router.POST("/api/customers", crmAuth, customers.HandleCreateCustomer)
	router.POST("/api/customers/bulk-delete", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), customers.HandleBulkDeleteCustomers)
	router.PUT("/api/customers/:id", crmAuth, customers.HandleUpdateCustomer)
	router.DELETE("/api/customers/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), customers.HandleDeleteCustomer)

	// Customer Categories (Dynamic Tiers)
	router.GET("/api/customers/categories", crmAuth, customers.HandleGetCustomerCategories)
	router.POST("/api/customers/categories", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), customers.HandleCreateCustomerCategory)
	router.PUT("/api/customers/categories/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), customers.HandleUpdateCustomerCategory)
	router.DELETE("/api/customers/categories/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), customers.HandleDeleteCustomerCategory)

	router.GET("/api/v1/customers/categories", crmAuth, customers.HandleGetCustomerCategories)
	router.POST("/api/v1/customers/categories", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), customers.HandleCreateCustomerCategory)
	router.PUT("/api/v1/customers/categories/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), customers.HandleUpdateCustomerCategory)
	router.DELETE("/api/v1/customers/categories/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), customers.HandleDeleteCustomerCategory)


	// Spoilage audit log routes
	router.GET("/api/spoilage", prodAuth, spoilage.HandleGetSpoilageLogs)
	router.POST("/api/spoilage", prodAuth, spoilage.HandleCreateSpoilageLog)

	// PDF Generation routes
	router.GET("/api/orders/:id/pdf/quotation", orders.HandleGenerateQuotationPDF)
	router.GET("/api/orders/:id/pdf/delivery", orders.HandleGenerateDeliveryPDF)

	// Equipment / Printer Master routes
	router.GET("/api/equipment", inventory.HandleGetEquipment)
	router.POST("/api/equipment", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleCreateEquipment)
	router.PUT("/api/equipment/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleUpdateEquipment)
	router.DELETE("/api/equipment/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleDeleteEquipment)

	// HR Employee Management routes (RBAC: Admin only)
	hrAuth := auth.RequireRoles(auth.RoleAdmin)
	router.GET("/api/employees", hrAuth, hr.HandleGetEmployees)
	router.POST("/api/employees", hrAuth, hr.HandleCreateEmployee)
	router.PUT("/api/employees/:id", hrAuth, hr.HandleUpdateEmployee)
	router.DELETE("/api/employees/:id", hrAuth, hr.HandleDeleteEmployee)

	// Supplier Master routes
	router.GET("/api/v1/suppliers", suppliers.HandleGetSuppliers)
	router.POST("/api/v1/suppliers", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleCreateSupplier)
	router.PUT("/api/v1/suppliers/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleUpdateSupplier)
	router.DELETE("/api/v1/suppliers/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleDeleteSupplier)

	// Purchase Order (PO) & Goods Receipt routes
	router.GET("/api/v1/purchase-orders", suppliers.HandleGetPOs)
	router.POST("/api/v1/purchase-orders", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleCreatePO)
	router.PUT("/api/v1/purchase-orders/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleUpdatePO)
	router.POST("/api/v1/purchase-orders/:id/send", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleSendPO)
	router.GET("/api/v1/purchase-orders/:id/pdf", suppliers.HandleGeneratePOPDF)
	router.POST("/api/v1/purchase-orders/:id/receive", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleReceiveGoods)

	// Inbound Procurement routes
	invHandler := handler.NewInventoryHandler()
	invHandler.RegisterRoutes(router)

	// Pricing Template & Dynamic Coverage Engine routes
	pricingHandler := handler.NewPricingHandler()
	pricingHandler.RegisterRoutes(router)

	router.GET("/api/inbound", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inbound.HandleGetInboundTransactions)
	router.POST("/api/inbound", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inbound.HandleCreateInboundTransaction)
	router.POST("/api/inbound/batch", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inbound.HandleCreateBatchInboundTransaction)
	router.PUT("/api/inbound/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inbound.HandleUpdateInboundTransaction)
	router.DELETE("/api/inbound/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inbound.HandleDeleteInboundTransaction)

	// Phase 1 API v1 Assets & Inbound Procurement routes
	router.GET("/api/v1/assets", inventory.HandleGetAssetsV1)
	router.GET("/api/v1/assets/:id", inventory.HandleGetAssetByIDV1)
	router.POST("/api/v1/assets/inbound", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleInboundAssetV1)
	router.PUT("/api/v1/assets/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleUpdateAssetV1)
	router.DELETE("/api/v1/assets/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleDeleteEquipment)

	// Inventory Material SKU CRUD & Stock Discharge & FIFO Batches routes
	router.GET("/api/inventory/offcuts", inventory.HandleGetOffcuts)
	router.POST("/api/inventory/offcuts", inventory.HandleRegisterOffcut)
	router.GET("/api/inventory/batches", inventory.HandleGetInventoryBatches)
	router.GET("/api/inventory/items", inventory.HandleGetInventoryItems)
	router.GET("/api/inventory", inventory.HandleGetInventoryItems)
	router.POST("/api/inventory", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleSaveInventorySKU)
	router.PUT("/api/inventory/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleUpdateInventorySKU)
	router.PUT("/api/inventory/items/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleUpdateInventorySKU)
	router.DELETE("/api/inventory/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleDeleteInventorySKU)
	router.DELETE("/api/inventory/items/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleDeleteInventorySKU)
	router.DELETE("/api/v1/materials/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleDeleteInventorySKU)
	// Genuine & Compatible Ink Analytics routes
	router.GET("/api/admin/inks/genuine", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleGetGenuineInks)
	router.GET("/api/admin/inks/compatible", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleGetCompatibleInks)
	router.GET("/api/admin/inks/analytics", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleGetInkYieldAnalytics)

	// Supplier Paper Price Sheet Versioning routes
	router.POST("/api/v1/inventory/supplier-price-sheets", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleUploadSupplierPriceSheet)
	router.GET("/api/v1/inventory/supplier-price-sheets", inventory.HandleGetPaperPriceVersions)
	router.GET("/api/v1/inventory/paper-prices/latest", inventory.HandleGetLatestPaperPrices)
	router.POST("/api/inventory/supplier-price-sheets", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleUploadSupplierPriceSheet)

	// Predictive Maintenance (PPM) routes
	router.GET("/api/v1/inventory/equipment/health", inventory.HandleGetEquipmentHealth)
	router.GET("/api/v1/inventory/equipment/maintenance-tickets", inventory.HandleGetMaintenanceTickets)
	router.POST("/api/v1/inventory/equipment/check-ppm", inventory.HandleTriggerPPMCheck)
	router.PATCH("/api/v1/inventory/equipment/maintenance-tickets/:id/resolve", inventory.HandleResolveMaintenanceTicket)
	router.GET("/api/equipment/health", inventory.HandleGetEquipmentHealth)
	router.GET("/api/equipment/maintenance-tickets", inventory.HandleGetMaintenanceTickets)

	// Couriers & Payment Methods Master Data routes (Admin & Public)
	router.GET("/api/v1/public/couriers", settings.HandleGetCouriers)
	router.GET("/api/v1/couriers", settings.HandleGetCouriers)
	router.GET("/api/couriers", settings.HandleGetCouriers)
	router.POST("/api/v1/admin/couriers", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleCreateCourier)
	router.POST("/api/v1/couriers", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleCreateCourier)
	router.POST("/api/couriers", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleCreateCourier)
	router.PUT("/api/v1/admin/couriers/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleUpdateCourier)
	router.PUT("/api/v1/couriers/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleUpdateCourier)
	router.DELETE("/api/v1/admin/couriers/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleDeleteCourier)
	router.DELETE("/api/v1/couriers/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleDeleteCourier)

	router.POST("/api/v1/admin/couriers/sync", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleSyncCouriers)
	router.POST("/api/admin/couriers/sync", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleSyncCouriers)
	router.POST("/api/v1/admin/couriers/upload-logo", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleUploadLogo)
	router.POST("/api/v1/couriers/upload-logo", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleUploadLogo)

	router.GET("/api/v1/public/payment-methods", settings.HandleGetPaymentMethods)
	router.GET("/api/v1/payment-methods", settings.HandleGetPaymentMethods)
	router.GET("/api/payment-methods", settings.HandleGetPaymentMethods)
	router.POST("/api/v1/admin/payment-methods", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleCreatePaymentMethod)
	router.POST("/api/v1/payment-methods", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleCreatePaymentMethod)
	router.POST("/api/v1/admin/payment-methods/sync", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleSyncPaymentMethods)
	router.POST("/api/admin/payment-methods/sync", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleSyncPaymentMethods)
	router.PUT("/api/v1/admin/payment-methods/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleUpdatePaymentMethod)
	router.PUT("/api/v1/payment-methods/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleUpdatePaymentMethod)
	router.DELETE("/api/v1/admin/payment-methods/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleDeletePaymentMethod)
	// Seed Lao Provinces & Districts to PostgreSQL
	settings.SeedLocationsToDB(db.GetDB())

	// Lao Provinces & Districts Database routes (Public & Admin)
	router.GET("/api/v1/public/locations/provinces", settings.HandleGetLaoProvinces)
	router.GET("/api/v1/locations/provinces", settings.HandleGetLaoProvinces)
	router.GET("/api/locations/provinces", settings.HandleGetLaoProvinces)
	router.GET("/api/v1/public/locations/districts", settings.HandleGetLaoDistricts)
	router.GET("/api/v1/locations/districts", settings.HandleGetLaoDistricts)
	router.GET("/api/locations/districts", settings.HandleGetLaoDistricts)

	// Shop Contact Profile & WhatsApp / Phone Settings routes (Public & Admin)
	router.GET("/api/v1/public/shop-info", settings.HandleGetShopInfo)
	router.GET("/api/v1/shop-info", settings.HandleGetShopInfo)
	router.GET("/api/shop-info", settings.HandleGetShopInfo)
	router.GET("/api/v1/admin/shop-info", settings.HandleGetShopInfo)
	router.PUT("/api/v1/admin/shop-info", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleUpdateShopInfo)
	router.POST("/api/v1/admin/shop-info", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleUpdateShopInfo)

	// Technician Piece-Rate Earnings routes (RBAC: Admin, HR)
	router.GET("/api/v1/hr/earnings", hrAuth, hr.HandleGetTechnicianEarnings)
	router.POST("/api/v1/hr/earnings", hrAuth, hr.HandleCreateTechnicianEarning)
	router.GET("/api/hr/earnings", hrAuth, hr.HandleGetTechnicianEarnings)
	router.POST("/api/hr/earnings", hrAuth, hr.HandleCreateTechnicianEarning)

	// Machine Status & Downtime Logs routes
	router.GET("/api/v1/production/downtime", prodAuth, inventory.HandleGetDowntimeLogs)
	router.POST("/api/v1/production/downtime", prodAuth, inventory.HandleCreateDowntimeLog)
	router.GET("/api/production/downtime", prodAuth, inventory.HandleGetDowntimeLogs)
	router.POST("/api/production/downtime", prodAuth, inventory.HandleCreateDowntimeLog)

	// Delivery & Dispatch Tracking routes
	router.GET("/api/v1/orders/deliveries", orders.HandleGetDeliveries)
	router.POST("/api/v1/orders/deliveries", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RoleProduction), orders.HandleSaveDelivery)
	router.PUT("/api/v1/orders/deliveries/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RoleProduction), orders.HandleUpdateDelivery)
	router.GET("/api/orders/deliveries", orders.HandleGetDeliveries)
	router.POST("/api/orders/deliveries", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RoleProduction), orders.HandleSaveDelivery)
	router.PUT("/api/orders/deliveries/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RoleProduction), orders.HandleUpdateDelivery)

	// Start Daily Predictive Maintenance Background Cron
	inventory.StartPPMDailyCron()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Starting Go server on port %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}

