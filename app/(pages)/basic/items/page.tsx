import { Metadata } from "next";

import ItemsClient from "./components/ItemsClient";

import AppPagination from "@/components/AppPagination";
import helperService from "@/services/api/helper.service";
import itemService from "@/services/api/item.service";
import { Item } from "@/types/models/item";
import { IPaginatedResponse } from "@/types/services/base";

type Category = {
  id: number;
  cat_name: string;
};

type ItemType = {
  id: number;
  type_name: string;
};

export const metadata: Metadata = {
  title: "الأصناف - NafeesWeb",
  description: "إدارة الأصناف والمنتجات",
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

  const [itemsData, categoriesData, itemTypesData] = await Promise.all([
    itemService.searchItems({ page: currentPage, query: searchQuery }).catch(
      (): IPaginatedResponse<Item> => ({
        count: 0,
        next: null,
        previous: null,
        results: [],
      }),
    ),
    helperService.getCategories().catch(() => []),
    helperService.getItemTypes().catch(() => []),
  ]);

  const itemsPerPage =
    itemsData.results.length > 0 ? itemsData.results.length : 20;
  const totalPages =
    itemsData.count > 0 ? Math.ceil(itemsData.count / itemsPerPage) : 0;

  return (
    <div className="responsive-container font-cairo">
      <h1 className="responsive-text-xl font-bold mb-6">الأصناف</h1>

      <ItemsClient
        currentPage={currentPage}
        initialCategories={categoriesData as Category[]}
        initialItemTypes={itemTypesData as ItemType[]}
        initialItems={itemsData.results as Item[]}
        initialQuery={searchQuery}
        totalItems={itemsData.count}
        totalPages={totalPages}
      />

      <AppPagination total={totalPages} />
    </div>
  );
}
