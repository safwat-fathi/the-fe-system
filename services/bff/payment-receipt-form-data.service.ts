import type { Account } from "@/types/models/account";
import type { Box } from "@/types/models/box";
import type {
  CostCenter,
  VoucherStatus,
  VoucherType,
} from "@/types/voucher-form";
import type { Voucher, VoucherBox, VoucherDetail } from "@/types/voucher";

import { cache } from "react";

import {
  accountService,
  boxesService,
  costCenterService,
  voucherService,
} from "../api";

import { STORAGE_KEYS } from "@/constants";
import { defaultLocale, Locale } from "@/i18n/config";
import { redirect } from "@/i18n/navigation";
import { AuthenticationError } from "@/utilities/errors/Authentication";
import { getBranchParams } from "@/app/actions/branch-params";
import { getCookieAction } from "@/app/actions/cookie-store";

interface PaymentReceiptFormData {
  accounts: Account[];
  boxes: Box[];
  costCenters: CostCenter[];
  voucherTypes: VoucherType[];
  voucherStatuses: VoucherStatus[];
}

interface RawVoucherDetail {
  id?: number | string;
  acc_id?: number | string;
  acc?: number | string;
  acc_code?: string;
  acc_name?: string;
  cost?: number | string | null;
  cost_id?: number | string | null;
  debit?: number | string;
  credit?: number | string;
  debit_base?: number | string;
  credit_base?: number | string;
  g_debit?: number | string;
  debit_g?: number | string;
  g_credit?: number | string;
  credit_g?: number | string;
  g_debit_base?: number | string;
  g_credit_base?: number | string;
  gauge?: number | string;
  vouch_notes?: string;
  cr_date?: string;
}

interface RawBox {
  id?: number | string;
  Id?: number | string;
  cust_name?: string;
  name?: string;
  cust_name_e?: string;
  cust_code?: string;
  code?: string;
  box_type?: number | string;
  type_id?: number | string;
}

interface RawVoucherBox {
  id?: number | string;
  vouch?: number | string;
  vouch_id?: number | string;
  box?: number | string | RawBox;
  box_id?: number | string;
  vouch_amt?: number | string;
  amount?: number | string;
  box_note?: string;
  vouch_notes?: string;
  notes?: string;
  cost?: number | string;
  cost_id?: number | string;
  inv?: number | string;
  inv_id?: number | string;
  cr_date?: string;
}

const filterAccounts = (accounts: Account[]): Account[] => {
  return accounts.filter((account) => account.acc_type === 2);
};

const ensureArray = <T>(data: unknown): T[] =>
  Array.isArray(data) ? data : [];

const extractData = <T>(response: { success?: boolean; data?: T[] }): T[] => {
  return response?.success && Array.isArray(response?.data)
    ? response.data
    : [];
};

type SettledResult<T> = PromiseSettledResult<T>;

const getSettledValue = <T>(result: SettledResult<T>, fallback: T): T => {
  return result.status === "fulfilled" ? result.value : fallback;
};

const getPaymentReceiptFormData = cache(
  async (): Promise<PaymentReceiptFormData> => {
    const { com } = (await getBranchParams()) as { com: string | number };

    const result = await Promise.allSettled([
      accountService.getAllAccounts(),
      boxesService.getBoxes({ xcom_id: com }),
      costCenterService.getAllCostCenters(),
      voucherService.getVoucherTypes({ com, year: "1" }),
      voucherService.getVoucherStages({ com, year: "1" }),
    ]);

    const [
      accountsResult,
      boxesResult,
      costCentersResult,
      voucherTypesResult,
      voucherStagesResult,
    ] = result;

    const authError = result.find(
      (r) =>
        r.status === "rejected" &&
        (r.reason as unknown) instanceof AuthenticationError,
    );

    if (authError) {
      const locale = ((await getCookieAction(STORAGE_KEYS.LOCALE)) ||
        defaultLocale) as Locale;

      redirect({ href: "/auth/login", locale });
    }

    return {
      accounts: filterAccounts(getSettledValue(accountsResult, [])),
      costCenters: ensureArray(getSettledValue(costCentersResult, [])),
      voucherTypes: extractData<VoucherType>(
        getSettledValue(voucherTypesResult, { success: false, data: [] }),
      ),
      voucherStatuses: extractData<VoucherStatus>(
        getSettledValue(voucherStagesResult, { success: false, data: [] }) as {
          success: boolean;
          data: VoucherStatus[];
        },
      ),
      boxes: ensureArray<Box>(getSettledValue(boxesResult, [])),
    };
  },
);

