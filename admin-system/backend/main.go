package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"somsing.local/backend/auth"
	"somsing.local/backend/catalog"
	"somsing.local/backend/customers"
	"somsing.local/backend/dashboard"
	"somsing.local/backend/db"
	"somsing.local/backend/finance"
	"somsing.local/backend/hr"
	"somsing.local/backend/inbound"
	"somsing.local/backend/internal/handler"
	"somsing.local/backend/inventory"
	"somsing.local/backend/middleware"
	"somsing.local/backend/notifications"
	"somsing.local/backend/orders"
	"somsing.local/backend/preflight"
	"somsing.local/backend/pricing"
	"somsing.local/backend/production"
	"somsing.local/backend/settings"
	"somsing.local/backend/spoilage"
	"somsing.local/backend/suppliers"

	"github.com/gin-gonic/gin"
)

func main() {
	// Startup verification for production security — fail closed if JWT_SECRET missing
	if err := auth.ValidateJWTSecretOnStartup(); err != nil {
		env := strings.ToLower(strings.TrimSpace(os.Getenv("ENVIRONMENT")))
		isExplicitlyDev := env == "development" || env == "dev" || env == "test"
		if !isExplicitlyDev {
			log.Fatalf("[SECURITY] %v", err)
		}
		log.Printf("[SECURITY WARNING] %v (Running with default fallback key - set JWT_SECRET in environment variables to secure tokens)", err)
	}

	// Initialize PostgreSQL connection pool
	if _, err := db.InitDB(); err != nil {
		log.Printf("Starting with fallback mode (DB connection error: %v)", err)
	}

	// Initialize Notification Dispatcher
	notifications.InitGlobalDispatcher(db.DB)

	// Seed Lao Provinces & Districts to PostgreSQL
	settings.SeedLocationsToDB(db.GetDB())

	router := gin.New()
	router.Use(gin.Recovery())

	RegisterRoutes(router)

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

// RouteDecorator allows wrapping or replacing handler chains during route registration.
type RouteDecorator func(method, path string, handlers ...gin.HandlerFunc) []gin.HandlerFunc

// DefaultRouteDecorator is the production identity function.
func DefaultRouteDecorator(method, path string, handlers ...gin.HandlerFunc) []gin.HandlerFunc {
	return handlers
}

type routeConfig struct {
	decorator RouteDecorator
}

// RouteOption configures route registration.
type RouteOption func(*routeConfig)

// WithRouteDecorator allows passing a custom route decorator (e.g. for testing).
func WithRouteDecorator(decorator RouteDecorator) RouteOption {
	return func(c *routeConfig) {
		if decorator != nil {
			c.decorator = decorator
		}
	}
}

// WithFinalHandlerSentinel wraps route registrations, preserving the entire middleware chain
// and replacing only the final business handler with a safe sentinel response.
func WithFinalHandlerSentinel() RouteOption {
	return WithRouteDecorator(func(method, path string, handlers ...gin.HandlerFunc) []gin.HandlerFunc {
		if len(handlers) == 0 {
			return handlers
		}
		middlewares := handlers[:len(handlers)-1]
		sentinel := func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":   "authorized",
				"sentinel": true,
				"method":   method,
				"path":     path,
			})
		}
		res := make([]gin.HandlerFunc, len(middlewares)+1)
		copy(res, middlewares)
		res[len(middlewares)] = sentinel
		return res
	})
}

type routeRegistrar struct {
	engine    *gin.Engine
	decorator RouteDecorator
}

func newRouteRegistrar(engine *gin.Engine, decorator RouteDecorator) *routeRegistrar {
	return &routeRegistrar{
		engine:    engine,
		decorator: decorator,
	}
}

func (r *routeRegistrar) Engine() *gin.Engine {
	return r.engine
}

func (r *routeRegistrar) Use(middleware ...gin.HandlerFunc) gin.IRoutes {
	return r.engine.Use(middleware...)
}

func (r *routeRegistrar) Static(relativePath, root string) gin.IRoutes {
	return r.engine.Static(relativePath, root)
}

func (r *routeRegistrar) GET(relativePath string, handlers ...gin.HandlerFunc) gin.IRoutes {
	return r.engine.GET(relativePath, r.decorator(http.MethodGet, relativePath, handlers...)...)
}

