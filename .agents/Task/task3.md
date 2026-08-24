# Phase 3 - Task 3: Customer Service Order Tracking & Real-Time Lifecycle Stream

## Objective
Develop the customer-facing order tracking interface in `som-sing-phim-frontend`. Connect to the tracking API and per-order SSE real-time stream to display live status transitions, sanitized order details, and formatted LAK currency totals.

## Target Files
- `som-sing-phim-frontend/src/types/tracking.ts` (Create / Modify)
- `som-sing-phim-frontend/src/hooks/useOrderTrackingStream.ts` (Create)
- `som-sing-phim-frontend/src/components/tracking/OrderTrackingSearch.tsx` (Create / Modify)
- `som-sing-phim-frontend/src/components/tracking/OrderStatusTimeline.tsx` (Create / Modify)

## Technical Requirements
- **Tracking Search Module:** Provide a search input component accepting `TrackingCode` with client-side validation, error states, and loading skeletons.
- **Per-Order SSE Listener (`useOrderTrackingStream`):** Connect to `/api/v1/orders/stream?tracking=TRK-xxxx` with automatic reconnect exponential backoff and fallback polling if SSE connection drops.
- **Lifecycle Timeline & Edit Alert:** Render an accessible status timeline (`Pending` -> `In Production` -> `Ready for Pickup` -> `Completed`). Display a notification badge if an order specification is updated by Admin.
- **Sanitized Price & Spec Renderer:** Render retail price in LAK formatted with standard thousand separators (`10,000 ກີບ` / `LAK`) without exposing internal material or ink cost breakdowns.

## Constraints & Output Rules
- Zero client-side pricing calculation drift: All prices must reflect authoritative values from the backend API.
- Strict TypeScript (no `any`).
- Follow the design system tokens and responsive utilities established in the repository.
