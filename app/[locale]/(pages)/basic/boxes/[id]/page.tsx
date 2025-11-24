import { notFound } from "next/navigation";
import { Metadata } from "next";

import BoxFormClient from "../components/BoxFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import boxService from "@/services/api/box.service";
import accountService from "@/services/api/account.service";

export const metadata: Metadata = {
  title: "عرض الصندوق - NafeesWeb",
  description: "عرض وتعديل بيانات الصندوق",
};

export default async function BoxDetailPage({
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

  const boxId = parseInt(id);

  // التحقق من صحة المعرف
  if (isNaN(boxId) || boxId <= 0) {
    notFound();
  }

  const branchParams = await getBranchParams();
  const parsedCompanyId = Number(branchParams.com ?? "1");
  const companyId =
    Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
      ? parsedCompanyId
      : 1;

  // جلب بيانات الصندوق
  const box = await boxService.getBoxById(boxId, branchParams.com);

  if (!box) {
    notFound();
  }

  // جلب البيانات الأساسية
  const [boxTypesData, accountsData] = await Promise.all([
    boxService.getBoxTypes().catch(() => []),
    accountService.getAllAccounts(branchParams.com).catch(() => []),
  ]);

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "الصناديق", href: "/basic/boxes" },
          {
            name:
              formMode === "edit"
                ? `تعديل ${box.cust_name || box.cust_code || "الصندوق"}`
                : `عرض ${box.cust_name || box.cust_code || "الصندوق"}`,
          },
        ]}
      />
      <BoxFormClient
        accounts={accountsData as any}
        boxTypes={boxTypesData as any}
        companyId={companyId}
        initialBox={box}
        mode={formMode}
      />
    </div>
  );
}
