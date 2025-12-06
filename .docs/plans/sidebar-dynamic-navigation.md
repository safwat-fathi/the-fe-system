# Sidebar Objects Integration Plan

## Summary

Sidebar navigation is currently built from static arrays in `sidebarConfig.tsx` with limited permission gating via `SIDEBAR_OBJECT_IDS`. We need to consume the `objects_list` response (see `objects-list.service.ts`) so that every section and link that renders in `index.tsx` is backed by an object id from the API sample shown in `objects.json`.

## Plan

1. **Normalize menu data**: Extend the layout/Sidebar contract so the client component receives the complete list of menu objects (not just IDs) fetched via `objectsListService`. Build utilities to organize parents/children and create a `Set` of available ids for quick lookups.
2. **Annotate sidebar config**: Refactor `sidebarConfig.tsx` (and related permission helpers) so each section and link declares the `objectId`(s) it depends on. Keep existing translation/icon metadata but ensure we can line them up with the ids from `objects_list` (see sample in `objects.json`).
3. **Render dynamically in `Sidebar`**: Replace the hardcoded rendering logic with one that iterates over the annotated config and only outputs sections/links whose required object ids exist in the API response. Handle the four parent objects (obj_parent = 0) as top-level sections and ensure child grouping matches their parent ids.
4. **Validation**: Run `npm run type-check` to guarantee the new types/config stay consistent and adjust any affected consumer typings.

Let me know if this approach matches your expectations before I start implementing the changes.
