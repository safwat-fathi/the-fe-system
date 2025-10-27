# Boxes Page Refactor Plan

## Objectives
- Align `app/(pages)/basic/boxes/page.tsx` with the data-loading pattern used by invoices and items pages (server-side fetch, typed search params, pagination awareness).
- Replace the bespoke `BoxesClient` table rendering with `AppDataTable` while preserving existing CRUD modals, toasts, and optimistic updates.
- Centralise box list retrieval through the new `boxesService` for clearer separation between list fetching and CRUD operations (`box.service`).
- Maintain the current user experience and behaviour (Arabic labels, filters, modal flows, optimistic UI).

## Current State Review
- `page.tsx` fetches data via `genericService.getTableData("boxes_list")`, relying on implicit branch params and returning raw arrays with no pagination/search awareness.
- `BoxesClient` handles searching, pagination, table markup, and CRUD controls directly with HeroUI components; filtering is client-side only and decoupled from URL state.
- Optimistic updates for create/update/delete rely on local component state and `boxService` (distinct from the new `boxesService`).
- No shared query param handling or cache tags comparable to invoices/items pages.

## Target Architecture
1. **Server Component (page.tsx)**
   - Async server component that awaits `searchParams` (`Promise<Record<string, string | string[] | undefined>>`) similar to `ItemsPage`.
   - Parse `page`, `search`, and any future filters into a typed `GetBoxesPageParams`.
   - Fetch branch context via `getBranchParams`, fall back to company `1`.
   - Call `boxesService.getBoxes({ xcom_id: companyId, ...parsed filters })`; if the API lacks server-side search, retain full list fetch and document client-side filtering.
   - Derive pagination metadata; if API lacks page slicing, compute totals locally while preparing for future backend pagination.
   - Pass data, query meta, and filter defaults to an updated client component.

2. **Client Component (BoxesClient)**
   - Refactor to consume `AppDataTable` for display, mirroring column definitions approach in `ItemsClient` / `InvoiceClient`.
   - Move search input, filters, and action buttons into a dedicated header section consistent with other pages.
   - Use URL-driven state: when search/filter changes, trigger `Router.push` with updated query params (leveraging `useRouter` / `useSearchParams` like other clients).
   - Retain existing modal logic for add/edit/delete, but adapt list refresh to call a callback (e.g., `onRefresh`) that revalidates via server action or triggers data refetch through `router.refresh()`.
   - Ensure optimistic updates still work; when finalising, sync with server data by calling `boxesService.getBoxes` or `router.refresh` to avoid drift.

3. **Service Layer**
   - Confirm `boxesService.getBoxes` attaches cache tags (`["boxes", \`boxes-company-${companyId}\`]`) and handles both direct arrays and `{ results: [] }` payloads.
   - Keep CRUD-related calls inside `boxService` to avoid regressions; optionally wrap them under a `boxesCrudService` alias for clarity during refactor.

4. **Filtering & Pagination Pattern**
   - Emulate `ItemsPage` query handling: default to page `1`, normalise search to empty string, consider future filters (`status`, `type`) with typed constants if the API supports them.
   - Provide a shared `PAGE_SIZE` constant if we implement client-side pagination until backend support exists.
   - Integrate `AppPagination` in the server-rendered page after `BoxesClient`, relying on derived `totalPages`.

## Implementation Steps
1. **Preparation**
   - Catalogue all props used by `BoxesClient` so the refactored interface maintains required data (boxes list, metadata, modal defaults).
   - Audit `AppDataTable` column requirements and define a `columns` config for boxes similar to items/invoices.
2. **Server Page Update**
   - Update `page.tsx` signature to accept `searchParams`.
   - Introduce helper utilities for parsing query params (e.g., `parseSearchParam`, `parsePageParam`) shared with other pages if available.
   - Fetch branch/company, call `boxesService.getBoxes`, compute counts, and handle failure states (return empty list + error message).
   - Pass structured props to `BoxesClient` (`boxes`, `currentPage`, `query`, `totalPages`, `totalBoxes`, `companyId`, `error`).
3. **Client Component Refactor**
   - Replace direct HeroUI table usage with `AppDataTable`, mapping columns to existing table headers.
   - Extract filter/search UI into a header similar to `InvoicesHeader` / `ItemsClient` filter section.
   - Implement URL-driven search by invoking `router.push`/`replace` with updated query params.
   - After CRUD operations, trigger `router.refresh()` and optionally maintain optimistic updates until the server data reloads.
   - Ensure error toasts/messages remain intact.
4. **Testing & Validation**
   - Manually verify table renders identically, with Arabic labels preserved.
   - Confirm search updates URL and persists after reload.
   - Validate modals still open, create/update/delete operations behave as before, and data syncs after refresh.
   - Check cache revalidation via `revalidateTableData("boxes_list")` still functions or update to use new route tags.
   - Smoke test across different branch selections if available.

## Risks & Mitigations
- **API limitations (no backend pagination/search):** Document in code comments and design the client to gracefully handle full-list fetch with local filtering until the API evolves.
- **Duplicate services (`boxService` vs `boxesService`):** Clearly separate responsibilities or consolidate after ensuring CRUD and list use-cases remain covered.
- **Regressions in modal workflows:** Keep existing component structure where possible and validate optimistic updates carefully.

## Follow-up Opportunities
- Merge `box.service.ts` legacy CRUD service into a modernised version once the table refactor is stable.
- Add Zod schemas for box payloads to harden form validation consistent with other modules.
- Introduce unit/integration tests (when a framework is adopted) to cover list rendering and CRUD flows.
