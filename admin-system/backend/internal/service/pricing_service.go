package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"somsing.local/backend/internal/domain"
	"somsing.local/backend/internal/repository"

	"github.com/shopspring/decimal"
)

type PricingService struct {
	db           *sql.DB
	materialRepo *repository.MaterialRepository
}

func NewPricingService(database *sql.DB) *PricingService {
	return &PricingService{
		db:           database,
		materialRepo: repository.NewMaterialRepository(database),
	}
}

// CalculatePrice executes the dynamic pricing calculation engine with ink coverage surcharge, addons, and MOQ constraints
func (s *PricingService) CalculatePrice(ctx context.Context, req domain.PricingCalculationRequest) (*domain.PriceBreakdown, error) {
	if req.TemplateID == "" {
		return nil, fmt.Errorf("template_id is required")
	}
	if req.Quantity <= 0 {
		return nil, fmt.Errorf("quantity must be greater than 0")
	}

	// 1. Fetch Template
	tpl, err := s.GetPricingTemplateByID(ctx, req.TemplateID)
	if err != nil {
		return nil, fmt.Errorf("pricing template not found: %w", err)
	}

	// 2. Validate MOQ
	if tpl.MinOrderQuantity > 0 && req.Quantity < tpl.MinOrderQuantity {
		return nil, fmt.Errorf("quantity %d is below minimum order quantity (MOQ) of %d", req.Quantity, tpl.MinOrderQuantity)
	}

	// 3. Fetch Material
	material, err := s.materialRepo.FindByIDOrSKU(ctx, tpl.MaterialID)
	if err != nil {
		return nil, fmt.Errorf("associated material %s not found: %w", tpl.MaterialID, err)
	}

	qtyDec := decimal.NewFromInt(int64(req.Quantity))

	// 4. Calculate Dimensions (Area in m², Perimeter in meters)
	var areaM2, perimeterM decimal.Decimal
	if req.WidthMM.GreaterThan(decimal.Zero) && req.HeightMM.GreaterThan(decimal.Zero) {
		widthM := req.WidthMM.Div(decimal.NewFromInt(1000))
		heightM := req.HeightMM.Div(decimal.NewFromInt(1000))
		areaM2 = widthM.Mul(heightM).Round(4)
		perimeterM = widthM.Add(heightM).Mul(decimal.NewFromInt(2)).Round(4)
	}

	// 5. Base Material Cost
	baseUnitPrice := material.CostPerConsumptionUnit
	if areaM2.GreaterThan(decimal.Zero) {
		baseUnitPrice = material.CostPerConsumptionUnit.Mul(areaM2).Round(2)
	}
	if baseUnitPrice.IsZero() {
		// Fallback default base unit price if not configured in material
		baseUnitPrice = decimal.NewFromInt(1000)
	}
	totalBasePrice := baseUnitPrice.Mul(qtyDec).Round(2)

	// 6. Ink Coverage Compensation Rule
	baselineCoverage := tpl.BaselineCoveragePercent
	if baselineCoverage.IsZero() {
		baselineCoverage = decimal.NewFromFloat(15.00)
	}
	actualCoverage := req.ActualCoverage
	if actualCoverage.IsZero() {
		actualCoverage = baselineCoverage
	}

	coverageDelta := decimal.Zero
	coverageSurcharge := decimal.Zero
	multiplier := tpl.CoverageSurchargeMultiplier
	if multiplier.IsZero() {
		multiplier = decimal.NewFromInt(1)
	}

	if actualCoverage.GreaterThan(baselineCoverage) {
		coverageDelta = actualCoverage.Sub(baselineCoverage)
		// Surcharge = (Delta / Baseline) * BaseUnitPrice * Multiplier * Quantity
		coverageRatio := coverageDelta.Div(baselineCoverage)
		unitSurcharge := baseUnitPrice.Mul(coverageRatio).Mul(multiplier).Round(2)
		coverageSurcharge = unitSurcharge.Mul(qtyDec).Round(2)
	}

	// 7. Add-on Rates & Options Calculation
	addonRates := tpl.AddonRates
	if addonRates == nil {
		addonRates = make(map[string]interface{})
	}

	grommetRate := getAddonDecimal(addonRates, "grommets_unit_price", decimal.NewFromInt(500))
	laminationRate := getAddonDecimal(addonRates, "lamination_price_per_m2", decimal.NewFromInt(15000))
	foldingRate := getAddonDecimal(addonRates, "folding_price_per_meter", decimal.NewFromInt(3000))

	var itemizedAddons []domain.AddonItemBreakdown
	totalAddonCost := decimal.Zero

	// Grommets (ตาไก่)
	if req.GrommetsCount > 0 {
		totalGrommets := decimal.NewFromInt(int64(req.GrommetsCount * req.Quantity))
		cost := totalGrommets.Mul(grommetRate).Round(2)
		itemizedAddons = append(itemizedAddons, domain.AddonItemBreakdown{
			Name:      fmt.Sprintf("ตอกตาไก่ (%d จุด/ชิ้น)", req.GrommetsCount),
			Type:      "grommets",
			Quantity:  totalGrommets,
			UnitPrice: grommetRate,
			TotalCost: cost,
		})
		totalAddonCost = totalAddonCost.Add(cost)
	}

	// Lamination (เคลือบ)
	if req.LaminationType != "" && strings.ToUpper(req.LaminationType) != "NONE" {
		effectiveArea := areaM2.Mul(qtyDec)
		if effectiveArea.IsZero() {
			effectiveArea = qtyDec
		}
		cost := effectiveArea.Mul(laminationRate).Round(2)
		itemizedAddons = append(itemizedAddons, domain.AddonItemBreakdown{
			Name:      fmt.Sprintf("เคลือบผิว (%s)", req.LaminationType),
			Type:      "lamination",
			Quantity:  effectiveArea,
			UnitPrice: laminationRate,
			TotalCost: cost,
		})
		totalAddonCost = totalAddonCost.Add(cost)
	}

	// Edge Folding (พับขอบ)
	if req.EdgeFolding {
		effectivePerimeter := perimeterM.Mul(qtyDec)
		if effectivePerimeter.IsZero() {
			effectivePerimeter = qtyDec
		}
		cost := effectivePerimeter.Mul(foldingRate).Round(2)
		itemizedAddons = append(itemizedAddons, domain.AddonItemBreakdown{
			Name:      "พับขอบรอบด้าน",
			Type:      "folding",
			Quantity:  effectivePerimeter,
			UnitPrice: foldingRate,
			TotalCost: cost,
		})
		totalAddonCost = totalAddonCost.Add(cost)
	}

	// 8. Subtotal, MOQ & Min Price Constraint
	subtotal := totalBasePrice.Add(coverageSurcharge).Add(totalAddonCost).Round(2)
	minPriceApplied := false
	finalPrice := subtotal

	if tpl.MinTotalPrice.GreaterThan(decimal.Zero) && subtotal.LessThan(tpl.MinTotalPrice) {
		finalPrice = tpl.MinTotalPrice
		minPriceApplied = true
	}

	finalUnitPrice := finalPrice.Div(qtyDec).Round(2)

	return &domain.PriceBreakdown{
		TemplateID:                  tpl.ID,
		TemplateName:                tpl.Name,
		MaterialID:                  material.ID,
		MaterialName:                material.Name,
		Quantity:                    req.Quantity,
		MinOrderQuantity:            tpl.MinOrderQuantity,
		AreaM2:                      areaM2,
		PerimeterM:                  perimeterM,
		BaseUnitPrice:               baseUnitPrice,
		BaseMaterialCost:            totalBasePrice,
		BaselineCoveragePercent:     baselineCoverage,
		ActualCoveragePercent:       actualCoverage,
		CoverageDeltaPercent:        coverageDelta,
		CoverageSurchargeMultiplier: multiplier,
		CoverageSurcharge:           coverageSurcharge,
		AddonCost:                   totalAddonCost,
		ItemizedAddons:              itemizedAddons,
		Subtotal:                    subtotal,
		MinTotalPrice:               tpl.MinTotalPrice,
		MinPriceApplied:             minPriceApplied,
		FinalPrice:                  finalPrice,
		FinalUnitPrice:              finalUnitPrice,
	}, nil
}

