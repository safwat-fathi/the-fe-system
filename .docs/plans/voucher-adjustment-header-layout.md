# Plan: Align adjustment voucher header fields

## Summary
- In the adjustment voucher form, the top grid distributes inputs unevenly (mixed column spans like 2/2/1/2/3), so fields appear with different widths.
- The user wants the five primary fields (`رقم المرجع`, `تاريخ`, `حالة القيد`, `نوع القيد`, `مركز التكلفة`) to share the row evenly.

## Proposed Changes
1. Update the header grid in `VoucherClientPage` to use a five-column layout (`md:grid-cols-5`) for medium screens and up.
2. Set each field wrapper to span one column on desktop while keeping full-width stacking on mobile.

## Validation
- Manually open the adjustment voucher page, resize the viewport, and confirm the five fields render in a single row with equal widths on desktop and stack properly on mobile.

