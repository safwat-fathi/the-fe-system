# Plan: Add top-level cost center to opening entry voucher

## Summary
- The opening entry form currently lacks a master cost center selector; only detail rows can carry cost IDs.
- The `vouchers` payload needs to persist a selected cost (stored in the backend `cost` field), and details should receive that cost by default.

## Proposed Changes
1. Extend the master form in `BalanceVoucherClient` with a cost center dropdown (using existing `costCenters` list) placed beside the voucher notes.
2. Track `voucher.cost_id` in `useBalanceVoucherForm`: initialise from incoming data, update when the selector changes, and ensure new detail rows (and rows without explicit cost) inherit the selected cost.
3. Include `cost_id` when composing the voucher payload in `proceedWithSave`, and adjust server mappings (e.g. `[id]/page.tsx`) so existing vouchers hydrate `cost_id` correctly.

## Validation
- Manual: select a cost center, add new rows, and verify the default cost populates; save and confirm both `vouchers` and `vouchers_dtl` carry the chosen cost.
- Regression: edit a voucher with existing cost assignments to ensure they remain intact unless explicitly changed.

