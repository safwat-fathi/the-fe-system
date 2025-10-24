# NafeesWeb Gold System

## التكوين والإعداد

### متغيرات البيئة المطلوبة

قبل تشغيل النظام، يجب إنشاء ملف `.env.local` في المجلد الرئيسي للمشروع مع المتغيرات التالية:

```env
# API Configuration (مطلوب)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Gold Price API (اختياري)
NEXT_PUBLIC_API_GOLD_PRICE=
```

#### شرح المتغيرات:

1. **NEXT_PUBLIC_API_BASE_URL** (مطلوب):
   - عنوان URL الأساسي لـ API الخاص بالنظام
   - مثال: `http://localhost:8000/api` أو `https://api.yourserver.com`

2. **NEXT_PUBLIC_API_GOLD_PRICE** (اختياري):
   - رابط API للحصول على سعر الذهب الحالي
   - يمكن استخدام خدمات مثل:
     - goldapi.io
     - metalpriceapi.com
   - مثال: `https://api.metalpriceapi.com/v1/latest?api_key=YOUR_KEY&base=XAU&currencies=SAR`
   - إذا لم يتم تعيينه، سيعرض النظام "-" بدلاً من سعر الذهب

### خطوات التشغيل

1. انسخ ملف `.env.example` إلى `.env.local` (أو أنشئ ملف `.env.local` جديد)
2. قم بتعديل القيم حسب إعداداتك
3. شغّل الأمر `npm run dev` لتشغيل النظام في بيئة التطوير

## التحديثات الأخيرة

## Overview

NafeesWeb Gold System is a business management application that provides end-to-end solutions for gold trading businesses. The system includes modules for managing customers, items, invoices, accounting, and comprehensive reporting with analytics.

## Features

### Gold Management

- **Customer Management**: Track customers and their details
- **Item Management**: Manage gold items with detailed specifications
- **Categories & Units**: Organize items by categories and measurement units
- **Gold Price Tracking**: Monitor gold prices for accurate calculations

### Invoice Processing

- **Purchase Invoices**: Process gold purchases from suppliers
- **Sales Invoices**: Create sales invoices for customers
- **Return Invoices**: Handle purchase and sales returns
- **Detailed Calculations**: Automatic calculation of weights, prices, and taxes

### Accounting System

- **General Ledger**: Track all financial transactions
- **Cost Centers**: Organize expenses by departments or locations
- **Cash Boxes**: Manage cash flow across different boxes
- **Currencies**: Support for multi-currency operations
- **Journal Vouchers**: Record accounting entries

### Reporting & Analytics

- **Invoice Reports**: Detailed reports with filtering options
- **VAT Reports**: Tax compliance reporting
- **Financial Reports**: Comprehensive accounting reports
- **Dashboard Analytics**: Visualized KPIs and trends

### Dashboard

- **Key Metrics**: Real-time statistics on invoices, customers, and items
- **Sales Charts**: Monthly sales visualization
- **Performance Indicators**: Track business performance

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Components**: HeroUI
- **State Management**: Zustand
- **Data Fetching**: Next.js Server Components & React Server Actions
- **Charts**: Chart.js with React wrapper
- **Icons**: Heroicons
- **Animations**: Framer Motion

## Architecture

### Project Structure

```
├── app/
│   ├── (pages)/
│   │   ├── basic/            # Basic data management (customers, items, etc.)
│   │   ├── components/       # Shared UI components
│   │   ├── forms/            # Data entry forms
│   │   ├── reports/          # Data reports and analytics
│   │   ├── settings/         # System settings
│   │   ├── layout.tsx        # Main layout
│   │   └── page.tsx          # Dashboard
│   ├── actions/              # Server actions
│   ├── auth/                 # Authentication components
│   ├── users/                # User management
│   ├── error.tsx
│   ├── global-error.tsx
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   └── providers.tsx
├── components/               # Reusable UI components
├── services/                 # API service layer
│   ├── api/                  # API service implementations
│   ├── base/                 # Base service classes
│   └── bff/                  # Backend for frontend services
├── types/                    # TypeScript type definitions
├── utilities/                # Helper functions and utilities
├── public/                   # Static assets
└── ...
```

### Key Architectural Patterns

1. **Server Components for Data Fetching**: Initial data loading happens in server components to optimize performance and reduce client-side JavaScript.

2. **Service Layer**: API interactions are abstracted through service classes that handle error handling, caching, and request/response transformations.

3. **Client Components for Interactivity**: Interactive UI elements are implemented as client components that manage local state.

4. **Component Reusability**: Common UI patterns are abstracted into reusable components.

5. **Type Safety**: Comprehensive TypeScript interfaces define data contracts throughout the application.

## Code Examples

### Server Component with Data Fetching

```tsx
export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<GetAllInvoicesParams>;
}) {
  const queryParams = await searchParams;
  console.log("Query params:", queryParams);

  const invoices = await invoiceService.getAllInvoices(queryParams);
  const count = invoices?.count || 0;
  const itemsPerPage = 20;
  const totalPages = count > 0 ? Math.ceil(count / itemsPerPage) : 0;

  return (
    <div className="font-cairo space-y-4 p-4">
      <InvoicesHeader />
      <InvoiceClient totalInvoices={count} invoices={invoices?.results ?? []} />
      <AppPagination total={totalPages} />
    </div>
  );
}
```

### Client Component with State Management

