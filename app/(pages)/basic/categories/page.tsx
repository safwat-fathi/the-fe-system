import { Metadata } from "next";

import CategoriesClient from "./components/CategoriesClient";

import Breadcrumb from "@/components/Breadcrumb";
import categoryService from "@/services/api/category.service";
import helperService from "@/services/api/helper.service";

export const metadata: Metadata = {
  title: "الفئات - NafeesWeb",
  description: "إدارة الفئات",
};

export default async function CategoriesPage() {
  // جلب البيانات بالتوازي
  const [categoriesData, boxesData] = await Promise.all([
    categoryService.getAllCategories().catch(() => []),
    helperService.getBoxes().catch(() => []),
  ]);

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">الفئات</h1>

      <CategoriesClient
        initialBoxes={boxesData as any}
        initialCategories={categoriesData as any}
      />
    </div>
  );
}
