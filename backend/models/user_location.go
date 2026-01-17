package models

import (
	"time"

	"gorm.io/gorm"
)

// UserLocation represents the assignment of a user (employee) to a location (store)
// This is a many-to-many relationship between User and Location
type UserLocation struct {
	ID         uint           `gorm:"primarykey" json:"id"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	UserID     uint           `gorm:"not null;index" json:"user_id"`
	User       User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	LocationID uint           `gorm:"not null;index" json:"location_id"`
	Location   Location       `gorm:"foreignKey:LocationID" json:"location,omitempty"`
	IsDefault  bool           `gorm:"default:false" json:"is_default"` // Default location for this user
}

// TableName overrides the table name
func (UserLocation) TableName() string {
	return "user_locations"
}
