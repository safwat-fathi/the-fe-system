# Plan: Add cost center selector to adjustment voucher form

## Summary
- Adjustment vouchers currently lack the header-level "Cost Center" selector that exists on opening and cash receipt vouchers.
- Users want a consistent layout where the cost center sits beside the notes field and propagates to voucher details as a default.

## Proposed Changes
1. Extend `useVoucherForm` (and related helper hooks) with `handleMasterCostChange`, ensure the selected `cost_id` is stored on the master voucher and cascades to detail rows that don't override it.
2. Update `VoucherClientPage` (قيد التسوية) to render the new cost center dropdown with styling consistent with other header inputs, and reposition the notes field below it.
3. Include the selected `cost_id` in save payloads so the backend receives the master cost center for adjustment vouchers.

## Validation
- Manually load an existing adjustment voucher, set a cost center, add a new detail row, and confirm the row inherits the cost center while existing custom values are preserved.
- Save the voucher and verify the cost center persists after reload.

