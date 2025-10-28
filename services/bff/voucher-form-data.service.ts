import { cache } from "react";
import {
  voucherService,
  accountService,
  costCenterService,
} from "@/services/api";

export interface VoucherFormData {
  accounts: any[];
  costCenters: any[];
  voucherTypes: any[];
  voucherStatuses: any[];
}

const getVoucherFormData = cache(async (): Promise<VoucherFormData> => {
  const [
    accountsResponse,
    costCentersResponse,
    voucherTypesResponse,
    voucherStagesResponse,
  ] = await Promise.all([
    accountService.getAllAccounts(),
    costCenterService.getAllCostCenters(),
    voucherService.getVoucherTypes({ com: "1", year: "1" }),
    voucherService.getVoucherStages({ com: "1", year: "1" }),
  ]);

  // معالجة الحسابات
  let accounts: any[] = [];
  if (accountsResponse && Array.isArray(accountsResponse)) {
    accounts = accountsResponse.filter((account: any) => account.acc_level === 5);
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

  return {
    accounts,
    costCenters,
    voucherTypes,
    voucherStatuses,
  };
});

export default {
  getVoucherFormData,
};
