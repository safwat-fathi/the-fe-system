import { Metadata } from "next";

import TaxDailyJournalClient from "./components/TaxDailyJournalClient";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "دفتر اليومية الضريبية - NafeesWeb",
  description: "تقرير دفتر اليومية الضريبية",
};

export default async function TaxDailyJournalPage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">دفتر اليومية الضريبية</h1>
      <TaxDailyJournalClient />
    </div>
  );
}
