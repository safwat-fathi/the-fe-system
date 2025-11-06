"use server";

import { revalidateTag } from "next/cache";

import categoryAccountService from "@/services/api/cat-account.service";
import {
  CategoryAccount,
  UpsertCategoryAccountPayload,
} from "@/types/models/category-account";

type GetCategoryAccountsOptions = {
  companyId: number | string;
  categoryId?: number | string;
};

type SaveCategoryAccountOptions = {
  id?: number;
  companyId: number | string;
  categoryId: number | string;
  payload: Omit<
    UpsertCategoryAccountPayload,
    "com" | "cat"
  >;
};

export async function getCategoryAccountsAction({
  companyId,
  categoryId,
}: GetCategoryAccountsOptions): Promise<CategoryAccount[]> {
  const resolvedCompany = companyId ?? 1;
  const resolvedCategory = categoryId ?? 0;

  return categoryAccountService.getCategoryAccounts(
    resolvedCompany,
    resolvedCategory,
  );
}

export async function saveCategoryAccountAction({
  id,
  companyId,
  categoryId,
  payload,
}: SaveCategoryAccountOptions): Promise<CategoryAccount | null> {
  const data: UpsertCategoryAccountPayload = {
    com: String(companyId ?? "1"),
    cat: String(categoryId ?? "0"),
    ...payload,
  };

  const result = id
    ? await categoryAccountService.updateCategoryAccount(id, data)
    : await categoryAccountService.createCategoryAccount(data);

  if (result) {
    revalidateTag("category-accounts");
    revalidateTag(`category-accounts-com-${data.com}`);
    revalidateTag(`category-accounts-cat-${data.cat}`);
  }

  return result;
}

export async function deleteCategoryAccountAction(
  id: number,
  companyId: number | string,
  categoryId: number | string,
): Promise<boolean> {
  const success = await categoryAccountService.deleteCategoryAccount(id);

  if (success) {
    revalidateTag("category-accounts");
    revalidateTag(`category-accounts-com-${companyId}`);
    revalidateTag(`category-accounts-cat-${categoryId}`);
  }

  return success;
}

