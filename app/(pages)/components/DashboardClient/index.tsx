"use client";

import { useState, useMemo } from "react";
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
import { Input } from "@heroui/react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend);

interface Invoice {
  id: number;
  inv_date: string;
  inv_amt?: string;
  inv_net?: string;
  gold_price?: string;
}

interface DashboardClientProps {
  salesChartData: any;
  invoices: Invoice[];
  branch: string;
  year: string;
}

export default function DashboardClient({ salesChartData, invoices, branch, year }: DashboardClientProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const filteredGoldData = useMemo(() => {
    return invoices
      .filter((inv) => {
        const date = new Date(inv.inv_date);
        const from = startDate ? new Date(startDate) : null;
        const to = endDate ? new Date(endDate) : null;
        return (!from || date >= from) && (!to || date <= to);
      })
      .filter((inv) => !isNaN(parseFloat(inv.gold_price ?? "0")))
      .map((inv) => ({
        date: new Date(inv.inv_date).toLocaleDateString("ar-EG"),
        price: parseFloat(inv.gold_price ?? "0"),
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

  return (
    <>
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
    </>
  );
}
