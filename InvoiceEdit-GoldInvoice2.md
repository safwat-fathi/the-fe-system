# Invoice Edit Flow — Gold_invoice2

File analyzed: `main-copy/app/dashboard/forms/invoices/Gold_invoice2/page.tsx`

This document explains how invoice editing is implemented for gold invoices (trans_type=2), covering both the invoice header and the invoice detail rows (items): loading, editing, creating, updating, deleting rows, totals, and preview.

## Overview

- Client component that handles creation and editing of gold invoices.
- Supports loading by `inv_id` (query param), editing header fields, editing item rows, and a diff-based update of details.
- Draft persistence to `localStorage` while creating new invoices.
- Manual totals override with proportional distribution.
- Invoice navigation and invoice preview with ZATCA QR.

## Edit Mode & State

- Flags
  - `isExistingInvoice`: true when an invoice was fetched from server; otherwise false.
  - `isEditing`: controls UI editability. Starts true; set false after save/update.
  - `invoicePk`: primary key (DB id) for the loaded invoice; required for updates.
- Tracking for diff updates
  - `originalInvoiceItems`: snapshot of server-loaded details (used to decide PATCH vs POST).
  - `deletedItems`: items removed in UI that existed in DB; deleted server-side on save.
- Transitions
  - On load existing: `isExistingInvoice=true`, `isEditing=false`.
  - On save/update success: mark committed, `isEditing=false`, refresh snapshots and clear draft/deleted lists.

## Loading an Existing Invoice

- Trigger: `inv_id` search param or manual search via the top bar.
- Duplicate load prevention: `lastLoadedInvoiceRef` and `lastLoadedInvoice` guards.
- Header fetch
  - `GET invoices_list?xinv_id={inv_id}&xtrans_type=2`
  - Accepts list, paginated (`results`), or single object responses.
- Header mapping
  - Fills: `inv_id`, `inv_date`, `cust`, `inv_type` → `paymentMethod`, `pay_type`, `vat_no`, notes, employee, address fields, gold price, commit/print flags.
- Detail fetch
  - Preferred: `GET invoices_dtl_list?inv={invoicePk}`
  - Fallback: fetch all `invoices_dtl_list` and filter locally by `inv`.
- Detail mapping
  - Each row → `{ id, item_id, item_code, item_name, qty, weight, g_weight, k, price, price_w, inv_notes, trans_type, G875 → purity, total, total_w, total_a, tax, tax_prc, stones, item_disc_prc, item_disc_amt, sn, item_desc, cr_* / upd_* }`.
  - Seeds both `invoiceItems` and `originalInvoiceItems`.
- Totals reset after load: recompute auto totals; reset manual overrides to off.

## Creating a New Invoice (Save)

Function: `saveInvoice`

- Guards: requires selected customer and at least one valid item (`item_id`).
- Generates `inv_id`: fetches `invoices_list`, finds max `inv_id`, increments by 1.
- Header payload
  - Includes computed totals (`inv_amt` net with VAT, `inv_net` without VAT), `tax`, `tax_prc`, `inv_type` (`cash` vs `credit`), `pay_type`, `gold_price`, address fields, and `inv_QR` (ZATCA).
- POST header: `POST api_create_invoice` → expects `{ id }` as DB PK; stored in `invoicePk`.
- Details creation
  - For each valid row, composes a `dtl` object with computed totals and taxes based on `payType`:
    - `dtlPrice` = `price` (payType 1/3) or `price_w` (payType 2)
    - `dtlTotalA` = `total_a` (or `weight * price`) if payType ≠ 2; otherwise `total_w` (or `weight * price_w`)
  - POST detail: `POST api_create_invoice_dtl` (via `CREATE_INVOICE_DTL`).
- After success: show success toast, commit flag on, mark invoice existing, disable editing, clear `invoice_draft`.

## Updating an Existing Invoice

Function: `updateInvoice`

- Guards: requires `invoicePk`, selected customer, and valid items.
- Header update
  - Cleans null/undefined from payload and `PATCH api_update_invoice/{invoicePk}`.
