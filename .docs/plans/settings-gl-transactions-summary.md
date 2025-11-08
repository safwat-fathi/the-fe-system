# Plan: Inline totals in GL transactions table

## Summary
- The settings page “جميع القيود المحاسبية” should no longer display the “إجمالي السجلات” text.
- Totals need to appear directly inside the table, under each amount column, with a single header row spanning from the “#” column through “الحساب” to label the totals.

## Proposed Changes
1. Remove the text showing record count from the header section.
2. Add an extra footer row to the table: create a table-wide header cell (covering columns `#` through `الحساب`) labeled “الإجماليات”، and place totals for `debit_base`, `credit_base`, `g_debit_base`, and `g_credit_base` in their respective columns beneath it.
3. Compute totals using `useMemo` (if not already) and style the footer row subtly (smaller text, bold numbers) to align with the table design.

## Validation
- Manual: reload the settings page, confirm the header no longer shows “إجمالي السجلات”، and verify totals render under each amount column with the combined header.
- Regression: ensure table still supports viewing vouchers without layout issues.

