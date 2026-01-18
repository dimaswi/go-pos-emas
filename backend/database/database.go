package database

import (
	"log"
	"starter/backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(dsn string) error {
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}

	log.Println("Database connected successfully")
	return nil
}

func Migrate() error {
	// Drop old unique indexes that don't account for soft delete
	// This is necessary because GORM AutoMigrate won't update existing indexes
	dropOldIndexes()

	// Auto-migrate all models with proper order for foreign key dependencies
	err := DB.AutoMigrate(
		&models.Role{},           // First, roles
		&models.Permission{},     // Then permissions
		&models.RolePermission{}, // Junction table
		&models.User{},           // Then users (depends on roles)
		&models.Setting{},        // Settings
		// POS Models
		&models.GoldCategory{},    // Gold categories
		&models.Product{},         // Products
		&models.Location{},        // Locations (gudang/toko)
		&models.StorageBox{},      // Storage boxes
		&models.UserLocation{},    // User-Location assignments (employee to store)
		&models.Member{},          // Members
		&models.Stock{},           // Stock
		&models.StockTransfer{},   // Stock transfers
		&models.RawMaterial{},     // Raw materials
		&models.Transaction{},     // Transactions
		&models.TransactionItem{}, // Transaction items
		&models.PurchaseItem{},    // Purchase items
		// Price Update Tracking
		&models.PriceUpdateLog{}, // Price update logs
		&models.PriceDetail{},    // Price update details
	)

	if err != nil {
		return err
	}

	// Create partial unique indexes for soft delete compatibility
	createPartialUniqueIndexes()

	log.Println("Database migrated successfully")
	return SeedData()
}

// dropOldIndexes drops old unique indexes that don't account for soft delete
// This only runs once - when there are old indexes to clean up
func dropOldIndexes() {
	// Check if we need to clean up old indexes
	// We look for any unique index on these columns that is NOT a partial index (doesn't have _partial suffix)
	var oldIndexCount int64
	DB.Raw(`
		SELECT COUNT(*) FROM pg_indexes
		WHERE indexname IN (
			'idx_roles_name', 'idx_permissions_name', 'idx_users_email', 'idx_users_username',
			'idx_gold_categories_code', 'idx_products_barcode', 'idx_locations_code',
			'idx_members_member_code', 'idx_stocks_serial_number', 'idx_stock_transfers_transfer_number',
			'idx_raw_materials_code', 'idx_transactions_transaction_code',
			'idx_roles_name_deleted', 'idx_permissions_name_deleted', 'idx_users_email_deleted',
			'idx_users_username_deleted', 'idx_gold_categories_code_deleted', 'idx_products_barcode_deleted',
			'idx_locations_code_deleted', 'idx_members_member_code_deleted', 'idx_stocks_serial_number_deleted',
			'idx_stock_transfers_transfer_number_deleted', 'idx_raw_materials_code_deleted',
			'idx_transactions_transaction_code_deleted'
		)
	`).Scan(&oldIndexCount)

	// If no old indexes found, skip cleanup
	if oldIndexCount == 0 {
		return
	}

	log.Printf("Found %d old indexes to clean up", oldIndexCount)

	// List of table.column pairs that need unique index cleanup
	columnsToClean := []struct {
		table  string
		column string
	}{
		{"roles", "name"},
		{"permissions", "name"},
		{"users", "email"},
		{"users", "username"},
		{"gold_categories", "code"},
		{"products", "barcode"},
		{"locations", "code"},
		{"members", "member_code"},
		{"stocks", "serial_number"},
		{"stock_transfers", "transfer_number"},
		{"raw_materials", "code"},
		{"transactions", "transaction_code"},
	}

	for _, col := range columnsToClean {
		// Drop all indexes on this column (except primary key and partial indexes)
		dropIndexesOnColumn(col.table, col.column)
	}

	log.Println("Dropped old unique indexes")
}

