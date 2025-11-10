# Plan: Align GL posting for customer receipt/payment vouchers

## Summary
- Current GL posting for voucher types 4 (customer receipt) and 5 (customer payment) only records box (cash/gold) entries, leaving customer-side accounts absent.
- Business rule: for receipts, the customer account should be credited with both cash amount and calibrated gold weight while the corresponding boxes are debited; payments invert the entries.

## Proposed Changes
1. Extend `helpers/common.ts` with a helper to fetch customer info (name + account id) so GL posting can reference the customer’s account number without duplicate lookups.
2. Update `createGLTransactionRecords` in `helpers/gl-transaction.ts`:
   - Retrieve customer account info once (name + account id).
   - For customer vouchers (types 4 & 5), after posting box and gold-box lines, add matching GL entries for the customer account:
     - Cash: aggregate voucher box amounts and post a single customer entry with opposite debit/credit.
     - Gold: aggregate calibrated gold weights (and amounts) from `goldDetails`, posting the inverse entry for the customer with `g_*` fields.
   - Keep sequences coherent (increment `seq` for each new entry) and reuse `createGLTransactionForDetail`.
3. Ensure notes, cost center, and customer references propagate consistently to the new GL entries.

## Validation
- Create / update sample customer receipt (type 4) and confirm GL transactions include both box (debit) and customer (credit) lines for cash and gold.
- Repeat for customer payment (type 5) verifying the debits/credits are inverted.
- Spot-check that non-customer voucher types remain unaffected.

