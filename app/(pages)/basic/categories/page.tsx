import { Metadata } from "next";

import CategoriesClient from "./components/CategoriesClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import categoryService from "@/services/api/category.service";
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

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-2">الفئات</h1>

      <CategoriesClient
        companyId={companyId}
        initialBoxes={boxesData as any}
        initialCategories={categoriesData as any}
      />
    </div>
  );
}
