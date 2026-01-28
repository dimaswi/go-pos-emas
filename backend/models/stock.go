package models

import (
	"time"

	"gorm.io/gorm"
)

// StockStatus defines the status of stock item
type StockStatus string

const (
	StockStatusAvailable StockStatus = "available" // Ready for sale
	StockStatusReserved  StockStatus = "reserved"  // Reserved for order
	StockStatusSold      StockStatus = "sold"      // Already sold
	StockStatusTransfer  StockStatus = "transfer"  // In transfer between locations
)

// Stock represents individual stock item with location tracking
// Harga tidak disimpan di sini - selalu dihitung dari gold_category.sell_price * product.weight
type Stock struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	ProductID    uint           `gorm:"not null;index" json:"product_id"`
	Product      Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	LocationID   uint           `gorm:"not null;index" json:"location_id"`
	Location     Location       `gorm:"foreignKey:LocationID" json:"location,omitempty"`
	StorageBoxID uint           `gorm:"not null;index" json:"storage_box_id"`
	StorageBox   StorageBox     `gorm:"foreignKey:StorageBoxID" json:"storage_box,omitempty"`
	SerialNumber string         `gorm:"not null;size:50" json:"serial_number"` // Unique identifier for each piece - unique index created manually in migration
	Status       StockStatus    `gorm:"not null;size:20;default:'available';index" json:"status"`
	Notes        string         `gorm:"size:255" json:"notes"`

	// Source tracking
	SupplierName string     `gorm:"size:100" json:"supplier_name,omitempty"` // Name of supplier/distributor
	ReceivedAt   *time.Time `json:"received_at,omitempty"`                   // When received at location

	// Sales tracking
	SoldAt        *time.Time `json:"sold_at,omitempty"`
	TransactionID *uint      `gorm:"index" json:"transaction_id,omitempty"`

	// Barcode printing tracking
	BarcodePrinted   bool       `gorm:"default:false" json:"barcode_printed"`
	BarcodePrintedAt *time.Time `json:"barcode_printed_at,omitempty"`
}

// StockTransfer represents stock movement between locations
type StockTransfer struct {
	ID              uint           `gorm:"primarykey" json:"id"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
	TransferNumber  string         `gorm:"not null;size:50" json:"transfer_number"` // unique index created manually in migration
	StockID         uint           `gorm:"not null;index" json:"stock_id"`
	Stock           Stock          `gorm:"foreignKey:StockID" json:"stock,omitempty"`
	FromLocationID  uint           `gorm:"not null;index" json:"from_location_id"`
	FromLocation    Location       `gorm:"foreignKey:FromLocationID" json:"from_location,omitempty"`
	FromBoxID       uint           `gorm:"not null;index" json:"from_box_id"`
	FromBox         StorageBox     `gorm:"foreignKey:FromBoxID" json:"from_box,omitempty"`
	ToLocationID    uint           `gorm:"not null;index" json:"to_location_id"`
	ToLocation      Location       `gorm:"foreignKey:ToLocationID" json:"to_location,omitempty"`
	ToBoxID         uint           `gorm:"not null;index" json:"to_box_id"`
	ToBox           StorageBox     `gorm:"foreignKey:ToBoxID" json:"to_box,omitempty"`
	TransferredByID uint           `gorm:"not null;index" json:"transferred_by_id"`
	TransferredBy   User           `gorm:"foreignKey:TransferredByID" json:"transferred_by,omitempty"`
	TransferredAt   time.Time      `json:"transferred_at"`
	Notes           string         `gorm:"size:255" json:"notes"`
	Status          string         `gorm:"not null;size:20;default:'pending'" json:"status"` // pending, completed, cancelled
}
