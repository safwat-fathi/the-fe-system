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
    voucherService.getVoucherTypes(),
    voucherService.getVoucherStages(),
  ]);

  // معالجة الحسابات
  let accounts = [];
  if (accountsResponse && Array.isArray(accountsResponse)) {
    accounts = accountsResponse.filter((account: any) => account.acc_level === 5);
  }

  // معالجة مراكز التكلفة
  let costCenters = [];
  if (costCentersResponse && Array.isArray(costCentersResponse)) {
    costCenters = costCentersResponse;
  }

  // معالجة أنواع السندات
  let voucherTypes = [];
  if (voucherTypesResponse.success && voucherTypesResponse.data) {
    voucherTypes = Array.isArray(voucherTypesResponse.data)
      ? voucherTypesResponse.data
      : [];
  }

  // معالجة حالات السندات
  let voucherStatuses = [];
  if (voucherStagesResponse.success && voucherStagesResponse.data) {
    voucherStatuses = Array.isArray(voucherStagesResponse.data)
      ? voucherStagesResponse.data
      : [];
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
