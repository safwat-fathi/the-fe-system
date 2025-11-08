# Plan: Auto-create missing category account records

## Summary
- Currently `getCategoryAccountsAction` returns an empty array when a category has no mapping in `cat_acc_list`, leaving `CategoriesClient` with no `accountRecordId`.
- Saving from the client invokes the create endpoint, but the upstream API rejects it because the category record does not exist yet in the table.
- Users expect the system to automatically provision a blank record when they switch to a new category so that subsequent edits persist normally.

## Proposed Changes
1. Introduce a server-side helper (e.g., `ensureCategoryAccountAction`) that checks for an existing record and, if absent, calls `createCategoryAccount` with default null fields.
2. Update `loadCategoryAccounts` in `CategoriesClient` to invoke the new helper when `getCategoryAccountsAction` returns no record, hydrate the form state with the ensured record, and store its `id`.
3. Propagate the ensured record back into the client snapshot to keep dirty-state logic stable and avoid redundant creations.

## Validation
- Manual: select a category that previously had no account mapping, verify the UI auto-populates with a blank record and allows saving new account values successfully.
- Regression: confirm categories with existing mappings continue to load and update without duplicate records.

