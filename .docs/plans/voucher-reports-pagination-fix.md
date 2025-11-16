# Voucher Reports Pagination Fix Plan

## Context
- Voucher listing endpoint (`vouchers_list`) is paginated (default page size 25).
- The current reports UI counts only the first page, assuming results length equals total count, which undercounts vouchers beyond page 1.
- Need to ensure reports fetch and aggregate across all pages (or use API-provided metadata) so totals (count, sums) reflect the full dataset.

## Objectives
1. Update the report data-fetching logic to honor pagination, retrieving all relevant pages or using a server-side aggregation endpoint when available.
2. Ensure UI totals (number of vouchers, total amounts, etc.) reflect the true totals returned by the backend.
3. Maintain performance by minimizing redundant requests (e.g., leverage `count`, loop over pages sequentially, or request larger page size if supported).

## Tasks
1. **Investigate Current Fetching Flow**
   - Review report BFF/service (`services/bff` or direct API calls) to see how vouchers are loaded.
   - Identify where the first-page data is assumed to represent the entire dataset.

2. **Implement Pagination Handling**
   - Option A: Iterate over pages until all results are collected (respecting API limits).
   - Option B: If backend supports `page_size` parameter, request larger chunks or full export.
   - Option C: Introduce a dedicated BFF endpoint performing server-side aggregation.

3. **Update UI Aggregations**
   - Ensure totals use API `count` or aggregated sums from full dataset.
   - Remove assumptions tying `data.length` to total count.

4. **Testing**
   - Manual test with dataset > 25 vouchers to confirm totals and counts align with backend.
   - Verify pagination controls still navigate correctly.

## Risks & Mitigations
- **Risk:** Large datasets cause slow iteration when fetching all pages.  
  **Mitigation:** Consider server-side aggregation or adjustable page size.
- **Risk:** Changes to BFF may impact other consumers.  
  **Mitigation:** Update only voucher report flow; add unit coverage where possible.

## Next Steps
- Await approval to implement the above changes.


