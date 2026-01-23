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
import { getBranchParams } from "@/app/actions/branch-params";

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

// خدمات مساعدة لمعالجة البيانات
// Helper to ensure data is an array
const ensureArray = (data: any) => (Array.isArray(data) ? data : []);

const extractData = (response: any) => {
  return response?.success && Array.isArray(response?.data)
    ? response.data
    : [];
};

const filterAccounts = (response: any) => {
  return ensureArray(response).filter(
    (account: any) => account.acc_level === 5,
  );
};

const processItems = (response: any) => {
  if (Array.isArray(response?.results)) {
    return response.results;
  }

  return ensureArray(response);
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

    return {
      accounts: filterAccounts(accountsResponse),
      costCenters: ensureArray(costCentersResponse),
      voucherTypes: extractData(voucherTypesResponse),
      voucherStatuses: extractData(voucherStagesResponse),
      caratTypes: extractData(caratTypesResponse),
    };
  },
);

const getVoucherFormData = cache(
  async (options: VoucherFormDataOptions = {}): Promise<VoucherFormData> => {
    const useGoldBoxes = options.goldBoxes ?? false;
			const { com } = await getBranchParams();

    const [
      accountsResponse,
      costCentersResponse,
      voucherTypesResponse,
      voucherStagesResponse,
      caratTypesResponse,
      boxesResponse,
      itemsResponse,
      customersResponse,
      categoriesResponse,
    ] = await Promise.all([
      accountService.getAllAccounts(),
      costCenterService.getAllCostCenters(),
      voucherService.getVoucherTypes({ com, year: "1" }),
      voucherService.getVoucherStages({ com, year: "1" }),
      voucherService.getCaratTypes(),
      boxesService.getBoxes({ xcom_id: com }),
      itemService.searchItems({ companyId: com, page: 1 }),
      customerService.getAllCustomers({ xcom_id: Number(com) }),
      categoryService.getAllCategories(),
    ]);

    // Handle Optional gold boxes independently to avoid complicating the Promise.all array order
    let goldBoxesResponse = null;

    if (useGoldBoxes) {
      goldBoxesResponse = await boxesService.getGoldBoxes({ xcom_id: 1 });
    }

    return {
      accounts: filterAccounts(accountsResponse),
      costCenters: ensureArray(costCentersResponse),
      voucherTypes: extractData(voucherTypesResponse),
      voucherStatuses: extractData(voucherStagesResponse),
      caratTypes: extractData(caratTypesResponse),
      boxes: ensureArray(boxesResponse),
      goldBoxes: useGoldBoxes ? ensureArray(goldBoxesResponse) : undefined,
      items: processItems(itemsResponse),
      customers: ensureArray(customersResponse),
      categories: ensureArray(categoriesResponse),
    };
  },
);

export default {
  getVoucherFormData,
  getBalanceVoucherFormData,
};
