import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import ReportsClient from "./components/ReportsClient";

import Breadcrumb from "@/components/Breadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reports.main");
  
  return {
    title: `${t("title")} - NafeesWeb`,
    description: t("description"),
  };
}

export default async function ReportsPage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <ReportsClient />
    </div>
  );
}