func (r *routeRegistrar) HEAD(relativePath string, handlers ...gin.HandlerFunc) gin.IRoutes {
	return r.engine.HEAD(relativePath, r.decorator(http.MethodHead, relativePath, handlers...)...)
}

func (r *routeRegistrar) POST(relativePath string, handlers ...gin.HandlerFunc) gin.IRoutes {
	return r.engine.POST(relativePath, r.decorator(http.MethodPost, relativePath, handlers...)...)
}

func (r *routeRegistrar) PUT(relativePath string, handlers ...gin.HandlerFunc) gin.IRoutes {
	return r.engine.PUT(relativePath, r.decorator(http.MethodPut, relativePath, handlers...)...)
}

func (r *routeRegistrar) DELETE(relativePath string, handlers ...gin.HandlerFunc) gin.IRoutes {
	return r.engine.DELETE(relativePath, r.decorator(http.MethodDelete, relativePath, handlers...)...)
}

func (r *routeRegistrar) PATCH(relativePath string, handlers ...gin.HandlerFunc) gin.IRoutes {
	return r.engine.PATCH(relativePath, r.decorator(http.MethodPatch, relativePath, handlers...)...)
}

// RegisterRoutes encapsulates all route definitions for both production and testing.
func RegisterRoutes(engine *gin.Engine, opts ...RouteOption) {
	cfg := routeConfig{
		decorator: DefaultRouteDecorator,
	}
	for _, opt := range opts {
		opt(&cfg)
	}

	router := newRouteRegistrar(engine, cfg.decorator)
	// Observability & Security Middlewares
	router.Use(middleware.RequestLoggerMiddleware())
	router.Use(middleware.SecurityHeadersMiddleware())
	router.Use(middleware.CORSMiddleware())

	// General API Rate Limiting (180 req/min per IP)
	router.Use(middleware.RateLimitMiddleware(180, time.Minute))

	// Protected file serving for uploaded order files, artworks & preflight uploads (P1.2)
	// Serves private artwork/order files only to authorized staff, with public access
	// limited strictly to the preflight workspace.
	router.GET("/api/v1/orders/files/*filepath", orders.HandleServeProtectedFile)
	router.GET("/uploads/*filepath", orders.HandleServeProtectedFile)
	router.HEAD("/api/v1/orders/files/*filepath", orders.HandleServeProtectedFile)
	router.HEAD("/uploads/*filepath", orders.HandleServeProtectedFile)

	// Artwork upload routes — require authentication (sales, prepress, admin, manager, production)
	artworkAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RolePrepress, auth.RoleProduction)
	router.POST("/api/upload/artwork", artworkAuth, orders.HandleArtworkUpload)
	router.POST("/api/v1/upload/artwork", artworkAuth, orders.HandleArtworkUpload)
	router.POST("/api/upload/batch-artworks", artworkAuth, orders.HandleBatchArtworkUpload)
	router.POST("/api/v1/upload/batch-artworks", artworkAuth, orders.HandleBatchArtworkUpload)

	// Server status health check
	healthHandler := func(c *gin.Context) {
		dbStatus := "disconnected"
		if db.DB != nil {
			if err := db.DB.Ping(); err == nil {
				dbStatus = "connected"
			}
		}
		c.JSON(http.StatusOK, gin.H{
			"ok":       true,
			"status":   "healthy",
			"database": dbStatus,
		})
	}
	router.GET("/", healthHandler)
	router.GET("/health", healthHandler)
	router.GET("/healthz", healthHandler)
	router.GET("/api/health", healthHandler)

	// Auth routes
	router.POST("/api/auth/login", auth.HandleLogin)
	router.POST("/api/v1/auth/login", auth.HandleLogin)
	router.POST("/api/auth/refresh", auth.HandleRefreshToken)
	router.POST("/api/v1/auth/refresh", auth.HandleRefreshToken)
	router.POST("/api/auth/logout", auth.HandleLogout)
	router.POST("/api/v1/auth/logout", auth.HandleLogout)

	// Staff User Management & RBAC routes (Admin only)
	router.GET("/api/v1/admin/users", auth.RequireRoles(auth.RoleAdmin), auth.HandleGetAdminUsers)
	router.POST("/api/v1/admin/users", auth.RequireRoles(auth.RoleAdmin), auth.HandleCreateAdminUser)
	router.PUT("/api/v1/admin/users/:id", auth.RequireRoles(auth.RoleAdmin), auth.HandleUpdateAdminUser)
	router.DELETE("/api/v1/admin/users/:id", auth.RequireRoles(auth.RoleAdmin), auth.HandleDeleteAdminUser)

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
	router.POST("/api/preflight/batch-analyze", preflight.HandleBatchPreflight)
	router.POST("/api/v1/preflight/batch-analyze", preflight.HandleBatchPreflight)
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
	router.GET("/api/v1/finance/pending-slips", financeAuth, finance.HandleGetPendingSlips)
	router.GET("/api/finance/pending-slips", financeAuth, finance.HandleGetPendingSlips)
	// checkout/verify-slip is a finance operation and requires authentication
	router.POST("/api/v1/checkout/verify-slip", financeAuth, finance.HandleVerifySlip)
	router.POST("/api/checkout/verify-slip", financeAuth, finance.HandleVerifySlip)
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
	router.POST("/api/pricing/batch-imposition", pricing.HandleCalculateBatchImposition)
	router.POST("/api/v1/pricing/batch-imposition", pricing.HandleCalculateBatchImposition)
	router.GET("/api/quotations/templates", pricing.HandleGetQuotationTemplates)
	router.GET("/api/v1/quotations/templates", pricing.HandleGetQuotationTemplates)
	router.POST("/api/quotations/templates", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), pricing.HandleSaveQuotationTemplate)
	router.POST("/api/v1/quotations/templates", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), pricing.HandleSaveQuotationTemplate)
	router.DELETE("/api/quotations/templates/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), pricing.HandleDeleteQuotationTemplate)
	router.DELETE("/api/v1/quotations/templates/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), pricing.HandleDeleteQuotationTemplate)
	router.POST("/api/pricing/margin-approval", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "approved", "message": "Margin override authorized"})
	})

	// Batch file ZIP download — requires authentication
	batchZipAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RolePrepress, auth.RoleProduction)
	router.POST("/api/orders/batch-zip", batchZipAuth, orders.HandleBatchDownloadZip)
	router.POST("/api/v1/orders/batch-zip", batchZipAuth, orders.HandleBatchDownloadZip)
	router.GET("/api/orders/batch-zip", batchZipAuth, orders.HandleBatchDownloadZip)
	router.GET("/api/v1/orders/batch-zip", batchZipAuth, orders.HandleBatchDownloadZip)

	// Order management, Quotation & Shop Floor Tracker routes
	// All order/quotation CRUD requires authentication; public tracking is separate below
	ordersAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RoleFinance, auth.RoleProduction, auth.RolePrepress)
	ordersWriteAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales)
	quotationAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales)
	router.GET("/api/orders", ordersAuth, orders.HandleGetOrders)
	router.GET("/api/v1/orders", ordersAuth, orders.HandleGetOrders)
	router.GET("/api/orders/:id", ordersAuth, orders.HandleGetOrderById)
	router.GET("/api/v1/orders/:id", ordersAuth, orders.HandleGetOrderById)
	router.POST("/api/orders", ordersWriteAuth, orders.HandleCreateOrder)
	router.POST("/api/v1/orders", ordersWriteAuth, orders.HandleCreateOrder)
	router.PUT("/api/orders/:id", ordersWriteAuth, orders.HandleUpdateOrder)
	router.PUT("/api/v1/orders/:id", ordersWriteAuth, orders.HandleUpdateOrder)
	router.PATCH("/api/orders/:id", ordersWriteAuth, orders.HandleUpdateOrder)
	router.PATCH("/api/v1/orders/:id", ordersWriteAuth, orders.HandleUpdateOrder)
	router.DELETE("/api/orders/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), orders.HandleDeleteOrder)
	router.DELETE("/api/v1/orders/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), orders.HandleDeleteOrder)
	router.GET("/api/v1/quotations", quotationAuth, orders.HandleGetQuotations)
	router.GET("/api/quotations", quotationAuth, orders.HandleGetQuotations)
	router.POST("/api/v1/quotations", quotationAuth, orders.HandleSaveQuotation)
	router.POST("/api/quotations", quotationAuth, orders.HandleSaveQuotation)
	router.PUT("/api/v1/quotations/:id", quotationAuth, orders.HandleSaveQuotation)
	router.PUT("/api/quotations/:id", quotationAuth, orders.HandleSaveQuotation)
	router.DELETE("/api/v1/quotations/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), orders.HandleDeleteQuotation)
	router.DELETE("/api/quotations/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), orders.HandleDeleteQuotation)
	router.POST("/api/v1/quotations/:id/approve", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), orders.HandleApproveQuotation)
	router.POST("/api/v1/quotations/:id/reject", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), orders.HandleRejectQuotation)
	router.POST("/api/quotations/:id/approve", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), orders.HandleApproveQuotation)
	router.POST("/api/quotations/:id/reject", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), orders.HandleRejectQuotation)
	router.POST("/api/v1/quotations/:id/convert", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales), orders.HandleConvertQuotationToOrder)
	router.POST("/api/quotations/:id/convert", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales), orders.HandleConvertQuotationToOrder)
	router.POST("/api/v1/orders/upload", artworkAuth, orders.HandleUploadOrderFile)
	router.POST("/api/orders/upload", artworkAuth, orders.HandleUploadOrderFile)
	router.PATCH("/api/v1/orders/items/:id/step", ordersAuth, orders.HandleUpdateOrderItemStep)
	router.PUT("/api/v1/orders/items/:id/step", ordersAuth, orders.HandleUpdateOrderItemStep)
	router.POST("/api/v1/orders/items/:id/step", ordersAuth, orders.HandleUpdateOrderItemStep)
	router.PATCH("/api/v1/orders/:id/items/:item_id/step", ordersAuth, orders.HandleUpdateOrderItemStep)
	router.PUT("/api/v1/orders/:id/items/:item_id/step", ordersAuth, orders.HandleUpdateOrderItemStep)
	router.POST("/api/v1/orders/:id/items/:item_id/step", ordersAuth, orders.HandleUpdateOrderItemStep)
	
	// Legacy order tracking issue link
	router.POST("/api/orders/:id/issue-tracking-token", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleOwner, "super_admin"), orders.HandleIssueTrackingToken)
	router.POST("/api/v1/orders/:id/issue-tracking-token", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleOwner, "super_admin"), orders.HandleIssueTrackingToken)

	// Production Daily Plan & Stage Assignment routes
	productionAdminAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleOwner, "super_admin")
	productionGeneralAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleOwner, auth.RoleProduction, "super_admin", "staff")

	router.GET("/api/v1/production/daily-plan", productionGeneralAuth, production.HandleGetDailyPlan)
	router.POST("/api/v1/production/daily-plan/assignments", productionAdminAuth, production.HandleCreateAssignment)
	router.PUT("/api/v1/production/daily-plan/assignments/:id", productionAdminAuth, production.HandleUpdateAssignment)
	router.DELETE("/api/v1/production/daily-plan/assignments/:id", productionAdminAuth, production.HandleDeleteAssignment)
	router.PATCH("/api/v1/production/daily-plan/assignments/:id/progress", productionGeneralAuth, production.HandleUpdateAssignmentProgress)
	router.POST("/api/v1/production/daily-plan/assignments/:id/progress", productionGeneralAuth, production.HandleUpdateAssignmentProgress)
	router.GET("/api/v1/production/daily-plan/ready-queue", productionAdminAuth, production.HandleGetReadyOrdersQueue)
	router.GET("/api/v1/production/daily-plan/staff", productionAdminAuth, production.HandleGetAssignableStaff)

	router.GET("/api/v1/orders/track", orders.HandleTrackOrderQuery)
	router.GET("/api/orders/track", orders.HandleTrackOrderQuery)
	router.GET("/api/v1/orders/track/:order_no", orders.HandleGetOrderByOrderNo)
	router.GET("/api/orders/track/:order_no", orders.HandleGetOrderByOrderNo)
	// Order operational actions — require admin/manager/sales/production write access
	router.PUT("/api/orders/:id/deposit", ordersWriteAuth, orders.HandleRecordDeposit)
	router.PUT("/api/orders/:id/status", ordersWriteAuth, orders.HandleUpdateOrderStatus)
	router.PATCH("/api/v1/orders/:id/status", ordersWriteAuth, orders.HandleUpdateOrderStatus)
	router.POST("/api/orders/:id/reverse-stock", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), orders.HandleReverseOrderStock)
	router.POST("/api/v1/orders/:id/reverse-stock", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), orders.HandleReverseOrderStock)
	router.GET("/api/v1/orders/stream", ordersAuth, orders.HandleOrderProgressSSEStream)
	router.GET("/api/v1/orders/:id/job-ticket", ordersAuth, orders.HandleGenerateJobTicketPDF)
	router.GET("/api/v1/orders/by-number/:order_no/job-ticket", ordersAuth, orders.HandleGenerateJobTicketPDF)
	router.POST("/api/v1/orders/:id/preflight-report", artworkAuth, orders.HandleSavePreflightReport)
	router.GET("/api/v1/orders/:id/preflight-report", ordersAuth, orders.HandleGetPreflightReport)

	// Digital Proof Management routes — require authentication
	proofAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RolePrepress)
	router.POST("/api/v1/orders/:id/send-proof", proofAuth, orders.HandleSendProof)
	router.POST("/api/orders/:id/send-proof", proofAuth, orders.HandleSendProof)
	router.POST("/api/v1/orders/:id/proof-action", proofAuth, orders.HandleProofAction)
	router.POST("/api/orders/:id/proof-action", proofAuth, orders.HandleProofAction)
	router.POST("/api/v1/orders/:id/proof", proofAuth, orders.HandleUploadDigitalProof)
	router.POST("/api/orders/:id/proof", proofAuth, orders.HandleUploadDigitalProof)
	router.POST("/api/v1/orders/:id/proof/approve", proofAuth, orders.HandleApproveDigitalProof)
	router.POST("/api/orders/:id/proof/approve", proofAuth, orders.HandleApproveDigitalProof)
	router.POST("/api/v1/orders/:id/proof/reject", proofAuth, orders.HandleRejectDigitalProof)
	router.POST("/api/orders/:id/proof/reject", proofAuth, orders.HandleRejectDigitalProof)
	router.GET("/api/v1/orders/:id/proof", ordersAuth, orders.HandleGetDigitalProof)
	router.GET("/api/orders/:id/proof", ordersAuth, orders.HandleGetDigitalProof)

	// Public Digital Proof Review routes (Secure token-verified)
	router.GET("/api/v1/public/proof/:order_id/:token", orders.HandleGetProofDetails)
	router.POST("/api/v1/public/proof/:order_id/:token/approve", orders.HandleApproveProof)
	router.POST("/api/v1/public/proof/:order_id/:token/reject", orders.HandleRejectProof)
	router.GET("/api/v1/proof/:order_id/:token", orders.HandleGetProofDetails)
	router.POST("/api/v1/proof/:order_id/:token/approve", orders.HandleApproveProof)
	router.POST("/api/v1/proof/:order_id/:token/reject", orders.HandleRejectProof)

	// Public Customer Portal routes
	router.GET("/api/v1/public/customer/tiers", customers.HandlePublicCustomerTiers)
	router.POST("/api/v1/public/customer/auth", customers.HandlePublicCustomerAuth)
	router.GET("/api/v1/public/customer/profile", customers.HandlePublicCustomerProfile)
	router.PUT("/api/v1/public/customer/profile", customers.HandleSavePublicCustomerProfile)
	router.GET("/api/v1/public/customer/orders", customers.HandlePublicCustomerOrders)

	// Admin Notification Settings routes — admin only
	adminSettingsAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager)
	router.GET("/api/v1/admin/notification-config", adminSettingsAuth, settings.HandleGetNotificationConfig)
	router.PUT("/api/v1/admin/notification-config", adminSettingsAuth, settings.HandleUpdateNotificationConfig)
	router.POST("/api/v1/admin/notification-test", adminSettingsAuth, settings.HandleTestNotification)

	// Print Dimension Presets & Shop Defaults routes (Dynamic Sizing & Material Config)
	router.GET("/api/v1/pricing/presets", settings.HandleGetDimensionPresets)
	router.GET("/api/pricing/presets", settings.HandleGetDimensionPresets)
	router.POST("/api/v1/pricing/presets", settings.HandleCreateDimensionPreset)
	router.DELETE("/api/v1/pricing/presets/:id", settings.HandleDeleteDimensionPreset)
	router.GET("/api/v1/settings/defaults", settings.HandleGetShopDefaults)
	router.POST("/api/v1/settings/defaults", settings.HandleSetShopDefaults)

	// Universal Master Data Lookups routes (Paper Types, Surface Finishes, Dimensions, UOM, Binding)
	router.GET("/api/v1/lookups", settings.HandleGetLookups)
	router.GET("/api/lookups", settings.HandleGetLookups)
	router.GET("/api/v1/lookups/:type", settings.HandleGetLookupsByType)
	router.GET("/api/lookups/:type", settings.HandleGetLookupsByType)
	router.POST("/api/v1/admin/lookups", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleCreateLookup)
	router.POST("/api/v1/lookups", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleCreateLookup)
	router.PUT("/api/v1/admin/lookups/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleUpdateLookup)
	router.PUT("/api/v1/lookups/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleUpdateLookup)
	router.DELETE("/api/v1/admin/lookups/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleDeleteLookup)
	router.DELETE("/api/v1/lookups/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleDeleteLookup)

	// Machine Wear Parts routes (Asset maintenance & consumable wear parts)
	router.GET("/api/v1/equipment/:id/wear-parts", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleProduction), settings.HandleGetMachineWearParts)
	router.POST("/api/v1/equipment/:id/wear-parts", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleCreateMachineWearPart)
	router.PUT("/api/v1/equipment/:id/wear-parts/:part_id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleUpdateMachineWearPart)
	router.DELETE("/api/v1/equipment/:id/wear-parts/:part_id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleDeleteMachineWearPart)
	router.POST("/api/v1/equipment/:id/install-part", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), settings.HandleInstallMachineWearPart)
	router.GET("/api/v1/inventory/spare-parts", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleProduction), settings.HandleGetSparePartsInventory)
	router.GET("/api/inventory/spare-parts", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleProduction), settings.HandleGetSparePartsInventory)

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
	router.GET("/api/v1/equipment", inventory.HandleGetEquipment)
	router.POST("/api/equipment", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleCreateEquipment)
	router.POST("/api/v1/equipment", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleCreateEquipment)
	router.PUT("/api/equipment/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleUpdateEquipment)
	router.PUT("/api/v1/equipment/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleUpdateEquipment)
	router.DELETE("/api/equipment/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleDeleteEquipment)
	router.DELETE("/api/v1/equipment/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleDeleteEquipment)

	// HR Employee Management routes (RBAC: Admin only)
	hrAuth := auth.RequireRoles(auth.RoleAdmin)
	router.GET("/api/employees", hrAuth, hr.HandleGetEmployees)
	router.POST("/api/employees", hrAuth, hr.HandleCreateEmployee)
	router.PUT("/api/employees/:id", hrAuth, hr.HandleUpdateEmployee)
	router.DELETE("/api/employees/:id", hrAuth, hr.HandleDeleteEmployee)

	// Supplier Master routes
	suppliersReadAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleFinance)
	router.GET("/api/v1/suppliers", suppliersReadAuth, suppliers.HandleGetSuppliers)
	router.POST("/api/v1/suppliers", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleCreateSupplier)
	router.PUT("/api/v1/suppliers/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleUpdateSupplier)
	router.DELETE("/api/v1/suppliers/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleDeleteSupplier)

	// Purchase Order (PO) & Goods Receipt routes
	poReadAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleFinance)
	router.GET("/api/v1/purchase-orders", poReadAuth, suppliers.HandleGetPOs)
	router.POST("/api/v1/purchase-orders", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleCreatePO)
	router.PUT("/api/v1/purchase-orders/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleUpdatePO)
	router.POST("/api/v1/purchase-orders/:id/send", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleSendPO)
	router.GET("/api/v1/purchase-orders/:id/pdf", poReadAuth, suppliers.HandleGeneratePOPDF)
	router.POST("/api/v1/purchase-orders/:id/receive", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), suppliers.HandleReceiveGoods)

	// Inbound Procurement routes
	invHandler := handler.NewInventoryHandler()
	invHandler.RegisterRoutes(engine)

	// Pricing Template & Dynamic Coverage Engine routes
	pricingHandler := handler.NewPricingHandler()
	pricingHandler.RegisterRoutes(engine)

	router.GET("/api/inbound", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inbound.HandleGetInboundTransactions)
	router.POST("/api/inbound", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inbound.HandleCreateInboundTransaction)
	router.POST("/api/inbound/batch", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inbound.HandleCreateBatchInboundTransaction)
	router.PUT("/api/inbound/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inbound.HandleUpdateInboundTransaction)
	router.DELETE("/api/inbound/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inbound.HandleDeleteInboundTransaction)
	router.GET("/api/inbound/:id/revisions", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inbound.HandleGetInboundRevisions)

	// Phase 1 API v1 Assets & Inbound Procurement routes
	assetReadAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleProduction, auth.RoleFinance)
	router.GET("/api/v1/assets", assetReadAuth, inventory.HandleGetAssetsV1)
	router.GET("/api/v1/assets/:id", assetReadAuth, inventory.HandleGetAssetByIDV1)
	router.POST("/api/v1/assets/inbound", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleInboundAssetV1)
	router.PUT("/api/v1/assets/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleUpdateAssetV1)
	router.DELETE("/api/v1/assets/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleDeleteEquipment)

	// Inventory Material SKU CRUD & Stock Discharge & FIFO Batches routes
	inventoryReadAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleProduction, auth.RoleFinance, auth.RoleSales)
	router.GET("/api/inventory/offcuts", inventoryReadAuth, inventory.HandleGetOffcuts)
	router.POST("/api/inventory/offcuts", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleProduction), inventory.HandleRegisterOffcut)
	router.PUT("/api/inventory/offcuts/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleUpdateOffcut)
	router.DELETE("/api/inventory/offcuts/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleDeleteOffcut)
	router.GET("/api/inventory/batches", inventoryReadAuth, inventory.HandleGetInventoryBatches)
	router.GET("/api/inventory/items", inventoryReadAuth, inventory.HandleGetInventoryItems)
	router.GET("/api/inventory", inventoryReadAuth, inventory.HandleGetInventoryItems)
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
	ppmAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleProduction)
	router.GET("/api/v1/inventory/equipment/health", ppmAuth, inventory.HandleGetEquipmentHealth)
	router.GET("/api/v1/inventory/equipment/maintenance-tickets", ppmAuth, inventory.HandleGetMaintenanceTickets)
	router.POST("/api/v1/inventory/equipment/check-ppm", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleTriggerPPMCheck)
	router.PATCH("/api/v1/inventory/equipment/maintenance-tickets/:id/resolve", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), inventory.HandleResolveMaintenanceTicket)
	router.GET("/api/equipment/health", ppmAuth, inventory.HandleGetEquipmentHealth)
	router.GET("/api/equipment/maintenance-tickets", ppmAuth, inventory.HandleGetMaintenanceTickets)

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
	deliveryReadAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RoleProduction, auth.RoleFinance)
	router.GET("/api/v1/orders/deliveries", deliveryReadAuth, orders.HandleGetDeliveries)
	router.POST("/api/v1/orders/deliveries", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RoleProduction), orders.HandleSaveDelivery)
	router.PUT("/api/v1/orders/deliveries/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RoleProduction), orders.HandleUpdateDelivery)
	router.GET("/api/orders/deliveries", deliveryReadAuth, orders.HandleGetDeliveries)
	router.POST("/api/orders/deliveries", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RoleProduction), orders.HandleSaveDelivery)
	router.PUT("/api/orders/deliveries/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales, auth.RoleProduction), orders.HandleUpdateDelivery)

	// Workflow Template routes
	workflowReadAuth := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleProduction, auth.RolePrepress)
	router.GET("/api/v1/production/templates", workflowReadAuth, orders.HandleGetWorkflowTemplates)
	router.POST("/api/v1/production/templates", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleProduction), orders.HandleSaveWorkflowTemplate)
	router.DELETE("/api/v1/production/templates/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), orders.HandleDeleteWorkflowTemplate)
	router.GET("/api/production/templates", workflowReadAuth, orders.HandleGetWorkflowTemplates)
	router.POST("/api/production/templates", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleProduction), orders.HandleSaveWorkflowTemplate)
	router.DELETE("/api/production/templates/:id", auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), orders.HandleDeleteWorkflowTemplate)


}
