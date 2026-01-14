package models

import (
	"time"

	"gorm.io/gorm"
)

// MemberType defines the type of member
type MemberType string

const (
	MemberTypeRegular  MemberType = "regular"
	MemberTypeSilver   MemberType = "silver"
	MemberTypeGold     MemberType = "gold"
	MemberTypePlatinum MemberType = "platinum"
)

// Member represents customer/member data
type Member struct {
	ID               uint           `gorm:"primarykey" json:"id"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
	MemberCode       string         `gorm:"not null;size:20" json:"member_code"` // unique index created manually in migration
	Name             string         `gorm:"not null;size:100" json:"name"`
	Phone            string         `gorm:"size:20;index" json:"phone"`
	Email            string         `gorm:"size:100" json:"email"`
	Address          string         `gorm:"size:255" json:"address"`
	IDNumber         string         `gorm:"size:30" json:"id_number"` // KTP/ID Card number
	Type             MemberType     `gorm:"not null;size:20;default:'regular'" json:"type"`
	Points           int            `gorm:"default:0" json:"points"`
	TotalPurchase    float64        `gorm:"default:0" json:"total_purchase"`    // Total beli dari toko (sale)
	TotalSell        float64        `gorm:"default:0" json:"total_sell"`        // Total jual ke toko (setor emas)
	TransactionCount int            `gorm:"default:0" json:"transaction_count"` // Total jumlah transaksi
	JoinDate         time.Time      `json:"join_date"`
	BirthDate        *time.Time     `json:"birth_date,omitempty"`
	Notes            string         `gorm:"size:500" json:"notes"`
	IsActive         bool           `gorm:"default:true" json:"is_active"`

	// Relations
	Transactions []Transaction `gorm:"foreignKey:MemberID" json:"transactions,omitempty"`
}

// AddPoints adds loyalty points to member
func (m *Member) AddPoints(amount float64) {
	// Example: 1 point per 100,000 spent
	points := int(amount / 100000)
	m.Points += points

	// Update member type based on total purchase
	m.updateMemberType()
}

// updateMemberType updates member type based on total purchase
func (m *Member) updateMemberType() {
	if m.TotalPurchase >= 100000000 { // 100 juta
		m.Type = MemberTypePlatinum
	} else if m.TotalPurchase >= 50000000 { // 50 juta
		m.Type = MemberTypeGold
	} else if m.TotalPurchase >= 20000000 { // 20 juta
		m.Type = MemberTypeSilver
	} else {
		m.Type = MemberTypeRegular
	}
}
