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
import {
  AuthenticationError,
  rethrowAuthenticationError,
} from "@/utilities/errors/Authentication";
import { redirectToLogin } from "@/app/actions/auth";

/** Shape of a raw voucher object returned from the API */
interface RawApiVoucher extends Record<string, unknown> {
  id?: number;
  vouch_id?: number;
  vouch_type?: number | string;
  vouch_date?: string;
  vouch_amt?: number;
  vouch_notes?: string;
  vouch_status?: number;
  pay_type?: number;
  ref_no?: string;
  commit?: boolean;
  post?: boolean;
  print?: boolean;
  cost_id?: number | null;
  cost?: number | null;
  com_id?: number;
  com?: number;
  previous_voucher_id?: number;
  previous?: number;
  next_voucher_id?: number;
  next?: number;
  first_voucher_id?: number;
  first?: number;
  last_voucher_id?: number;
  last?: number;
  vouchers_count?: number;
}

/** Shape of a raw detail row returned from the API */
interface RawDetail extends Record<string, unknown> {
  id?: number;
  acc_id?: number;
  acc?: number;
  acc_code?: string;
  acc_name?: string;
  cost_id?: number | null;
  cost?: number | null;
  debit?: number | string;
  credit?: number | string;
  debit_base?: number | string;
  credit_base?: number | string;
  debit_g?: number | string;
  credit_g?: number | string;
  g_debit?: number | string;
  g_credit?: number | string;
  g_debit_base?: number | string;
  g_credit_base?: number | string;
  gauge?: number | string;
  tax?: number | string;
  tax_prc?: number | string;
  vat_no?: number | string;
  vouch_notes?: string;
  cr_date?: string;
}

export interface BalanceVoucherFormData {
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
  detail: RawDetail,
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

export interface BalanceVoucherWithDetails {
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

class BalanceVoucherFormDataService extends HttpService<Voucher> {
  constructor() {
    super("");
  }

  /**
   * جلب البيانات اللازمة لنموذج القيد الافتتاحي
   */
  async getBalanceVoucherFormData(): Promise<BalanceVoucherFormData> {
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
      if (error instanceof AuthenticationError) {
        await redirectToLogin();
      }
      console.error("Error fetching balance voucher form data:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب بيانات نموذج القيد الافتتاحي");
    }
  }

  /**
   * جلب القيد الافتتاحي الموجود (vouch_type = 0) مع تفاصيله
   */
  async getBalanceVoucherWithDetails(
    formData: BalanceVoucherFormData,
  ): Promise<BalanceVoucherWithDetails> {
    try {
      const BALANCE_VOUCHER_TYPE = "0";
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: BALANCE_VOUCHER_TYPE,
      });

      if (!vouchersResponse.success || !vouchersResponse.data) {
        return this._getEmptyVoucherResponse();
      }

      const vouchers = ensureArray<RawApiVoucher>(vouchersResponse.data);
      const foundVoucher = vouchers.find(
        (v) => v?.vouch_type === 0 || v?.vouch_type === "0",
      );

      if (!foundVoucher) {
        return this._getEmptyVoucherResponse();
      }

      // جلب التفاصيل
      const branchId =
        Number(foundVoucher.com_id ?? foundVoucher.com ?? 1) || 1;
      const detailsResponse = await voucherService.getDetails(
        foundVoucher.id as number,
        { xcom_id: branchId },
      );

      const detailsData = extractData<RawDetail>(detailsResponse);

      // معالجة وتنسيق البيانات
      const details = this._processDetails(
        detailsData,
        formData,
        foundVoucher.vouch_id ?? 0,
      );
      const voucher = this._formatVoucher(foundVoucher);
      const navigationInfo = this._extractNavigationInfo(foundVoucher);

      return {
        voucher,
        details,
        navigationInfo,
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        await redirectToLogin();
      }
      console.error("Error fetching balance voucher with details:", error);
      rethrowAuthenticationError(error);

