import type { Category, ItemType, Unit } from "@/types/items";

import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import ItemsClient from "./components/ItemsClient";
import ItemsFilter from "./components/ItemsFilter";
import ItemsFallback from "./components/ItemsFallback";

import { AuthenticationError } from "@/utilities/errors/Authentication";
import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import helperService from "@/services/api/helper.service";
import itemService from "@/services/api/item.service";
import { Item } from "@/types/models/item";
import { IPaginatedResponse } from "@/types/services/base";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getTranslations("basic.items" as any)) as any;

  return {
    title: `${t("labels.pageTitle")} - NafeesWeb`,
    description: t("labels.pageTitle"),
  };
}

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
  const searchParam = params.search;

  const currentPage =
    Number(Array.isArray(pageParam) ? pageParam[0] : pageParam) || 1;
  const categoryId = Array.isArray(categoryParam)
    ? categoryParam[0] || "0"
    : categoryParam || "0";
  const itemTypeId = Array.isArray(itemTypeParam)
    ? itemTypeParam[0] || "0"
    : itemTypeParam || "0";
  const getItemStatus = (status: string | string[] | undefined): string => {
    const s = Array.isArray(status) ? status[0] : status;

    if (s === "active") return "1";
    if (s === "inactive") return "2";

    return "0";
  };
  const itemStatus = getItemStatus(statusParam);
  const searchTerm =
    (Array.isArray(searchParam) ? searchParam[0] : searchParam) || "";

  const branchParams = await getBranchParams();
  const parsedCompanyId = Number(branchParams.com ?? "1");
  const companyId =
    Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
      ? parsedCompanyId
      : 1;

  // حساب صفحة API بناءً على صفحة الجدول
  // كل صفحة من الجدول (20 صنف لكل صفحة) = صفحة واحدة من API (20 صنف)

  // جلب البيانات من API مع الفلاتر

  let itemsData: IPaginatedResponse<Item>;

  let categoriesData: Category[] = [];
  let itemTypesData: ItemType[] = [];
  let unitsData: Unit[] = [];

  try {
    [categoriesData, itemTypesData, unitsData, itemsData] = await Promise.all([
      helperService.getCategories(companyId).catch(() => []),
      helperService.getItemTypes().catch(() => []),
      helperService.getUnits().catch(() => []),
      itemService.searchItems({
        page: currentPage,
        categoryId: categoryId || "0",
        itemTypeId: itemTypeId || "0",
        itemStatus: itemStatus || "0",
        searchTerm: searchTerm,
      }),
    ]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/auth/login");
    }
    throw error;
  }

  const t = (await getTranslations("basic.items" as any)) as any;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] font-cairo p-2">
      <div className="flex-shrink-0 mb-1">
        <Breadcrumb />
        <h1 className="text-lg font-bold">{t("labels.pageTitle")}</h1>
      </div>
      <ItemsFilter
        categories={categoriesData as Category[]}
        itemTypes={itemTypesData as ItemType[]}
        units={unitsData as Unit[]}
      />
      <Suspense
        key={JSON.stringify({
          companyId,
          categoryId,
          itemTypeId,
          itemStatus,
          searchTerm,
          currentPage,
        })}
        fallback={<ItemsFallback />}
      >
        <ItemsClient
          companyId={companyId}
          initialCategories={categoriesData as Category[]}
          initialItemTypes={itemTypesData as ItemType[]}
          initialItems={itemsData.results as Item[]}
          totalItems={itemsData.count}
          currentPage={currentPage}
          initialQuery={searchTerm}
          totalPages={itemsData.count > 0 ? Math.ceil(itemsData.count / 20) : 0}
        />
      </Suspense>
    </div>
  );
}
