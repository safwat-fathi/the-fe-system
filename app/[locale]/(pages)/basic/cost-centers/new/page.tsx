import { Metadata } from "next";

import CostCenterFormClient from "../components/CostCenterFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import genericService from "@/services/api/generic.service";

export const metadata: Metadata = {
  title: "إضافة مركز تكلفة جديد - NafeesWeb",
  description: "إضافة مركز تكلفة جديد إلى النظام",
};

export default async function NewCostCenterPage() {
  const branchParams = await getBranchParams();

  // جلب جميع مراكز التكلفة والحسابات
  const [costCentersResponse, accountsResponse] = await Promise.all([
    genericService
      .getTableData("cost_centers_list", {
        ...branchParams,
        xcom_id: branchParams.com || "1",
      })
      .catch(() => ({ success: false, data: [] })),
    genericService
      .getTableData("accounts_list", {
        ...branchParams,
        xcom_id: branchParams.com || "1",
      })
      .catch(() => ({
        success: false,
        data: [],
      })),
  ]);

  const costCentersData = costCentersResponse.success
    ? costCentersResponse.data || []
    : [];
  const accountsData = accountsResponse.success
    ? accountsResponse.data || []
    : [];

  // إنشاء مركز تكلفة فارغ
  const emptyCostCenter = {
    id: 0,
    cost_name: "",
    cost_name_e: "",
    cost_type: 1,
    cr_date: "",
    cr_user: null,
    upd_date: null,
    upd_user: null,
    cost_status: 1,
    acc: null,
    parent: null,
  };

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "مراكز التكلفة", href: "/basic/cost-centers" },
          { name: "إضافة مركز تكلفة جديد" },
        ]}
      />
      <CostCenterFormClient
        accounts={accountsData as any}
        costCenters={costCentersData as any}
        initialCostCenter={emptyCostCenter}
        mode="add"
      />
    </div>
  );
}

