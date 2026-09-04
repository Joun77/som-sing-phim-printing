package catalog

import (
	"time"

	"github.com/lib/pq"
)

// PublicCategory represents a product category displayed on the shop and managed in admin
type PublicCategory struct {
	ID            int       `json:"id"`
	Slug          string    `json:"slug"`
	NameLo        string    `json:"nameLo"`
	NameEn        string    `json:"nameEn"`
	TaglineLo     string    `json:"taglineLo"`
	TaglineEn     string    `json:"taglineEn"`
	DescriptionLo string    `json:"descriptionLo"`
	DescriptionEn string    `json:"descriptionEn"`
	Icon          string    `json:"icon"`
	SortOrder     int       `json:"sortOrder"`
	IsActive      bool      `json:"isActive"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// CreateCategoryRequest is the payload for creating a new category
type CreateCategoryRequest struct {
	Slug          string `json:"slug"`
	NameLo        string `json:"nameLo" binding:"required"`
	NameEn        string `json:"nameEn" binding:"required"`
	TaglineLo     string `json:"taglineLo"`
	TaglineEn     string `json:"taglineEn"`
	DescriptionLo string `json:"descriptionLo"`
	DescriptionEn string `json:"descriptionEn"`
	Icon          string `json:"icon"`
	SortOrder     int    `json:"sortOrder"`
	IsActive      bool   `json:"isActive"`
}

// UpdateCategoryRequest is the payload for updating an existing category
type UpdateCategoryRequest struct {
	Slug          string `json:"slug"`
	NameLo        string `json:"nameLo"`
	NameEn        string `json:"nameEn"`
	TaglineLo     string `json:"taglineLo"`
	TaglineEn     string `json:"taglineEn"`
	DescriptionLo string `json:"descriptionLo"`
	DescriptionEn string `json:"descriptionEn"`
	Icon          string `json:"icon"`
	SortOrder     int    `json:"sortOrder"`
	IsActive      bool   `json:"isActive"`
}

// ReorderCategoriesRequest is the payload for reordering categories
type ReorderCategoriesRequest struct {
	Orders []CategoryOrderItem `json:"orders" binding:"required"`
}

// CategoryOrderItem item for sorting
type CategoryOrderItem struct {
	ID        int `json:"id"`
	SortOrder int `json:"sortOrder"`
}

// SpecGroup represents a dynamic group of options (e.g. Cover Paper, Inner Paper, Binding, Size)
type SpecGroup struct {
	ID          string                `json:"id"`
	TitleLo     string                `json:"titleLo"`
	TitleEn     string                `json:"titleEn"`
	DisplayType string                `json:"displayType"` // "cards" | "dropdown"
	GroupType   string                `json:"groupType"`   // "cover_paper", "inner_paper", "cover_lamination", "binding", "size", "custom"
	Options     []PublicProductOption `json:"options"`
}

// CustomBreakdownRow represents a user-defined breakdown line item in the custom pricing engine
type CustomBreakdownRow struct {
	ID                   string  `json:"id"`
	TitleLo              string  `json:"titleLo"`
	TitleEn              string  `json:"titleEn,omitempty"`
	IncludePrintCost     bool    `json:"includePrintCost"`
	IncludeMaterialCost  bool    `json:"includeMaterialCost"`
	IncludeFinishingCost bool    `json:"includeFinishingCost"`
	ExtraFixedCost       float64 `json:"extraFixedCost,omitempty"`
	UseTargetMargin      bool    `json:"useTargetMargin,omitempty"`
}

// FeaturesConfig toggles specific workflows and breakdown engine for the product
type FeaturesConfig struct {
	HasCoverUpload          bool                 `json:"hasCoverUpload"`
	HasInnerUpload          bool                 `json:"hasInnerUpload"`
	HasSpineCalc            bool                 `json:"hasSpineCalc"`
	HasPreflightCheck       bool                 `json:"hasPreflightCheck"`
	HasCustomDim            bool                 `json:"hasCustomDim"`
	HasGeneralDocUpload     bool                 `json:"hasGeneralDocUpload,omitempty"`
	HasDuplexPrinting       bool                 `json:"hasDuplexPrinting,omitempty"`
	BaselineCoveragePercent float64              `json:"baselineCoveragePercent,omitempty"`
	UploadWorkflow          string               `json:"uploadWorkflow,omitempty"` // "artwork_preflight" | "general_document" | "custom"
	AllowedFileTypes        []string             `json:"allowedFileTypes,omitempty"`
	BreakdownMode           string               `json:"breakdownMode,omitempty"` // "auto" | "custom"
	CustomBreakdownRows     []CustomBreakdownRow `json:"customBreakdownRows,omitempty"`
}

// ProductInfoTab represents dynamic custom tabs / guides at the bottom of product page
type ProductInfoTab struct {
	ID        string `json:"id"`
	TitleLo   string `json:"titleLo"`
	TitleEn   string `json:"titleEn"`
	Icon      string `json:"icon,omitempty"`
	ContentLo string `json:"contentLo"`
	ContentEn string `json:"contentEn"`
}

// PublicProduct represents a product displayed on the public catalog and managed in admin
type PublicProduct struct {
	ID                  int                   `json:"id"`
	CategoryID          *int                  `json:"categoryId,omitempty"`
	CategorySlug        string                `json:"categorySlug,omitempty"`
	Name                string                `json:"name"`
	NameLo              string                `json:"nameLo"`
	NameEn              string                `json:"nameEn"`
	Slug                string                `json:"slug"`
	Category            string                `json:"category"`
	Description         string                `json:"description"`
	DescriptionLo       string                `json:"descriptionLo"`
	DescriptionEn       string                `json:"descriptionEn"`
	PricingModel        string                `json:"pricingModel"` // STANDARD_FLAT, BOOK_MULTIPART, SQM_CUSTOM, FIXED_UNIT
	BasePrice           float64               `json:"basePrice"`
	Unit                string                `json:"unit"`
	Bestseller          bool                  `json:"bestseller"`
	TargetMarginPercent float64               `json:"targetMarginPercent,omitempty"`
	DefaultMachineID    string                `json:"defaultMachineId,omitempty"`
	DefaultMachineName  string                `json:"defaultMachineName,omitempty"`
	SpecGroups          []SpecGroup           `json:"specGroups,omitempty"`
	FeaturesConfig      FeaturesConfig        `json:"featuresConfig,omitempty"`
	Features            pq.StringArray        `json:"features"`
	ThumbnailURL        string                `json:"thumbnailUrl"`
	GalleryURLs         pq.StringArray        `json:"galleryUrls"`
	InfoTabs            []ProductInfoTab      `json:"infoTabs,omitempty"`
	MinQuantity         int                   `json:"minQuantity"`
	IsOnDemand          bool                  `json:"isOnDemand"`
	LeadTimeDays        int                   `json:"leadTimeDays"`
	IsActive            bool                  `json:"isActive"`
	IsArchived          bool                  `json:"isArchived"`
	DeletedAt           *time.Time            `json:"deletedAt,omitempty"`
	SortOrder           int                   `json:"sortOrder"`
	CreatedAt           time.Time             `json:"createdAt"`
	UpdatedAt           time.Time             `json:"updatedAt"`
	Options             []PublicProductOption `json:"options,omitempty"`
	DiscountTiers       []ProductDiscountTier `json:"discountTiers,omitempty"`
}

// PublicProductOption represents material, size, finishing, cutting, or binding choices
type PublicProductOption struct {
	ID            int       `json:"id"`
	ProductID     int       `json:"productId"`
	OptionType    string    `json:"optionType"` // 'material', 'size', 'finishing', 'cutting', 'binding'
	Label         string    `json:"label"`
	LabelLo       string    `json:"labelLo"`
	LabelEn       string    `json:"labelEn"`
	HintLo        string    `json:"hintLo"`
	HintEn        string    `json:"hintEn"`
	Value         string    `json:"value"`
	MaterialSKU   string    `json:"materialSku"`
	PaperCode     string    `json:"paperCode"`
	MachineID     string    `json:"machineId,omitempty"`
	MachineName   string    `json:"machineName,omitempty"`
	AddPrice      float64   `json:"addPrice"`
	IsDefault     bool      `json:"isDefault"`
	ExtraCostRate float64   `json:"extraCostRate"`
	CreatedAt     time.Time `json:"createdAt"`
}

// ProductDiscountTier represents volume discount percentages based on quantity thresholds
type ProductDiscountTier struct {
	ID                 int       `json:"id"`
	ProductID          int       `json:"productId"`
	MinQuantity        int       `json:"minQuantity"`
	DiscountPercentage float64   `json:"discountPercentage"`
	CreatedAt          time.Time `json:"createdAt"`
}

// CreateProductRequest is the payload for creating a new product
type CreateProductRequest struct {
	CategoryID          *int                 `json:"categoryId"`
	Name                string               `json:"name" binding:"required"`
	NameLo              string               `json:"nameLo"`
	NameEn              string               `json:"nameEn"`
	Slug                string               `json:"slug"`
	Category            string               `json:"category" binding:"required"`
	Description         string               `json:"description"`
	DescriptionLo       string               `json:"descriptionLo"`
	DescriptionEn       string               `json:"descriptionEn"`
	PricingModel        string               `json:"pricingModel"`
	BasePrice           float64              `json:"basePrice"`
	Unit                string               `json:"unit"`
	Bestseller          bool                 `json:"bestseller"`
	TargetMarginPercent float64              `json:"targetMarginPercent"`
	DefaultMachineID    string               `json:"defaultMachineId"`
	DefaultMachineName  string               `json:"defaultMachineName"`
	SpecGroups          []SpecGroup          `json:"specGroups"`
	FeaturesConfig      FeaturesConfig       `json:"featuresConfig"`
	Features            []string             `json:"features"`
	ThumbnailURL        string               `json:"thumbnailUrl"`
	GalleryURLs         []string             `json:"galleryUrls"`
	InfoTabs            []ProductInfoTab     `json:"infoTabs,omitempty"`
	MinQuantity         int                  `json:"minQuantity"`
	IsOnDemand          bool                 `json:"isOnDemand"`
	LeadTimeDays        int                  `json:"leadTimeDays"`
	IsActive            bool                 `json:"isActive"`
	SortOrder           int                  `json:"sortOrder"`
	Options             []ProductOptionInput `json:"options"`
	DiscountTiers       []DiscountTierInput  `json:"discountTiers"`
}

// UpdateProductRequest is the payload for updating an existing product
type UpdateProductRequest struct {
	CategoryID          *int                 `json:"categoryId"`
	Name                string               `json:"name"`
	NameLo              string               `json:"nameLo"`
	NameEn              string               `json:"nameEn"`
	Slug                string               `json:"slug"`
	Category            string               `json:"category"`
	Description         string               `json:"description"`
	DescriptionLo       string               `json:"descriptionLo"`
	DescriptionEn       string               `json:"descriptionEn"`
	PricingModel        string               `json:"pricingModel"`
	BasePrice           float64              `json:"basePrice"`
	Unit                string               `json:"unit"`
	Bestseller          bool                 `json:"bestseller"`
	TargetMarginPercent float64              `json:"targetMarginPercent"`
	DefaultMachineID    string               `json:"defaultMachineId"`
	DefaultMachineName  string               `json:"defaultMachineName"`
	SpecGroups          []SpecGroup          `json:"specGroups"`
	FeaturesConfig      FeaturesConfig       `json:"featuresConfig"`
	Features            []string             `json:"features"`
	ThumbnailURL        string               `json:"thumbnailUrl"`
	GalleryURLs         []string             `json:"galleryUrls"`
	InfoTabs            []ProductInfoTab     `json:"infoTabs,omitempty"`
	MinQuantity         int                  `json:"minQuantity"`
	IsOnDemand          bool                 `json:"isOnDemand"`
	LeadTimeDays        int                  `json:"leadTimeDays"`
	IsActive            bool                 `json:"isActive"`
	SortOrder           int                  `json:"sortOrder"`
	Options             []ProductOptionInput `json:"options"`
	DiscountTiers       []DiscountTierInput  `json:"discountTiers"`
}

// ProductOptionInput is the input struct for options
type ProductOptionInput struct {
	OptionType    string  `json:"optionType"`
	Label         string  `json:"label"`
	LabelLo       string  `json:"labelLo"`
	LabelEn       string  `json:"labelEn"`
	HintLo        string  `json:"hintLo"`
	HintEn        string  `json:"hintEn"`
	Value         string  `json:"value"`
	MaterialSKU   string  `json:"materialSku"`
	PaperCode     string  `json:"paperCode"`
	MachineID     string  `json:"machineId"`
	MachineName   string  `json:"machineName"`
	AddPrice      float64 `json:"addPrice"`
	IsDefault     bool    `json:"isDefault"`
	ExtraCostRate float64 `json:"extraCostRate"`
}

// DiscountTierInput is the input struct for volume discounts
type DiscountTierInput struct {
	MinQuantity        int     `json:"minQuantity"`
	DiscountPercentage float64 `json:"discountPercentage"`
}
