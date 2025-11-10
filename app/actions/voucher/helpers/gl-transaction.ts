/**
 * GL Transaction helpers for vouchers
 * دوال مساعدة لترحيل القيود إلى دفتر الأستاذ العام
 */

"use server";

import type {
  SaveVoucherData,
  VoucherDetailData,
  VoucherBoxData,
  GVoucherDetailData,
} from "./types";

import {
  getVoucherSource,
  getVoucherTypeName,
  extractDateAndTime,
  getCustomerInfo,
  getCustomerName,
  getBoxAccountId,
} from "./common";

import { glTransactionService, voucherService } from "@/services/api";
import { GLTransaction } from "@/types/models/gl-transaction";
import { VOUCHER_TYPE_NAMES } from "@/constants";
import { isReceiptType, isPaymentType } from "@/utilities/voucher/routing";
import { parseNumber } from "@/utilities/voucherForm";

const NUMERIC_TOLERANCE = 0.01;

interface PostingTotals {
  debit: number;
  credit: number;
  goldDebit: number;
  goldCredit: number;
}

interface CustomerPostingEntry {
  detail: VoucherDetailData;
}

const ZERO_TOTALS: PostingTotals = {
  debit: 0,
  credit: 0,
  goldDebit: 0,
  goldCredit: 0,
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return parseNumber(value);
}

function accumulateTotals(
  totals: PostingTotals,
  options: {
    debit?: number;
    credit?: number;
    goldDebit?: number;
    goldCredit?: number;
  },
): void {
  totals.debit += options.debit ?? 0;
  totals.credit += options.credit ?? 0;
  totals.goldDebit += options.goldDebit ?? 0;
  totals.goldCredit += options.goldCredit ?? 0;
}

function assertBalancedTotals(
  context: string,
  totals: PostingTotals,
): void {
  const cashDiff = Math.abs(totals.debit - totals.credit);

  if (cashDiff > NUMERIC_TOLERANCE) {
    const message = `[SERVER] ❌ اختلال توازن نقدي (${context}): إجمالي المدين ${totals.debit.toFixed(
      2,
    )} ≠ إجمالي الدائن ${totals.credit.toFixed(2)}`;

    console.error(message);
    throw new Error(message);
  }

  const goldDiff = Math.abs(totals.goldDebit - totals.goldCredit);

  if (goldDiff > NUMERIC_TOLERANCE) {
    const message = `[SERVER] ❌ اختلال توازن ذهبي (${context}): إجمالي الذهب المدين ${totals.goldDebit.toFixed(
      2,
    )} ≠ إجمالي الذهب الدائن ${totals.goldCredit.toFixed(2)}`;

    console.error(message);
    throw new Error(message);
  }
}

function resolveGoldDetailAmounts(
  goldDetail: GVoucherDetailData,
  voucherType: number,
): { amount: number; weight: number } {
  const isReceiptDelivery = [111, 222].includes(voucherType);
  const isCustomerReceiptPayment = [4, 5].includes(voucherType);

  let amount = 0;

  if (isReceiptDelivery) {
    amount =
      toNumber(goldDetail.work_amt) ||
      toNumber(goldDetail.total_work) ||
      toNumber(goldDetail.close_amt);
  } else if (isCustomerReceiptPayment) {
    amount = toNumber(goldDetail.close_amt);
  } else {
    amount =
      toNumber(goldDetail.close_amt) ||
      toNumber(goldDetail.work_amt) ||
      toNumber(goldDetail.total_work);
  }

  const weight =
    toNumber(goldDetail.close_weight) ||
    toNumber(goldDetail.g_weight) ||
    toNumber((goldDetail as Record<string, unknown>).g_weight2) ||
    toNumber((goldDetail as Record<string, unknown>).weight);

  return {
    amount,
    weight,
  };
}

