import { Metadata } from "next";

import IncomeStatementClient from "./components/IncomeStatementClient";

export const metadata: Metadata = {
  title: "قائمة الدخل - NafeesWeb",
  description: "تقرير قائمة الدخل",
};

export default async function IncomeStatementPage() {
  return (
    <div className="responsive-container font-cairo">
      <h1 className="responsive-text-xl font-bold mb-6">قائمة الدخل</h1>
      <IncomeStatementClient />
    </div>
  );
}
