# Invoices – Update query params mode behavior

## Summary
- After saving a new invoice, the URL remains with `mode=new`. It should switch to `mode=preview` and include an identifier (`inv_id` or `id`) to allow server-side re-fetch and correct page state.
- Clicking edit "تعديل" should update the query param `mode=edit` (and drop any legacy `edit=true`).
- When editing an invoice, we should not rely on `edit=true` at all, since `mode=edit` already expresses the intent.

## Proposed changes

1) InvoiceClientPage.tsx
- Add a small navigation helper using `useRouter`, `usePathname`, and `useSearchParams` to update URL query params safely (set `mode`, preserve `type`, remove `edit`).
- Wrap `saveInvoice` in a new `handleSave` that awaits the save, then updates the URL to `mode=preview`:
  - For new invoices: navigate to `mode=preview` and include `inv_id=<new invoice number>`.
  - For existing invoices: preserve whichever identifier is present (`id` or `inv_id`), still set `mode=preview`.
- Update the `onEdit` callback to set `isEditing(true)` and update the URL to `mode=edit` while removing any `edit` param; preserve `id`/`inv_id` if present.

2) useInvoiceForm.ts
- Modify the returned value of `saveInvoice` to resolve data the caller can use for navigation:
  - Return `{ ok: true, recordId: number, invoiceNumber: number }` on success.
  - Return `{ ok: false }` on failure (no throw), maintaining current toast/error UX.
- This allows `InvoiceClientPage` to reliably read the saved identifiers without depending on async state updates.

3) InvoiceTotalsActions.tsx
- No changes required to the component markup. We keep calling the passed-in handlers.
- The parent will provide the enhanced `onEdit` and `saveInvoice` wrapper so that the URL updates occur from the page.

## Notes and edge cases
- For preview/edit to work, the URL must include an identifier if not already present. We’ll prefer `inv_id` since the page already supports it as a primary lookup.
- We will not add or set `edit=true` anywhere; we only set `mode=edit`.
- We’ll use `router.replace` (not `push`) to avoid polluting the history stack on save/edit.

## Validation
- Manual checks:
  - Create new invoice → Save → URL updates to `mode=preview` with `inv_id=<number>`, page re-renders in preview mode.
  - Open existing invoice in preview → click "تعديل" → URL updates to `mode=edit` (no `edit=true`) and editing unlocks.
  - Save existing invoice in edit mode → URL remains with its identifier and switches to `mode=preview`.

## Impact
- Localized, minimal changes: one hook return shape, and the page’s handlers.
- No server code changes.

## Request
Please confirm this plan. On approval, I will implement the changes and test the flows described above.

