import { cache } from "react";

import {
  voucherService,
  accountService,
  costCenterService,
  taxRateService,
  boxesService,
  itemService,
  customerService,
} from "@/services/api";

export interface VoucherFormData {
  accounts: any[];
  costCenters: any[];
  voucherTypes: any[];
  voucherStatuses: any[];
  caratTypes: any[];
  taxRates: number[];
  boxes: any[];
  items?: any[];
  customers?: any[];
}

const getVoucherFormData = cache(async (): Promise<VoucherFormData> => {
  const [
    accountsResponse,
    costCentersResponse,
    voucherTypesResponse,
    voucherStagesResponse,
    caratTypesResponse,
    taxRates,
    boxesResponse,
    itemsResponse,
    customersResponse,
  ] = await Promise.all([
    accountService.getAllAccounts(),
    costCenterService.getAllCostCenters(),
    voucherService.getVoucherTypes({ com: "1", year: "1" }),
    voucherService.getVoucherStages({ com: "1", year: "1" }),
    voucherService.getCaratTypes(),
    taxRateService.getTaxRates(),
    boxesService.getBoxes({ xcom_id: 1 }),
    itemService.searchItems({ companyId: 1 }),
    customerService.getAllCustomers({ xcom_id: 1 }),
  ]);

  // معالجة الحسابات
  let accounts: any[] = [];

  if (accountsResponse && Array.isArray(accountsResponse)) {
    accounts = accountsResponse.filter(
      (account: any) => account.acc_level === 5,
    );
    console.log("Accounts loaded:", accounts.length);
  } else {
    console.warn("Accounts API returned no data");
  }

  // معالجة مراكز التكلفة
  let costCenters: any[] = [];

  if (costCentersResponse && Array.isArray(costCentersResponse)) {
    costCenters = costCentersResponse;
    console.log("Cost Centers loaded:", costCenters.length);
  } else {
    console.warn("Cost Centers API returned no data");
  }

  // معالجة أنواع السندات
  let voucherTypes: any[] = [];

  if (voucherTypesResponse.success && voucherTypesResponse.data) {
    voucherTypes = Array.isArray(voucherTypesResponse.data)
      ? voucherTypesResponse.data
      : [];
    console.log("Voucher Types loaded:", voucherTypes.length);
    console.log("Voucher Types data:", voucherTypes);
  } else {
    console.warn("Voucher Types API returned no data");
    console.log("Voucher Types response:", voucherTypesResponse);
  }

  // معالجة حالات السندات
  let voucherStatuses = [];

  if (voucherStagesResponse.success && voucherStagesResponse.data) {
    voucherStatuses = Array.isArray(voucherStagesResponse.data)
      ? voucherStagesResponse.data
      : [];
    console.log("Voucher Statuses loaded:", voucherStatuses.length);
    console.log("Voucher Statuses data:", voucherStatuses);
  } else {
    console.warn("Voucher Statuses API returned no data");
    console.log("Voucher Statuses response:", voucherStagesResponse);
  }

  // معالجة أنواع المعايرة
  let caratTypes: any[] = [];

  if (caratTypesResponse.success && caratTypesResponse.data) {
    caratTypes = Array.isArray(caratTypesResponse.data)
      ? caratTypesResponse.data
      : [];
    console.log("Carat Types loaded:", caratTypes.length);
  } else {
    console.warn("Carat Types API returned no data");
  }

  // معالجة نسب الضرائب
  const taxRatesList = Array.isArray(taxRates) ? taxRates : [];

  console.log("Tax Rates loaded:", taxRatesList.length);

  // معالجة الصناديق
  const boxes = Array.isArray(boxesResponse) ? boxesResponse : [];

  console.log("Boxes loaded:", boxes.length);

  // معالجة الأصناف
  let items: any[] = [];

  if (itemsResponse && itemsResponse.results) {
    items = Array.isArray(itemsResponse.results)
      ? itemsResponse.results
      : [];
    console.log("Items loaded:", items.length);
  } else if (Array.isArray(itemsResponse)) {
    items = itemsResponse;
    console.log("Items loaded:", items.length);
  } else {
    console.warn("Items API returned no data");
  }

  // معالجة العملاء
  let customers: any[] = [];

  if (customersResponse && Array.isArray(customersResponse)) {
    customers = customersResponse;
    console.log("Customers loaded:", customers.length);
  } else {
    console.warn("Customers API returned no data");
  }

  return {
    accounts,
    costCenters,
    voucherTypes,
    voucherStatuses,
    caratTypes,
    taxRates: taxRatesList,
    boxes,
    items,
    customers,
  };
});

export default {
  getVoucherFormData,
};