      return this._getEmptyVoucherResponse();
    }
  }

  private _getEmptyVoucherResponse(): BalanceVoucherWithDetails {
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
    detailsData: RawDetail[],
    formData: BalanceVoucherFormData,
    vouchId: number | undefined,
  ): VoucherDetail[] {
    // Create a Map for faster account lookup (O(1) instead of O(n))
    const accountsMap = new Map(formData.accounts.map((acc) => [acc.id, acc]));

    return detailsData.map((detail: RawDetail) => {
      const account =
        resolveDetailAccount(detail, formData.accounts) ??
        (detail.acc_id !== undefined
          ? accountsMap.get(detail.acc_id)
          : detail.acc !== undefined
            ? accountsMap.get(detail.acc)
            : undefined);

      const resolvedAccountId =
        account?.id ?? parseNavId(detail.acc_id) ?? parseNavId(detail.acc) ?? 0;

      const costId = detail.cost_id || detail.cost || undefined;

      return {
        id: detail.id || 0,
        vouch_id: vouchId ?? 0,
        acc_id: resolvedAccountId,
        acc_code: account?.acc_code || detail.acc_code || "",
        acc_name: account?.acc_name || detail.acc_name || "",
        cost_id: costId ? Number(costId) : undefined,
        debit:
          detail.debit !== undefined && detail.debit !== null
            ? parseFloat(String(detail.debit))
            : undefined,
        credit:
          detail.credit !== undefined && detail.credit !== null
            ? parseFloat(String(detail.credit))
            : undefined,
        debit_base:
          detail.debit_base !== undefined && detail.debit_base !== null
            ? parseFloat(String(detail.debit_base))
            : detail.debit !== undefined && detail.debit !== null
              ? parseFloat(String(detail.debit))
              : undefined,
        credit_base:
          detail.credit_base !== undefined && detail.credit_base !== null
            ? parseFloat(String(detail.credit_base))
            : detail.credit !== undefined && detail.credit !== null
              ? parseFloat(String(detail.credit))
              : undefined,
        gauge: parseFloat(String(detail.gauge ?? 875)) || 875,
        g_debit:
          detail.g_debit !== undefined && detail.g_debit !== null
            ? parseFloat(String(detail.g_debit))
            : detail.debit_g !== undefined && detail.debit_g !== null
              ? parseFloat(String(detail.debit_g))
              : undefined,
        g_credit:
          detail.g_credit !== undefined && detail.g_credit !== null
            ? parseFloat(String(detail.g_credit))
            : detail.credit_g !== undefined && detail.credit_g !== null
              ? parseFloat(String(detail.credit_g))
              : undefined,
        g_debit_base:
          detail.g_debit_base !== undefined && detail.g_debit_base !== null
            ? parseFloat(String(detail.g_debit_base))
            : undefined,
        g_credit_base:
          detail.g_credit_base !== undefined && detail.g_credit_base !== null
            ? parseFloat(String(detail.g_credit_base))
            : undefined,
        tax: parseFloat(String(detail.tax ?? 0)) || 0,
        tax_prc: parseFloat(String(detail.tax_prc ?? 0)) || 0,
        vat_no: parseInt(String(detail.vat_no ?? 0)) || 0,
        vouch_notes: detail.vouch_notes || "",
        cr_date: detail.cr_date || new Date().toISOString(),
      };
    });
  }

  private _formatVoucher(voucher: RawApiVoucher): Voucher {
    const {
      id,
      vouch_id,
      vouch_date,
      vouch_amt,
      cr_date,
      ref_no,
      vouch_notes,
      vouch_status,
      pay_type,
      commit,
      post,
      print,
      cost_id,
      cost,
      com_id,
      com,
    } = voucher;

    return {
      vouch_id: vouch_id ?? 0,
      vouch_date: (vouch_date ?? new Date().toISOString()) as string,
      vouch_type: 0, // القيد الافتتاحي دائماً من النوع 0
      cr_date: (cr_date ?? new Date().toISOString()) as string,
      vouch_amt: vouch_amt ?? 0,
      ref_no: ref_no ?? "",
      vouch_notes: vouch_notes ?? "",
      vouch_status: vouch_status ?? 1,
      pay_type: pay_type ?? 1,
      commit: commit ?? false,
      post: post ?? false,
      print: print ?? false,
      cost_id: cost_id ?? cost ?? null,
      id,
      com_id,
      com,
    };
  }

  private _extractNavigationInfo(voucher: RawApiVoucher) {
    return {
      previous: parseNavId(voucher.previous_voucher_id ?? voucher.previous),
      next: parseNavId(voucher.next_voucher_id ?? voucher.next),
      first: parseNavId(voucher.first_voucher_id ?? voucher.first),
      last: parseNavId(voucher.last_voucher_id ?? voucher.last),
      vouchersCount: voucher.vouchers_count ?? null,
    };
  }
}

export default new BalanceVoucherFormDataService();