const getPaymentReceiptVoucherForNavigation = cache(async () => {
  try {
    const vouchersResponse = await voucherService.getAll({
      xvouch_type: "2",
      page: "1",
    });

    if (!vouchersResponse.success || !vouchersResponse.data) {
      return null;
    }

    const vouchers = Array.isArray(vouchersResponse.data)
      ? vouchersResponse.data
      : [];

    if (vouchers.length === 0) {
      return null;
    }

    return vouchers[0];
  } catch (error) {
    console.error("Error fetching receipt voucher for navigation:", error);

    return null;
  }
});

const getPaymentReceiptVoucher = cache(
  async (voucherId: number): Promise<Voucher | null> => {
    try {
      if (!voucherId || isNaN(voucherId)) {
        return null;
      }
      const voucher = await voucherService.getVoucherById(voucherId, {
        xvouch_type: "2",
      });

      return (voucher as Voucher) || null;
    } catch (error) {
      console.error("Error fetching receipt voucher:", error);

      return null;
    }
  },
);

const getPaymentReceiptDetails = cache(
  async (
    voucherId: number,
    branchId?: number | string,
  ): Promise<RawVoucherDetail[]> => {
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

      return Array.isArray(detailsResponse.data) ? detailsResponse.data : [];
    } catch (error) {
      console.error("Error fetching voucher details:", error);

      return [];
    }
  },
);

const getPaymentReceiptBoxes = cache(
  async (
    voucherId: number,
    branchId?: number | string,
  ): Promise<RawVoucherBox[]> => {
    try {
      if (!voucherId || isNaN(voucherId)) {
        return [];
      }

      const parsedBranchId = Number(branchId ?? 1) || 1;

      const boxesResponse = await voucherService.getBoxes(voucherId, {
        xcom_id: parsedBranchId,
      });

      if (!boxesResponse.success || !boxesResponse.data) {
        return [];
      }

      return Array.isArray(boxesResponse.data) ? boxesResponse.data : [];
    } catch (error) {
      console.error("Error fetching voucher boxes:", error);

      return [];
    }
  },
);

