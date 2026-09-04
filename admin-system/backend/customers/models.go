package customers

import (
	"time"
)

// CustomerAddress represents a delivery address associated with a customer profile.
type CustomerAddress struct {
	ID            string `json:"id"`
	Label         string `json:"label"`
	RecipientName string `json:"recipientName"`
	Phone         string `json:"phone"`
	Province      string `json:"province"`
	District      string `json:"district"`
	Village       string `json:"village"`
	AddressDetail string `json:"addressDetail"`
	BranchCode    string `json:"branchCode"`
	IsDefault     bool   `json:"isDefault"`
}

// Customer represents a customer profile in the Som Sing Phim Printing system.
type Customer struct {
	ID               string            `json:"id"`
	Name             string            `json:"name"`
	Phone            string            `json:"phone"`
	Email            string            `json:"email"`
	AvatarURL        string            `json:"avatarUrl,omitempty"`
	Address          string            `json:"address"`
	Addresses        []CustomerAddress `json:"addresses,omitempty"`
	CreditLimit      float64           `json:"creditLimit"`
	PaymentTerms     string            `json:"paymentTerms"`
	Instagram        string            `json:"instagram"`
	LineID           string            `json:"line"`
	Facebook         string            `json:"facebook"`
	WhatsApp         string            `json:"whatsapp"`
	Province         string            `json:"province"`
	District         string            `json:"district"`
	Village          string            `json:"village"`
	BranchCode       string            `json:"branchCode"`
	TaxID            string            `json:"taxId"`
	Tier             string            `json:"tier"`             // Loyalty VIP Tier: STANDARD, SILVER, GOLD, PLATINUM
	DiscountPercent  float64           `json:"discountPercent,omitempty"`
	Perks            []string          `json:"perks,omitempty"`
	PreferredCourier string            `json:"preferredCourier"` // Courier ID or name
	Source           string            `json:"source"`           // CUSTOMER_SERVICE vs ADMIN_MANUAL
	AuthProvider     string            `json:"authProvider"`     // PHONE, GOOGLE, MANUAL
	Password         string            `json:"password,omitempty"` // plain password when creating/resetting (never exposed in output)
	PasswordHash     string            `json:"-"`                // internal bcrypt hash
	LastLoginAt      *time.Time        `json:"lastLoginAt,omitempty"`
	Notes            string            `json:"notes"`
	TotalSpentLAK    float64           `json:"totalSpentLAK"`
	TotalOrdersCount int               `json:"totalOrdersCount"`
	CreatedAt        time.Time         `json:"createdAt"`
	UpdatedAt        time.Time         `json:"updatedAt"`
}

// BulkDeleteRequest represents request to delete multiple customers.
type BulkDeleteRequest struct {
	IDs []string `json:"ids"`
}

// BlockedCustomerInfo describes a customer that cannot be deleted due to existing orders.
type BlockedCustomerInfo struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	OrderCount int    `json:"orderCount"`
	Reason     string `json:"reason"`
}

// PublicAuthRequest payload for public customer login / registration.
type PublicAuthRequest struct {
	Phone string `json:"phone"`
	Name  string `json:"name"`
	Email string `json:"email,omitempty"`
}

// TierDTO represents the VIP tier specification and loyalty perks.
type TierDTO struct {
	ID              string   `json:"id"`
	NameLo          string   `json:"name_lo"`
	NameEn          string   `json:"name_en"`
	DiscountPercent float64  `json:"discount_percent"`
	MinSpendLAK     float64  `json:"min_spend_lak"`
	MinOrders       int      `json:"min_orders"`
	BadgeColor      string   `json:"badge_color"`
	Perks           []string `json:"perks"`
	SortOrder       int      `json:"sort_order"`
	IsActive        bool     `json:"is_active"`
}
