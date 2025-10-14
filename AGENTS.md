# AGENTS.md             

This file provides guidelines for AI agents and coding assistants when working with code in this repository

## Project overview

This project is an ERP solution for gold vendors and gold dealers to manage their business.

## Voucher Types (أنواع القيود والسندات)

The system uses different voucher types identified by `vouch_type`:

- **0** = قيد افتتاحي (Opening Entry)
- **1** = سند قبض (Receipt Voucher)
- **2** = سند صرف (Payment Voucher)
- **3** = قيد تسوية (Adjustment/Journal Entry)

**Important Notes:**
- Each voucher type has its own numbering sequence
- When generating a new voucher number, always filter by `vouch_type` to get the correct sequence
- Example: For adjustment vouchers (type 3), find max `vouch_id` where `vouch_type === 3`, then add 1

**System Parameters:**
- Company/Branch (`com`) = **1** (fixed)
- Year for reading (`xyear_id` in query params) = **0** (all years)
- Year for writing (`year` in request body) = **1** (fixed)

**Vouchers API Parameters:**
```
GET /api/vouchers_list?xcom_id=1&xyear_id=0&xvouch_type=0&xvouch_id=0&xfrom_date=0&xto_date=0&page=1
```
- `xcom_id`: Company/Branch (1 = fixed)
- `xyear_id`: Year (0 = all years)
- `xvouch_type`: Voucher type (0 = all, 1 = receipt, 2 = payment, 3 = adjustment)
- `xvouch_id`: Specific voucher ID (0 = all)
- `xfrom_date`: From date (0 = all)
- `xto_date`: To date (0 = all)
- `page`: Page number for pagination 

## Project structure

- `app` contains pages and specific pages components
- `(pages)` protected routes are accessible only by authenticated users
- `auth` contains authentication pages and components
- `components` contains shared components
- `styles` contains global styles
- `utilities` contains shared utility functions
- `app/actions` contains server actions
- `middlewares` contains middlewares to be stacked on top of the Next.js middleware stack
- `types` contains types and global models definitions
- `services` contains API services and utilities logic 
	- `services/api` contains API services
	- `services/base` contains main HTTPService logic
	- `services/bff` contains BFF services (composed API services in a single service)

## Commands

- `npm run dev`: starts the development server
- `npm run build`: builds the production version
- `npm run start`: starts the production server
- `npm run lint`: runs eslint and prettier on the codebase
- `npm run prettier —write path/to/file.tsx` for single file format instead of formatting the whole project
- `npx eslint path/to/file.tsx` to lint a single file instead of building / linting the whole project

## Key technologies

- Next.js
- TypeScript
- React
- TailwindCSS
- Zod
- HeroUI 
- NPM for package management

## Testing

No testing framework is used in this project.

## Patterns and best practices

### Building React components

- Use the same as `auth/login/components/LoginForm` 
- Do not use `React.FC` for functional components instead use `const MyComponent = ({ props }: MyComponentProps) => <div>...</div>`
- Shared components between pages should be defined in `components` directory

### Building pages

- Use the same as `auth/login` and `reports/invoices` pages
- Use server-side components for page components
- Use latest practices for page architecture from Next.js v15 Example:

``` javascript
export const metadata: Metadata = {
	title: 'NafeesWeb App',
	description: 'NafeesWeb Application',
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<GetAllInvoicesParams>;
}) {
	const queryParams = await searchParams;

	return <div>...</div>
}
```

### Styling

- Use TailwindCSS for styling
- Do not use inline styles you can use `clsx` for combining string `classNames` with conditional ones  

### Typing 

- Wherever is possible use object defined as const instead of enums
- Use types instead of interfaces when possible

### Page Architecture

- Use the same as `auth/login` and `reports/invoices` pages
- Use server-side components for page components
- Fetch data on page level then pass it down to client components as props if needed

### State Management

- Do not use React Context API for state management instead use Zustand if needed

### Forms

- Use the same as `auth/login` 
- Use Server Actions for form submissions and Zod schema for validations along with CSRF token for security as hidden input

### Data Fetching

- Use the same as `reports/invoices` page
- Do not fetch data on client side
- Build a dedicated service as in `services/api/invoice.service.ts` and always use it to fetch data
- Define models for API responses
- For complex and composed queries use the same as `services/bff/dashboard.service.ts`
- Cache API responses on the server side for better performance
- For paginated responses use the same as `services/api/invoice.service.ts` service and `reports/invoices` page that depends on query params updates
- For single page responses use the same as `reports/invoices/[id]` page and return `notFound()` if fetch fails

