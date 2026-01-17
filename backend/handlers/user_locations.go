package handlers

import (
	"net/http"
	"starter/backend/database"
	"starter/backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetUserLocations returns all location assignments for a specific user
func GetUserLocations(c *gin.Context) {
	userID := c.Param("id")

	var userLocations []models.UserLocation
	if err := database.DB.Preload("Location").Where("user_id = ?", userID).Find(&userLocations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": userLocations})
}

// GetMyLocations returns locations assigned to the current logged-in user
func GetMyLocations(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var userLocations []models.UserLocation
	if err := database.DB.Preload("Location").Where("user_id = ?", userID).Find(&userLocations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Extract just the locations
	var locations []models.Location
	for _, ul := range userLocations {
		locations = append(locations, ul.Location)
	}

	c.JSON(http.StatusOK, gin.H{"data": locations})
}

// AssignUserLocation assigns a user to a location
type AssignUserLocationRequest struct {
	UserID     uint `json:"user_id" binding:"required"`
	LocationID uint `json:"location_id" binding:"required"`
	IsDefault  bool `json:"is_default"`
}

func AssignUserLocation(c *gin.Context) {
	var req AssignUserLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify user exists
	var user models.User
	if err := database.DB.First(&user, req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Verify location exists
	var location models.Location
	if err := database.DB.First(&location, req.LocationID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Location not found"})
		return
	}

	// Check if assignment already exists
	var existing models.UserLocation
	result := database.DB.Where("user_id = ? AND location_id = ?", req.UserID, req.LocationID).First(&existing)
	if result.Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User is already assigned to this location"})
		return
	}

	// If setting as default, unset other defaults first
	if req.IsDefault {
		database.DB.Model(&models.UserLocation{}).Where("user_id = ?", req.UserID).Update("is_default", false)
	}

	userLocation := models.UserLocation{
		UserID:     req.UserID,
		LocationID: req.LocationID,
		IsDefault:  req.IsDefault,
	}

	if err := database.DB.Create(&userLocation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Load the location data
	database.DB.Preload("Location").First(&userLocation, userLocation.ID)

	c.JSON(http.StatusCreated, gin.H{"data": userLocation})
}

// BulkAssignUserLocations assigns multiple locations to a user at once
type BulkAssignUserLocationsRequest struct {
	UserID      uint   `json:"user_id" binding:"required"`
	LocationIDs []uint `json:"location_ids" binding:"required"`
	DefaultID   *uint  `json:"default_id"` // Optional: which location should be default
}

func BulkAssignUserLocations(c *gin.Context) {
	var req BulkAssignUserLocationsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify user exists
	var user models.User
	if err := database.DB.First(&user, req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	tx := database.DB.Begin()

	// Delete all existing assignments for this user
	if err := tx.Where("user_id = ?", req.UserID).Delete(&models.UserLocation{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create new assignments
	var userLocations []models.UserLocation
	for _, locID := range req.LocationIDs {
		// Verify location exists
		var location models.Location
		if err := tx.First(&location, locID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Location not found: " + strconv.Itoa(int(locID))})
			return
		}

		isDefault := req.DefaultID != nil && *req.DefaultID == locID

		userLocation := models.UserLocation{
			UserID:     req.UserID,
			LocationID: locID,
			IsDefault:  isDefault,
		}

		if err := tx.Create(&userLocation).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		userLocations = append(userLocations, userLocation)
	}

	tx.Commit()

	// Reload with location data
	var result []models.UserLocation
	database.DB.Preload("Location").Where("user_id = ?", req.UserID).Find(&result)

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// RemoveUserLocation removes a user's assignment from a location
func RemoveUserLocation(c *gin.Context) {
	userID := c.Param("id")
	locationID := c.Param("location_id")

	result := database.DB.Where("user_id = ? AND location_id = ?", userID, locationID).Delete(&models.UserLocation{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assignment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Assignment removed successfully"})
}

// SetDefaultLocation sets a location as the default for a user
func SetDefaultLocation(c *gin.Context) {
	userID := c.Param("id")
	locationID := c.Param("location_id")

	tx := database.DB.Begin()

	// Unset all defaults for this user
	if err := tx.Model(&models.UserLocation{}).Where("user_id = ?", userID).Update("is_default", false).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Set the new default
	result := tx.Model(&models.UserLocation{}).Where("user_id = ? AND location_id = ?", userID, locationID).Update("is_default", true)
	if result.Error != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Assignment not found"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Default location set successfully"})
}

// CheckUserLocationAccess checks if a user has access to a specific location
func CheckUserLocationAccess(userID uint, locationID uint) bool {
	var count int64
	database.DB.Model(&models.UserLocation{}).Where("user_id = ? AND location_id = ?", userID, locationID).Count(&count)
	return count > 0
}

// IsAdmin checks if a user has admin role
func IsAdmin(userID uint) bool {
	var user models.User
	if err := database.DB.Preload("Role").First(&user, userID).Error; err != nil {
		return false
	}
	return user.Role.Name == "admin"
}
