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
  const { com } = await getBranchParams();
  
  const response = await boxesService.getBoxes({ xcom_id: com });

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      {/* Client Component للتفاعل */}
      <BoxesClient error={null} initialData={response as any[]} />
    </div>
  );
}
