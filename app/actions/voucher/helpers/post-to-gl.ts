/**
 * Helper functions to post vouchers to GL (General Ledger)
 * ترحيل القيود للاستاذ العام يدوياً
 */

"use server";

import type { VoucherBoxData } from "./types";

import { getCurrentUsername, getBoxAccountId } from "./common";

import { glTransactionService } from "@/services/api";
import { getVoucherTypeName } from "@/utilities/voucher/routing";

export interface VoucherDetailForGL {
  acc_id: number;
  debit?: number;
  credit?: number;
  debit_base?: number;
  credit_base?: number;
  g_debit?: number;
  g_credit?: number;
  g_debit_base?: number;
  g_credit_base?: number;
  cost_id?: number | null;
  vouch_notes?: string;
}

export interface PostToGLParams {
  voucher_id: number; // id من جدول vouchers (primary key)
  vouch_id?: number; // رقم القيد (للرجوع إليه)
  vouch_type: number;
  vouch_date: string;
  ref_no?: string;
  vouch_notes?: string;
  details: VoucherDetailForGL[];
  voucherBoxes?: VoucherBoxData[]; // الصناديق (للسندات التي تحتاج صناديق)
  com?: number;
  year?: number;
  cust_id?: number | null;
}

/**
 * Get source string for GL transaction based on voucher type
 */
function getGLSource(vouchType: number): string {
  const sources: Record<number, string> = {
    0: "GL_OpeningEntry", // قيد افتتاحي
    1: "GL_CashReceipt", // سند قبض
    2: "GL_CashPayment", // سند صرف
    3: "GL_Adjustment", // قيد تسوية
    4: "GL_CustomerReceipt", // سند قبض عميل
    5: "GL_CustomerPayment", // سند صرف عميل
  };

  return sources[vouchType] || "GL_Voucher";
}

/**
 * Post voucher details to GL (General Ledger)
 * ترحيل تفاصيل القيد للاستاذ العام
 * 
 * الخوارزمية البسيطة:
 * 1. حذف القيود القديمة (إن وجدت)
 * 2. إنشاء قيود جديدة من التفاصيل
 */
