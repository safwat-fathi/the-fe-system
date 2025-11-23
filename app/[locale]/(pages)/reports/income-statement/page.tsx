import { Metadata } from "next";

import IncomeStatementClient from "./components/IncomeStatementClient";

import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "قائمة الدخل - NafeesWeb",
  description: "تقرير قائمة الدخل",
};

export default async function IncomeStatementPage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">قائمة الدخل</h1>
      <IncomeStatementClient />
    </div>
  );
}
