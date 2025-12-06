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
import { Button, Input } from "@heroui/react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";

type Report = {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  category: "financial" | "operational" | "sales" | "tax";
};

export default function ReportsClient() {
  const t = useTranslations("reports.main");
  const tVouchers = useTranslations("reports.vouchers");
  const [searchTerm, setSearchTerm] = useState("");

  // فقط التقارير المتاحة
  const reports: Report[] = useMemo(
    () => [
      // التقارير المالية
      {
        id: "vouchers",
        name: tVouchers("title"),
        href: "/reports/vouchers",
        icon: <DocumentTextIcon className="h-5 w-5" />,
        category: "financial",
      },
      {
        id: "account-statement",
        name: t("reports.accountStatement"),
        href: "/reports/account-statement",
        icon: <CalculatorIcon className="h-5 w-5" />,
        category: "financial",
      },
      {
        id: "income-statement",
        name: t("reports.incomeStatement"),
        href: "/reports/income-statement",
        icon: <CalculatorIcon className="h-5 w-5" />,
        category: "financial",
      },
      {
        id: "trial-balance",
        name: t("reports.trialBalance"),
        href: "/reports/trial-balance",
        icon: <CalculatorIcon className="h-5 w-5" />,
        category: "financial",
      },
      {
        id: "balance-sheet",
        name: t("reports.balanceSheet"),
        href: "/reports/balance-sheet",
        icon: <ChartBarIcon className="h-5 w-5" />,
        category: "financial",
      },
      {
        id: "journal-ledger",
        name: t("reports.journalLedger"),
        href: "/reports/journal-ledger",
        icon: <DocumentTextIcon className="h-5 w-5" />,
        category: "financial",
      },
      {
        id: "general-ledger",
        name: t("reports.generalLedger"),
        href: "/reports/general-ledger",
        icon: <DocumentTextIcon className="h-5 w-5" />,
        category: "financial",
      },
      // التقارير التشغيلية
      {
        id: "invoices",
        name: t("reports.invoices"),
        href: "/reports/invoices",
        icon: <DocumentTextIcon className="h-5 w-5" />,
        category: "operational",
      },
      // التقارير الضريبية
      {
        id: "tax-declaration",
        name: t("reports.taxDeclaration"),
        href: "/reports/vat",
        icon: <ReceiptPercentIcon className="h-5 w-5" />,
        category: "tax",
      },
      {
        id: "tax-daily-journal",
        name: t("reports.taxDailyJournal"),
        href: "/reports/tax/daily-journal",
        icon: <DocumentTextIcon className="h-5 w-5" />,
        category: "tax",
      },
    ],
    [t, tVouchers],
  );

  const categoryConfig = {
    financial: {
      title: t("categories.financial"),
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
    },
    operational: {
      title: t("categories.operational"),
      icon: <DocumentTextIcon className="h-6 w-6" />,
    },
    sales: {
      title: t("categories.sales"),
      icon: <ChartBarIcon className="h-6 w-6" />,
    },
    tax: {
      title: t("categories.tax"),
      icon: <ReceiptPercentIcon className="h-6 w-6" />,
    },
  };

  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) {
      return reports;
    }

    const term = searchTerm.toLowerCase().trim();

    return reports.filter((report) => report.name.toLowerCase().includes(term));
  }, [searchTerm, reports]);

  const categorizedReports = useMemo(() => {
    const financial = filteredReports.filter((r) => r.category === "financial");
    const operational = filteredReports.filter(
      (r) => r.category === "operational",
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
        className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-gray-200 hover:border-amber-400/40 hover:shadow-md hover:bg-gradient-to-r hover:from-amber-600/10 hover:to-amber-700/5 transition-all duration-200 group backdrop-blur-sm"
        href={report.href}
      >
        <div className="text-slate-500 group-hover:text-amber-600 flex-shrink-0 transition-colors duration-200">
          {report.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 group-hover:text-amber-700 transition-colors duration-200">
            {report.name}
          </p>
        </div>
      </Link>
    );
  };

  const renderCategoryColumn = (
    category: keyof typeof categoryConfig,
    categoryReports: Report[],
  ) => {
    if (categoryReports.length === 0) {
      return null;
    }

    const config = categoryConfig[category];

    return (
      <div className="flex flex-col h-full group/category border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
        {/* Category Header */}
        <div className="bg-gradient-to-br from-amber-50/80 via-amber-100/40 to-amber-50/60 border-b border-amber-200/50 p-4">
          <div className="flex items-center justify-center gap-3">
            <div className="flex-shrink-0 text-amber-600 group-hover/category:text-amber-700 transition-colors duration-300">
              {config.icon}
            </div>
            <h2 className="text-lg font-semibold text-amber-700">
              {config.title}
            </h2>
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
          <h1 className="text-3xl font-bold text-gray-800">{t("header")}</h1>
          <p className="text-gray-500 mt-1">{t("subheader")}</p>
        </div>

        {/* Search and Reset */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            className="flex-1 sm:min-w-[300px]"
            placeholder={t("search.placeholder")}
            size="md"
            startContent={
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            }
            value={searchTerm}
            variant="bordered"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            isIconOnly
            aria-label={t("search.reset")}
            className="border-gray-300"
            variant="bordered"
            onPress={handleReset}
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
