import { Metadata } from "next";

import ItemsClient from "./components/ItemsClient";

import itemService from "@/services/api/item.service";
import helperService from "@/services/api/helper.service";

export const metadata: Metadata = {
  title: "الأصناف - NafeesWeb",
  description: "إدارة الأصناف والمنتجات",
};

export default async function ItemsPage() {
  // جلب البيانات بالتوازي للأداء الأفضل
  const [
    itemsData,
    categoriesData,
    itemTypesData,
    unitsData,
    boxesData,
    catTypesData,
    catStatusesData,
  ] = await Promise.all([
    itemService.searchItems({ query: "", page: 1 }).catch(() => []),
    helperService.getCategories().catch(() => []),
    helperService.getItemTypes().catch(() => []),
    helperService.getUnits().catch(() => []),
    helperService.getBoxes().catch(() => []),
    helperService.getCatTypes().catch(() => []),
    helperService.getCatStatuses().catch(() => []),
  ]);

  return (
    <div className="responsive-container font-cairo">
      <h1 className="responsive-text-xl font-bold mb-6">الأصناف</h1>

      <ItemsClient
        initialBoxes={boxesData as any}
        initialCatStatuses={catStatusesData as any}
        initialCatTypes={catTypesData as any}
        initialCategories={categoriesData as any}
        initialItemTypes={itemTypesData as any}
        initialItems={itemsData.results as any}
        initialUnits={unitsData as any}
      />
    </div>
  );
}
