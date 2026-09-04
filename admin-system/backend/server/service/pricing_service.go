package service

import (
	"context"
	"fmt"
	"math"

	"somsing.local/backend/server/domain"

	"github.com/shopspring/decimal"
)

// IPricingService defines authoritative calculation operations
type IPricingService interface {
	CalculatePricing(ctx context.Context, req domain.PricingCalculationRequest) (*domain.PricingCalculationResponse, error)
	CalculatePublicPricing(ctx context.Context, req domain.PricingCalculationRequest) (*domain.PublicPricingResponse, error)
}

// PricingService implements the authoritative print pricing engine with exact LAK integer precision and cm² area basis
type PricingService struct{}

// NewPricingService creates a new PricingService instance
func NewPricingService() *PricingService {
	return &PricingService{}
}

// CalculatePricing calculates authoritative cost breakdowns and retail selling price for Admin
func (s *PricingService) CalculatePricing(ctx context.Context, req domain.PricingCalculationRequest) (*domain.PricingCalculationResponse, error) {
	if req.Quantity <= 0 {
		return nil, fmt.Errorf("quantity must be greater than 0")
	}

	pageCount := req.PageCount
	if pageCount <= 0 {
		pageCount = 1
	}

	qtyDec := decimal.NewFromInt(int64(req.Quantity))
	pagesDec := decimal.NewFromInt(int64(pageCount))
	totalImpressionsDec := qtyDec.Mul(pagesDec)

	// 1. Calculate Dimensions & Area in cm²
	// Area (cm²) = Width (cm) * Height (cm)
	var widthCM, heightCM, areaCM2 decimal.Decimal
	a4AreaCM2 := decimal.NewFromFloat(623.70) // Standard A4 (21.0cm x 29.7cm) in cm²
	areaScaleFactor := decimal.NewFromInt(1)

	if req.WidthCM.GreaterThan(decimal.Zero) && req.HeightCM.GreaterThan(decimal.Zero) {
		widthCM = req.WidthCM
		heightCM = req.HeightCM
	} else if req.UnfoldedWidthMM.GreaterThan(decimal.Zero) && req.UnfoldedHeightMM.GreaterThan(decimal.Zero) {
		widthCM = req.UnfoldedWidthMM.Div(decimal.NewFromInt(10))
		heightCM = req.UnfoldedHeightMM.Div(decimal.NewFromInt(10))
	}

	if widthCM.GreaterThan(decimal.Zero) && heightCM.GreaterThan(decimal.Zero) {
		areaCM2 = widthCM.Mul(heightCM).Round(4)
		if a4AreaCM2.GreaterThan(decimal.Zero) {
			areaScaleFactor = areaCM2.Div(a4AreaCM2).Round(4)
		}
	}

	// 2. Base Material Cost Calculation
	var rawMaterialCostDec decimal.Decimal
	paperCostPerUnitDec := decimal.NewFromInt(req.PaperCostPerUnitLAK)

	if req.SheetsPerPack > 0 && req.CutsPerSheet > 0 {
		// Sheet-fed ream calculation
		costPerSheet := paperCostPerUnitDec.Div(decimal.NewFromInt(int64(req.SheetsPerPack)))
		totalSheetsNeeded := int(math.Ceil(float64(req.Quantity*pageCount) / float64(req.CutsPerSheet)))
		rawMaterialCostDec = costPerSheet.Mul(decimal.NewFromInt(int64(totalSheetsNeeded)))
	} else if req.PaperFormat == "roll" && areaCM2.GreaterThan(decimal.Zero) {
		// Roll-fed area calculation based on cm² (or normalized to m² if unit rate is per m²)
		areaM2 := areaCM2.Div(decimal.NewFromInt(10000))
		rawMaterialCostDec = paperCostPerUnitDec.Mul(areaM2).Mul(qtyDec)
	} else {
		// Direct unit cost fallback
		rawMaterialCostDec = paperCostPerUnitDec.Mul(qtyDec)
	}

	// Spoilage calculation
	spoilagePct := req.SpoilageRatePercent
	if spoilagePct.IsNegative() {
		spoilagePct = decimal.Zero
	}
	wasteCostDec := rawMaterialCostDec.Mul(spoilagePct).Div(decimal.NewFromInt(100)).Round(0)
	baseMaterialCostDec := rawMaterialCostDec.Add(wasteCostDec).Round(0)

	// 3. Ink Usage Cost & Comparison Engine (Baseline Genuine vs Compatible)
	covPct := req.InkCoveragePercent
	if covPct.IsZero() {
		covPct = decimal.NewFromFloat(15.0) // 15% standard CMYK baseline
	}

	// ISO Standard: ~0.007 ml ink per 1% coverage on standard A4 (623.7 cm²) per impression
	mlPerImpression := decimal.NewFromFloat(0.007).Mul(covPct).Mul(areaScaleFactor)
	totalInkVolumeMl := mlPerImpression.Mul(totalImpressionsDec)

	genuineInkRateDec := decimal.NewFromInt(req.InkCostPerMlLAK)
	if genuineInkRateDec.IsZero() {
		genuineInkRateDec = decimal.NewFromInt(1500) // Default fallback genuine rate: 1,500 LAK/ml
	}

	genuineInkCostDec := totalInkVolumeMl.Mul(genuineInkRateDec).Round(0)
	activeInkCostDec := genuineInkCostDec
	var compatibleInkCostDec decimal.Decimal
	var inkSavingsDec decimal.Decimal
	var inkSavingsPct decimal.Decimal

	if req.UseCompatibleInk && req.CompatibleInkCostPerMlLAK > 0 {
		compatRateDec := decimal.NewFromInt(req.CompatibleInkCostPerMlLAK)
		compatibleInkCostDec = totalInkVolumeMl.Mul(compatRateDec).Round(0)
		activeInkCostDec = compatibleInkCostDec
		if genuineInkCostDec.GreaterThan(compatibleInkCostDec) {
			inkSavingsDec = genuineInkCostDec.Sub(compatibleInkCostDec)
			if genuineInkCostDec.GreaterThan(decimal.Zero) {
				inkSavingsPct = inkSavingsDec.Div(genuineInkCostDec).Mul(decimal.NewFromInt(100)).Round(2)
			}
		}
	}

	// 4. Labor & Finishing Operations
	laminationCostDec := decimal.NewFromInt(req.LaminationCostLAK).Mul(qtyDec)
	bindingCostDec := decimal.NewFromInt(req.BindingCostLAK).Mul(qtyDec)
	grommetsCostDec := decimal.NewFromInt(int64(req.GrommetsCount)).Mul(decimal.NewFromInt(req.GrommetCostLAK)).Mul(qtyDec)

	var foldingCostDec decimal.Decimal
	if req.EdgeFolding {
		foldingCostDec = decimal.NewFromInt(req.FoldingCostLAK).Mul(qtyDec)
	}

	laborCostDec := req.LaborHours.Mul(decimal.NewFromInt(req.LaborRatePerHourLAK)).Round(0)
	laborFinishingCostDec := laminationCostDec.Add(bindingCostDec).Add(grommetsCostDec).Add(foldingCostDec).Add(laborCostDec).Round(0)

	// 5. Machine Depreciation & Plate Costs
	plateCostDec := decimal.NewFromInt(req.PlateCostPerUnitLAK)
	machineDeprDec := decimal.NewFromInt(req.MachineDepreciationRateLAK).Mul(totalImpressionsDec).Round(0)

	// 6. Net Internal Cost
	netInternalCostDec := baseMaterialCostDec.
		Add(activeInkCostDec).
		Add(laborFinishingCostDec).
		Add(plateCostDec).
		Add(machineDeprDec).
		Round(0)

	// 7. Markup & Profit Margin
	markupPct := req.MarkupMarginPercent
	if markupPct.IsZero() {
		markupPct = decimal.NewFromFloat(35.0) // Standard 35% margin default
	}
	markupAmountDec := netInternalCostDec.Mul(markupPct).Div(decimal.NewFromInt(100)).Round(0)
	subtotalDec := netInternalCostDec.Add(markupAmountDec)

	// 8. Tax Calculation
	taxAmountDec := decimal.Zero
	if req.TaxRatePercent.GreaterThan(decimal.Zero) {
		taxAmountDec = subtotalDec.Mul(req.TaxRatePercent).Div(decimal.NewFromInt(100)).Round(0)
	}

	// 9. Minimum Total Price Constraint
	totalPriceDec := subtotalDec.Add(taxAmountDec)
	minPriceDec := decimal.NewFromInt(req.MinTotalPriceLAK)
	if minPriceDec.GreaterThan(decimal.Zero) && totalPriceDec.LessThan(minPriceDec) {
		totalPriceDec = minPriceDec
	}

	unitPriceDec := totalPriceDec.Div(qtyDec).Ceil()

	// Convert strictly to int64 for exact LAK integer precision
	breakdown := domain.InternalOrderPricing{
		BaseMaterialCostLAK:    baseMaterialCostDec.IntPart(),
		InkUsageCostLAK:        activeInkCostDec.IntPart(),
		PlateCostLAK:           plateCostDec.IntPart(),
		MachineDepreciationLAK: machineDeprDec.IntPart(),
		LaborFinishingCostLAK:  laborFinishingCostDec.IntPart(),
		WasteSpoilageCostLAK:   wasteCostDec.IntPart(),
		NetInternalCostLAK:     netInternalCostDec.IntPart(),
		MarkupAmountLAK:        markupAmountDec.IntPart(),
		TaxAmountLAK:           taxAmountDec.IntPart(),
		TotalPriceLAK:          totalPriceDec.IntPart(),
		UnitPriceLAK:           unitPriceDec.IntPart(),
		GenuineInkBaselineLAK:  genuineInkCostDec.IntPart(),
		CompatibleInkCostLAK:   compatibleInkCostDec.IntPart(),
		InkSavingsLAK:          inkSavingsDec.IntPart(),
		InkSavingsPercent:      inkSavingsPct,
	}

	return &domain.PricingCalculationResponse{
		JobName:       req.JobName,
		Quantity:      req.Quantity,
		UnitPriceLAK:  unitPriceDec.IntPart(),
		TotalPriceLAK: totalPriceDec.IntPart(),
		CostBreakdown: breakdown,
		Currency:      "LAK",
	}, nil
}

// CalculatePublicPricing computes customer-facing retail price with internal costs masked
func (s *PricingService) CalculatePublicPricing(ctx context.Context, req domain.PricingCalculationRequest) (*domain.PublicPricingResponse, error) {
	res, err := s.CalculatePricing(ctx, req)
	if err != nil {
		return nil, err
	}

	return &domain.PublicPricingResponse{
		JobName:       res.JobName,
		Quantity:      res.Quantity,
		UnitPriceLAK:  res.UnitPriceLAK,
		TotalPriceLAK: res.TotalPriceLAK,
		Currency:      res.Currency,
	}, nil
}
