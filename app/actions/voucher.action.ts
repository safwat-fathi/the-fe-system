"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  voucherService,
  customerService,
  glTransactionService,
} from "@/services/api";
import { STORAGE_KEYS, VOUCHER_TYPE_NAMES } from "@/constants";
import { GLTransaction } from "@/types/models/gl-transaction";

// Helper function to get current user username
export async function getCurrentUsername(): Promise<string | null> {
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

// Helper function to get customer name from customer ID
async function getCustomerName(custId: number | null | undefined): Promise<string | null> {
  if (!custId || custId <= 0) {
    return null;
  }

  try {
    const customers = await customerService.getAllCustomers({ xcom_id: 1 });
    const customer = customers.find((c) => c.id === custId);

    return customer?.cust_name || null;
  } catch (error) {
    return null;
  }
}

// Helper function to get voucher source based on voucher type
function getVoucherSource(vouchType: number): string {
  const sourceMap: Record<number, string> = {
    0: "GL_Balance",
    1: "GL_CashReceipt",
    2: "GL_CashPayment",
    3: "GL_Adjustment",
    4: "GL_CustomerReceipt",
    5: "GL_CustomerPayment",
    111: "GL_Receipt",
    222: "GL_Delivery",
  };

  return sourceMap[vouchType] || "GL_Unknown";
}

// Helper function to extract date and time from ISO string
function extractDateAndTime(dateString: string): { date: string; time: string } {
  try {
    const date = new Date(dateString);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    // API يتوقع datetime كامل في حقل t بصيغة ISO
    const timeStr = date.toISOString(); // YYYY-MM-DDThh:mm:ss.sssZ

    return { date: dateStr, time: timeStr };
  } catch (error) {
    const now = new Date();

    return {
      date: now.toISOString().split("T")[0],
      time: now.toISOString(),
    };
  }
}

// Helper function to get box account ID
async function getBoxAccountId(boxId: number): Promise<number | null> {
  if (!boxId || boxId <= 0) {
    return null;
  }

  try {
    const { boxesService } = await import("@/services/api");
    const boxes = await boxesService.getBoxes({ xcom_id: 1 });
    const box = boxes.find((b) => b.id === boxId);

    // acc_id أو acc حسب ما يعيده API
    return box?.acc ? Number(box.acc) : null;
  } catch (error) {
    console.warn(`[SERVER] ⚠️ فشل جلب حساب الصندوق ${boxId}:`, error);
    return null;
  }
}

// Helper function to create GL transaction records
export async function createGLTransactionRecords(
  voucherData: SaveVoucherData,
  details: VoucherDetailData[],
  masterId: number,
  currentDate: string,
  currentUsername: string | null,
  voucherPayload?: any, // للمساعدة في جلب cust
  voucherBoxes: VoucherBoxData[] = [], // إضافة الصناديق
): Promise<void> {
  // التحقق من وجود التفاصيل
  if (!details || details.length === 0) {
    console.warn(
      "[SERVER] ⚠️ لا توجد تفاصيل لترحيلها إلى gl_transaction",
      `vouch_id: ${voucherData.vouch_id}, vouch_type: ${voucherData.vouch_type}`,
    );
    return;
  }

  // فلترة التفاصيل الصحيحة فقط (يجب أن تحتوي على acc_id صحيح)
  const validDetails = details.filter(
    (detail) => detail && detail.acc_id && detail.acc_id > 0,
  );

  if (validDetails.length === 0) {
    console.warn(
      "[SERVER] ⚠️ لا توجد تفاصيل صحيحة لترحيلها إلى gl_transaction",
      `vouch_id: ${voucherData.vouch_id}, vouch_type: ${voucherData.vouch_type}`,
      `عدد التفاصيل: ${details.length}`,
    );
    return;
  }

  console.log(
    `[SERVER] 📝 بدء ترحيل ${validDetails.length} تفصيل إلى gl_transaction`,
    `vouch_id: ${voucherData.vouch_id}, vouch_type: ${voucherData.vouch_type}`,
  );

  const { date: transactionDate, time: transactionTime } = extractDateAndTime(
    voucherData.vouch_date,
  );
  // الحصول على اسم نوع الحركة
  const typeNames: Record<number, string> = {
    ...(VOUCHER_TYPE_NAMES as Record<number, string>),
    111: "استلام",
    222: "تسليم",
  };
  const voucherTypeName = typeNames[voucherData.vouch_type] || "غير محدد";
  const source = getVoucherSource(voucherData.vouch_type);
  // جلب cust من voucherData أو voucherPayload
  const custValue =
    voucherData.cust_id ||
    (voucherData as any).cust ||
    (voucherPayload?.cust) ||
    null;
  const customerName = custValue ? await getCustomerName(custValue) : null;

  // إنشاء سجل gl_transaction لكل تفصيل
  for (let i = 0; i < validDetails.length; i++) {
    const detail = validDetails[i];

    // التحقق مرة أخرى من أن acc_id موجود وصحيح
    if (!detail.acc_id || detail.acc_id <= 0) {
      continue;
    }

    // للنقد فقط: debit و credit يجب أن يساويا debit_base و credit_base
    // للذهب: debit_base و credit_base للذهب القائم، و debit_g و credit_g للذهب المعاير
    const debitValue = detail.debit || 0;
    const creditValue = detail.credit || 0;
    const debitBaseValue = detail.base_debit || 0;
    const creditBaseValue = detail.base_credit || 0;
    
    // إذا كان هناك نقد (debit أو credit > 0) وليس هناك ذهب (base_debit و base_credit = 0)
    // فإن debit_base و credit_base يجب أن تساوي debit و credit
    const isCashOnly = (debitValue > 0 || creditValue > 0) && 
                       debitBaseValue === 0 && creditBaseValue === 0;
    
    const finalDebitBase = isCashOnly ? debitValue : debitBaseValue;
    const finalCreditBase = isCashOnly ? creditValue : creditBaseValue;

    const glTransactionData: Partial<GLTransaction> = {
      debit: String(debitValue),
      credit: String(creditValue),
      debit_base: String(finalDebitBase),
      credit_base: String(finalCreditBase),
      g_debit: String(detail.debit_g || 0),
      g_credit: String(detail.credit_g || 0),
      g_debit_base: String(detail.debit_g || 0), // نفس القيمة
      g_credit_base: String(detail.credit_g || 0), // نفس القيمة
      type: voucherTypeName,
      d: transactionDate,
      t: transactionTime,
      ref: voucherData.ref_no || "",
      trans_id: voucherData.vouch_id,
      trans_type: voucherData.vouch_type,
      note: detail.vouch_notes || voucherData.vouch_notes || "",
      source: source,
      seq: i + 1,
      cust2: customerName || null,
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
          `[SERVER] ❌ فشل ترحيل gl_transaction للتفصيل ${i + 1}:`,
          response.message || "خطأ غير معروف",
          "\nالبيانات المرسلة:",
          JSON.stringify(glTransactionData, null, 2),
        );
      } else {
        console.log(
          `[SERVER] ✅ تم ترحيل gl_transaction للتفصيل ${i + 1} بنجاح`,
          `vouch_id: ${voucherData.vouch_id}, acc_id: ${detail.acc_id}`,
        );
      }
    } catch (error) {
      console.error(
        `[SERVER] ❌ خطأ في ترحيل gl_transaction للتفصيل ${i + 1}:`,
        error instanceof Error ? error.message : String(error),
        "\nالبيانات المرسلة:",
        JSON.stringify(glTransactionData, null, 2),
      );
    }
  }

  // ترحيل الصناديق (النقدية) إذا كانت موجودة
  if (voucherBoxes && voucherBoxes.length > 0) {
      // تحديد نوع الحركة للصندوق حسب نوع السند
      // سند قبض (1): debit للصندوق (نحصل على المبلغ)
      // سند صرف (2): credit للصندوق (ندفع المبلغ)
      // سند قبض عميل (4): debit للصندوق
      // سند صرف عميل (5): credit للصندوق
      // استلام (111): debit للصندوق
      // تسليم (222): credit للصندوق
      const isReceipt = 
        voucherData.vouch_type === 1 || // سند قبض
        voucherData.vouch_type === 4 || // سند قبض عميل
        voucherData.vouch_type === 111; // استلام
      const isPayment = 
        voucherData.vouch_type === 2 || // سند صرف
        voucherData.vouch_type === 5 || // سند صرف عميل
        voucherData.vouch_type === 222; // تسليم

      console.log(
        `[SERVER] 📝 بدء ترحيل ${voucherBoxes.length} صندوق إلى gl_transaction`,
        `vouch_id: ${voucherData.vouch_id}, vouch_type: ${voucherData.vouch_type}`,
        `isReceipt: ${isReceipt}, isPayment: ${isPayment}`,
      );

      // ترحيل الصناديق لجميع السندات التي تحتوي صناديق
      // تأكد من أن الشرط يعمل لسند الصرف أيضاً
      if (isReceipt || isPayment) {
      for (let i = 0; i < voucherBoxes.length; i++) {
        const box = voucherBoxes[i];

        if (!box.box_id || box.box_id <= 0 || !box.amount || box.amount <= 0) {
          continue;
        }

        // جلب حساب الصندوق
        const boxAccountId = await getBoxAccountId(box.box_id);

        if (!boxAccountId || boxAccountId <= 0) {
          console.warn(
            `[SERVER] ⚠️ لا يمكن العثور على حساب الصندوق ${box.box_id}`,
          );
          continue;
        }

        // تحديد debit و credit حسب نوع السند
        const debit = isReceipt ? box.amount : 0; // سند قبض: debit للصندوق
        const credit = isPayment ? box.amount : 0; // سند صرف: credit للصندوق

        // للنقد: debit_base و credit_base يجب أن تساوي debit و credit
        const glTransactionData: Partial<GLTransaction> = {
          debit: String(debit),
          credit: String(credit),
          debit_base: String(debit), // للنقد: نفس debit
          credit_base: String(credit), // للنقد: نفس credit
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
          seq: validDetails.length + i + 1, // بعد تفاصيل الحسابات
          cust2: customerName || null,
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
              `[SERVER] ❌ فشل ترحيل gl_transaction للصندوق ${i + 1}:`,
              response.message || "خطأ غير معروف",
              "\nالبيانات المرسلة:",
              JSON.stringify(glTransactionData, null, 2),
            );
          } else {
            console.log(
              `[SERVER] ✅ تم ترحيل gl_transaction للصندوق ${i + 1} بنجاح`,
              `vouch_id: ${voucherData.vouch_id}, box_id: ${box.box_id}, acc_id: ${boxAccountId}`,
            );
          }
        } catch (error) {
          console.error(
            `[SERVER] ❌ خطأ في ترحيل gl_transaction للصندوق ${i + 1}:`,
            error instanceof Error ? error.message : String(error),
            "\nالبيانات المرسلة:",
            JSON.stringify(glTransactionData, null, 2),
          );
        }
      }
    }
  }
}

