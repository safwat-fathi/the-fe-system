"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { title } from "@/components/primitives";
import StatCard from "@/components/StatCard";
import { API_ENDPOINTS, fetchData, fetchGoldPrice } from "@/utilities/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Button, Input } from "@heroui/react";
import CountUp from "react-countup";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend);

export default function DashboardPage() {
  const [invoiceCount, setInvoiceCount] = useState<number | null>(null);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);
  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const [monthlySales, setMonthlySales] = useState<number[]>([]);
  const [branch, setBranch] = useState<string>("");
  const [year, setYear] = useState<string>("");

  const [invoices, setInvoices] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    setBranch(localStorage.getItem("selectedBranch") || "");
    setYear(localStorage.getItem("selectedYear") || "");

    const loadCounts = async () => {
      const invoicesData = await fetchData<any[]>(API_ENDPOINTS.INVOICES_LIST);
      const customers = await fetchData<any[]>(API_ENDPOINTS.CUSTOMERS_LIST);
      const categories = await fetchData<any[]>(API_ENDPOINTS.CATEGORIES_LIST);
      const itemsRes = await fetchData<any[]>(API_ENDPOINTS.GET_ITEMS_LIST);

      if (Array.isArray(invoicesData)) {
        setInvoices(invoicesData);
        setInvoiceCount(invoicesData.length);

        const monthly: number[] = new Array(12).fill(0);
        invoicesData.forEach((inv) => {
          const date = new Date(inv.inv_date);
          const month = date.getMonth();
          monthly[month] += parseFloat(inv.inv_amt ?? inv.inv_net ?? 0);
        });
        setMonthlySales(monthly);
      }

      if (Array.isArray(customers)) {
        setCustomerCount(customers.length);
      }

      if (Array.isArray(categories)) {
        setCategoryCount(categories.length);
      } else if (Array.isArray((categories as any)?.results)) {
        setCategoryCount((categories as any).results.length);
      }

      if (Array.isArray(itemsRes)) {
        setItemCount(itemsRes.length);
      } else if (Array.isArray((itemsRes as any)?.results)) {
        setItemCount((itemsRes as any).results.length);
      }
    };

    const loadGold = async () => {
      const price = await fetchGoldPrice();
      setGoldPrice(price);
    };

    loadCounts();
    loadGold();
  }, []);

  const filteredGoldData = useMemo(() => {
    return invoices
      .filter((inv) => {
        const date = new Date(inv.inv_date);
        const from = startDate ? new Date(startDate) : null;
        const to = endDate ? new Date(endDate) : null;
        return (!from || date >= from) && (!to || date <= to);
      })
      .filter((inv) => !isNaN(parseFloat(inv.gold_price)))
      .map((inv) => ({
        date: new Date(inv.inv_date).toLocaleDateString("ar-EG"),
        price: parseFloat(inv.gold_price),
      }));
  }, [invoices, startDate, endDate]);

  const goldChartData = {
    labels: filteredGoldData.map((d) => d.date),
    datasets: [
      {
        label: "سعر الذهب (من الفواتير)",
        data: filteredGoldData.map((d) => d.price),
        borderColor: "#f59e0b",
        backgroundColor: "#facc15",
        tension: 0.3,
        fill: false,
      },
    ],
  };

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
          value={invoiceCount !== null ? invoiceCount : 0} 
          href="/dashboard/reports/invoices" 
        />
        <StatCard 
          title="العملاء" 
          icon="👥" 
          value={customerCount !== null ? customerCount : 0} 
          href="/dashboard/basic/customers" 
        />
        <StatCard 
          title="الأصناف" 
          icon="📦" 
          value={itemCount !== null ? itemCount : 0} 
          href="/dashboard/basic/items" 
        />
        <StatCard 
          title="الفئات" 
          icon="🏷️" 
          value={categoryCount !== null ? categoryCount : 0} 
          href="/dashboard/basic/categories" 
        />
      </div>

      {/* Gold Price Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard 
          title="سعر الذهب للجرام" 
          icon="💰" 
          value={goldPrice ? `${goldPrice} ﷼` : "-"} 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gold Price Chart */}
        <div className="card p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">تحليل أسعار الذهب</h2>
            <div className="flex flex-wrap gap-3 items-center">
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="max-w-[140px]"
                placeholder="من تاريخ"
              />
              <span className="text-sm text-gray-500">إلى</span>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="max-w-[140px]"
                placeholder="إلى تاريخ"
              />
            </div>
          </div>
          <div className="h-64">
            <Line 
              data={goldChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Sales Chart */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">المبيعات الشهرية</h2>
          <div className="h-64">
            <Line 
              data={salesChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button 
          as={Link} 
          href="/dashboard/forms/invoice?new=true" 
          color="primary"
          className="btn-primary"
        >
          فاتورة جديدة
        </Button>
        <Button 
          as={Link} 
          href="/dashboard/reports/invoices" 
          color="secondary"
          className="btn-secondary"
        >
          قائمة الفواتير
        </Button>
      </div>
    </div>
  );
}
