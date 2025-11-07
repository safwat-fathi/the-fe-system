import { Metadata } from "next";

import JournalLedgerClient from "./components/JournalLedgerClient";

import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "دفتر القيود - NafeesWeb",
  description: "تقرير دفتر القيود",
};

export default async function JournalLedgerPage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">دفتر القيود</h1>
      <JournalLedgerClient />
    </div>
  );
}
