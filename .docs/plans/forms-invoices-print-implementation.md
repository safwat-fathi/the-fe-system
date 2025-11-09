# Forms/Invoices — Printable Invoice Plan

## Summary
Implement a clean, Arabic RTL, A4-ready print view for invoice header, items, and totals triggered from the existing "طباعة" action.

## Approach (Option A: HTML builder)
- Add `utilities/print/invoicePrint.ts` exporting `buildInvoicePrintHtml(args)`.
- In `hooks/useInvoiceForm.ts` implement `previewInvoice()` to:
  - validate inputs, compute totals, map items
  - build HTML and open a print window
  - call `print()` on load, mark printed state

## Data/formatting
- Date: DD-MM-YYYY
- Numbers: grouped; 0 or 2 decimals
- RTL layout, fixed column widths, sticky header per page

## Files
- ADD `utilities/print/invoicePrint.ts`
- MODIFY `hooks/useInvoiceForm.ts` (use builder in `previewInvoice`)

## Alternative (Option B: SSR print route)
- Dedicated route `/forms/invoices/print?type=&id=` that server-renders the same markup and auto-prints. Optional later.

## Acceptance
- One-click print shows header, customer/vendor info, full items table, and totals; formatting matches UI.

