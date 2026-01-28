package handlers

import (
	"fmt"
	"net/http"
	"starter/backend/database"
	"starter/backend/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetStocks returns all stocks with filters
func GetStocks(c *gin.Context) {
	var stocks []models.Stock
	query := database.DB.Preload("Product").Preload("Product.GoldCategory").
		Preload("Location").Preload("StorageBox")

	// Filter by location_id
	if locationID := c.Query("location_id"); locationID != "" {
		query = query.Where("location_id = ?", locationID)
	}

	// Filter by storage_box_id
	if boxID := c.Query("storage_box_id"); boxID != "" {
		query = query.Where("storage_box_id = ?", boxID)
	}

	// Filter by status
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Filter by product_id
	if productID := c.Query("product_id"); productID != "" {
		query = query.Where("product_id = ?", productID)
	}

	if err := query.Find(&stocks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": stocks})
}

// GetStock returns a single stock item
func GetStock(c *gin.Context) {
	id := c.Param("id")
	var stock models.Stock
	if err := database.DB.Preload("Product").Preload("Product.GoldCategory").
		Preload("Location").Preload("StorageBox").First(&stock, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Stock not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": stock})
}

// GetStockBySerial returns a stock by serial number
func GetStockBySerial(c *gin.Context) {
	serial := c.Param("serial")
	var stock models.Stock
	if err := database.DB.Preload("Product").Preload("Product.GoldCategory").
		Preload("Location").Preload("StorageBox").
		Where("serial_number = ?", serial).First(&stock).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Stock not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": stock})
}

type CreateStockRequest struct {
	ProductID    uint   `json:"product_id" binding:"required"`
	LocationID   uint   `json:"location_id" binding:"required"`
	StorageBoxID uint   `json:"storage_box_id" binding:"required"`
	Quantity     int    `json:"quantity" binding:"required,min=1"`
	SupplierName string `json:"supplier_name"`
	Notes        string `json:"notes"`
}

// CreateStock creates a new stock entry (receiving from distributor)
func CreateStock(c *gin.Context) {
	var req CreateStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify product exists and has gold category
	var product models.Product
	if err := database.DB.Preload("GoldCategory").First(&product, req.ProductID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product not found"})
		return
	}

	// Verify location exists
	var location models.Location
	if err := database.DB.First(&location, req.LocationID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Location not found"})
		return
	}

	// Verify storage box exists and belongs to the location
	var box models.StorageBox
	if err := database.DB.Where("id = ? AND location_id = ?", req.StorageBoxID, req.LocationID).First(&box).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Storage box not found in this location"})
		return
	}

	// Create multiple stock entries based on quantity
	// Harga tidak disimpan di stock - akan dihitung dari gold_category saat dibutuhkan
	now := time.Now()
	timestamp := now.Unix() // Use seconds for shorter serial
	var stocks []models.Stock

	for i := 0; i < req.Quantity; i++ {
		// Generate unique serial number for each item
		serialNumber := generateSerialNumber(product.Barcode, timestamp, i)

		stock := models.Stock{
			ProductID:    req.ProductID,
			LocationID:   req.LocationID,
			StorageBoxID: req.StorageBoxID,
			SerialNumber: serialNumber,
			Status:       models.StockStatusAvailable,
			SupplierName: req.SupplierName,
			ReceivedAt:   &now,
			Notes:        req.Notes,
		}
		stocks = append(stocks, stock)
	}

	// Create stocks one by one to ensure each gets a unique ID
	tx := database.DB.Begin()
	for i := range stocks {
		if err := tx.Create(&stocks[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	tx.Commit()

	// Preload relations for response
	var stockIDs []uint
	for _, s := range stocks {
		stockIDs = append(stockIDs, s.ID)
	}
	database.DB.Preload("Product").Preload("Product.GoldCategory").
		Preload("Location").Preload("StorageBox").Find(&stocks, stockIDs)

	c.JSON(http.StatusCreated, gin.H{"data": stocks, "count": len(stocks)})
}

// generateSerialNumber generates a unique serial number for stock
// Format: 7 chars timestamp (Base36) + 3 chars index (Base36) = 10 chars total
// Uses Unix seconds timestamp for shorter values
func generateSerialNumber(barcode string, timestamp int64, index int) string {
	// Use modulo to keep timestamp in 7 char range for base36
	// 36^7 = 78,364,164,096 - covers all unix timestamps
	shortTimestamp := strconv.FormatInt(timestamp, 36)
	// Ensure max 7 chars (take last 7 if longer)
	if len(shortTimestamp) > 7 {
		shortTimestamp = shortTimestamp[len(shortTimestamp)-7:]
	}
	for len(shortTimestamp) < 7 {
		shortTimestamp = "0" + shortTimestamp
	}

	// Convert index to base36, padded to 3 chars
	// 36^3 = 46,656 items per timestamp
	shortIndex := strconv.FormatInt(int64(index+1), 36)
	for len(shortIndex) < 3 {
		shortIndex = "0" + shortIndex
	}

	return shortTimestamp + shortIndex
}

type UpdateStockRequest struct {
	LocationID   uint               `json:"location_id"`
	StorageBoxID uint               `json:"storage_box_id"`
	Status       models.StockStatus `json:"status"`
	Notes        string             `json:"notes"`
}

// UpdateStock updates stock information
// Harga tidak bisa diupdate karena selalu mengikuti gold_category
func UpdateStock(c *gin.Context) {
	id := c.Param("id")
	var stock models.Stock
	if err := database.DB.First(&stock, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Stock not found"})
		return
	}

	var req UpdateStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.LocationID > 0 {
		stock.LocationID = req.LocationID
	}
	if req.StorageBoxID > 0 {
		stock.StorageBoxID = req.StorageBoxID
	}
	if req.Status != "" {
		stock.Status = req.Status
	}
	if req.Notes != "" {
		stock.Notes = req.Notes
	}

	if err := database.DB.Save(&stock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	database.DB.Preload("Product").Preload("Product.GoldCategory").
		Preload("Location").Preload("StorageBox").First(&stock, stock.ID)
	c.JSON(http.StatusOK, gin.H{"data": stock})
}

// DeleteStock deletes a stock
func DeleteStock(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Stock{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Stock deleted successfully"})
}

// ==================== STOCK TRANSFER ====================

type TransferStockRequest struct {
	StockID      uint   `json:"stock_id" binding:"required"`
	ToLocationID uint   `json:"to_location_id" binding:"required"`
	ToBoxID      uint   `json:"to_box_id" binding:"required"`
	Notes        string `json:"notes"`
}

// TransferStock transfers stock from one location/box to another
func TransferStock(c *gin.Context) {
	var req TransferStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get current user ID
	userID, _ := c.Get("user_id")

	// Get stock
	var stock models.Stock
	if err := database.DB.First(&stock, req.StockID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Stock not found"})
		return
	}

	// Check if stock is available
	if stock.Status != models.StockStatusAvailable {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stock is not available for transfer"})
		return
	}

	// Verify destination location and box
	var toBox models.StorageBox
	if err := database.DB.Where("id = ? AND location_id = ?", req.ToBoxID, req.ToLocationID).First(&toBox).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Destination box not found in specified location"})
		return
	}

	// Create transfer record
	transferNumber := fmt.Sprintf("TRF%d", time.Now().UnixNano()/1000000)
	transfer := models.StockTransfer{
		TransferNumber:  transferNumber,
		StockID:         stock.ID,
		FromLocationID:  stock.LocationID,
		FromBoxID:       stock.StorageBoxID,
		ToLocationID:    req.ToLocationID,
		ToBoxID:         req.ToBoxID,
		TransferredByID: userID.(uint),
		TransferredAt:   time.Now(),
		Notes:           req.Notes,
		Status:          "completed",
	}

	// Begin transaction
	tx := database.DB.Begin()

	if err := tx.Create(&transfer).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update stock location
	stock.LocationID = req.ToLocationID
	stock.StorageBoxID = req.ToBoxID
	if err := tx.Save(&stock).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx.Commit()

	database.DB.Preload("Stock").Preload("FromLocation").Preload("FromBox").
		Preload("ToLocation").Preload("ToBox").Preload("TransferredBy").First(&transfer, transfer.ID)
	c.JSON(http.StatusCreated, gin.H{"data": transfer})
}

// GetStockTransfers returns all stock transfers
func GetStockTransfers(c *gin.Context) {
	var transfers []models.StockTransfer
	query := database.DB.Preload("Stock").Preload("Stock.Product").
		Preload("FromLocation").Preload("FromBox").
		Preload("ToLocation").Preload("ToBox").Preload("TransferredBy")

	// Filter by stock_id
	if stockID := c.Query("stock_id"); stockID != "" {
		query = query.Where("stock_id = ?", stockID)
	}

	// Filter by from_location_id
	if fromID := c.Query("from_location_id"); fromID != "" {
		query = query.Where("from_location_id = ?", fromID)
	}

	// Filter by to_location_id
	if toID := c.Query("to_location_id"); toID != "" {
		query = query.Where("to_location_id = ?", toID)
	}

	if err := query.Order("created_at DESC").Find(&transfers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": transfers})
}

// GetStocksByBox returns all stocks in a specific storage box for barcode printing
func GetStocksByBox(c *gin.Context) {
	boxID := c.Param("box_id")
	var stocks []models.Stock

	query := database.DB.Preload("Product").Preload("Product.GoldCategory").
		Preload("Location").Preload("StorageBox").
		Where("storage_box_id = ?", boxID)

	// Filter by status (default: available)
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	} else {
		query = query.Where("status = ?", "available")
	}

	if err := query.Order("serial_number ASC").Find(&stocks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": stocks})
}

// MarkStocksPrinted marks stocks as barcode printed
type MarkPrintedRequest struct {
	StockIDs []uint `json:"stock_ids" binding:"required"`
}

func MarkStocksPrinted(c *gin.Context) {
	var req MarkPrintedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.StockIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No stock IDs provided"})
		return
	}

	now := time.Now()
	result := database.DB.Model(&models.Stock{}).
		Where("id IN ?", req.StockIDs).
		Updates(map[string]interface{}{
			"barcode_printed":    true,
			"barcode_printed_at": now,
		})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("%d stocks marked as printed", result.RowsAffected),
		"count":   result.RowsAffected,
	})
}

// GetStocksByLocation returns stocks grouped by location with summary
func GetStocksByLocation(c *gin.Context) {
	type CategorySummary struct {
		CategoryName string  `json:"category_name"`
		Count        int64   `json:"count"`
		Weight       float64 `json:"weight"`
	}

	type LocationSummary struct {
		LocationID   uint              `json:"location_id"`
		LocationName string            `json:"location_name"`
		TotalItems   int64             `json:"total_items"`
		TotalWeight  float64           `json:"total_weight"`
		Categories   []CategorySummary `json:"categories"`
	}

	var locations []models.Location
	if err := database.DB.Order("name").Find(&locations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var results []LocationSummary
	for _, loc := range locations {
		// Get total items and weight
		var totalItems int64
		var totalWeight float64

		database.DB.Model(&models.Stock{}).
			Where("location_id = ? AND status = ?", loc.ID, "available").
			Count(&totalItems)

		database.DB.Table("stocks").
			Select("COALESCE(SUM(products.weight), 0)").
			Joins("JOIN products ON products.id = stocks.product_id").
			Where("stocks.location_id = ? AND stocks.status = ?", loc.ID, "available").
			Scan(&totalWeight)

		// Get category breakdown
		var categories []CategorySummary
		rows, err := database.DB.Table("stocks").
			Select("gold_categories.name as category_name, COUNT(*) as count, COALESCE(SUM(products.weight), 0) as weight").
			Joins("JOIN products ON products.id = stocks.product_id").
			Joins("JOIN gold_categories ON gold_categories.id = products.gold_category_id").
			Where("stocks.location_id = ? AND stocks.status = ?", loc.ID, "available").
			Group("gold_categories.name").
			Rows()

		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var cat CategorySummary
				rows.Scan(&cat.CategoryName, &cat.Count, &cat.Weight)
				categories = append(categories, cat)
			}
		}

		results = append(results, LocationSummary{
			LocationID:   loc.ID,
			LocationName: loc.Name,
			TotalItems:   totalItems,
			TotalWeight:  totalWeight,
			Categories:   categories,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": results})
}
