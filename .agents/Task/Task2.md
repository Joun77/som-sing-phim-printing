# Phase 2 - Task 2: Admin Order Creation, Debounced Calculation & Edit Sync

## Objective
Implement optimized state management and input handling for Admin Order Creation and Direct Edit in `somsingphim`. Integrate backend calculation debouncing, optimistic table updates, and typed contracts matching Go domain models.

## Target Files
- `somsingphim/src/types/order.ts` (Modify / Create)
- `somsingphim/src/hooks/usePricingCalculator.ts` (Create)
- `somsingphim/src/components/orders/OrderCreationForm.tsx` (Modify)
- `somsingphim/src/components/orders/OrderHistoryTable.tsx` (Modify)

## Technical Requirements
- **TypeScript Contracts:** Define complete types (`Order`, `OrderItemInput`, `PrintSpecification`, `AdminPricingBreakdown`) synchronized 1:1 with Go domain structs.
- **Debounced Calculation Hook (`usePricingCalculator`):** Implement a 300ms debounce on print dimension, paper grammage, finishing, and quantity changes before calling `/api/v1/pricing/calculate`.
- **Form Validation & Tracking Assignment:** Validate print parameters client-side before submission; bind generated `TrackingCode` upon successful order creation.
- **Optimistic State & Direct Edit Synchronization:** Apply optimistic UI updates on order creation and lifecycle transitions (`Pending`, `In Production`, `Completed`, `Cancelled`) in `OrderHistoryTable`. Trigger backend status reset and audit logging on edit.

## Constraints & Output Rules
- Strict TypeScript: No `any` types; all props, state, and form values must adhere to explicit interfaces.
- Component Isolation: Use `React.useMemo` and `React.useCallback` to eliminate unnecessary re-renders during high-frequency input.
- Maintain existing Admin design system tokens and styling.
