# Phase 1 - Task 1: Go Domain Models, LAK Precision Engine & SSE Stream

## Objective
Establish the authoritative pricing calculation models, data sanitization serializers, and real-time SSE stream endpoints in the Go backend. Enforce int64 precision for Lao Kip (LAK) and a square-centimeter (cm²) basis for material costing.

## Target Files
- `server/domain/order.go` (Modify / Create)
- `server/domain/pricing.go` (Modify / Create)
- `server/service/pricing_service.go` (Create / Modify)
- `server/handler/order_handler.go` (Modify)

## Technical Requirements
- **LAK Currency Precision & cm² Unit Base:**
  - Enforce `int64` across all pricing, cost, and subtotal fields.
  - Calculate area and usage using standard cm² units:
    $$\text{Area } (cm^2) = \text{Width } (cm) \times \text{Height } (cm)$$
    $$\text{Total Price } (LAK) = (\text{Area} \times \text{BaseRate}) + \text{InkCost} + \text{Finishing} + \text{Margin}$$
- **Data Sanitization & Separation:**
  - `InternalOrderPricing`: Includes machinery depreciation, operational overhead, and baseline ink comparison margins.
  - `PublicOrderTrackingDTO`: Strips internal cost structures; exposes only item specifications, line totals in LAK, current lifecycle state, and modification alerts.
- **Endpoint Contracts:**
  - `POST /api/v1/pricing/calculate`: Compute internal and retail breakdown for Admin.
  - `GET /api/v1/orders/track/:tracking_code`: Retrieve sanitized tracking payload for Customer Service.
  - `GET /api/v1/orders/stream?tracking=:tracking_code`: Per-order SSE channel broadcasting status transitions and edit events.

## Constraints & Output Rules
- Strict Go typing: Zero empty interfaces (`any` / `interface{}`) in domain models.
- Preserve business terms and native Lao/Thai language strings.
- Integrate with existing PostgreSQL database migrations and repository layers.
