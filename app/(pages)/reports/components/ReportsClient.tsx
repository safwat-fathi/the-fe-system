"use client";

import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CalculatorIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";
import { Button, Card, CardBody, Input } from "@heroui/react";
import Link from "next/link";
import { useState, useMemo } from "react";

type Report = {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  category: "financial" | "operational" | "sales" | "tax";
};

// فقط التقارير المتاحة
const reports: Report[] = [
  // التقارير المالية
  {
    id: "vouchers",
    name: "تقرير السندات",
    href: "/reports/vouchers",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    category: "financial",
  },
  {
    id: "account-statement",
    name: "كشف حساب",
    href: "/reports/account-statement",
    icon: <CalculatorIcon className="h-5 w-5" />,
    category: "financial",
  },
  {
    id: "income-statement",
    name: "قائمة الدخل",
    href: "/reports/income-statement",
    icon: <CalculatorIcon className="h-5 w-5" />,
    category: "financial",
  },
  {
    id: "trial-balance",
    name: "ميزان المراجعة",
    href: "/reports/trial-balance",
    icon: <CalculatorIcon className="h-5 w-5" />,
    category: "financial",
  },
  {
    id: "balance-sheet",
    name: "الميزانية العمومية",
    href: "/reports/balance-sheet",
    icon: <ChartBarIcon className="h-5 w-5" />,
    category: "financial",
  },
  {
    id: "journal-ledger",
    name: "دفتر القيود",
    href: "/reports/journal-ledger",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    category: "financial",
  },
  {
    id: "general-ledger",
    name: "دفتر الأستاذ",
    href: "/reports/general-ledger",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    category: "financial",
  },
  // التقارير التشغيلية
  {
    id: "invoices",
    name: "قائمة الفواتير",
    href: "/reports/invoices",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    category: "operational",
  },
  // التقارير الضريبية
  {
    id: "tax-declaration",
    name: "نموذج الإقرار الضريبي",
    href: "/reports/vat",
    icon: <ReceiptPercentIcon className="h-5 w-5" />,
    category: "tax",
  },
  {
    id: "tax-daily-journal",
    name: "دفتر اليومية الضريبية",
    href: "/reports/tax/daily-journal",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    category: "tax",
  },
];

const categoryConfig = {
  financial: {
    title: "التقارير المالية",
    icon: <CurrencyDollarIcon className="h-6 w-6" />,
  },
  operational: {
    title: "التقارير التشغيلية",
    icon: <DocumentTextIcon className="h-6 w-6" />,
  },
  sales: {
    title: "التقارير البيعية",
    icon: <ChartBarIcon className="h-6 w-6" />,
  },
  tax: {
    title: "التقارير الضريبية",
    icon: <ReceiptPercentIcon className="h-6 w-6" />,
  },
};

export default function ReportsClient() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) {
      return reports;
    }

    const term = searchTerm.toLowerCase().trim();
    return reports.filter((report) =>
      report.name.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const categorizedReports = useMemo(() => {
    const financial = filteredReports.filter((r) => r.category === "financial");
    const operational = filteredReports.filter(
      (r) => r.category === "operational"
    );
    const sales = filteredReports.filter((r) => r.category === "sales");
    const tax = filteredReports.filter((r) => r.category === "tax");

    return { financial, operational, sales, tax };
  }, [filteredReports]);

  const handleReset = () => {
    setSearchTerm("");
  };

  const renderReportItem = (report: Report) => {
    return (
      <Link
        key={report.id}
        href={report.href}
        className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md hover:bg-gray-50 transition-all duration-200 group"
      >
        <div className="text-gray-500 group-hover:text-gray-700 flex-shrink-0 transition-colors duration-200">
          {report.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
            {report.name}
          </p>
        </div>
      </Link>
    );
  };

  const renderCategoryColumn = (
    category: keyof typeof categoryConfig,
    categoryReports: Report[]
  ) => {
    if (categoryReports.length === 0) {
      return null;
    }

    const config = categoryConfig[category];

    return (
      <div className="flex flex-col h-full group/category border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
        {/* Category Header */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-b border-gray-200 p-4">
          <div className="flex items-center justify-center gap-3">
            <div className="flex-shrink-0 text-gray-600 group-hover/category:text-gray-700 transition-colors duration-300">
              {config.icon}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">{config.title}</h2>
          </div>
        </div>

        {/* Reports List */}
        <div className="flex-1 p-4 space-y-2 min-h-[200px] bg-white">
          {categoryReports.map(renderReportItem)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">التقارير</h1>
          <p className="text-gray-500 mt-1">
            جميع التقارير المتاحة في النظام
          </p>
        </div>

        {/* Search and Reset */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            placeholder="البحث حسب الاسم"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            className="flex-1 sm:min-w-[300px]"
            size="md"
            variant="bordered"
          />
          <Button
            isIconOnly
            variant="bordered"
            onPress={handleReset}
            className="border-gray-300"
            aria-label="إعادة تعيين"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categorizedReports.financial.length > 0 &&
          renderCategoryColumn("financial", categorizedReports.financial)}
        {categorizedReports.operational.length > 0 &&
          renderCategoryColumn("operational", categorizedReports.operational)}
        {categorizedReports.sales.length > 0 &&
          renderCategoryColumn("sales", categorizedReports.sales)}
        {categorizedReports.tax.length > 0 &&
          renderCategoryColumn("tax", categorizedReports.tax)}
      </div>
    </div>
  );
}
