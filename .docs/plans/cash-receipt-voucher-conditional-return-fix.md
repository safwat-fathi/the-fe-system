# Plan: Fix client-only guard in cash receipt voucher page

## Summary
- The Turbopack build fails because the non-client guard in `CashReceiptVoucherClientPage` returns multiple adjacent JSX siblings (loader `div` plus additional markup), creating invalid syntax in the server component.
- The loader block should remain as a simple single root element; any additional markup belongs in the main render branch.

## Proposed Changes
1. Update the `if (!isClient)` early return to render only the loading container (single JSX node) and move the comment/notes markup back into the main component body.
2. Ensure the main render path still includes the "Notes" field and related controls in the appropriate location.

## Validation
- Run `npm run build` (or rely on Turbopack hot reload) to confirm the parsing error is resolved.
- Spot-check the page in the browser to verify the notes field renders in the correct location for the client view.


