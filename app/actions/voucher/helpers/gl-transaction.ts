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
  getCustomerName,
  getBoxAccountId,
} from "./common";

import { glTransactionService, voucherService } from "@/services/api";
import { GLTransaction } from "@/types/models/gl-transaction";
import { VOUCHER_TYPE_NAMES } from "@/constants";
import { isReceiptType, isPaymentType } from "@/utilities/voucher/routing";
import { parseNumber } from "@/utilities/voucherForm";

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

  // حساب المبلغ حسب نوع السند:
  // - سندات الاستلام والتسليم (111, 222): استخدام work_amt
  // - سندات قبض وصرف العميل (4, 5): استخدام close_amt فقط
  const isReceiptDelivery = [111, 222].includes(voucherData.vouch_type);
  const isCustomerReceiptPayment = [4, 5].includes(voucherData.vouch_type);

  let amount = 0;

  if (isReceiptDelivery) {
    // سندات الاستلام والتسليم: استخدام work_amt أو total_work
    amount =
      goldDetail.work_amt ||
      goldDetail.total_work ||
      goldDetail.close_amt ||
      0;
  } else if (isCustomerReceiptPayment) {
    // سندات قبض وصرف العميل: استخدام close_amt فقط (لا work_amt)
    amount = goldDetail.close_amt || 0;
  } else {
    // الأنواع الأخرى: استخدام close_amt أو work_amt
    amount =
      goldDetail.close_amt ||
      goldDetail.work_amt ||
      goldDetail.total_work ||
      0;
  }

  // حساب وزن الذهب
  const goldWeight = goldDetail.close_weight || goldDetail.g_weight || 0;

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

  // التحقق من وجود سجلات مسبقة وحذفها
  try {
    const existingTransactionsResponse = await glTransactionService.getAll({
      xtrans_id: String(voucherData.vouch_id),
      xtrans_type: String(voucherData.vouch_type),
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
        voucherData.vouch_id,
        voucherData.vouch_type,
      );
    }
  } catch (error) {
    console.error(
      `[SERVER] ❌ خطأ في التحقق من السجلات الموجودة:`,
      error instanceof Error ? error.message : String(error),
    );
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
  const customerName = custValue ? await getCustomerName(custValue) : null;

  let seq = 0;

  // لسندات الذهب: ترحيل الصناديق النقدية والذهبية
  if (isGoldVoucher) {
    // ترحيل الصناديق النقدية
    // في سندات الذهب (4, 5, 111, 222)، يجب ترحيل الصناديق النقدية دائماً
    if (voucherBoxes && voucherBoxes.length > 0) {
      for (let i = 0; i < voucherBoxes.length; i++) {
        seq++;
        await createGLTransactionForBox(
          voucherBoxes[i],
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

    // ترحيل صناديق الذهب من goldDetails
    if (goldDetails && goldDetails.length > 0) {
      const validGoldDetails = goldDetails.filter(
        (detail) =>
          detail &&
          detail.item_id &&
          detail.item_id > 0 &&
          detail.box_id &&
          detail.box_id > 0,
      );

      if (validGoldDetails.length > 0) {
        for (let i = 0; i < validGoldDetails.length; i++) {
          seq++;
          await createGLTransactionForGoldBox(
            validGoldDetails[i],
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
  if (voucherBoxes && voucherBoxes.length > 0) {
    const isReceipt = isReceiptType(voucherData.vouch_type);
    const isPayment = isPaymentType(voucherData.vouch_type);

    if (isReceipt || isPayment) {
      for (let i = 0; i < voucherBoxes.length; i++) {
        seq++;
        await createGLTransactionForBox(
          voucherBoxes[i],
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
}
