"use server";

import { revalidatePath } from "next/cache";

import { voucherService } from "@/services/api";

interface SaveVoucherData {
  vouch_id: number;
  vouch_date: string;
  vouch_type: number;
  vouch_amt: number;
  vouch_notes?: string;
  vouch_status?: number;
  pay_type: number;
  ref_no?: string;
  opps_vouch?: number;
}

interface VoucherDetailData {
  id?: number;
  vouch_id: number;
  acc_id: number;
  debit: number | undefined;
  credit: number | undefined;
  debit_g: number | undefined;
  credit_g: number | undefined;
  gauge: number | undefined;
  vouch_notes?: string;
  cost_id?: number | null;
  tax: number | undefined;
  tax_prc: number | undefined;
  vat_no: number | undefined;
}

export async function createVoucherAction(
  voucherData: SaveVoucherData,
  details: VoucherDetailData[],
) {
  try {
    console.log("🆕 بدء إنشاء قيد جديد:", voucherData);

    // تجهيز بيانات القيد
    const voucherPayload = {
      ...voucherData,
      com: 1, // الفرع = 1
      year: 1, // السنة = 1
      cr_date: new Date().toISOString(),
      vouch_amt: 0, // إبقاء المبلغ الإجمالي 0 دائماً
      opps_vouch: voucherData.opps_vouch || 0, // حفظ قيمة opps_vouch من API
      commit: true, // تحديد القيد كـ محفوظ بعد الحفظ
    };

    console.log("📤 بيانات الإنشاء:", voucherPayload);

    // حفظ السند الرئيسي
    const voucherResponse = await voucherService.create(voucherPayload);

    console.log("📥 استجابة الإنشاء:", voucherResponse);

    if (!voucherResponse.success || !voucherResponse.data) {
      console.error("❌ فشل حفظ القيد:", voucherResponse.message);
      console.error("📤 البيانات:", voucherPayload);

      return {
        success: false,
        message: voucherResponse.message || "خطأ في حفظ القيد",
      };
    }

    const savedVoucher = voucherResponse.data;
    const masterId = (savedVoucher as any).id; // استخدام id من الجدول (ليس vouch_id)

    console.log("✅ تم حفظ القيد - المعرف:", masterId);

    if (!masterId || masterId <= 0) {
      return {
        success: false,
        message: "لم يتم الحصول على رقم القيد",
      };
    }

    // حفظ التفاصيل
    for (let i = 0; i < details.length; i++) {
      const detail = details[i];

      if (!detail.acc_id || detail.acc_id === 0) {
        continue;
      }

      const detailData = {
        vouch: masterId, // id من جدول vouchers
        acc: detail.acc_id, // رقم الحساب فقط
        debit: detail.debit || 0,
        credit: detail.credit || 0,
        debit_g: detail.debit_g || 0,
        credit_g: detail.credit_g || 0,
        gauge: detail.gauge || 875,
        vouch_notes: detail.vouch_notes || "",
        cost_id: detail.cost_id || null,
        tax: detail.tax || 0,
        tax_prc: detail.tax_prc || 0,
        vat_no: detail.vat_no || 0,
        com: 1, // الفرع = 1
        year: 1, // السنة = 1
        cr_date: new Date().toISOString(),
      };

      console.log(`📤 حفظ التفصيل ${i + 1}:`, detailData);

      const detailResponse = await voucherService.createDetail(detailData);

      if (!detailResponse.success) {
        console.error(`❌ فشل حفظ التفصيل ${i + 1}:`, detailResponse.message);
        console.error("📤 البيانات:", detailData);

        return {
          success: false,
          message: `فشل حفظ التفصيل: ${detailResponse.message}`,
        };
      }
    }

    // Revalidate
    revalidatePath("/forms/voucher");
    revalidatePath("/reports/vouchers");
    revalidatePath(`/forms/voucher/${masterId}`);

    // الحصول على vouch_id من القيد المحفوظ
    const savedVouchId = (savedVoucher as any).vouch_id || voucherData.vouch_id;

    return {
      success: true,
      data: {
        id: masterId, // id الحقيقي من قاعدة البيانات (primary key)
        vouch_id: savedVouchId, // رقم القيد المعروض للمستخدم
      },
      message: "تم حفظ القيد بنجاح",
    };
  } catch (error) {
    console.error("💥 خطأ:", error);

    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ",
    };
  }
}