function normalizeBoxRecord(
  box: VoucherBoxData | (VoucherBoxData & Record<string, unknown>) | null | undefined,
): VoucherBoxData | null {
  if (!box) {
    return null;
  }

  const rawId =
    (box as any).box_id ??
    (box as any).box ??
    (box as any).id ??
    0;
  const numericBoxId = Number(rawId);

  const amountCandidate =
    (box as any).amount ??
    (box as any).vouch_amt ??
    (box as any).vouch_base_amt ??
    (box as any).close_amt ??
    0;
  const normalizedAmount = toNumber(amountCandidate);

  if (!Number.isFinite(numericBoxId) || numericBoxId <= 0) {
    return null;
  }

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return null;
  }

  const costCandidate =
    (box as any).cost_id ?? (box as any).cost ?? null;
  const normalizedCost =
    costCandidate !== null && costCandidate !== undefined
      ? toNumber(costCandidate)
      : null;

  const closeWeightCandidate =
    (box as any).close_weight ?? (box as any).weight ?? null;
  const normalizedCloseWeight =
    closeWeightCandidate !== null && closeWeightCandidate !== undefined
      ? toNumber(closeWeightCandidate)
      : undefined;

  return {
    id: (box as any).id ? Number((box as any).id) : undefined,
    box_id: numericBoxId,
    amount: normalizedAmount,
    vouch_notes:
      (box as any).vouch_notes ??
      (box as any).box_note ??
      (box as any).note ??
      "",
    cost_id:
      normalizedCost !== null && normalizedCost > 0
        ? normalizedCost
        : null,
    inv_id:
      (box as any).inv_id && Number((box as any).inv_id) > 0
        ? Number((box as any).inv_id)
        : undefined,
    close_weight:
      normalizedCloseWeight !== undefined &&
      normalizedCloseWeight > 0
        ? normalizedCloseWeight
        : undefined,
  };
}

/**
 * Delete GL transaction records for a voucher
 */
export async function deleteGLTransactionRecords(
  transId: number,
  transType: number,
): Promise<void> {
  try {
    const response = await glTransactionService.getAll({
      xtrans_id: transId,
      xtrans_type: transType,
      xcom_id: 1,
      xyear_id: 0,
      xfrom_date: 0,
      xto_date: 0,
    });

    if (response.success && response.data && Array.isArray(response.data)) {
      const transactions = response.data;

      for (const transaction of transactions) {
        if (transaction.id) {
          try {
            const deleteResponse = await glTransactionService.deleteTransaction(
              transaction.id,
              { com: 1 },
            );

            if (!deleteResponse.success) {
              console.error(
                `[SERVER] ❌ فشل حذف سجل gl_transaction ${transaction.id}:`,
                deleteResponse.message || "خطأ غير معروف",
              );
            }
          } catch (error) {
            console.error(
              `[SERVER] ❌ خطأ في حذف سجل gl_transaction ${transaction.id}:`,
              error instanceof Error ? error.message : String(error),
              `\nStack:`,
              error instanceof Error ? error.stack : undefined,
            );
          }
        } else {
          console.warn(
            `[SERVER] ⚠️ سجل gl_transaction بدون id، لا يمكن حذفه:`,
            JSON.stringify(transaction, null, 2),
          );
        }
      }
    }
  } catch (error) {
    console.error(
      `[SERVER] ❌ خطأ في حذف سجلات gl_transaction:`,
      error instanceof Error ? error.message : String(error),
      `trans_id: ${transId}, trans_type: ${transType}`,
    );
  }
}

/**
 * Create GL transaction record for a voucher detail
 */
