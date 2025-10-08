import Link from "next/link";
import { cookies } from "next/headers";
import { StatCard } from "@/components/Card";
import { Metadata } from "next";
import dashboardService from "@/services/bff/dashboard.service";
import DashboardClient from "./components/DashboardClient";
import { notFound, redirect } from "next/navigation";
import { STORAGE_KEYS } from "@/constants";

// meta data
export const metadata: Metadata = {
  title: "الرئيسية",
};

export default async function DashboardPage() {
  try {
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
            title="الفواتير"
            icon="🧾"
            value={dashboardData.invoices?.count || 0}
            href="/reports/invoices"
          />
          <StatCard
            title="العملاء"
            icon="👥"
            value={dashboardData.customerCount}
            href="/basic/customers"
          />
          <StatCard
            title="الأصناف"
            icon="📦"
            value={dashboardData.itemCount}
            href="/basic/items"
          />
          <StatCard
            title="الفئات"
            icon="🏷️"
            value={dashboardData.categoryCount}
            href="/basic/categories"
          />
        </div>

        {/* Gold Price Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatCard
            title="سعر الذهب للجرام"
            icon="💰"
            value={
              dashboardData.goldPrice ? `${dashboardData.goldPrice} ﷼` : "-"
            }
          />
        </div>

        {/* Pass data to client component for interactive charts */}

        <DashboardClient
          salesChartData={salesChartData}
          invoices={dashboardData.invoices?.results || []}
          branch={branch}
          year={year}
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Link href="/forms/invoices/sale?new=true" className="btn-primary">
            فاتورة جديدة
          </Link>
          <Link href="/reports/invoices" className="btn-secondary">
            قائمة الفواتير
          </Link>
        </div>
      </div>
    );
  } catch (error) {
    console.error("********************************:", error);
    throw new Error("حدث خطاء في جلب البيانات");
  }
}
