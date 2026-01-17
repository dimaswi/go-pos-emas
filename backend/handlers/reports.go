package handlers

import (
	"fmt"
	"net/http"
	"starter/backend/database"
	"starter/backend/models"
	"time"

	"github.com/gin-gonic/gin"
)

// ==================== TRANSACTION REPORTS ====================

// TransactionReportSummary represents transaction report summary
type TransactionReportSummary struct {
	Period              string  `json:"period"`
	TotalTransactions   int64   `json:"total_transactions"`
	TotalSales          int64   `json:"total_sales"`
	TotalPurchases      int64   `json:"total_purchases"`
	TotalSalesAmount    float64 `json:"total_sales_amount"`
	TotalPurchaseAmount float64 `json:"total_purchase_amount"`
	NetAmount           float64 `json:"net_amount"`
	AverageTransaction  float64 `json:"average_transaction"`
}

// TransactionDetail represents detailed transaction for reports
type TransactionDetail struct {
	ID              uint      `json:"id"`
	TransactionCode string    `json:"transaction_code"`
	Type            string    `json:"type"`
	TransactionDate time.Time `json:"transaction_date"`
	LocationName    string    `json:"location_name"`
	CashierName     string    `json:"cashier_name"`
	MemberName      string    `json:"member_name"`
	CustomerName    string    `json:"customer_name"`
	GrandTotal      float64   `json:"grand_total"`
	PaymentMethod   string    `json:"payment_method"`
	Status          string    `json:"status"`
	ItemCount       int       `json:"item_count"`
}

