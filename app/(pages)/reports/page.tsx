import { Metadata } from "next";

import ReportsClient from "./components/ReportsClient";

import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "التقارير - NafeesWeb",
  description: "جميع التقارير المتاحة في النظام",
};

export default async function ReportsPage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <ReportsClient />
    </div>
  );
}
