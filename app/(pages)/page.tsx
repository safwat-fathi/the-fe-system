import { cookies } from "next/headers";
import { Metadata } from "next";

import DashboardClient from "./components/DashboardClient";

import { StatCard } from "@/components/Card";
import dashboardService from "@/services/bff/dashboard.service";

// meta data
export const metadata: Metadata = {
  title: "الرئيسية",
};

// Revalidate dashboard data every 60 seconds (1 minute)
export const revalidate = 60;

export default async function DashboardPage() {
  // Get branch and year from localStorage (now using cookies as a fallback)
  const cookieStore = await cookies();

  const branch = cookieStore.get("selectedBranch")?.value || "";
  const year = cookieStore.get("selectedYear")?.value || "";

  const dashboardData = await dashboardService.getDashboardStats();

  if (!dashboardData) throw new Error("حدث خطأ في جلب البيانات");

  // Fill in missing monthly sales data with zeros
  // const monthlySales =
  //   dashboardData.monthlySales.length === 12
  //     ? dashboardData.monthlySales
  //     : new Array(12).fill(0);

  const salesChartData = {
    labels: [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ],
    datasets: [
      {
        label: "المبيعات",
        // data: monthlySales,
        fill: false,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="font-cairo space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">لوحة التحكم</h1>
        <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg inline-block">
          فرع: {branch || "-"} | السنة: {year || "-"}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          href="/reports/invoices"
          icon="🧾"
          title="الفواتير"
          value={dashboardData.invoices?.count || 0}
        />
        <StatCard
          href="/basic/customers"
          icon="👥"
          title="العملاء"
          value={dashboardData.customerCount}
        />
        <StatCard
          href="/basic/items"
          icon="📦"
          title="الأصناف"
          value={dashboardData.itemCount}
        />
        <StatCard
          href="/basic/categories"
          icon="🏷️"
          title="الفئات"
          value={dashboardData.categoryCount}
        />
      </div>

      {/* Gold Price Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard
          icon="💰"
          title="سعر الذهب للجرام"
          value={dashboardData.goldPrice ? `${dashboardData.goldPrice} ﷼` : "-"}
        />
      </div>

      {/* Pass data to client component for interactive charts */}

      <DashboardClient
        branch={branch}
        invoices={dashboardData.invoices?.results || []}
        salesChartData={salesChartData}
        year={year}
      />
    </div>
  );
}