async function createGLTransactionForDetail(
  detail: VoucherDetailData,
  voucherData: SaveVoucherData,
  transactionDate: string,
  transactionTime: string,
  voucherTypeName: string,
  source: string,
  currentDate: string,
  currentUsername: string | null,
  custValue: number | null,
  customerName: string | null,
  seq: number,
): Promise<void> {
  if (!detail.acc_id || detail.acc_id <= 0) {
    return;
  }

  const debitValue =
    detail.debit !== undefined && detail.debit !== null
      ? parseNumber(detail.debit)
      : 0;
  const creditValue =
    detail.credit !== undefined && detail.credit !== null
      ? parseNumber(detail.credit)
      : 0;
  const finalDebitBase = detail.debit_base !== undefined && detail.debit_base !== null
    ? parseNumber(detail.debit_base)
    : debitValue;
  const finalCreditBase = detail.credit_base !== undefined && detail.credit_base !== null
    ? parseNumber(detail.credit_base)
    : creditValue;

  const gDebitValue =
    detail.g_debit !== undefined && detail.g_debit !== null
      ? parseNumber(detail.g_debit)
      : 0;
  const gCreditValue =
    detail.g_credit !== undefined && detail.g_credit !== null
      ? parseNumber(detail.g_credit)
      : 0;
  const gDebitBaseValue =
    detail.g_debit_base !== undefined && detail.g_debit_base !== null
      ? parseNumber(detail.g_debit_base)
      : gDebitValue;
  const gCreditBaseValue =
    detail.g_credit_base !== undefined && detail.g_credit_base !== null
      ? parseNumber(detail.g_credit_base)
      : gCreditValue;

  const glTransactionData: Partial<GLTransaction> = {
    debit: String(debitValue),
    credit: String(creditValue),
    debit_base: String(finalDebitBase),
    credit_base: String(finalCreditBase),
    g_debit: String(gDebitValue),
    g_credit: String(gCreditValue),
    g_debit_base: String(gDebitBaseValue),
    g_credit_base: String(gCreditBaseValue),
    type: voucherTypeName,
    d: transactionDate,
    t: transactionTime,
    ref: voucherData.ref_no || "",
    trans_id: voucherData.vouch_id,
    trans_type: voucherData.vouch_type,
    note: detail.vouch_notes || voucherData.vouch_notes || "",
    source: source,
    seq: seq,
    cust2: custValue || null, // cust2 يجب أن يكون ID وليس الاسم
    cr_date: currentDate,
    cr_user: currentUsername || null,
    com: 1,
    year: 1,
    acc: detail.acc_id,
    cust: custValue || null,
    cost: detail.cost_id && detail.cost_id > 0 ? detail.cost_id : null,
  };

  try {
    const response = await glTransactionService.create(glTransactionData);

    if (!response.success) {
      console.error(
        `[SERVER] ❌ فشل ترحيل gl_transaction للتفصيل ${seq}:`,
        response.message || "خطأ غير معروف",
        "\nالبيانات المرسلة:",
        JSON.stringify(glTransactionData, null, 2),
      );
    }
  } catch (error) {
    console.error(
      `[SERVER] ❌ خطأ في ترحيل gl_transaction للتفصيل ${seq}:`,
      error instanceof Error ? error.message : String(error),
      "\nالبيانات المرسلة:",
      JSON.stringify(glTransactionData, null, 2),
    );
  }
}

/**
 * Create GL transaction record for a voucher box
 */
async function createGLTransactionForBox(
  box: VoucherBoxData,
  voucherData: SaveVoucherData,
  transactionDate: string,
  transactionTime: string,
  voucherTypeName: string,
  source: string,
  currentDate: string,
  currentUsername: string | null,
  custValue: number | null,
  customerName: string | null,
  seq: number,
): Promise<void> {
  if (!box.box_id || box.box_id <= 0) {
    return;
  }

  if (!box.amount || box.amount <= 0) {
    return;
  }

  const boxAccountId = await getBoxAccountId(box.box_id);

  if (!boxAccountId || boxAccountId <= 0) {
    return;
  }

  const isReceipt = isReceiptType(voucherData.vouch_type);
  const isPayment = isPaymentType(voucherData.vouch_type);

  const debit = isReceipt ? box.amount : 0;
  const credit = isPayment ? box.amount : 0;

  const glTransactionData: Partial<GLTransaction> = {
    debit: String(debit),
    credit: String(credit),
    debit_base: String(debit),
    credit_base: String(credit),
    g_debit: "0",
    g_credit: "0",
    g_debit_base: "0",
    g_credit_base: "0",
    type: voucherTypeName,
    d: transactionDate,
    t: transactionTime,
    ref: voucherData.ref_no || "",
    trans_id: voucherData.vouch_id,
    trans_type: voucherData.vouch_type,
    note: box.vouch_notes || voucherData.vouch_notes || "",
    source: source,
    seq: seq,
    cust2: custValue || null, // cust2 يجب أن يكون ID وليس الاسم
    cr_date: currentDate,
    cr_user: currentUsername || null,
    com: 1,
    year: 1,
    acc: boxAccountId,
    cust: custValue || null,
    cost: box.cost_id && box.cost_id > 0 ? box.cost_id : null,
  };

  try {
    const response = await glTransactionService.create(glTransactionData);

    if (!response.success) {
      console.error(
        `[SERVER] ❌ فشل ترحيل gl_transaction للصندوق:`,
        response.message || "خطأ غير معروف",
      );
    }
  } catch (error) {
    console.error(
      `[SERVER] ❌ خطأ في ترحيل gl_transaction للصندوق:`,
      error instanceof Error ? error.message : String(error),
      "\nالبيانات المرسلة:",
      JSON.stringify(glTransactionData, null, 2),
    );
  }
}

