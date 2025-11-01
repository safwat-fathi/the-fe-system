"use server";

import { revalidatePath } from "next/cache";

import { voucherService } from "@/services/api";
import type { VoucherBox } from "@/types/voucher";

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
  cust_id?: number | null; // العميل
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

interface VoucherBoxData {
  id?: number;
  box_id: number;
  amount: number;
  vouch_notes?: string;
  cost_id?: number | null;
  inv_id?: number;
  vat_no?: number; // الرقم الضريبي
  tax_prc?: number; // نسبة الضريبة
  tax?: number; // قيمة الضريبة
  close_weight?: number; // وزن التسكير
}

interface GVoucherDetailData {
  id?: number;
  item_id: number;
  k?: number;
  weight?: number;
  g_weight?: number;
  weight2?: number;
  g_weight2?: number;
  box_id?: number;
  notes?: string;
  diff?: number;
  close_amt?: number;
  close_weight?: number;
  inv_id?: number | null;
  cost_id?: number | null;
  work_amt?: number;
  total_work?: number;
  qty?: number;
}

export async function createVoucherAction(
  voucherData: SaveVoucherData,
  details: VoucherDetailData[] = [],
  voucherBoxes: VoucherBoxData[] = [],
  goldDetails: GVoucherDetailData[] = [],
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

    // التحقق من التوازن إذا كان سند قبض (1) أو صرف (2)
    if (voucherData.vouch_type === 1 || voucherData.vouch_type === 2) {
      const totalBoxes = voucherBoxes.reduce(
        (sum, box) => sum + (box.amount || 0),
        0,
      );

      const totalDetails =
        voucherData.vouch_type === 1
          ? details.reduce(
              (sum, detail) => sum + (detail.credit || 0),
              0,
            )
          : details.reduce((sum, detail) => sum + (detail.debit || 0), 0);

      if (Math.abs(totalBoxes - totalDetails) > 0.01) {
        // السماح بفرق صغير بسبب الأرقام العشرية
        return {
          success: false,
          message: `غير متزن: إجمالي النقدية (${totalBoxes.toFixed(2)}) يجب أن يساوي إجمالي التفاصيل (${totalDetails.toFixed(2)})`,
        };
      }
    }

    // حفظ صفوف جدول النقدية (vouchers_box) إذا كان سند قبض أو صرف
    if (
      (voucherData.vouch_type === 1 || voucherData.vouch_type === 2) &&
      voucherBoxes.length > 0
    ) {
      for (let i = 0; i < voucherBoxes.length; i++) {
        const box = voucherBoxes[i];

        if (!box.box_id || box.box_id === 0 || !box.amount || box.amount === 0) {
          continue;
        }

        const boxData: any = {
          vouch: masterId, // API يستخدم vouch وليس vouch_id
          box: box.box_id, // API يستخدم box وليس box_id
          vouch_amt: box.amount.toString(), // API يتوقع string
          vouch_base_amt: box.amount.toString(), // المبلغ الأساسي
          box_note: box.vouch_notes || "", // API يستخدم box_note وليس vouch_notes
          com: 1,
          cur: 1, // العملة - مطلوبة في API
          tax_prc: (box.tax_prc || 0).toString(), // نسبة الضريبة
          tax: (box.tax || 0).toString(), // مبلغ الضريبة
          change: "1.00000", // سعر الصرف
          vouch_status: 1, // حالة السند
          close_weight: box.close_weight || null, // وزن التسكير
          vat_no: box.vat_no || null, // الرقم الضريبي
          cr_date: new Date().toISOString(),
        };

        // إضافة cost و inv فقط إذا كانت موجودة
        if (box.cost_id && box.cost_id > 0) {
          boxData.cost = box.cost_id;
        }
        if (box.inv_id && box.inv_id > 0) {
          boxData.inv = box.inv_id;
        }

        console.log(`📤 حفظ صندوق ${i + 1}:`, boxData);

        const boxResponse = await voucherService.createBox(boxData as any);

        if (!boxResponse.success) {
          console.error(`❌ فشل حفظ الصندوق ${i + 1}:`, boxResponse.message);
          console.error("📤 البيانات:", boxData);

          return {
            success: false,
            message: `فشل حفظ الصندوق: ${boxResponse.message}`,
          };
        }
      }
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

    // حفظ تفاصيل الذهب (gvouchers_dtl) إذا كان سند ذهبي (4 أو 5)
    if (
      (voucherData.vouch_type === 4 || voucherData.vouch_type === 5) &&
      goldDetails.length > 0
    ) {
      for (let i = 0; i < goldDetails.length; i++) {
        const goldDetail = goldDetails[i];

        if (!goldDetail.item_id || goldDetail.item_id === 0) {
          continue;
        }

        const goldDetailData: any = {
          vouch: masterId, // API يستخدم vouch وليس vouch_id
          item: goldDetail.item_id, // API يستخدم item وليس item_id
          com: 1,
          vouch_status: 1,
          cr_date: new Date().toISOString(),
        };

        // إضافة الحقول الاختيارية
        if (goldDetail.k !== undefined && goldDetail.k !== null) {
          goldDetailData.k = goldDetail.k.toString();
        }
        if (goldDetail.weight !== undefined && goldDetail.weight !== null) {
          goldDetailData.weight = goldDetail.weight.toString();
        }
        if (goldDetail.g_weight !== undefined && goldDetail.g_weight !== null) {
          goldDetailData.g_weight = goldDetail.g_weight.toString();
        }
        if (goldDetail.weight2 !== undefined && goldDetail.weight2 !== null) {
          goldDetailData.weight2 = goldDetail.weight2.toString();
        }
        if (goldDetail.g_weight2 !== undefined && goldDetail.g_weight2 !== null) {
          goldDetailData.g_weight2 = goldDetail.g_weight2.toString();
        }
        if (goldDetail.box_id && goldDetail.box_id > 0) {
          goldDetailData.box = goldDetail.box_id;
        }
        if (goldDetail.notes) {
          goldDetailData.notes = goldDetail.notes;
        }
        if (goldDetail.diff !== undefined && goldDetail.diff !== null) {
          goldDetailData.diff = goldDetail.diff.toString();
        }
        if (goldDetail.close_amt !== undefined && goldDetail.close_amt !== null) {
          goldDetailData.close_amt = goldDetail.close_amt.toString();
        }
        if (goldDetail.close_weight !== undefined && goldDetail.close_weight !== null) {
          goldDetailData.close_weight = goldDetail.close_weight.toString();
        }
        if (goldDetail.inv_id && goldDetail.inv_id > 0) {
          goldDetailData.inv = goldDetail.inv_id;
        }
        if (goldDetail.cost_id && goldDetail.cost_id > 0) {
          goldDetailData.cost = goldDetail.cost_id;
        }
        if (goldDetail.work_amt !== undefined && goldDetail.work_amt !== null) {
          goldDetailData.work_amt = goldDetail.work_amt.toString();
        }
        if (goldDetail.total_work !== undefined && goldDetail.total_work !== null) {
          goldDetailData.total_work = goldDetail.total_work.toString();
        }
        if (goldDetail.qty !== undefined && goldDetail.qty !== null) {
          goldDetailData.qty = goldDetail.qty.toString();
        }

        console.log(`📤 حفظ تفصيل الذهب ${i + 1}:`, goldDetailData);

        const goldDetailResponse = await voucherService.createGoldDetail(goldDetailData);

        if (!goldDetailResponse.success) {
          console.error(`❌ فشل حفظ تفصيل الذهب ${i + 1}:`, goldDetailResponse.message);
          console.error("📤 البيانات:", goldDetailData);

          return {
            success: false,
            message: `فشل حفظ تفصيل الذهب: ${goldDetailResponse.message}`,
          };
        }
      }
    }

    // Revalidate
    revalidatePath("/forms/voucher");
    revalidatePath("/forms/voucher1");
    revalidatePath("/forms/voucher2");
    revalidatePath("/forms/gvoucher4");
    revalidatePath("/forms/gvoucher5");
    revalidatePath("/reports/vouchers");
    
    // Revalidate based on voucher type
    if (voucherData.vouch_type === 1) {
      revalidatePath(`/forms/voucher1/${masterId}`);
    } else if (voucherData.vouch_type === 2) {
      revalidatePath(`/forms/voucher2/${masterId}`);
    } else if (voucherData.vouch_type === 4) {
      revalidatePath(`/forms/gvoucher4/${masterId}`);
    } else if (voucherData.vouch_type === 5) {
      revalidatePath(`/forms/gvoucher5/${masterId}`);
    } else {
      revalidatePath(`/forms/voucher/${masterId}`);
    }

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
  voucherBoxes: VoucherBoxData[] = [],
  deletedBoxIds: number[] = [],
  goldDetails: GVoucherDetailData[] = [],
  deletedGoldDetailIds: number[] = [],
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
    const voucherPayload: any = {
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

    // إضافة cust_id إذا كان موجوداً (للسندات الذهبية)
    if (voucherData.cust_id !== undefined && voucherData.cust_id !== null) {
      voucherPayload.cust_id = voucherData.cust_id;
    }

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

    // التحقق من التوازن إذا كان سند قبض (1) أو صرف (2)
    if (voucherData.vouch_type === 1 || voucherData.vouch_type === 2) {
      const totalBoxes = voucherBoxes.reduce(
        (sum, box) => sum + (box.amount || 0),
        0,
      );

      const totalDetails =
        voucherData.vouch_type === 1
          ? details.reduce(
              (sum, detail) => sum + (detail.credit || 0),
              0,
            )
          : details.reduce((sum, detail) => sum + (detail.debit || 0), 0);

      if (Math.abs(totalBoxes - totalDetails) > 0.01) {
        return {
          success: false,
          message: `غير متزن: إجمالي النقدية (${totalBoxes.toFixed(2)}) يجب أن يساوي إجمالي التفاصيل (${totalDetails.toFixed(2)})`,
        };
      }
    }

    // حذف الصناديق المحذوفة أولاً
    if (deletedBoxIds.length > 0) {
      console.log("🗑️ حذف الصناديق المحذوفة:", deletedBoxIds);
      for (const boxId of deletedBoxIds) {
        if (boxId && boxId > 0) {
          const deleteResponse = await voucherService.deleteBox(boxId);

          if (!deleteResponse.success) {
            console.error(
              `❌ فشل حذف الصندوق ${boxId}:`,
              deleteResponse.message,
            );
          }
        }
      }
    }

    // حفظ/تحديث صفوف جدول النقدية (vouchers_box)
    if (
      (voucherData.vouch_type === 1 || voucherData.vouch_type === 2) &&
      voucherBoxes.length > 0
    ) {
      // جلب الصناديق الحالية
      const existingBoxesResponse = await voucherService.getBoxes(realVoucherId);
      const existingBoxIds =
        existingBoxesResponse.success && existingBoxesResponse.data
          ? (existingBoxesResponse.data as any[])
              .map((b: any) => b.id)
              .filter((id: any) => id && id > 0)
          : [];

      const newBoxIds = voucherBoxes
        .filter((b) => b.id && b.id > 0)
        .map((b) => b.id!);

      const boxIdsToDelete = existingBoxIds.filter(
        (id: number) => !newBoxIds.includes(id),
      );

      // حذف الصناديق المحذوفة
      for (const boxId of boxIdsToDelete) {
        if (boxId && boxId > 0) {
          const deleteResponse = await voucherService.deleteBox(boxId);

          if (!deleteResponse.success) {
            console.error(
              `❌ فشل حذف الصندوق ${boxId}:`,
              deleteResponse.message,
            );
          }
        }
      }

      // حفظ/تحديث الصناديق
      for (let i = 0; i < voucherBoxes.length; i++) {
        const box = voucherBoxes[i];

        if (!box.box_id || box.box_id === 0 || !box.amount || box.amount === 0) {
          continue;
        }

        const boxData: any = {
          vouch: realVoucherId, // API يستخدم vouch وليس vouch_id
          box: box.box_id, // API يستخدم box وليس box_id
          vouch_amt: box.amount.toString(), // API يتوقع string
          vouch_base_amt: box.amount.toString(), // المبلغ الأساسي
          box_note: box.vouch_notes || "", // API يستخدم box_note وليس vouch_notes
          com: 1,
          cur: 1, // العملة - مطلوبة في API
          tax_prc: (box.tax_prc || 0).toString(), // نسبة الضريبة
          tax: (box.tax || 0).toString(), // مبلغ الضريبة
          change: "1.00000", // سعر الصرف
          vouch_status: 1, // حالة السند
          close_weight: box.close_weight || null, // وزن التسكير
          vat_no: box.vat_no || null, // الرقم الضريبي
          cr_date: new Date().toISOString(),
        };

        // إضافة cost و inv فقط إذا كانت موجودة
        if (box.cost_id && box.cost_id > 0) {
          boxData.cost = box.cost_id;
        }
        if (box.inv_id && box.inv_id > 0) {
          boxData.inv = box.inv_id;
        }

        const boxResponse =
          box.id && box.id > 0
            ? await voucherService.updateBox(box.id, boxData as any)
            : await voucherService.createBox(boxData as any);

        if (!boxResponse.success) {
          console.error(`❌ فشل حفظ الصندوق ${i + 1}:`, boxResponse.message);
          console.error("📤 البيانات:", boxData);

          return {
            success: false,
            message: `فشل حفظ الصندوق: ${boxResponse.message}`,
          };
        }
      }
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

    // حفظ تفاصيل الذهب (gvouchers_dtl) إذا كان سند ذهبي (4 أو 5)
    if (
      (voucherData.vouch_type === 4 || voucherData.vouch_type === 5) &&
      goldDetails.length > 0
    ) {
      // حذف تفاصيل الذهب المحذوفة أولاً
      if (deletedGoldDetailIds.length > 0) {
        console.log("🗑️ حذف تفاصيل الذهب المحذوفة:", deletedGoldDetailIds);
        for (const goldDetailId of deletedGoldDetailIds) {
          if (goldDetailId && goldDetailId > 0) {
            const deleteResponse = await voucherService.deleteGoldDetail(goldDetailId);

            if (!deleteResponse.success) {
              console.error(
                `❌ فشل حذف تفصيل الذهب ${goldDetailId}:`,
                deleteResponse.message,
              );
            }
          }
        }
      }

      // جلب تفاصيل الذهب الحالية
      const existingGoldDetailsResponse = await voucherService.getGoldDetails(realVoucherId);
      const existingGoldDetailIds =
        existingGoldDetailsResponse.success && existingGoldDetailsResponse.data
          ? (existingGoldDetailsResponse.data as any[])
              .map((d: any) => d.id)
              .filter((id: any) => id && id > 0)
          : [];

      const newGoldDetailIds = goldDetails
        .filter((d) => d.id && d.id > 0)
        .map((d) => d.id!);

      const goldDetailIdsToDelete = existingGoldDetailIds.filter(
        (id: number) => !newGoldDetailIds.includes(id),
      );

      // حذف تفاصيل الذهب المحذوفة
      for (const goldDetailId of goldDetailIdsToDelete) {
        if (goldDetailId && goldDetailId > 0) {
          const deleteResponse = await voucherService.deleteGoldDetail(goldDetailId);

          if (!deleteResponse.success) {
            console.error(
              `❌ فشل حذف تفصيل الذهب ${goldDetailId}:`,
              deleteResponse.message,
            );
          }
        }
      }

      // حفظ/تحديث تفاصيل الذهب
      for (let i = 0; i < goldDetails.length; i++) {
        const goldDetail = goldDetails[i];

        if (!goldDetail.item_id || goldDetail.item_id === 0) {
          continue;
        }

        const goldDetailData: any = {
          vouch: realVoucherId, // API يستخدم vouch وليس vouch_id
          item: goldDetail.item_id, // API يستخدم item وليس item_id
          com: 1,
          vouch_status: 1,
          cr_date: new Date().toISOString(),
        };

        // إضافة الحقول الاختيارية
        if (goldDetail.k !== undefined && goldDetail.k !== null) {
          goldDetailData.k = goldDetail.k.toString();
        }
        if (goldDetail.weight !== undefined && goldDetail.weight !== null) {
          goldDetailData.weight = goldDetail.weight.toString();
        }
        if (goldDetail.g_weight !== undefined && goldDetail.g_weight !== null) {
          goldDetailData.g_weight = goldDetail.g_weight.toString();
        }
        if (goldDetail.weight2 !== undefined && goldDetail.weight2 !== null) {
          goldDetailData.weight2 = goldDetail.weight2.toString();
        }
        if (goldDetail.g_weight2 !== undefined && goldDetail.g_weight2 !== null) {
          goldDetailData.g_weight2 = goldDetail.g_weight2.toString();
        }
        if (goldDetail.box_id && goldDetail.box_id > 0) {
          goldDetailData.box = goldDetail.box_id;
        }
        if (goldDetail.notes) {
          goldDetailData.notes = goldDetail.notes;
        }
        if (goldDetail.diff !== undefined && goldDetail.diff !== null) {
          goldDetailData.diff = goldDetail.diff.toString();
        }
        if (goldDetail.close_amt !== undefined && goldDetail.close_amt !== null) {
          goldDetailData.close_amt = goldDetail.close_amt.toString();
        }
        if (goldDetail.close_weight !== undefined && goldDetail.close_weight !== null) {
          goldDetailData.close_weight = goldDetail.close_weight.toString();
        }
        if (goldDetail.inv_id && goldDetail.inv_id > 0) {
          goldDetailData.inv = goldDetail.inv_id;
        }
        if (goldDetail.cost_id && goldDetail.cost_id > 0) {
          goldDetailData.cost = goldDetail.cost_id;
        }
        if (goldDetail.work_amt !== undefined && goldDetail.work_amt !== null) {
          goldDetailData.work_amt = goldDetail.work_amt.toString();
        }
        if (goldDetail.total_work !== undefined && goldDetail.total_work !== null) {
          goldDetailData.total_work = goldDetail.total_work.toString();
        }
        if (goldDetail.qty !== undefined && goldDetail.qty !== null) {
          goldDetailData.qty = goldDetail.qty.toString();
        }

        const goldDetailResponse =
          goldDetail.id && goldDetail.id > 0
            ? await voucherService.updateGoldDetail(goldDetail.id, goldDetailData)
            : await voucherService.createGoldDetail(goldDetailData);

        if (!goldDetailResponse.success) {
          console.error(`❌ فشل حفظ تفصيل الذهب ${i + 1}:`, goldDetailResponse.message);
          console.error("📤 البيانات:", goldDetailData);

          return {
            success: false,
            message: `فشل حفظ تفصيل الذهب: ${goldDetailResponse.message}`,
          };
        }
      }
    }

    // Revalidate
    revalidatePath("/forms/voucher");
    revalidatePath("/forms/voucher1");
    revalidatePath("/forms/voucher2");
    revalidatePath("/forms/gvoucher4");
    revalidatePath("/forms/gvoucher5");
    revalidatePath("/reports/vouchers");
    
    // Revalidate based on voucher type
    if (voucherData.vouch_type === 1) {
      revalidatePath(`/forms/voucher1/${realVoucherId}`);
    } else if (voucherData.vouch_type === 2) {
      revalidatePath(`/forms/voucher2/${realVoucherId}`);
    } else if (voucherData.vouch_type === 4) {
      revalidatePath(`/forms/gvoucher4/${realVoucherId}`);
    } else if (voucherData.vouch_type === 5) {
      revalidatePath(`/forms/gvoucher5/${realVoucherId}`);
    } else {
      revalidatePath(`/forms/voucher/${realVoucherId}`);
    }

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
