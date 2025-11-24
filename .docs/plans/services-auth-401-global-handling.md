# Services – Global Auth 401 Handling

## Context

- `HttpService._request` (`services/base/http.service.ts`) now throws `AuthenticationError` on HTTP 401 and rethrows it from the catch block so callers can handle redirects.
- Some services built on top of `HttpService` still:
  - Wrap calls in `try/catch` and convert *all* errors into generic `Error("حدث خطأ ...")` messages.
  - Use `.catch(() => fallback)` in `Promise.all` and other compositions.
- This means `AuthenticationError` can still be swallowed in many places, preventing page-level redirect logic (like the dashboard page’s `redirect` on `AuthenticationError`) from triggering.
- We already fixed this specifically for:
  - `services/api/invoice.service.ts` (`getAllInvoices`) and
  - `services/bff/dashboard.service.ts` (the dashboard BFF),
  but other API/BFF services remain inconsistent.

## Goals

- Make `AuthenticationError` handling **consistent across all API and BFF services**.
- Ensure that:
  - Any 401 from the backend that becomes an `AuthenticationError` is not turned into a generic error or silently swallowed.
  - `AuthenticationError` can bubble up to page-level or Server Action boundaries where redirects are performed.
- Keep non-auth error handling and existing Arabic error messages unchanged where possible.

## Proposed Approach

### 1. Introduce a Small Helper for Auth Error Rethrow

**File:**
- `utilities/errors/Authentication.ts`

**Changes:**
- Add a utility function:

```ts
export const rethrowAuthenticationError = (error: unknown): void => {
  if (error instanceof AuthenticationError) {
    throw error;
  }
};
```

**Reasoning:**
- Avoid duplicating `if (error instanceof AuthenticationError) throw error;` in every `catch`.
- Keep the pattern explicit and easy to apply across services.

### 2. Update API Services to Use the Helper in catch Blocks

**Scope:**
- All classes extending `HttpService` under `services/api`, e.g.:
  - `account.service.ts`
  - `auth.service.ts` (for non-login flows that rely on tokens)
  - `box.service.ts`, `boxes.service.ts`
  - `cat-account.service.ts`
  - `category.service.ts`
  - `cost-center.service.ts`
  - `currency.service.ts`
  - `customer.service.ts`, `customer-type.service.ts`
  - `generic.service.ts`
  - `gl-audit-log.service.ts`
  - `home.service.ts`
  - `invoice.service.ts` (already partially updated)
  - `item.service.ts`
  - `menu.service.ts`
  - `permission.service.ts`
  - `tax.service.ts`, `tax-rate.service.ts`
  - `user.service.ts`, `user-company.service.ts`, `user-cost-center.service.ts`
  - `voucher.service.ts`

**Pattern:**
- For each `try/catch` that wraps `HttpService` calls:

```ts
} catch (error) {
  console.error("Error fetching X:", error);
  rethrowAuthenticationError(error);
  throw new Error("حدث خطأ ...");
}
```

- For places that currently do not log, keep the existing behavior and just insert the helper call at the top of the `catch`:

```ts
} catch (error) {
  rethrowAuthenticationError(error);
  // existing generic handling...
}
```

**Outcome:**
- Any `AuthenticationError` from the underlying HTTP layer is preserved.
- All other errors remain handled as they are today.

### 3. Update BFF Services to Avoid Swallowing AuthenticationError in .catch(...)

**Files:**
- `services/bff/dashboard.service.ts` (already partially updated)
- `services/bff/sidebar-data.service.ts`
- `services/bff/invoice-form-data.service.ts`

**Changes:**
- For each `.catch(() => fallback)` on promises that ultimately call API services:
  - Change the handler to inspect the error:

```ts
.catch((error) => {
  if (error instanceof AuthenticationError) {
    throw error;
  }
  return fallbackValue;
});
```

**Outcome:**
- BFF services still provide graceful fallbacks for non-auth errors.
- `AuthenticationError` consistently bubbles up to the page or Server Action layer.

### 4. Verify Page-Level Behavior Remains Correct

**Files to spot-check:**
- `app/[locale]/(pages)/page.tsx` (dashboard)
- Other pages that perform server-side data fetching with these BFF/API services (e.g. reports, basic entities).

**Checks:**
- Confirm that these pages:
  - Either catch `AuthenticationError` and `redirect` (for high-level flows like the dashboard), or
  - Allow it to bubble to a global error boundary if that’s the intended behavior.
- Ensure that no pages are unexpectedly catching generic `Error` and masking `AuthenticationError` after this change.

## Implementation Steps

1. Add `rethrowAuthenticationError` helper to `utilities/errors/Authentication.ts`.
2. Sweep `services/api` for `catch (error)` blocks and:
   - Import `rethrowAuthenticationError`.
   - Call it at the top of each catch before existing logic.
3. Sweep `services/bff` `.catch(...)` handlers:
   - Ensure any catch rethrows `AuthenticationError` instead of swallowing it.
4. Manually verify:
   - Dashboard with expired token redirects to login.
   - A couple of other protected pages (e.g. invoices, items) behave similarly on 401.

---

If you approve this plan, I will implement the helper and update all relevant API/BFF services so that `AuthenticationError` handling is consistent and global.