/**
 * Create GL transaction record for a gold detail box
 * ترحيل صندوق الذهب إلى GL
 */
async function createGLTransactionForGoldBox(
  goldDetail: GVoucherDetailData,
  voucherData: SaveVoucherData,
  transactionDate: string,
  transactionTime: string,
  voucherTypeName: string,
  source: string,
  currentDate: string,
  currentUsername: string | null,
  custValue: number | null,
  customerName: string | null,
  seq: number,
): Promise<void> {
  if (!goldDetail.box_id || goldDetail.box_id <= 0) {
    return;
  }

  const { amount, weight: goldWeight } = resolveGoldDetailAmounts(
    goldDetail,
    voucherData.vouch_type,
  );

  // إذا لم يكن هناك مبلغ ولا وزن، لا حاجة للترحيل
  if (amount <= 0 && goldWeight <= 0) {
    return;
  }

  const boxAccountId = await getBoxAccountId(goldDetail.box_id);

  if (!boxAccountId || boxAccountId <= 0) {
    return;
  }

  const isReceipt = isReceiptType(voucherData.vouch_type);
  const isPayment = isPaymentType(voucherData.vouch_type);

  const debit = isReceipt ? amount : 0;
  const credit = isPayment ? amount : 0;

  const glTransactionData: Partial<GLTransaction> = {
    debit: String(debit),
    credit: String(credit),
    debit_base: String(debit),
    credit_base: String(credit),
    g_debit: isReceipt ? String(goldWeight) : "0",
    g_credit: isPayment ? String(goldWeight) : "0",
    g_debit_base: isReceipt ? String(goldWeight) : "0",
    g_credit_base: isPayment ? String(goldWeight) : "0",
    type: voucherTypeName,
    d: transactionDate,
    t: transactionTime,
    ref: voucherData.ref_no || "",
    trans_id: voucherData.vouch_id,
    trans_type: voucherData.vouch_type,
    note: goldDetail.notes || voucherData.vouch_notes || "",
    source: source,
    seq: seq,
    cust2: custValue || null, // cust2 يجب أن يكون ID وليس الاسم
    cr_date: currentDate,
    cr_user: currentUsername || null,
    com: 1,
    year: 1,
    acc: boxAccountId,
    cust: custValue || null,
    cost: goldDetail.cost_id && goldDetail.cost_id > 0 ? goldDetail.cost_id : null,
  };

  try {
    const response = await glTransactionService.create(glTransactionData);

    if (!response.success) {
      console.error(
        `[SERVER] ❌ فشل ترحيل gl_transaction لصندوق الذهب:`,
        response.message || "خطأ غير معروف",
      );
    }
  } catch (error) {
    console.error(
      `[SERVER] ❌ خطأ في ترحيل gl_transaction لصندوق الذهب:`,
      error instanceof Error ? error.message : String(error),
      "\nالبيانات المرسلة:",
      JSON.stringify(glTransactionData, null, 2),
    );
  }
}

/**
 * Create GL transaction records for a voucher
 * Main function to create all GL transaction records
 */
