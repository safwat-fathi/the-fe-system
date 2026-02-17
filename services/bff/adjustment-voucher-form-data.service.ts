import type { Account } from "@/types/models/account";
import type {
  VoucherType,
  VoucherStatus,
  CaratType,
  CostCenter,
} from "@/types/voucher-form";

import { Voucher, VoucherDetail } from "@/types/voucher";
import { HttpService } from "@/services/base";
import {
  voucherService,
  accountService,
  costCenterService,
} from "@/services/api";
import { getBranchParams } from "@/app/actions/branch-params";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

export interface AdjustmentVoucherFormData {
  accounts: Account[];
  costCenters: CostCenter[];
  voucherTypes: VoucherType[];
  voucherStatuses: VoucherStatus[];
  caratTypes: CaratType[];
}

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

// Helper for navigation IDs
const parseNavId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const parseNumericValue = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeStringValue = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();

  return normalized.length > 0 ? normalized : null;
};

const resolveDetailAccount = (
  detail: any,
  accounts: Account[],
): Account | undefined => {
  const candidates = [detail.acc_id, detail.acc, detail.acc_code];

  return accounts.find((account) =>
    candidates.some((candidate) => {
      if (candidate === null || candidate === undefined || candidate === "") {
        return false;
      }

      const candidateNumber = parseNumericValue(candidate);

      if (candidateNumber !== null) {
        const accountIdNumber = parseNumericValue(account.id);
        const accountNumber = parseNumericValue(account.acc_id);

        if (
          (accountIdNumber !== null && candidateNumber === accountIdNumber) ||
          (accountNumber !== null && candidateNumber === accountNumber)
        ) {
          return true;
        }
      }

      const candidateString = normalizeStringValue(candidate);
      const accountNumberString = normalizeStringValue(account.acc_id);

      return (
        candidateString !== null &&
        accountNumberString !== null &&
        candidateString === accountNumberString
      );
    }),
  );
};

export interface AdjustmentVoucherWithDetails {
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

class AdjustmentVoucherFormDataService extends HttpService<any> {
  constructor() {
    super("");
  }

  /**
   * جلب البيانات اللازمة لنموذج قيد التسوية
   */
  async getAdjustmentVoucherFormData(): Promise<AdjustmentVoucherFormData> {
    try {
      const { com } = await getBranchParams();
      const companyId = Number(com ?? 1);

      // جلب جميع البيانات المطلوبة بالتوازي
      const [
        accounts,
        costCenters,
        voucherTypesResponse,
        voucherStagesResponse,
        caratTypesResponse,
      ] = await Promise.all([
        accountService.getAllAccounts(),
        costCenterService.getAllCostCenters(),
        voucherService.getVoucherTypes({ com: String(companyId), year: "1" }),
        voucherService.getVoucherStages({ com: String(companyId), year: "1" }),
        voucherService.getCaratTypes(),
      ]);

      return {
        accounts: filterAccounts(accounts),
        costCenters: ensureArray(costCenters),
        voucherTypes: extractData<VoucherType>(voucherTypesResponse),
        voucherStatuses: extractData<VoucherStatus>(voucherStagesResponse),
        caratTypes: extractData<CaratType>(caratTypesResponse),
      };
    } catch (error) {
      console.error("Error fetching adjustment voucher form data:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب بيانات نموذج قيد التسوية");
    }
  }

  /**
   * جلب قيد تسوية محدد مع تفاصيله ومعلومات التنقل
   */
  async getAdjustmentVoucherWithDetails(
    voucherId: number,
    formData: AdjustmentVoucherFormData,
  ): Promise<AdjustmentVoucherWithDetails> {
    try {
      if (!voucherId || isNaN(voucherId)) {
        return this._getEmptyVoucherResponse();
      }

      // 1. جلب بيانات القيد (تصفية من القائمة للوصول لمعلومات التنقل)
      const ADJUSTMENT_VOUCHER_TYPE = "3";
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: ADJUSTMENT_VOUCHER_TYPE,
      });

