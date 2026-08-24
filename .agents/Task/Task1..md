# Phase 1 - Task 1: Backend Domain Models, Shared Schema & Precision Pricing Engine

## Objective
Establish a centralized single source of truth for order calculations and tracking models in the Go backend. Ensure calculations handle LAK currency precision, enforce strict domain structs with nullable fields, and expose shared calculation endpoints for both Admin and Customer Service interfaces.

## Target Files
- `server/domain/order.go` (Modify / Create)
- `server/domain/pricing.go` (Modify / Create)
- `server/service/pricing_service.go` (Create / Modify)
- `server/handler/order_handler.go` (Modify)

## Technical Requirements
- **LAK Currency Precision:** Ensure price fields use exact integer types or high-precision decimals (`int64` / fixed precision) to eliminate floating-point arithmetic errors for Lao Kip (LAK).
- **Domain Struct Normalization:** Align struct models (`Order`, `OrderItem`, `CustomPrintSpecs`, `CostBreakdown`) to support `TrackingCode` and prevent type mismatch on nullable database fields.
- **Unified Pricing Service:** Backend computes:
  $$\text{Total Price} = \text{Base Material Cost} + \text{Ink Usage Cost} + \text{Labor/Finishing} + \text{Markup}$$
  Cost breakdowns (e.g. ink comparison vs genuine baselines) are calculated exclusively by the backend. Mask internal operational costs before sending payloads to public-facing customer tracking endpoints.
- **REST & SSE Endpoints:**
  - `POST /api/v1/pricing/calculate`: Compute net retail and internal cost breakdown for Admin.
  - `GET /api/v1/orders/track/:tracking_code`: Retrieve public-facing order status and pricing breakdown for Customer Service.
  - `GET /api/v1/orders/stream`: SSE (Server-Sent Events) endpoint for real-time order lifecycle status updates.

## Constraints & Output Rules
- Strict Go typing with robust error handling; no untyped empty interfaces `any`/`interface{}` in domain models.
- Preserve business terms and native text (Lao/Thai strings) exactly as defined.
- Prevent client-side price tampering by ensuring all final pricing calculations are authoritative on the backend.