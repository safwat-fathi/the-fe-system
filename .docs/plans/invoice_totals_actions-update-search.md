# InvoiceTotalsActions Search Update Plan

## Objective
- Search by invoice number from `InvoiceTotalsActions` should fetch invoice data, then navigate to the current invoice page (preview mode) with an updated query string (e.g., `forms/invoices?type=sale&mode=edit&edit=true&id=8`).
- It must NOT redirect to the reports page
- It must NOT trigger a page refresh

## Steps
1. Implement search flow in `hooks/useInvoiceForm.ts`:
   - Update `handleInvoiceSearch` to:
     - Validate `searchNumber`; if empty, show a warning toast and return.
     - Call `getInvoiceByIdAction(searchNumber)` to verify the invoice exists and obtain its record id.
     - If not found, show an error toast and return.
     - Map the current form context to the URL `type` param:
       - `sale` -> `sale`
       - `purchase` -> `purchase`
       - `sale_return` -> `sale-return`
       - `purchase_return` -> `purchase-return`
     - Update the query string with `mode=preview`, and `id=<recordId>` using `useQueryParams` hook like `InvoicesClient` component.
   - Keep the function signature the same so it continues to be passed as `onInvoiceSearch` to `InvoiceTotalsActions`.

2. Polish the trigger in `components/InvoiceTotalsActions.tsx`:
   - Disable the search button when `searchNumber` is empty.
   - Trigger `onInvoiceSearch` on Enter key in the search input.
   - Keep the UI unchanged otherwise.

## Acceptance Criteria
- Entering a valid invoice number in `InvoiceTotalsActions`:
  - Calls the server action to verify/fetch the invoice.
	- If found, updates the query string with the invoice record ID, type, and preview mode.
- Entering an invalid/non-existing number shows an error toast and stays on the current page.
- The search button remains disabled when the input is empty.

## Risks / Notes
- Ensure the navigation type mapping matches `app/(pages)/forms/invoices/page.tsx` expectations.
- Keep behavior isolated to the forms page; no impact on reports filtering.