// dropIndexesOnColumn finds and drops all indexes on a specific column (except partial indexes)
func dropIndexesOnColumn(tableName, columnName string) {
	// Query to find all indexes on this column (excluding partial indexes with _partial suffix)
	var indexes []struct {
		IndexName string
	}

	// Find indexes from pg_indexes - exclude _partial indexes (our new ones)
	DB.Raw(`
		SELECT indexname as index_name
		FROM pg_indexes
		WHERE tablename = ?
		AND indexdef LIKE '%' || ? || '%'
		AND indexname != ?
		AND indexname NOT LIKE '%_partial'
	`, tableName, columnName, tableName+"_pkey").Scan(&indexes)

	for _, idx := range indexes {
		sql := "DROP INDEX IF EXISTS " + idx.IndexName
		if err := DB.Exec(sql).Error; err != nil {
			log.Printf("Warning: Failed to drop index %s: %v", idx.IndexName, err)
		} else {
			log.Printf("Dropped index: %s", idx.IndexName)
		}
	}

	// Also try to drop unique constraints
	var constraints []struct {
		ConstraintName string
	}

	DB.Raw(`
		SELECT con.conname as constraint_name
		FROM pg_constraint con
		JOIN pg_class rel ON rel.oid = con.conrelid
		JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
		WHERE rel.relname = ?
		AND att.attname = ?
		AND con.contype = 'u'
	`, tableName, columnName).Scan(&constraints)

	for _, con := range constraints {
		sql := "ALTER TABLE " + tableName + " DROP CONSTRAINT IF EXISTS " + con.ConstraintName
		if err := DB.Exec(sql).Error; err != nil {
			log.Printf("Warning: Failed to drop constraint %s: %v", con.ConstraintName, err)
		} else {
			log.Printf("Dropped constraint: %s", con.ConstraintName)
		}
	}
}

// createPartialUniqueIndexes creates partial unique indexes that only apply to non-deleted records
func createPartialUniqueIndexes() {
	// PostgreSQL partial unique indexes for soft delete compatibility
	// These ensure uniqueness only for records where deleted_at IS NULL

	// Define indexes with their names and create statements
	partialIndexes := []struct {
		name   string
		create string
	}{
		{"idx_roles_name_partial", `CREATE UNIQUE INDEX idx_roles_name_partial ON roles(name) WHERE deleted_at IS NULL`},
		{"idx_permissions_name_partial", `CREATE UNIQUE INDEX idx_permissions_name_partial ON permissions(name) WHERE deleted_at IS NULL`},
		{"idx_users_email_partial", `CREATE UNIQUE INDEX idx_users_email_partial ON users(email) WHERE deleted_at IS NULL`},
		{"idx_users_username_partial", `CREATE UNIQUE INDEX idx_users_username_partial ON users(username) WHERE deleted_at IS NULL`},
		{"idx_gold_categories_code_partial", `CREATE UNIQUE INDEX idx_gold_categories_code_partial ON gold_categories(code) WHERE deleted_at IS NULL`},
		{"idx_products_barcode_partial", `CREATE UNIQUE INDEX idx_products_barcode_partial ON products(barcode) WHERE deleted_at IS NULL`},
		{"idx_locations_code_partial", `CREATE UNIQUE INDEX idx_locations_code_partial ON locations(code) WHERE deleted_at IS NULL`},
		{"idx_members_member_code_partial", `CREATE UNIQUE INDEX idx_members_member_code_partial ON members(member_code) WHERE deleted_at IS NULL`},
		{"idx_stocks_serial_number_partial", `CREATE UNIQUE INDEX idx_stocks_serial_number_partial ON stocks(serial_number) WHERE deleted_at IS NULL`},
		{"idx_stock_transfers_transfer_number_partial", `CREATE UNIQUE INDEX idx_stock_transfers_transfer_number_partial ON stock_transfers(transfer_number) WHERE deleted_at IS NULL`},
		{"idx_raw_materials_code_partial", `CREATE UNIQUE INDEX idx_raw_materials_code_partial ON raw_materials(code) WHERE deleted_at IS NULL`},
		{"idx_transactions_transaction_code_partial", `CREATE UNIQUE INDEX idx_transactions_transaction_code_partial ON transactions(transaction_code) WHERE deleted_at IS NULL`},
		{"idx_user_locations_user_location_partial", `CREATE UNIQUE INDEX idx_user_locations_user_location_partial ON user_locations(user_id, location_id) WHERE deleted_at IS NULL`},
	}

	for _, idx := range partialIndexes {
		// Check if index already exists
		var count int64
		DB.Raw(`SELECT COUNT(*) FROM pg_indexes WHERE indexname = ?`, idx.name).Scan(&count)

		if count > 0 {
			// Index already exists, skip
			continue
		}

		// Create the partial unique index
		if err := DB.Exec(idx.create).Error; err != nil {
			log.Printf("Warning: Failed to create index %s: %v", idx.name, err)
		} else {
			log.Printf("Created partial unique index: %s", idx.name)
		}
	}
}

