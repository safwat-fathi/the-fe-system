# InvoiceItemTable — Add new row on Tab at end

## Summary

Enable power users to keep typing without leaving the keyboard: when the user tabs through an invoice row and reaches the last input of the last row, pressing `Tab` again should add a new row and focus its first field (the item selector).

## Current behavior (observed)

- Component: `components/InvoiceItemTable.tsx`.
- Navigation helper `handleEnter` handles the `Enter` key to move to the first cell in the next row; if on the last row, it adds a row and focuses the first cell.
- All inputs/selects register `onKeyDown={(e) => handleEnter(e, index, col)}` but only `Enter` is handled.
- Refs: `inputRefs.current[row][col]` track focusable cells per row; first cell is the async creatable select.
- Delete button has `tabIndex={-1}`, so the last focusable cell is the item description input.

## Goal behavior

- If the user presses `Tab` on the last focusable input in the last row (and not holding `Shift`), prevent default, add a new row, and focus the first input of the new row.
- In all other cases, default browser `Tab` behavior continues (including `Shift+Tab`).

## Implementation plan

1. Extend `handleEnter` to also handle `Tab`:
   - Detect `e.key === 'Tab' && !e.shiftKey`.
   - Compute `isLastRow = rowIndex === invoiceItems.length - 1`.
   - Compute `isLastCol` from `inputRefs.current[rowIndex]`: treat the last non-undefined entry as the last column index.
   - If both true, `e.preventDefault()`, call `addRow()`, then `setTimeout` focus `inputRefs.current[rowIndex + 1][0]` (mirroring the existing `Enter` behavior).
2. Keep existing `Enter` key behavior unchanged.
3. Do not interfere with `Shift+Tab` or intermediate `Tab` navigation; allow default.

## Notes / edge cases

- The first input (item selector) is a `react-select` component; the ref exposes `.focus()` which matches current focusing strategy.
- Inputs are disabled when `!isEditing`, so this behavior implicitly applies only in edit mode.
- Timeout focus (100ms) mirrors current pattern used for `Enter` handling to allow row render + ref assignment.

## Files touched

- `components/InvoiceItemTable.tsx`

## Rollback

- Revert the `Tab` branch in `handleEnter` if needed.

