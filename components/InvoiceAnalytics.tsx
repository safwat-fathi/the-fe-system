"use client";

import { useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { Invoice } from "@/types/invoice";
import { formatAmount } from "@/utilities/formatAmount";
import useFractions from "@/utilities/useFractions";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface InvoiceAnalyticsProps {
  invoices: Invoice[];
}

export default function InvoiceAnalytics({ invoices }: InvoiceAnalyticsProps) {
  const fractions = useFractions() as { frac: number; frac2: number };
  
  const analytics = useMemo(() => {
    const total = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.inv_amt || 0), 0);
    const totalTax = invoices.reduce((sum, inv) => sum + (inv.tax || 0), 0);
    const avgAmount = total > 0 ? totalAmount / total : 0;

    // حسب النوع
    const byType = {
      sales: invoices.filter(inv => inv.trans_type === 2).length,
      return: invoices.filter(inv => inv.trans_type === 3).length,
      credit: invoices.filter(inv => inv.pay_type === 3).length,
    };

    // حسب الشهر
    const byMonth = new Array(12).fill(0);
    const byMonthAmount = new Array(12).fill(0);
    invoices.forEach(inv => {
      const month = new Date(inv.inv_date).getMonth();
      byMonth[month]++;
      byMonthAmount[month] += inv.inv_amt || 0;
    });

    // حسب اليوم
    const byDay = new Array(7).fill(0);
    invoices.forEach(inv => {
      const day = new Date(inv.inv_date).getDay();
      byDay[day]++;
    });

    return {
      total,
      totalAmount,
      totalTax,
      avgAmount,
      byType,
      byMonth,
      byMonthAmount,
      byDay,
    };
  }, [invoices]);

  const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const dayNames = [
    "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
  ];

  const salesChartData = {
    labels: monthNames,
    datasets: [
      {
        label: "عدد الفواتير",
        data: analytics.byMonth,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
        yAxisID: "y",
      },
      {
        label: "إجمالي المبيعات",
        data: analytics.byMonthAmount,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.3,
        yAxisID: "y1",
      },
    ],
  };

  const typeChartData = {
    labels: ["فواتير البيع", "فواتير المرتجعات", "فواتير الآجل"],
    datasets: [
      {
        data: [analytics.byType.sales, analytics.byType.return, analytics.byType.credit],
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(59, 130, 246, 0.8)",
        ],
        borderColor: [
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
          "rgb(59, 130, 246)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const dayChartData = {
    labels: dayNames,
    datasets: [
      {
        label: "عدد الفواتير",
        data: analytics.byDay,
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            family: "Cairo",
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "عدد الفواتير",
          font: {
            family: "Cairo",
          },
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "إجمالي المبيعات",
          font: {
            family: "Cairo",
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const simpleChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            family: "Cairo",
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{analytics.total}</div>
              <div className="text-sm opacity-90">إجمالي الفواتير</div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatAmount(analytics.totalAmount, fractions.frac)}
              </div>
              <div className="text-sm opacity-90">إجمالي المبيعات</div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardBody className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatAmount(analytics.totalTax, fractions.frac)}
              </div>
              <div className="text-sm opacity-90">إجمالي الضريبة</div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardBody className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatAmount(analytics.avgAmount, fractions.frac)}
              </div>
              <div className="text-sm opacity-90">متوسط قيمة الفاتورة</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* المبيعات الشهرية */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">المبيعات الشهرية</h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <Line data={salesChartData} options={chartOptions} />
            </div>
          </CardBody>
        </Card>

        {/* أنواع الفواتير */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">توزيع أنواع الفواتير</h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <Doughnut data={typeChartData} options={simpleChartOptions} />
            </div>
          </CardBody>
        </Card>

        {/* الفواتير حسب اليوم */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">الفواتير حسب اليوم</h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <Bar data={dayChartData} options={simpleChartOptions} />
            </div>
          </CardBody>
        </Card>

        {/* ملخص سريع */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">ملخص سريع</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">فواتير البيع</span>
                <span className="text-green-600 font-bold">{analytics.byType.sales}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium">فواتير المرتجعات</span>
                <span className="text-yellow-600 font-bold">{analytics.byType.return}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">فواتير الآجل</span>
                <span className="text-blue-600 font-bold">{analytics.byType.credit}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">نسبة الضريبة</span>
                <span className="text-gray-600 font-bold">
                  {analytics.totalAmount > 0 
                    ? ((analytics.totalTax / analytics.totalAmount) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* إحصائيات تفصيلية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أفضل الشهور */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">أفضل الشهور أداءً</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {analytics.byMonth
                .map((count, index) => ({ count, month: monthNames[index] }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{item.month}</span>
                    <span className="text-blue-600 font-bold">{item.count} فاتورة</span>
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>

        {/* أفضل أيام الأسبوع */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">أفضل أيام الأسبوع</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {analytics.byDay
                .map((count, index) => ({ count, day: dayNames[index] }))
                .sort((a, b) => b.count - a.count)
                .map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{item.day}</span>
                    <span className="text-green-600 font-bold">{item.count} فاتورة</span>
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
