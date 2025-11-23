import { Metadata } from "next";

import CurrenciesClient from "./components/CurrenciesClient";

import Breadcrumb from "@/components/Breadcrumb";
import genericService from "@/services/api/generic.service";
import { getBranchParams } from "@/app/actions/branch-params";

export const metadata: Metadata = {
  title: "العملات - NafeesWeb",
  description: "إدارة العملات",
};

interface Currency {
  id: number;
  cur_name: string;
  cur_name_e: string;
  cur_part: string;
  cur_part_e: string;
  cur_sign: string;
  cur_price: string;
  cur_tag: string;
  cr_date: string;
  cur_status: boolean;
}

export default async function CurrenciesPage() {
  // جلب معاملات الفرع والسنة
  const branchParams = await getBranchParams();

  // جلب بيانات العملات باستخدام GenericService
  let currenciesData: Currency[] = [];
  let error = null;

  try {
    const response = await genericService.getTableData(
      "currencies_list",
      branchParams,
    );

    if (response.success) {
      currenciesData = response.data || [];
    } else {
      error = response.message || "فشل في جلب البيانات";
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "حدث خطأ غير معروف";
    currenciesData = [];
  }

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-2">العملات</h1>

      {/* عرض حالة الطلب */}
      {error && (
        <div className="mb-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>خطأ:</strong> {error}
          </div>
        </div>
      )}

      {/* Client Component للتفاعل */}
      <CurrenciesClient error={error} initialData={currenciesData} />
    </div>
  );
}
