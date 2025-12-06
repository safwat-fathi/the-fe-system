import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import BoxesClient from "./components/BoxesClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import { boxesService } from "@/services/api";

export const metadata: Metadata = {
  title: "الصناديق - NafeesWeb",
  description: "إدارة الصناديق",
};

export default async function BoxesPage() {
  const t = await getTranslations("basic.boxes");
  // جلب معاملات الفرع والسنة
  const branchParams = await getBranchParams();

  // جلب بيانات الصناديق باستخدام GenericService

  const response = await boxesService.getBoxes({ xcom_id: branchParams.com });

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-2">{t("title")}</h1>
      {/* Client Component للتفاعل */}
      <BoxesClient error={null} initialData={response as any[]} />
    </div>
  );
}
