import { Metadata } from "next";
import genericService from "@/services/api/generic.service";
import { getBranchParams } from "@/app/actions/branch-params";
import BoxesClient from "./components/BoxesClient";

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
  let boxesData: CustomerBox[] = [];
  let error = null;

  try {
    const response = await genericService.getTableData("boxes_list", branchParams);
    if (response.success) {
      boxesData = response.data || [];
    } else {
      error = response.message || "فشل في جلب البيانات";
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "حدث خطأ غير معروف";
    boxesData = [];
  }

  return (
    <div className="responsive-container font-cairo">
      <h1 className="responsive-text-xl font-bold mb-6">الصناديق</h1>
      
      {/* عرض حالة الطلب */}
      {error && (
        <div className="mb-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>خطأ:</strong> {error}
      </div>
      </div>
      )}

      {/* Client Component للتفاعل */}
      <BoxesClient 
        initialData={boxesData} 
        error={error}
      />
    </div>
  );
}