      if (!vouchersResponse.success || !vouchersResponse.data) {
        return this._getEmptyVoucherResponse();
      }

      const vouchers = ensureArray<any>(vouchersResponse.data);
      const foundVoucher = vouchers.find(
        (v) => v.id === voucherId || v.vouch_id === voucherId,
      );

      if (!foundVoucher) {
        return this._getEmptyVoucherResponse();
      }

      // 2. جلب التفاصيل
      const branchId =
        Number(foundVoucher.com_id ?? foundVoucher.com ?? 1) || 1;
      const detailsResponse = await voucherService.getDetails(
        foundVoucher.id || voucherId,
        {
          xcom_id: branchId,
        },
      );

      const detailsData = extractData<any>(detailsResponse);

      // 3. معالجة وتنسيق البيانات
      const details = this._processDetails(
        detailsData,
        formData,
        foundVoucher.vouch_id,
      );
      const voucher = this._formatVoucher(foundVoucher);
      const navigationInfo = this._extractNavigationInfo(foundVoucher);

      return {
        voucher,
        details,
        navigationInfo,
      };
    } catch (error) {
      console.error("Error fetching adjustment voucher with details:", error);
      rethrowAuthenticationError(error);

      return this._getEmptyVoucherResponse();
    }
  }

  private _getEmptyVoucherResponse(): AdjustmentVoucherWithDetails {
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

  private _processDetails(
    detailsData: any[],
    formData: AdjustmentVoucherFormData,
    vouchId: number,
  ): VoucherDetail[] {
    return detailsData.map((detail: any) => {
      const account = resolveDetailAccount(detail, formData.accounts);
      const resolvedAccountId =
        account?.id ??
        parseNavId(detail.acc_id) ??
        parseNavId(detail.acc) ??
        0;

      const costId = detail.cost_id || detail.cost || undefined;

      return {
        id: detail.id || 0,
        vouch_id: vouchId || 0,
        acc_id: resolvedAccountId,
        acc_code: account?.acc_code || detail.acc_code || "",
        acc_name: account?.acc_name || detail.acc_name || "",
        cost_id: costId ? Number(costId) : undefined,
        debit: parseFloat(detail.debit) || 0,
        credit: parseFloat(detail.credit) || 0,
        debit_base: parseFloat(detail.debit_base || detail.debit) || 0,
        credit_base: parseFloat(detail.credit_base || detail.credit) || 0,
        g_debit: parseFloat(detail.g_debit || detail.debit_g) || 0,
        g_credit: parseFloat(detail.g_credit || detail.credit_g) || 0,
        g_debit_base: parseFloat(detail.g_debit_base || 0) || 0,
        g_credit_base: parseFloat(detail.g_credit_base || 0) || 0,
        gauge: parseFloat(detail.gauge) || 875,
        tax: parseFloat(detail.tax) || 0,
        tax_prc: parseFloat(detail.tax_prc) || 0,
        vat_no: parseInt(detail.vat_no) || 0,
        vouch_notes: detail.vouch_notes || "",
        cr_date: detail.cr_date || new Date().toISOString(),
      };
    });
  }

  private _formatVoucher(voucher: any): Voucher {
    return {
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
      cost_id: voucher.cost_id || voucher.cost || null,
    };
  }

  private _extractNavigationInfo(voucher: any) {
    return {
      previous: parseNavId(voucher.previous_voucher_id ?? voucher.previous),
      next: parseNavId(voucher.next_voucher_id ?? voucher.next),
      first: parseNavId(voucher.first_voucher_id ?? voucher.first),
      last: parseNavId(voucher.last_voucher_id ?? voucher.last),
      vouchersCount: voucher.vouchers_count ?? null,
    };
  }
}

export default new AdjustmentVoucherFormDataService();
