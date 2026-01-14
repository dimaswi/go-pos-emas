package handlers

import (
	"net/http"
	"starter/backend/database"
	"starter/backend/models"

	"github.com/gin-gonic/gin"
)

// GetGoldCategories returns all gold categories
func GetGoldCategories(c *gin.Context) {
	var categories []models.GoldCategory
	if err := database.DB.Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": categories})
}

// GetGoldCategory returns a single gold category by ID
func GetGoldCategory(c *gin.Context) {
	id := c.Param("id")
	var category models.GoldCategory
	if err := database.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Gold category not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": category})
}

type CreateGoldCategoryRequest struct {
	Code        string   `json:"code" binding:"required"`
	Name        string   `json:"name" binding:"required"`
	Purity      *float64 `json:"purity"`
	BuyPrice    float64  `json:"buy_price" binding:"required"`
	SellPrice   float64  `json:"sell_price" binding:"required"`
	Description string   `json:"description"`
	IsActive    *bool    `json:"is_active"`
}

// CreateGoldCategory creates a new gold category
func CreateGoldCategory(c *gin.Context) {
	var req CreateGoldCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	category := models.GoldCategory{
		Code:        req.Code,
		Name:        req.Name,
		Purity:      req.Purity,
		BuyPrice:    req.BuyPrice,
		SellPrice:   req.SellPrice,
		Description: req.Description,
		IsActive:    isActive,
	}

	if err := database.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": category})
}

type UpdateGoldCategoryRequest struct {
	Code        string   `json:"code"`
	Name        string   `json:"name"`
	Purity      *float64 `json:"purity"`
	BuyPrice    float64  `json:"buy_price"`
	SellPrice   float64  `json:"sell_price"`
	Description string   `json:"description"`
	IsActive    *bool    `json:"is_active"`
}

// UpdateGoldCategory updates an existing gold category
func UpdateGoldCategory(c *gin.Context) {
	id := c.Param("id")
	var category models.GoldCategory
	if err := database.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Gold category not found"})
		return
	}

	var req UpdateGoldCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Code != "" {
		category.Code = req.Code
	}
	if req.Name != "" {
		category.Name = req.Name
	}
	if req.Purity != nil {
		category.Purity = req.Purity
	}
	if req.BuyPrice > 0 {
		category.BuyPrice = req.BuyPrice
	}
	if req.SellPrice > 0 {
		category.SellPrice = req.SellPrice
	}
	if req.Description != "" {
		category.Description = req.Description
	}
	if req.IsActive != nil {
		category.IsActive = *req.IsActive
	}

	if err := database.DB.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": category})
}

// DeleteGoldCategory deletes a gold category
func DeleteGoldCategory(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.GoldCategory{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Gold category deleted successfully"})
}
