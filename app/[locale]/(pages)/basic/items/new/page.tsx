import type { ItemForm } from "@/types/items";

import { Metadata } from "next";

import ItemFormClient from "../components/ItemFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import helperService from "@/services/api/helper.service";
import { itemService } from "@/services/api";

export const metadata: Metadata = {
  title: "إضافة صنف جديد - NafeesWeb",
  description: "إضافة صنف جديد إلى النظام",
};

export default async function NewItemPage() {
  const branchParams = await getBranchParams();
  const parsedCompanyId = Number(branchParams.com ?? "1");
  const companyId =
    Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
      ? parsedCompanyId
      : 1;

  // جلب البيانات الأساسية
  const [categoriesData, itemTypesData, unitsData, itemStatusData] =
    await Promise.all([
      helperService.getCategories(companyId).catch(() => []),
      helperService.getItemTypes().catch(() => []),
      helperService.getUnits().catch(() => []),
      itemService.getItemStatus().catch(() => []),
    ]);

  // إنشاء صنف فارغ
  const emptyItem: ItemForm & { item_img_url?: string | null } = {
    id: 0,
    item_name: "",
    item_name_e: "",
    item_price: "0.00",
    item_img: null,
    item_code: "0000000000000",
    item_barcode: "",
    first_cost: "0.00",
    item_weight: "0.00",
    item_g_weight: "0.00",
    stones: "0.00",
    model: "",
    k: "0.00",
    purity: "0.00",
    item_status: 1,
    cr_date: "",
    cr_user: "",
    upd_date: "",
    upd_user: "",
    cat: null,
    item_type: null,
    unit: null,
    com: companyId,
    item_img_url: null,
  };

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "الأصناف", href: "/basic/items" },
          { name: "إضافة صنف جديد" },
        ]}
      />
      <ItemFormClient
        categories={categoriesData}
        companyId={companyId}
        initialItem={emptyItem}
        itemTypes={itemTypesData}
        mode="add"
        units={unitsData}
        itemStatus={itemStatusData}
      />
    </div>
  );
}
