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
      } else if (Array.isArray(categories?.results)) {
        setCategoryCount(categories.results.length);
      }

      if (Array.isArray(itemsRes)) {
        setItemCount(itemsRes.length);
      } else if (Array.isArray(itemsRes?.results)) {
        setItemCount(itemsRes.results.length);
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
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="font-cairo space-y-6">
      <h1 className={title()}>لوحة التحكم</h1>
      <div className="text-sm text-gray-500">فرع: {branch || "-"} | السنة: {year || "-"}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/reports/invoices" className="bg-white rounded-xl shadow-md border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 p-6 flex items-center gap-4">
          <div className="text-yellow-500 text-3xl">🧾</div>
          <div>
            <h3 className="text-sm text-gray-500">الفواتير</h3>
            <p className="text-2xl font-bold text-gray-800">
              {invoiceCount !== null ? <CountUp end={invoiceCount} duration={1.5} separator="," /> : <span className="text-gray-400">...</span>}
            </p>
          </div>
        </Link>

        <Link href="/dashboard/basic/customers" className="bg-white rounded-xl shadow-md border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 p-6 flex items-center gap-4">
          <div className="text-blue-600 text-3xl">👥</div>
          <div>
            <h3 className="text-sm text-gray-500">العملاء</h3>
            <p className="text-2xl font-bold text-gray-800">
              {customerCount !== null ? <CountUp end={customerCount} duration={1.5} separator="," /> : <span className="text-gray-400">...</span>}
            </p>
          </div>
        </Link>

        <Link href="/dashboard/basic/items" className="bg-white rounded-xl shadow-md border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 p-6 flex items-center gap-4">
          <div className="text-green-600 text-3xl">📦</div>
          <div>
            <h3 className="text-sm text-gray-500">الأصناف</h3>
            <p className="text-2xl font-bold text-gray-800">
              {itemCount !== null ? <CountUp end={itemCount} duration={1.5} separator="," /> : <span className="text-gray-400">...</span>}
            </p>
          </div>
        </Link>

        <Link href="/dashboard/basic/categories" className="bg-white rounded-xl shadow-md border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 p-6 flex items-center gap-4">
          <div className="text-purple-600 text-3xl">🏷️</div>
          <div>
            <h3 className="text-sm text-gray-500">الفئات</h3>
            <p className="text-2xl font-bold text-gray-800">
              {categoryCount !== null ? <CountUp end={categoryCount} duration={1.5} separator="," /> : <span className="text-gray-400">...</span>}
            </p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="سعر الذهب للجرام" value={goldPrice ? `${goldPrice} ﷼` : "-"} />
      </div>

      <div className="bg-white rounded shadow p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h2 className="text-base font-bold text-gray-700">تحليل أسعار الذهب (من الفواتير)</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="max-w-[160px]" />
            <span className="text-sm text-gray-500">إلى</span>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="max-w-[160px]" />
          </div>
        </div>
        <Line data={goldChartData} height={90} />
      </div>

      <div className="bg-white rounded p-4 shadow">
        <Line data={salesChartData} />
      </div>

      {/* <div className="flex gap-4">
        <Button as={Link} href="/dashboard/forms/invoice" color="primary">
          فاتورة جديدة
        </Button>
        <Button as={Link} href="/dashboard/reports/invoices" color="secondary">
          قائمة الفواتير
        </Button>
      </div> */}
    </div>
  );
}
