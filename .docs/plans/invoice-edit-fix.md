# Plan: Fix Edit Invoice Loading and Details Resolution

This plan applies findings from `InvoiceEdit-GoldInvoice2.md` to harden the edit flow for invoices in the unified invoices form page and API service.

## Goals

- Support both `id` (record id) and `inv_id` (invoice number) in URLs for edit/preview.
- Robustly resolve the correct invoice header from `invoices_list` by matching identifiers.
- Fetch invoice details reliably by preferring the master record id (`inv`) first, with a fallback to `xinv_id`.
- Keep `trans_type` validation and existing page API intact.

## Changes

1) Page params support (`app/(pages)/forms/invoices/page.tsx`)
- Read both `inv_id` and `id` from `searchParams`; prefer `inv_id` when present for edit/preview.
- Keep `type` and `mode` handling unchanged.
- Reorder detail key preference to: `invoiceData.id` (record id) → `invoiceData.inv_id` → raw param.

2) Header fetch hardening (`services/api/invoice.service.ts`)
- Update `getInvoiceById` to:
  - Tolerate array, paginated `results`, and single-object responses.
  - Filter results to find an invoice whose `inv_id` equals the requested value. If not found and the requested value is numeric, try to match `id`.
  - When `transType` is provided, prefer matches with the same `trans_type`.

3) Details fetch robustness (`services/api/invoice.service.ts`)
- Update `getInvoiceDetails` to:
  - If the provided key is numeric, first query `invoices_dtl_list?inv={recordId}`.
  - If no results, fall back to current `xinv_id`-based query.
  - Continue to tolerate arrays and paginated responses.

## Validation

- From the invoices table, both Preview and Edit should load header and details for all four types: `sale`, `purchase`, `sale-return`, `purchase-return`.
- Manually test URLs with `?inv_id=` and `?id=`; confirm both paths load the same record.
- Confirm `trans_type` mismatch triggers `notFound()` in the page.

## Notes

- No client component logic changes are required; props remain consistent.
- The service changes are backward compatible with existing callers.

