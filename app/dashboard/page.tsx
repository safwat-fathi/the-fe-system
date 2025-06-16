"use client";
import { useEffect, useState } from "react";
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
import { Button } from "@heroui/react";

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

  useEffect(() => {
    setBranch(localStorage.getItem("selectedBranch") || "");
    setYear(localStorage.getItem("selectedYear") || "");

    const loadCounts = async () => {
      const invoices = await fetchData<any[]>(API_ENDPOINTS.INVOICES_LIST);
      const customers = await fetchData<any[]>(API_ENDPOINTS.CUSTOMERS_LIST);
      const categories = await fetchData<any[]>(API_ENDPOINTS.CATEGORIES_LIST);
      const itemsRes = await fetchData<any[]>(API_ENDPOINTS.GET_ITEMS_LIST);

      if (Array.isArray(invoices)) {
        setInvoiceCount(invoices.length);
        const monthly: number[] = new Array(12).fill(0);
        invoices.forEach((inv) => {
          const date = new Date(inv.inv_date);
          const month = date.getMonth();
          monthly[month] += parseFloat(inv.inv_amt ?? inv.inv_net ?? 0);
        });
        setMonthlySales(monthly);
      }
      if (Array.isArray(customers)) setCustomerCount(customers.length);
      if (Array.isArray(categories)) setCategoryCount(categories.length);
      if (Array.isArray(itemsRes)) setItemCount(itemsRes.length);
    };

    const loadGold = async () => {
      const price = await fetchGoldPrice();
      setGoldPrice(price);
    };

    loadCounts();
    loadGold();
  }, []);

  const chartData = {
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
        data: monthlySales,
        fill: false,
        borderColor: "#3b82f6",
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="font-cairo space-y-6">
      <h1 className={title()}>لوحة التحكم</h1>
      <div className="text-sm text-gray-500">فرع: {branch || "-"} | السنة: {year || "-"}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="الفواتير" value={invoiceCount ?? "-"} />
        <StatCard title="العملاء" value={customerCount ?? "-"} />
        <StatCard title="الأصناف" value={itemCount ?? "-"} />
        <StatCard title="الفئات" value={categoryCount ?? "-"} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="سعر الذهب للجرام" value={goldPrice ? `${goldPrice} ﷼` : "-"} />
      </div>
      <div className="bg-white rounded p-4 shadow">
        <Line data={chartData} />
      </div>
      <div className="flex gap-4">
        <Button as={Link} href="/dashboard/forms/invoice" color="primary">
          فاتورة جديدة
        </Button>
        <Button as={Link} href="/dashboard/reports/invoices" color="secondary">
          قائمة الفواتير
        </Button>
      </div>
    </div>
  );
}
