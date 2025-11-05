import { notFound } from "next/navigation";
import { Metadata } from "next";

import CostCenterFormClient from "../components/CostCenterFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import costCenterService from "@/services/api/cost-center.service";
import genericService from "@/services/api/generic.service";

export const metadata: Metadata = {
  title: "عرض مركز التكلفة - NafeesWeb",
  description: "عرض وتعديل بيانات مركز التكلفة",
};

export default async function CostCenterDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const searchParamsData = await searchParams;
  const mode = Array.isArray(searchParamsData.mode)
    ? searchParamsData.mode[0]
    : searchParamsData.mode;

  // تحديد الوضع: preview (افتراضي) أو edit
  const formMode = mode === "edit" ? "edit" : "view";

  const costCenterId = parseInt(id);

  // التحقق من صحة المعرف
  if (isNaN(costCenterId) || costCenterId <= 0) {
    notFound();
  }

  const branchParams = await getBranchParams();

  // جلب بيانات مركز التكلفة
  const costCenter = await costCenterService.getCostCenterById(costCenterId);

  if (!costCenter) {
    notFound();
  }

  // جلب جميع مراكز التكلفة والحسابات
  const [costCentersResponse, accountsResponse] = await Promise.all([
    genericService
      .getTableData("cost_centers_list", branchParams)
      .catch(() => ({ success: false, data: [] })),
    genericService.getTableData("accounts_list", branchParams).catch(() => ({
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

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "مراكز التكلفة", href: "/basic/cost-centers" },
          {
            name:
              formMode === "edit"
                ? `تعديل ${costCenter.cost_name || "مركز التكلفة"}`
                : `عرض ${costCenter.cost_name || "مركز التكلفة"}`,
          },
        ]}
      />
      <CostCenterFormClient
        accounts={accountsData as any}
        costCenters={costCentersData as any}
        initialCostCenter={costCenter}
        mode={formMode}
      />
    </div>
  );
}

