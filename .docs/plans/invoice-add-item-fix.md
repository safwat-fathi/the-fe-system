# Plan: Fix “Add New Item” for Existing Invoices (Create vs Update)

## Problem Statement
When adding a new item to an existing invoice, the save flow sometimes treats the row as an update of an existing detail instead of creating a new detail. This happens especially when the user edits an existing row (with a real DB `id`) to point to a different item instead of inserting a truly new, empty row first.

Symptoms:
- Logs show numericRowId matching existing DB detail ids (e.g., 247, 378, 383, 384) and we hit the UPDATE branch.
- The “new item” branch (POST `api_create_invoice_dtl`) is not taken, even though the intention is to add a brand-new item line.

Root Causes:
- Current classification uses only the row’s `id` vs the original detail id set. If the user changes an existing row to a different item, we still consider it “existing” and update.
- Some “new” client rows may reuse non-zero ids (e.g., timestamps) that could collide with logic; also, users often reuse existing rows rather than adding a blank one first.

## Goals
- Ensure that adding a new item (net addition to the invoice) calls POST `api_create_invoice_dtl`.
- If the user changed an existing row’s item (replacing the original item in-place), treat it as REPLACE: create a new detail row (POST), then delete the original row (DELETE). Do not PATCH the original in this case.
- Keep simple field edits (qty/weight/prices) on existing rows as PATCH updates.
- Make sure we don’t double-delete (e.g., if the user deletes a row and then adds a new one with the same item, we should not delete the original again).
- Ensure there is no duplication of row ids (e.g., if the user adds a new row and then changes it to a different item, we should not create a second detail row).

## Approach
We will make row classification robust and explicit during save:

1) Build original references once at save time:
   - `originalDetailIds`: Set<number> of DB detail ids from `originalInvoiceItems`.
   - `originalById`: Map<number, OriginalRow> keyed by DB detail id to access the original item id per row.

2) For each current row (`validItems`):
   - Resolve `numericRowId = getNumericRowId(row.id)` (null if client-only or non-numeric).
   - Resolve `currentItemId = getItemIdFromRow(row)` (prefers `row.item` over `row.item_id`).
   - If `numericRowId` NOT IN `originalDetailIds` → CREATE
     - POST `api_create_invoice_dtl` with `inv` (invoice PK), `item`, and computed totals/tax.
     - Ensure we do NOT include any client `id` inside the payload.
   - Else (row existed):
     - Resolve `originalItemId = getItemIdFromRow(originalById[numericRowId])`.
     - If `currentItemId === originalItemId` → UPDATE
       - PATCH `api_update_invoice_dtl/{numericRowId}` with the computed payload.
       - Do not send `id` inside body (path id is authoritative).
     - Else (user replaced item on an existing row) → REPLACE
       - POST `api_create_invoice_dtl` with the new item payload (no id in body).
       - Queue `numericRowId` for deletion.

3) Execute deletions after create/update passes:
   - Merge queued replacements + user-derived deletions.
   - DELETE each with `api_delete_invoice_dtl/{id}`.

4) Payload contract alignment (based on working cURL):
   - POST body must include at least: `com`, `inv` (invoice DB PK), `item`, `qty`, `weight`, `g_weight`, `price`, `price_w`, `trans_type`, `total`, `total_a`, `total_w`, `tax`, `tax_prc`, optional `stones`, `sn`, `item_desc`, `item_code`.
   - For PATCH, use the same body minus any `id` property; id is supplied via URL segment.

5) Optional UI reinforcement (non-breaking, can be done later):
   - When adding a blank row on the client, set `id = 0` to make “new row” unambiguous.
   - Keep setting both `item` and `item_id` on selection (already implemented) to avoid stale reads.

## Files to Update (single place logic)
- `hooks/useInvoiceForm.ts`
  - Implement the three-way classification (CREATE, UPDATE, REPLACE).
  - Build `originalDetailIds` + `originalById`.
  - Perform replacements (create then queue deletion) and defer deletions to the end.
  - Ensure for CREATE/UPDATE we strip `id` from the body and rely on path id for updates.

No changes required in services or components for this fix (they already accept our intended payloads and paths).

## Edge Cases
- Item changed but original line is also flagged for deletion manually: the final deletion set will dedupe ids; behavior remains correct.
- Client-created rows with non-zero ids: classification is still based on membership in `originalDetailIds`, so they will be treated as CREATE.
- Missing `item` in row: filter `validItems` ensures only rows with valid item ids are processed.

## Validation Steps
1) Edit an existing invoice with multiple rows:
   - Change quantity on an existing row → should PATCH the row’s DB id.
   - Change item on an existing row → should POST a new detail and DELETE the original row id.
2) Add a new row via “+ صف”, pick an item, save → should POST a new detail.
3) Add an item without touching existing items (net addition) → POST occurs, no DELETE.
4) Refresh invoice details and confirm all changes persisted.

## Rollout
- Implement in `hooks/useInvoiceForm.ts` only.
- Manually verify on dev server.
- No API changes or config updates required.

