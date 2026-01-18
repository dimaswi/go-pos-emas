package handlers

import (
	"net/http"
	"starter/backend/database"
	"starter/backend/models"
	"time"

	"github.com/gin-gonic/gin"
)

// CheckPriceUpdateNeededResponse contains the response for price update check
type CheckPriceUpdateNeededResponse struct {
	NeedsUpdate    bool                   `json:"needs_update"`
	LastUpdate     *time.Time             `json:"last_update"`
	LastUpdatedBy  *models.User           `json:"last_updated_by,omitempty"`
	GoldCategories []models.GoldCategory  `json:"gold_categories"`
}

// CheckPriceUpdateNeeded checks if gold price update is needed for today
func CheckPriceUpdateNeeded(c *gin.Context) {
	// Get today's date range
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	// Check if there's a price update for today
	var lastUpdate models.PriceUpdateLog
	result := database.DB.Preload("UpdatedBy").
		Where("created_at >= ? AND created_at < ?", startOfDay, endOfDay).
		Order("created_at DESC").
		First(&lastUpdate)

	// Get all active gold categories
	var goldCategories []models.GoldCategory
	database.DB.Where("is_active = ?", true).Find(&goldCategories)

	response := CheckPriceUpdateNeededResponse{
		NeedsUpdate:    result.Error != nil, // If no record found, needs update
		GoldCategories: goldCategories,
	}

	if result.Error == nil {
		response.LastUpdate = &lastUpdate.CreatedAt
		response.LastUpdatedBy = lastUpdate.UpdatedBy
	} else {
		// Get the most recent update (any day)
		var latestUpdate models.PriceUpdateLog
		if err := database.DB.Preload("UpdatedBy").Order("created_at DESC").First(&latestUpdate).Error; err == nil {
			response.LastUpdate = &latestUpdate.CreatedAt
			response.LastUpdatedBy = latestUpdate.UpdatedBy
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// BulkUpdatePriceRequest represents the request for bulk price update
type BulkUpdatePriceRequest struct {
	Prices []PriceUpdateItem `json:"prices" binding:"required,min=1"`
	Notes  string            `json:"notes"`
}

// PriceUpdateItem represents a single price update for a gold category
type PriceUpdateItem struct {
	GoldCategoryID uint    `json:"gold_category_id" binding:"required"`
	BuyPrice       float64 `json:"buy_price" binding:"required,min=0"`
	SellPrice      float64 `json:"sell_price" binding:"required,min=0"`
}

// BulkUpdatePrices updates prices for multiple gold categories at once
func BulkUpdatePrices(c *gin.Context) {
	var req BulkUpdatePriceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get current user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Start transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create price update log
	now := time.Now()
	priceUpdateLog := models.PriceUpdateLog{
		UpdateDate:  now,
		UpdatedByID: userID.(uint),
		Notes:       req.Notes,
	}

	if err := tx.Create(&priceUpdateLog).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create price update log"})
		return
	}

	// Update each gold category
	for _, item := range req.Prices {
		var category models.GoldCategory
		if err := tx.First(&category, item.GoldCategoryID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{"error": "Gold category not found", "gold_category_id": item.GoldCategoryID})
			return
		}

		// Create price detail record
		priceDetail := models.PriceDetail{
			PriceUpdateLogID: priceUpdateLog.ID,
			GoldCategoryID:   item.GoldCategoryID,
			OldBuyPrice:      category.BuyPrice,
			NewBuyPrice:      item.BuyPrice,
			OldSellPrice:     category.SellPrice,
			NewSellPrice:     item.SellPrice,
		}

		if err := tx.Create(&priceDetail).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create price detail"})
			return
		}

		// Update the gold category prices
		if err := tx.Model(&category).Updates(map[string]interface{}{
			"buy_price":  item.BuyPrice,
			"sell_price": item.SellPrice,
		}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update gold category"})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Reload the price update log with relations
	var updatedLog models.PriceUpdateLog
	database.DB.Preload("UpdatedBy").Preload("PriceDetails.GoldCategory").First(&updatedLog, priceUpdateLog.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Prices updated successfully",
		"data":    updatedLog,
	})
}

// GetPriceUpdateLogs returns history of price updates
func GetPriceUpdateLogs(c *gin.Context) {
	var logs []models.PriceUpdateLog

	query := database.DB.Preload("UpdatedBy").Preload("PriceDetails.GoldCategory").Order("update_date DESC, created_at DESC")

	// Optional date filtering
	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("update_date >= ?", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("update_date <= ?", endDate)
	}

	// Limit results
	limit := 50
	if err := query.Limit(limit).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": logs})
}

// GetPriceUpdateLog returns a single price update log by ID
func GetPriceUpdateLog(c *gin.Context) {
	id := c.Param("id")

	var log models.PriceUpdateLog
	if err := database.DB.Preload("UpdatedBy").Preload("PriceDetails.GoldCategory").First(&log, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Price update log not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": log})
}
