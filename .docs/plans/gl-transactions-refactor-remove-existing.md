# GL Transactions Removal & Rebuild Plan

## Goal
Remove all current logic related to `gl_transaction` so we can rebuild the posting layer from scratch with a cleaner design.

## Scope
Delete or strip out:
- Server actions responsible for posting/deleting GL (`app/actions/voucher/create.ts`, `app/actions/voucher/update.ts`, `app/actions/gl-transaction.action.ts`, helpers under `app/actions/voucher/helpers/gl-transaction.ts`).
- API service wrappers (`services/api/gl-transaction.service.ts`, `services/api/generic.service.ts` references).
- UI hooks and components that fetch/display GL data (`hooks/useGLTransactions.ts`, modals/buttons in voucher forms, settings pages for GL management).
- Documentation and scripts tied to current posting flow (`documentation/gl-posting-contracts.md`, `scripts/check-gl-posting.ts`).

## High-Level Steps
1. **Catalog Dependencies**
   - Identify every import of `useGLTransactions`, `glTransactionService`, or helper functions to ensure a clean removal without breaking build.

2. **Remove Server-Side Posting Logic**
   - Delete helper file `helpers/gl-transaction.ts`.
   - Strip posting calls from voucher create/update actions (temporary no-op until new system is built).
   - Remove GL-specific server actions (`gl-transaction.action.ts`).

3. **Remove API Layer & Utilities**
   - Delete `services/api/gl-transaction.service.ts` and related generic service entries.
   - Update any shared constants/types referencing GL transactions.

4. **Update UI**
   - Remove GL modal hooks/buttons in voucher pages.
   - Remove settings pages/components dedicated to GL transaction management.

5. **Clean Supporting Assets**
   - Remove documentation and scripts tied to current logic.

6. **Validation**
   - Ensure build/lint still pass (even though posting is temporarily disabled).
   - Manual sanity check on voucher flows to confirm no leftover references.

## Notes
- After cleanup, vouchers will no longer post to GL until the new flow is implemented.
- We can leave TODO comments in create/update actions indicating where the new posting hook will plug in.

## Next Step
- Await confirmation to proceed with the removal per steps above.


