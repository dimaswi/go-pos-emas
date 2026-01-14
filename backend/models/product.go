package models

import (
	"time"

	"gorm.io/gorm"
)

// ProductType defines the type of jewelry
type ProductType string

const (
	ProductTypeGelang  ProductType = "gelang"
	ProductTypeCincin  ProductType = "cincin"
	ProductTypeKalung  ProductType = "kalung"
	ProductTypeAnting  ProductType = "anting"
	ProductTypeLiontin ProductType = "liontin"
	ProductTypeOther   ProductType = "other"
)

// ProductCategory defines target customer category
type ProductCategory string

const (
	ProductCategoryDewasa ProductCategory = "dewasa"
	ProductCategoryAnak   ProductCategory = "anak"
	ProductCategoryUnisex ProductCategory = "unisex"
)

// Product represents jewelry product master data
type Product struct {
	ID             uint            `gorm:"primarykey" json:"id"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
	DeletedAt      gorm.DeletedAt  `gorm:"index" json:"-"`
	Barcode        string          `gorm:"not null;size:50" json:"barcode"` // unique index created manually in migration
	Name           string          `gorm:"not null;size:100" json:"name"`
	Type           ProductType     `gorm:"not null;size:20;index" json:"type"`     // gelang, cincin, kalung, etc.
	Category       ProductCategory `gorm:"not null;size:20;index" json:"category"` // dewasa, anak
	GoldCategoryID uint            `gorm:"not null;index" json:"gold_category_id"` // FK to GoldCategory
	GoldCategory   GoldCategory    `gorm:"foreignKey:GoldCategoryID" json:"gold_category,omitempty"`
	Weight         float64         `gorm:"not null" json:"weight"` // Berat dalam gram
	Description    string          `gorm:"size:500" json:"description"`

	// Specifications based on product type
	RingSize       string  `gorm:"size:10" json:"ring_size,omitempty"`    // Lingkar jari untuk cincin
	BraceletLength float64 `json:"bracelet_length,omitempty"`             // Panjang untuk gelang (cm)
	NecklaceLength float64 `json:"necklace_length,omitempty"`             // Panjang untuk kalung (cm)
	EarringType    string  `gorm:"size:50" json:"earring_type,omitempty"` // Tipe anting (tusuk, jepit, etc)

	// Additional info
	ImageURL string `gorm:"size:255" json:"image_url,omitempty"`
	IsActive bool   `gorm:"default:true" json:"is_active"`

	// Relations
	Stocks []Stock `gorm:"foreignKey:ProductID" json:"stocks,omitempty"`
}

// CalculateSellPrice calculates the selling price based on gold category and weight
func (p *Product) CalculateSellPrice() float64 {
	if p.GoldCategory.SellPrice > 0 {
		return p.GoldCategory.SellPrice * p.Weight
	}
	return 0
}

// CalculateBuyPrice calculates the buying price based on gold category and weight
func (p *Product) CalculateBuyPrice() float64 {
	if p.GoldCategory.BuyPrice > 0 {
		return p.GoldCategory.BuyPrice * p.Weight
	}
	return 0
}
