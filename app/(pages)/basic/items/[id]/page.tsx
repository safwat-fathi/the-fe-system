import { notFound } from "next/navigation";
import { Metadata } from "next";

import ItemFormClient from "../components/ItemFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import helperService from "@/services/api/helper.service";
import itemService from "@/services/api/item.service";
import { Item } from "@/types/models/item";

export const metadata: Metadata = {
  title: "عرض الصنف - NafeesWeb",
  description: "عرض وتعديل بيانات الصنف",
};

export default async function ItemDetailPage({
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

  const itemId = parseInt(id);

  // التحقق من صحة المعرف
  if (isNaN(itemId) || itemId <= 0) {
    notFound();
  }

  const branchParams = await getBranchParams();
  const parsedCompanyId = Number(branchParams.com ?? "1");
  const companyId =
    Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
      ? parsedCompanyId
      : 1;

  // جلب بيانات الصنف
  let item: Item | null = null;
  try {
    item = await itemService.getItemById(itemId, companyId);
  } catch (error) {
    console.error("Error fetching item:", error);
  }

  if (!item) {
    notFound();
  }

  // جلب البيانات الأساسية
  const [categoriesData, itemTypesData, unitsData] = await Promise.all([
    helperService.getCategories(companyId).catch(() => []),
    helperService.getItemTypes().catch(() => []),
    helperService.getUnits().catch(() => []),
  ]);

  // تحويل Item إلى ItemForm
  const itemForm = {
    id: item.id,
    item_name: item.item_name || "",
    item_name_e: item.item_name_e || "",
    item_price: String(item.item_price || "0.00"),
    item_img: null,
    item_code: item.item_code || "0000000000000",
    item_barcode: item.item_barcode || "",
    first_cost: String(item.first_cost || "0.00"),
    item_weight: String(item.item_weight || "0.00"),
    item_g_weight: String(item.item_g_weight || "0.00"),
    stones: String(item.stones || "0.00"),
    model: item.model || "",
    k: String(item.k || "0.00"),
    purity: String(item.purity || "0.00"),
    item_status: item.item_status || 1,
    cr_date: item.cr_date || "",
    cr_user: item.cr_user || "",
    upd_date: item.upd_date || "",
    upd_user: item.upd_user || "",
    cat: item.cat,
    item_type: item.item_type,
    unit: item.unit,
    com: companyId,
    item_img_url: item.item_img || null,
  };

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "الأصناف", href: "/basic/items" },
          {
            name:
              formMode === "edit"
                ? `تعديل ${item.item_name || item.item_code}`
                : `عرض ${item.item_name || item.item_code}`,
          },
        ]}
      />
      <ItemFormClient
        companyId={companyId}
        categories={categoriesData}
        initialItem={itemForm}
        itemTypes={itemTypesData}
        mode={formMode}
        units={unitsData}
      />
    </div>
  );
}

