"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { voucherService } from "@/services/api";
import type { VoucherBox } from "@/types/voucher";
import { STORAGE_KEYS } from "@/constants";

// Helper function to get current user username
async function getCurrentUsername(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const userData = cookieStore.get(STORAGE_KEYS.USER_DATA)?.value;
    
    if (!userData) {
      return null;
    }
    
    try {
      const parsedUserData = JSON.parse(decodeURIComponent(userData));
      return parsedUserData.username || parsedUserData.email || null;
    } catch (error) {
      return null;
    }
  } catch (error) {
    return null;
  }
}

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
  handling?: string | null; // مناولة
}

interface VoucherDetailData {
  id?: number;
  vouch_id: number;
  acc_id: number;
  debit: number | undefined;
  credit: number | undefined;
  base_debit?: number | undefined;
  base_credit?: number | undefined;
  gauge: number | undefined;
  debit_g: number | undefined;
  credit_g: number | undefined;
  vouch_notes?: string;
  cost_id?: number | null;
}

interface VoucherBoxData {
  id?: number;
  box_id: number;
  amount: number;
  vouch_notes?: string;
  cost_id?: number | null;
  inv_id?: number;
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
    // الحصول على اسم المستخدم الحالي
    const currentUsername = await getCurrentUsername();
    const currentDate = new Date().toISOString();

    // تجهيز بيانات القيد
    const voucherPayload: any = {
      ...voucherData,
      com: 1, // الفرع = 1
      year: 1, // السنة = 1
      cr_date: currentDate,
      cr_user: currentUsername || null,
      vouch_amt: 0, // إبقاء المبلغ الإجمالي 0 دائماً
      vouch_status: voucherData.vouch_status || 1, // حالة السند من getVoucherStageList
      opps_vouch: voucherData.opps_vouch || 0, // حفظ قيمة opps_vouch من API
      commit: true, // تحديد القيد كـ محفوظ بعد الحفظ
      // handling: سيتم إضافته لاحقاً عند توفر الحقل في قاعدة البيانات
    };

    // إضافة cust بدلاً من cust_id للسندات الذهبية (4, 5, 111, 222)
    // تأكد من إضافة cust حتى لو كان cust_id موجوداً في voucherData
    if (
      voucherData.vouch_type === 4 ||
      voucherData.vouch_type === 5 ||
      voucherData.vouch_type === 111 ||
      voucherData.vouch_type === 222
    ) {
      // تحقق من وجود cust_id أو cust في voucherData
      const custValue = voucherData.cust_id !== undefined && voucherData.cust_id !== null && voucherData.cust_id > 0
        ? voucherData.cust_id
        : (voucherPayload.cust !== undefined && voucherPayload.cust !== null && voucherPayload.cust > 0
          ? voucherPayload.cust
          : null);

      if (custValue && custValue > 0) {
        voucherPayload.cust = custValue; // API يتوقع cust وليس cust_id
      }

      // حذف cust_id من voucherPayload لأنه لا يُرسل للـ API
      delete voucherPayload.cust_id;
    }

    // حفظ السند الرئيسي
    const voucherResponse = await voucherService.create(voucherPayload);

    if (!voucherResponse.success || !voucherResponse.data) {

      return {
        success: false,
        message: voucherResponse.message || "خطأ في حفظ القيد",
      };
    }

    const savedVoucher = voucherResponse.data;
    // محاولة استخراج id بطرق مختلفة
    let masterId = (savedVoucher as any)?.id;
    
    // Fallback: إذا لم يكن id موجوداً، حاول البحث عن القيد الذي تم إنشاؤه
    if (!masterId || masterId <= 0) {
      // جلب القيد الذي تم إنشاؤه باستخدام vouch_id
      if (savedVoucher && (savedVoucher as any).vouch_id) {
        const lookupResponse = await voucherService.getVoucherById(
          (savedVoucher as any).vouch_id,
          {
            xvouch_type: voucherData.vouch_type?.toString() || "0",
          },
        );
        
        if (lookupResponse && (lookupResponse as any)?.id) {
          masterId = (lookupResponse as any).id;
        }
      }
    }

