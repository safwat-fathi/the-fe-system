import { Metadata } from "next";

import BoxesClient from "./components/BoxesClient";

import genericService from "@/services/api/generic.service";
import { getBranchParams } from "@/app/actions/branch-params";
import { boxesService } from "@/services/api";

export const metadata: Metadata = {
  title: "الصناديق - NafeesWeb",
  description: "إدارة الصناديق",
};

// Interface for customer boxes (customers with cust_type = 99)
interface CustomerBox {
  id: number;
  cust_code?: string;
  cust_name: string;
  cust_name_e: string;
  mobile: number | string;
  email: string;
  address: string;
  vat_no: number | null;
  cr_no: number | null;
  phone: string;
  fax: string;
  gov: string;
  city: string;
  area: string;
  street: string;
  build_no: string;
  post_code: string;
  cust_status: number;
  acc?: number;
  acc_name?: string;
  cust_type?: number;
  box_type: string;
  handling: string;
  handling_e?: string;
  perc?: number;
  expt?: boolean;
  hide?: boolean;
}

export default async function BoxesPage() {
  // جلب معاملات الفرع والسنة
  const branchParams = await getBranchParams();

  // جلب بيانات الصناديق باستخدام GenericService

  const response = await boxesService.getBoxes({ xcom_id: branchParams.com });
  console.log("🚀 ~ :55 ~ BoxesPage ~ response:", response);

  return (
    <div className="responsive-container font-cairo">
      <h1 className="responsive-text-xl font-bold mb-6">الصناديق</h1>
      {/* Client Component للتفاعل */}
      <BoxesClient error={null} initialData={response as any[]} />
    </div>
  );
}
