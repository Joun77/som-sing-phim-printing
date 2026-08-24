# Phase 3 - Task 3: Customer Service Order Tracking & Real-Time Lifecycle Updates

## Objective
Build the customer-facing order tracking interface in `som-sing-phim-frontend`. Connect to the central tracking API and SSE real-time stream to display live order progress, public pricing breakdowns, and item specifications.

## Target Files
- `som-sing-phim-frontend/src/types/tracking.ts` (Create / Modify)
- `som-sing-phim-frontend/src/hooks/useOrderTrackingStream.ts` (Create)
- `som-sing-phim-frontend/src/components/tracking/OrderTrackingSearch.tsx` (Create / Modify)
- `som-sing-phim-frontend/src/components/tracking/OrderStatusTimeline.tsx` (Create / Modify)

## Technical Requirements
- **Tracking Search Module:** Provide a clean input component for customers to query their orders using `TrackingCode` with client-side validation.
- **Real-Time Lifecycle Hook:** Implement `useOrderTrackingStream` using EventSource / SSE with automatic reconnection and fallback polling to receive instant status updates published by Admin actions.
- **Price Breakdown & Spec Renderer:** Render item details, dimensions, selected finishes, and retail price in LAK formatted with standard thousand separators.
- **UI & Accessibility:** Display progress through a responsive timeline badge component (`Pending` $\rightarrow$ `In Production` $\rightarrow$ `Ready for Pickup` $\rightarrow$ `Completed`) supporting Lao and Thai language tokens.

## Constraints & Output Rules
- Ensure no internal cost structures (e.g. baseline ink margins, overhead costs) are exposed or rendered.
- Zero external runtime calculation drift: All prices and totals must reflect only what is returned by the backend API.
- Maintain responsive layouts and follow the existing UI component library standards.
