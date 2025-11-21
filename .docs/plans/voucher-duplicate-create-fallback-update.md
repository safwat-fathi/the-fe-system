# Voucher Duplicate Create Fallback Plan

## Context
- Users report that when saving a customer receipt voucher with existing number (e.g. after fixing notes on an already-created voucher), the front-end still invokes the create API.
- Backend responds with HTTP 400 and `non_field_errors: ["The fields com, vouch_type, vouch_id must make a unique set."]`, causing the save to fail even though the intention is to update the current voucher.
- Current client logic only calls `updateVoucherAction` when form mode is `edit`; duplicate create flows do not auto-switch.

## Root Cause (Hypothesis)
1. Voucher already exists in the database (same `vouch_id`, `com`, `vouch_type`).
2. Front-end remains in "new" create flow (e.g. after validation errors or manual attempts) and issues another create request.
3. Server rejects duplicate combination, returning the unique-set error payload.
4. UI surfaces generic failure, preventing users from saving adjustments to the existing voucher.

## Proposed Fix
1. **Enhance `createVoucherAction`:**
   - Inspect failed responses from `voucherService.create`.
   - If response includes the unique-set error, look up the existing voucher by `vouch_id`/`vouch_type`.
   - Automatically delegate to `updateVoucherAction` with current payload (boxes, gold details, etc.).
   - Return a friendly message (e.g. “تم تحديث السند الحالي بنجاح”) when fallback succeeds.

2. **Improve Error Messaging:**
   - When lookup fails (no existing voucher found), surface a clear localized explanation telling user the number is already used.

3. **Verification Steps:**
   - Manual test: simulate duplicate create by creating voucher, leaving page in create mode, then re-saving to ensure update path triggers.
   - Confirm regular new voucher creation still works.
   - Confirm editing via `/[id]?mode=edit` continues to call update directly.

## Risks & Mitigations
- **Risk:** Auto-update might overwrite unintended records if duplicate arises from different branch/type.  
  **Mitigation:** Limit fallback lookup by `vouch_type` and ensure branch (`com`) matches default (1).
- **Risk:** Infinite recursion between create/update actions.  
  **Mitigation:** Use dynamic import or helper function to call update once, bypassing recursive create call.

## Approval
- Await confirmation before modifying server actions.


