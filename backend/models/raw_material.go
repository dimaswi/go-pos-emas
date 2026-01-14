package models

import (
	"time"
)

type RawMaterialStatus string

const (
	RawMaterialStatusAvailable RawMaterialStatus = "available"
	RawMaterialStatusProcessed RawMaterialStatus = "processed"
	RawMaterialStatusSold      RawMaterialStatus = "sold"
)

type RawMaterialCondition string

const (
	RawMaterialConditionNew       RawMaterialCondition = "new"
	RawMaterialConditionLikeNew   RawMaterialCondition = "like_new"
	RawMaterialConditionScratched RawMaterialCondition = "scratched"
	RawMaterialConditionDented    RawMaterialCondition = "dented"
	RawMaterialConditionDamaged   RawMaterialCondition = "damaged"
)

type RawMaterial struct {
	ID               uint                 `gorm:"primarykey" json:"id"`
	CreatedAt        time.Time            `json:"created_at"`
	UpdatedAt        time.Time            `json:"updated_at"`
	DeletedAt        *time.Time           `gorm:"index" json:"deleted_at,omitempty"`
	Code             string               `json:"code" gorm:"not null"` // unique index created manually in migration
	GoldCategoryID   *uint                `json:"gold_category_id"`
	GoldCategory     *GoldCategory        `json:"gold_category,omitempty" gorm:"foreignKey:GoldCategoryID"`
	LocationID       uint                 `json:"location_id" gorm:"not null"`
	Location         *Location            `json:"location,omitempty" gorm:"foreignKey:LocationID"`
	WeightGross      float64              `json:"weight_gross" gorm:"not null"`       // Berat kotor (sebelum susut)
	ShrinkagePercent float64              `json:"shrinkage_percent" gorm:"default:0"` // Persentase susut
	WeightGrams      float64              `json:"weight_grams" gorm:"not null"`       // Berat bersih (setelah susut)
	Purity           float64              `json:"purity"`                             // Kadar emas (%)
	BuyPricePerGram  float64              `json:"buy_price_per_gram" gorm:"not null"`
	TotalBuyPrice    float64              `json:"total_buy_price" gorm:"not null"`
	Condition        RawMaterialCondition `json:"condition" gorm:"default:'like_new'"`
	Status           RawMaterialStatus    `json:"status" gorm:"default:'available'"`
	SupplierName     string               `json:"supplier_name"`
	MemberID         *uint                `json:"member_id"`
	Member           *Member              `json:"member,omitempty" gorm:"foreignKey:MemberID"`
	TransactionID    *uint                `json:"transaction_id"`
	ReceivedAt       *time.Time           `json:"received_at"`
	ReceivedByID     *uint                `json:"received_by_id"`
	ReceivedBy       *User                `json:"received_by,omitempty" gorm:"foreignKey:ReceivedByID"`
	ProcessedAt      *time.Time           `json:"processed_at"`
	Notes            string               `json:"notes"`
}

func (RawMaterial) TableName() string {
	return "raw_materials"
}
