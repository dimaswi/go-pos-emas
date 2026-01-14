package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"starter/backend/database"
	"starter/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GenerateRawMaterialCode generates unique code for raw material
func GenerateRawMaterialCode() string {
	timestamp := time.Now().UnixNano() / int64(time.Millisecond)
	return fmt.Sprintf("RM%d", timestamp)
}

// GetRawMaterials returns all raw materials with pagination and filters
func GetRawMaterials(c *gin.Context) {
	var rawMaterials []models.RawMaterial
	var total int64

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	// Base query with preloads
	query := database.DB.Model(&models.RawMaterial{}).
		Preload("GoldCategory").
		Preload("Location").
		Preload("Member").
		Preload("ReceivedBy")

	// Filters
	if locationID := c.Query("location_id"); locationID != "" {
		query = query.Where("location_id = ?", locationID)
	}

	if goldCategoryID := c.Query("gold_category_id"); goldCategoryID != "" {
		query = query.Where("gold_category_id = ?", goldCategoryID)
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	if condition := c.Query("condition"); condition != "" {
		query = query.Where("condition = ?", condition)
	}

	if search := c.Query("search"); search != "" {
		searchTerm := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(code) LIKE ? OR LOWER(supplier_name) LIKE ? OR LOWER(notes) LIKE ?", searchTerm, searchTerm, searchTerm)
	}

	// Count total
	query.Count(&total)

	// Get data with pagination
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&rawMaterials).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": rawMaterials,
		"meta": gin.H{
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetRawMaterial returns a single raw material by ID
func GetRawMaterial(c *gin.Context) {
	id := c.Param("id")

	var rawMaterial models.RawMaterial
	if err := database.DB.
		Preload("GoldCategory").
		Preload("Location").
		Preload("Member").
		Preload("ReceivedBy").
		First(&rawMaterial, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Raw material not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": rawMaterial})
}

type CreateRawMaterialRequest struct {
	GoldCategoryID   *uint   `json:"gold_category_id"`
	LocationID       uint    `json:"location_id" binding:"required"`
	WeightGross      float64 `json:"weight_gross"`                    // Berat kotor
	ShrinkagePercent float64 `json:"shrinkage_percent"`               // Persen susut
	WeightGrams      float64 `json:"weight_grams" binding:"required"` // Berat bersih
	Purity           float64 `json:"purity"`
	BuyPricePerGram  float64 `json:"buy_price_per_gram" binding:"required"`
	Condition        string  `json:"condition"`
	SupplierName     string  `json:"supplier_name"`
	MemberID         *uint   `json:"member_id"`
	TransactionID    *uint   `json:"transaction_id"`
	Notes            string  `json:"notes"`
}

// CreateRawMaterial creates a new raw material
func CreateRawMaterial(c *gin.Context) {
	var req CreateRawMaterialRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}
	currentUser := user.(*models.User)

	// Calculate total buy price (based on berat bersih)
	totalBuyPrice := req.WeightGrams * req.BuyPricePerGram

	// Set weight gross default to weight grams if not provided
	weightGross := req.WeightGross
	if weightGross == 0 {
		weightGross = req.WeightGrams
	}

	condition := models.RawMaterialConditionLikeNew
	if req.Condition != "" {
		condition = models.RawMaterialCondition(req.Condition)
	}

	now := time.Now()

	rawMaterial := models.RawMaterial{
		Code:             GenerateRawMaterialCode(),
		GoldCategoryID:   req.GoldCategoryID,
		LocationID:       req.LocationID,
		WeightGross:      weightGross,
		ShrinkagePercent: req.ShrinkagePercent,
		WeightGrams:      req.WeightGrams,
		Purity:           req.Purity,
		BuyPricePerGram:  req.BuyPricePerGram,
		TotalBuyPrice:    totalBuyPrice,
		Condition:        condition,
		Status:           models.RawMaterialStatusAvailable,
		SupplierName:     req.SupplierName,
		MemberID:         req.MemberID,
		TransactionID:    req.TransactionID,
		ReceivedAt:       &now,
		ReceivedByID:     &currentUser.ID,
		Notes:            req.Notes,
	}

	if err := database.DB.Create(&rawMaterial).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with associations
	database.DB.
		Preload("GoldCategory").
		Preload("Location").
		Preload("Member").
		Preload("ReceivedBy").
		First(&rawMaterial, rawMaterial.ID)

	c.JSON(http.StatusCreated, rawMaterial)
}

type UpdateRawMaterialRequest struct {
	GoldCategoryID   *uint   `json:"gold_category_id"`
	LocationID       *uint   `json:"location_id"`
	WeightGross      float64 `json:"weight_gross"`
	ShrinkagePercent float64 `json:"shrinkage_percent"`
	WeightGrams      float64 `json:"weight_grams"`
	Purity           float64 `json:"purity"`
	BuyPricePerGram  float64 `json:"buy_price_per_gram"`
	Condition        string  `json:"condition"`
	Status           string  `json:"status"`
	SupplierName     string  `json:"supplier_name"`
	MemberID         *uint   `json:"member_id"`
	Notes            string  `json:"notes"`
}

// UpdateRawMaterial updates a raw material
func UpdateRawMaterial(c *gin.Context) {
	id := c.Param("id")

	var rawMaterial models.RawMaterial
	if err := database.DB.First(&rawMaterial, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Raw material not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var req UpdateRawMaterialRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := make(map[string]interface{})

	if req.GoldCategoryID != nil {
		updates["gold_category_id"] = req.GoldCategoryID
	}
	if req.LocationID != nil {
		updates["location_id"] = req.LocationID
	}
	if req.WeightGross > 0 {
		updates["weight_gross"] = req.WeightGross
	}
	if req.ShrinkagePercent >= 0 {
		updates["shrinkage_percent"] = req.ShrinkagePercent
	}
	if req.WeightGrams > 0 {
		updates["weight_grams"] = req.WeightGrams
	}
	if req.Purity > 0 {
		updates["purity"] = req.Purity
	}
	if req.BuyPricePerGram > 0 {
		updates["buy_price_per_gram"] = req.BuyPricePerGram
	}
	if req.Condition != "" {
		updates["condition"] = req.Condition
	}
	if req.Status != "" {
		updates["status"] = req.Status
		if req.Status == string(models.RawMaterialStatusProcessed) {
			now := time.Now()
			updates["processed_at"] = &now
		}
	}
	if req.SupplierName != "" {
		updates["supplier_name"] = req.SupplierName
	}
	if req.MemberID != nil {
		updates["member_id"] = req.MemberID
	}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}

	// Recalculate total if weight or price changed
	weight := rawMaterial.WeightGrams
	price := rawMaterial.BuyPricePerGram
	if req.WeightGrams > 0 {
		weight = req.WeightGrams
	}
	if req.BuyPricePerGram > 0 {
		price = req.BuyPricePerGram
	}
	updates["total_buy_price"] = weight * price

	if err := database.DB.Model(&rawMaterial).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with associations
	database.DB.
		Preload("GoldCategory").
		Preload("Location").
		Preload("Member").
		Preload("ReceivedBy").
		First(&rawMaterial, rawMaterial.ID)

	c.JSON(http.StatusOK, rawMaterial)
}

// DeleteRawMaterial deletes a raw material
func DeleteRawMaterial(c *gin.Context) {
	id := c.Param("id")

	var rawMaterial models.RawMaterial
	if err := database.DB.First(&rawMaterial, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Raw material not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Only allow delete if status is available
	if rawMaterial.Status != models.RawMaterialStatusAvailable {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete processed or sold raw material"})
		return
	}

	if err := database.DB.Delete(&rawMaterial).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Raw material deleted successfully"})
}

// GetRawMaterialStats returns statistics for raw materials
func GetRawMaterialStats(c *gin.Context) {
	var totalWeight float64
	var totalValue float64
	var totalCount int64

	database.DB.Model(&models.RawMaterial{}).
		Where("status = ?", models.RawMaterialStatusAvailable).
		Count(&totalCount)

	database.DB.Model(&models.RawMaterial{}).
		Where("status = ?", models.RawMaterialStatusAvailable).
		Select("COALESCE(SUM(weight_grams), 0)").
		Scan(&totalWeight)

	database.DB.Model(&models.RawMaterial{}).
		Where("status = ?", models.RawMaterialStatusAvailable).
		Select("COALESCE(SUM(total_buy_price), 0)").
		Scan(&totalValue)

	// Stats by location
	type LocationStat struct {
		LocationID   uint    `json:"location_id"`
		LocationName string  `json:"location_name"`
		TotalWeight  float64 `json:"total_weight"`
		TotalValue   float64 `json:"total_value"`
		TotalCount   int64   `json:"total_count"`
	}
	var locationStats []LocationStat

	database.DB.Model(&models.RawMaterial{}).
		Select("raw_materials.location_id, locations.name as location_name, COALESCE(SUM(raw_materials.weight_grams), 0) as total_weight, COALESCE(SUM(raw_materials.total_buy_price), 0) as total_value, COUNT(*) as total_count").
		Joins("LEFT JOIN locations ON locations.id = raw_materials.location_id").
		Where("raw_materials.status = ?", models.RawMaterialStatusAvailable).
		Group("raw_materials.location_id, locations.name").
		Find(&locationStats)

	c.JSON(http.StatusOK, gin.H{
		"total_count":    totalCount,
		"total_weight":   totalWeight,
		"total_value":    totalValue,
		"location_stats": locationStats,
	})
}
