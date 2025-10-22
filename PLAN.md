# Invoice Creation Flow Update Plan

## Goal
Align the invoice creation workflow with the Postman collection contract:
1. Fetch the next invoice number from `api_max_inv_id` (incremented by one).
2. Create the invoice via `api_create_invoice` using that `inv_id`.
3. Create each invoice detail via `api_create_invoice_dtl`, passing the `id` returned by step 2 as the `inv` value.

## Current State
- `hooks/useInvoiceForm.ts#getNextInvoiceNumber` derives the next invoice number by loading the entire invoices list and taking the max `inv_id`.
- `InvoiceService.createInvoice` directly posts whatever `inv_id` the caller provides.
- Detail rows already accept an `invoicePrimaryKey` and forward it as `inv`, but the fallback logic refetches invoices if `savedInvoice.id` is missing.
- No dedicated service/action exists for `api_max_inv_id`.

## Proposed Flow
```
getNextInvoiceIdAction(transType) --> InvoiceService.getNextInvoiceId()
                                     --> GET api_max_inv_id?xcom_id=1&xtrans_type={transType}
                                     --> parse { max_inv_id } + 1
saveInvoice():
  const invId = await getNextInvoiceIdAction(defaultTransType)
  createInvoiceAction({ ...payload, inv_id: invId })
  const invoicePk = response.id
  for each detail -> createInvoiceDetailAction({ ...detail, inv: invoicePk })
```

## Implementation Steps
1. **Types**
   - Introduce a dedicated type for the `api_max_inv_id` response (`types/models/invoice.ts`).
   - Ensure numeric fields are parsed safely (handle string numeric responses).

2. **Service Layer**
   - Add `getNextInvoiceId` to `InvoiceService` hitting `api_max_inv_id`.
   - Reuse `HttpService` helpers, disable caching, and guard against non-success responses.

3. **Server Actions**
   - Create `getNextInvoiceIdAction` in `app/actions/invoice.ts` delegating to the new service method.
   - Mirror existing logging/error-handling style.

4. **Hook Updates (`hooks/useInvoiceForm.ts`)**
   - Replace current `getNextInvoiceNumber` logic with the new action (pass `defaultTransType`).
   - Inject the fetched `inv_id` into the invoice payload for new invoices.
   - Simplify fallback logic for resolving `invoicePk` (prefer the create response `id`).

5. **Detail Creation Flow**
   - Continue using `mapRowToApiPayload` with the authoritative invoice PK from the create response.
   - Ensure detail creation waits for invoice creation before iteration.

6. **Error Handling & UX**
   - Show user-friendly toasts if fetching the next invoice id fails (e.g., "تعذر الحصول على رقم فاتورة جديد").
   - Abort the save flow on sequence API errors to avoid partial data.

7. **Validation Checklist**
   - Save a new invoice and confirm logs show `inv_id` equals fetched max + 1.
   - Verify detail payloads contain `inv: <invoice_pk_from_response>`.
   - Validate failure scenarios (missing max id, network error) surface actionable messages.

## Open Questions / Assumptions
- `api_max_inv_id` response shape (assumed to include a numeric max). Adjust parsing once verified.
- Whether `xcom_id` should remain hardcoded to `1` or be driven by context.
- Backend behaviour when detail creation fails (assume current approach is acceptable).

## Next Steps
- Implement in order: types → service → action → hook → validation.
