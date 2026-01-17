package models

import (
	"time"

	"gorm.io/gorm"
)

// PriceUpdateLog tracks gold category price updates
type PriceUpdateLog struct {
	ID             uint           `gorm:"primarykey" json:"id"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
	UpdateDate     time.Time      `gorm:"not null;index" json:"update_date"`
	UpdatedByID    uint           `gorm:"not null" json:"updated_by_id"`
	UpdatedBy      *User          `gorm:"foreignKey:UpdatedByID" json:"updated_by,omitempty"`
	Notes          string         `gorm:"size:255" json:"notes"`
	PriceDetails   []PriceDetail  `gorm:"foreignKey:PriceUpdateLogID" json:"price_details,omitempty"`
}

// PriceDetail stores individual gold category price changes
type PriceDetail struct {
	ID               uint           `gorm:"primarykey" json:"id"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
	PriceUpdateLogID uint           `gorm:"not null;index" json:"price_update_log_id"`
	GoldCategoryID   uint           `gorm:"not null" json:"gold_category_id"`
	GoldCategory     *GoldCategory  `gorm:"foreignKey:GoldCategoryID" json:"gold_category,omitempty"`
	OldBuyPrice      float64        `gorm:"not null" json:"old_buy_price"`
	NewBuyPrice      float64        `gorm:"not null" json:"new_buy_price"`
	OldSellPrice     float64        `gorm:"not null" json:"old_sell_price"`
	NewSellPrice     float64        `gorm:"not null" json:"new_sell_price"`
}
