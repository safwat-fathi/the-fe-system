"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

const Breadcrumb = ({ items = [] }: BreadcrumbProps) => {
  const pathname = usePathname();

  // Generate breadcrumbs from the current pathname if no items are provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items.length > 0) return items;

    const pathSegments = pathname.split("/").filter((segment) => segment);

    return pathSegments.map((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/");
      const name = segment.charAt(0).toUpperCase() + segment.slice(1);

      return {
        name,
        href: index < pathSegments.length - 1 ? href : undefined, // No link for current page
      };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex mb-4">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        <li className="inline-flex items-center">
          <Link
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
            href="/"
          >
            الرئيسية
          </Link>
        </li>

        {breadcrumbs.map((item, index) => (
          <li
            key={index}
            aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
          >
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              {item.href ? (
                <Link
                  className="text-sm font-medium text-gray-700 hover:text-primary-600"
                  href={item.href}
                >
                  {item.name}
                </Link>
              ) : (
                <span className="text-sm font-medium text-gray-500">
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
