# Plan: Equalize cash voucher header fields

## Summary
- The cash receipt/payment form places the main header inputs (reference, datetime, status, type, cost center) in a 12-column grid with uneven spans, producing mismatched widths.
- The user wants these five inputs to share the row evenly, similar to the updated adjustment voucher layout.

## Proposed Changes
1. Update the header grid in `CashReceiptVoucherClientPage` to use `md:grid-cols-5`, ensuring each field spans a single column on medium screens and above.
2. Adjust each input wrapper to `md:col-span-1`, preserving full-width stacking on small screens.

## Validation
- Manually view both receipt (`vouchType=1`) and payment (`vouchType=2`) vouchers to confirm the five fields render on one row with equal widths on desktop and stack correctly on mobile.

