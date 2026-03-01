"use client";

import type { HTMLAttributes, MouseEvent, ReactNode } from "react";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { Locale, locales } from "@/i18n/config";

export interface BreadcrumbItem {
  name: string;
  href?: string;
  /** When false, disables Next.js prefetch for this link (e.g. to avoid repeated GETs) */
  prefetch?: boolean;
  onClick?: (
    event: MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLSpanElement>,
  ) => void;
  segmentKey?: string;
}

type BreadcrumbProps = HTMLAttributes<HTMLBaseElement> & {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
};

const breadcrumbSegmentKeyMap = {
  // Main sections
  reports: "segments.reports",
  forms: "segments.forms",
  basic: "segments.basic",
  settings: "segments.settings",

  // Reports
  "account-statement": "segments.account-statement",
  vouchers: "segments.vouchers",
  "income-statement": "segments.income-statement",
  "trial-balance": "segments.trial-balance",
  "balance-sheet": "segments.balance-sheet",
  "journal-ledger": "segments.journal-ledger",
  "general-ledger": "segments.general-ledger",
  invoices: "segments.invoices",
  vat: "segments.vat",
  tax: "segments.tax",
  "daily-journal": "segments.daily-journal",
  "sales-invoices": "segments.sales-invoices",
  "purchase-invoices": "segments.purchase-invoices",
  "credit-notes": "segments.credit-notes",
  "debit-notes": "segments.debit-notes",

  // Forms - Vouchers
  voucher: "segments.voucher",
  voucher1: "segments.voucher1",
  voucher2: "segments.voucher2",
  gvoucher4: "segments.gvoucher4",
  gvoucher5: "segments.gvoucher5",
  receipt: "segments.receipt",
  delivery: "segments.delivery",
  balance: "segments.balance",

  // Basic
  accounts: "segments.accounts",
  customers: "segments.customers",
  items: "segments.items",
  boxes: "segments.boxes",
  units: "segments.units",
  categories: "segments.categories",
  currencies: "segments.currencies",
  "cost-centers": "segments.cost-centers",
  cust_type: "segments.cust_type",

  // Settings
  permissions: "segments.permissions",
  "gl-transactions": "segments.gl-transactions",
  taxes: "segments.taxes",
  integrations: "segments.integrations",

  // Actions
  new: "segments.new",
  edit: "segments.edit",
  preview: "segments.preview",
  payment: "segments.payment",
} as const;

type BreadcrumbSegmentKey = keyof typeof breadcrumbSegmentKeyMap;

const isBreadcrumbSegmentKey = (value: string): value is BreadcrumbSegmentKey =>
  Object.prototype.hasOwnProperty.call(breadcrumbSegmentKeyMap, value);

const highlightSegmentClassMap: Record<string, string> = {
  preview: "text-blue-600 font-semibold",
  edit: "text-yellow-600 font-semibold",
};

const formatSegmentFallback = (segment: string) =>
  segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const Breadcrumb = ({
  items = [],
  showHome = true,
  className,
}: BreadcrumbProps) => {
  const pathname = usePathname();
  const tBreadcrumbs = useTranslations("navigation.breadcrumbs");

  const getSegmentLabel = (segment: string) => {
    const fallback = formatSegmentFallback(segment);

    if (isBreadcrumbSegmentKey(segment)) {
      const translationKey = breadcrumbSegmentKeyMap[segment];

      return tBreadcrumbs(translationKey, { fallback });
    }

    return fallback;
  };

  // Generate breadcrumbs from the current pathname if no items are provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items.length > 0) return items;

    const allSegments = pathname.split("/").filter((segment) => segment);

    // Remove leading locale segment (e.g. "ar" or "en") if present
    const pathSegments =
      allSegments.length > 0 && locales.includes(allSegments[0] as Locale)
        ? allSegments.slice(1)
        : allSegments;

    // Filter out "basic" and "forms" segments - they should not appear in breadcrumbs
    // The pages under them should appear directly after "الرئيسية"
    const segmentsToShow = pathSegments.filter(
      (segment) => segment !== "basic" && segment !== "forms",
    );

    // Build hrefs based on original segments but names based on filtered segments
    return segmentsToShow.map((segment, filteredIndex) => {
      // Find the actual index in original segments (including locale if present)
      const actualIndex = allSegments.indexOf(segment);
      const href = "/" + allSegments.slice(0, actualIndex + 1).join("/");

      // Handle dynamic segments (like [id])
      // If segment is a number, it's likely an ID - use parent segment name
      let name: string;
      let segmentKey: string | undefined = segment;

      if (!isNaN(Number(segment)) && filteredIndex > 0) {
        // This is a dynamic ID segment, use parent name with ID
        const parentSegment = segmentsToShow[filteredIndex - 1];
        const parentName = getSegmentLabel(parentSegment);

        name = `${parentName} #${segment}`;
        segmentKey = undefined;
      } else {
        // Use mapped name if available, otherwise capitalize
        name = getSegmentLabel(segment);
      }

      return {
        name,
        href: filteredIndex < segmentsToShow.length - 1 ? href : undefined, // No link for current page
        segmentKey,
      };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0 && !showHome) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={clsx(
        "flex items-center pb-1 mb-2 text-xs text-gray-600",
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
              {tBreadcrumbs("home")}
            </Link>
          </li>
        )}

        {breadcrumbs.map((item, index) => {
          // Use segmentKey to generate name if name is empty
          const displayName =
            item.name ||
            (item.segmentKey ? getSegmentLabel(item.segmentKey) : "");
          let renderName: ReactNode = displayName;
          const highlightClass =
            (item.segmentKey && highlightSegmentClassMap[item.segmentKey]) ||
            undefined;

          if (highlightClass) {
            renderName = <span className={highlightClass}>{displayName}</span>;
          }

          let renderedContent: ReactNode;

          if (item.href) {
            renderedContent = (
              <Link
                className="font-medium text-gray-700 hover:text-blue-600 transition-colors leading-none"
                href={item.href}
                prefetch={item.prefetch !== false}
                onClick={item.onClick}
              >
                {renderName}
              </Link>
            );
          } else if (item.onClick) {
            renderedContent = (
              <button
                className="font-medium text-gray-700 hover:text-blue-600 transition-colors leading-none"
                type="button"
                onClick={item.onClick}
              >
                {renderName}
              </button>
            );
          } else {
            renderedContent = (
              <span className="font-medium text-gray-500 leading-none">
                {renderName}
              </span>
            );
          }

          return (
            <li
              key={index}
              aria-current={
                index === breadcrumbs.length - 1 ? "page" : undefined
              }
              className="inline-flex items-center"
            >
              <div className="flex items-center">
                <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2 rtl:rotate-180" />
                {renderedContent}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
