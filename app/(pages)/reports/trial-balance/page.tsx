import { Metadata } from "next";

import TrialBalanceClient from "./components/TrialBalanceClient";

import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "ميزان المراجعة - NafeesWeb",
  description: "تقرير ميزان المراجعة",
};

export default async function TrialBalancePage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">ميزان المراجعة</h1>
      <TrialBalanceClient />
    </div>
  );
}
