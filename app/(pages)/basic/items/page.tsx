import type { Category, ItemType, Unit } from "@/types/items";

import { Metadata } from "next";

import ItemsClient from "./components/ItemsClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import helperService from "@/services/api/helper.service";
import itemService from "@/services/api/item.service";
import { Item } from "@/types/models/item";
import { IPaginatedResponse } from "@/types/services/base";

export const metadata: Metadata = {
  title: "الأصناف",
  description: "إدارة الأصناف",
};

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pageParam = params.page;
  const categoryParam = params.category;
  const itemTypeParam = params.itemType;
  const statusParam = params.status;

  const currentPage =
    Number(Array.isArray(pageParam) ? pageParam[0] : pageParam) || 1;
  const categoryId = Array.isArray(categoryParam)
    ? categoryParam[0] || "0"
    : categoryParam || "0";
  const itemTypeId = Array.isArray(itemTypeParam)
    ? itemTypeParam[0] || "0"
    : itemTypeParam || "0";
  const itemStatus =
    statusParam === "active"
      ? "1"
      : statusParam === "inactive"
        ? "2"
        : "0";

  const branchParams = await getBranchParams();
  const parsedCompanyId = Number(branchParams.com ?? "1");
  const companyId =
    Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
      ? parsedCompanyId
      : 1;

  // حساب صفحة API بناءً على صفحة الجدول
  // كل صفحتين من الجدول (10 أصناف لكل صفحة) = صفحة واحدة من API (20 صنف)
  const itemsPerTablePage = 10;
  const itemsPerApiPage = 20;
  const apiPage = Math.ceil(currentPage / 2);

  // جلب البيانات من API مع الفلاتر
  const itemsData = await itemService
    .searchItems({
      page: apiPage,
      companyId,
      categoryId: categoryId || "0",
      itemTypeId: itemTypeId || "0",
      itemStatus: itemStatus || "0",
    })
    .catch(
      (): IPaginatedResponse<Item> => ({
        count: 0,
        next: null,
        previous: null,
        results: [],
      }),
    );

  const [categoriesData, itemTypesData, unitsData] = await Promise.all([
    helperService.getCategories(companyId).catch(() => []),
    helperService.getItemTypes().catch(() => []),
    helperService.getUnits().catch(() => []),
  ]);

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-2">الأصناف</h1>

      <ItemsClient
        companyId={companyId}
        currentPage={currentPage}
        initialCategories={categoriesData as Category[]}
        initialItemTypes={itemTypesData as ItemType[]}
        initialItems={itemsData.results as Item[]}
        initialQuery=""
        initialUnits={unitsData as Unit[]}
        totalItems={itemsData.count}
        totalPages={itemsData.count > 0 ? Math.ceil(itemsData.count / 20) : 0}
      />
    </div>
  );
}