export async function createGLTransactionRecords(
  voucherData: SaveVoucherData,
  details: VoucherDetailData[],
  masterId: number,
  currentDate: string,
  currentUsername: string | null,
  voucherPayload?: any,
  voucherBoxes: VoucherBoxData[] = [],
  goldDetails: GVoucherDetailData[] = [],
): Promise<void> {
  // سندات الذهب (4, 5, 111, 222): استخدام goldDetails و voucherBoxes
  const isGoldVoucher = [4, 5, 111, 222].includes(voucherData.vouch_type || 0);

  const normalizedBoxes: VoucherBoxData[] = (Array.isArray(voucherBoxes)
    ? voucherBoxes
    : []
  )
    .map((box) => normalizeBoxRecord(box))
    .filter((box): box is VoucherBoxData => box !== null);

  // التحقق من وجود سجلات مسبقة وحذفها
  const numericTransId = Number(voucherData.vouch_id);
  const numericTransType = Number(voucherData.vouch_type);

  if (Number.isFinite(numericTransId) && numericTransId > 0) {
    try {
      const existingTransactionsResponse = await glTransactionService.getAll({
        xtrans_id: String(numericTransId),
        xtrans_type: Number.isFinite(numericTransType)
          ? String(numericTransType)
          : "0",
        xcom_id: "1",
        xyear_id: "0",
        xfrom_date: "0",
        xto_date: "0",
      });

      if (
        existingTransactionsResponse.success &&
        existingTransactionsResponse.data &&
        Array.isArray(existingTransactionsResponse.data) &&
        existingTransactionsResponse.data.length > 0
      ) {
        await deleteGLTransactionRecords(
          numericTransId,
          Number.isFinite(numericTransType) ? numericTransType : 0,
        );
      }
    } catch (error) {
      console.error(
        `[SERVER] ❌ خطأ في التحقق من السجلات الموجودة:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  const { date: transactionDate, time: transactionTime } = extractDateAndTime(
    voucherData.vouch_date,
  );

  const typeNames: Record<number, string> = {
    ...(VOUCHER_TYPE_NAMES as Record<number, string>),
    111: "استلام",
    222: "تسليم",
    4: "قبض عميل",
    5: "صرف عميل",
  };
  const voucherTypeName =
    typeNames[voucherData.vouch_type] ||
    getVoucherTypeName(voucherData.vouch_type);
  const source = getVoucherSource(voucherData.vouch_type);

  const custValue =
    voucherData.cust_id ||
    (voucherData as any).cust ||
    voucherPayload?.cust ||
    null;
  const customerInfo = custValue ? await getCustomerInfo(custValue) : null;
  const customerName =
    customerInfo?.name ||
    (custValue ? await getCustomerName(custValue) : null);
  const customerAccountId =
    customerInfo?.accountId !== undefined && customerInfo?.accountId !== null
      ? customerInfo.accountId
      : null;
  const resolvedCostId =
    voucherData.cost_id !== undefined && voucherData.cost_id !== null
      ? voucherData.cost_id
      : voucherPayload?.cost !== undefined && voucherPayload?.cost !== null
        ? Number(voucherPayload.cost)
        : null;

  let seq = 0;

  // لسندات الذهب: ترحيل الصناديق النقدية والذهبية مع حساب العميل
  if (isGoldVoucher) {
    const isReceipt = isReceiptType(voucherData.vouch_type);
    const isPayment = isPaymentType(voucherData.vouch_type);

    const boxQueue = normalizedBoxes.map((box) => ({
      box,
      amount: box.amount,
    }));

    const goldDetailsList: GVoucherDetailData[] = Array.isArray(goldDetails)
      ? goldDetails.filter(
          (detail): detail is GVoucherDetailData =>
            detail !== undefined && detail !== null,
        )
      : [];

    const goldQueue = goldDetailsList
      .filter(
        (detail) =>
          detail.item_id &&
          detail.item_id > 0 &&
          detail.box_id &&
          detail.box_id > 0,
      )
      .map((detail) => {
        const { amount, weight } = resolveGoldDetailAmounts(
          detail,
          voucherData.vouch_type,
        );

        return {
          detail,
          amount,
          weight,
        };
      })
      .filter((entry) => entry.amount > 0 || entry.weight > 0);

    const postingTotals: PostingTotals = { ...ZERO_TOTALS };

    for (const entry of boxQueue) {
      accumulateTotals(postingTotals, {
        debit: isReceipt ? entry.amount : 0,
        credit: isPayment ? entry.amount : 0,
      });
    }

    for (const entry of goldQueue) {
      accumulateTotals(postingTotals, {
        debit: isReceipt ? entry.amount : 0,
        credit: isPayment ? entry.amount : 0,
        goldDebit: isReceipt ? entry.weight : 0,
        goldCredit: isPayment ? entry.weight : 0,
      });
    }

    const customerEntries: CustomerPostingEntry[] = [];

    if (customerAccountId) {
      const customerCostId =
        resolvedCostId !== undefined && resolvedCostId !== null
          ? resolvedCostId
          : null;

      const totalCashAmount = boxQueue.reduce(
        (sum, entry) => sum + entry.amount,
        0,
      );

      if (totalCashAmount > 0) {
        accumulateTotals(postingTotals, {
          debit: isPayment ? totalCashAmount : 0,
          credit: isReceipt ? totalCashAmount : 0,
        });

        customerEntries.push({
          detail: {
            vouch_id: voucherData.vouch_id,
            acc_id: customerAccountId,
            debit: isPayment ? totalCashAmount : undefined,
            credit: isReceipt ? totalCashAmount : undefined,
            debit_base: isPayment ? totalCashAmount : undefined,
            credit_base: isReceipt ? totalCashAmount : undefined,
            g_debit: undefined,
            g_credit: undefined,
            g_debit_base: undefined,
            g_credit_base: undefined,
            vouch_notes: voucherData.vouch_notes || undefined,
            cost_id: customerCostId,
          },
        });
      }

      const totalGoldWeight = goldQueue.reduce(
        (sum, entry) => sum + entry.weight,
        0,
      );

      if (totalGoldWeight > 0) {
        accumulateTotals(postingTotals, {
          goldDebit: isPayment ? totalGoldWeight : 0,
          goldCredit: isReceipt ? totalGoldWeight : 0,
        });

        customerEntries.push({
          detail: {
            vouch_id: voucherData.vouch_id,
            acc_id: customerAccountId,
            debit: undefined,
            credit: undefined,
            debit_base: undefined,
            credit_base: undefined,
            g_debit: isPayment ? totalGoldWeight : undefined,
            g_credit: isReceipt ? totalGoldWeight : undefined,
            g_debit_base: isPayment ? totalGoldWeight : undefined,
            g_credit_base: isReceipt ? totalGoldWeight : undefined,
            vouch_notes: voucherData.vouch_notes || undefined,
            cost_id: customerCostId,
          },
        });
      }
    }

    const contextLabel = `سند نوع ${voucherData.vouch_type} رقم ${voucherData.vouch_id}`;
    assertBalancedTotals(contextLabel, postingTotals);

    for (const entry of boxQueue) {
      seq++;
      await createGLTransactionForBox(
        entry.box,
        voucherData,
        transactionDate,
        transactionTime,
        voucherTypeName,
        source,
        currentDate,
        currentUsername,
        custValue,
        customerName,
        seq,
      );
    }

    for (const entry of goldQueue) {
      seq++;
      await createGLTransactionForGoldBox(
        entry.detail,
        voucherData,
        transactionDate,
        transactionTime,
        voucherTypeName,
        source,
        currentDate,
        currentUsername,
        custValue,
        customerName,
        seq,
      );
    }

    for (const entry of customerEntries) {
      seq++;
      await createGLTransactionForDetail(
        entry.detail,
        voucherData,
        transactionDate,
        transactionTime,
        voucherTypeName,
        source,
        currentDate,
        currentUsername,
        custValue,
        customerName,
        seq,
      );
    }

    return;
  }

  let effectiveDetails = details;

  try {
    const persistedDetailsResponse = await voucherService.getDetails(masterId, {
      xcom_id: "1",
    });

    if (
      persistedDetailsResponse.success &&
      Array.isArray(persistedDetailsResponse.data) &&
      persistedDetailsResponse.data.length > 0
    ) {
      effectiveDetails = persistedDetailsResponse.data.map((detail: any) => ({
        id: detail.id || 0,
        vouch_id: voucherData.vouch_id,
        acc_id: detail.acc_id || detail.acc || 0,
        debit:
          detail.debit !== undefined && detail.debit !== null
            ? parseNumber(detail.debit)
            : undefined,
        credit:
          detail.credit !== undefined && detail.credit !== null
            ? parseNumber(detail.credit)
            : undefined,
        debit_base:
          detail.debit_base !== undefined && detail.debit_base !== null
            ? parseNumber(detail.debit_base)
            : undefined,
        credit_base:
          detail.credit_base !== undefined && detail.credit_base !== null
            ? parseNumber(detail.credit_base)
            : undefined,
        g_debit:
          detail.g_debit !== undefined && detail.g_debit !== null
            ? parseNumber(detail.g_debit)
            : undefined,
        g_credit:
          detail.g_credit !== undefined && detail.g_credit !== null
            ? parseNumber(detail.g_credit)
            : undefined,
        g_debit_base:
          detail.g_debit_base !== undefined && detail.g_debit_base !== null
            ? parseNumber(detail.g_debit_base)
            : undefined,
        g_credit_base:
          detail.g_credit_base !== undefined && detail.g_credit_base !== null
            ? parseNumber(detail.g_credit_base)
            : undefined,
        gauge:
          detail.gauge !== undefined && detail.gauge !== null
            ? parseNumber(detail.gauge)
            : 875,
        vouch_notes: detail.vouch_notes || "",
        cost_id: detail.cost_id || detail.cost || null,
        g_debit2: undefined,
        g_credit2: undefined,
      }));
    }
  } catch (error) {
    console.error(
      "[SERVER] ❌ فشل في جلب تفاصيل السند من أجل الترحيل:",
      error instanceof Error ? error.message : String(error),
    );
  }

  if (!effectiveDetails || effectiveDetails.length === 0) {
    return;
  }

  // فلترة التفاصيل الصحيحة
  const validDetails = effectiveDetails.filter(
    (detail) => detail && detail.acc_id && detail.acc_id > 0,
  );

  if (validDetails.length === 0) {
    return;
  }

  const postingTotals: PostingTotals = { ...ZERO_TOTALS };

  for (const detail of validDetails) {
    const debitValue = toNumber(
      detail.debit_base ?? detail.debit ?? 0,
    );
    const creditValue = toNumber(
      detail.credit_base ?? detail.credit ?? 0,
    );
    const goldDebitValue = toNumber(
      detail.g_debit_base ?? detail.g_debit ?? 0,
    );
    const goldCreditValue = toNumber(
      detail.g_credit_base ?? detail.g_credit ?? 0,
    );

    accumulateTotals(postingTotals, {
      debit: debitValue,
      credit: creditValue,
      goldDebit: goldDebitValue,
      goldCredit: goldCreditValue,
    });
  }

  const isReceipt = isReceiptType(voucherData.vouch_type);
  const isPayment = isPaymentType(voucherData.vouch_type);

  const preparedBoxes =
    normalizedBoxes.length > 0 && (isReceipt || isPayment)
      ? normalizedBoxes.map((box) => {
          const amount = box.amount;

          accumulateTotals(postingTotals, {
            debit: isReceipt ? amount : 0,
            credit: isPayment ? amount : 0,
          });

          return { box, amount };
        })
      : [];

  const contextLabel = `سند نوع ${voucherData.vouch_type} رقم ${voucherData.vouch_id}`;
  assertBalancedTotals(contextLabel, postingTotals);

  // إنشاء سجلات GL transaction للتفاصيل
  for (let i = 0; i < validDetails.length; i++) {
    seq++;
    await createGLTransactionForDetail(
      validDetails[i],
      voucherData,
      transactionDate,
      transactionTime,
      voucherTypeName,
      source,
      currentDate,
      currentUsername,
      custValue,
      customerName,
      seq,
    );
  }

  // إنشاء سجلات GL transaction للصناديق
  if (preparedBoxes.length > 0) {
    for (const entry of preparedBoxes) {
      seq++;
      await createGLTransactionForBox(
        entry.box,
        voucherData,
        transactionDate,
        transactionTime,
        voucherTypeName,
        source,
        currentDate,
        currentUsername,
        custValue,
        customerName,
        seq,
      );
    }
  }
}
