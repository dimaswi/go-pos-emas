package handlers

import (
	"fmt"
	"net/http"
	"starter/backend/database"
	"starter/backend/models"
	"time"

	"github.com/gin-gonic/gin"
)

// GetProducts returns all products
func GetProducts(c *gin.Context) {
	var products []models.Product
	query := database.DB.Preload("GoldCategory")

	// Filter by type if provided
	if productType := c.Query("type"); productType != "" {
		query = query.Where("type = ?", productType)
	}

	// Filter by category if provided
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}

	// Filter by gold_category_id if provided
	if goldCategoryID := c.Query("gold_category_id"); goldCategoryID != "" {
		query = query.Where("gold_category_id = ?", goldCategoryID)
	}

	if err := query.Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": products})
}

// GetProduct returns a single product by ID
func GetProduct(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := database.DB.Preload("GoldCategory").Preload("Stocks").First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": product})
}

// GetProductByBarcode returns a product by barcode
func GetProductByBarcode(c *gin.Context) {
	barcode := c.Param("barcode")
	var product models.Product
	if err := database.DB.Preload("GoldCategory").Where("barcode = ?", barcode).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": product})
}

type CreateProductRequest struct {
	Name           string                 `json:"name" binding:"required"`
	Type           models.ProductType     `json:"type" binding:"required"`
	Category       models.ProductCategory `json:"category" binding:"required"`
	GoldCategoryID uint                   `json:"gold_category_id" binding:"required"`
	Weight         float64                `json:"weight" binding:"required"`
	Description    string                 `json:"description"`
	RingSize       string                 `json:"ring_size"`
	BraceletLength float64                `json:"bracelet_length"`
	NecklaceLength float64                `json:"necklace_length"`
	EarringType    string                 `json:"earring_type"`
	ImageURL       string                 `json:"image_url"`
	IsActive       *bool                  `json:"is_active"`
}

// CreateProduct creates a new product with auto-generated barcode
func CreateProduct(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate barcode
	barcode := generateBarcode(req.Type)

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	product := models.Product{
		Barcode:        barcode,
		Name:           req.Name,
		Type:           req.Type,
		Category:       req.Category,
		GoldCategoryID: req.GoldCategoryID,
		Weight:         req.Weight,
		Description:    req.Description,
		RingSize:       req.RingSize,
		BraceletLength: req.BraceletLength,
		NecklaceLength: req.NecklaceLength,
		EarringType:    req.EarringType,
		ImageURL:       req.ImageURL,
		IsActive:       isActive,
	}

	if err := database.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	database.DB.Preload("GoldCategory").First(&product, product.ID)
	c.JSON(http.StatusCreated, gin.H{"data": product})
}

// generateBarcode generates a unique barcode for product
func generateBarcode(productType models.ProductType) string {
	prefix := "GLD"
	switch productType {
	case models.ProductTypeGelang:
		prefix = "GLG"
	case models.ProductTypeCincin:
		prefix = "CIN"
	case models.ProductTypeKalung:
		prefix = "KLG"
	case models.ProductTypeAnting:
		prefix = "ANT"
	case models.ProductTypeLiontin:
		prefix = "LNT"
	}
	timestamp := time.Now().UnixNano() / 1000000
	return fmt.Sprintf("%s%d", prefix, timestamp)
}

type UpdateProductRequest struct {
	Name           string                 `json:"name"`
	Type           models.ProductType     `json:"type"`
	Category       models.ProductCategory `json:"category"`
	GoldCategoryID uint                   `json:"gold_category_id"`
	Weight         float64                `json:"weight"`
	Description    string                 `json:"description"`
	RingSize       string                 `json:"ring_size"`
	BraceletLength float64                `json:"bracelet_length"`
	NecklaceLength float64                `json:"necklace_length"`
	EarringType    string                 `json:"earring_type"`
	ImageURL       string                 `json:"image_url"`
	IsActive       *bool                  `json:"is_active"`
}

// UpdateProduct updates an existing product
func UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := database.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		product.Name = req.Name
	}
	if req.Type != "" {
		product.Type = req.Type
	}
	if req.Category != "" {
		product.Category = req.Category
	}
	if req.GoldCategoryID > 0 {
		product.GoldCategoryID = req.GoldCategoryID
	}
	if req.Weight > 0 {
		product.Weight = req.Weight
	}
	if req.Description != "" {
		product.Description = req.Description
	}
	if req.RingSize != "" {
		product.RingSize = req.RingSize
	}
	if req.BraceletLength > 0 {
		product.BraceletLength = req.BraceletLength
	}
	if req.NecklaceLength > 0 {
		product.NecklaceLength = req.NecklaceLength
	}
	if req.EarringType != "" {
		product.EarringType = req.EarringType
	}
	if req.ImageURL != "" {
		product.ImageURL = req.ImageURL
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}

	if err := database.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	database.DB.Preload("GoldCategory").First(&product, product.ID)
	c.JSON(http.StatusOK, gin.H{"data": product})
}

// DeleteProduct deletes a product
func DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Product{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}
