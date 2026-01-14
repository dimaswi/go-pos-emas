package models

import (
	"time"

	"gorm.io/gorm"
)

// LocationType defines the type of location
type LocationType string

const (
	LocationTypeGudang LocationType = "gudang"
	LocationTypeToko   LocationType = "toko"
)

// Location represents warehouse or store location
type Location struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Code        string         `gorm:"not null;size:20" json:"code"` // unique index created manually in migration
	Name        string         `gorm:"not null;size:100" json:"name"`
	Type        LocationType   `gorm:"not null;size:20;index" json:"type"` // gudang or toko
	Address     string         `gorm:"size:255" json:"address"`
	Phone       string         `gorm:"size:20" json:"phone"`
	Description string         `gorm:"size:255" json:"description"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	Boxes       []StorageBox   `gorm:"foreignKey:LocationID" json:"boxes,omitempty"`
	Stocks      []Stock        `gorm:"foreignKey:LocationID" json:"stocks,omitempty"`
}

// StorageBox represents a storage box within a location
type StorageBox struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	LocationID  uint           `gorm:"not null;index" json:"location_id"`
	Location    Location       `gorm:"foreignKey:LocationID" json:"location,omitempty"`
	Code        string         `gorm:"not null;size:20;index" json:"code"` // e.g., "A1", "B2", etc.
	Name        string         `gorm:"not null;size:50" json:"name"`       // e.g., "Kotak A1"
	Description string         `gorm:"size:255" json:"description"`
	Capacity    int            `gorm:"default:0" json:"capacity"` // Max items this box can hold (0 = unlimited)
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	Stocks      []Stock        `gorm:"foreignKey:StorageBoxID" json:"stocks,omitempty"`
}

// UniqueIndex for box code within a location
func (StorageBox) TableName() string {
	return "storage_boxes"
}
