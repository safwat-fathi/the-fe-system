import Link from "next/link";
import { cookies } from "next/headers";
import { StatCard } from "@/components/Card";
import DashboardClient from "./dashboard-client";
import dashboardService from "@/services/bff/dashboard.service";

export default async function DashboardPage() {
  // Get branch and year from localStorage (now using cookies as a fallback)
  const cookieStore = await cookies();
  const branch = cookieStore.get("selectedBranch")?.value || "";
  const year = cookieStore.get("selectedYear")?.value || "";

  // Fetch dashboard data on the server
  let dashboardData = {
    invoiceCount: 0,
    customerCount: 0,
    itemCount: 0,
    categoryCount: 0,
    goldPrice: null as number | null,
    monthlySales: [] as number[],
  };

  try {
    dashboardData = await dashboardService.getDashboardStats();
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // We'll still render the page but with default values
  }

  // Fill in missing monthly sales data with zeros
  const monthlySales = dashboardData.monthlySales.length === 12 
    ? dashboardData.monthlySales 
    : new Array(12).fill(0);

  const salesChartData = {
    labels: [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
    ],
    datasets: [
      {
        label: "المبيعات",
        data: monthlySales,
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
          value={dashboardData.invoiceCount} 
          href="/dashboard/reports/invoices" 
        />
        <StatCard 
          title="العملاء" 
          icon="👥" 
          value={dashboardData.customerCount} 
          href="/dashboard/basic/customers" 
        />
        <StatCard 
          title="الأصناف" 
          icon="📦" 
          value={dashboardData.itemCount} 
          href="/dashboard/basic/items" 
        />
        <StatCard 
          title="الفئات" 
          icon="🏷️" 
          value={dashboardData.categoryCount} 
          href="/dashboard/basic/categories" 
        />
      </div>

      {/* Gold Price Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard 
          title="سعر الذهب للجرام" 
          icon="💰" 
          value={dashboardData.goldPrice ? `${dashboardData.goldPrice} ﷼` : "-"} 
        />
      </div>

      {/* Pass data to client component for interactive charts */}
      <DashboardClient 
        salesChartData={salesChartData}
        branch={branch}
        year={year}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Link 
          href="/dashboard/forms/invoices/Gold_invoice2?new=true"
          className="btn-primary"
        >
          فاتورة جديدة
        </Link>
        <Link 
          href="/dashboard/reports/invoices"
          className="btn-secondary"
        >
          قائمة الفواتير
        </Link>
      </div>
    </div>
  );
}
