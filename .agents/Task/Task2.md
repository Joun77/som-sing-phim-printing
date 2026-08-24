# Phase 2 - Task 2: Admin Order Creation & State Synchronization

## Objective
Implement optimized state synchronization and input handling for the Admin Order Creation form in `somsingphim`. Integrate backend calculation debouncing, optimistic state updates, and strict TypeScript types.

## Target Files
- `somsingphim/src/types/order.ts` (Modify / Create)
- `somsingphim/src/hooks/usePricingCalculator.ts` (Create)
- `somsingphim/src/components/orders/OrderCreationForm.tsx` (Modify)
- `somsingphim/src/components/orders/OrderHistoryTable.tsx` (Modify)

## Technical Requirements
- **TypeScript Contracts:** Define comprehensive interfaces (`Order`, `OrderItemInput`, `PrintSpecification`, `PricingResponse`) aligned strictly with Go backend domain models.
- **Debounced Calculations:** Implement `usePricingCalculator` with a 300ms debounce to prevent API thrashing and race conditions when operators update paper dimensions, quantities, or finishing options.
- **Optimistic State & Status Transitions:** Update local state optimistically upon order creation and status modifications (`Pending`, `Processing`, `Completed`, `Cancelled`) before refetching.
- **Tracking Code Display:** Display generated tracking codes clearly with one-click copy functionality to facilitate dispatch to customers.

## Constraints & Output Rules
- Strict TypeScript: No `any` types; all props and state variables must be strictly typed.
- Component performance: Memoize expensive breakdown computations and subcomponents using `React.useMemo` and `React.memo`.
- Do not remove or alter existing layout styling unless directly required for state binding.