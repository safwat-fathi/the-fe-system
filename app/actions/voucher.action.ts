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
}

interface VoucherDetailData {
  id?: number;
  vouch_id: number;
  acc_id: number;
  debit: number;
  credit: number;
  debit_g: number;
  credit_g: number;
  gauge: number;
  vouch_notes?: string;
  cost_id?: number | null;
  tax: number;
  tax_prc: number;
  vat_no: number;
}

export async function createVoucherAction(
  voucherData: SaveVoucherData,
  details: VoucherDetailData[],
) {
  try {
    // تجهيز بيانات القيد
    const voucherPayload = {
      ...voucherData,
      com: 1, // الفرع = 1
      year: 1, // السنة = 1
      cr_date: new Date().toISOString(),
    };

    // حفظ السند الرئيسي
    const voucherResponse = await voucherService.create(voucherPayload);

    if (!voucherResponse.success || !voucherResponse.data) {
      console.error("❌ فشل حفظ القيد:", voucherResponse.message);
      console.error("📤 البيانات:", voucherPayload);

      return {
        success: false,
        message: voucherResponse.message || "خطأ في حفظ القيد",
      };
    }

    const savedVoucher = voucherResponse.data;
    const masterId = savedVoucher.id; // استخدام id من الجدول (ليس vouch_id)

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

    return {
      success: true,
      data: { vouch_id: masterId },
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
) {
  try {
    // تجهيز بيانات القيد
    const voucherPayload = {
      ...voucherData,
      com: 1, // الفرع = 1
      year: 1, // السنة = 1
      cr_date: new Date().toISOString(),
    };

    // تحديث السند الرئيسي
    const voucherResponse = await voucherService.update(
      voucherData.vouch_id,
      voucherPayload,
    );

    if (!voucherResponse.success) {
      console.error("❌ فشل تحديث القيد:", voucherResponse.message);
      console.error("📤 البيانات:", voucherPayload);

      return {
        success: false,
        message: voucherResponse.message || "خطأ في تحديث القيد",
      };
    }

    // حفظ/تحديث التفاصيل
    // نحتاج لجلب id الحقيقي من جدول vouchers
    const vouchersResponse = await voucherService.getAll();
    const voucherRecord = vouchersResponse.data?.find(
      (v: any) => v.vouch_id === voucherData.vouch_id,
    );
    const vouchMasterId = voucherRecord?.id;

    if (!vouchMasterId) {
      return {
        success: false,
        message: "لم يتم العثور على القيد في قاعدة البيانات",
      };
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
      data: { vouch_id: voucherData.vouch_id },
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
    const response = await voucherService.delete(voucherId);

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
