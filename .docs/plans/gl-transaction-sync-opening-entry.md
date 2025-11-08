# Plan: Align GL posting with voucher detail values

## Summary
- After fixing detail persistence, GL posting still reads stale fields (`debit_base`, `base_debit`, `debit_g`) and may fall back to zero, causing mismatches like 1500 in GL rows.
- The helper should use the same numeric values sent to `vouchers_dtl` (cash and gold) without relying on legacy fallbacks.

## Proposed Changes
1. Normalise `VoucherDetailData` inside `createGLTransactionRecords`: convert the passed detail list to numbers and clone persisted details (if available) so we operate on authoritative data.
2. Update `createGLTransactionForDetail` to compute `debit_base` = `debit`, `credit_base` = `credit` (unless explicit base provided), and drop references to `base_debit`, `debit_g`, etc.
3. Ensure gold amounts default to zero rather than falling back to undefined properties, and keep the rest of the GL workflow intact.

## Validation
- After saving an opening entry, inspect both `vouchers_dtl_list` and `gl_transaction_list` to confirm identical debit/credit values for each line.
- Re-run posting of another voucher type to ensure regressions are avoided.

