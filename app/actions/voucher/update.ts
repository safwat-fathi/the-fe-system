/**
 * Update voucher action
 */

"use server";

import type {
  SaveVoucherData,
  VoucherDetailData,
  VoucherBoxData,
  GVoucherDetailData,
} from "./helpers/types";

import { getCurrentUsername } from "./helpers/common";
import { validateVoucherData } from "./helpers/validation";
import { updateVoucherBoxes } from "./helpers/process-boxes";
import { updateVoucherDetails } from "./helpers/process-details";
import { updateGoldDetails } from "./helpers/process-gold-details";
import { revalidateVoucherPaths } from "./helpers/revalidation";
import { postVoucherToGL } from "./helpers/post-to-gl";

import { voucherService, glTransactionService } from "@/services/api";
import { requiresBoxes } from "@/utilities/voucher/routing";
import { getCookieAction } from "@/app/actions/cookie-store";
import { STORAGE_KEYS } from "@/constants";
import { createParams } from "@/utilities/qs";

/**
 * Update an existing voucher
 */
export async function updateVoucherAction(
  voucherData: SaveVoucherData,
  details: VoucherDetailData[],
  deletedDetailIds: number[] = [],
  voucherRecordId?: number,
  voucherBoxes: VoucherBoxData[] = [],
  deletedBoxIds: number[] = [],
  goldDetails: GVoucherDetailData[] = [],
  deletedGoldDetailIds: number[] = [],
) {
  console.log("=== [updateVoucherAction] START ===");
  console.log("Voucher Type:", voucherData.vouch_type);
  console.log("Vouch ID:", voucherData.vouch_id);
  console.log("Details Count:", details.length);
  console.log("Voucher Record ID:", voucherRecordId);
  
  try {
    const normalizeCostValue = (...values: unknown[]): number | null => {
      for (const value of values) {
        if (value === undefined || value === null) {
          continue;
        }

        const numeric = Number(value);

        if (Number.isFinite(numeric) && numeric > 0) {
          return numeric;
        }
      }

      return null;
    };

    // التحقق من صحة البيانات
    const voucherIdNumeric = Number(voucherData.vouch_id ?? 0);

    if (!Number.isFinite(voucherIdNumeric) || voucherIdNumeric <= 0) {
      return {
        success: false,
        message: "معرف القيد غير صحيح",
      };
    }

    const validation = validateVoucherData(
      voucherData,
      details,
      voucherBoxes,
      goldDetails,
    );

    if (!validation.isValid) {
      return {
        success: false,
        message: validation.error || "خطأ في التحقق من البيانات",
      };
    }

    const currentUsername = await getCurrentUsername();
    const currentDate = new Date().toISOString();

    let realVoucherId: number;
    let voucherRecord: any = null;

    // البحث عن ID الحقيقي
    if (voucherRecordId && voucherRecordId > 0) {
      realVoucherId = voucherRecordId;
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: voucherData.vouch_type?.toString() || "0",
      });

      voucherRecord = vouchersResponse.data?.find(
        (v: any) =>
          v.id === realVoucherId &&
          v.vouch_type === (voucherData.vouch_type || 0),
      );
    } else {
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: voucherData.vouch_type?.toString() || "0",
      });

      voucherRecord = vouchersResponse.data?.find(
        (v: any) =>
          v.vouch_id === voucherData.vouch_id &&
          v.vouch_type === (voucherData.vouch_type || 0),
      );

      if (!voucherRecord || !voucherRecord.id) {
        return {
          success: false,
          message: "لم يتم العثور على القيد في قاعدة البيانات",
        };
      }

      realVoucherId = voucherRecord.id;
    }

    // تجهيز بيانات القيد للتحديث
    // ملاحظة: يجب إرسال جميع الحقول المطلوبة للترحيل الصحيح للـ GL
    const voucherPayload: any = {
      vouch_id: voucherData.vouch_id, // رقم القيد - مطلوب للترحيل
      vouch_notes: voucherData.vouch_notes || "",
      vouch_date: voucherData.vouch_date,
      vouch_type: voucherData.vouch_type, // نوع القيد - مطلوب للترحيل
      vouch_status: voucherData.vouch_status || 1,
      pay_type: voucherData.pay_type,
      ref_no: voucherData.ref_no || "",
      vouch_amt: 0,
      opps_vouch: voucherData.opps_vouch || 0,
      commit: true, // ✅ عند الحفظ بعد التعديل، commit: true
      handling:
        voucherData.handling !== undefined && voucherData.handling !== null
          ? voucherData.handling
          : "",
      com: 1, // رقم الفرع - مطلوب للترحيل
      year: 1, // رقم السنة - مطلوب للترحيل
      upd_date: currentDate,
      upd_user: currentUsername || null,
    };

    const resolvedCost = normalizeCostValue(
      voucherData.cost_id,
      (voucherData as any).cost,
      voucherPayload.cost_id,
      (voucherPayload as any).cost,
      voucherRecord?.cost,
      voucherRecord?.cost_id,
    );

    if (resolvedCost !== null) {
      voucherPayload.cost_id = resolvedCost;
      (voucherPayload as any).cost = resolvedCost;
    } else {
      voucherPayload.cost_id = null;
      (voucherPayload as any).cost = null;
    }

    // إضافة cust للسندات الذهبية
    if ([4, 5, 111, 222].includes(voucherData.vouch_type)) {
      const custValue =
        voucherData.cust_id !== undefined &&
        voucherData.cust_id !== null &&
        voucherData.cust_id > 0
          ? voucherData.cust_id
          : null;

      if (custValue && custValue > 0) {
        voucherPayload.cust = custValue;
      }
      // لا تحذف cust_id إذا كان موجوداً في voucherPayload، فقط أضف cust
      // delete voucherPayload.cust_id; // تم إزالة هذا السطر لأنه يحذف العميل
    }

    // تحديث السند الرئيسي
    console.log("[updateVoucherAction] Sending voucher payload:", {
      id: realVoucherId,
      vouch_id: voucherPayload.vouch_id,
      vouch_type: voucherPayload.vouch_type,
      com: voucherPayload.com,
      year: voucherPayload.year,
      detailsCount: details.length,
      deletedDetailsCount: deletedDetailIds.length,
    });

    const voucherResponse = await voucherService.update(
      realVoucherId,
      voucherPayload,
    );

    // تسجيل الاستجابة للتحقق
    console.log("[updateVoucherAction] Voucher update response:", {
      success: voucherResponse.success,
      message: voucherResponse.message,
      data: voucherResponse.data,
    });

    if (!voucherResponse.success) {
      return {
        success: false,
        message: voucherResponse.message || "خطأ في تحديث القيد",
      };
    }

    if (requiresBoxes(voucherData.vouch_type)) {
      const boxesResult = await updateVoucherBoxes(
        realVoucherId,
        voucherBoxes,
        deletedBoxIds,
        voucherData.vouch_type,
        currentDate,
        currentUsername,
      );

      if (!boxesResult.success) {
        return {
          success: false,
          message: boxesResult.error || "خطأ في تحديث الصناديق",
        };
      }
    }

    // تحديث التفاصيل
    const branchId = voucherRecord
      ? Number(voucherRecord.com_id ?? voucherRecord.com ?? 1) || 1
      : 1;
    const detailsResult = await updateVoucherDetails(
      realVoucherId,
      details,
      deletedDetailIds,
      currentDate,
      currentUsername,
      branchId,
      voucherData.vouch_type,
    );

    if (!detailsResult.success) {
      return {
        success: false,
        message: detailsResult.error || "خطأ في تحديث التفاصيل",
      };
    }

    // تحديث تفاصيل الذهب
    const goldResult = await updateGoldDetails(
      realVoucherId,
      goldDetails,
      voucherData.vouch_type,
      currentDate,
      currentUsername,
      deletedGoldDetailIds,
    );

    if (!goldResult.success) {
      return {
        success: false,
        message: goldResult.error || "خطأ في تحديث تفاصيل الذهب",
      };
    }

    // إعادة جلب التفاصيل المحدثة من قاعدة البيانات لضمان استخدام القيم الصحيحة في الترحيل إلى GL
    // استخدام fetch مباشرة مع cache: "no-store" لتجنب مشاكل الـ cache
    console.log("[updateVoucherAction] Fetching updated details from database (bypassing cache)...");
    let updatedDetails: any[] = [];
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
      }

      const token = await getCookieAction(STORAGE_KEYS.ACCESS_TOKEN);
      const queryParams = createParams({
        xvouch_id: realVoucherId,
        xcom_id: branchId.toString(),
        page: "1",
      });
      
      const url = `${baseUrl}/vouchers_dtl_list?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token ? `Bearer ${token.replace(/['"]+/g, "")}` : "",
        },
        cache: "no-store", // تخطي الـ cache تماماً لضمان جلب البيانات المحدثة
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log("[updateVoucherAction] API Response structure:", {
        hasResults: !!data.results,
        isArray: Array.isArray(data),
        hasData: !!data.data,
        dataKeys: Object.keys(data || {}),
      });
      
      // معالجة الاستجابة (pagination أو array مباشرة)
      let detailsArray: any[] = [];
      if (data.results && Array.isArray(data.results)) {
        detailsArray = data.results;
        console.log("[updateVoucherAction] Found details in data.results");
      } else if (Array.isArray(data)) {
        detailsArray = data;
        console.log("[updateVoucherAction] Found details as direct array");
      } else if (data.data) {
        if (Array.isArray(data.data)) {
          detailsArray = data.data;
          console.log("[updateVoucherAction] Found details in data.data");
        } else if (data.data.results && Array.isArray(data.data.results)) {
          detailsArray = data.data.results;
          console.log("[updateVoucherAction] Found details in data.data.results");
        }
      }

      if (detailsArray.length > 0) {
        updatedDetails = detailsArray;
        console.log(`[updateVoucherAction] ✅ Fetched ${updatedDetails.length} updated details from database (bypassed cache)`);
        
        // تسجيل القيم المحدثة للتحقق
        updatedDetails.forEach((d, index) => {
          console.log(`[updateVoucherAction] Detail ${index + 1} (all fields):`, d);
          console.log(`[updateVoucherAction] Detail ${index + 1} (account fields):`, {
            acc_id: d.acc_id,
            acc: d.acc,
            account: d.account,
            account_id: d.account_id,
            vouch: d.vouch,
          });
        });
      } else {
        console.warn("[updateVoucherAction] ⚠️ No details found in response, using original details");
        console.warn("[updateVoucherAction] Response data:", JSON.stringify(data, null, 2));
        updatedDetails = details;
      }
    } catch (fetchError) {
      console.error("[updateVoucherAction] Error fetching updated details:", fetchError);
      // Fallback: استخدام التفاصيل الأصلية إذا حدث خطأ
      updatedDetails = details;
    }

    // ترحيل القيد للـ GL يدوياً بعد تحديث جميع التفاصيل
    // دمج: استخدام acc_id من details الأصلية (لأن API لا يعيده) مع القيم المحدثة من updatedDetails
    console.log("[updateVoucherAction] ========== POSTING TO GL ==========");
    console.log(`[updateVoucherAction] Original details count: ${details.length}`);
    console.log(`[updateVoucherAction] Updated details count: ${updatedDetails.length}`);
    console.log(`[updateVoucherAction] Voucher ID: ${realVoucherId}, Vouch ID: ${voucherData.vouch_id}, Type: ${voucherData.vouch_type}`);
    
    // التأكد من أن لدينا تفاصيل للترحيل
    if (details.length === 0) {
      console.error("[updateVoucherAction] ❌ CRITICAL: No details available for GL posting!");
      console.error("[updateVoucherAction] This means the voucher has no details. Skipping GL posting.");
    } else {
      // دمج التفاصيل: استخدام acc_id من details الأصلية والقيم المحدثة من updatedDetails
      // إذا كانت updatedDetails موجودة، نستخدم القيم منها، وإلا نستخدم details الأصلية
      const glDetails = details.map((originalDetail, index) => {
        // البحث عن التفصيل المحدث المقابل (حسب الفهرس أو acc_id)
        const updatedDetail = updatedDetails.length > index ? updatedDetails[index] : null;
        
        // استخدام القيم المحدثة إذا كانت متاحة، وإلا استخدام القيم الأصلية
        const detailToUse = updatedDetail || originalDetail;
        
        // تحويل القيم من strings إلى numbers إذا لزم الأمر
        const parseValue = (val: any): number => {
          if (val === null || val === undefined) return 0;
          const num = typeof val === 'string' ? parseFloat(val) : Number(val);
          return Number.isFinite(num) ? num : 0;
        };
        
        const glDetail = {
          acc_id: originalDetail.acc_id || 0, // دائماً من details الأصلية لأن API لا يعيده
          debit: parseValue(detailToUse.debit || detailToUse.debit_base),
          credit: parseValue(detailToUse.credit || detailToUse.credit_base),
          debit_base: parseValue(detailToUse.debit_base || detailToUse.debit),
          credit_base: parseValue(detailToUse.credit_base || detailToUse.credit),
          g_debit: parseValue(detailToUse.g_debit || detailToUse.g_debit_base),
          g_credit: parseValue(detailToUse.g_credit || detailToUse.g_credit_base),
          g_debit_base: parseValue(detailToUse.g_debit_base || detailToUse.g_debit),
          g_credit_base: parseValue(detailToUse.g_credit_base || detailToUse.g_credit),
          cost_id: detailToUse.cost_id || originalDetail.cost_id || null,
          vouch_notes: detailToUse.vouch_notes || detailToUse.notes || originalDetail.vouch_notes || "",
        };
        
        console.log(`[updateVoucherAction] GL Detail ${index + 1}:`, {
          acc_id: glDetail.acc_id,
          debit: glDetail.debit,
          credit: glDetail.credit,
          g_debit: glDetail.g_debit,
          g_credit: glDetail.g_credit,
        });
        
        return glDetail;
      });
      
      console.log(`[updateVoucherAction] Prepared ${glDetails.length} details for GL posting`);
      
      try {
        console.log("[updateVoucherAction] Calling postVoucherToGL...");
        const glPostResult = await postVoucherToGL({
          voucher_id: Number(realVoucherId), // id من جدول vouchers (primary key)
          vouch_id: Number(voucherData.vouch_id), // رقم القيد (للرجوع إليه)
          vouch_type: voucherData.vouch_type,
          vouch_date: voucherData.vouch_date,
          ref_no: voucherData.ref_no || "",
          vouch_notes: voucherData.vouch_notes || "",
          details: glDetails,
          voucherBoxes: voucherBoxes, // إضافة الصناديق للترحيل
          com: 1,
          year: 1,
          cust_id: voucherData.cust_id || null,
        });

        console.log("[updateVoucherAction] postVoucherToGL returned:", {
          success: glPostResult.success,
          createdCount: glPostResult.createdCount,
          error: glPostResult.error,
        });

        if (glPostResult.success) {
          console.log(`[updateVoucherAction] ✅ SUCCESS: Posted ${glPostResult.createdCount} GL transactions`);
        } else {
          console.error(`[updateVoucherAction] ❌ FAILED: Failed to post to GL: ${glPostResult.error}`);
          // لا نفشل العملية، فقط نسجل الخطأ
        }
      } catch (glPostError) {
        console.error("[updateVoucherAction] ❌ EXCEPTION: Error posting to GL:", glPostError);
        console.error("[updateVoucherAction] Error stack:", glPostError instanceof Error ? glPostError.stack : "No stack trace");
        // لا نفشل العملية، فقط نسجل الخطأ
      }
    }
    console.log("[updateVoucherAction] ========== END POSTING TO GL ==========");

    // Revalidate paths
    // استخدام vouch_id في revalidatePath لأن URL يستخدم vouch_id
    revalidateVoucherPaths(
      voucherData.vouch_type,
      realVoucherId,
      Number(voucherData.vouch_id),
    );

    console.log("=== [updateVoucherAction] SUCCESS ===");
    console.log("Real Voucher ID:", realVoucherId);
    console.log("Vouch ID:", voucherData.vouch_id);
    
    return {
      success: true,
      data: { vouch_id: voucherData.vouch_id, id: realVoucherId },
      message: "تم تحديث القيد بنجاح",
    };
  } catch (error) {
    console.error("=== [updateVoucherAction] ERROR ===");
    console.error("Error:", error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ",
    };
  }
}