- Detail updates — diff strategy
  1. Build `originalIds` from `originalInvoiceItems` and current `invoiceItems` ids.
  2. Deletions: for each `deletedItems` row, `DELETE api_delete_invoice_dtl/{id}`.
  3. Upsert for each current row:
     - Compose `dtl` with totals/tax (same logic as create).
     - If `row.id ∈ originalIds` → `PATCH api_update_invoice_dtl/{row.id}`.
     - Else → `POST api_create_invoice_dtl`.
- After success: success toast, mark committed, disable editing, set `originalInvoiceItems = invoiceItems`, clear `deletedItems`.

## Editing Item Rows

- Items are stored in `invoiceItems` and passed to `InvoiceItemTable` with `setInvoiceItems` for in-table editing.
- Removal handling: `onItemRemoved(removedItem)` checks if the item existed in the DB (id in `originalInvoiceItems`). If yes, pushes it into `deletedItems` for server deletion on update.
- Insert via barcode/code search (`handleBarcodeSearch`)
  - Searches loaded items first; if not found, queries API by barcode (`fetchItemByBarcode`) then by code (`SearchItemsList`).
  - Fills the first empty row or inserts a new one at the top.
  - Defaults: price(s), weights, purity/k (falls back to category if missing), stones. Ensures purity present (defaults to `homePurity`).
  - Computes `total_a`, `total_w`, and `total` with `tax` per `payType` and `item_disc_amt`.

## Totals & Taxes

- Auto totals
  - `autoTotalValue` = Σ(weight × price)
  - `autoTotalWages` = Σ(weight × price_w)
- Manual totals
  - Toggle `useManualTotals` to enable.
  - Distributes `manualTotalValue` and `manualTotalWages` proportionally across rows, preserving unit prices. Falls back to equal split when needed.
- Row totals base by `payType`
  - 1 (value): use `totalA`
  - 2 (wage): use `totalW`
  - 3 (both): sum of both
  - Discount reduces tax base; tax uses `tax_prc` (default 15%).
- Aggregates
  - `totalAmount` = sum of row bases (respecting `payType` and manual/auto distributions) minus discounts.
  - `taxAmount` = Σ(row tax bases × 0.15).
  - `netAmount` = `totalAmount + taxAmount`.

## Purity and Calibrated Weight

- Computes `g_weight` from `weight` and `purity` relative to `homePurity`.
- Reverse-computes `purity` from `g_weight` when user adjusts it and weight exists.

## Draft Persistence (New Invoices)

- While editing a new invoice (`!isExistingInvoice`), saves a draft to `localStorage` (`invoice_draft`).
- Restores if present and recent (< 30 minutes), rehydrating header and rows.
- On successful save or when resetting for a new invoice, clears the draft.

## Navigation & Preview

- Navigation
  - Loads list of invoices: `invoices_list?trans_type=2` to enable first/prev/next/last.
  - Navigating updates the URL with `inv_id`, which triggers the invoice load flow.
- Preview
  - Generates printable HTML via `renderInvoicePreview` with company and customer metadata and a ZATCA QR.

## API Endpoints

- Headers
  - Create: `POST api_create_invoice`
  - Update: `PATCH api_update_invoice/{invoicePk}`
  - List/Search: `GET invoices_list`, `GET invoices_list?xinv_id=...&xtrans_type=2`, `GET invoices_list?trans_type=2`
- Details
  - Create: `POST api_create_invoice_dtl`
  - Update: `PATCH api_update_invoice_dtl/{id}`
  - Delete: `DELETE api_delete_invoice_dtl/{id}`
  - List: `GET invoices_dtl_list?inv={invoicePk}` (or fallback all)
- Auxiliary
  - Items: `GET GetItemsList/`, `GET SearchItemsList/?q=...` and `fetchItemByBarcode`
  - Settings/Price: `HOME_LIST` and `fetchGoldPrice`

## Notable Notes

- Response shape tolerance: code handles array, paginated `results`, and single-object responses.
- Category-based defaults: auto-fills `k` / `purity` from category when item lacks them.
- Invoice number generation is asynchronous and protected from overwriting an already set number.
- Arabic-first user experience with toasts and field labels/logging.

