"use client";

import type { Invoice as InvoiceModel } from "@/types/models/invoice";

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
import { useLocale, useTranslations } from "next-intl";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
);

interface DashboardClientProps {
  salesChartData: any;
  invoices: InvoiceModel[];
}

export default function DashboardClient({ salesChartData, invoices }: DashboardClientProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const locale = useLocale();
  const tDashboard = useTranslations("dashboard");

  const dateFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [locale]);

  const filteredGoldData = useMemo(() => {
    return invoices
      .filter((inv) => {
        const date = new Date(inv.inv_date);
        const from = startDate ? new Date(startDate) : null;
        const to = endDate ? new Date(endDate) : null;

        return (!from || date >= from) && (!to || date <= to);
      })
      .filter((inv) => Number.isFinite(Number(inv.gold_price ?? 0)))
      .map((inv) => ({
        date: dateFormatter.format(new Date(inv.inv_date)),
        price: Number(inv.gold_price ?? 0),
      }));
  }, [dateFormatter, invoices, startDate, endDate]);

  const goldChartData = {
    labels: filteredGoldData.map((d) => d.date),
    datasets: [
      {
        label: tDashboard("goldChart.datasetLabel"),
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
            <h2 className="text-lg font-semibold text-gray-800">
              {tDashboard("goldChart.title")}
            </h2>
            <div className="flex flex-wrap gap-3 items-center">
              <Input
                className="max-w-[140px]"
                placeholder={tDashboard("goldChart.fromPlaceholder")}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-sm text-gray-500">
                {tDashboard("goldChart.rangeSeparator")}
              </span>
              <Input
                className="max-w-[140px]"
                placeholder={tDashboard("goldChart.toPlaceholder")}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
                    position: "top" as const,
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
          <h2 className="text-lg font-semibold text-gray-800">
            {tDashboard("salesChart.title")}
          </h2>
          <div className="h-64">
            <Line
              data={salesChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top" as const,
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
