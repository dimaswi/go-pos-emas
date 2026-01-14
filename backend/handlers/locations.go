package handlers

import (
	"net/http"
	"starter/backend/database"
	"starter/backend/models"

	"github.com/gin-gonic/gin"
)

// ==================== LOCATIONS ====================

// GetLocations returns all locations
func GetLocations(c *gin.Context) {
	var locations []models.Location
	query := database.DB

	// Filter by type if provided
	if locType := c.Query("type"); locType != "" {
		query = query.Where("type = ?", locType)
	}

	if err := query.Find(&locations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": locations})
}

// GetLocation returns a single location with boxes
func GetLocation(c *gin.Context) {
	id := c.Param("id")
	var location models.Location
	if err := database.DB.Preload("Boxes").First(&location, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Location not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": location})
}

type CreateLocationRequest struct {
	Code        string              `json:"code" binding:"required"`
	Name        string              `json:"name" binding:"required"`
	Type        models.LocationType `json:"type" binding:"required"`
	Address     string              `json:"address"`
	Phone       string              `json:"phone"`
	Description string              `json:"description"`
	IsActive    *bool               `json:"is_active"`
}

// CreateLocation creates a new location
func CreateLocation(c *gin.Context) {
	var req CreateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	location := models.Location{
		Code:        req.Code,
		Name:        req.Name,
		Type:        req.Type,
		Address:     req.Address,
		Phone:       req.Phone,
		Description: req.Description,
		IsActive:    isActive,
	}

	if err := database.DB.Create(&location).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": location})
}

type UpdateLocationRequest struct {
	Code        string              `json:"code"`
	Name        string              `json:"name"`
	Type        models.LocationType `json:"type"`
	Address     string              `json:"address"`
	Phone       string              `json:"phone"`
	Description string              `json:"description"`
	IsActive    *bool               `json:"is_active"`
}

// UpdateLocation updates an existing location
func UpdateLocation(c *gin.Context) {
	id := c.Param("id")
	var location models.Location
	if err := database.DB.First(&location, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Location not found"})
		return
	}

	var req UpdateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Code != "" {
		location.Code = req.Code
	}
	if req.Name != "" {
		location.Name = req.Name
	}
	if req.Type != "" {
		location.Type = req.Type
	}
	if req.Address != "" {
		location.Address = req.Address
	}
	if req.Phone != "" {
		location.Phone = req.Phone
	}
	if req.Description != "" {
		location.Description = req.Description
	}
	if req.IsActive != nil {
		location.IsActive = *req.IsActive
	}

	if err := database.DB.Save(&location).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": location})
}

// DeleteLocation deletes a location
func DeleteLocation(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Location{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Location deleted successfully"})
}

// ==================== STORAGE BOXES ====================

// GetStorageBoxes returns all storage boxes, optionally filtered by location
func GetStorageBoxes(c *gin.Context) {
	var boxes []models.StorageBox
	query := database.DB.Preload("Location")

	// Filter by location_id if provided
	if locationID := c.Query("location_id"); locationID != "" {
		query = query.Where("location_id = ?", locationID)
	}

	if err := query.Find(&boxes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": boxes})
}

// GetStorageBox returns a single storage box
func GetStorageBox(c *gin.Context) {
	id := c.Param("id")
	var box models.StorageBox
	if err := database.DB.Preload("Location").Preload("Stocks").First(&box, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Storage box not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": box})
}

type CreateStorageBoxRequest struct {
	LocationID  uint   `json:"location_id" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Capacity    int    `json:"capacity"`
	IsActive    *bool  `json:"is_active"`
}

// CreateStorageBox creates a new storage box
func CreateStorageBox(c *gin.Context) {
	var req CreateStorageBoxRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify location exists
	var location models.Location
	if err := database.DB.First(&location, req.LocationID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Location not found"})
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	box := models.StorageBox{
		LocationID:  req.LocationID,
		Code:        req.Code,
		Name:        req.Name,
		Description: req.Description,
		Capacity:    req.Capacity,
		IsActive:    isActive,
	}

	if err := database.DB.Create(&box).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	database.DB.Preload("Location").First(&box, box.ID)
	c.JSON(http.StatusCreated, gin.H{"data": box})
}

type UpdateStorageBoxRequest struct {
	LocationID  uint   `json:"location_id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Capacity    int    `json:"capacity"`
	IsActive    *bool  `json:"is_active"`
}

// UpdateStorageBox updates an existing storage box
func UpdateStorageBox(c *gin.Context) {
	id := c.Param("id")
	var box models.StorageBox
	if err := database.DB.First(&box, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Storage box not found"})
		return
	}

	var req UpdateStorageBoxRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.LocationID > 0 {
		box.LocationID = req.LocationID
	}
	if req.Code != "" {
		box.Code = req.Code
	}
	if req.Name != "" {
		box.Name = req.Name
	}
	if req.Description != "" {
		box.Description = req.Description
	}
	if req.Capacity >= 0 {
		box.Capacity = req.Capacity
	}
	if req.IsActive != nil {
		box.IsActive = *req.IsActive
	}

	if err := database.DB.Save(&box).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	database.DB.Preload("Location").First(&box, box.ID)
	c.JSON(http.StatusOK, gin.H{"data": box})
}

// DeleteStorageBox deletes a storage box
func DeleteStorageBox(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.StorageBox{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Storage box deleted successfully"})
}
