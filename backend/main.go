package main

import (
	"log"
	"starter/backend/config"
	"starter/backend/database"
	"starter/backend/handlers"
	"starter/backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using default configuration")
	}

	// Load config
	cfg := config.Load()

	// Set JWT secret
	middleware.SetJWTSecret(cfg.JWTSecret)

	// Connect to database
	if err := database.Connect(cfg.DatabaseDSN); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.Migrate(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Setup Gin router
	r := gin.Default()

	// CORS middleware - MUST be before any routes
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:5173",
			"http://147.93.104.139:3001",
			"https://147.93.104.139:3001",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60, // 12 hours
	}))

	// Serve static files for uploads
	r.Static("/uploads", "./uploads")

	// Public routes
	api := r.Group("/api")
	{
		api.POST("/auth/login", handlers.Login)
		api.GET("/settings", handlers.GetSettings) // Public access to settings

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/auth/profile", handlers.GetProfile)

			// Settings routes
			protected.PUT("/settings", handlers.UpdateSettings)
			protected.POST("/settings/upload", handlers.UploadLogo)

			// Users routes (with RBAC)
			protected.GET("/users", middleware.RequirePermission("users.view"), handlers.GetUsers)
			protected.GET("/users/:id", middleware.RequirePermission("users.view"), handlers.GetUser)
			protected.POST("/users", middleware.RequirePermission("users.create"), handlers.CreateUser)
			protected.PUT("/users/:id", middleware.RequirePermission("users.update"), handlers.UpdateUser)
			protected.DELETE("/users/:id", middleware.RequirePermission("users.delete"), handlers.DeleteUser)

			// User Location Assignment routes
			protected.GET("/users/:id/locations", middleware.RequirePermission("users.view"), handlers.GetUserLocations)
			protected.POST("/user-locations/assign", middleware.RequirePermission("users.update"), handlers.AssignUserLocation)
			protected.POST("/user-locations/bulk-assign", middleware.RequirePermission("users.update"), handlers.BulkAssignUserLocations)
			protected.DELETE("/users/:id/locations/:location_id", middleware.RequirePermission("users.update"), handlers.RemoveUserLocation)
			protected.PUT("/users/:id/locations/:location_id/default", middleware.RequirePermission("users.update"), handlers.SetDefaultLocation)
			protected.GET("/my-locations", handlers.GetMyLocations) // No permission needed - user can see their own locations

			// Roles routes (with RBAC)
			protected.GET("/roles", middleware.RequirePermission("roles.view"), handlers.GetRoles)
			protected.GET("/roles/:id", middleware.RequirePermission("roles.view"), handlers.GetRole)
			protected.POST("/roles", middleware.RequirePermission("roles.create"), handlers.CreateRole)
			protected.PUT("/roles/:id", middleware.RequirePermission("roles.update"), handlers.UpdateRole)
			protected.DELETE("/roles/:id", middleware.RequirePermission("roles.delete"), handlers.DeleteRole)

			// Permissions routes
			protected.GET("/permissions", middleware.RequirePermission("permissions.view"), handlers.GetPermissions)
			protected.GET("/permissions/by-module", middleware.RequirePermission("permissions.view"), handlers.GetPermissionsByModule)
			protected.GET("/permissions/:id", middleware.RequirePermission("permissions.view"), handlers.GetPermission)
			protected.POST("/permissions", middleware.RequirePermission("permissions.create"), handlers.CreatePermission)
			protected.PUT("/permissions/:id", middleware.RequirePermission("permissions.update"), handlers.UpdatePermission)
			protected.DELETE("/permissions/:id", middleware.RequirePermission("permissions.delete"), handlers.DeletePermission)

			// Gold Categories routes
			protected.GET("/gold-categories", middleware.RequireAnyPermission("gold-categories.view", "pos.view-gold-categories"), handlers.GetGoldCategories)
			protected.GET("/gold-categories/:id", middleware.RequireAnyPermission("gold-categories.view", "pos.view-gold-categories"), handlers.GetGoldCategory)
			protected.POST("/gold-categories", middleware.RequirePermission("gold-categories.create"), handlers.CreateGoldCategory)
			protected.PUT("/gold-categories/:id", middleware.RequirePermission("gold-categories.update"), handlers.UpdateGoldCategory)
			protected.DELETE("/gold-categories/:id", middleware.RequirePermission("gold-categories.delete"), handlers.DeleteGoldCategory)

			// Price Update routes (daily gold price update)
			protected.GET("/price-update/check", middleware.RequireAnyPermission("gold-categories.view", "pos.view-gold-categories"), handlers.CheckPriceUpdateNeeded)
			protected.POST("/price-update/bulk", middleware.RequireAnyPermission("gold-categories.update", "pos.update-gold-prices"), handlers.BulkUpdatePrices)
			protected.GET("/price-update/logs", middleware.RequireAnyPermission("gold-categories.view", "pos.view-gold-categories"), handlers.GetPriceUpdateLogs)
			protected.GET("/price-update/logs/:id", middleware.RequireAnyPermission("gold-categories.view", "pos.view-gold-categories"), handlers.GetPriceUpdateLog)

			// Products routes
			protected.GET("/products", middleware.RequireAnyPermission("products.view", "pos.view-products"), handlers.GetProducts)
			protected.GET("/products/:id", middleware.RequireAnyPermission("products.view", "pos.view-products"), handlers.GetProduct)
			protected.GET("/products/barcode/:barcode", middleware.RequireAnyPermission("products.view", "pos.view-products"), handlers.GetProductByBarcode)
			protected.POST("/products", middleware.RequirePermission("products.create"), handlers.CreateProduct)
			protected.PUT("/products/:id", middleware.RequirePermission("products.update"), handlers.UpdateProduct)
			protected.DELETE("/products/:id", middleware.RequirePermission("products.delete"), handlers.DeleteProduct)

			// Locations routes (Gudang & Toko)
			protected.GET("/locations", middleware.RequireAnyPermission("locations.view", "pos.view-locations"), handlers.GetLocations)
			protected.GET("/locations/:id", middleware.RequireAnyPermission("locations.view", "pos.view-locations"), handlers.GetLocation)
			protected.POST("/locations", middleware.RequirePermission("locations.create"), handlers.CreateLocation)
			protected.PUT("/locations/:id", middleware.RequirePermission("locations.update"), handlers.UpdateLocation)
			protected.DELETE("/locations/:id", middleware.RequirePermission("locations.delete"), handlers.DeleteLocation)

			// Storage Boxes routes
			protected.GET("/storage-boxes", middleware.RequirePermission("locations.view"), handlers.GetStorageBoxes)
			protected.GET("/storage-boxes/:id", middleware.RequirePermission("locations.view"), handlers.GetStorageBox)
			protected.POST("/storage-boxes", middleware.RequirePermission("locations.create"), handlers.CreateStorageBox)
			protected.PUT("/storage-boxes/:id", middleware.RequirePermission("locations.update"), handlers.UpdateStorageBox)
			protected.DELETE("/storage-boxes/:id", middleware.RequirePermission("locations.delete"), handlers.DeleteStorageBox)

			// Members routes
			protected.GET("/members", middleware.RequireAnyPermission("members.view", "pos.view-members"), handlers.GetMembers)
			protected.GET("/members/:id", middleware.RequireAnyPermission("members.view", "pos.view-members"), handlers.GetMember)
			protected.GET("/members/code/:code", middleware.RequireAnyPermission("members.view", "pos.view-members"), handlers.GetMemberByCode)
			protected.POST("/members", middleware.RequireAnyPermission("members.create", "pos.create-members"), handlers.CreateMember)
			protected.PUT("/members/:id", middleware.RequireAnyPermission("members.update", "pos.update-members"), handlers.UpdateMember)
			protected.DELETE("/members/:id", middleware.RequireAnyPermission("members.delete", "pos.delete-members"), handlers.DeleteMember)
			protected.POST("/members/:id/points", middleware.RequireAnyPermission("members.update", "pos.update-members"), handlers.AddMemberPoints)
			protected.POST("/members/recalculate-stats", middleware.RequireAnyPermission("members.update", "pos.update-members"), handlers.RecalculateMemberStats)
			// Stocks routes
			protected.GET("/stocks", middleware.RequireAnyPermission("stocks.view", "pos.view-stocks"), handlers.GetStocks)
			protected.GET("/stocks/by-location", middleware.RequireAnyPermission("stocks.view", "pos.view-stocks"), handlers.GetStocksByLocation)
			protected.POST("/stocks", middleware.RequirePermission("stocks.create"), handlers.CreateStock)
			protected.POST("/stocks-mark-printed", middleware.RequireAnyPermission("stocks.update", "pos.update-stocks"), handlers.MarkStocksPrinted)
			protected.POST("/stocks/transfer", middleware.RequirePermission("stocks.transfer"), handlers.TransferStock)
			protected.GET("/stocks/serial/:serial", middleware.RequireAnyPermission("stocks.view", "pos.view-stocks"), handlers.GetStockBySerial)
			protected.GET("/stocks/box/:box_id/items", middleware.RequireAnyPermission("stocks.view", "pos.view-stocks"), handlers.GetStocksByBox)
			protected.GET("/stocks/:id", middleware.RequireAnyPermission("stocks.view", "pos.view-stocks"), handlers.GetStock)
			protected.PUT("/stocks/:id", middleware.RequireAnyPermission("stocks.update", "pos.update-stocks"), handlers.UpdateStock)
			protected.DELETE("/stocks/:id", middleware.RequirePermission("stocks.delete"), handlers.DeleteStock)
			protected.GET("/stock-transfers", middleware.RequirePermission("stocks.view"), handlers.GetStockTransfers)

			// Transactions routes (POS)
			protected.GET("/transactions", middleware.RequirePermission("transactions.view"), handlers.GetTransactions)
			protected.GET("/transactions/my", handlers.GetMyTransactions) // Filtered by user's assigned locations
			protected.GET("/transactions/:id", middleware.RequirePermission("transactions.view"), handlers.GetTransaction)
			protected.GET("/transactions/code/:code", middleware.RequirePermission("transactions.view"), handlers.GetTransactionByCode)
			protected.POST("/transactions/sale", middleware.RequirePermission("transactions.sale"), handlers.CreateSale)
			protected.POST("/transactions/purchase", middleware.RequirePermission("transactions.purchase"), handlers.CreatePurchase)
			protected.PUT("/transactions/:id/cancel", middleware.RequirePermission("transactions.cancel"), handlers.CancelTransaction)
			protected.GET("/transactions/daily-summary", middleware.RequirePermission("transactions.view"), handlers.GetDailySummary)

			// Dashboard - accessible by all logged in users (filtered by their assigned locations)
			protected.GET("/dashboard", handlers.GetUserDashboard)

			// Raw Materials routes
			protected.GET("/raw-materials", middleware.RequirePermission("raw-materials.view"), handlers.GetRawMaterials)
			protected.GET("/raw-materials/stats", middleware.RequirePermission("raw-materials.view"), handlers.GetRawMaterialStats)
			protected.GET("/raw-materials/:id", middleware.RequirePermission("raw-materials.view"), handlers.GetRawMaterial)
			protected.POST("/raw-materials", middleware.RequirePermission("raw-materials.create"), handlers.CreateRawMaterial)
			protected.PUT("/raw-materials/:id", middleware.RequirePermission("raw-materials.update"), handlers.UpdateRawMaterial)
			protected.DELETE("/raw-materials/:id", middleware.RequirePermission("raw-materials.delete"), handlers.DeleteRawMaterial)

			// Reports routes
			reports := protected.Group("/reports")
			{
				// Dashboard Summary
				reports.GET("/dashboard", middleware.RequirePermission("reports.view"), handlers.GetDashboardSummary)

				// Transaction Reports
				reports.GET("/transactions", middleware.RequirePermission("reports.view"), handlers.GetTransactionReport)
				reports.GET("/transactions/cashier", middleware.RequirePermission("reports.view"), handlers.GetCashierReport)
				reports.GET("/transactions/location", middleware.RequirePermission("reports.view"), handlers.GetLocationReport)

				// Inventory/Stock Reports
				reports.GET("/stocks/location", middleware.RequirePermission("reports.view"), handlers.GetStockLocationReport)
				reports.GET("/stocks/category", middleware.RequirePermission("reports.view"), handlers.GetStockCategoryReport)
				reports.GET("/stocks/transfer", middleware.RequirePermission("reports.view"), handlers.GetStockTransferReport)
				reports.GET("/stocks/sold", middleware.RequirePermission("reports.view"), handlers.GetSoldStockReport)
				reports.GET("/raw-materials", middleware.RequirePermission("reports.view"), handlers.GetRawMaterialReport)

				// Financial Reports
				reports.GET("/financial/summary", middleware.RequirePermission("reports.view"), handlers.GetFinancialSummary)
				reports.GET("/financial/revenue", middleware.RequirePermission("reports.view"), handlers.GetLocationRevenue)
				reports.GET("/financial/payment-methods", middleware.RequirePermission("reports.view"), handlers.GetPaymentMethodReport)

				// Member Reports
				reports.GET("/members/transactions", middleware.RequirePermission("reports.view"), handlers.GetMemberTransactionReport)
				reports.GET("/members/points", middleware.RequirePermission("reports.view"), handlers.GetMemberPointsReport)
				reports.GET("/members/top", middleware.RequirePermission("reports.view"), handlers.GetTopMembersReport)

				// Gold Price Reports
				reports.GET("/prices/history", middleware.RequirePermission("reports.view"), handlers.GetPriceHistoryReport)
				reports.GET("/prices/daily", middleware.RequirePermission("reports.view"), handlers.GetDailyPriceReport)
				reports.GET("/prices/current", middleware.RequirePermission("reports.view"), handlers.GetCurrentPriceReport)
			}
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	log.Printf("Server starting on port %s...", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
