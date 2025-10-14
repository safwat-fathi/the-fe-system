import { Metadata } from "next";
import genericService from "@/services/api/generic.service";
import { getBranchParams } from "@/app/actions/branch-params";
import CostCentersClient from "./components/CostCentersClient";

export const metadata: Metadata = {
  title: "مراكز التكلفة - NafeesWeb",
  description: "إدارة مراكز التكلفة",
};

// Interface for cost centers
interface CostCenter {
  id: number;
  cost_name: string;
  cost_name_e: string;
  cost_type: number;
  cr_date: string;
  cr_user: number | null;
  upd_date: string | null;
  upd_user: number | null;
  cost_status: number;
  acc: number | null;
  parent: number | null;
}

export default async function CostCentersPage() {
  // جلب معاملات الفرع والسنة
  const branchParams = await getBranchParams();

  // جلب بيانات مراكز التكلفة باستخدام GenericService
  let costCentersData: CostCenter[] = [];
  let error = null;

  try {
    const response = await genericService.getTableData("cost_centers_list", branchParams);
    if (response.success) {
      costCentersData = response.data || [];
    } else {
      error = response.message || "فشل في جلب البيانات";
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "حدث خطأ غير معروف";
    costCentersData = [];
  }

  return (
    <div className="responsive-container font-cairo">
      <h1 className="responsive-text-xl font-bold mb-6">مراكز التكلفة</h1>
      
      {/* عرض حالة الطلب */}
      {error && (
        <div className="mb-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>خطأ:</strong> {error}
          </div>
        </div>
      )}

      {/* Client Component للتفاعل */}
      <CostCentersClient 
        initialData={costCentersData} 
        error={error}
      />
    </div>
  );
}
