# Forms/Invoices — Fix Blank Print (طباعة) Output

## Summary
- Clicking "طباعة" on `forms/invoices` shows a nearly blank PDF/page.
- Current handler `previewInvoice` in `hooks/useInvoiceForm.ts` only shows a toast and does not create a print view or call `window.print()`.
- Other modules (e.g., vouchers) generate a dedicated printable HTML in a new window, then call `printWindow.print()`. We will follow this proven pattern.

## Goal
Deliver a clear, RTL, A4-ready printable invoice that contains header, customer info, items table, and totals. Wire the existing Print button to open this printable view and trigger printing.

## Non‑Goals
- Changing invoice business logic, calculations, or persistence.
- Adding dependencies or introducing server-side PDF generation.

## Root Cause (why page is blank)
- The Print button calls `previewInvoice`, which doesn’t render a printable document. Printing the interactive form (if attempted) usually hides inputs/buttons by our global `@media print` rules — resulting in an empty page except header/title.

## Proposed Changes (high level)
1) Add a small utility to generate printable invoice HTML with inline print CSS (RTL, A4, compact): `utilities/print/invoicePrint.ts`.
2) Use available state (form, selected customer, invoice items, `computeTotals`, gold price, etc.) to fill the template.
3) Update `previewInvoice` in `hooks/useInvoiceForm.ts` to:
   - Validate inputs (already done),
   - Compute totals using `computeTotals(form.pay_type, validItems)`,
   - Build HTML via the new utility,
   - `const win = window.open('', 'print', 'width=1024,height=768');` and write the HTML,
   - `win.document.close(); win.focus(); win.print();`
   - Optionally set `setPrint(true)` after `print()` for UX.
4) Keep everything client-side; no new packages.

## Files To Add/Modify
- ADD `utilities/print/invoicePrint.ts` (pure function returning HTML string)
- MODIFY `hooks/useInvoiceForm.ts` (implement print flow in `previewInvoice`)
- (No changes) `components/InvoiceTotalsActions.tsx` already calls `previewInvoice` on Print button.

## Printable Layout (contents)
- Header: Company name, invoice title (بيع/شراء/مردود), invoice number, date/time.
- Customer/Counterparty: name/code, VAT/CR numbers, address (if present), payment method.
- Items table (RTL):
  - Columns: `#`, `الكود`, `الصنف`, `العيار`, `الوزن`, `الوزن المعاير`, `سعر الجرام`, `أجرة/جرام`, `خصم`, `ضريبة`, `الإجمالي`.
  - Supports both قيمة/أجور/قيمة وأجور via existing totals & pay type.
- Totals: total amount, total discount, tax, net amount, total gold weight; show gold price if available.
- Footer: optional QR if present in state (only if already generated) and print timestamp.

## Styling (inline CSS inside template)
- `@page { size: A4; margin: 1cm; }`
- `body { direction: rtl; font-family: 'Cairo', system-ui, sans-serif; }`
- Compact table styles with clear borders for print; avoid hidden elements.
- Avoid reliance on global `@media print` so the print view is self-contained.

## Data Sourcing
- Header fields: `form.inv_id`, `form.inv_date`, invoice type from page context passed to hook.
- Customer: from `selectedCustomer`, `selectedCustomerName`, VAT/CR/address fields in form state.
- Items: `invoiceItems` (filtered to valid items via `getItemIdFromRow`).
- Totals: `computeTotals(form.pay_type, validItems)` from the hook.
- QR: use `invoiceData?.inv_QR` if present; do not regenerate.

## Implementation Steps
1. Create `utilities/print/invoicePrint.ts`:
   - Export `buildInvoicePrintHtml(args)` with explicit typed input.
   - Accept arrays and numbers as plain primitives; avoid importing React.
   - Return a complete HTML string (`<!doctype html> ...`).
2. Update `previewInvoice` in `hooks/useInvoiceForm.ts`:
   - Keep current validations (customer + at least one item).
   - Compute totals; map details to minimal printable shape.
   - Call `buildInvoicePrintHtml` and open/print in a new window.
   - After `print()`, mark printed: `dispatchForm({ type: 'SET_FIELD', field: 'print', value: true })`.
3. Manual test in browser for the 4 invoice types (بيع/شراء/مردود بيع/مردود شراء).
4. Small adjustments to column widths or fonts if clipping occurs.

## Acceptance Criteria
- Clicking "طباعة" opens a print preview populated with invoice data (no blank pages).
- Layout is RTL, readable, and prints to A4 without content cutoff.
- Works for invoices with both value and wages; totals match on-screen totals.
- No new dependencies; no server-side changes; no regression to save flows.

## Edge Cases & Notes
- If form is empty or no items: same validation as now (toast, no print).
- If some optional fields (VAT/CR/address) are blank, hide corresponding rows.
- Ensure Safari/Chrome consistency: call `win.document.close()` and `win.focus()` before `print()`.

## Rollback Plan
- Revert changes to `hooks/useInvoiceForm.ts` and delete `utilities/print/invoicePrint.ts`.
- No schema or persistent data changes involved.

## Estimated Effort
- Implementation: ~2–3 hours including iteration on layout.
- Testing: ~30–45 minutes across invoice types and browsers.

---

Please confirm approval to implement this plan. Once approved, I will:
1) add `utilities/print/invoicePrint.ts`,
2) wire `previewInvoice` to open the printable view and trigger printing,
3) verify visuals and adjust minor styles if needed.

