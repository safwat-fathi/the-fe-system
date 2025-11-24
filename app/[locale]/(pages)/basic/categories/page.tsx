import { Metadata } from "next";

import CategoriesClient from "./components/CategoriesClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import categoryService from "@/services/api/category.service";
import categoryAccountService from "@/services/api/cat-account.service";
import boxesService from "@/services/api/boxes.service";
import accountService from "@/services/api/account.service";
import helperService from "@/services/api/helper.service";

export const metadata: Metadata = {
  title: "الفئات - NafeesWeb",
  description: "إدارة الفئات",
};

export default async function CategoriesPage() {
  const branchParams = await getBranchParams();
  const parsedCompanyId = Number(branchParams.com ?? "1");
  const companyId =
    Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
      ? parsedCompanyId
      : 1;

  // جلب البيانات بالتوازي
  const [categoriesData, boxesDataRaw, catTypesData, catStatusesData] =
    await Promise.all([
      categoryService.getAllCategories(companyId).catch(() => []),
      boxesService.getGoldBoxes({ xcom_id: companyId }).catch(() => []),
      helperService.getCatTypes().catch(() => []),
      helperService.getCatStatuses().catch(() => []),
    ]);

  const firstCategoryId = categoriesData?.[0]?.id ?? null;

  const [accountsData, initialCategoryAccounts] = await Promise.all([
    accountService.getAllAccounts(companyId).catch(() => []),
    firstCategoryId
      ? categoryAccountService
          .getCategoryAccounts(companyId, firstCategoryId)
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  const normalizedBoxes = Array.isArray(boxesDataRaw)
    ? boxesDataRaw.map((box: any) => ({
        id: Number(box?.id ?? box?.cust_code ?? 0),
        box_name:
          box?.cust_name ??
          box?.box_name ??
          (box?.id ? `صندوق ${box.id}` : "صندوق غير معروف"),
      }))
    : [];

  const normalizedCatTypes = Array.isArray(catTypesData)
    ? catTypesData.map((item: any) => ({
        id: String(item?.code_id ?? ""),
        name: item?.code_desc ?? String(item?.code_id ?? ""),
      }))
    : [];

  const normalizedCatStatuses = Array.isArray(catStatusesData)
    ? catStatusesData.map((item: any) => ({
        id: String(item?.code_id ?? ""),
        name: item?.code_desc ?? String(item?.code_id ?? ""),
      }))
    : [];

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-2">الفئات</h1>

      <CategoriesClient
        catStatuses={normalizedCatStatuses}
        catTypes={normalizedCatTypes}
        companyId={companyId}
        initialAccounts={accountsData as any}
        initialBoxes={normalizedBoxes}
        initialCategories={categoriesData as any}
        initialCategoryAccounts={initialCategoryAccounts as any}
      />
    </div>
  );
}