// GetTransactionReport returns transaction report (daily/weekly/monthly)
func GetTransactionReport(c *gin.Context) {
	period := c.DefaultQuery("period", "daily") // daily, weekly, monthly
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	locationID := c.Query("location_id")
	txType := c.Query("type") // sale, purchase

	var transactions []models.Transaction
	query := database.DB.Model(&models.Transaction{}).
		Preload("Location").
		Preload("Cashier").
		Preload("Member").
		Preload("Items").
		Where("status != ?", "cancelled")

	// Apply filters
	if startDate != "" {
		query = query.Where("transaction_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("transaction_date <= ?", endDate+" 23:59:59")
	}
	if locationID != "" {
		query = query.Where("location_id = ?", locationID)
	}
	if txType != "" {
		query = query.Where("type = ?", txType)
	}

	if err := query.Order("transaction_date DESC").Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Build detailed transactions
	var details []TransactionDetail
	for _, tx := range transactions {
		memberName := ""
		if tx.Member != nil {
			memberName = tx.Member.Name
		}
		details = append(details, TransactionDetail{
			ID:              tx.ID,
			TransactionCode: tx.TransactionCode,
			Type:            string(tx.Type),
			TransactionDate: tx.TransactionDate,
			LocationName:    tx.Location.Name,
			CashierName:     tx.Cashier.FullName,
			MemberName:      memberName,
			CustomerName:    tx.CustomerName,
			GrandTotal:      tx.GrandTotal,
			PaymentMethod:   string(tx.PaymentMethod),
			Status:          tx.Status,
			ItemCount:       len(tx.Items),
		})
	}

	// Calculate summary
	var summary TransactionReportSummary
	summary.Period = period
	summary.TotalTransactions = int64(len(transactions))

	for _, tx := range transactions {
		if tx.Type == models.TransactionTypeSale {
			summary.TotalSales++
			summary.TotalSalesAmount += tx.GrandTotal
		} else {
			summary.TotalPurchases++
			summary.TotalPurchaseAmount += tx.GrandTotal
		}
	}
	summary.NetAmount = summary.TotalSalesAmount - summary.TotalPurchaseAmount
	if summary.TotalTransactions > 0 {
		summary.AverageTransaction = (summary.TotalSalesAmount + summary.TotalPurchaseAmount) / float64(summary.TotalTransactions)
	}

	c.JSON(http.StatusOK, gin.H{
		"summary":      summary,
		"transactions": details,
	})
}

// CashierReport represents report per cashier
type CashierReport struct {
	CashierID         uint    `json:"cashier_id"`
	CashierName       string  `json:"cashier_name"`
	TotalTransactions int64   `json:"total_transactions"`
	TotalSales        float64 `json:"total_sales"`
	TotalPurchases    float64 `json:"total_purchases"`
	SaleCount         int64   `json:"sale_count"`
	PurchaseCount     int64   `json:"purchase_count"`
}

// GetCashierReport returns transaction report grouped by cashier
func GetCashierReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	locationID := c.Query("location_id")

	type CashierResult struct {
		CashierID   uint    `json:"cashier_id"`
		CashierName string  `json:"cashier_name"`
		Type        string  `json:"type"`
		TxCount     int64   `json:"tx_count"`
		TotalAmount float64 `json:"total_amount"`
	}

	var results []CashierResult
	query := database.DB.Model(&models.Transaction{}).
		Select("transactions.cashier_id, users.full_name as cashier_name, transactions.type, COUNT(*) as tx_count, SUM(grand_total) as total_amount").
		Joins("JOIN users ON users.id = transactions.cashier_id").
		Where("transactions.status != ? AND transactions.deleted_at IS NULL", "cancelled").
		Group("transactions.cashier_id, users.full_name, transactions.type")

	if startDate != "" {
		query = query.Where("transactions.transaction_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("transactions.transaction_date <= ?", endDate+" 23:59:59")
	}
	if locationID != "" {
		query = query.Where("transactions.location_id = ?", locationID)
	}

	if err := query.Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Aggregate by cashier
	cashierMap := make(map[uint]*CashierReport)
	for _, r := range results {
		if _, exists := cashierMap[r.CashierID]; !exists {
			cashierMap[r.CashierID] = &CashierReport{
				CashierID:   r.CashierID,
				CashierName: r.CashierName,
			}
		}
		cashierMap[r.CashierID].TotalTransactions += r.TxCount
		if r.Type == "sale" {
			cashierMap[r.CashierID].TotalSales = r.TotalAmount
			cashierMap[r.CashierID].SaleCount = r.TxCount
		} else {
			cashierMap[r.CashierID].TotalPurchases = r.TotalAmount
			cashierMap[r.CashierID].PurchaseCount = r.TxCount
		}
	}

	var reports []CashierReport
	for _, v := range cashierMap {
		reports = append(reports, *v)
	}

	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// LocationReport represents report per location
type LocationReport struct {
	LocationID        uint    `json:"location_id"`
	LocationName      string  `json:"location_name"`
	LocationType      string  `json:"location_type"`
	TotalTransactions int64   `json:"total_transactions"`
	TotalSales        float64 `json:"total_sales"`
	TotalPurchases    float64 `json:"total_purchases"`
	SaleCount         int64   `json:"sale_count"`
	PurchaseCount     int64   `json:"purchase_count"`
	NetRevenue        float64 `json:"net_revenue"`
}

// GetLocationReport returns transaction report grouped by location
func GetLocationReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	type LocationResult struct {
		LocationID   uint    `json:"location_id"`
		LocationName string  `json:"location_name"`
		LocationType string  `json:"location_type"`
		Type         string  `json:"type"`
		TxCount      int64   `json:"tx_count"`
		TotalAmount  float64 `json:"total_amount"`
	}

	var results []LocationResult
	query := database.DB.Model(&models.Transaction{}).
		Select("transactions.location_id, locations.name as location_name, locations.type as location_type, transactions.type, COUNT(*) as tx_count, SUM(grand_total) as total_amount").
		Joins("JOIN locations ON locations.id = transactions.location_id").
		Where("transactions.status != ? AND transactions.deleted_at IS NULL", "cancelled").
		Group("transactions.location_id, locations.name, locations.type, transactions.type")

	if startDate != "" {
		query = query.Where("transactions.transaction_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("transactions.transaction_date <= ?", endDate+" 23:59:59")
	}

	if err := query.Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Aggregate by location
	locationMap := make(map[uint]*LocationReport)
	for _, r := range results {
		if _, exists := locationMap[r.LocationID]; !exists {
			locationMap[r.LocationID] = &LocationReport{
				LocationID:   r.LocationID,
				LocationName: r.LocationName,
				LocationType: r.LocationType,
			}
		}
		locationMap[r.LocationID].TotalTransactions += r.TxCount
		if r.Type == "sale" {
			locationMap[r.LocationID].TotalSales = r.TotalAmount
			locationMap[r.LocationID].SaleCount = r.TxCount
		} else {
			locationMap[r.LocationID].TotalPurchases = r.TotalAmount
			locationMap[r.LocationID].PurchaseCount = r.TxCount
		}
	}

	var reports []LocationReport
	for _, v := range locationMap {
		v.NetRevenue = v.TotalSales - v.TotalPurchases
		reports = append(reports, *v)
	}

	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// ==================== INVENTORY/STOCK REPORTS ====================

// StockLocationReport represents stock per location
type StockLocationReport struct {
	LocationID     uint    `json:"location_id"`
	LocationName   string  `json:"location_name"`
	LocationType   string  `json:"location_type"`
	TotalStock     int64   `json:"total_stock"`
	AvailableStock int64   `json:"available_stock"`
	SoldStock      int64   `json:"sold_stock"`
	ReservedStock  int64   `json:"reserved_stock"`
	TotalWeight    float64 `json:"total_weight"`
	TotalBuyValue  float64 `json:"total_buy_value"`
	TotalSellValue float64 `json:"total_sell_value"`
}

// GetStockLocationReport returns stock report grouped by location
func GetStockLocationReport(c *gin.Context) {
	var results []StockLocationReport

	// Get stock counts and values by location
	query := `
		SELECT 
			l.id as location_id,
			l.name as location_name,
			l.type as location_type,
			COUNT(s.id) as total_stock,
			SUM(CASE WHEN s.status = 'available' THEN 1 ELSE 0 END) as available_stock,
			SUM(CASE WHEN s.status = 'sold' THEN 1 ELSE 0 END) as sold_stock,
			SUM(CASE WHEN s.status = 'reserved' THEN 1 ELSE 0 END) as reserved_stock,
			COALESCE(SUM(p.weight), 0) as total_weight,
			COALESCE(SUM(CASE WHEN s.status = 'available' THEN s.buy_price ELSE 0 END), 0) as total_buy_value,
			COALESCE(SUM(CASE WHEN s.status = 'available' THEN s.sell_price ELSE 0 END), 0) as total_sell_value
		FROM locations l
		LEFT JOIN stocks s ON s.location_id = l.id AND s.deleted_at IS NULL
		LEFT JOIN products p ON p.id = s.product_id
		WHERE l.deleted_at IS NULL
		GROUP BY l.id, l.name, l.type
		ORDER BY l.name
	`

	if err := database.DB.Raw(query).Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": results})
}

// StockCategoryReport represents stock per gold category
type StockCategoryReport struct {
	CategoryID     uint    `json:"category_id"`
	CategoryCode   string  `json:"category_code"`
	CategoryName   string  `json:"category_name"`
	TotalStock     int64   `json:"total_stock"`
	AvailableStock int64   `json:"available_stock"`
	SoldStock      int64   `json:"sold_stock"`
	TotalWeight    float64 `json:"total_weight"`
	AvgBuyPrice    float64 `json:"avg_buy_price"`
	AvgSellPrice   float64 `json:"avg_sell_price"`
	TotalBuyValue  float64 `json:"total_buy_value"`
	TotalSellValue float64 `json:"total_sell_value"`
}

// GetStockCategoryReport returns stock report grouped by gold category
func GetStockCategoryReport(c *gin.Context) {
	locationID := c.Query("location_id")

	var results []StockCategoryReport

	query := `
		SELECT 
			gc.id as category_id,
			gc.code as category_code,
			gc.name as category_name,
			COUNT(s.id) as total_stock,
			SUM(CASE WHEN s.status = 'available' THEN 1 ELSE 0 END) as available_stock,
			SUM(CASE WHEN s.status = 'sold' THEN 1 ELSE 0 END) as sold_stock,
			COALESCE(SUM(CASE WHEN s.status = 'available' THEN p.weight ELSE 0 END), 0) as total_weight,
			COALESCE(AVG(CASE WHEN s.status = 'available' THEN s.buy_price ELSE NULL END), 0) as avg_buy_price,
			COALESCE(AVG(CASE WHEN s.status = 'available' THEN s.sell_price ELSE NULL END), 0) as avg_sell_price,
			COALESCE(SUM(CASE WHEN s.status = 'available' THEN s.buy_price ELSE 0 END), 0) as total_buy_value,
			COALESCE(SUM(CASE WHEN s.status = 'available' THEN s.sell_price ELSE 0 END), 0) as total_sell_value
		FROM gold_categories gc
		LEFT JOIN products p ON p.gold_category_id = gc.id AND p.deleted_at IS NULL
		LEFT JOIN stocks s ON s.product_id = p.id AND s.deleted_at IS NULL
	`

	if locationID != "" {
		query += " AND s.location_id = " + locationID
	}

	query += `
		WHERE gc.deleted_at IS NULL
		GROUP BY gc.id, gc.code, gc.name
		ORDER BY gc.code
	`

	if err := database.DB.Raw(query).Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": results})
}

// StockTransferReport represents stock transfer report
type StockTransferReport struct {
	ID                uint      `json:"id"`
	TransferNumber    string    `json:"transfer_number"`
	StockSerial       string    `json:"stock_serial"`
	ProductName       string    `json:"product_name"`
	FromLocationName  string    `json:"from_location_name"`
	ToLocationName    string    `json:"to_location_name"`
	TransferredByName string    `json:"transferred_by_name"`
	TransferredAt     time.Time `json:"transferred_at"`
	Status            string    `json:"status"`
	Notes             string    `json:"notes"`
}

// GetStockTransferReport returns stock transfer history report
func GetStockTransferReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	fromLocationID := c.Query("from_location_id")
	toLocationID := c.Query("to_location_id")

	var transfers []models.StockTransfer
	query := database.DB.Model(&models.StockTransfer{}).
		Preload("Stock").
		Preload("Stock.Product").
		Preload("FromLocation").
		Preload("ToLocation").
		Preload("TransferredBy")

	if startDate != "" {
		query = query.Where("transferred_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("transferred_at <= ?", endDate+" 23:59:59")
	}
	if fromLocationID != "" {
		query = query.Where("from_location_id = ?", fromLocationID)
	}
	if toLocationID != "" {
		query = query.Where("to_location_id = ?", toLocationID)
	}

	if err := query.Order("transferred_at DESC").Find(&transfers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var reports []StockTransferReport
	for _, t := range transfers {
		productName := ""
		if t.Stock.Product.Name != "" {
			productName = t.Stock.Product.Name
		}
		reports = append(reports, StockTransferReport{
			ID:                t.ID,
			TransferNumber:    t.TransferNumber,
			StockSerial:       t.Stock.SerialNumber,
			ProductName:       productName,
			FromLocationName:  t.FromLocation.Name,
			ToLocationName:    t.ToLocation.Name,
			TransferredByName: t.TransferredBy.FullName,
			TransferredAt:     t.TransferredAt,
			Status:            t.Status,
			Notes:             t.Notes,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// RawMaterialReport represents raw material report
type RawMaterialReport struct {
	ID               uint       `json:"id"`
	Code             string     `json:"code"`
	CategoryName     string     `json:"category_name"`
	LocationName     string     `json:"location_name"`
	WeightGross      float64    `json:"weight_gross"`
	ShrinkagePercent float64    `json:"shrinkage_percent"`
	WeightGrams      float64    `json:"weight_grams"`
	Purity           float64    `json:"purity"`
	BuyPricePerGram  float64    `json:"buy_price_per_gram"`
	TotalBuyPrice    float64    `json:"total_buy_price"`
	Condition        string     `json:"condition"`
	Status           string     `json:"status"`
	SupplierName     string     `json:"supplier_name"`
	MemberName       string     `json:"member_name"`
	ReceivedAt       *time.Time `json:"received_at"`
	ReceivedByName   string     `json:"received_by_name"`
}

// GetRawMaterialReport returns raw material inventory report
func GetRawMaterialReport(c *gin.Context) {
	status := c.Query("status") // available, processed, sold
	locationID := c.Query("location_id")
	categoryID := c.Query("category_id")

	var materials []models.RawMaterial
	query := database.DB.Model(&models.RawMaterial{}).
		Preload("GoldCategory").
		Preload("Location").
		Preload("Member").
		Preload("ReceivedBy")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if locationID != "" {
		query = query.Where("location_id = ?", locationID)
	}
	if categoryID != "" {
		query = query.Where("gold_category_id = ?", categoryID)
	}

	if err := query.Order("created_at DESC").Find(&materials).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var reports []RawMaterialReport
	var totalWeight float64 = 0
	var totalValue float64 = 0

	for _, m := range materials {
		categoryName := ""
		if m.GoldCategory != nil {
			categoryName = m.GoldCategory.Name
		}
		locationName := ""
		if m.Location != nil {
			locationName = m.Location.Name
		}
		memberName := ""
		if m.Member != nil {
			memberName = m.Member.Name
		}
		receivedByName := ""
		if m.ReceivedBy != nil {
			receivedByName = m.ReceivedBy.FullName
		}

		reports = append(reports, RawMaterialReport{
			ID:               m.ID,
			Code:             m.Code,
			CategoryName:     categoryName,
			LocationName:     locationName,
			WeightGross:      m.WeightGross,
			ShrinkagePercent: m.ShrinkagePercent,
			WeightGrams:      m.WeightGrams,
			Purity:           m.Purity,
			BuyPricePerGram:  m.BuyPricePerGram,
			TotalBuyPrice:    m.TotalBuyPrice,
			Condition:        string(m.Condition),
			Status:           string(m.Status),
			SupplierName:     m.SupplierName,
			MemberName:       memberName,
			ReceivedAt:       m.ReceivedAt,
			ReceivedByName:   receivedByName,
		})

		if m.Status == models.RawMaterialStatusAvailable {
			totalWeight += m.WeightGrams
			totalValue += m.TotalBuyPrice
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": reports,
		"summary": gin.H{
			"total_items":            len(reports),
			"total_available_weight": totalWeight,
			"total_available_value":  totalValue,
		},
	})
}

// SoldStockReport represents sold stock report
type SoldStockReport struct {
	ID              uint       `json:"id"`
	SerialNumber    string     `json:"serial_number"`
	ProductName     string     `json:"product_name"`
	CategoryName    string     `json:"category_name"`
	Weight          float64    `json:"weight"`
	BuyPrice        float64    `json:"buy_price"`
	SellPrice       float64    `json:"sell_price"`
	Profit          float64    `json:"profit"`
	LocationName    string     `json:"location_name"`
	TransactionCode string     `json:"transaction_code"`
	SoldAt          *time.Time `json:"sold_at"`
	CustomerName    string     `json:"customer_name"`
}

// GetSoldStockReport returns report of sold stock items
func GetSoldStockReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	locationID := c.Query("location_id")
	categoryID := c.Query("category_id")

	var stocks []models.Stock
	query := database.DB.Model(&models.Stock{}).
		Preload("Product").
		Preload("Product.GoldCategory").
		Preload("Location").
		Where("status = ?", models.StockStatusSold)

	if startDate != "" {
		query = query.Where("sold_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("sold_at <= ?", endDate+" 23:59:59")
	}
	if locationID != "" {
		query = query.Where("location_id = ?", locationID)
	}
	if categoryID != "" {
		query = query.Joins("JOIN products ON products.id = stocks.product_id").
			Where("products.gold_category_id = ?", categoryID)
	}

	if err := query.Order("sold_at DESC").Find(&stocks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var reports []SoldStockReport
	var totalProfit float64 = 0
	var totalSales float64 = 0

	for _, s := range stocks {
		categoryName := ""
		if s.Product.GoldCategory.ID != 0 {
			categoryName = s.Product.GoldCategory.Name
		}

		// Get transaction info
		var tx models.Transaction
		customerName := ""
		txCode := ""
		if s.TransactionID != nil {
			database.DB.First(&tx, *s.TransactionID)
			txCode = tx.TransactionCode
			if tx.CustomerName != "" {
				customerName = tx.CustomerName
			} else if tx.MemberID != nil {
				var member models.Member
				database.DB.First(&member, *tx.MemberID)
				customerName = member.Name
			}
		}

		profit := s.SellPrice - s.BuyPrice
		reports = append(reports, SoldStockReport{
			ID:              s.ID,
			SerialNumber:    s.SerialNumber,
			ProductName:     s.Product.Name,
			CategoryName:    categoryName,
			Weight:          s.Product.Weight,
			BuyPrice:        s.BuyPrice,
			SellPrice:       s.SellPrice,
			Profit:          profit,
			LocationName:    s.Location.Name,
			TransactionCode: txCode,
			SoldAt:          s.SoldAt,
			CustomerName:    customerName,
		})

		totalProfit += profit
		totalSales += s.SellPrice
	}

	c.JSON(http.StatusOK, gin.H{
		"data": reports,
		"summary": gin.H{
			"total_items":  len(reports),
			"total_sales":  totalSales,
			"total_profit": totalProfit,
		},
	})
}

// ==================== FINANCIAL REPORTS ====================

// FinancialSummary represents financial summary
type FinancialSummary struct {
	Period           string  `json:"period"`
	TotalIncome      float64 `json:"total_income"`   // Sales revenue
	TotalExpenses    float64 `json:"total_expenses"` // Purchases from customers
	NetProfit        float64 `json:"net_profit"`
	GrossProfit      float64 `json:"gross_profit"` // Sales - Cost of goods sold
	CashPayments     float64 `json:"cash_payments"`
	TransferPayments float64 `json:"transfer_payments"`
	CardPayments     float64 `json:"card_payments"`
	MixedPayments    float64 `json:"mixed_payments"`
}

// GetFinancialSummary returns financial summary report
func GetFinancialSummary(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	locationID := c.Query("location_id")

	var summary FinancialSummary
	summary.Period = startDate + " - " + endDate

	// Get sales revenue
	salesQuery := database.DB.Model(&models.Transaction{}).
		Where("type = ? AND status = ?", models.TransactionTypeSale, "completed")
	if startDate != "" {
		salesQuery = salesQuery.Where("transaction_date >= ?", startDate)
	}
	if endDate != "" {
		salesQuery = salesQuery.Where("transaction_date <= ?", endDate+" 23:59:59")
	}
	if locationID != "" {
		salesQuery = salesQuery.Where("location_id = ?", locationID)
	}

	var totalSales float64
	salesQuery.Select("COALESCE(SUM(grand_total), 0)").Scan(&totalSales)
	summary.TotalIncome = totalSales

	// Get purchases (expenses)
	purchaseQuery := database.DB.Model(&models.Transaction{}).
		Where("type = ? AND status = ?", models.TransactionTypePurchase, "completed")
	if startDate != "" {
		purchaseQuery = purchaseQuery.Where("transaction_date >= ?", startDate)
	}
	if endDate != "" {
		purchaseQuery = purchaseQuery.Where("transaction_date <= ?", endDate+" 23:59:59")
	}
	if locationID != "" {
		purchaseQuery = purchaseQuery.Where("location_id = ?", locationID)
	}

	var totalPurchases float64
	purchaseQuery.Select("COALESCE(SUM(grand_total), 0)").Scan(&totalPurchases)
	summary.TotalExpenses = totalPurchases

	summary.NetProfit = summary.TotalIncome - summary.TotalExpenses

	// Get payment method breakdown for sales
	paymentQuery := database.DB.Model(&models.Transaction{}).
		Where("type = ? AND status = ?", models.TransactionTypeSale, "completed")
	if startDate != "" {
		paymentQuery = paymentQuery.Where("transaction_date >= ?", startDate)
	}
	if endDate != "" {
		paymentQuery = paymentQuery.Where("transaction_date <= ?", endDate+" 23:59:59")
	}
	if locationID != "" {
		paymentQuery = paymentQuery.Where("location_id = ?", locationID)
	}

	type PaymentResult struct {
		PaymentMethod string  `json:"payment_method"`
		Total         float64 `json:"total"`
	}
	var payments []PaymentResult
	paymentQuery.Select("payment_method, SUM(grand_total) as total").
		Group("payment_method").Scan(&payments)

	for _, p := range payments {
		switch p.PaymentMethod {
		case "cash":
			summary.CashPayments = p.Total
		case "transfer":
			summary.TransferPayments = p.Total
		case "card":
			summary.CardPayments = p.Total
		case "mixed":
			summary.MixedPayments = p.Total
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": summary})
}

// LocationRevenue represents revenue per location (Omzet)
type LocationRevenue struct {
	LocationID     uint    `json:"location_id"`
	LocationName   string  `json:"location_name"`
	LocationType   string  `json:"location_type"`
	TotalSales     float64 `json:"total_sales"`
	TotalPurchases float64 `json:"total_purchases"`
	NetRevenue     float64 `json:"net_revenue"`
	SaleCount      int64   `json:"sale_count"`
	PurchaseCount  int64   `json:"purchase_count"`
}

// GetLocationRevenue returns revenue (omzet) per location
func GetLocationRevenue(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var results []LocationRevenue

	query := `
		SELECT 
			l.id as location_id,
			l.name as location_name,
			l.type as location_type,
			COALESCE(SUM(CASE WHEN t.type = 'sale' THEN t.grand_total ELSE 0 END), 0) as total_sales,
			COALESCE(SUM(CASE WHEN t.type = 'purchase' THEN t.grand_total ELSE 0 END), 0) as total_purchases,
			COALESCE(SUM(CASE WHEN t.type = 'sale' THEN t.grand_total ELSE -t.grand_total END), 0) as net_revenue,
			COALESCE(SUM(CASE WHEN t.type = 'sale' THEN 1 ELSE 0 END), 0) as sale_count,
			COALESCE(SUM(CASE WHEN t.type = 'purchase' THEN 1 ELSE 0 END), 0) as purchase_count
		FROM locations l
		LEFT JOIN transactions t ON t.location_id = l.id 
			AND t.status = 'completed' 
			AND t.deleted_at IS NULL
	`

	if startDate != "" {
		query += " AND t.transaction_date >= '" + startDate + "'"
	}
	if endDate != "" {
		query += " AND t.transaction_date <= '" + endDate + " 23:59:59'"
	}

	query += `
		WHERE l.deleted_at IS NULL
		GROUP BY l.id, l.name, l.type
		ORDER BY net_revenue DESC
	`

	if err := database.DB.Raw(query).Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": results})
}

// PaymentMethodReport represents payment method breakdown
type PaymentMethodReport struct {
	PaymentMethod    string  `json:"payment_method"`
	TransactionCount int64   `json:"transaction_count"`
	TotalAmount      float64 `json:"total_amount"`
	Percentage       float64 `json:"percentage"`
}

// GetPaymentMethodReport returns payment method breakdown
func GetPaymentMethodReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	locationID := c.Query("location_id")

	type Result struct {
		PaymentMethod string  `json:"payment_method"`
		TxCount       int64   `json:"tx_count"`
		TotalAmount   float64 `json:"total_amount"`
	}

	var results []Result
	query := database.DB.Model(&models.Transaction{}).
		Select("payment_method, COUNT(*) as tx_count, SUM(grand_total) as total_amount").
		Where("status = ?", "completed").
		Group("payment_method")

	if startDate != "" {
		query = query.Where("transaction_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("transaction_date <= ?", endDate+" 23:59:59")
	}
	if locationID != "" {
		query = query.Where("location_id = ?", locationID)
	}

	if err := query.Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calculate total for percentage
	var grandTotal float64 = 0
	for _, r := range results {
		grandTotal += r.TotalAmount
	}

	var reports []PaymentMethodReport
	for _, r := range results {
		percentage := 0.0
		if grandTotal > 0 {
			percentage = (r.TotalAmount / grandTotal) * 100
		}
		reports = append(reports, PaymentMethodReport{
			PaymentMethod:    r.PaymentMethod,
			TransactionCount: r.TxCount,
			TotalAmount:      r.TotalAmount,
			Percentage:       percentage,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        reports,
		"grand_total": grandTotal,
	})
}

// ==================== MEMBER REPORTS ====================

// MemberTransactionReport represents member transaction summary
type MemberTransactionReport struct {
	MemberID         uint    `json:"member_id"`
	MemberCode       string  `json:"member_code"`
	MemberName       string  `json:"member_name"`
	MemberType       string  `json:"member_type"`
	Phone            string  `json:"phone"`
	TransactionCount int64   `json:"transaction_count"`
	TotalPurchase    float64 `json:"total_purchase"` // Total bought from store
	TotalSell        float64 `json:"total_sell"`     // Total sold to store
	Points           int     `json:"points"`
}

// GetMemberTransactionReport returns member transaction summary
func GetMemberTransactionReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	memberID := c.Query("member_id")

	var results []MemberTransactionReport

	query := `
		SELECT 
			m.id as member_id,
			m.member_code,
			m.name as member_name,
			m.type as member_type,
			m.phone,
			COUNT(t.id) as transaction_count,
			COALESCE(SUM(CASE WHEN t.type = 'sale' THEN t.grand_total ELSE 0 END), 0) as total_purchase,
			COALESCE(SUM(CASE WHEN t.type = 'purchase' THEN t.grand_total ELSE 0 END), 0) as total_sell,
			m.points
		FROM members m
		LEFT JOIN transactions t ON t.member_id = m.id 
			AND t.status = 'completed' 
			AND t.deleted_at IS NULL
	`

	if startDate != "" {
		query += " AND t.transaction_date >= '" + startDate + "'"
	}
	if endDate != "" {
		query += " AND t.transaction_date <= '" + endDate + " 23:59:59'"
	}

	query += " WHERE m.deleted_at IS NULL"

	if memberID != "" {
		query += " AND m.id = " + memberID
	}

	query += `
		GROUP BY m.id, m.member_code, m.name, m.type, m.phone, m.points
		ORDER BY transaction_count DESC
	`

	if err := database.DB.Raw(query).Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": results})
}

// MemberPointsReport represents member points summary
type MemberPointsReport struct {
	MemberID      uint      `json:"member_id"`
	MemberCode    string    `json:"member_code"`
	MemberName    string    `json:"member_name"`
	MemberType    string    `json:"member_type"`
	Phone         string    `json:"phone"`
	CurrentPoints int       `json:"current_points"`
	TotalPurchase float64   `json:"total_purchase"`
	JoinDate      time.Time `json:"join_date"`
}

// GetMemberPointsReport returns member points summary
func GetMemberPointsReport(c *gin.Context) {
	memberType := c.Query("type") // regular, silver, gold, platinum
	minPoints := c.Query("min_points")

	var members []models.Member
	query := database.DB.Model(&models.Member{}).
		Where("is_active = ?", true)

	if memberType != "" {
		query = query.Where("type = ?", memberType)
	}
	if minPoints != "" {
		query = query.Where("points >= ?", minPoints)
	}

	if err := query.Order("points DESC").Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var reports []MemberPointsReport
	for _, m := range members {
		reports = append(reports, MemberPointsReport{
			MemberID:      m.ID,
			MemberCode:    m.MemberCode,
			MemberName:    m.Name,
			MemberType:    string(m.Type),
			Phone:         m.Phone,
			CurrentPoints: m.Points,
			TotalPurchase: m.TotalPurchase,
			JoinDate:      m.JoinDate,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// TopMemberReport represents top member by purchase/sale
type TopMemberReport struct {
	Rank        int     `json:"rank"`
	MemberID    uint    `json:"member_id"`
	MemberCode  string  `json:"member_code"`
	MemberName  string  `json:"member_name"`
	MemberType  string  `json:"member_type"`
	Phone       string  `json:"phone"`
	TotalAmount float64 `json:"total_amount"`
	TxCount     int64   `json:"transaction_count"`
}

// GetTopMembersReport returns top members by purchase or sale
func GetTopMembersReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	sortBy := c.DefaultQuery("sort_by", "purchase") // purchase or sell
	limit := c.DefaultQuery("limit", "10")

	txType := models.TransactionTypeSale
	if sortBy == "sell" {
		txType = models.TransactionTypePurchase
	}

	type Result struct {
		MemberID    uint    `json:"member_id"`
		MemberCode  string  `json:"member_code"`
		MemberName  string  `json:"member_name"`
		MemberType  string  `json:"member_type"`
		Phone       string  `json:"phone"`
		TotalAmount float64 `json:"total_amount"`
		TxCount     int64   `json:"tx_count"`
	}

	var results []Result
	query := database.DB.Model(&models.Transaction{}).
		Select("transactions.member_id, members.member_code, members.name as member_name, members.type as member_type, members.phone, SUM(transactions.grand_total) as total_amount, COUNT(*) as tx_count").
		Joins("JOIN members ON members.id = transactions.member_id").
		Where("transactions.type = ? AND transactions.status = ? AND transactions.member_id IS NOT NULL AND transactions.deleted_at IS NULL", txType, "completed").
		Group("transactions.member_id, members.member_code, members.name, members.type, members.phone").
		Order("total_amount DESC").
		Limit(parseInt(limit))

	if startDate != "" {
		query = query.Where("transactions.transaction_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("transactions.transaction_date <= ?", endDate+" 23:59:59")
	}

	if err := query.Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var reports []TopMemberReport
	for i, r := range results {
		reports = append(reports, TopMemberReport{
			Rank:        i + 1,
			MemberID:    r.MemberID,
			MemberCode:  r.MemberCode,
			MemberName:  r.MemberName,
			MemberType:  r.MemberType,
			Phone:       r.Phone,
			TotalAmount: r.TotalAmount,
			TxCount:     r.TxCount,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// Helper function to parse int with default
func parseInt(s string) int {
	var result int
	_, _ = fmt.Sscanf(s, "%d", &result)
	if result <= 0 {
		return 10
	}
	return result
}

// ==================== GOLD PRICE REPORTS ====================

// PriceHistoryReport represents gold price history
type PriceHistoryReport struct {
	ID            uint                 `json:"id"`
	UpdateDate    time.Time            `json:"update_date"`
	UpdatedByName string               `json:"updated_by_name"`
	Notes         string               `json:"notes"`
	Details       []PriceHistoryDetail `json:"details"`
}

// PriceHistoryDetail represents individual category price change
type PriceHistoryDetail struct {
	CategoryCode    string  `json:"category_code"`
	CategoryName    string  `json:"category_name"`
	OldBuyPrice     float64 `json:"old_buy_price"`
	NewBuyPrice     float64 `json:"new_buy_price"`
	BuyPriceChange  float64 `json:"buy_price_change"`
	OldSellPrice    float64 `json:"old_sell_price"`
	NewSellPrice    float64 `json:"new_sell_price"`
	SellPriceChange float64 `json:"sell_price_change"`
}

// GetPriceHistoryReport returns gold price update history
func GetPriceHistoryReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	categoryID := c.Query("category_id")

	var logs []models.PriceUpdateLog
	query := database.DB.Model(&models.PriceUpdateLog{}).
		Preload("UpdatedBy").
		Preload("PriceDetails").
		Preload("PriceDetails.GoldCategory")

	if startDate != "" {
		query = query.Where("update_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("update_date <= ?", endDate+" 23:59:59")
	}

	if err := query.Order("update_date DESC").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var reports []PriceHistoryReport
	for _, log := range logs {
		updatedByName := ""
		if log.UpdatedBy != nil {
			updatedByName = log.UpdatedBy.FullName
		}

		var details []PriceHistoryDetail
		for _, d := range log.PriceDetails {
			// Filter by category if specified
			if categoryID != "" && fmt.Sprintf("%d", d.GoldCategoryID) != categoryID {
				continue
			}

			categoryCode := ""
			categoryName := ""
			if d.GoldCategory != nil {
				categoryCode = d.GoldCategory.Code
				categoryName = d.GoldCategory.Name
			}

			details = append(details, PriceHistoryDetail{
				CategoryCode:    categoryCode,
				CategoryName:    categoryName,
				OldBuyPrice:     d.OldBuyPrice,
				NewBuyPrice:     d.NewBuyPrice,
				BuyPriceChange:  d.NewBuyPrice - d.OldBuyPrice,
				OldSellPrice:    d.OldSellPrice,
				NewSellPrice:    d.NewSellPrice,
				SellPriceChange: d.NewSellPrice - d.OldSellPrice,
			})
		}

		// Skip logs with no matching details when filtering by category
		if categoryID != "" && len(details) == 0 {
			continue
		}

		reports = append(reports, PriceHistoryReport{
			ID:            log.ID,
			UpdateDate:    log.UpdateDate,
			UpdatedByName: updatedByName,
			Notes:         log.Notes,
			Details:       details,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// DailyPriceReport represents daily gold price
type DailyPriceReport struct {
	Date         string  `json:"date"`
	CategoryCode string  `json:"category_code"`
	CategoryName string  `json:"category_name"`
	BuyPrice     float64 `json:"buy_price"`
	SellPrice    float64 `json:"sell_price"`
	BuyChange    float64 `json:"buy_change"`
	SellChange   float64 `json:"sell_change"`
}

// GetDailyPriceReport returns daily gold price updates
func GetDailyPriceReport(c *gin.Context) {
	days := c.DefaultQuery("days", "30") // Last N days

	var results []DailyPriceReport

	query := `
		SELECT 
			DATE(pul.update_date) as date,
			gc.code as category_code,
			gc.name as category_name,
			pd.new_buy_price as buy_price,
			pd.new_sell_price as sell_price,
			(pd.new_buy_price - pd.old_buy_price) as buy_change,
			(pd.new_sell_price - pd.old_sell_price) as sell_change
		FROM price_update_logs pul
		JOIN price_details pd ON pd.price_update_log_id = pul.id
		JOIN gold_categories gc ON gc.id = pd.gold_category_id
		WHERE pul.deleted_at IS NULL
			AND pd.deleted_at IS NULL
			AND pul.update_date >= DATE_SUB(NOW(), INTERVAL ` + days + ` DAY)
		ORDER BY pul.update_date DESC, gc.code
	`

	if err := database.DB.Raw(query).Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": results})
}

// CurrentPriceReport represents current gold prices
type CurrentPriceReport struct {
	CategoryID   uint      `json:"category_id"`
	CategoryCode string    `json:"category_code"`
	CategoryName string    `json:"category_name"`
	Purity       *float64  `json:"purity"`
	BuyPrice     float64   `json:"buy_price"`
	SellPrice    float64   `json:"sell_price"`
	LastUpdated  time.Time `json:"last_updated"`
}

// GetCurrentPriceReport returns current gold prices for all categories
func GetCurrentPriceReport(c *gin.Context) {
	var categories []models.GoldCategory
	if err := database.DB.Where("is_active = ?", true).Order("code").Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var reports []CurrentPriceReport
	for _, cat := range categories {
		reports = append(reports, CurrentPriceReport{
			CategoryID:   cat.ID,
			CategoryCode: cat.Code,
			CategoryName: cat.Name,
			Purity:       cat.Purity,
			BuyPrice:     cat.BuyPrice,
			SellPrice:    cat.SellPrice,
			LastUpdated:  cat.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// ==================== DASHBOARD SUMMARY ====================

// DashboardSummary represents overall dashboard summary
type DashboardSummary struct {
	// Today's stats
	TodaySales        float64 `json:"today_sales"`
	TodayPurchases    float64 `json:"today_purchases"`
	TodayTransactions int64   `json:"today_transactions"`

	// This month stats
	MonthSales        float64 `json:"month_sales"`
	MonthPurchases    float64 `json:"month_purchases"`
	MonthTransactions int64   `json:"month_transactions"`

	// Inventory stats
	TotalStock     int64   `json:"total_stock"`
	AvailableStock int64   `json:"available_stock"`
	StockValue     float64 `json:"stock_value"`

	// Member stats
	TotalMembers  int64 `json:"total_members"`
	ActiveMembers int64 `json:"active_members"`

	// Location stats
	TotalLocations int64 `json:"total_locations"`
}

// GetDashboardSummary returns overall dashboard summary
func GetDashboardSummary(c *gin.Context) {
	var summary DashboardSummary
	today := time.Now().Format("2006-01-02")
	monthStart := time.Now().Format("2006-01") + "-01"

	// Today's stats
	database.DB.Model(&models.Transaction{}).
		Where("DATE(transaction_date) = ? AND type = ? AND status = ?", today, "sale", "completed").
		Select("COALESCE(SUM(grand_total), 0)").Scan(&summary.TodaySales)

	database.DB.Model(&models.Transaction{}).
		Where("DATE(transaction_date) = ? AND type = ? AND status = ?", today, "purchase", "completed").
		Select("COALESCE(SUM(grand_total), 0)").Scan(&summary.TodayPurchases)

	database.DB.Model(&models.Transaction{}).
		Where("DATE(transaction_date) = ? AND status = ?", today, "completed").
		Count(&summary.TodayTransactions)

	// This month stats
	database.DB.Model(&models.Transaction{}).
		Where("transaction_date >= ? AND type = ? AND status = ?", monthStart, "sale", "completed").
		Select("COALESCE(SUM(grand_total), 0)").Scan(&summary.MonthSales)

	database.DB.Model(&models.Transaction{}).
		Where("transaction_date >= ? AND type = ? AND status = ?", monthStart, "purchase", "completed").
		Select("COALESCE(SUM(grand_total), 0)").Scan(&summary.MonthPurchases)

	database.DB.Model(&models.Transaction{}).
		Where("transaction_date >= ? AND status = ?", monthStart, "completed").
		Count(&summary.MonthTransactions)

	// Inventory stats
	database.DB.Model(&models.Stock{}).Count(&summary.TotalStock)
	database.DB.Model(&models.Stock{}).Where("status = ?", "available").Count(&summary.AvailableStock)
	database.DB.Model(&models.Stock{}).
		Where("status = ?", "available").
		Select("COALESCE(SUM(sell_price), 0)").Scan(&summary.StockValue)

	// Member stats
	database.DB.Model(&models.Member{}).Count(&summary.TotalMembers)
	database.DB.Model(&models.Member{}).Where("is_active = ?", true).Count(&summary.ActiveMembers)

	// Location stats
	database.DB.Model(&models.Location{}).Where("is_active = ?", true).Count(&summary.TotalLocations)

	c.JSON(http.StatusOK, gin.H{"data": summary})
}
