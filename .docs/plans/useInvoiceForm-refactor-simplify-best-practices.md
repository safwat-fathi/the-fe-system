# Refactor useInvoiceForm to React Best Practices

## Summary
The `hooks/useInvoiceForm.ts` hook has grown very large (~50KB) and mixes several concerns: UI state, form reducer, invoice items manipulation, domain normalization/mapping, totals math, and persistence side-effects. This makes it difficult to read, reason about, and safely change.

This plan proposes a focused refactor that maintains the existing external API (return shape and behavior) while splitting responsibilities into smaller, testable parts, reducing effect complexity, and removing debug noise. No new features, no logic changes — only structure, readability, and maintainability improvements.

## Goals
- Preserve the public API consumed by `app/(pages)/forms/invoices/InvoiceClientPage.tsx` and related components.
- Extract pure utilities and domain mappers out of the hook.
- Centralize invoice items state transitions behind a reducer.
- Reduce effect complexity and duplicated calculations.
- Remove debug logs and dead/commented code; keep user-visible toasts.
- Improve typing and add JSDoc for maintainers.

## Non-Goals
- Changing data flow (still server-render + client hook props).
- Adding features or changing behavior.
- Moving server actions out (kept, but calls are better isolated).

## Current Pain Points (quick findings)
- Large monolithic hook (~1.5k lines) mixes: parsing, normalization, mapping, totals math, barcode search logic, CRUD orchestration, and UI state.
- Duplicate number parsing/formatting; scattered normalization logic.
- `invoiceItems` managed via `useState` with many imperative mutations; derived comparisons spread out.
- Several `useEffect` blocks handling initialization/sync can be merged and simplified.
- Verbose debug `console.log` statements and inline comments increase noise.

## Refactor Plan (Phased, backwards-compatible)

1) Extract pure utilities (no React)
- New: `utilities/invoiceForm.ts`
  - `parseNumber`, `ensurePositiveNumber`, `formatDecimalString`, `formatNumber`
  - `getItemIdFromRow`, `getNumericRowId`, `normalizeRowIdentifier`
  - `mapDetailToRow(detail, fallbackTransType)`
  - `mapRowToApiPayload(row, invoicePk, comId, yearId)`
  - `hasRowChanged(originalRow, currentRow, fallbackTransType)`
  - Export shared types: `InvoiceItemRow`, `ComparableRow`, `NumericValue`.
- Replace inline definitions in `useInvoiceForm.ts` with imports.

2) Introduce items reducer hook
- New: `hooks/useInvoiceItemsReducer.ts`
  - Manage: `invoiceItems`, `originalInvoiceItems`, `deletedItemIds`.
  - Actions: `setAll`, `addEmpty`, `upsert`, `removeById`, `markDeleted`, `resetFromServer`.
  - Keep selector helpers (e.g., `originalInvoiceItemMap`) via `useMemo`.
  - Provide a compatibility `setInvoiceItems(next)` that proxies to `setAll` when the hook’s consumer uses setter directly.

3) Simplify main hook
- Keep `form` via existing `useReducer` (no external API change).
- Replace ad hoc item mutations with reducer actions.
- Import utilities for mapping + math; keep `computeTotals` as a thin wrapper using the imported helpers.
- Remove all debug `console.log` lines; retain user toasts.
- Hoist constants and environment parsing to top-level helpers.

4) Streamline effects
- Merge initial load + props sync into predictable effects with guards (compare before set), reducing dependency noise.
- Encapsulate branch/year resolution in a small helper; avoid redundant state updates.

5) Keep behavior, return shape, and names intact
- Return object keys and semantics stay the same to avoid changes in `InvoiceClientPage` and child components.
- Any new internal helpers remain internal; no breaking exports.

6) Documentation + Types
- Add concise JSDoc to exported functions/types.
- Strengthen types to replace `any` where feasible (without breaking consumers).

## Files Touched / Added
- Modify: `hooks/useInvoiceForm.ts` (reorganized, imports utilities, uses items reducer, removes logs)
- Add: `utilities/invoiceForm.ts` (pure helpers + types)
- Add: `hooks/useInvoiceItemsReducer.ts` (local reducer for invoice items)

## Validation
- Type-check and lint: `npm run lint`
- Smoke run dev (on approval): `npm run dev` and navigate to `/forms/invoices?type=sale&mode=new`, edit routes too.
- Manual verification: create, update, and delete line items; save; preview; barcode search still functions as before (no new network calls added).

## Risks & Mitigations
- Risk: subtle behavior deviation. Mitigation: keep function signatures and key computation logic unchanged; utilities are pure moves.
- Risk: consumer break due to return shape differences. Mitigation: strict adherence to current return keys; provide adapter `setInvoiceItems`.

## Rollback Plan
- Changes isolated to three files; easy revert by restoring original `useInvoiceForm.ts` and removing the two new files.

## Request
If you approve, I will implement the refactor in small commits, run linting, and provide a concise diff summary. PLAN
