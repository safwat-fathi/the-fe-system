
import type {
  VoucherFormData,
  VoucherFormDataOptions,
  BalanceVoucherFormData,
  VoucherType,
  VoucherStatus,
  CaratType,
} from "@/types/voucher-form";
import type { Account } from "@/types/models/account";
import type { Box } from "@/types/models/box";
import type { Item } from "@/types/models/item";
import type { Customer } from "@/types/models/customer";
import type { Category } from "@/types/items";

import { cache } from "react";

import { getBranchParams } from "@/app/actions/branch-params";
import {
  voucherService,
  accountService,
  costCenterService,
  boxesService,
  itemService,
  customerService,
  categoryService,
} from "@/services/api";

// Re-export types for consumers
export type { VoucherFormData, VoucherFormDataOptions, BalanceVoucherFormData };

// خدمات مساعدة لمعالجة البيانات
// Helper to ensure data is an array
const ensureArray = <T>(data: unknown): T[] =>
  Array.isArray(data) ? data : [];

const extractData = <T>(response: { success?: boolean; data?: T[] }): T[] => {
  return response?.success && Array.isArray(response?.data)
    ? response.data
    : [];
};

const filterAccounts = (response: unknown): Account[] => {
  return ensureArray<Account>(response).filter(
    (account) => account.acc_level === 5,
  );
};

const processItems = (response: { results?: Item[] } | unknown): Item[] => {
  if (
    typeof response === "object" &&
    response !== null &&
    "results" in response &&
    Array.isArray((response as { results?: Item[] }).results)
  ) {
    return (response as { results: Item[] }).results;
  }

  return ensureArray<Item>(response);
};

// Type for Promise.allSettled result handling
type SettledResult<T> = PromiseSettledResult<T>;

const getSettledValue = <T>(result: SettledResult<T>, fallback: T): T => {
  return result.status === "fulfilled" ? result.value : fallback;
};

// خدمة محسّنة للقيد الافتتاحي - تجلب البيانات الضرورية فقط
const getBalanceVoucherFormData = cache(
  async (): Promise<BalanceVoucherFormData> => {
    const { com } = await getBranchParams();

    const results = await Promise.allSettled([
      accountService.getAllAccounts(),
      costCenterService.getAllCostCenters(),
      voucherService.getVoucherTypes({ com, year: "1" }),
      voucherService.getVoucherStages({ com, year: "1" }),
      voucherService.getCaratTypes(),
    ]);

    const [
      accountsResult,
      costCentersResult,
      voucherTypesResult,
      voucherStagesResult,
      caratTypesResult,
    ] = results;

    return {
      accounts: filterAccounts(getSettledValue(accountsResult, [])),
      costCenters: ensureArray(getSettledValue(costCentersResult, [])),
      voucherTypes: extractData<VoucherType>(
        getSettledValue(voucherTypesResult, { success: false, data: [] }),
      ),
      voucherStatuses: extractData<VoucherStatus>(
        getSettledValue(voucherStagesResult, { success: false, data: [] }),
      ),
      caratTypes: extractData<CaratType>(
        getSettledValue(caratTypesResult, { success: false, data: [] }),
      ),
    };
  },
);

const getVoucherFormData = cache(
  async (options: VoucherFormDataOptions = {}): Promise<VoucherFormData> => {
    const {
      goldBoxes: useGoldBoxes = false,
      includeItems = true,
      includeCustomers = true,
      includeCategories = true,
    } = options;

    const { com } = await getBranchParams();

    // Build dynamic promise array based on options
    const results = await Promise.allSettled([
      accountService.getAllAccounts(),
      costCenterService.getAllCostCenters(),
      voucherService.getVoucherTypes({ com, year: "1" }),
      voucherService.getVoucherStages({ com, year: "1" }),
      voucherService.getCaratTypes(),
      boxesService.getBoxes({ xcom_id: com }),
      // Optional data - fetch only if needed
      includeItems
        ? itemService.searchItems({ companyId: com, page: 1 })
        : Promise.resolve(null),
      includeCustomers
        ? customerService.getAllCustomers({ xcom_id: Number(com) })
        : Promise.resolve(null),
      includeCategories
        ? categoryService.getAllCategories()
        : Promise.resolve(null),
      // Gold boxes - parallel with other requests
      useGoldBoxes
        ? boxesService.getGoldBoxes({ xcom_id: Number(com) })
        : Promise.resolve(null),
    ]);

    const [
      accountsResult,
      costCentersResult,
      voucherTypesResult,
      voucherStagesResult,
      caratTypesResult,
      boxesResult,
      itemsResult,
      customersResult,
      categoriesResult,
      goldBoxesResult,
    ] = results;

    return {
      accounts: filterAccounts(getSettledValue(accountsResult, [])),
      costCenters: ensureArray(getSettledValue(costCentersResult, [])),
      voucherTypes: extractData<VoucherType>(
        getSettledValue(voucherTypesResult, { success: false, data: [] }),
      ),
      voucherStatuses: extractData<VoucherStatus>(
        getSettledValue(voucherStagesResult, { success: false, data: [] }),
      ),
      caratTypes: extractData<CaratType>(
        getSettledValue(caratTypesResult, { success: false, data: [] }),
      ),
      boxes: ensureArray<Box>(getSettledValue(boxesResult, [])),
      goldBoxes: useGoldBoxes
        ? ensureArray<Box>(getSettledValue(goldBoxesResult, []))
        : undefined,
      items: includeItems
        ? processItems(
            getSettledValue(itemsResult, {
              results: [],
              count: 0,
              next: null,
              previous: null,
            }),
          )
        : undefined,
      customers: includeCustomers
        ? ensureArray<Customer>(getSettledValue(customersResult, []))
        : undefined,
      categories: includeCategories
        ? ensureArray<Category>(getSettledValue(categoriesResult, []))
        : undefined,
    };
  },
);

export default {
  getVoucherFormData,
  getBalanceVoucherFormData,
};
