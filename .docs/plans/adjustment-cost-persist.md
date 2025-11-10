# Plan: Persist adjustment voucher cost center

## Summary
- Users report the cost center in adjustment vouchers stops persisting after loading an existing entry or saving edits.
- Investigation suggests the UI keeps the selected value, but the loader ignores the `cost` field (API may return `cost`, not `cost_id`), so the value is lost when rehydrating state.

## Proposed Changes
1. Update `useVoucherForm` loading logic (existing voucher + “create from previous”) to read both `cost_id` and `cost` properties, normalising to `voucher.cost_id`.
2. Ensure detail rows inherit the master cost only when appropriate (logic already exists, just reuse `handleMasterCostChange` after load if needed).
3. Verify `useVoucherActions` already sends `cost_id` for create/update; adjust only if gaps appear.

## Validation
- Load an existing adjustment voucher with a cost center; confirm the select shows the saved cost and saving keeps it.
- Create a new adjustment voucher, set a cost center, save and reload to ensure it's preserved.

