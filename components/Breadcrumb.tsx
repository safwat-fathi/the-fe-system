"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

// Mapping for better Arabic names
const pathNameMap: Record<string, string> = {
  reports: "تقارير",
  "account-statement": "كشف حساب",
  vouchers: "تقرير السندات",
  "income-statement": "قائمة الدخل",
  "trial-balance": "ميزان المراجعة",
  "balance-sheet": "الميزانية العمومية",
  "journal-ledger": "دفتر القيود",
  "general-ledger": "دفتر الأستاذ",
  invoices: "قائمة الفواتير",
  vat: "تقرير الضريبة",
  tax: "التقارير الضريبية",
  "daily-journal": "دفتر اليومية الضريبية",
  basic: "القوائم الأساسية",
  accounts: "الحسابات",
  customers: "العملاء",
  items: "الأصناف",
  forms: "النماذج",
  settings: "الإعدادات",
};

const Breadcrumb = ({ items = [], showHome = true, className }: BreadcrumbProps) => {
  const pathname = usePathname();

  // Generate breadcrumbs from the current pathname if no items are provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items.length > 0) return items;

    const pathSegments = pathname.split("/").filter((segment) => segment);

    return pathSegments.map((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/");
      // Use mapped name if available, otherwise capitalize
      const name = pathNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      return {
        name,
        href: index < pathSegments.length - 1 ? href : undefined, // No link for current page
      };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0 && !showHome) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={clsx("flex items-center mb-4 text-sm text-gray-600", className)}
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse flex-wrap">
        {showHome && (
          <li className="inline-flex items-center">
            <Link
              className="inline-flex items-center font-medium text-gray-700 hover:text-blue-600 transition-colors"
              href="/"
            >
              الرئيسية
            </Link>
          </li>
        )}

        {breadcrumbs.map((item, index) => (
          <li
            key={index}
            aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
            className="inline-flex items-center"
          >
            <div className="flex items-center">
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2 rtl:rotate-180" />
              {item.href ? (
                <Link
                  className="font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  href={item.href}
                >
                  {item.name}
                </Link>
              ) : (
                <span className="font-medium text-gray-500">
                  {item.name}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
