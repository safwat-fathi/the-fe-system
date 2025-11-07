# Fix AccountFormClient Select children typing error

## Summary

The Select in `app/(pages)/basic/accounts/components/AccountFormClient.tsx` for choosing the parent account mixed a static `SelectItem` with a mapped list. This caused a TypeScript error:

> Type 'Element[]' is not assignable to type 'CollectionElement<object>'.

This happens because the Select from `@heroui/react` expects its children to be a single `CollectionElement` or a render function via the `items` prop, not a heterogeneous array combining a single node and a mapped array.

## Plan

1. Replace mixed children with `items` + render-prop pattern.
2. Include the "no parent" option as the first element of the `items` array.
3. Keep `selectedKeys` as strings; parse selected key to `number | null` on change.
4. Do not touch other Selects to keep changes minimal and focused.

## Implementation Notes

- Create `parentSelectItems` via `useMemo`, merging:
  - `{ id: "null", label: "حساب رئيسي (بدون أب)" }`
  - The computed `parentOptions` mapped to `{ id: String(option.id), label: option.label }`
- Update the Select to:
  - Provide `items={parentSelectItems}`
  - Use render-prop: `{(item) => <SelectItem key={item.id}>{item.label}</SelectItem>}`
  - Handle `onSelectionChange` by converting `"null"` to `null`, otherwise `Number(key)`

## Alternatives Considered

- Prepend a synthetic option to `parentOptions` and continue mapping directly. Rejected due to the same typing friction when combining array literals with mapped arrays under Select’s `CollectionElement` typing.
- Wrap all children in a container and coerce types. Rejected as brittle and against library patterns.

## Validation

- Local lint shows only formatting/order warnings unrelated to the type error.
- The change preserves existing `selectedKeys` behavior and value parsing.

## Ask

- Approve keeping this focused fix. If desired, I can:
  - Run Prettier/eslint `--fix` on the file to resolve style warnings.
  - Apply the same `items` pattern to other Selects for consistency.

