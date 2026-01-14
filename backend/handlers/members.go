package handlers

import (
	"fmt"
	"net/http"
	"starter/backend/database"
	"starter/backend/models"
	"time"

	"github.com/gin-gonic/gin"
)

// GetMembers returns all members
func GetMembers(c *gin.Context) {
	var members []models.Member
	query := database.DB

	// Filter by type if provided
	if memberType := c.Query("type"); memberType != "" {
		query = query.Where("type = ?", memberType)
	}

	// Filter by active status
	if isActive := c.Query("is_active"); isActive != "" {
		query = query.Where("is_active = ?", isActive == "true")
	}

	// Search by name or phone
	if search := c.Query("search"); search != "" {
		query = query.Where("name ILIKE ? OR phone ILIKE ? OR member_code ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": members})
}

// GetMember returns a single member with transactions
func GetMember(c *gin.Context) {
	id := c.Param("id")
	var member models.Member
	if err := database.DB.Preload("Transactions").First(&member, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": member})
}

// GetMemberByCode returns a member by member code
func GetMemberByCode(c *gin.Context) {
	code := c.Param("code")
	var member models.Member
	if err := database.DB.Where("member_code = ?", code).First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": member})
}

type CreateMemberRequest struct {
	Name      string     `json:"name" binding:"required"`
	Phone     string     `json:"phone"`
	Email     string     `json:"email"`
	Address   string     `json:"address"`
	IDNumber  string     `json:"id_number"`
	BirthDate *time.Time `json:"birth_date"`
	Notes     string     `json:"notes"`
	IsActive  *bool      `json:"is_active"`
}

// CreateMember creates a new member
func CreateMember(c *gin.Context) {
	var req CreateMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate member code
	memberCode := generateMemberCode()

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	member := models.Member{
		MemberCode: memberCode,
		Name:       req.Name,
		Phone:      req.Phone,
		Email:      req.Email,
		Address:    req.Address,
		IDNumber:   req.IDNumber,
		Type:       models.MemberTypeRegular,
		JoinDate:   time.Now(),
		BirthDate:  req.BirthDate,
		Notes:      req.Notes,
		IsActive:   isActive,
	}

	if err := database.DB.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": member})
}

// generateMemberCode generates a unique member code
func generateMemberCode() string {
	timestamp := time.Now().UnixNano() / 1000000
	return fmt.Sprintf("MBR%d", timestamp)
}

type UpdateMemberRequest struct {
	Name      string            `json:"name"`
	Phone     string            `json:"phone"`
	Email     string            `json:"email"`
	Address   string            `json:"address"`
	IDNumber  string            `json:"id_number"`
	Type      models.MemberType `json:"type"`
	BirthDate *time.Time        `json:"birth_date"`
	Notes     string            `json:"notes"`
	IsActive  *bool             `json:"is_active"`
}

// UpdateMember updates an existing member
func UpdateMember(c *gin.Context) {
	id := c.Param("id")
	var member models.Member
	if err := database.DB.First(&member, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found"})
		return
	}

	var req UpdateMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		member.Name = req.Name
	}
	if req.Phone != "" {
		member.Phone = req.Phone
	}
	if req.Email != "" {
		member.Email = req.Email
	}
	if req.Address != "" {
		member.Address = req.Address
	}
	if req.IDNumber != "" {
		member.IDNumber = req.IDNumber
	}
	if req.Type != "" {
		member.Type = req.Type
	}
	if req.BirthDate != nil {
		member.BirthDate = req.BirthDate
	}
	if req.Notes != "" {
		member.Notes = req.Notes
	}
	if req.IsActive != nil {
		member.IsActive = *req.IsActive
	}

	if err := database.DB.Save(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": member})
}

// DeleteMember deletes a member
func DeleteMember(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Member{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Member deleted successfully"})
}

// AddMemberPoints adds points to a member
func AddMemberPoints(c *gin.Context) {
	id := c.Param("id")
	var member models.Member
	if err := database.DB.First(&member, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found"})
		return
	}

	var req struct {
		Amount float64 `json:"amount" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	member.AddPoints(req.Amount)
	if err := database.DB.Save(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": member})
}

// RecalculateMemberStats recalculates transaction stats for all members
func RecalculateMemberStats(c *gin.Context) {
	var members []models.Member
	if err := database.DB.Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	updatedCount := 0
	for _, member := range members {
		var transactions []models.Transaction
		database.DB.Where("member_id = ? AND status = ?", member.ID, "completed").Find(&transactions)

		var totalPurchase float64 = 0 // Sale: member beli dari toko
		var totalSell float64 = 0     // Purchase: member jual ke toko
		transactionCount := len(transactions)

		for _, tx := range transactions {
			if tx.Type == models.TransactionTypeSale {
				totalPurchase += tx.GrandTotal
			} else if tx.Type == models.TransactionTypePurchase {
				totalSell += tx.GrandTotal
			}
		}

		// Calculate points: 1 per 100k purchase + 1 per 200k sell
		points := int(totalPurchase/100000) + int(totalSell/200000)

		// Update member
		member.TotalPurchase = totalPurchase
		member.TotalSell = totalSell
		member.TransactionCount = transactionCount
		member.Points = points

		// Update member type based on total purchase
		if totalPurchase >= 100000000 {
			member.Type = models.MemberTypePlatinum
		} else if totalPurchase >= 50000000 {
			member.Type = models.MemberTypeGold
		} else if totalPurchase >= 20000000 {
			member.Type = models.MemberTypeSilver
		} else {
			member.Type = models.MemberTypeRegular
		}

		database.DB.Save(&member)
		updatedCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Successfully recalculated stats for %d members", updatedCount),
		"updated": updatedCount,
	})
}
