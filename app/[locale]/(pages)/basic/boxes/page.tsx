import { Metadata } from "next";

import BoxesClient from "./components/BoxesClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import { boxesService } from "@/services/api";

export const metadata: Metadata = {
  title: "الصناديق - NafeesWeb",
  description: "إدارة الصناديق",
};

export default async function BoxesPage() {
  // جلب معاملات الفرع والسنة
  const branchParams = await getBranchParams();

  // جلب بيانات الصناديق باستخدام GenericService

  const response = await boxesService.getBoxes({ xcom_id: branchParams.com });

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-2">الصناديق</h1>
      {/* Client Component للتفاعل */}
      <BoxesClient error={null} initialData={response as any[]} />
    </div>
  );
}
