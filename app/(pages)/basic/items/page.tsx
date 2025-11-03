import type { Category, ItemType, Unit } from "@/types/items";

import { Metadata } from "next";

import ItemsClient from "./components/ItemsClient";

import AppPagination from "@/components/AppPagination";
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
  const searchParam = params.search;

  const currentPage =
    Number(Array.isArray(pageParam) ? pageParam[0] : pageParam) || 1;
  const searchQuery = Array.isArray(searchParam)
    ? searchParam[0] || ""
    : searchParam || "";

  const branchParams = await getBranchParams();
  const parsedCompanyId = Number(branchParams.com ?? "1");
  const companyId =
    Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
      ? parsedCompanyId
      : 1;

  const [itemsData, categoriesData, itemTypesData, unitsData] =
    await Promise.all([
      itemService
        .searchItems({ page: currentPage, query: searchQuery, companyId })
        .catch(
          (): IPaginatedResponse<Item> => ({
            count: 0,
            next: null,
            previous: null,
            results: [],
          }),
        ),
      helperService.getCategories().catch(() => []),
      helperService.getItemTypes().catch(() => []),
      helperService.getUnits().catch(() => []),
    ]);

  console.log("🚀 ~ :55 ~ ItemsPage ~ itemsData:", itemsData);

  const itemsPerPage =
    itemsData.results.length > 0 ? itemsData.results.length : 20;
  const totalPages =
    itemsData.count > 0 ? Math.ceil(itemsData.count / itemsPerPage) : 0;

  return (
    <div className="responsive-container font-cairo">
      <h1 className="responsive-text-xl font-bold mb-6">الأصناف</h1>

      <ItemsClient
        companyId={companyId}
        currentPage={currentPage}
        initialCategories={categoriesData as Category[]}
        initialItemTypes={itemTypesData as ItemType[]}
        initialItems={itemsData.results as Item[]}
        initialQuery={searchQuery}
        initialUnits={unitsData as Unit[]}
        totalItems={itemsData.count}
        totalPages={totalPages}
      />

      <AppPagination total={totalPages} />
    </div>
  );
}
