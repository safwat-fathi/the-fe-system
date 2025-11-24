# HTTP Service – Auth 401 Handling Improvements

## Context

- `HttpService._request` (`services/base/http.service.ts`) calls the backend API and currently:
  - Logs detailed error information for non-OK responses.
  - On `401` status, calls `_clearTokens()` and, if running in the browser, attempts `window.location.href = "/auth/login"`.
- `_clearTokens` previously called `onLogoutAction` (`app/actions/auth.ts`), which:
  - Mutates cookies via `cookies()` and performs a `redirect`.
  - Is a Server Action and therefore **cannot** be called from arbitrary server-side code like `HttpService`.
- Calling `onLogoutAction` from `HttpService` caused:
  - `Error: Cookies can only be modified in a Server Action or Route Handler.`
  - That error was caught and swallowed inside `_clearTokens`, meaning:
    - No cookies are cleared.
    - No redirect occurs for server-side requests.
- Authentication middleware (`middlewares/auth.middleware.ts`) only runs on incoming Next.js route requests; it is **not** invoked for internal `fetch` calls to the backend API.
- The failing call in your error stack comes from `DashboardService.getDashboardStats()` (`services/bff/dashboard.service.ts`) which is used on the dashboard page (`app/[locale]/(pages)/page.tsx`), i.e. a server component that fetches data on the server.

## Goals

- Ensure that when the backend returns `401` due to an expired/invalid token:
  - The user is reliably redirected to the login page.
  - We do not violate Next.js constraints around cookie mutation.
  - The behavior is consistent between server-side data fetches and client-side calls.
- Keep the authentication middleware as the primary guard for protected routes, using it in combination with service-level error signaling instead of bypassing it.

## Proposed Changes

### 1. Change HttpService 401 Handling to Signal Auth Errors

**Files:**
- `services/base/http.service.ts`

**Changes:**
- In `_request`:
  - For `response.status === 401`:
    - Stop attempting to redirect directly (no `window.location.href` here).
    - Stop calling `onLogoutAction` (keep `_clearTokens` as a lightweight helper only if needed).
    - Instead, throw a typed `AuthenticationError` (already imported from `@/utilities/errors/Authentication`) with a clear message (e.g., `"Session expired"` or extracted from the response body).
  - Ensure the top-level `catch` block distinguishes `AuthenticationError`:
    - Either rethrow it so callers can handle it explicitly, or
    - Return a structured `ServiceResponse` including an `errors`/`message` field that callers can inspect.
- Keep `_clearTokens` as a no-op or minimal logger for now to avoid cookie mutations from non-Server-Action contexts.

**Outcome:**
- Any 401 from the backend is surfaced as an `AuthenticationError` (or a clear `ServiceResponse` state) instead of silently returning `{ success: false }` without redirecting.

### 2. Handle AuthenticationError at Server Boundaries with Redirects

**Files (initial focus):**
- `services/bff/dashboard.service.ts`
- `app/[locale]/(pages)/page.tsx`

**Changes:**
- Update `DashboardService.getDashboardStats` to:
  - Allow `AuthenticationError` to bubble up (don’t catch it in the `.catch(() => ...)` branches that currently swallow other errors).
  - Optionally narrow the `try/catch` so that only non-auth errors are transformed into user-facing messages.
- In `DashboardPage` (`app/[locale]/(pages)/page.tsx`):
  - Wrap `dashboardService.getDashboardStats()` in a `try/catch`.
  - If the caught error is an `AuthenticationError`:
    - Use `redirect` from `next/navigation` to send the user to the login page (e.g. `/${locale}/auth/login` or preserve redirect query).  
    - Do **not** attempt to mutate cookies here (pages can’t safely call `cookies().set` either).
  - For other errors, keep the existing behavior (`throw new Error(t("error"));` or a similar pattern).

**Outcome:**
- When the dashboard load hits a 401 from the backend:
  - The server component throws/handles `AuthenticationError`.
  - The user is redirected to the login page from a safe Next.js context.
- Cookies remain as-is, but:
  - Auth middleware (`auth.middleware.ts`) still checks token validity on subsequent navigations (using `isTokenValid`), so expired tokens will not allow access even if the cookie remains.

### 3. (Optional / Future) Centralize Logout + Cookie Clearing via Server Action or API Route

**Files (future work, not part of this immediate change unless requested):**
- `app/actions/logout.ts` (already present)
- Potential API route e.g. `app/api/auth/logout/route.ts`
- Caller pages/components

**Idea:**
- Define a single, dedicated logout pathway that:
  - Is implemented as a Server Action (`onLogoutAction`) or Route Handler.
  - Clears cookies and redirects to login.
- From UI (buttons, menu items), call this Server Action directly.
- For backend 401s:
  - Either:
    - Redirect to a dedicated “session expired” page that invokes the logout Server Action on mount, or
    - Have the page redirect directly to login and rely on middleware + token expiry to prevent access.

**Outcome:**
- Clear separation of concerns:
  - Service layer only signals auth failure.
  - Server Actions / Route Handlers perform cookie mutations and redirects.

### 4. Consistency and Safety Checks

After implementing the above:

- Review other services that use `HttpService` to ensure:
  - They either handle `AuthenticationError` at the page/server boundary, or
  - It’s acceptable for them to bubble the error up to Next.js error boundaries.
- Confirm that `auth.middleware.ts` continues to enforce:
  - Redirect to login when token is missing or `isTokenValid` returns false.
  - Proper handling of `redirect` query parameter for post-login navigation.
- Manually test:
  - Expired token scenario on the dashboard.
  - Navigation to other protected routes with an expired token.

## Implementation Steps

1. Update `HttpService._request` 401 handling to throw `AuthenticationError` instead of trying to redirect or call `onLogoutAction`.
2. Adjust `DashboardService.getDashboardStats` to allow `AuthenticationError` to propagate and not be swallowed by generic `catch` blocks.
3. Update `DashboardPage` (`app/[locale]/(pages)/page.tsx`) to catch `AuthenticationError` and use `redirect` to the login page.
4. Manually verify dashboard + another protected route with an expired token to ensure redirects and middleware behavior are consistent.

---

If you approve this plan, I will implement the steps above and keep the changes minimal and focused on auth/401 handling.

