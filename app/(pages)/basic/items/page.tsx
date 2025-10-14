import { Metadata } from "next";
import itemService from "@/services/api/item.service";
import helperService from "@/services/api/helper.service";
import ItemsClient from "./components/ItemsClient";

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
    itemService.getAllItems().catch(() => []),
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
        initialItems={itemsData as any}
        initialCategories={categoriesData as any}
        initialItemTypes={itemTypesData as any}
        initialUnits={unitsData as any}
        initialBoxes={boxesData as any}
        initialCatTypes={catTypesData as any}
        initialCatStatuses={catStatusesData as any}
      />
    </div>
  );
}
