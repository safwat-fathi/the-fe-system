"use server";

import { revalidatePath } from "next/cache";

import { createGLTransactionRecords } from "./voucher.action";
import { getCurrentUsername } from "./voucher/helpers/common";

import {
  glTransactionService,
  voucherService,
  genericService,
} from "@/services/api";

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
    const voucherTypes = [0, 1, 2, 3, 4, 5, 111, 222];

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
