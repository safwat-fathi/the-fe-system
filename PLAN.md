# Invoice Editing Fix Plan

## Goal
- Restore the ability to edit invoice headers and line items without stale data after save.

## Observations
- `getInvoiceDetails` and `getInvoiceById` responses are tagged caching fetches (`services/api/invoice.service.ts`), but the corresponding server actions do not revalidate those tags after updates.
- `useInvoiceForm` re-fetches invoice data immediately after mutating it, so stale caches make the UI appear unchanged.

## Steps
1. Update invoice server actions to revalidate cached invoice data after a successful mutation (header updates and detail create/update/delete) and refresh the reports listing path.
2. Pass the active invoice record id through detail mutation calls so the actions can also revalidate the `invoice-details-{id}` tag used by `getInvoiceDetails`.
3. Ensure existing invoice detail rows map to `updateInvoiceDetail` calls reliably when their fields change.
4. Manually verify the flow by editing an invoice and its details to ensure updated values persist and show up immediately.

## Notes
- No new dependencies are required.
- Keep changes focused on the existing action/service layer; UI logic already handles refreshed data once caches are invalidated.
