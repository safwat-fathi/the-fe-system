import { notFound } from "next/navigation";
import { Metadata } from "next";

import CategoryFormClient from "../components/CategoryFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import {
  ensureCategoryAccountAction,
  getCategoryAccountsAction,
} from "@/app/actions/category-accounts.action";
import accountService from "@/services/api/account.service";
import categoryService from "@/services/api/category.service";
import helperService from "@/services/api/helper.service";

export const metadata: Metadata = {
  title: "عرض الفئة - NafeesWeb",
  description: "عرض وتعديل بيانات الفئة",
};

export default async function CategoryDetailPage({
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

  const categoryId = parseInt(id);

  // التحقق من صحة المعرف
  if (isNaN(categoryId) || categoryId <= 0) {
    notFound();
  }

  const branchParams = await getBranchParams();
  const parsedCompanyId = Number(branchParams.com ?? "1");
  const companyId =
    Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
      ? parsedCompanyId
      : 1;

  // جلب بيانات الفئة
  const category = await categoryService.getCategoryById(categoryId);

  if (!category) {
    notFound();
  }

  // جلب البيانات الأساسية
  const [boxesData, accountsData, catTypesData, catStatusesData] =
    await Promise.all([
      helperService.getBoxes(companyId).catch(() => []),
      accountService.getAllAccounts(companyId).catch(() => []),
      helperService.getCatTypes().catch(() => []),
      helperService.getCatStatuses().catch(() => []),
    ]);

  const categoryAccount = await ensureCategoryAccountAction({
    companyId,
    categoryId,
  }).catch(async () => {
    const fallbackAccounts = await getCategoryAccountsAction({
      companyId,
      categoryId,
    }).catch(() => []);

    return (
      fallbackAccounts.find(
        (record) => Number(record.cat) === Number(categoryId),
      ) ?? null
    );
  });

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "الفئات", href: "/basic/categories" },
          {
            name:
              formMode === "edit"
                ? `تعديل ${category.cat_name || "الفئة"}`
                : `عرض ${category.cat_name || "الفئة"}`,
          },
        ]}
      />
      <CategoryFormClient
        boxes={boxesData as any}
        catTypes={catTypesData as any}
        companyId={companyId}
        initialAccounts={accountsData as any}
        initialCategory={category}
        initialCategoryAccount={categoryAccount}
        catStatuses={catStatusesData as any}
        mode={formMode}
      />
    </div>
  );
}
