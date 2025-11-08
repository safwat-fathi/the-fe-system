# Plan: Show category accounts in detail pages

## Summary
- Category detail and edit pages currently display only the core category fields.
- Users need to see (and, in edit mode, modify) the linked account mappings alongside the category data.
- We already have account form logic inside `CategoriesClient`; we can reuse similar state handling for the detail form.

## Proposed Changes
1. Update `CategoryDetailPage` to fetch the category’s account mapping (ensuring it exists) together with account lookup data, then pass both to `CategoryFormClient`.
2. Extend `CategoryFormClient` to receive the initial account record and accounts list, hydrate account form state, and render the mapping section in both view and edit modes.
3. When saving in edit mode, persist category changes as before and call `saveCategoryAccountAction` with the updated account payload; keep disabled/read-only rendering in view mode.

## Validation
- Manual: open `/basic/categories/[id]` in view mode to verify the account table renders with values; switch to edit mode (`?mode=edit`) and confirm account selectors appear and saving updates both category and account mapping.
- Regression: ensure the main categories table workflow continues to save account mappings without duplication.

