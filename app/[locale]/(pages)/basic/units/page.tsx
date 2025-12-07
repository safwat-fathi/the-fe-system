import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import UnitsClient from "./components/UnitsClient";

import Breadcrumb from "@/components/Breadcrumb";
import unitService from "@/services/api/unit.service";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getTranslations("basic.units" as any)) as any;

  return {
    title: `${t("labels.pageTitle")} - NafeesWeb`,
    description: t("labels.pageTitle"),
  };
}

export default async function UnitsPage() {
  // جلب البيانات على السيرفر
  const unitsData = await unitService.getAllUnits().catch(() => []);

  const t = (await getTranslations("basic.units" as any)) as any;

  return (
    <div className="font-cairo">
      <Breadcrumb />
      <h1 className="text-xl font-bold mb-2">
        {t("labels.pageTitle")}
      </h1>

      <UnitsClient initialUnits={unitsData} />
    </div>
  );
}
