# Plan: Localize invoice analytics tab

## Summary

- `components/InvoiceAnalytics.tsx` renders all labels and chart datasets with hard-coded Arabic text and arrays for months/days.
- Need to hook into `next-intl` so analytics tab respects active locale, requiring new translation keys.

## Steps

1. **Define translation keys**: List out every static label in `InvoiceAnalytics` (metric cards, chart titles, dataset labels, month/day names, helper labels) to avoid missing any UI strings.
2. **Extend locale messages**: Add a `reports.invoices.analytics` section to `messages/en.json` and `messages/ar.json` containing equivalents for the labels enumerated in Step 1, keeping nesting consistent (e.g., `stats.totalInvoices`, `charts.monthlySales`, `legends.invoiceCount`, arrays for months/days, etc.).
3. **Update component implementation**: Import `useTranslations` inside `InvoiceAnalytics`, derive translated strings/arrays from the new keys, and replace hard-coded Arabic text within cards, chart configs, and helper sections with translation-driven values while keeping memoization intact.
4. **Manual verification**: Re-check TypeScript builds or run targeted linting if feasible, and describe how to verify via UI (switch locales and confirm analytics tab content updates) before finalizing.