// CleanMigrate drops all tables and recreates them for fresh database structure
func CleanMigrate() error {
	// Drop tables in reverse order to handle foreign key constraints
	DB.Exec("DROP TABLE IF EXISTS role_permissions CASCADE")
	DB.Exec("DROP TABLE IF EXISTS users CASCADE")
	DB.Exec("DROP TABLE IF EXISTS permissions CASCADE")
	DB.Exec("DROP TABLE IF EXISTS roles CASCADE")
	DB.Exec("DROP TABLE IF EXISTS settings CASCADE")

	log.Println("Dropped existing tables for clean migration")

	// Now run normal migration
	return Migrate()
}

func SeedData() error {
	// Seed granular permissions that match frontend permission checks
	permissions := []models.Permission{
		// Users Management
		{Name: "users.view", Module: "User Management", Category: "Users", Description: "View users list and details", Actions: `["read"]`},
		{Name: "users.create", Module: "User Management", Category: "Users", Description: "Create new users", Actions: `["create"]`},
		{Name: "users.update", Module: "User Management", Category: "Users", Description: "Update existing users", Actions: `["update"]`},
		{Name: "users.delete", Module: "User Management", Category: "Users", Description: "Delete users", Actions: `["delete"]`},

		// Roles Management
		{Name: "roles.view", Module: "Role Management", Category: "Roles", Description: "View roles list and details", Actions: `["read"]`},
		{Name: "roles.create", Module: "Role Management", Category: "Roles", Description: "Create new roles", Actions: `["create"]`},
		{Name: "roles.update", Module: "Role Management", Category: "Roles", Description: "Update existing roles", Actions: `["update"]`},
		{Name: "roles.delete", Module: "Role Management", Category: "Roles", Description: "Delete roles", Actions: `["delete"]`},
		{Name: "roles.assign_permissions", Module: "Role Management", Category: "Roles", Description: "Assign permissions to roles", Actions: `["assign"]`},

		// Permissions Management
		{Name: "permissions.view", Module: "Permission Management", Category: "Permissions", Description: "View permissions list and details", Actions: `["read"]`},
		{Name: "permissions.create", Module: "Permission Management", Category: "Permissions", Description: "Create new permissions", Actions: `["create"]`},
		{Name: "permissions.update", Module: "Permission Management", Category: "Permissions", Description: "Update existing permissions", Actions: `["update"]`},
		{Name: "permissions.delete", Module: "Permission Management", Category: "Permissions", Description: "Delete permissions", Actions: `["delete"]`},

		// System & Dashboard
		{Name: "dashboard.view", Module: "Dashboard", Category: "Analytics", Description: "Access dashboard and reports", Actions: `["read"]`},
		{Name: "settings.view", Module: "System Settings", Category: "Settings", Description: "View system settings", Actions: `["read"]`},
		{Name: "settings.update", Module: "System Settings", Category: "Settings", Description: "Update system settings", Actions: `["update"]`},
		{Name: "profile.view", Module: "Profile Management", Category: "Account", Description: "View own profile", Actions: `["read"]`},
		{Name: "profile.update", Module: "Profile Management", Category: "Account", Description: "Update own profile", Actions: `["update"]`},

		// Gold Categories Management
		{Name: "gold-categories.view", Module: "Master Data", Category: "Gold Categories", Description: "View gold categories list and details", Actions: `["read"]`},
		{Name: "gold-categories.create", Module: "Master Data", Category: "Gold Categories", Description: "Create new gold categories", Actions: `["create"]`},
		{Name: "gold-categories.update", Module: "Master Data", Category: "Gold Categories", Description: "Update existing gold categories", Actions: `["update"]`},
		{Name: "gold-categories.delete", Module: "Master Data", Category: "Gold Categories", Description: "Delete gold categories", Actions: `["delete"]`},

		// Products Management
		{Name: "products.view", Module: "Master Data", Category: "Products", Description: "View products list and details", Actions: `["read"]`},
		{Name: "products.create", Module: "Master Data", Category: "Products", Description: "Create new products", Actions: `["create"]`},
		{Name: "products.update", Module: "Master Data", Category: "Products", Description: "Update existing products", Actions: `["update"]`},
		{Name: "products.delete", Module: "Master Data", Category: "Products", Description: "Delete products", Actions: `["delete"]`},

		// Locations Management (Gudang & Toko)
		{Name: "locations.view", Module: "Master Data", Category: "Locations", Description: "View locations and storage boxes", Actions: `["read"]`},
		{Name: "locations.create", Module: "Master Data", Category: "Locations", Description: "Create new locations and storage boxes", Actions: `["create"]`},
		{Name: "locations.update", Module: "Master Data", Category: "Locations", Description: "Update existing locations and storage boxes", Actions: `["update"]`},
		{Name: "locations.delete", Module: "Master Data", Category: "Locations", Description: "Delete locations and storage boxes", Actions: `["delete"]`},

		// Members Management
		{Name: "members.view", Module: "Member Management", Category: "Members", Description: "View members list and details", Actions: `["read"]`},
		{Name: "members.create", Module: "Member Management", Category: "Members", Description: "Create new members", Actions: `["create"]`},
		{Name: "members.update", Module: "Member Management", Category: "Members", Description: "Update existing members", Actions: `["update"]`},
		{Name: "members.delete", Module: "Member Management", Category: "Members", Description: "Delete members", Actions: `["delete"]`},

		// Stocks Management
		{Name: "stocks.view", Module: "Inventory", Category: "Stocks", Description: "View stocks list and details", Actions: `["read"]`},
		{Name: "stocks.create", Module: "Inventory", Category: "Stocks", Description: "Create new stock entries", Actions: `["create"]`},
		{Name: "stocks.update", Module: "Inventory", Category: "Stocks", Description: "Update existing stocks", Actions: `["update"]`},
		{Name: "stocks.delete", Module: "Inventory", Category: "Stocks", Description: "Delete stocks", Actions: `["delete"]`},
		{Name: "stocks.transfer", Module: "Inventory", Category: "Stocks", Description: "Transfer stocks between locations", Actions: `["transfer"]`},

		// Raw Materials Management (Bahan Baku)
		{Name: "raw-materials.view", Module: "Inventory", Category: "Raw Materials", Description: "View raw materials list and details", Actions: `["read"]`},
		{Name: "raw-materials.create", Module: "Inventory", Category: "Raw Materials", Description: "Create new raw material entries", Actions: `["create"]`},
		{Name: "raw-materials.update", Module: "Inventory", Category: "Raw Materials", Description: "Update existing raw materials", Actions: `["update"]`},
		{Name: "raw-materials.delete", Module: "Inventory", Category: "Raw Materials", Description: "Delete raw materials", Actions: `["delete"]`},

		// Transactions Management (POS)
		{Name: "transactions.view", Module: "POS", Category: "Transactions", Description: "View transactions list and details", Actions: `["read"]`},
		{Name: "transactions.create", Module: "POS", Category: "Transactions", Description: "Create new transactions (sale/purchase)", Actions: `["create"]`},
		{Name: "transactions.sale", Module: "POS", Category: "Transactions", Description: "Create sale transactions (Penjualan)", Actions: `["create"]`},
		{Name: "transactions.purchase", Module: "POS", Category: "Transactions", Description: "Create purchase/deposit transactions (Setor Emas)", Actions: `["create"]`},
		{Name: "transactions.cancel", Module: "POS", Category: "Transactions", Description: "Cancel transactions", Actions: `["cancel"]`},

		// POS View Permissions (untuk karyawan yang butuh akses POS tanpa akses master data)
		{Name: "pos.view-products", Module: "POS", Category: "POS Access", Description: "View products for POS operations", Actions: `["read"]`},
		{Name: "pos.view-stocks", Module: "POS", Category: "POS Access", Description: "View stocks for POS operations", Actions: `["read"]`},
		{Name: "pos.view-gold-categories", Module: "POS", Category: "POS Access", Description: "View gold categories and prices for POS operations", Actions: `["read"]`},
		{Name: "pos.view-locations", Module: "POS", Category: "POS Access", Description: "View locations for POS operations", Actions: `["read"]`},
		{Name: "pos.update-gold-prices", Module: "POS", Category: "POS Access", Description: "Update daily gold prices for POS operations", Actions: `["update"]`},
		{Name: "pos.update-stocks", Module: "POS", Category: "POS Access", Description: "Update stocks for POS operations", Actions: `["update"]`},
		{Name: "pos.view-members", Module: "POS", Category: "POS Access", Description: "View members for POS operations", Actions: `["read"]`},
		{Name: "pos.create-members", Module: "POS", Category: "POS Access", Description: "Create members for POS operations", Actions: `["create"]`},
		{Name: "pos.update-members", Module: "POS", Category: "POS Access", Description: "Update members for POS operations", Actions: `["update"]`},
		{Name: "pos.delete-members", Module: "POS", Category: "POS Access", Description: "Delete members for POS operations", Actions: `["delete"]`},
		// Reports (Laporan)
		{Name: "reports.view", Module: "Reports", Category: "Reports", Description: "View all reports (transactions, inventory, financial, members, prices)", Actions: `["read"]`},
		{Name: "reports.export", Module: "Reports", Category: "Reports", Description: "Export reports to PDF/Excel", Actions: `["export"]`},
	}

	for _, perm := range permissions {
		DB.Where(models.Permission{Name: perm.Name}).FirstOrCreate(&perm)
	}

	// Create default roles
	var adminRole models.Role
	DB.Where(models.Role{Name: "admin"}).FirstOrCreate(&adminRole, models.Role{
		Name:        "admin",
		Description: "Administrator with full access",
	})

	var userRole models.Role
	DB.Where(models.Role{Name: "user"}).FirstOrCreate(&userRole, models.Role{
		Name:        "user",
		Description: "Regular user with limited access",
	})

	// Assign all permissions to admin role
	var allPermissions []models.Permission
	DB.Find(&allPermissions)
	if len(allPermissions) > 0 {
		DB.Model(&adminRole).Association("Permissions").Replace(allPermissions)
	}

	// Assign limited permissions to user role
	var limitedPermissions []models.Permission
	DB.Where("name IN ?", []string{
		"profile.view",
		"profile.update",
		"dashboard.view",
		"pos.view-products",
		"pos.view-stocks",
		"pos.view-gold-categories",
		"pos.view-locations",
		"pos.update-gold-prices",
		"pos.update-stocks",
		"transactions.view",
		"transactions.create",
		"transactions.sale",
		"transactions.purchase",
		"transactions.cancel",
		"pos.view-members",
		"pos.create-members",
		"pos.update-members",
		"pos.delete-members",
	}).Find(&limitedPermissions)
	if len(limitedPermissions) > 0 {
		DB.Model(&userRole).Association("Permissions").Replace(limitedPermissions)
	}

	// Create default admin user
	var adminUser models.User
	result := DB.Where(models.User{Email: "admin@pos.com"}).FirstOrCreate(&adminUser, models.User{
		Email:    "admin@pos.com",
		Username: "admin",
		FullName: "System Administrator",
		IsActive: true,
		RoleID:   adminRole.ID,
	})

	if result.RowsAffected > 0 {
		adminUser.HashPassword("admin123")
		DB.Save(&adminUser)
		log.Println("Default admin user created: admin@pos.com / admin123")
	}

	// Create default settings
	defaultSettings := []models.Setting{
		{Key: "app_name", Value: "StarterKits"},
		{Key: "app_subtitle", Value: "Hospital System"},
	}

	for _, setting := range defaultSettings {
		DB.Where(models.Setting{Key: setting.Key}).FirstOrCreate(&setting)
	}

	return nil
}
