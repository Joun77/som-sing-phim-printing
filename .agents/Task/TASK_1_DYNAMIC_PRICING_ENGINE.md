# Phase 1 - Task 1: Database Migration & Core Pricing Engine

## Objective
Implement the PostgreSQL dynamic pricing schema and the core Go pricing calculation engine in the backend (`somsingphim`). Ensure customer-facing price outputs return aggregated rates without exposing raw CMYK coverage telemetry, while maintaining full channel breakdown internally for auditing.

## Target Files
- `backend/migrations/000008_create_dynamic_pricing_tables.up.sql` (Create)
- `backend/migrations/000008_create_dynamic_pricing_tables.down.sql` (Create)
- `backend/internal/domain/pricing.go` (Create)
- `backend/internal/service/pricing_service.go` (Create)
- `backend/internal/service/pricing_service_test.go` (Create)

## Technical Requirements

### 1. Database Migration (`backend/migrations/000008_create_dynamic_pricing_tables.up.sql`)
- Create table `product_pricing_configs`:
  - `id VARCHAR(64) PRIMARY KEY`
  - `product_id VARCHAR(64) NOT NULL UNIQUE`
  - `calculation_model VARCHAR(32) NOT NULL` (`BOOK_BOUND`, `SINGLE_SHEET`, `CARD_UNIT`)
  - `base_setup_cost NUMERIC(12, 4) NOT NULL DEFAULT 0.0000`
  - `black_mono_cost_per_percent NUMERIC(12, 6) NOT NULL DEFAULT 0.000000`
  - `cmyk_color_cost_per_percent NUMERIC(12, 6) NOT NULL DEFAULT 0.000000`
  - `default_fallback_tac NUMERIC(5, 2) NOT NULL DEFAULT 20.00`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Create table `order_item_cost_breakdowns`:
  - `id VARCHAR(64) PRIMARY KEY`
  - `order_item_id VARCHAR(64) NOT NULL`
  - `paper_cost NUMERIC(12, 4) NOT NULL`
  - `ink_cost NUMERIC(12, 4) NOT NULL`
  - `binding_cost NUMERIC(12, 4) NOT NULL`
  - `finishing_cost NUMERIC(12, 4) NOT NULL`
  - `unit_price NUMERIC(12, 4) NOT NULL`
  - `total_price NUMERIC(12, 4) NOT NULL`
  - `raw_c_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00`
  - `raw_m_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00`
  - `raw_y_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00`
  - `raw_k_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00`
  - `raw_tac_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00`
  - `applied_tac_pct NUMERIC(5, 2) NOT NULL`
  - `is_manual_override BOOLEAN NOT NULL DEFAULT FALSE`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 2. Domain Entities (`backend/internal/domain/pricing.go`)
- Define Go structs matching database schema with JSON tags:
  - `CalculationModel` enum string type
  - `CoverageMetrics`: `C`, `M`, `Y`, `K`, `TAC` (`float64`)
  - `CustomerPriceQuote`: Returns only `UnitPricePerPage`, `TotalUnitPrice`, `Quantity`, `Subtotal`, `CalculationBadge`
  - `InternalCostAudit`: Complete cost breakdown with raw channels and formula audit logs

### 3. Pricing Service Logic (`backend/internal/service/pricing_service.go`)
- Implement `CalculateDynamicPrice(ctx context.Context, req PricingRequest) (CustomerPriceQuote, InternalCostAudit, error)`:
  - Formula formulation:
    - $\text{ColorCoverage} = C + M + Y$
    - $\text{InkCostPerSheet} = (K\% \times Rate_{\text{mono}}) + (\text{ColorCoverage}\% \times Rate_{\text{color}})$
  - Handle duplex vs single-sided page count variations.
  - Compute total sheet and unit costs.
  - Return aggregated customer-facing price per page and subtotal without exposing granular CMYK details.

## Constraints & Output Rules
- Strict Go typing: Use `decimal.Decimal` or rounded `float64` (4 decimal places) for monetary math.
- Comprehensive Unit Tests in `pricing_service_test.go` covering edge cases: 100% Black only, 300% Rich Black / Heavy CMYK, Default Fallback Coverage, and Single/Double-sided page count variations.

---

### 🚀 IDE Execution Prompt (Copy & Paste to IDE Assistant)
> "Act as a senior Go backend engineer. Implement Phase 1 Task 1 based on the specification above. Create `backend/internal/domain/pricing.go`, `backend/internal/service/pricing_service.go`, `backend/internal/service/pricing_service_test.go`, and PostgreSQL migration files under `backend/migrations/000008_create_dynamic_pricing_tables.*.sql`. Implement the Mono + Composite Color (C+M+Y) ink calculation formula while ensuring customer-facing responses return aggregated unit prices per page without exposing internal CMYK channel details. Follow clean architecture and write comprehensive unit tests."
