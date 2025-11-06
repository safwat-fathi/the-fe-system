# Gold Vouchers Boxes API Plan

## Summary
- Vouchers related to gold (customer receipt `gvoucher4`, customer payment `gvoucher5`, gold delivery, and gold receipt) currently load boxes via the generic `boxes_list` endpoint.
- The provided API `boxes_list_gold` should supply only gold-designated boxes and must be used for these screens.
- Other voucher screens continue to rely on the existing boxes list.

## Objectives
1. Expose a dedicated method in `boxesService` for fetching gold boxes from `boxes_list_gold`.
2. Allow `voucherFormDataService.getVoucherFormData` to request gold boxes when needed while keeping current consumers unchanged.
3. Update gold voucher pages (`gvoucher4`, `gvoucher5`, `delivery`, `receipt`) to request form data with gold boxes.

## Proposed Changes
1. **Service layer**
   - Add `getGoldBoxes` to `services/api/boxes.service.ts`, mirroring `getBoxes` but targeting `boxes_list_gold`.
   - Introduce an options argument (e.g., `{ goldBoxes?: boolean }`) to `voucherFormDataService.getVoucherFormData` to select the appropriate boxes source.
2. **Page updates**
   - Modify the gold voucher pages (new/edit) to call `getVoucherFormData({ goldBoxes: true })`.
   - Ensure existing pages without gold behavior continue to call without parameters.
3. **Typing & reuse**
   - Reuse existing `Box` model types; no schema changes expected.
   - Maintain caching using `cache()` while supporting the new options argument.

## Validation
- Confirm gold voucher screens display gold-only boxes.
- Verify non-gold voucher screens still load the full boxes list.
- Sanity-check API error handling remains consistent.