### API Endpoints Standards

**Important Rules for API Endpoints:**

1. **No Trailing Slash**: All API endpoints should be defined **WITHOUT** a trailing slash `/`
   ```typescript
   ✅ CORRECT: "customers_list"
   ✅ CORRECT: "invoices_list"
   ✅ CORRECT: "categories_list"
   
   ❌ WRONG: "customers_list/"
   ❌ WRONG: "invoices_list/"
   ❌ WRONG: "categories_list/"
   ```

2. **Year Parameter Usage**: The `xyear_id` parameter should **ONLY** be used for transaction screens (حركات), not for master data lists (قوائم أساسية)

   **Screens that REQUIRE `xyear_id`** (Transaction Screens):
   - `invoices_list` - Invoices
   - `vouchers_list` - Vouchers/Journal Entries
   - `receipts_list` - Receipt Vouchers
   - `payments_list` - Payment Vouchers
   - Any other transaction-based screens

   **Screens that should NOT include `xyear_id`** (Master Data Lists):
   - `customers_list` - Customers
   - `items_list` - Items
   - `categories_list` - Categories
   - `units_list` - Units
   - `boxes_list` - Boxes
   - `accounts_list` - Accounts
   - `cost_centers_list` - Cost Centers
   - `currencies_list` - Currencies
   - `cust_type_list` - Customer Types
   - `users_list` - Users
   - Any other master data screens

   **Example Configuration in `generic.service.ts`:**
   ```typescript
   // ✅ Master Data (NO year parameter)
   customers_list: {
     endpoint: "customers_list",
     paramTransform: (params) => ({
       xcom_id: params.com || "1",
       xcust_type: params.xcust_type || "0",
     }),
   },
   
   // ✅ Transaction Data (WITH year parameter)
   invoices_list: {
     endpoint: "invoices_list",
     paramTransform: (params) => ({
       xcom_id: "1",
       xyear_id: params.xyear_id || "0",  // Required for transactions
       xinv_type: "0",
     }),
   },
   ```

3. **Service Implementation**: When creating new services in `services/api/`, ensure endpoints follow these standards
   ```typescript
   // Example in helper.service.ts
   async getCategories(): Promise<Category[]> {
     // ✅ Correct: no trailing slash
     const response = await this.get<Category[]>("categories_list", undefined, {
       cache: "no-store",
       next: { tags: ["categories"] },
     });
   }
   ```

### Auth

- Use the same as `auth/login`
- Credentials stored in Cookies 
- Cookies available in server-side only

## Security considerations

- Never store sensitive data in client-side storage
- Store session data server-side
- Use secure session cookies with httpOnly, secure, and sameSite flags
- Validate all user inputs on both client and server side
- Sanitize file uploads and implement size/type restrictions
- Encrypt sensitive data at rest (PII, financial data, credentials)
- Use environment variables for encryption keys
- Do not expose sensitive data in error messages

## Global Guidelines

- Wherever is possible use object defined as const instead of enums Example: 

``` javascript
// Payment Types
export const PAYMENT_TYPES = {
  GOLD: 1,
  WAGE: 2,
  BOTH: 3,
} as const;
```

- For repeated & reusable strings store as constants Example: 

``` javascript
export const STORAGE_KEYS = {
  ACCESS_TOKEN: process.env.NEXT_PUBLIC_ACCESS_TOKEN || "",
  REFRESH_TOKEN: process.env.NEXT_PUBLIC_REFRESH_TOKEN || "",
  CSRF_TOKEN: process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME || "",
  SESSION: "session",
  USER_DATA: "user_data",
  THEME: "theme",
} as const;
```

- Don’t import React just import what you need from its named exports
- Check already built components inside project before building / using external one
- The app is intended for Arabic language users
- Make sure to use context7 mcp if it’s present to get latest documentations for a new feature, page or component 
- For any feature that requires using 3rd party code or building a custom one check React available ready-to-use code first. For example instead of building a custom useDebounce hook you can use `useDeferredValue` React hook.
- This is an ERP application do not focus on SEO optimization methodologies 
- Shared types, global models (`User`, `Invoice`, `Customer`, etc…) should be defined in types die
