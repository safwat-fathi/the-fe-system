import { Metadata } from "next";

import GeneralLedgerClient from "./components/GeneralLedgerClient";

import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "دفتر الأستاذ - NafeesWeb",
  description: "تقرير دفتر الأستاذ",
};

export default async function GeneralLedgerPage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">دفتر الأستاذ</h1>
      <GeneralLedgerClient />
    </div>
  );
}