export async function postVoucherToGL(
  params: PostToGLParams,
): Promise<{ success: boolean; error?: string; createdCount?: number }> {
  /* console.log("[postVoucherToGL] ========== START ==========");
  console.log("[postVoucherToGL] Params:", {
    voucher_id: params.voucher_id,
    vouch_id: params.vouch_id,
    vouch_type: params.vouch_type,
    details_count: params.details?.length || 0,
    voucherBoxes_count: params.voucherBoxes?.length || 0,
  }); */

  try {
    const {
      voucher_id,
      vouch_id,
      vouch_type,
      vouch_date,
      ref_no,
      vouch_notes,
      details,
      voucherBoxes = [],
      com = 1,
      year = 1,
      cust_id,
    } = params;

    // استخدام voucher_id (id من جدول vouchers) كـ trans_id
    const transId = voucher_id;

    if (
      (!details || details.length === 0) &&
      (!voucherBoxes || voucherBoxes.length === 0)
    ) {
      console.error("[postVoucherToGL] ❌ No details or boxes to post");

      return { success: false, error: "لا توجد تفاصيل أو صناديق للترحيل" };
    }

    // console.log(`[postVoucherToGL] Processing ${details.length} details and ${voucherBoxes.length} boxes`);

    // 1. حذف القيود القديمة (إن وجدت)
    // نستخدم getByType دائماً ثم نفلتر محلياً (تجنب مشكلة 500 في getByTransaction)
    try {
      // جلب جميع القيود من نفس النوع ثم التصفية محلياً
      // نستخدم skipCache=true لضمان جلب أحدث البيانات (بما فيها القيود الجديدة)
      const byTypeResponse = await glTransactionService.getByType(vouch_type, {
        xcom_id: "1",
        xyear_id: "0",
        skipCache: true,
      });

      if (byTypeResponse.success && byTypeResponse.data) {
        // تصفية محلياً للعثور على القيود المرتبطة بهذا السند المحدد
        // نستخدم voucher_id (id من جدول vouchers) وليس vouch_id
        const existing = byTypeResponse.data.filter(
          (t) => Number(t.trans_id) === Number(transId),
        );

        if (existing.length > 0) {
          const toDelete = existing
            .map((t) => t.id)
            .filter((id): id is number => !!id);

          if (toDelete.length > 0) {
            // حذف متوازي مع إرسال جميع الـ params المطلوبة
            const deleteResults = await Promise.allSettled(
              toDelete.map((id) =>
                glTransactionService.deleteTransaction(id, {
                  xcom_id: "1",
                  xyear_id: "0",
                  xtrans_type: String(vouch_type),
                  xtrans_id: String(transId),
                  xfrom_date: "0",
                  xto_date: "0",
                  xcost_id: "0",
                  xcust_id: "0",
                  xacc_id: "0",
                }),
              ),
            );

            // التحقق من نجاح الحذف
            const successful = deleteResults.filter(
              (r) => r.status === "fulfilled" && r.value.success,
            ).length;
            const failed = deleteResults.length - successful;

            if (failed > 0) {
              console.warn(
                `[postVoucherToGL] ⚠️ Failed to delete ${failed} GL transactions. Will create new ones anyway.`,
              );
            }

            // انتظار قليل بعد الحذف للتأكد من اكتمال العملية في الـ backend
            // نزيد الوقت قليلاً للتأكد من اكتمال الحذف قبل الإنشاء
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }
    } catch (error) {
      console.error(
        "[postVoucherToGL] Error deleting old GL transactions:",
        error,
      );
      // تجاهل فشل الحذف والمتابعة بإنشاء قيود جديدة
    }

    // 2. إنشاء قيود جديدة
    const currentDate = new Date().toISOString();
    const currentUsername = await getCurrentUsername();
    const dateOnly =
      vouch_date.split("T")[0] ||
      vouch_date.split(" ")[0] ||
      new Date().toISOString().split("T")[0];
    const timeOnly =
      new Date().toISOString().split("T")[1]?.split(".")[0] || "00:00:00";
    const source = getGLSource(vouch_type);
    const voucherTypeName = getVoucherTypeName(vouch_type);

    let createdCount = 0;
    const errors: string[] = [];
    // let skippedCount = 0;

    // console.log(`[postVoucherToGL] Processing ${details.length} details...`);

    for (let i = 0; i < details.length; i++) {
      const d = details[i];

      // تخطي التفاصيل بدون حساب
      if (!d.acc_id || d.acc_id === 0) {
        // console.log(`[postVoucherToGL] Skipping detail ${i + 1}: no acc_id`);
        // skippedCount++;
        continue;
      }

      const debit = Number(d.debit || d.debit_base || 0);
      const credit = Number(d.credit || d.credit_base || 0);
      const debitBase = Number(d.debit_base || d.debit || 0);
      const creditBase = Number(d.credit_base || d.credit || 0);
      const gDebit = Number(d.g_debit || d.g_debit_base || 0);
      const gCredit = Number(d.g_credit || d.g_credit_base || 0);
      const gDebitBase = Number(d.g_debit_base || d.g_debit || 0);
      const gCreditBase = Number(d.g_credit_base || d.g_credit || 0);

      // تخطي إذا كان كل شيء صفر
      if (debit === 0 && credit === 0 && gDebit === 0 && gCredit === 0) {
        // console.log(`[postVoucherToGL] Skipping detail ${i + 1}: all values are zero`);
        // skippedCount++;
        continue;
      }

      /* console.log(`[postVoucherToGL] Creating GL transaction ${i + 1}:`, {
        acc_id: d.acc_id,
        debit,
        credit,
        g_debit: gDebit,
        g_credit: gCredit,
      }); */

      try {
        const response = await glTransactionService.create({
          debit: debit.toFixed(2),
          credit: credit.toFixed(2),
          debit_base: debitBase.toFixed(2),
          credit_base: creditBase.toFixed(2),
          g_debit: gDebit.toFixed(2),
          g_credit: gCredit.toFixed(2),
          g_debit_base: gDebitBase.toFixed(2),
          g_credit_base: gCreditBase.toFixed(2),
          type: voucherTypeName,
          d: dateOnly,
          t: `${dateOnly}T${timeOnly}.000000Z`,
          ref: ref_no || String(vouch_id || voucher_id),
          trans_id: transId, // استخدام voucher_id (id من جدول vouchers)
          trans_type: vouch_type,
          note: d.vouch_notes || vouch_notes || "",
          source: source,
          seq: i + 1,
          cust2: cust_id || null,
          cr_date: currentDate,
          cr_user: currentUsername || null,
          com: com,
          year: year,
          acc: d.acc_id,
          cust: cust_id || null,
          cost: d.cost_id || null,
        });

        if (response.success) {
          createdCount++;
          // console.log(`[postVoucherToGL] ✅ Created GL transaction ${i + 1} successfully`);
        } else {
          const errorMsg = `فشل إنشاء قيد ${i + 1}: ${response.message || "خطأ غير معروف"}`;

          errors.push(errorMsg);
          console.error(`[postVoucherToGL] ❌ ${errorMsg}`);
        }
      } catch (err) {
        const errorMsg = `خطأ في قيد ${i + 1}: ${err instanceof Error ? err.message : "خطأ غير معروف"}`;

        errors.push(errorMsg);
        console.error(`[postVoucherToGL] ❌ Exception: ${errorMsg}`);
      }
    }

    // console.log(`[postVoucherToGL] Processed ${details.length} details: ${createdCount} created, ${skippedCount} skipped, ${errors.length} errors`);

    // 3. إضافة قيود GL للصناديق (للسندات التي تحتاج صناديق: سند قبض/صرف)
    // سند قبض (vouch_type = 1): الصندوق مدين (debit)، الحساب دائن (credit)
    // سند صرف (vouch_type = 2): الصندوق دائن (credit)، الحساب مدين (debit)
    if (
      voucherBoxes &&
      voucherBoxes.length > 0 &&
      (vouch_type === 1 || vouch_type === 2)
    ) {
      let boxSeq = details.length; // بدء التسلسل بعد تفاصيل القيد

      for (let i = 0; i < voucherBoxes.length; i++) {
        const box = voucherBoxes[i];

        // تخطي الصناديق بدون box_id أو بدون مبلغ
        if (!box.box_id || box.box_id <= 0 || !box.amount || box.amount === 0)
          continue;

        // جلب حساب الصندوق
        const boxAccountId = await getBoxAccountId(box.box_id);

        if (!boxAccountId || boxAccountId <= 0) {
          errors.push(`لم يتم العثور على حساب للصندوق ${box.box_id}`);
          continue;
        }

        const boxAmount = Number(box.amount);

        if (boxAmount === 0) continue;

        // تحديد المدين والدائن حسب نوع السند
        let boxDebit = 0;
        let boxCredit = 0;

        if (vouch_type === 1) {
          // سند قبض: الصندوق مدين
          boxDebit = boxAmount;
        } else if (vouch_type === 2) {
          // سند صرف: الصندوق دائن
          boxCredit = boxAmount;
        }

        try {
          // قيد الصندوق
          const boxResponse = await glTransactionService.create({
            debit: boxDebit.toFixed(2),
            credit: boxCredit.toFixed(2),
            debit_base: boxDebit.toFixed(2),
            credit_base: boxCredit.toFixed(2),
            g_debit: "0.00",
            g_credit: "0.00",
            g_debit_base: "0.00",
            g_credit_base: "0.00",
            type: voucherTypeName,
            d: dateOnly,
            t: `${dateOnly}T${timeOnly}.000000Z`,
            ref: ref_no || String(vouch_id || voucher_id),
            trans_id: transId,
            trans_type: vouch_type,
            note: box.vouch_notes || vouch_notes || "",
            source: source,
            seq: boxSeq + 1,
            cust2: cust_id || null,
            cr_date: currentDate,
            cr_user: currentUsername || null,
            com: com,
            year: year,
            acc: boxAccountId, // حساب الصندوق
            cust: cust_id || null,
            cost: box.cost_id || null,
          });

          if (boxResponse.success) {
            createdCount++;
            boxSeq++;
          } else {
            errors.push(
              `فشل إنشاء قيد الصندوق ${box.box_id}: ${boxResponse.message || "خطأ غير معروف"}`,
            );
          }
        } catch (err) {
          errors.push(
            `خطأ في قيد الصندوق ${box.box_id}: ${err instanceof Error ? err.message : "خطأ غير معروف"}`,
          );
        }
      }
    }

    if (errors.length > 0) {
      console.error(
        `[postVoucherToGL] ❌ Completed with errors: ${errors.join(" | ")}`,
      );

      return { success: false, error: errors.join(" | "), createdCount };
    }

    if (createdCount === 0) {
      console.error(
        `[postVoucherToGL] ❌ No GL transactions created (all details were zero or had no accounts)`,
      );

      return {
        success: false,
        error:
          "لم يتم إنشاء أي قيود GL (جميع التفاصيل والصناديق كانت صفر أو بدون حسابات)",
      };
    }

    // console.log(`[postVoucherToGL] ✅ SUCCESS: Created ${createdCount} GL transactions`);
    // console.log("[postVoucherToGL] ========== END ==========");

    return { success: true, createdCount };
  } catch (error) {
    console.error("[postVoucherToGL] ❌ EXCEPTION:", error);
    console.error(
      "[postVoucherToGL] Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء الترحيل للـ GL",
    };
  }
}
