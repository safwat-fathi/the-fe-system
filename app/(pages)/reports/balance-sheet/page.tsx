import { Metadata } from "next";

import BalanceSheetClient from "./components/BalanceSheetClient";

import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "الميزانية العمومية - NafeesWeb",
  description: "تقرير الميزانية العمومية",
};

export default async function BalanceSheetPage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">الميزانية العمومية</h1>
      <BalanceSheetClient />
    </div>
  );
}
