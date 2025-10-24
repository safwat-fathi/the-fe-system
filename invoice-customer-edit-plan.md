# Invoice Edit Customer Experience Plan

## Goals

- Show the customer name (rather than only code) when loading an invoice in edit mode.
- Allow the user to change the customer whenever the page is opened with `edit=true`, with the customer selector fully populated.
 

## Planned Steps

1. **Audit Current Customer Inputs**  
   - Inspect how the edit page currently passes `cust_code` into the form and how `InvoiceSelectors` renders the customer select and details using that field.

2. **Provide Customer List via Existing Service**  
   - Ensure the edit page fetches customers using the same BFF/service call as the create path so the select is fully populated without extra logic.

3. **Use Invoice Payload Name/Code for Display**  
   - Update the form state/selector to set the selected customer using only `cust_code` / `cust_name` from the invoice payload when editing, so the label shows the name instead of just the code.

4. **Allow Customer Changes in Edit Mode**  
   - Confirm the customer selector stays enabled while `edit=true`, letting users pick another customer from the fetched list, and ensure the form state updates accordingly.

5. **Validation & Regression Check**  
   - Manually verify: invoice edit view shows the customer name, the dropdown lists all customers, and selecting another customer updates the associated fields as expected.

## Considerations

- Follow existing patterns (server-side data fetching, Tailwind styling, Arabic labels).
- Keep the selector responsive to payment method filters (cash vs credit) without losing the edited invoice’s customer entry.
- Avoid introducing client-side fetches per repository guidelines.