export async function updateVoucherAction(
  voucherData: SaveVoucherData,
  details: VoucherDetailData[],
  deletedDetailIds: number[] = [],
  voucherRecordId?: number, // الـ id الحقيقي من قاعدة البيانات (اختياري)
) {
  try {
    console.log("🔄 بدء تحديث القيد:", voucherData);

    // التحقق من صحة البيانات
    if (!voucherData.vouch_id || voucherData.vouch_id <= 0) {
      console.error("❌ معرف القيد غير صحيح:", voucherData.vouch_id);

      return {
        success: false,
        message: "معرف القيد غير صحيح",
      };
    }

    let realVoucherId: number;
    let voucherRecord: any = null; // تعريف voucherRecord خارج if

    // إذا كان voucherRecordId موجوداً، استخدمه مباشرة (الأفضل والأسرع)
    if (voucherRecordId && voucherRecordId > 0) {
      realVoucherId = voucherRecordId;
      console.log("✅ استخدام voucherRecordId الممرر مباشرة:", realVoucherId);
      
      // جلب بيانات القيد للحصول على branchId لاحقاً
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: voucherData.vouch_type?.toString() || "0",
      });
      
      voucherRecord = vouchersResponse.data?.find(
        (v: any) => v.id === realVoucherId && v.vouch_type === (voucherData.vouch_type || 0),
      );
    } else {
      // البحث عن ID الحقيقي من قاعدة البيانات
      console.log("🔍 البحث عن ID الحقيقي للقيد:", voucherData.vouch_id);
      
      // للقيد الافتتاحي، نبحث عن القيود الافتتاحية فقط (vouch_type = 0)
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: voucherData.vouch_type?.toString() || "0",
      });
      
      voucherRecord = vouchersResponse.data?.find(
        (v: any) => 
          v.vouch_id === voucherData.vouch_id && 
          v.vouch_type === (voucherData.vouch_type || 0),
      );

      if (!voucherRecord || !voucherRecord.id) {
        console.error(
          "❌ لم يتم العثور على القيد في قاعدة البيانات:",
          voucherData.vouch_id,
        );

        return {
          success: false,
          message: "لم يتم العثور على القيد في قاعدة البيانات",
        };
      }

      realVoucherId = voucherRecord.id;
    }

    console.log(
      "✅ تم العثور على ID الحقيقي:",
      realVoucherId,
      "للـ vouch_id:",
      voucherData.vouch_id,
    );

    // تجهيز بيانات القيد للتحديث (فقط البيانات المطلوب تحديثها)
    const voucherPayload = {
      vouch_notes: voucherData.vouch_notes || "",
      vouch_date: voucherData.vouch_date,
      vouch_status: voucherData.vouch_status || 1,
      pay_type: voucherData.pay_type,
      ref_no: voucherData.ref_no || "",
      vouch_amt: 0, // إبقاء المبلغ الإجمالي 0 دائماً
      opps_vouch: voucherData.opps_vouch || 0, // حفظ قيمة opps_vouch من API
      commit: true, // تحديد القيد كـ محفوظ بعد الحفظ
      // إزالة com و year و cr_date لأنها لا تحتاج تحديث
    };

    console.log("📤 بيانات التحديث:", voucherPayload);
    console.log("🔗 URL المطلوب:", `api_update_vouch/${realVoucherId}`);
    console.log("🆔 معرف القيد الحقيقي:", realVoucherId);
    console.log("🔍 نوع البيانات المرسلة:", typeof voucherPayload);
    console.log("📋 محتوى البيانات:", JSON.stringify(voucherPayload, null, 2));

    // تحديث السند الرئيسي
    const voucherResponse = await voucherService.update(
      realVoucherId, // استخدام ID الحقيقي من قاعدة البيانات
      voucherPayload,
    );

    console.log("📥 استجابة التحديث:", voucherResponse);
    console.log("📊 حالة الاستجابة:", voucherResponse.success ? "نجح" : "فشل");
    console.log("💬 رسالة الاستجابة:", voucherResponse.message);

    if (!voucherResponse.success) {
      console.error("❌ فشل تحديث القيد:", voucherResponse.message);
      console.error("📤 البيانات:", voucherPayload);

      return {
        success: false,
        message: voucherResponse.message || "خطأ في تحديث القيد",
      };
    }

    // حذف التفاصيل المحذوفة أولاً
    if (deletedDetailIds.length > 0) {
      console.log("🗑️ حذف التفاصيل المحذوفة:", deletedDetailIds);
      for (const detailId of deletedDetailIds) {
        if (detailId && detailId > 0) {
          const deleteResponse = await voucherService.deleteDetail(detailId);

          if (!deleteResponse.success) {
            console.error(
              `❌ فشل حذف التفصيل ${detailId}:`,
              deleteResponse.message,
            );
            // لا نوقف العملية عند فشل الحذف، نتابع
          }
        }
      }
    }

    // حفظ/تحديث التفاصيل
    // استخدام realVoucherId الذي تم الحصول عليه مسبقاً
    const vouchMasterId = realVoucherId;

    // الحصول على التفاصيل الحالية من قاعدة البيانات
    // استخدام voucherRecord.com_id/com إذا كان متوفراً، وإلا استخدام 1 كافتراضي
    const branchId = voucherRecord
      ? Number(voucherRecord.com_id ?? voucherRecord.com ?? 1) || 1
      : 1;
    const existingDetailsResponse = await voucherService.getDetails(
      vouchMasterId,
      {
        xcom_id: branchId,
      },
    );
    const existingDetailIds =
      existingDetailsResponse.success && existingDetailsResponse.data
        ? existingDetailsResponse.data
            .map((d: any) => d.id)
            .filter((id: any) => id && id > 0)
        : [];

    // الحصول على IDs من التفاصيل الجديدة المرسلة
    const newDetailIds = details
      .filter((d) => d.id && d.id > 0)
      .map((d) => d.id!);

    // تحديد التفاصيل التي يجب حذفها (موجودة في قاعدة البيانات ولكن غير موجودة في التفاصيل الجديدة)
    const idsToDelete = existingDetailIds.filter(
      (id: number) => !newDetailIds.includes(id),
    );

    // حذف التفاصيل التي لم تعد موجودة
    for (const detailId of idsToDelete) {
      if (detailId && detailId > 0) {
        const deleteResponse = await voucherService.deleteDetail(detailId);

        if (!deleteResponse.success) {
          console.error(
            `❌ فشل حذف التفصيل ${detailId}:`,
            deleteResponse.message,
          );
        }
      }
    }

    for (let i = 0; i < details.length; i++) {
      const detail = details[i];

      if (!detail.acc_id || detail.acc_id === 0) {
        continue;
      }

      const detailData = {
        vouch: vouchMasterId, // id من جدول vouchers
        acc: detail.acc_id, // رقم الحساب فقط
        debit: detail.debit || 0,
        credit: detail.credit || 0,
        debit_g: detail.debit_g || 0,
        credit_g: detail.credit_g || 0,
        gauge: detail.gauge || 875,
        vouch_notes: detail.vouch_notes || "",
        cost_id: detail.cost_id || null,
        tax: detail.tax || 0,
        tax_prc: detail.tax_prc || 0,
        vat_no: detail.vat_no || 0,
        com: 1, // الفرع = 1
        year: 1, // السنة = 1
        cr_date: new Date().toISOString(),
      };

      const detailResponse =
        detail.id && detail.id > 0
          ? await voucherService.updateDetail(detail.id, detailData)
          : await voucherService.createDetail(detailData);

      if (!detailResponse.success) {
        console.error(`❌ فشل حفظ التفصيل ${i + 1}:`, detailResponse.message);
        console.error("📤 البيانات:", detailData);

        return {
          success: false,
          message: `فشل حفظ التفصيل: ${detailResponse.message}`,
        };
      }
    }

    // Revalidate
    revalidatePath("/forms/voucher");
    revalidatePath("/reports/vouchers");
    revalidatePath(`/forms/voucher/${voucherData.vouch_id}`);

    return {
      success: true,
      data: { vouch_id: voucherData.vouch_id, id: realVoucherId },
      message: "تم تحديث القيد بنجاح",
    };
  } catch (error) {
    console.error("💥 خطأ:", error);

    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ",
    };
  }
}

export async function deleteVoucherAction(voucherId: number) {
  try {
    const response = await voucherService.deleteVoucher(voucherId);

    if (response.success) {
      revalidatePath("/forms/voucher");
      revalidatePath("/reports/vouchers");

      return {
        success: true,
        message: "تم حذف السند بنجاح",
      };
    }

    return {
      success: false,
      message: response.message || "حدث خطأ أثناء حذف السند",
    };
  } catch (error) {
    console.error("💥 خطأ:", error);

    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ",
    };
  }
}
