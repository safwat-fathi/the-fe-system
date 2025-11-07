# External Print Invocation for Data Tables (with alternatives)

## Context
- We want to trigger printing for the invoices report table from a button outside the table component (similar to the print button style in InvoiceTotalsActions).
- `AppDataTable` currently owns the TanStack Table instance; print is powered by `utilities/table/print.ts` (buildSimpleTablePrintHtml/printTableInNewWindow) and respects filtered/sorted rows (pre‑pagination row model), Arabic headers, and RTL.
- `InvoiceClientPage` (forms) does not render `AppDataTable`; it uses `previewInvoice` for invoice layout printing and should stay separate.

## Goals
- Provide a clean, type‑safe way to trigger print externally wherever the table is rendered.
- Keep changes minimal and isolated.
- Preserve existing Arabic formatting/columns and number/date formatting in the print utility.

## Option A — ForwardRef handle on AppDataTable (Recommended)
Expose a small imperative API from `AppDataTable` so parents can call `print()` and/or access the table instance.

Steps:
1) AppDataTable
   - Wrap with `forwardRef` and export a handle type:
     - `print(): void` — prints using the internal table instance.
     - `getTable(): TanTable<any>` — returns the TanStack table instance for advanced use.
2) Reports parent (InvoicesReport `InvoiceClient.tsx`)
   - `const tableRef = useRef<AppDataTableHandle>(null);`
   - Render: `<AppDataTable ref={tableRef} columns={...} data={...} printTitle="تقارير الفواتير" printColumnIds={["inv_id","inv_date","cust_name","inv_net","tax","inv_amt","type"]} />`
   - External print button: `onClick={() => tableRef.current?.print()}`.

Pros:
- Simple API; no extra state; type‑safe; works anywhere the table is rendered.
- Keeps table concerns inside the component; parents don’t need to know TanStack internals.

Cons:
- Imperative API (via ref) instead of declarative.

## Option B — onTableReady callback (No refs)
Provide a prop that passes a ready‑to‑use `TanTable` or `print()` callback back to the parent.

Steps:
1) AppDataTable: add `onTableReady?: (table: TanTable<T>) => void`.
2) Parent stores the instance in state and calls `printTableInNewWindow(table, opts)` from its own button.

Pros:
- Declarative callback; easy to mock for tests.

Cons:
- Parents may couple to TanStack types; more boilerplate.

## Option C — Data‑driven printing (table‑agnostic)
Print from raw `rows + column map`, bypassing the table instance.

Steps:
1) Add `printTableData(rows, columns, options)` utility that mirrors our HTML builder.
2) Parent constructs the array from whatever data source it already has and calls print.

Pros:
- Completely decoupled from TanStack; reusable for non‑TanStack lists.

Cons:
- Won’t reflect current table filtering/sorting/pagination automatically — parent must reapply filter/sort.

## Option D — Global event / store (Zustand)
Register the active table instance in a small store; external buttons dispatch `print` without props/refs.

Pros:
- Dead‑simple invocation from anywhere in the route.

Cons:
- Hidden coupling and lifecycle edge‑cases (e.g., stale instance on unmount).
- Overkill unless many unrelated components must trigger print.

## Option E — Dedicated print route (SSR/Server page)
Link to `/reports/invoices/print?...` that renders a server component table (same filters) and calls `window.print()` on mount.

Pros:
- Fully controlled layout; zero client state issues; works reliably across browsers.

Cons:
- Requires wiring filter/query param syncing and a separate layout.

## Recommended Path
- Implement Option A (ForwardRef handle) for `AppDataTable` and use it in the Invoices Report page’s external print button.
- Keep `previewInvoice` for invoice forms (it uses a different printable layout and logic).

## Acceptance Criteria
- The external “طباعة” button (outside the table) prints the same filtered/sorted rows with the configured Arabic columns and formatting.
- No regressions to sorting, filtering, or navigation.
- The “النوع” column prints correctly (now backed by an accessor that returns the Arabic label).

## Rollback Plan
- Remove the forwardRef wrapper and delete the handle type; parents fall back to inline print button within `AppDataTable`.

## Open Questions
- Do we want both internal and external print buttons, or only the external one?
- Should we add CSV/Excel export on the same external toolbar (can reuse the pre‑pagination row model)?

---

If approved, I will implement Option A and update the reports invoices page to use the external button with the forwardRef handle.
