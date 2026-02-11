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

import { Voucher, VoucherDetail } from "@/types/voucher";
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

    console.log("voucherStagesResult", voucherStagesResult);

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

// Helper to parse navigation IDs
const parseNavId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export interface VoucherWithDetails {
  voucher: Voucher | null;
  details: VoucherDetail[];
  navigationInfo: {
    previous: number | null;
    next: number | null;
    first: number | null;
    last: number | null;
    vouchersCount: number | null;
  };
}

const getVoucherById = cache(
  async (voucherId: number): Promise<Voucher | null> => {
    try {
      if (!voucherId || isNaN(voucherId)) {
        return null;
      }

      // Adjustment voucher type
      const ADJUSTMENT_VOUCHER_TYPE = "3";

      const vouchersResponse = await voucherService.getAll({
        xvouch_type: ADJUSTMENT_VOUCHER_TYPE,
      });

      if (!vouchersResponse.success || !vouchersResponse.data) {
        return null;
      }

      const vouchers = ensureArray<any>(vouchersResponse.data);

      const foundVoucher = vouchers.find(
        (v) => v.id === voucherId || v.vouch_id === voucherId,
      );

      return foundVoucher || null;
    } catch (error) {
      console.error("Error fetching voucher:", error);

      return null;
    }
  },
);

const getVoucherDetails = cache(
  async (
    voucherId: number,
    branchId?: number | string,
  ): Promise<VoucherDetail[]> => {
    try {
      if (!voucherId || isNaN(voucherId)) {
        return [];
      }

      const parsedBranchId = Number(branchId ?? 1) || 1;

      const detailsResponse = await voucherService.getDetails(voucherId, {
        xcom_id: parsedBranchId,
      });

      if (!detailsResponse.success || !detailsResponse.data) {
        return [];
      }

      return ensureArray<VoucherDetail>(detailsResponse.data);
    } catch (error) {
      console.error("Error fetching voucher details:", error);

      return [];
    }
  },
);

const getVoucherWithDetails = async (
  voucherId: number,
  formData: VoucherFormData,
): Promise<VoucherWithDetails> => {
  const voucher = await getVoucherById(voucherId);

  if (!voucher) {
    return {
      voucher: null,
      details: [],
      navigationInfo: {
        previous: null,
        next: null,
        first: null,
        last: null,
        vouchersCount: null,
      },
    };
  }

  const branchId = Number(voucher.com_id ?? voucher.com ?? 1) || 1;
  const resolvedVoucherId = voucher.id ?? 0;

  // Fetch details
  const detailsData = await getVoucherDetails(resolvedVoucherId, branchId);

  // Normalize cost helper
  const normalizeCost = (value: unknown): number | undefined => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }
    const numeric = Number(value);

    return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
  };

  const resolvedVoucherCost =
    normalizeCost(voucher.cost_id) ??
    normalizeCost((voucher as any).cost) ??
    null;

  // Process details
  const details: VoucherDetail[] = detailsData.map((detail: any) => {
    const account = formData.accounts.find(
      (acc: any) => acc.id === (detail.acc_id || detail.acc),
    );

    let costId: number | undefined = undefined;

    if (detail.hasOwnProperty("cost")) {
      if (
        detail.cost !== null &&
        detail.cost !== undefined &&
        detail.cost !== ""
      ) {
        costId = Number(detail.cost);
      }
    } else if (detail.hasOwnProperty("cost_id")) {
      if (
        detail.cost_id !== null &&
        detail.cost_id !== undefined &&
        detail.cost_id !== ""
      ) {
        costId = Number(detail.cost_id);
      }
    }

    return {
      id: detail.id || 0,
      vouch_id: voucher.vouch_id || 0,
      acc_id: detail.acc_id || detail.acc || 0,
      acc_code: (account as any)?.acc_code || detail.acc_code || "",
      acc_name: (account as any)?.acc_name || detail.acc_name || "",
      cost_id: costId,
      debit: parseFloat(detail.debit) || 0,
      credit: parseFloat(detail.credit) || 0,
      debit_base:
        detail.debit_base !== undefined
          ? parseFloat(String(detail.debit_base))
          : parseFloat(detail.debit) || 0,
      credit_base:
        detail.credit_base !== undefined
          ? parseFloat(String(detail.credit_base))
          : parseFloat(detail.credit) || 0,
      g_debit:
        detail.g_debit !== undefined
          ? parseFloat(String(detail.g_debit))
          : parseFloat(detail.debit_g) || 0,
      g_credit:
        detail.g_credit !== undefined
          ? parseFloat(String(detail.g_credit))
          : parseFloat(detail.credit_g) || 0,
      g_debit_base:
        detail.g_debit_base !== undefined
          ? parseFloat(String(detail.g_debit_base))
          : 0,
      g_credit_base:
        detail.g_credit_base !== undefined
          ? parseFloat(String(detail.g_credit_base))
          : 0,
      gauge: parseFloat(detail.gauge) || 875,
      tax: parseFloat(detail.tax) || 0,
      tax_prc: parseFloat(detail.tax_prc) || 0,
      vat_no: parseInt(detail.vat_no) || 0,
      vouch_notes: detail.vouch_notes || "",
      cr_date: detail.cr_date || new Date().toISOString(),
    };
  });

  const formattedVoucher: Voucher = {
    ...voucher,
    vouch_date: voucher.vouch_date || new Date().toISOString(),
    cr_date: voucher.cr_date || new Date().toISOString(),
    vouch_id: voucher.vouch_id || 0,
    vouch_amt: voucher.vouch_amt || 0,
    ref_no: voucher.ref_no || "",
    vouch_notes: voucher.vouch_notes || "",
    vouch_status: voucher.vouch_status || 1,
    pay_type: voucher.pay_type || 1,
    commit: voucher.commit || false,
    post: voucher.post || false,
    print: voucher.print || false,
    cost_id: resolvedVoucherCost,
  };

  const navigationInfo = {
    previous: parseNavId(
      (voucher as any).previous_voucher_id ?? (voucher as any).previous,
    ),
    next: parseNavId((voucher as any).next_voucher_id ?? (voucher as any).next),
    first: parseNavId(
      (voucher as any).first_voucher_id ?? (voucher as any).first,
    ),
    last: parseNavId((voucher as any).last_voucher_id ?? (voucher as any).last),
    vouchersCount: (voucher as any).vouchers_count ?? null,
  };

  return {
    voucher: formattedVoucher,
    details,
    navigationInfo,
  };
};

export default {
  getVoucherFormData,
  getBalanceVoucherFormData,
  getVoucherWithDetails,
};