const processVoucherData = (
  targetVoucher: Voucher,
  detailsData: RawVoucherDetail[],
  boxesData: RawVoucherBox[],
  formData: PaymentReceiptFormData,
): {
  formattedVoucher: Voucher;
  details: VoucherDetail[];
  boxes: VoucherBox[];
} => {
  const details: VoucherDetail[] = detailsData.map(
    (detail: RawVoucherDetail) => {
      const account = formData.accounts.find(
        (acc) => acc.id === (detail.acc_id || detail.acc),
      );

      let costId: number | null = null;

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
        id:
          detail.id !== undefined && detail.id !== null ? Number(detail.id) : 0,
        vouch_id: targetVoucher.vouch_id || 0,
        acc_id: Number(detail.acc_id || detail.acc || 0),
        acc_code: String(account?.acc_code || detail.acc_code || ""),
        acc_name: String(account?.acc_name || detail.acc_name || ""),
        cost_id: costId,
        debit: parseFloat(String(detail.debit || 0)) || 0,
        credit: parseFloat(String(detail.credit || 0)) || 0,
        debit_base:
          detail.debit_base !== undefined
            ? parseFloat(String(detail.debit_base))
            : parseFloat(String(detail.debit || 0)) || 0,
        credit_base:
          detail.credit_base !== undefined
            ? parseFloat(String(detail.credit_base))
            : parseFloat(String(detail.credit || 0)) || 0,
        g_debit:
          detail.g_debit !== undefined
            ? parseFloat(String(detail.g_debit))
            : parseFloat(String(detail.debit_g || 0)) || 0,
        g_credit:
          detail.g_credit !== undefined
            ? parseFloat(String(detail.g_credit))
            : parseFloat(String(detail.credit_g || 0)) || 0,
        g_debit_base:
          detail.g_debit_base !== undefined
            ? parseFloat(String(detail.g_debit_base))
            : 0,
        g_credit_base:
          detail.g_credit_base !== undefined
            ? parseFloat(String(detail.g_credit_base))
            : 0,
        gauge: parseFloat(String(detail.gauge || 875)) || 875,
        vouch_notes: String(detail.vouch_notes || ""),
        cr_date: String(detail.cr_date || new Date().toISOString()),
      };
    },
  );

  const boxes: VoucherBox[] = boxesData.map((boxData: RawVoucherBox) => {
    let boxId = 0;
    let boxObject: VoucherBox["box"] = undefined;

    if (boxData.hasOwnProperty("box")) {
      if (boxData.box !== null && boxData.box !== undefined) {
        if (typeof boxData.box === "object" && !Array.isArray(boxData.box)) {
          boxObject = {
            id: Number(boxData.box.id || boxData.box.Id || 0),
            cust_name: String(
              boxData.box.cust_name ||
                boxData.box.name ||
                boxData.box.cust_name_e ||
                "",
            ),
            cust_code: String(boxData.box.cust_code || boxData.box.code || ""),
            box_type:
              boxData.box.box_type || boxData.box.type_id
                ? Number(boxData.box.box_type || boxData.box.type_id)
                : undefined,
          };
          boxId = boxObject.id;
        } else if (
          typeof boxData.box === "number" ||
          (typeof boxData.box === "string" && boxData.box !== "")
        ) {
          boxId = Number(boxData.box);
        }
      }
    }

    if (boxId === 0 && boxData.hasOwnProperty("box_id")) {
      if (
        boxData.box_id !== null &&
        boxData.box_id !== undefined &&
        boxData.box_id !== ""
      ) {
        boxId = Number(boxData.box_id);
      }
    }

    let costId: number | null = null;

    if (boxData.hasOwnProperty("cost")) {
      if (
        boxData.cost !== null &&
        boxData.cost !== undefined &&
        boxData.cost !== ""
      ) {
        costId = Number(boxData.cost);
      }
    } else if (boxData.hasOwnProperty("cost_id")) {
      if (
        boxData.cost_id !== null &&
        boxData.cost_id !== undefined &&
        boxData.cost_id !== ""
      ) {
        costId = Number(boxData.cost_id);
      }
    }

    let invId: number | null = null;

    if (boxData.hasOwnProperty("inv")) {
      if (
        boxData.inv !== null &&
        boxData.inv !== undefined &&
        boxData.inv !== ""
      ) {
        invId = Number(boxData.inv);
      }
    } else if (boxData.hasOwnProperty("inv_id")) {
      if (
        boxData.inv_id !== null &&
        boxData.inv_id !== undefined &&
        boxData.inv_id !== ""
      ) {
        invId = Number(boxData.inv_id);
      }
    }

    const processedBox: VoucherBox = {
      id:
        boxData.id !== undefined && boxData.id !== null
          ? Number(boxData.id)
          : 0,
      vouch_id: Number(
        boxData.vouch || boxData.vouch_id || targetVoucher.id || 0,
      ),
      box_id: boxId,
      box: boxObject,
      amount: parseFloat(String(boxData.vouch_amt || boxData.amount || 0)),
      vouch_notes: String(
        boxData.box_note || boxData.vouch_notes || boxData.notes || "",
      ),
      cost_id: costId,
      inv_id: invId,
      cr_date: String(boxData.cr_date || new Date().toISOString()),
    };

    return processedBox;
  });

  const formattedVoucher: Voucher = {
    ...targetVoucher,
    vouch_date: targetVoucher.vouch_date || new Date().toISOString(),
    cr_date: targetVoucher.cr_date || new Date().toISOString(),
    vouch_id: targetVoucher.vouch_id || 0,
    ref_no: targetVoucher.ref_no || "",
    vouch_notes: targetVoucher.vouch_notes || "",
    vouch_status: targetVoucher.vouch_status || 1,
    pay_type: targetVoucher.pay_type || 1,
    commit: targetVoucher.commit || false,
    post: targetVoucher.post || false,
    print: targetVoucher.print || false,
  };

  return { formattedVoucher, details, boxes };
};

export default {
  getPaymentReceiptFormData,
  getPaymentReceiptVoucherForNavigation,
  getPaymentReceiptVoucher,
  getPaymentReceiptDetails,
  getPaymentReceiptBoxes,
  processVoucherData,
};
