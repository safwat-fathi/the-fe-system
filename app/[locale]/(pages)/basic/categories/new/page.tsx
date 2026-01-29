import { Metadata } from "next";

import CategoryFormClient from "../components/CategoryFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import accountService from "@/services/api/account.service";
import helperService from "@/services/api/helper.service";

export const metadata: Metadata = {
  title: "إضافة فئة جديدة - NafeesWeb",
  description: "إضافة فئة جديدة إلى النظام",
};

export default async function NewCategoryPage() {
  const branchParams = await getBranchParams();
  const parsedCompanyId = Number(branchParams.com ?? "1");
  const companyId =
    Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
      ? parsedCompanyId
      : 1;

  // جلب البيانات الأساسية
  const [boxesData, accountsData, catTypesData] = await Promise.all([
    helperService.getBoxes(companyId).catch(() => []),
    accountService.getAllAccounts(companyId).catch(() => []),
    helperService.getCatTypes().catch(() => []),
  ]);

  // إنشاء فئة فارغة
  const emptyCategory = {
    id: 0,
    cat_name: "",
    cat_name_e: "",
    k: "",
    purity: "",
    box: null,
    tax_type: false,
    tax: 0,
    cat_type: "",
    cat_status: true,
  };

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "الفئات", href: "/basic/categories" },
          { name: "إضافة فئة جديدة" },
        ]}
      />
      <CategoryFormClient
        boxes={boxesData as any}
        catTypes={catTypesData as any}
        companyId={companyId}
        initialAccounts={accountsData as any}
        initialCategory={emptyCategory}
        initialCategoryAccount={null}
        mode="add"
      />
    </div>
  );
}