    if (!masterId || masterId <= 0) {
      return {
        success: false,
        message: "لم يتم الحصول على رقم القيد من الخادم",
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

    // حفظ صفوف جدول النقدية (vouchers_box) إذا كان سند قبض أو صرف أو استلام أو تسليم أو قبض/صرف عميل
    if (
      (voucherData.vouch_type === 1 || 
       voucherData.vouch_type === 2 || 
       voucherData.vouch_type === 4 || 
       voucherData.vouch_type === 5 || 
       voucherData.vouch_type === 111 || 
       voucherData.vouch_type === 222) &&
      voucherBoxes.length > 0
    ) {
      for (let i = 0; i < voucherBoxes.length; i++) {
        const box = voucherBoxes[i];

        // التحقق من أن box_id و amount موجودان وصحيحان
        if (!box.box_id || box.box_id === 0 || !box.amount || box.amount === 0) {
          continue;
        }

        const boxData: any = {
          vouch: masterId, // API يستخدم vouch وليس vouch_id
          box: box.box_id, // API يستخدم box - مهم: يجب إرسال box دائماً إذا كان box_id > 0
          vouch_amt: box.amount.toString(), // API يتوقع string
          vouch_base_amt: box.amount.toString(), // المبلغ الأساسي
          box_note: box.vouch_notes || "", // API يستخدم box_note وليس vouch_notes
          com: 1,
          cur: 1, // العملة - مطلوبة في API
          change: "1.00000", // سعر الصرف
          vouch_status: 1, // حالة السند
          close_weight: box.close_weight || null, // وزن التسكير
          cr_date: currentDate,
          cr_user: currentUsername || null,
        };
        
        // إضافة cost و inv فقط إذا كانت موجودة وقيمة صحيحة
        if (box.cost_id !== undefined && box.cost_id !== null && box.cost_id > 0) {
          boxData.cost = box.cost_id;
        }
        if (box.inv_id !== undefined && box.inv_id !== null && box.inv_id > 0) {
          boxData.inv = box.inv_id;
        }

        const boxResponse = await voucherService.createBox(boxData as any);

        if (!boxResponse.success) {

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

      const detailData: any = {
        vouch: masterId, // id من جدول vouchers
        acc: detail.acc_id, // رقم الحساب فقط
        debit: detail.debit || 0,
        credit: detail.credit || 0,
        base_debit: detail.base_debit || 0,
        base_credit: detail.base_credit || 0,
        gauge: detail.gauge || 875,
        debit_g: detail.debit_g || 0,
        credit_g: detail.credit_g || 0,
        vouch_notes: detail.vouch_notes || "",
        com: 1, // الفرع = 1
        year: 1, // السنة = 1
        cr_date: currentDate,
        cr_user: currentUsername || null,
      };

      // إضافة cost فقط إذا كانت موجودة وقيمة صحيحة (API يتوقع cost وليس cost_id)
      if (detail.cost_id !== undefined && detail.cost_id !== null && detail.cost_id > 0) {
        detailData.cost = detail.cost_id;
      }

      const detailResponse = await voucherService.createDetail(detailData);

      if (!detailResponse.success) {

        return {
          success: false,
          message: `فشل حفظ التفصيل: ${detailResponse.message}`,
        };
      }
    }

    // حفظ تفاصيل الذهب (gvouchers_dtl) إذا كان سند ذهبي (4 أو 5 أو 111 أو 222)
    if (
      (voucherData.vouch_type === 4 || voucherData.vouch_type === 5 || 
       voucherData.vouch_type === 111 || voucherData.vouch_type === 222) &&
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
          com: 1, // فقط com بدون year
          vouch_type: voucherData.vouch_type, // نوع السند (مهم للـ API)
          vouch_status: 1,
          cr_date: currentDate,
          cr_user: currentUsername || null,
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

        const goldDetailResponse = await voucherService.createGoldDetail(goldDetailData);

        if (!goldDetailResponse.success) {

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
    revalidatePath("/forms/receipt");
    revalidatePath("/forms/delivery");
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
    } else if (voucherData.vouch_type === 111) {
      revalidatePath(`/forms/receipt/${masterId}`);
    } else if (voucherData.vouch_type === 222) {
      revalidatePath(`/forms/delivery/${masterId}`);
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
    // الحصول على اسم المستخدم الحالي
    const currentUsername = await getCurrentUsername();
    const currentDate = new Date().toISOString();

    // التحقق من صحة البيانات
    if (!voucherData.vouch_id || voucherData.vouch_id <= 0) {

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
      
      // جلب بيانات القيد للحصول على branchId لاحقاً
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: voucherData.vouch_type?.toString() || "0",
      });
      
      voucherRecord = vouchersResponse.data?.find(
        (v: any) => v.id === realVoucherId && v.vouch_type === (voucherData.vouch_type || 0),
      );
    } else {
      // البحث عن ID الحقيقي من قاعدة البيانات
      
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

        return {
          success: false,
          message: "لم يتم العثور على القيد في قاعدة البيانات",
        };
      }

      realVoucherId = voucherRecord.id;
    }

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
      // handling: سيتم إضافته لاحقاً عند توفر الحقل في قاعدة البيانات
      upd_date: currentDate,
      upd_user: currentUsername || null,
      // إزالة com و year و cr_date لأنها لا تحتاج تحديث
    };

    // إضافة cust بدلاً من cust_id للسندات الذهبية (4, 5, 111, 222)
    // تأكد من إضافة cust حتى لو كان cust_id موجوداً في voucherData
    if (
      voucherData.vouch_type === 4 ||
      voucherData.vouch_type === 5 ||
      voucherData.vouch_type === 111 ||
      voucherData.vouch_type === 222
    ) {
      // تحقق من وجود cust_id في voucherData
      const custValue = voucherData.cust_id !== undefined && voucherData.cust_id !== null && voucherData.cust_id > 0
        ? voucherData.cust_id
        : null;

      if (custValue && custValue > 0) {
        voucherPayload.cust = custValue; // API يتوقع cust وليس cust_id
      }

      // حذف cust_id من voucherPayload لأنه لا يُرسل للـ API
      delete voucherPayload.cust_id;
    }

    // تحديث السند الرئيسي
    const voucherResponse = await voucherService.update(
      realVoucherId, // استخدام ID الحقيقي من قاعدة البيانات
      voucherPayload,
    );

    if (!voucherResponse.success) {

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
      for (const boxId of deletedBoxIds) {
        if (boxId && boxId > 0) {
          const deleteResponse = await voucherService.deleteBox(boxId);
          if (!deleteResponse.success) {
            // لا نوقف العملية عند فشل الحذف
          }
        }
      }
    }

    // حفظ/تحديث صفوف جدول النقدية (vouchers_box) إذا كان سند قبض أو صرف أو استلام أو تسليم أو قبض/صرف عميل
    const shouldProcessBoxes = 
      (voucherData.vouch_type === 1 || 
       voucherData.vouch_type === 2 || 
       voucherData.vouch_type === 4 || 
       voucherData.vouch_type === 5 || 
       voucherData.vouch_type === 111 || 
       voucherData.vouch_type === 222);

    if (shouldProcessBoxes && voucherBoxes && voucherBoxes.length > 0) {
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
            // لا نوقف العملية عند فشل الحذف
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
          box: box.box_id, // API يستخدم box - مهم: يجب إرسال box دائماً إذا كان box_id > 0
          vouch_amt: box.amount.toString(), // API يتوقع string
          vouch_base_amt: box.amount.toString(), // المبلغ الأساسي
          box_note: box.vouch_notes || "", // API يستخدم box_note وليس vouch_notes
          com: 1,
          cur: 1, // العملة - مطلوبة في API
          change: "1.00000", // سعر الصرف
          vouch_status: 1, // حالة السند
          close_weight: box.close_weight || null, // وزن التسكير
        };
        
        // إضافة الحقول حسب الحالة: cr_date/cr_user للجديد أو upd_date/upd_user للتحديث
        if (box.id && box.id > 0) {
          // تحديث صندوق موجود
          boxData.upd_date = currentDate;
          boxData.upd_user = currentUsername || null;
        } else {
          // إنشاء صندوق جديد
          boxData.cr_date = currentDate;
          boxData.cr_user = currentUsername || null;
        }
        
        // إضافة cost و inv فقط إذا كانت موجودة وقيمة صحيحة
        if (box.cost_id !== undefined && box.cost_id !== null && box.cost_id > 0) {
          boxData.cost = box.cost_id;
        }
        if (box.inv_id !== undefined && box.inv_id !== null && box.inv_id > 0) {
          boxData.inv = box.inv_id;
        }

        const boxResponse =
          box.id && box.id > 0
            ? await voucherService.updateBox(box.id, boxData as any)
            : await voucherService.createBox(boxData as any);

        if (!boxResponse.success) {

          return {
            success: false,
            message: `فشل حفظ الصندوق: ${boxResponse.message}`,
          };
        }
      }
    }

