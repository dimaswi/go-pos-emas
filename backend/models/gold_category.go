package models

import (
	"time"

	"gorm.io/gorm"
)

// GoldCategory represents gold quality classification with pricing
type GoldCategory struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Code        string         `gorm:"not null;size:20" json:"code"` // e.g., "420", "750", "916", "999" - unique index created manually in migration
	Name        string         `gorm:"not null;size:50" json:"name"`             // e.g., "9K", "18K", "22K", "24K"
	Purity      *float64       `gorm:"default:null" json:"purity"`               // e.g., 0.375, 0.750, 0.916, 0.999 - nullable
	BuyPrice    float64        `gorm:"not null;default:0" json:"buy_price"`      // Harga beli per gram
	SellPrice   float64        `gorm:"not null;default:0" json:"sell_price"`     // Harga jual per gram
	Description string         `gorm:"size:255" json:"description"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	Products    []Product      `gorm:"foreignKey:GoldCategoryID" json:"products,omitempty"`
}
