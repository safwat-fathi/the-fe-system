# AGENTS.md

This file provides guidelines for AI agents and coding assistants when working with code in this repository

## Project overview

NafeesWeb Gold System is a business management application that provides end-to-end solutions for gold trading businesses. The system includes modules for managing customers, items, invoices, accounting, and comprehensive reporting with analytics.

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
- `app/components/(pages)/Sidebar` contains app sidebar

## Commands

- `npm run dev`: starts the development server
- `npm run build`: builds the production version
- `npm run start`: starts the production server
- `npm run lint`: runs eslint and prettier on the codebase
- `npm run prettier —write path/to/file.tsx` for single file format instead of formatting the whole project
- `npx eslint path/to/file.tsx` to lint a single file instead of building / linting the whole project

## Key technologies

- Next.js v15
- TypeScript
- React
- TailwindCSS
- Zod
- HeroUI
- NPM for package management

## Testing

No testing framework is used in this project.

## Before any changes

- Propose a plan for the changes and get approval
- Ensure that the changes don't break existing functionality and logic
- Ensure that the changes don't introduce new bugs

## Patterns and best practices

### Building React components

- Use the same as `auth/login/components/LoginForm`
- Do not use `React.FC` for functional components instead use `const MyComponent = ({ props }: MyComponentProps) => <div>...</div>`
- Shared components between pages should be defined in `components` directory

### Building pages

- Use the same as `app/[locale]/(pages)/page.tsx`, `auth/login` and `reports/invoices` pages
- Use server-side components for page components
- Use latest practices for page architecture from Next.js v15 Example:
- Always fetch data on page level then pass it down to client components as props if needed
- Alwyas fetch data on try-catch block and use `notFound()` if fetch fails, If error error instanceof AuthenticationError then redirect to login page

```javascript
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

- Do not use React Context API for state management instead use Zustand for global, application-wide state.
- use `useReducer` for complex state management.

### Forms

- Use the same as `auth/login`
- Use Server Actions for form submissions and Zod schema for validations along with CSRF token for security as hidden input

### Data Fetching

- Use the same as `reports/invoices` page
- Do not fetch data on client side
- Build a dedicated service as in `services/api/invoice.service.ts` and always use it to fetch data
- All API services should be defined in `services/api` directory
- All API services should be inherited from `services/base/HTTPService`
- `access_token` and `refresh_token` stored in Cookies can be read in server-side only
- Define models for API responses
- For complex and composed queries use the same as `services/bff/dashboard.service.ts`
- Cache API responses on the server side for better performance
- For paginated responses use the same as `services/api/invoice.service.ts` service and `reports/invoices` page that depends on query params updates
- For single page responses use the same as `reports/invoices/[id]` page and return `notFound()` if fetch fails

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

```javascript
// Payment Types
export const PAYMENT_TYPES = {
  GOLD: 1,
  WAGE: 2,
  BOTH: 3,
} as const;
```

- For repeated & reusable strings store as constants Example:

```javascript
export const STORAGE_KEYS = {
  ACCESS_TOKEN: process.env.NEXT_PUBLIC_ACCESS_TOKEN || "",
  REFRESH_TOKEN: process.env.NEXT_PUBLIC_REFRESH_TOKEN || "",
  CSRF_TOKEN: process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME || "",
  SESSION: "session",
  USER_DATA: "user_data",
  THEME: "theme",
} as const;
```

- Use as const for static maps
- Check existing utilities before re-implementing
- Don’t import React just import what you need from its named exports
- Check already built components inside project before building / using external one
- The app is intended for Arabic language users
- Make sure to use context7 mcp if it’s present to get latest documentations for a new feature, page or component
- For any feature that requires using 3rd party code or building a custom one check React available ready-to-use code first. For example instead of building a custom useDebounce hook you can use `useDeferredValue` React hook.
- This is an ERP application do not focus on SEO optimization methodologies
- Shared types, global models (`User`, `Invoice`, `Customer`, etc…) should be defined in types die
- Use PascalCase for all React component file and component names (e.g., InvoiceForm.tsx, Sidebar.tsx).
- Prefer to read and summarize before editing.
- Never overwrite or remove large files without explicit user approval.
- user feedback messages should be localized.

## Allowed Without Prompt

- read and list files
- read and list directories
- run test commands

## Ask Before

- package installs and dependencies updates
- git push, pull, merge
- deleting files, chmod
- running full build

**Always run `npm run type-check` after any changes, If there are any errors, fix them first**

**Always read & summarize before proposing a clear plan and write your plan in a markdown file and then ask before implementation / committing.**

**Write your plan in a markdown file in `.docs/plans` directory in this format `resource_name-action-description.md` and then ask before implementation / committing.**