// Helper to extract decimal from addon rates map
func getAddonDecimal(rates map[string]interface{}, key string, defaultVal decimal.Decimal) decimal.Decimal {
	if val, ok := rates[key]; ok {
		switch v := val.(type) {
		case float64:
			return decimal.NewFromFloat(v)
		case string:
			if d, err := decimal.NewFromString(v); err == nil {
				return d
			}
		}
	}
	return defaultVal
}

// GetPricingTemplates retrieves all pricing templates
func (s *PricingService) GetPricingTemplates(ctx context.Context) ([]domain.ProductPricingTemplate, error) {
	query := `
		SELECT id, name, material_id, baseline_coverage_percent, coverage_surcharge_multiplier,
		       min_order_quantity, min_total_price, COALESCE(addon_rates, '{}'::jsonb), is_active,
		       created_at, updated_at
		FROM product_pricing_templates
		ORDER BY created_at DESC`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.ProductPricingTemplate
	for rows.Next() {
		var t domain.ProductPricingTemplate
		var addonJSON []byte
		if err := rows.Scan(
			&t.ID, &t.Name, &t.MaterialID, &t.BaselineCoveragePercent, &t.CoverageSurchargeMultiplier,
			&t.MinOrderQuantity, &t.MinTotalPrice, &addonJSON, &t.IsActive,
			&t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(addonJSON, &t.AddonRates)
		list = append(list, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return list, nil
}

// GetPricingTemplateByID finds a single template by ID
func (s *PricingService) GetPricingTemplateByID(ctx context.Context, id string) (*domain.ProductPricingTemplate, error) {
	query := `
		SELECT id, name, material_id, baseline_coverage_percent, coverage_surcharge_multiplier,
		       min_order_quantity, min_total_price, COALESCE(addon_rates, '{}'::jsonb), is_active,
		       created_at, updated_at
		FROM product_pricing_templates
		WHERE id = $1
		LIMIT 1`

	var t domain.ProductPricingTemplate
	var addonJSON []byte
	err := s.db.QueryRowContext(ctx, query, strings.TrimSpace(id)).Scan(
		&t.ID, &t.Name, &t.MaterialID, &t.BaselineCoveragePercent, &t.CoverageSurchargeMultiplier,
		&t.MinOrderQuantity, &t.MinTotalPrice, &addonJSON, &t.IsActive,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(addonJSON, &t.AddonRates)
	return &t, nil
}

// CreatePricingTemplate creates a new template record
func (s *PricingService) CreatePricingTemplate(ctx context.Context, payload domain.CreatePricingTemplatePayload) (*domain.ProductPricingTemplate, error) {
	addonJSON, err := json.Marshal(payload.AddonRates)
	if err != nil {
		addonJSON = []byte("{}")
	}

	isActive := true
	if payload.IsActive != nil {
		isActive = *payload.IsActive
	}

	multiplier := payload.CoverageSurchargeMultiplier
	if multiplier.IsZero() {
		multiplier = decimal.NewFromInt(1)
	}

	baseline := payload.BaselineCoveragePercent
	if baseline.IsZero() {
		baseline = decimal.NewFromFloat(15.00)
	}

	minQty := payload.MinOrderQuantity
	if minQty <= 0 {
		minQty = 1
	}

	query := `
		INSERT INTO product_pricing_templates (
			name, material_id, baseline_coverage_percent, coverage_surcharge_multiplier,
			min_order_quantity, min_total_price, addon_rates, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		RETURNING id, name, material_id, baseline_coverage_percent, coverage_surcharge_multiplier,
		          min_order_quantity, min_total_price, addon_rates, is_active, created_at, updated_at`

	var t domain.ProductPricingTemplate
	var returnedAddonJSON []byte

	err = s.db.QueryRowContext(ctx, query,
		payload.Name, payload.MaterialID, baseline, multiplier,
		minQty, payload.MinTotalPrice, addonJSON, isActive,
	).Scan(
		&t.ID, &t.Name, &t.MaterialID, &t.BaselineCoveragePercent, &t.CoverageSurchargeMultiplier,
		&t.MinOrderQuantity, &t.MinTotalPrice, &returnedAddonJSON, &t.IsActive,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create pricing template: %w", err)
	}

	_ = json.Unmarshal(returnedAddonJSON, &t.AddonRates)
	return &t, nil
}

// CalculateDynamicPrice performs dynamic pricing calculation with aggregated customer quote and audited internal breakdown
func (s *PricingService) CalculateDynamicPrice(ctx context.Context, req domain.PricingRequest) (domain.CustomerPriceQuote, domain.InternalCostAudit, error) {
	if req.Quantity <= 0 {
		return domain.CustomerPriceQuote{}, domain.InternalCostAudit{}, fmt.Errorf("quantity must be greater than 0")
	}

	config := req.Config
	if config == nil {
		if req.ProductID != "" && s.db != nil {
			fetched, err := s.GetProductPricingConfigByProductID(ctx, req.ProductID)
			if err == nil && fetched != nil {
				config = fetched
			}
		}
	}

	if config == nil {
		model := req.CalculationModel
		if model == "" {
			model = domain.CalculationModelSingleSheet
		}
		config = &domain.ProductPricingConfig{
			CalculationModel:        model,
			BaseSetupCost:           decimal.Zero,
			BlackMonoCostPerPercent: decimal.NewFromFloat(0.05),
			CMYKColorCostPerPercent: decimal.NewFromFloat(0.08),
			DefaultFallbackTAC:      decimal.NewFromFloat(20.00),
		}
	}

	model := config.CalculationModel
	if req.CalculationModel != "" {
		model = req.CalculationModel
	}

	pages := req.PageCount
	if pages <= 0 {
		pages = 1
	}

	var sheetsPerUnit int
	var printedSides int

	switch model {
	case domain.CalculationModelBookBound:
		printedSides = pages
		if req.IsDoubleSided {
			sheetsPerUnit = (pages + 1) / 2
		} else {
			sheetsPerUnit = pages
		}
	case domain.CalculationModelSingleSheet, domain.CalculationModelCardUnit:
		fallthrough
	default:
		sheetsPerUnit = 1
		if req.IsDoubleSided {
			printedSides = 2
		} else {
			printedSides = 1
		}
		pages = printedSides
	}

	var rawC, rawM, rawY, rawK, rawTAC, appliedTAC decimal.Decimal
	var colorCoverage decimal.Decimal
	var badge string
	var auditLogs []string

	auditLogs = append(auditLogs, fmt.Sprintf("Calculation Model: %s, Pages: %d, Duplex: %v, SheetsPerUnit: %d, PrintedSides: %d",
		model, pages, req.IsDoubleSided, sheetsPerUnit, printedSides))

	isFallback := false
	if req.Coverage == nil || (req.Coverage.C.IsZero() && req.Coverage.M.IsZero() && req.Coverage.Y.IsZero() && req.Coverage.K.IsZero() && req.Coverage.TAC.IsZero()) {
		isFallback = true
		fallbackTAC := config.DefaultFallbackTAC
		if fallbackTAC.IsZero() {
			fallbackTAC = decimal.NewFromFloat(20.00)
		}
		appliedTAC = fallbackTAC
		badge = "FALLBACK_TAC"
		auditLogs = append(auditLogs, fmt.Sprintf("No explicit coverage provided. Applied default fallback TAC: %s%%", appliedTAC.StringFixed(2)))
	} else {
		rawC = req.Coverage.C
		rawM = req.Coverage.M
		rawY = req.Coverage.Y
		rawK = req.Coverage.K
		colorCoverage = rawC.Add(rawM).Add(rawY)

		if !req.Coverage.TAC.IsZero() {
			rawTAC = req.Coverage.TAC
		} else {
			rawTAC = colorCoverage.Add(rawK)
		}
		appliedTAC = rawTAC

		if colorCoverage.IsZero() {
			badge = "MONO_BLACK"
		} else if appliedTAC.GreaterThan(decimal.NewFromInt(200)) {
			badge = "HEAVY_CMYK"
		} else {
			badge = "STANDARD_CMYK"
		}

		auditLogs = append(auditLogs, fmt.Sprintf("Raw Coverage: C=%s%%, M=%s%%, Y=%s%%, K=%s%% (ColorSum=%s%%, TAC=%s%%)",
			rawC.StringFixed(2), rawM.StringFixed(2), rawY.StringFixed(2), rawK.StringFixed(2), colorCoverage.StringFixed(2), appliedTAC.StringFixed(2)))
	}

	var inkCostPerSide decimal.Decimal
	if isFallback {
		// Default fallback coverage calculated at mono rate
		inkCostPerSide = appliedTAC.Mul(config.BlackMonoCostPerPercent).Round(4)
		auditLogs = append(auditLogs, fmt.Sprintf("Ink Cost/Side (Fallback Mono): %s * %s = %s",
			appliedTAC.StringFixed(2), config.BlackMonoCostPerPercent.StringFixed(6), inkCostPerSide.StringFixed(4)))
	} else {
		monoCost := rawK.Mul(config.BlackMonoCostPerPercent)
		colorCost := colorCoverage.Mul(config.CMYKColorCostPerPercent)
		inkCostPerSide = monoCost.Add(colorCost).Round(4)
		auditLogs = append(auditLogs, fmt.Sprintf("Ink Cost/Side: (K:%s * MonoRate:%s) + (Color:%s * ColorRate:%s) = %s",
			rawK.StringFixed(2), config.BlackMonoCostPerPercent.StringFixed(6), colorCoverage.StringFixed(2), config.CMYKColorCostPerPercent.StringFixed(6), inkCostPerSide.StringFixed(4)))
	}

	sheetsPerUnitDec := decimal.NewFromInt(int64(sheetsPerUnit))
	printedSidesDec := decimal.NewFromInt(int64(printedSides))
	qtyDec := decimal.NewFromInt(int64(req.Quantity))

	paperCostPerUnit := req.PaperCostPerSheet.Mul(sheetsPerUnitDec).Round(4)
	inkCostPerUnit := inkCostPerSide.Mul(printedSidesDec).Round(4)
	bindingCostPerUnit := req.BindingCost.Round(4)
	finishingCostPerUnit := req.FinishingCost.Round(4)
	setupCost := config.BaseSetupCost.Round(4)

	unitBaseCost := paperCostPerUnit.Add(inkCostPerUnit).Add(bindingCostPerUnit).Add(finishingCostPerUnit).Round(4)

	totalPaperCost := paperCostPerUnit.Mul(qtyDec).Round(4)
	totalInkCost := inkCostPerUnit.Mul(qtyDec).Round(4)
	totalBindingCost := bindingCostPerUnit.Mul(qtyDec).Round(4)
	totalFinishingCost := finishingCostPerUnit.Mul(qtyDec).Round(4)
	totalOrderCost := unitBaseCost.Mul(qtyDec).Add(setupCost).Round(4)
	effectiveUnitPrice := totalOrderCost.Div(qtyDec).Round(4)

	auditLogs = append(auditLogs, fmt.Sprintf("Per Unit: Paper=%s, Ink=%s (%d sides), Binding=%s, Finishing=%s, BaseTotal=%s",
		paperCostPerUnit.StringFixed(4), inkCostPerUnit.StringFixed(4), printedSides, bindingCostPerUnit.StringFixed(4), finishingCostPerUnit.StringFixed(4), unitBaseCost.StringFixed(4)))
	auditLogs = append(auditLogs, fmt.Sprintf("Order Totals: Base=%s * Qty:%d + Setup:%s = Total:%s (Effective UnitPrice=%s)",
		unitBaseCost.StringFixed(4), req.Quantity, setupCost.StringFixed(4), totalOrderCost.StringFixed(4), effectiveUnitPrice.StringFixed(4)))

	if req.ManualOverride && req.OverrideUnitPrice != nil {
		effectiveUnitPrice = (*req.OverrideUnitPrice).Round(4)
		totalOrderCost = effectiveUnitPrice.Mul(qtyDec).Round(4)
		badge = "MANUAL_OVERRIDE"
		auditLogs = append(auditLogs, fmt.Sprintf("Manual Price Override Applied: UnitPrice=%s, TotalPrice=%s",
			effectiveUnitPrice.StringFixed(4), totalOrderCost.StringFixed(4)))
	}

	unitPricePerPage := effectiveUnitPrice
	if pages > 0 {
		unitPricePerPage = effectiveUnitPrice.Div(decimal.NewFromInt(int64(pages))).Round(4)
	}

	customerQuote := domain.CustomerPriceQuote{
		UnitPricePerPage: unitPricePerPage.Round(4),
		TotalUnitPrice:   effectiveUnitPrice.Round(4),
		Quantity:         req.Quantity,
		Subtotal:         totalOrderCost.Round(4),
		CalculationBadge: badge,
	}

	internalAudit := domain.InternalCostAudit{
		PaperCost:        totalPaperCost,
		InkCost:          totalInkCost,
		BindingCost:      totalBindingCost,
		FinishingCost:    totalFinishingCost,
		SetupCost:        setupCost,
		UnitPrice:        effectiveUnitPrice,
		TotalPrice:       totalOrderCost,
		RawCPct:          rawC,
		RawMPct:          rawM,
		RawYPct:          rawY,
		RawKPct:          rawK,
		RawTACPct:        rawTAC,
		AppliedTACPct:    appliedTAC,
		IsManualOverride: req.ManualOverride,
		FormulaAuditLog:  auditLogs,
	}

	return customerQuote, internalAudit, nil
}

// GetProductPricingConfigByProductID retrieves pricing config for a specific product
func (s *PricingService) GetProductPricingConfigByProductID(ctx context.Context, productID string) (*domain.ProductPricingConfig, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database connection not available")
	}

	query := `
		SELECT id, product_id, calculation_model, base_setup_cost,
		       black_mono_cost_per_percent, cmyk_color_cost_per_percent,
		       default_fallback_tac, created_at, updated_at
		FROM product_pricing_configs
		WHERE product_id = $1
		LIMIT 1`

	var cfg domain.ProductPricingConfig
	err := s.db.QueryRowContext(ctx, query, strings.TrimSpace(productID)).Scan(
		&cfg.ID, &cfg.ProductID, &cfg.CalculationModel, &cfg.BaseSetupCost,
		&cfg.BlackMonoCostPerPercent, &cfg.CMYKColorCostPerPercent,
		&cfg.DefaultFallbackTAC, &cfg.CreatedAt, &cfg.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &cfg, nil
}

// UpsertProductPricingConfig creates or updates product pricing configuration
func (s *PricingService) UpsertProductPricingConfig(ctx context.Context, cfg domain.ProductPricingConfig) (*domain.ProductPricingConfig, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database connection not available")
	}

	query := `
		INSERT INTO product_pricing_configs (
			id, product_id, calculation_model, base_setup_cost,
			black_mono_cost_per_percent, cmyk_color_cost_per_percent,
			default_fallback_tac, created_at, updated_at
		) VALUES (
			COALESCE(NULLIF($1, ''), uuid_generate_v4()::text),
			$2, $3, $4, $5, $6, $7, NOW(), NOW()
		)
		ON CONFLICT (product_id) DO UPDATE SET
			calculation_model = EXCLUDED.calculation_model,
			base_setup_cost = EXCLUDED.base_setup_cost,
			black_mono_cost_per_percent = EXCLUDED.black_mono_cost_per_percent,
			cmyk_color_cost_per_percent = EXCLUDED.cmyk_color_cost_per_percent,
			default_fallback_tac = EXCLUDED.default_fallback_tac,
			updated_at = NOW()
		RETURNING id, product_id, calculation_model, base_setup_cost,
		          black_mono_cost_per_percent, cmyk_color_cost_per_percent,
		          default_fallback_tac, created_at, updated_at`

	var res domain.ProductPricingConfig
	err := s.db.QueryRowContext(ctx, query,
		cfg.ID, cfg.ProductID, cfg.CalculationModel, cfg.BaseSetupCost,
		cfg.BlackMonoCostPerPercent, cfg.CMYKColorCostPerPercent,
		cfg.DefaultFallbackTAC,
	).Scan(
		&res.ID, &res.ProductID, &res.CalculationModel, &res.BaseSetupCost,
		&res.BlackMonoCostPerPercent, &res.CMYKColorCostPerPercent,
		&res.DefaultFallbackTAC, &res.CreatedAt, &res.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert product pricing config: %w", err)
	}

	return &res, nil
}