// Helper function to delete GL transaction records for a voucher
// ⚠️ مهم جداً: هذه الدالة تحذف فقط من جدول gl_transaction وليس من الجداول الأصلية (voucher_details, vouchers_box, gvouchers_dtl)
// لا تقوم بحذف أي شيء من الجداول الأصلية للـ vouchers
async function deleteGLTransactionRecords(
  transId: number,
  transType: number,
): Promise<void> {
  try {
    console.log(
      `[SERVER] 🗑️ بدء حذف سجلات gl_transaction القديمة`,
      `trans_id: ${transId}, trans_type: ${transType}`,
    );

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

      console.log(
        `[SERVER] 📋 تم العثور على ${transactions.length} سجل للحذف`,
        `trans_id: ${transId}, trans_type: ${transType}`,
      );

      for (const transaction of transactions) {
        if (transaction.id) {
          try {
            console.log(
              `[SERVER] 🗑️ محاولة حذف سجل gl_transaction ${transaction.id}`,
              `trans_id: ${transId}, trans_type: ${transType}`,
            );

            const deleteResponse = await glTransactionService.deleteTransaction(
              transaction.id,
              { com: 1 },
            );

            if (!deleteResponse.success) {
              console.error(
                `[SERVER] ❌ فشل حذف سجل gl_transaction ${transaction.id}:`,
                deleteResponse.message || "خطأ غير معروف",
                `\nالاستجابة:`,
                JSON.stringify(deleteResponse, null, 2),
              );
            } else {
              console.log(
                `[SERVER] ✅ تم حذف سجل gl_transaction ${transaction.id} بنجاح`,
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
    } else {
      console.warn(
        `[SERVER] ⚠️ لم يتم العثور على سجلات gl_transaction للحذف`,
        `trans_id: ${transId}, trans_type: ${transType}`,
      );
    }
  } catch (error) {
    console.error(
      `[SERVER] ❌ خطأ في حذف سجلات gl_transaction:`,
      error instanceof Error ? error.message : String(error),
      `trans_id: ${transId}, trans_type: ${transType}`,
    );
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
      const custValue =
        voucherData.cust_id !== undefined &&
        voucherData.cust_id !== null &&
        voucherData.cust_id > 0
          ? voucherData.cust_id
          : voucherPayload.cust !== undefined &&
              voucherPayload.cust !== null &&
              voucherPayload.cust > 0
            ? voucherPayload.cust
            : null;

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
          ? details.reduce((sum, detail) => sum + (detail.credit || 0), 0)
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
        if (
          !box.box_id ||
          box.box_id === 0 ||
          !box.amount ||
          box.amount === 0
        ) {
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
        if (
          box.cost_id !== undefined &&
          box.cost_id !== null &&
          box.cost_id > 0
        ) {
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
      if (
        detail.cost_id !== undefined &&
        detail.cost_id !== null &&
        detail.cost_id > 0
      ) {
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

    // ترحيل سجلات gl_transaction لكل تفصيل والصناديق
    await createGLTransactionRecords(
      voucherData,
      details,
      masterId,
      currentDate,
      currentUsername,
      voucherPayload,
      voucherBoxes, // إضافة الصناديق
    );

    // حفظ تفاصيل الذهب (gvouchers_dtl) إذا كان سند ذهبي (4 أو 5 أو 111 أو 222)
    if (
      (voucherData.vouch_type === 4 ||
        voucherData.vouch_type === 5 ||
        voucherData.vouch_type === 111 ||
        voucherData.vouch_type === 222) &&
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
        if (
          goldDetail.g_weight2 !== undefined &&
          goldDetail.g_weight2 !== null
        ) {
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
        if (
          goldDetail.close_amt !== undefined &&
          goldDetail.close_amt !== null
        ) {
          goldDetailData.close_amt = goldDetail.close_amt.toString();
        }
        if (
          goldDetail.close_weight !== undefined &&
          goldDetail.close_weight !== null
        ) {
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
        if (
          goldDetail.total_work !== undefined &&
          goldDetail.total_work !== null
        ) {
          goldDetailData.total_work = goldDetail.total_work.toString();
        }
        if (goldDetail.qty !== undefined && goldDetail.qty !== null) {
          goldDetailData.qty = goldDetail.qty.toString();
        }

        const goldDetailResponse =
          await voucherService.createGoldDetail(goldDetailData);

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
        (v: any) =>
          v.id === realVoucherId &&
          v.vouch_type === (voucherData.vouch_type || 0),
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
      const custValue =
        voucherData.cust_id !== undefined &&
        voucherData.cust_id !== null &&
        voucherData.cust_id > 0
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
          ? details.reduce((sum, detail) => sum + (detail.credit || 0), 0)
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
      voucherData.vouch_type === 1 ||
      voucherData.vouch_type === 2 ||
      voucherData.vouch_type === 4 ||
      voucherData.vouch_type === 5 ||
      voucherData.vouch_type === 111 ||
      voucherData.vouch_type === 222;

    if (shouldProcessBoxes && voucherBoxes && voucherBoxes.length > 0) {
      // جلب الصناديق الحالية
      const existingBoxesResponse =
        await voucherService.getBoxes(realVoucherId);
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

        if (
          !box.box_id ||
          box.box_id === 0 ||
          !box.amount ||
          box.amount === 0
        ) {
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
        if (
          box.cost_id !== undefined &&
          box.cost_id !== null &&
          box.cost_id > 0
        ) {
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

    // ===== حذف سجلات gl_transaction فقط (ليس من الجداول الأصلية) =====
    // مهم: هذه الدالة تحذف فقط من جدول gl_transaction وليس من voucher_details
    await deleteGLTransactionRecords(
      voucherData.vouch_id,
      voucherData.vouch_type,
    );

    // ===== حذف التفاصيل من الجداول الأصلية (voucher_details) =====
    // هذا منطق منفصل تماماً عن gl_transaction
    // حذف التفاصيل المحذوفة صراحة من client
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

    // حذف التفاصيل التي لم تعد موجودة من الجداول الأصلية (voucher_details)
    // هذا منطق منفصل تماماً عن gl_transaction
    for (const detailId of idsToDelete) {
      if (detailId && detailId > 0) {
        const deleteResponse = await voucherService.deleteDetail(detailId);

        if (!deleteResponse.success) {
          // لا نوقف العملية عند فشل الحذف
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
      if (
        detail.cost_id !== undefined &&
        detail.cost_id !== null &&
        detail.cost_id > 0
      ) {
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

    // ترحيل سجلات gl_transaction لكل تفصيل والصناديق بعد التحديث
    await createGLTransactionRecords(
      voucherData,
      details,
      realVoucherId,
      currentDate,
      currentUsername,
      voucherPayload,
      voucherBoxes, // إضافة الصناديق
    );

    // حفظ تفاصيل الذهب (gvouchers_dtl) إذا كان سند ذهبي (4 أو 5 أو 111 أو 222)
    // تطبيق نفس منطق التفاصيل العادية: حذف المحذوفة، ثم تحديث/إنشاء الباقي
    if (
      voucherData.vouch_type === 4 ||
      voucherData.vouch_type === 5 ||
      voucherData.vouch_type === 111 ||
      voucherData.vouch_type === 222
    ) {
      // لأن api_delete_gvouch_dtl غير مدعوم (404)، سنستخدم استراتيجية مختلفة:
      // 1. حذف جميع التفاصيل القديمة من قاعدة البيانات
      // 2. إنشاء جميع التفاصيل المرسلة من الـ client (جديدة ومحدثة)

      // جلب تفاصيل الذهب الحالية من قاعدة البيانات
      const existingGoldDetailsResponse =
        await voucherService.getGoldDetails(realVoucherId);
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
        if (
          goldDetail.g_weight2 !== undefined &&
          goldDetail.g_weight2 !== null
        ) {
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
        if (
          goldDetail.close_amt !== undefined &&
          goldDetail.close_amt !== null
        ) {
          goldDetailData.close_amt = goldDetail.close_amt.toString();
        }
        if (
          goldDetail.close_weight !== undefined &&
          goldDetail.close_weight !== null
        ) {
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
        if (
          goldDetail.total_work !== undefined &&
          goldDetail.total_work !== null
        ) {
          goldDetailData.total_work = goldDetail.total_work.toString();
        }
        if (goldDetail.qty !== undefined && goldDetail.qty !== null) {
          goldDetailData.qty = goldDetail.qty.toString();
        }

        // إنشاء جميع التفاصيل (جديدة ومحدثة)
        // لأن DELETE و UPDATE غير مدعومين، ننشئ فقط
        // سيتم حذف التكرارات يدوياً لاحقاً أو من خلال قاعدة البيانات
        const goldDetailResponse =
          await voucherService.createGoldDetail(goldDetailData);

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