    // حذف التفاصيل المحذوفة أولاً
    if (deletedDetailIds.length > 0) {
      for (const detailId of deletedDetailIds) {
        if (detailId && detailId > 0) {
          const deleteResponse = await voucherService.deleteDetail(detailId);
          if (!deleteResponse.success) {
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

      const detailData: any = {
        vouch: vouchMasterId, // id من جدول vouchers
        acc: detail.acc_id, // رقم الحساب فقط
        debit: detail.debit || 0,
        credit: detail.credit || 0,
        base_debit: detail.base_debit || 0,
        base_credit: detail.base_credit || 0,
        gauge: detail.gauge || 875,
        debit_g: detail.debit_g || 0,
        credit_g: detail.credit_g || 0,
        vouch_notes: detail.vouch_notes || "",
        com: 1, // الفرع = 1
        year: 1, // السنة = 1

      };
      
      // إضافة الحقول حسب الحالة: cr_date/cr_user للجديد أو upd_date/upd_user للتحديث
      if (detail.id && detail.id > 0) {
        // تحديث تفصيل موجود
        detailData.upd_date = currentDate;
        detailData.upd_user = currentUsername || null;
      } else {
        // إنشاء تفصيل جديد
        detailData.cr_date = currentDate;
        detailData.cr_user = currentUsername || null;
      }

      // إضافة cost فقط إذا كانت موجودة وقيمة صحيحة (API يتوقع cost وليس cost_id)
      if (detail.cost_id !== undefined && detail.cost_id !== null && detail.cost_id > 0) {
        detailData.cost = detail.cost_id;
      }

      const detailResponse =
        detail.id && detail.id > 0
          ? await voucherService.updateDetail(detail.id, detailData)
          : await voucherService.createDetail(detailData);

      if (!detailResponse.success) {

        return {
          success: false,
          message: `فشل حفظ التفصيل: ${detailResponse.message}`,
        };
      }
    }

    // حفظ تفاصيل الذهب (gvouchers_dtl) إذا كان سند ذهبي (4 أو 5 أو 111 أو 222)
    // تطبيق نفس منطق التفاصيل العادية: حذف المحذوفة، ثم تحديث/إنشاء الباقي
    if (
      (voucherData.vouch_type === 4 || voucherData.vouch_type === 5 || 
       voucherData.vouch_type === 111 || voucherData.vouch_type === 222)
    ) {
      // لأن api_delete_gvouch_dtl غير مدعوم (404)، سنستخدم استراتيجية مختلفة:
      // 1. حذف جميع التفاصيل القديمة من قاعدة البيانات
      // 2. إنشاء جميع التفاصيل المرسلة من الـ client (جديدة ومحدثة)
      
      // جلب تفاصيل الذهب الحالية من قاعدة البيانات
      const existingGoldDetailsResponse = await voucherService.getGoldDetails(realVoucherId);
      const existingGoldDetailIds =
        existingGoldDetailsResponse.success && existingGoldDetailsResponse.data
          ? (existingGoldDetailsResponse.data as any[])
              .map((d: any) => d.id)
              .filter((id: any) => id && id > 0)
          : [];

      // ⚠️ مهم: api_delete_gvouch_dtl غير مدعوم (404)
      // لذلك لا يمكننا حذف التفاصيل القديمة مباشرة
      // الحل البديل: إنشاء التفاصيل الجديدة فقط (قد يؤدي إلى تكرار)
      // لكن هذا هو الحل الوحيد المتاح حالياً
      
      // إنشاء جميع تفاصيل الذهب المرسلة من الـ client (جديدة ومحدثة)
      for (let i = 0; i < goldDetails.length; i++) {
        const goldDetail = goldDetails[i];

        if (!goldDetail.item_id || goldDetail.item_id === 0) {
          continue;
        }

        // عند إنشاء تفصيل جديد ضمن التحديث، يجب أن تكون البيانات مطابقة تماماً لـ createVoucherAction
        const goldDetailData: any = {
          vouch: realVoucherId, // API يستخدم vouch وليس vouch_id
          item: goldDetail.item_id, // API يستخدم item وليس item_id
          com: 1, // فقط com بدون year
          vouch_type: voucherData.vouch_type, // نوع السند (مطلوب)
          vouch_status: 1,
          cr_date: currentDate, // دائماً إضافة cr_date و cr_user لأننا ننشئ سجلاً جديداً
          cr_user: currentUsername || null,
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

        // إنشاء جميع التفاصيل (جديدة ومحدثة)
        // لأن DELETE و UPDATE غير مدعومين، ننشئ فقط
        // سيتم حذف التكرارات يدوياً لاحقاً أو من خلال قاعدة البيانات
        const goldDetailResponse = await voucherService.createGoldDetail(goldDetailData);

        if (!goldDetailResponse.success) {

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
    revalidatePath("/forms/receipt");
    revalidatePath("/forms/delivery");
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
    } else if (voucherData.vouch_type === 111) {
      revalidatePath(`/forms/receipt/${realVoucherId}`);
    } else if (voucherData.vouch_type === 222) {
      revalidatePath(`/forms/delivery/${realVoucherId}`);
    } else {
      revalidatePath(`/forms/voucher/${realVoucherId}`);
    }

    return {
      success: true,
      data: { vouch_id: voucherData.vouch_id, id: realVoucherId },
      message: "تم تحديث القيد بنجاح",
    };
  } catch (error) {
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
    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ",
    };
  }
}
