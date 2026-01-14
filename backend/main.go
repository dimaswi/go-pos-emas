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

	// Serve static files for uploads
	r.Static("/uploads", "./uploads")

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

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
			protected.GET("/gold-categories", middleware.RequirePermission("gold-categories.view"), handlers.GetGoldCategories)
			protected.GET("/gold-categories/:id", middleware.RequirePermission("gold-categories.view"), handlers.GetGoldCategory)
			protected.POST("/gold-categories", middleware.RequirePermission("gold-categories.create"), handlers.CreateGoldCategory)
			protected.PUT("/gold-categories/:id", middleware.RequirePermission("gold-categories.update"), handlers.UpdateGoldCategory)
			protected.DELETE("/gold-categories/:id", middleware.RequirePermission("gold-categories.delete"), handlers.DeleteGoldCategory)

			// Products routes
			protected.GET("/products", middleware.RequirePermission("products.view"), handlers.GetProducts)
			protected.GET("/products/:id", middleware.RequirePermission("products.view"), handlers.GetProduct)
			protected.GET("/products/barcode/:barcode", middleware.RequirePermission("products.view"), handlers.GetProductByBarcode)
			protected.POST("/products", middleware.RequirePermission("products.create"), handlers.CreateProduct)
			protected.PUT("/products/:id", middleware.RequirePermission("products.update"), handlers.UpdateProduct)
			protected.DELETE("/products/:id", middleware.RequirePermission("products.delete"), handlers.DeleteProduct)

			// Locations routes (Gudang & Toko)
			protected.GET("/locations", middleware.RequirePermission("locations.view"), handlers.GetLocations)
			protected.GET("/locations/:id", middleware.RequirePermission("locations.view"), handlers.GetLocation)
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
			protected.GET("/members", middleware.RequirePermission("members.view"), handlers.GetMembers)
			protected.GET("/members/:id", middleware.RequirePermission("members.view"), handlers.GetMember)
			protected.GET("/members/code/:code", middleware.RequirePermission("members.view"), handlers.GetMemberByCode)
			protected.POST("/members", middleware.RequirePermission("members.create"), handlers.CreateMember)
			protected.PUT("/members/:id", middleware.RequirePermission("members.update"), handlers.UpdateMember)
			protected.DELETE("/members/:id", middleware.RequirePermission("members.delete"), handlers.DeleteMember)
			protected.POST("/members/:id/points", middleware.RequirePermission("members.update"), handlers.AddMemberPoints)
			protected.POST("/members/recalculate-stats", middleware.RequirePermission("members.update"), handlers.RecalculateMemberStats)

			// Stocks routes
			protected.GET("/stocks", middleware.RequirePermission("stocks.view"), handlers.GetStocks)
			protected.GET("/stocks/by-location", middleware.RequirePermission("stocks.view"), handlers.GetStocksByLocation)
			protected.POST("/stocks", middleware.RequirePermission("stocks.create"), handlers.CreateStock)
			protected.POST("/stocks-mark-printed", middleware.RequirePermission("stocks.update"), handlers.MarkStocksPrinted)
			protected.POST("/stocks/transfer", middleware.RequirePermission("stocks.transfer"), handlers.TransferStock)
			protected.GET("/stocks/serial/:serial", middleware.RequirePermission("stocks.view"), handlers.GetStockBySerial)
			protected.GET("/stocks/box/:box_id/items", middleware.RequirePermission("stocks.view"), handlers.GetStocksByBox)
			protected.GET("/stocks/:id", middleware.RequirePermission("stocks.view"), handlers.GetStock)
			protected.PUT("/stocks/:id", middleware.RequirePermission("stocks.update"), handlers.UpdateStock)
			protected.DELETE("/stocks/:id", middleware.RequirePermission("stocks.delete"), handlers.DeleteStock)
			protected.GET("/stock-transfers", middleware.RequirePermission("stocks.view"), handlers.GetStockTransfers)

			// Transactions routes (POS)
			protected.GET("/transactions", middleware.RequirePermission("transactions.view"), handlers.GetTransactions)
			protected.GET("/transactions/:id", middleware.RequirePermission("transactions.view"), handlers.GetTransaction)
			protected.GET("/transactions/code/:code", middleware.RequirePermission("transactions.view"), handlers.GetTransactionByCode)
			protected.POST("/transactions/sale", middleware.RequirePermission("transactions.sale"), handlers.CreateSale)
			protected.POST("/transactions/purchase", middleware.RequirePermission("transactions.purchase"), handlers.CreatePurchase)
			protected.PUT("/transactions/:id/cancel", middleware.RequirePermission("transactions.cancel"), handlers.CancelTransaction)
			protected.GET("/transactions/daily-summary", middleware.RequirePermission("transactions.view"), handlers.GetDailySummary)

			// Raw Materials routes
			protected.GET("/raw-materials", middleware.RequirePermission("raw-materials.view"), handlers.GetRawMaterials)
			protected.GET("/raw-materials/stats", middleware.RequirePermission("raw-materials.view"), handlers.GetRawMaterialStats)
			protected.GET("/raw-materials/:id", middleware.RequirePermission("raw-materials.view"), handlers.GetRawMaterial)
			protected.POST("/raw-materials", middleware.RequirePermission("raw-materials.create"), handlers.CreateRawMaterial)
			protected.PUT("/raw-materials/:id", middleware.RequirePermission("raw-materials.update"), handlers.UpdateRawMaterial)
			protected.DELETE("/raw-materials/:id", middleware.RequirePermission("raw-materials.delete"), handlers.DeleteRawMaterial)
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
