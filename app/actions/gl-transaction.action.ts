"use server";

import { revalidatePath } from "next/cache";

import { createGLTransactionRecords } from "./voucher.action";
import { getCurrentUsername } from "./voucher/helpers/common";

import {
  glAuditLogService,
  glTransactionService,
  voucherService,
  genericService,
} from "@/services/api";
import type {
  CreateGLAuditLogPayload,
  GLAuditLogIssue,
  GLAuditLogStatus,
} from "@/types/models/gl-audit-log";
import type { GLTransaction } from "@/types/models/gl-transaction";
import { isReceiptType, isPaymentType } from "@/utilities/voucher/routing";
import { parseNumber } from "@/utilities/voucherForm";

const NUMERIC_TOLERANCE = 0.01;

/**
 * حذف جميع الحركات من جدول gl_transaction
 */
export async function deleteAllGLTransactions() {
  try {
    // جلب جميع الحركات من gl_transaction
    // استخدام genericService بدلاً من glTransactionService مباشرة
    let response;

    try {
      // المحاولة الأولى: استخدام genericService مع gl_transaction_list
      const genericResponse = await genericService.getTableData(
        "gl_transaction_list",
        {
          xcom_id: "1",
          xyear_id: "0",
          xfrom_date: "0",
          xto_date: "0",
          xtrans_id: "0", // 0 = جميع الحركات
          xtrans_type: "0", // 0 = جميع الأنواع
        },
      );

      if (
        genericResponse.success &&
        genericResponse.data &&
        Array.isArray(genericResponse.data)
      ) {
        response = {
          success: true,
          data: genericResponse.data,
        };
      } else {
        // المحاولة الثانية: استخدام glTransactionService مباشرة
        response = await glTransactionService.getAll({
          xcom_id: "1",
          xyear_id: "0",
          xfrom_date: "0",
          xto_date: "0",
        });
      }
    } catch (error) {
      return {
        success: false,
        message: `خطأ في الاتصال بالخادم: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    if (!response.success) {
      return {
        success: false,
        message: `فشل جلب الحركات: ${(response as any).message || "خطأ غير معروف"}`,
      };
    }

    const transactions = response.data || [];

    if (!Array.isArray(transactions)) {
      return {
        success: false,
        message: `خطأ في شكل البيانات المُستلمة: ${typeof transactions}. المتوقع: array`,
        deletedCount: 0,
        failedCount: 0,
        totalFound: 0,
      };
    }

    if (transactions.length === 0) {
      // إرجاع رسالة تشخيصية
      return {
        success: false,
        message: `لا توجد حركات للحذف. الاستجابة: success=${response.success}, data type=${typeof response.data}, data length=${Array.isArray(response.data) ? response.data.length : "N/A"}`,
        deletedCount: 0,
        failedCount: 0,
        totalFound: 0,
      };
    }

    let deletedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // حذف كل حركة
    for (const transaction of transactions) {
      // التحقق من وجود id
      const transactionId = transaction.id;

      if (!transactionId) {
        failedCount++;
        errors.push(
          `حركة بدون id: ${JSON.stringify(transaction).substring(0, 50)}`,
        );
        continue;
      }

      try {
        const deleteResponse = await glTransactionService.deleteTransaction(
          Number(transactionId),
          { xcom_id: 1 },
        );

        // التحقق من الاستجابة
        if (deleteResponse) {
          if (
            deleteResponse.success === true ||
            deleteResponse.success === undefined
          ) {
            // إذا كانت success true أو undefined، نعتبرها نجاح
            deletedCount++;
          } else {
            failedCount++;
            const errorMsg =
              (deleteResponse as any)?.message ||
              (deleteResponse as any)?.errors?.[0] ||
              "خطأ غير معروف";

            errors.push(`فشل حذف الحركة ${transactionId}: ${errorMsg}`);
          }
        } else {
          // إذا كانت الاستجابة null أو undefined، نعتبرها نجاح (بعض APIs ترجع null عند النجاح)
          deletedCount++;
        }
      } catch (error) {
        failedCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);

        errors.push(`خطأ في حذف الحركة ${transactionId}: ${errorMsg}`);
      }
    }

    // إعادة تحميل الصفحات
    revalidatePath("/settings");
    revalidatePath("/reports/account-statement");

    return {
      success: true,
      message: `تم حذف ${deletedCount} من أصل ${transactions.length} حركة${failedCount > 0 ? `، فشل حذف ${failedCount} حركة` : ""}`,
      deletedCount,
      failedCount,
      totalFound: transactions.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // أول 10 أخطاء فقط
    };
  } catch (error) {
    return {
      success: false,
      message: `حدث خطأ أثناء حذف الحركات: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * إعادة ترحيل جميع الحركات من جميع القيود والسندات
 */
export async function reTransferAllVouchers() {
  try {
    const currentUsername = await getCurrentUsername();
    const currentDate = new Date().toISOString().split("T")[0];

    // أنواع السندات المختلفة
    const uniqueVoucherTypes = new Set<number>();
    const vouchersListResponse = await voucherService.getAll({
      xcom_id: 1,
      xyear_id: 0,
      xvouch_type: "0",
      xvouch_id: "0",
      xfrom_date: "0",
      xto_date: "0",
      page: "1",
    });

    if (vouchersListResponse.success && Array.isArray(vouchersListResponse.data)) {
      for (const voucher of vouchersListResponse.data) {
        if (voucher?.vouch_type !== undefined && voucher?.vouch_type !== null) {
          uniqueVoucherTypes.add(Number(voucher.vouch_type));
        }
      }
    }

    if (uniqueVoucherTypes.size === 0) {
      uniqueVoucherTypes.add(0); // fallback to default types if needed
      uniqueVoucherTypes.add(1);
      uniqueVoucherTypes.add(2);
      uniqueVoucherTypes.add(3);
      uniqueVoucherTypes.add(4);
      uniqueVoucherTypes.add(5);
      uniqueVoucherTypes.add(111);
      uniqueVoucherTypes.add(222);
    }

    const voucherTypes = Array.from(uniqueVoucherTypes.values());

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    // معالجة كل نوع من أنواع السندات
    for (const vouchType of voucherTypes) {
      try {
        // جلب جميع السندات من هذا النوع
        const vouchersResponse = await voucherService.getAll({
          xcom_id: 1,
          xyear_id: 0,
          xvouch_type: String(vouchType),
          xvouch_id: "0",
          xfrom_date: "0",
          xto_date: "0",
          page: "1",
        });

        if (!vouchersResponse.success || !vouchersResponse.data) {
          continue;
        }

        const vouchers = Array.isArray(vouchersResponse.data)
          ? vouchersResponse.data
          : [];

        // معالجة كل سند
        for (const voucher of vouchers) {
          try {
            totalProcessed++;

            // جلب تفاصيل السند (يستخدم id من جدول vouchers وليس vouch_id)
            const voucherId = (voucher as any).id || voucher.vouch_id;
            const detailsResponse = await voucherService.getDetails(voucherId, {
              xcom_id: 1,
            });

            const details =
              detailsResponse.success && detailsResponse.data
                ? Array.isArray(detailsResponse.data)
                  ? detailsResponse.data
                  : []
                : [];

            // جلب الصناديق (إذا كان السند يحتوي صناديق)
            let boxes: any[] = [];

            if ([1, 2, 4, 5, 111, 222].includes(voucher.vouch_type)) {
              try {
                const boxesResponse = await voucherService.getBoxes(voucherId, {
                  xcom_id: 1,
                });

                boxes =
                  boxesResponse.success && boxesResponse.data
                    ? Array.isArray(boxesResponse.data)
                      ? boxesResponse.data
                      : []
                    : [];
              } catch (error) {
                // تجاهل الخطأ في جلب الصناديق
              }
            }

            // تحويل التفاصيل إلى الصيغة المطلوبة
            const mappedDetails = details.map((detail: any) => ({
              acc_id: detail.acc_id || detail.acc || 0,
              debit: detail.debit || 0,
              credit: detail.credit || 0,
              debit_base: detail.debit_base !== undefined ? detail.debit_base : (detail.base_debit || detail.debit || 0),
              credit_base: detail.credit_base !== undefined ? detail.credit_base : (detail.base_credit || detail.credit || 0),
              g_debit: detail.g_debit !== undefined ? detail.g_debit : (detail.debit_g || 0),
              g_credit: detail.g_credit !== undefined ? detail.g_credit : (detail.credit_g || 0),
              g_debit_base: detail.g_debit_base !== undefined ? detail.g_debit_base : 0,
              g_credit_base: detail.g_credit_base !== undefined ? detail.g_credit_base : 0,
              cost_id: detail.cost_id || detail.cost || null,
              vouch_notes:
                detail.notes || detail.vouch_notes || detail.note || "",
            }));

            // تحويل الصناديق إلى الصيغة المطلوبة
            const mappedBoxes = boxes.map((box: any) => ({
              box_id: box.box_id || box.box || 0,
              amount: box.amount || 0,
              cost_id: box.cost_id || box.cost || null,
              vouch_notes: box.notes || box.vouch_notes || box.note || "",
            }));

            // إنشاء سجلات gl_transaction
            await createGLTransactionRecords(
              {
                vouch_id: voucher.vouch_id,
                vouch_type: voucher.vouch_type,
                vouch_date: voucher.vouch_date,
                ref_no: voucher.ref_no || "",
                vouch_notes: voucher.vouch_notes || "",
                cust_id:
                  (voucher as any).cust_id || (voucher as any).cust || null,
              },
              mappedDetails,
              voucher.vouch_id,
              currentDate,
              currentUsername,
              voucher,
              mappedBoxes,
            );

            totalSuccess++;
          } catch (error) {
            totalFailed++;
            errors.push(
              `سند ${voucher.vouch_id} (نوع ${voucher.vouch_type}): ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      } catch (error) {
        errors.push(
          `نوع السند ${vouchType}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // إعادة تحميل الصفحات
    revalidatePath("/settings");
    revalidatePath("/reports/account-statement");

    return {
      success: true,
      message: `تم معالجة ${totalProcessed} سند: ${totalSuccess} نجح، ${totalFailed} فشل`,
      totalProcessed,
      totalSuccess,
      totalFailed,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "حدث خطأ أثناء إعادة الترحيل",
    };
  }
}

interface GLReconciliationParams {
  fromDate?: string;
  toDate?: string;
  voucherType?: number;
  costCenterId?: number;
  customerId?: number;
}

interface GLReconciliationResult {
  success: boolean;
  message: string;
  status: GLAuditLogStatus;
  totalVouchers: number;
  totalIssues: number;
  issues: GLAuditLogIssue[];
  logId?: number | null;
}

function normalizeDateInput(value?: string): string {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().split("T")[0];
  }

  return date.toISOString().split("T")[0];
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return parseNumber(value);
}

function classifyStatus(issues: GLAuditLogIssue[]): GLAuditLogStatus {
  if (issues.length === 0) {
    return "success";
  }

  const hasSevere = issues.some(
    (issue) =>
      Math.abs(issue.cashDiff) > 1 || Math.abs(issue.goldDiff) > 1,
  );

  return hasSevere ? "errors" : "warnings";
}

function summarizeGLTransactions(rows: GLTransaction[]) {
  return rows.reduce(
    (acc, trx) => {
      acc.debit += toNumber(trx.debit_base ?? trx.debit);
      acc.credit += toNumber(trx.credit_base ?? trx.credit);
      acc.goldDebit += toNumber(trx.g_debit_base ?? trx.g_debit);
      acc.goldCredit += toNumber(trx.g_credit_base ?? trx.g_credit);

      return acc;
    },
    {
      debit: 0,
      credit: 0,
      goldDebit: 0,
      goldCredit: 0,
    },
  );
}

function summarizeVoucherDetails(details: any[]) {
  return details.reduce(
    (acc, detail) => {
      acc.debit += toNumber(detail.debit_base ?? detail.debit);
      acc.credit += toNumber(detail.credit_base ?? detail.credit);
      acc.goldDebit += toNumber(detail.g_debit_base ?? detail.g_debit);
      acc.goldCredit += toNumber(detail.g_credit_base ?? detail.g_credit);

      return acc;
    },
    {
      debit: 0,
      credit: 0,
      goldDebit: 0,
      goldCredit: 0,
    },
  );
}

function buildIssueMessage(params: {
  cashDiff: number;
  goldDiff: number;
  detailDiff: number;
  hasDetails: boolean;
}): string {
  const messages: string[] = [];

  if (params.cashDiff > NUMERIC_TOLERANCE) {
    messages.push(
      `اختلال توازن نقدي (${params.cashDiff.toFixed(2)})`,
    );
  }

  if (params.goldDiff > NUMERIC_TOLERANCE) {
    messages.push(
      `اختلال توازن ذهبي (${params.goldDiff.toFixed(2)})`,
    );
  }

  if (!params.hasDetails) {
    messages.push("لا توجد تفاصيل محفوظة في vouchers_dtl");
  } else if (params.detailDiff > NUMERIC_TOLERANCE) {
    messages.push(
      `تفاصيل القيد غير متوازنة (${params.detailDiff.toFixed(2)})`,
    );
  }

  if (messages.length === 0) {
    messages.push("تم رصد اختلاف غير محدد في القيد");
  }

  return messages.join(" | ");
}

function extractArrayPayload(payload: any): any[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
}

export async function runGLDailyReconciliation(
  params: GLReconciliationParams = {},
): Promise<GLReconciliationResult> {
  const fromDate = normalizeDateInput(params.fromDate);
  const toDate = normalizeDateInput(params.toDate);

  const glResponse = await genericService.getTableData(
    "gl_transaction_list",
    {
      xcom_id: "1",
      xyear_id: "0",
      xfrom_date: fromDate,
      xto_date: toDate,
      xtrans_type: params.voucherType
        ? String(params.voucherType)
        : "0",
      xcost_id: params.costCenterId
        ? String(params.costCenterId)
        : "0",
      xcust_id: params.customerId ? String(params.customerId) : "0",
    },
  );

  if (!glResponse.success) {
    return {
      success: false,
      message:
        glResponse.message ||
        "فشل في جلب بيانات GL من الخادم",
      status: "errors",
      totalVouchers: 0,
      totalIssues: 0,
      issues: [],
    };
  }

  const transactions = glResponse.data ?? [];
  const grouped = new Map<
    string,
    { transType: number; transId: number; rows: GLTransaction[] }
  >();

  for (const row of transactions) {
    const transType = Number(row.trans_type ?? row.transType ?? 0);
    const transId = Number(row.trans_id ?? row.transId ?? 0);

    if (!Number.isFinite(transType) || !Number.isFinite(transId)) {
      continue;
    }

    const key = `${transType}-${transId}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        transType,
        transId,
        rows: [],
      });
    }

    grouped.get(key)!.rows.push(row as GLTransaction);
  }

  const issues: GLAuditLogIssue[] = [];

  for (const group of grouped.values()) {
    const glTotals = summarizeGLTransactions(group.rows);
    const cashDiff = Math.abs(glTotals.debit - glTotals.credit);
    const goldDiff = Math.abs(glTotals.goldDebit - glTotals.goldCredit);

    let voucherMasterId = 0;
    let detailTotals = {
      debit: 0,
      credit: 0,
      goldDebit: 0,
      goldCredit: 0,
    };
    let hasDetails = false;
    let detailBalanceDiff = 0;

    try {
      const voucherRecord = await voucherService.getVoucherById(
        group.transId,
        {
          xvouch_type: String(group.transType),
        },
      );

      if (voucherRecord && (voucherRecord as any).id) {
        voucherMasterId = Number((voucherRecord as any).id);
        const detailsResponse = await voucherService.getDetails(
          voucherMasterId,
          { xcom_id: 1 },
        );

        const details = detailsResponse.success
          ? extractArrayPayload(detailsResponse.data)
          : [];

        if (details.length > 0) {
          hasDetails = true;
          detailTotals = summarizeVoucherDetails(details);
          detailBalanceDiff = Math.abs(
            detailTotals.debit - detailTotals.credit,
          );
        }
      }
    } catch (error) {
      console.error(
        `[runGLDailyReconciliation] Failed to load details for voucher ${group.transId}:`,
        error,
      );
    }

    const requiresAttention =
      cashDiff > NUMERIC_TOLERANCE ||
      goldDiff > NUMERIC_TOLERANCE ||
      !hasDetails ||
      detailBalanceDiff > NUMERIC_TOLERANCE;

    if (!requiresAttention) {
      continue;
    }

    const message = buildIssueMessage({
      cashDiff,
      goldDiff,
      detailDiff: detailBalanceDiff,
      hasDetails,
    });

    issues.push({
      transType: group.transType,
      transId: group.transId,
      voucherMasterId,
      message,
      cashDiff: Number(cashDiff.toFixed(4)),
      goldDiff: Number(goldDiff.toFixed(4)),
      detailTotals: {
        debit: Number(detailTotals.debit.toFixed(4)),
        credit: Number(detailTotals.credit.toFixed(4)),
        goldDebit: Number(detailTotals.goldDebit.toFixed(4)),
        goldCredit: Number(detailTotals.goldCredit.toFixed(4)),
      },
      glTotals: {
        debit: Number(glTotals.debit.toFixed(4)),
        credit: Number(glTotals.credit.toFixed(4)),
        goldDebit: Number(glTotals.goldDebit.toFixed(4)),
        goldCredit: Number(glTotals.goldCredit.toFixed(4)),
      },
    });
  }

  const status = classifyStatus(issues);
  const payload: CreateGLAuditLogPayload = {
    run_date: new Date().toISOString(),
    from_date: fromDate,
    to_date: toDate,
    voucher_type: params.voucherType ?? null,
    cost_center_id: params.costCenterId ?? null,
    customer_id: params.customerId ?? null,
    status,
    total_vouchers: grouped.size,
    total_issues: issues.length,
    issues,
    notes:
      issues.length === 0
        ? "تمت المراجعة دون ملاحظات"
        : "تم رصد فروقات في بعض القيود",
  };

  let logId: number | null = null;

  try {
    const logResponse = await glAuditLogService.createLog(payload);

    if (logResponse.success && logResponse.data) {
      logId = Number((logResponse.data as any).id ?? null);
    }
  } catch (error) {
    console.error(
      "[runGLDailyReconciliation] Failed to persist audit log:",
      error,
    );
  }

  revalidatePath("/settings");

  return {
    success: true,
    message:
      issues.length === 0
        ? "تم التحقق من القيود دون فروقات"
        : `تم رصد ${issues.length} فروقات ضمن ${grouped.size} قيد`,
    status,
    totalVouchers: grouped.size,
    totalIssues: issues.length,
    issues,
    logId,
  };
}
