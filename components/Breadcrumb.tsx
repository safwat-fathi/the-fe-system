"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { MouseEvent, ReactNode } from "react";

export interface BreadcrumbItem {
  name: string;
  href?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLSpanElement>) => void;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

// Mapping for better Arabic names
const pathNameMap: Record<string, string> = {
  // Main sections
  reports: "تقارير",
  forms: "النماذج",
  basic: "القوائم الأساسية",
  settings: "الإعدادات",
  
  // Reports
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
  "sales-invoices": "فواتير المبيعات",
  "purchase-invoices": "فواتير المشتريات",
  "credit-notes": "إشعارات دائنة",
  "debit-notes": "إشعارات مدينة",
  
  // Forms - Vouchers
  voucher: "القيود",
  voucher1: "سند قبض",
  voucher2: "سند صرف",
  gvoucher4: "سند قبض عميل",
  gvoucher5: "سند صرف عميل",
  receipt: "سند استلام",
  delivery: "سند تسليم",
  balance: "قيد افتتاحي",
  
  // Basic
  accounts: "الحسابات",
  customers: "العملاء",
  items: "الأصناف",
  boxes: "الصناديق",
  units: "الوحدات",
  categories: "الفئات",
  currencies: "العملات",
  "cost-centers": "مراكز التكلفة",
  "cust_type": "أنواع العملاء",
  
  // Settings
  permissions: "الصلاحيات",
  "gl-transactions": "القيود المحاسبية",
  taxes: "الضرائب",
  integrations: "التكاملات",
  
  // Actions
  new: "جديدة",
  edit: "تعديل",
  preview: "معاينة",
  payment: "دفع",
};

const Breadcrumb = ({
  items = [],
  showHome = true,
  className,
}: BreadcrumbProps) => {
  const pathname = usePathname();

  // Generate breadcrumbs from the current pathname if no items are provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items.length > 0) return items;

    const pathSegments = pathname.split("/").filter((segment) => segment);
    
    // Filter out "basic" and "forms" segments - they should not appear in breadcrumbs
    // The pages under them should appear directly after "الرئيسية"
    const segmentsToShow = pathSegments.filter(
      (segment) => segment !== "basic" && segment !== "forms"
    );
    
    // Build hrefs based on original segments but names based on filtered segments
    return segmentsToShow.map((segment, filteredIndex) => {
      // Find the actual index in original segments
      const actualIndex = pathSegments.indexOf(segment);
      const href = "/" + pathSegments.slice(0, actualIndex + 1).join("/");
      
      // Handle dynamic segments (like [id])
      // If segment is a number, it's likely an ID - use parent segment name
      let name: string;
      
      if (!isNaN(Number(segment)) && filteredIndex > 0) {
        // This is a dynamic ID segment, use parent name with ID
        const parentSegment = segmentsToShow[filteredIndex - 1];
        const parentName = pathNameMap[parentSegment] || parentSegment;
        name = `${parentName} #${segment}`;
      } else {
        // Use mapped name if available, otherwise capitalize
        name =
          pathNameMap[segment] ||
          segment.charAt(0).toUpperCase() + segment.slice(1);
      }

      return {
        name,
        href: filteredIndex < segmentsToShow.length - 1 ? href : undefined, // No link for current page
      };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0 && !showHome) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={clsx(
        "flex items-center pt-3 pb-1 mb-2 text-xs text-gray-600",
        className,
      )}
    >
      <ol className="inline-flex items-center space-x-0.5 md:space-x-1 rtl:space-x-reverse flex-wrap">
        {showHome && (
          <li className="inline-flex items-center">
            <Link
              className="inline-flex items-center font-medium text-gray-700 hover:text-blue-600 transition-colors leading-none"
              href="/"
            >
              الرئيسية
            </Link>
          </li>
        )}

        {breadcrumbs.map((item, index) => {
          // تحديد إذا كان النص يحتوي على "عرض" أو "تعديل"
          const name = item.name;
          const hasView = name.includes("عرض");
          const hasEdit = name.includes("تعديل");
          
          // استخراج الكلمة والبقية من النص
          let renderName: React.ReactNode = name;
          
          if (hasView || hasEdit) {
            const parts: React.ReactNode[] = [];
            let remainingText = name;
            
            if (hasView) {
              const viewIndex = remainingText.indexOf("عرض");
              if (viewIndex !== -1) {
                // إضافة النص قبل "عرض"
                if (viewIndex > 0) {
                  parts.push(remainingText.substring(0, viewIndex));
                }
                // إضافة "عرض" باللون الأزرق
                parts.push(
                  <span key="view" className="text-blue-600 font-semibold">
                    عرض
                  </span>
                );
                // البقية بعد "عرض"
                remainingText = remainingText.substring(viewIndex + 3);
              }
            } else if (hasEdit) {
              const editIndex = remainingText.indexOf("تعديل");
              if (editIndex !== -1) {
                // إضافة النص قبل "تعديل"
                if (editIndex > 0) {
                  parts.push(remainingText.substring(0, editIndex));
                }
                // إضافة "تعديل" باللون الأصفر
                parts.push(
                  <span key="edit" className="text-yellow-600 font-semibold">
                    تعديل
                  </span>
                );
                // البقية بعد "تعديل"
                remainingText = remainingText.substring(editIndex + 5);
              }
            }
            
            // إضافة البقية إذا كان هناك نص متبقي
            if (remainingText) {
              parts.push(remainingText);
            }
            
            renderName = <>{parts}</>;
          }
          
          return (
            <li
              key={index}
              aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
              className="inline-flex items-center"
            >
              <div className="flex items-center">
                <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2 rtl:rotate-180" />
                {item.href ? (
                  <Link
                    className="font-medium text-gray-700 hover:text-blue-600 transition-colors leading-none"
                    href={item.href}
                    onClick={item.onClick}
                  >
                    {renderName}
                  </Link>
                ) : item.onClick ? (
                  <button
                    type="button"
                    className="font-medium text-gray-700 hover:text-blue-600 transition-colors leading-none"
                    onClick={item.onClick}
                  >
                    {renderName}
                  </button>
                ) : (
                  <span className="font-medium text-gray-500 leading-none">{renderName}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
