"use client";

import type { Invoice as InvoiceModel } from "@/types/models/invoice";

import dynamic from "next/dynamic";

import DashboardChartsSkeleton from "./DashboardChartsSkeleton";

interface DashboardClientProps {
  salesChartData: any;
  invoices: InvoiceModel[];
}

const DashboardCharts = dynamic(() => import("./DashboardCharts"), {
  loading: () => <DashboardChartsSkeleton />,
  ssr: false,
});

const DashboardClient = ({
  salesChartData,
  invoices,
}: DashboardClientProps) => {
  return (
    <DashboardCharts invoices={invoices} salesChartData={salesChartData} />
  );
};

export default DashboardClient;
