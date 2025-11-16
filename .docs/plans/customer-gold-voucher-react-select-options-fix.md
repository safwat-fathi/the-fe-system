# Customer Gold Voucher – React Select Options Fix Plan

## Context
- Runtime error: `props.options.map is not a function` triggered when opening a gold item picker in `CustomerGoldVoucherClientPage`.
- Current implementation uses `AsyncCreatableSelectRegular` from `react-select/async-creatable`, but the supplied `loadItemOptions` returns an object `{ options, hasMore, additional }` designed for `react-select-async-paginate`.
- Similar async select patterns appear in `DeliveryVoucherClientPage` and `ReceiptVoucherClientPage`.

## Objectives
1. Align async select components with the expected `withAsyncPaginate` contract to eliminate the runtime error.
2. Preserve existing pagination behaviour for items and stable async loading for customers/boxes across relevant voucher forms.
3. Ensure regression coverage for other voucher pages that share the same pattern.

## Proposed Steps
1. **Align Async Select Loaders**
   - Review every `loadOptions` handler used with `react-select/async-creatable`.
   - Ensure each handler resolves to a plain options array (the expected contract for `AsyncCreatableSelect`); remove `{ options, hasMore }` wrappers that trigger runtime failures.

2. **Page Updates**
   - Update `CustomerGoldVoucherClientPage` (and companion hooks) to return arrays from `loadItemOptions`.
   - Mirror the fix in `useReceiptDeliveryVoucherForm` to future-proof delivery/receipt vouchers.

3. **Cross-Page Verification**
   - Test the affected voucher screens (customer gold, customer receipt, delivery) to confirm item/customer selectors open without errors and return relevant results.

4. **Testing**
   - Run targeted lint (`npx eslint`) on modified files.
   - Smoke test affected forms locally if possible.

## Risks & Mitigations
- **Risk:** Behavioural changes in other pages sharing the component.  
  **Mitigation:** Update all affected pages and retest core interactions.
- **Risk:** Pagination regressions after signature change.  
  **Mitigation:** Validate `hasMore` and `additional.page` handling in loaders.

## Approval Needed
- Confirmation to proceed with the outlined refactor and adjustments across the affected voucher forms.


