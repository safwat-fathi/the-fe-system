import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CostCentersClient from "./components/CostCentersClient";

import Breadcrumb from "@/components/Breadcrumb";
import genericService from "@/services/api/generic.service";
import { getBranchParams } from "@/app/actions/branch-params";

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

interface Account {
  id: number;
  acc_name: string;
  acc_name_e?: string;
}

export default async function CostCentersPage() {
  const t = await getTranslations("basic.costCenters");
  // جلب معاملات الفرع والسنة
  const branchParams = await getBranchParams();

  // جلب بيانات مراكز التكلفة والحسابات بالتوازي
  const [costCentersResponse, accountsResponse] = await Promise.all([
    genericService
      .getTableData("cost_centers_list", {
        ...branchParams,
        xcom_id: branchParams.com || "1",
      })
      .catch(() => ({
        success: false,
        message: t("messages.loadError"),
        data: [],
      })),
    genericService
      .getTableData("accounts_list", {
        ...branchParams,
        xcom_id: branchParams.com || "1",
      })
      .catch(() => ({
        success: false,
        message: t("messages.accountsLoadError"),
        data: [],
      })),
  ]);

  const costCentersData: CostCenter[] = costCentersResponse.success
    ? costCentersResponse.data || []
    : [];
  const accountsData: Account[] = accountsResponse.success
    ? accountsResponse.data || []
    : [];
  const error = !costCentersResponse.success
    ? costCentersResponse.message || t("messages.dataLoadError")
    : null;

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />

      {/* عرض حالة الطلب */}
      {error && (
        <div className="mb-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>{t("messages.dataLoadError")}:</strong> {error}
          </div>
        </div>
      )}

      {/* Client Component للتفاعل */}
      <CostCentersClient
        error={error}
        initialAccounts={accountsData}
        initialData={costCentersData}
        currentCom={branchParams.com || "1"}
      />
    </div>
  );
}
