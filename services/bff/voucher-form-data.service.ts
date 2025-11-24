import { cache } from "react";

import {
  voucherService,
  accountService,
  costCenterService,
  boxesService,
  itemService,
  customerService,
  categoryService,
} from "@/services/api";

export interface VoucherFormData {
  accounts: any[];
  costCenters: any[];
  voucherTypes: any[];
  voucherStatuses: any[];
  caratTypes: any[];
  boxes: any[];
  goldBoxes?: any[];
  items?: any[];
  customers?: any[];
  categories?: any[];
}

type VoucherFormDataOptions = {
  goldBoxes?: boolean;
};

// خدمة محسّنة للقيد الافتتاحي - تجلب البيانات الضرورية فقط
const getBalanceVoucherFormData = cache(
  async (): Promise<Omit<VoucherFormData, "items" | "customers" | "boxes">> => {
    const [
      accountsResponse,
      costCentersResponse,
      voucherTypesResponse,
      voucherStagesResponse,
      caratTypesResponse,
    ] = await Promise.all([
      accountService.getAllAccounts(),
      costCenterService.getAllCostCenters(),
      voucherService.getVoucherTypes({ com: "1", year: "1" }),
      voucherService.getVoucherStages({ com: "1", year: "1" }),
      voucherService.getCaratTypes(),
    ]);

    // معالجة الحسابات
    let accounts: any[] = [];

    if (accountsResponse && Array.isArray(accountsResponse)) {
      accounts = accountsResponse.filter(
        (account: any) => account.acc_level === 5,
      );
    }

    // معالجة مراكز التكلفة
    const costCenters = Array.isArray(costCentersResponse)
      ? costCentersResponse
      : [];

    // معالجة أنواع السندات
    const voucherTypes =
      voucherTypesResponse.success && voucherTypesResponse.data
        ? Array.isArray(voucherTypesResponse.data)
          ? voucherTypesResponse.data
          : []
        : [];

    // معالجة حالات السندات
    const voucherStatuses =
      voucherStagesResponse.success && voucherStagesResponse.data
        ? Array.isArray(voucherStagesResponse.data)
          ? voucherStagesResponse.data
          : []
        : [];

    // معالجة أنواع المعايرة
    const caratTypes =
      caratTypesResponse.success && caratTypesResponse.data
        ? Array.isArray(caratTypesResponse.data)
          ? caratTypesResponse.data
          : []
        : [];

    return {
      accounts,
      costCenters,
      voucherTypes,
      voucherStatuses,
      caratTypes,
      boxes: [], // فارغ للقيد الافتتاحي
    };
  },
);

const getVoucherFormData = cache(
  async (options: VoucherFormDataOptions = {}): Promise<VoucherFormData> => {
    const useGoldBoxes = options.goldBoxes ?? false;

    const boxesPromise = boxesService.getBoxes({ xcom_id: 1 });
    const goldBoxesPromise = useGoldBoxes
      ? boxesService.getGoldBoxes({ xcom_id: 1 })
      : Promise.resolve(null);

    const [
      accountsResponse,
      costCentersResponse,
      voucherTypesResponse,
      voucherStagesResponse,
      caratTypesResponse,
      boxesResponse,
      goldBoxesResponse,
      itemsResponse,
      customersResponse,
      categoriesResponse,
    ] = await Promise.all([
      accountService.getAllAccounts(),
      costCenterService.getAllCostCenters(),
      voucherService.getVoucherTypes({ com: "1", year: "1" }),
      voucherService.getVoucherStages({ com: "1", year: "1" }),
      voucherService.getCaratTypes(),
      boxesPromise,
      goldBoxesPromise,
      itemService.searchItems({ companyId: 1 }),
      customerService.getAllCustomers({ xcom_id: 1 }),
      categoryService.getAllCategories(1),
    ]);

    // معالجة الحسابات
    let accounts: any[] = [];

    if (accountsResponse && Array.isArray(accountsResponse)) {
      accounts = accountsResponse.filter(
        (account: any) => account.acc_level === 5,
      );
    }

    // معالجة مراكز التكلفة
    const costCenters = Array.isArray(costCentersResponse)
      ? costCentersResponse
      : [];

    // معالجة أنواع السندات
    const voucherTypes =
      voucherTypesResponse.success && voucherTypesResponse.data
        ? Array.isArray(voucherTypesResponse.data)
          ? voucherTypesResponse.data
          : []
        : [];

    // معالجة حالات السندات
    const voucherStatuses =
      voucherStagesResponse.success && voucherStagesResponse.data
        ? Array.isArray(voucherStagesResponse.data)
          ? voucherStagesResponse.data
          : []
        : [];

    // معالجة أنواع المعايرة
    const caratTypes =
      caratTypesResponse.success && caratTypesResponse.data
        ? Array.isArray(caratTypesResponse.data)
          ? caratTypesResponse.data
          : []
        : [];

    // معالجة الصناديق
    const boxes = Array.isArray(boxesResponse) ? boxesResponse : [];
    const goldBoxes =
      useGoldBoxes && Array.isArray(goldBoxesResponse)
        ? goldBoxesResponse
        : undefined;

    // معالجة الأصناف
    let items: any[] = [];

    if (itemsResponse && itemsResponse.results) {
      items = Array.isArray(itemsResponse.results) ? itemsResponse.results : [];
    } else if (Array.isArray(itemsResponse)) {
      items = itemsResponse;
    }

    // معالجة العملاء
    const customers = Array.isArray(customersResponse) ? customersResponse : [];
    const categories = Array.isArray(categoriesResponse)
      ? categoriesResponse
      : [];

    return {
      accounts,
      costCenters,
      voucherTypes,
      voucherStatuses,
      caratTypes,
      boxes,
      goldBoxes,
      items,
      customers,
      categories,
    };
  },
);

export default {
  getVoucherFormData,
  getBalanceVoucherFormData,
};
