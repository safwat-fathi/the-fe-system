import { Metadata } from "next";

import CategoriesClient from "./components/CategoriesClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import categoryService from "@/services/api/category.service";
import categoryAccountService from "@/services/api/cat-account.service";
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
  const [categoriesData, boxesData] = await Promise.all([
    categoryService.getAllCategories(companyId).catch(() => []),
    helperService.getBoxes(companyId).catch(() => []),
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

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-2">الفئات</h1>

      <CategoriesClient
        companyId={companyId}
        initialBoxes={boxesData as any}
        initialCategories={categoriesData as any}
        initialAccounts={accountsData as any}
        initialCategoryAccounts={initialCategoryAccounts as any}
      />
    </div>
  );
}
