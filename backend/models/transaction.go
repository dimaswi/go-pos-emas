package models

import (
	"time"

	"gorm.io/gorm"
)

// TransactionType defines the type of transaction
type TransactionType string

const (
	TransactionTypeSale     TransactionType = "sale"     // Penjualan ke customer
	TransactionTypePurchase TransactionType = "purchase" // Pembelian/Setor dari customer
)

// PaymentMethod defines payment method
type PaymentMethod string

const (
	PaymentMethodCash     PaymentMethod = "cash"
	PaymentMethodTransfer PaymentMethod = "transfer"
	PaymentMethodCard     PaymentMethod = "card"
	PaymentMethodMixed    PaymentMethod = "mixed"
)

// Transaction represents a POS transaction (sale or purchase/setor)
type Transaction struct {
	ID              uint            `gorm:"primarykey" json:"id"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
	DeletedAt       gorm.DeletedAt  `gorm:"index" json:"-"`
	TransactionCode string          `gorm:"not null;size:30" json:"transaction_code"` // unique index created manually in migration
	Type            TransactionType `gorm:"not null;size:20;index" json:"type"`
	MemberID        *uint           `gorm:"index" json:"member_id,omitempty"`
	Member          *Member         `gorm:"foreignKey:MemberID" json:"member,omitempty"`
	LocationID      uint            `gorm:"not null;index" json:"location_id"`
	Location        Location        `gorm:"foreignKey:LocationID" json:"location,omitempty"`
	CashierID       uint            `gorm:"not null;index" json:"cashier_id"`
	Cashier         User            `gorm:"foreignKey:CashierID" json:"cashier,omitempty"`

	// Financial details
	SubTotal        float64 `gorm:"not null" json:"sub_total"`
	Discount        float64 `gorm:"default:0" json:"discount"`
	DiscountPercent float64 `gorm:"default:0" json:"discount_percent"`
	Tax             float64 `gorm:"default:0" json:"tax"`
	GrandTotal      float64 `gorm:"not null" json:"grand_total"`

	// Payment
	PaymentMethod PaymentMethod `gorm:"not null;size:20" json:"payment_method"`
	PaidAmount    float64       `gorm:"not null" json:"paid_amount"`
	ChangeAmount  float64       `gorm:"default:0" json:"change_amount"`

	// Additional info
	CustomerName    string    `gorm:"size:100" json:"customer_name,omitempty"` // For non-member customers
	CustomerPhone   string    `gorm:"size:20" json:"customer_phone,omitempty"`
	Notes           string    `gorm:"size:500" json:"notes"`
	Status          string    `gorm:"not null;size:20;default:'completed'" json:"status"` // completed, cancelled, refunded
	TransactionDate time.Time `gorm:"not null;index" json:"transaction_date"`

	// Relations
	Items []TransactionItem `gorm:"foreignKey:TransactionID" json:"items,omitempty"`
}

// TransactionItem represents items in a transaction
type TransactionItem struct {
	ID            uint           `gorm:"primarykey" json:"id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	TransactionID uint           `gorm:"not null;index" json:"transaction_id"`
	Transaction   Transaction    `gorm:"foreignKey:TransactionID" json:"transaction,omitempty"`

	// For sale transactions - existing stock
	StockID *uint  `gorm:"index" json:"stock_id,omitempty"`
	Stock   *Stock `gorm:"foreignKey:StockID" json:"stock,omitempty"`

	// For purchase/setor transactions - no existing stock, manual entry
	ProductID      *uint         `gorm:"index" json:"product_id,omitempty"`
	Product        *Product      `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	GoldCategoryID *uint         `gorm:"index" json:"gold_category_id,omitempty"`
	GoldCategory   *GoldCategory `gorm:"foreignKey:GoldCategoryID" json:"gold_category,omitempty"`

	// Item details
	ItemName     string  `gorm:"not null;size:100" json:"item_name"`
	Barcode      string  `gorm:"size:50" json:"barcode"`
	Weight       float64 `gorm:"not null" json:"weight"` // Berat dalam gram
	PricePerGram float64 `gorm:"not null" json:"price_per_gram"`
	UnitPrice    float64 `gorm:"not null" json:"unit_price"` // Total price for this item
	Quantity     int     `gorm:"not null;default:1" json:"quantity"`
	Discount     float64 `gorm:"default:0" json:"discount"`
	SubTotal     float64 `gorm:"not null" json:"sub_total"`
	Notes        string  `gorm:"size:255" json:"notes"`
}

// PurchaseItem represents items bought from customers (setor)
type PurchaseItem struct {
	ID             uint           `gorm:"primarykey" json:"id"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
	TransactionID  uint           `gorm:"not null;index" json:"transaction_id"`
	GoldCategoryID uint           `gorm:"not null;index" json:"gold_category_id"`
	GoldCategory   GoldCategory   `gorm:"foreignKey:GoldCategoryID" json:"gold_category,omitempty"`
	Weight         float64        `gorm:"not null" json:"weight"`         // Berat dalam gram
	PricePerGram   float64        `gorm:"not null" json:"price_per_gram"` // Harga beli per gram
	TotalPrice     float64        `gorm:"not null" json:"total_price"`
	Condition      string         `gorm:"size:50" json:"condition"` // Kondisi barang
	Notes          string         `gorm:"size:255" json:"notes"`
}