```tsx
export default function InvoiceClient({
  invoices,
  totalInvoices,
}: InvoiceClientProps) {
  const { params, setParams } = useQueryParams<{
    xinv_id: string;
    xfrom_date: string;
    xto_date: string;
    xtrans_type: string;
    page: string;
  }>(["xinv_id", "xfrom_date", "xto_date", "xtrans_type", "page"], {
    defaultValues: {
      xinv_id: "",
      xfrom_date: "",
      xto_date: "",
      xtrans_type: "",
      page: "1",
    },
    schema: {
      xinv_id: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "",
      },
      // ... other parameters
    },
    pushMode: "replace",
    refreshOnChange: true,
    debounce: 350,
  });

  const [searchQ, setSearchQ] = useState(params.xinv_id || "");
  const [activeTab, setActiveTab] = useState("table");

  // Define columns with rendering functions
  const columns = [
    { key: "inv_id", label: "رقم الفاتورة", sortable: true },
    {
      key: "inv_date", 
      label: "التاريخ والوقت",
      sortable: true,
      render: (value: string) => formatDateTime(value),
    },
    // ... other columns
  ];

  return (
    <>
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              placeholder="البحث بالرقم أو الاسم..."
              value={searchQ}
              onChange={(e) => {
                setSearchQ(e.target.value);
                setParams({ xinv_id: e.target.value, page: "1" });
              }}
            />
            {/* ... other filter inputs */}
          </div>
        </CardBody>
      </Card>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <Tab key="table" title="قائمة الفواتير">
          <DataTable
            columns={columns}
            data={invoices}
            title={`قائمة الفواتير (${totalInvoices} فاتورة)`}
          />
        </Tab>
        <Tab key="analytics" title="التحليلات">
          <InvoiceAnalytics invoices={invoices} />
        </Tab>
      </Tabs>
    </>
  );
}
```

### Service Layer Implementation

```ts
class InvoiceService extends HttpService<Invoice> {
  async getAllInvoices(
    params?: GetAllInvoicesParams,
  ): Promise<IPaginatedResponse<Invoice> | null> {
    try {
      const queryParams = {
        page: params?.page || "1",
        xcom_id: params?.xcom_id || "0",
        xyear_id: params?.xyear_id || "0",
        // ... other parameters
      };

      const cacheTags = this.generateInvoiceCacheTags(params);

      const response = await this.get<IPaginatedResponse<Invoice>>(
        "invoices_list/",
        queryParams,
        {
          cache: "force-cache",
          signal: AbortSignal.timeout(30000),
          next: { tags: cacheTags },
        },
      );

      if (response.success) {
        return response.data as IPaginatedResponse<Invoice>;
      }

      return null;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات الفواتير");
    }
  }

  private generateInvoiceCacheTags(params?: GetAllInvoicesParams): string[] {
    // Implementation for generating cache tags based on parameters
    const baseTags = ["invoices"];
    // ... add specific tags based on parameters
    return tags;
  }
}

export default new InvoiceService();
```

## Best Practices Implemented

### 1. App Router Organization

- Use meaningful folder conventions (e.g., `(pages)` for main content areas)
- Separate layout and page components clearly
- Implement nested layouts for consistent UI patterns

### 2. Component Architecture

- Separate client and server components clearly
- Use client components for interactive UI elements
- Use server components for data fetching and initial rendering
- Create reusable UI components in a dedicated components directory

### 3. Data Fetching Strategy

- Use server components for initial data loading to improve performance
- Implement proper error handling and loading states
- Use Next.js cache strategies (`force-cache`, revalidate) appropriately
- Implement caching with cache tags for efficient invalidation

### 4. Service Layer Pattern

- Create dedicated service classes for API interactions
- Handle errors consistently across services
- Implement proper TypeScript interfaces for API responses
- Use environment variables for API endpoints

### 5. Type Safety

- Define TypeScript interfaces for all data models
- Use enums for constants and status values
- Implement proper typing for API parameters and responses
- Create custom hooks for reusable logic

### 6. State Management

- Use client components for local component state
- Implement global state management with Zustand when needed
- Use custom hooks for shared logic and state management

### 7. Internationalization (i18n)

- Support multiple languages, especially RTL for Arabic
- Use proper font families for Arabic text (e.g., Cairo font)
- Implement proper text alignment and direction

### 8. UI/UX Patterns

- Use consistent UI components from design systems (HeroUI in this case)
- Implement responsive design for various screen sizes
- Provide loading states and skeleton screens for better UX
- Use proper accessibility attributes

### 9. Code Organization

- Use absolute imports with path aliases (`@/*`)
- Group related files in feature-based directories
- Separate business logic from presentation logic
- Create reusable utility functions

### 10. Performance Optimization

- Leverage Next.js built-in optimizations (Image, Link, etc.)
- Implement proper pagination for large datasets
- Use virtualization for large lists
- Optimize API calls with proper caching strategies

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm 

### Installation

1. Clone the repository:

```bash
git clone git@github.com:majedalabdali2024/NafeesWeb.git
cd NafeesWeb
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (create `.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_API_GOLD_PRICE=
NEXT_PUBLIC_GOLD_API_TOKEN=
NEXT_PUBLIC_ACCESS_TOKEN=
NEXT_PUBLIC_REFRESH_TOKEN=
NEXT_PUBLIC_CSRF_COOKIE_NAME=
SESSION_SECRET=
CSRF_SECRET=
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Fix linting issues
- `npm run type-check` - Check TypeScript types
- `npm run format` - Format code with Prettier
