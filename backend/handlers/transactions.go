package handlers

import (
	"fmt"
	"net/http"
	"starter/backend/database"
	"starter/backend/models"
	"time"

	"github.com/gin-gonic/gin"
)

// GetTransactions returns all transactions
func GetTransactions(c *gin.Context) {
	var transactions []models.Transaction
	query := database.DB.Preload("Member").Preload("Location").Preload("Cashier").Preload("Items")

	// Filter by type
	if txType := c.Query("type"); txType != "" {
		query = query.Where("type = ?", txType)
	}

	// Filter by location_id
	if locationID := c.Query("location_id"); locationID != "" {
		query = query.Where("location_id = ?", locationID)
	}

	// Filter by member_id
	if memberID := c.Query("member_id"); memberID != "" {
		query = query.Where("member_id = ?", memberID)
	}

	// Filter by status
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Filter by date range
	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("transaction_date >= ?", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("transaction_date <= ?", endDate)
	}

	if err := query.Order("created_at DESC").Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": transactions})
}

// GetTransaction returns a single transaction with all details
func GetTransaction(c *gin.Context) {
	id := c.Param("id")
	var transaction models.Transaction
	if err := database.DB.Preload("Member").Preload("Location").Preload("Cashier").
		Preload("Items").Preload("Items.Stock").Preload("Items.Stock.Product").
		Preload("Items.GoldCategory").First(&transaction, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": transaction})
}

// GetTransactionByCode returns a transaction by its code
func GetTransactionByCode(c *gin.Context) {
	code := c.Param("code")
	var transaction models.Transaction
	if err := database.DB.Preload("Member").Preload("Location").Preload("Cashier").
		Preload("Items").Preload("Items.Stock").Preload("Items.Stock.Product").
		Where("transaction_code = ?", code).First(&transaction).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": transaction})
}

// ==================== SALE TRANSACTION ====================

type SaleItemRequest struct {
	StockID  uint    `json:"stock_id" binding:"required"`
	Discount float64 `json:"discount"`
	Notes    string  `json:"notes"`
}

type CreateSaleRequest struct {
	LocationID      uint              `json:"location_id" binding:"required"`
	MemberID        *uint             `json:"member_id"`
	CustomerName    string            `json:"customer_name"`
	CustomerPhone   string            `json:"customer_phone"`
	Items           []SaleItemRequest `json:"items" binding:"required,min=1"`
	DiscountPercent float64           `json:"discount_percent"`
	Discount        float64           `json:"discount"`
	Tax             float64           `json:"tax"`
	PaymentMethod   string            `json:"payment_method" binding:"required"`
	PaidAmount      float64           `json:"paid_amount" binding:"required"`
	Notes           string            `json:"notes"`
}

// CreateSale creates a new sale transaction
func CreateSale(c *gin.Context) {
	var req CreateSaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get current user ID (cashier)
	userID, _ := c.Get("user_id")

	// Generate transaction code
	txCode := generateTransactionCode("SL")

	// Begin database transaction
	tx := database.DB.Begin()

	var subTotal float64 = 0
	var transactionItems []models.TransactionItem

	// Process each item
	for _, item := range req.Items {
		var stock models.Stock
		if err := tx.Preload("Product").Preload("Product.GoldCategory").First(&stock, item.StockID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Stock ID %d not found", item.StockID)})
			return
		}

		// Check if stock is available
		if stock.Status != models.StockStatusAvailable {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Stock %s is not available", stock.SerialNumber)})
			return
		}

		// Check if stock is in the right location
		if stock.LocationID != req.LocationID {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Stock %s is not in this location", stock.SerialNumber)})
			return
		}

		itemSubTotal := stock.SellPrice - item.Discount
		subTotal += itemSubTotal

		transactionItems = append(transactionItems, models.TransactionItem{
			StockID:      &stock.ID,
			ItemName:     stock.Product.Name,
			Barcode:      stock.Product.Barcode,
			Weight:       stock.Product.Weight,
			PricePerGram: stock.SellPrice / stock.Product.Weight,
			UnitPrice:    stock.SellPrice,
			Quantity:     1,
			Discount:     item.Discount,
			SubTotal:     itemSubTotal,
			Notes:        item.Notes,
		})

		// Update stock status to sold
		now := time.Now()
		stock.Status = models.StockStatusSold
		stock.SoldAt = &now
		if err := tx.Save(&stock).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Calculate totals
	discountAmount := req.Discount
	if req.DiscountPercent > 0 {
		discountAmount = subTotal * req.DiscountPercent / 100
	}
	grandTotal := subTotal - discountAmount + req.Tax
	changeAmount := req.PaidAmount - grandTotal

	if changeAmount < 0 {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Paid amount is less than grand total"})
		return
	}

	// Create transaction
	transaction := models.Transaction{
		TransactionCode: txCode,
		Type:            models.TransactionTypeSale,
		MemberID:        req.MemberID,
		LocationID:      req.LocationID,
		CashierID:       userID.(uint),
		SubTotal:        subTotal,
		Discount:        discountAmount,
		DiscountPercent: req.DiscountPercent,
		Tax:             req.Tax,
		GrandTotal:      grandTotal,
		PaymentMethod:   models.PaymentMethod(req.PaymentMethod),
		PaidAmount:      req.PaidAmount,
		ChangeAmount:    changeAmount,
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		Notes:           req.Notes,
		Status:          "completed",
		TransactionDate: time.Now(),
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create transaction items
	for i := range transactionItems {
		transactionItems[i].TransactionID = transaction.ID
		if err := tx.Create(&transactionItems[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Update stock with transaction ID
	for _, item := range req.Items {
		if err := tx.Model(&models.Stock{}).Where("id = ?", item.StockID).
			Update("transaction_id", transaction.ID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Update member if exists
	if req.MemberID != nil {
		var member models.Member
		if err := tx.First(&member, *req.MemberID).Error; err == nil {
			member.TotalPurchase += grandTotal
			member.TransactionCount += 1
			member.AddPoints(grandTotal)
			tx.Save(&member)
		}
	}

	tx.Commit()

	// Load full transaction data
	database.DB.Preload("Member").Preload("Location").Preload("Cashier").
		Preload("Items").First(&transaction, transaction.ID)

	c.JSON(http.StatusCreated, gin.H{"data": transaction})
}

// ==================== PURCHASE/SETOR TRANSACTION ====================

type PurchaseItemRequest struct {
	GoldCategoryID   *uint   `json:"gold_category_id"`
	Purity           string  `json:"purity"`
	WeightGross      float64 `json:"weight_gross"`
	ShrinkagePercent float64 `json:"shrinkage_percent"`
	Weight           float64 `json:"weight" binding:"required"` // Berat bersih
	PricePerGram     float64 `json:"price_per_gram" binding:"required"`
	Condition        string  `json:"condition"`
	Notes            string  `json:"notes"`
}

type CreatePurchaseRequest struct {
	LocationID        uint                  `json:"location_id" binding:"required"`
	MemberID          *uint                 `json:"member_id"`
	CustomerName      string                `json:"customer_name"`
	CustomerPhone     string                `json:"customer_phone"`
	Items             []PurchaseItemRequest `json:"items" binding:"required,min=1"`
	PaymentMethod     string                `json:"payment_method" binding:"required"`
	Notes             string                `json:"notes"`
	SaveAsRawMaterial bool                  `json:"save_as_raw_material"` // Flag untuk simpan ke raw material
}

// CreatePurchase creates a new purchase/setor transaction (buying from customer)
func CreatePurchase(c *gin.Context) {
	var req CreatePurchaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get current user ID (cashier)
	userID, _ := c.Get("user_id")

	// Generate transaction code
	txCode := generateTransactionCode("PR")

	// Begin database transaction
	tx := database.DB.Begin()

	var grandTotal float64 = 0
	var transactionItems []models.TransactionItem

	// Process each item
	for _, item := range req.Items {
		var categoryName string
		var categoryID *uint

		if item.GoldCategoryID != nil && *item.GoldCategoryID > 0 {
			var goldCategory models.GoldCategory
			if err := tx.First(&goldCategory, *item.GoldCategoryID).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Gold category ID %d not found", *item.GoldCategoryID)})
				return
			}
			categoryName = goldCategory.Name
			categoryID = item.GoldCategoryID
		} else {
			categoryName = "Tanpa Kategori"
			if item.Purity != "" {
				categoryName = fmt.Sprintf("Emas %s", item.Purity)
			}
		}

		totalPrice := item.Weight * item.PricePerGram
		grandTotal += totalPrice

		notesText := ""
		if item.Condition != "" {
			notesText = fmt.Sprintf("Kondisi: %s.", item.Condition)
		}
		if item.Purity != "" {
			notesText += fmt.Sprintf(" Kadar: %s.", item.Purity)
		}
		if item.Notes != "" {
			notesText += fmt.Sprintf(" %s", item.Notes)
		}

		transactionItems = append(transactionItems, models.TransactionItem{
			GoldCategoryID: categoryID,
			ItemName:       fmt.Sprintf("Setor Emas %s", categoryName),
			Weight:         item.Weight,
			PricePerGram:   item.PricePerGram,
			UnitPrice:      totalPrice,
			Quantity:       1,
			SubTotal:       totalPrice,
			Notes:          notesText,
		})
	}

	// Create transaction
	transaction := models.Transaction{
		TransactionCode: txCode,
		Type:            models.TransactionTypePurchase,
		MemberID:        req.MemberID,
		LocationID:      req.LocationID,
		CashierID:       userID.(uint),
		SubTotal:        grandTotal,
		GrandTotal:      grandTotal,
		PaymentMethod:   models.PaymentMethod(req.PaymentMethod),
		PaidAmount:      grandTotal,
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		Notes:           req.Notes,
		Status:          "completed",
		TransactionDate: time.Now(),
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create transaction items
	for i := range transactionItems {
		transactionItems[i].TransactionID = transaction.ID
		if err := tx.Create(&transactionItems[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Update member if exists
	if req.MemberID != nil {
		var member models.Member
		if err := tx.First(&member, *req.MemberID).Error; err == nil {
			member.TotalSell += grandTotal
			member.TransactionCount += 1
			// Also add points for selling gold to us (half the rate)
			points := int(grandTotal / 200000) // 1 point per 200,000 sold
			member.Points += points
			tx.Save(&member)
		}
	}

	// Create raw materials if flag is true
	if req.SaveAsRawMaterial {
		currentUserID := userID.(uint)
		for _, item := range req.Items {
			// Set weight gross default to weight if not provided
			weightGross := item.WeightGross
			if weightGross == 0 {
				weightGross = item.Weight
			}

			condition := models.RawMaterialConditionLikeNew
			if item.Condition != "" {
				condition = models.RawMaterialCondition(item.Condition)
			}

			// Parse purity
			var purity float64
			if item.Purity != "" {
				fmt.Sscanf(item.Purity, "%f", &purity)
			}

			now := time.Now()
			rawMaterial := models.RawMaterial{
				Code:             GenerateRawMaterialCode(),
				GoldCategoryID:   item.GoldCategoryID,
				LocationID:       req.LocationID,
				WeightGross:      weightGross,
				ShrinkagePercent: item.ShrinkagePercent,
				WeightGrams:      item.Weight,
				Purity:           purity,
				BuyPricePerGram:  item.PricePerGram,
				TotalBuyPrice:    item.Weight * item.PricePerGram,
				Condition:        condition,
				Status:           models.RawMaterialStatusAvailable,
				MemberID:         req.MemberID,
				TransactionID:    &transaction.ID,
				ReceivedAt:       &now,
				ReceivedByID:     &currentUserID,
				Notes:            item.Notes,
			}

			if err := tx.Create(&rawMaterial).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create raw material: " + err.Error()})
				return
			}
		}
	}

	tx.Commit()

	// Load full transaction data
	database.DB.Preload("Member").Preload("Location").Preload("Cashier").
		Preload("Items").First(&transaction, transaction.ID)

	c.JSON(http.StatusCreated, gin.H{"data": transaction})
}

// generateTransactionCode generates a unique transaction code
func generateTransactionCode(prefix string) string {
	now := time.Now()
	return fmt.Sprintf("%s%s%d", prefix, now.Format("20060102"), now.UnixNano()%100000)
}

// CancelTransaction cancels a transaction
func CancelTransaction(c *gin.Context) {
	id := c.Param("id")
	var transaction models.Transaction
	if err := database.DB.Preload("Items").First(&transaction, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	if transaction.Status != "completed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only completed transactions can be cancelled"})
		return
	}

	tx := database.DB.Begin()

	// If sale transaction, restore stock status
	if transaction.Type == models.TransactionTypeSale {
		for _, item := range transaction.Items {
			if item.StockID != nil {
				if err := tx.Model(&models.Stock{}).Where("id = ?", *item.StockID).
					Updates(map[string]interface{}{
						"status":         models.StockStatusAvailable,
						"sold_at":        nil,
						"transaction_id": nil,
					}).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
			}
		}
	}

	// Update transaction status
	transaction.Status = "cancelled"
	if err := tx.Save(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"data": transaction})
}

// GetDailySummary returns daily sales summary
func GetDailySummary(c *gin.Context) {
	date := c.Query("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	locationID := c.Query("location_id")

	var result struct {
		SalesCount      int64   `json:"sales_count"`
		PurchasesCount  int64   `json:"purchases_count"`
		SalesAmount     float64 `json:"sales_amount"`
		PurchasesAmount float64 `json:"purchases_amount"`
		NetAmount       float64 `json:"net_amount"`
	}

	// Count sales
	salesQuery := database.DB.Model(&models.Transaction{}).
		Where("DATE(transaction_date) = ? AND type = ? AND status = ?", date, models.TransactionTypeSale, "completed")
	if locationID != "" {
		salesQuery = salesQuery.Where("location_id = ?", locationID)
	}
	salesQuery.Count(&result.SalesCount)
	salesQuery.Select("COALESCE(SUM(grand_total), 0)").Scan(&result.SalesAmount)

	// Count purchases
	purchaseQuery := database.DB.Model(&models.Transaction{}).
		Where("DATE(transaction_date) = ? AND type = ? AND status = ?", date, models.TransactionTypePurchase, "completed")
	if locationID != "" {
		purchaseQuery = purchaseQuery.Where("location_id = ?", locationID)
	}
	purchaseQuery.Count(&result.PurchasesCount)
	purchaseQuery.Select("COALESCE(SUM(grand_total), 0)").Scan(&result.PurchasesAmount)

	result.NetAmount = result.SalesAmount - result.PurchasesAmount

	c.JSON(http.StatusOK, gin.H{"data": result})
}
