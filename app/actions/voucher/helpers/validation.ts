/**
 * Validation helpers for vouchers
 */

import type {
  SaveVoucherData,
  VoucherDetailData,
  VoucherBoxData,
} from "./types";

import { validateVoucherBalance } from "@/utilities/voucher/balance";

/**
 * Validate voucher data before save
 */
export function validateVoucherData(
  voucherData: SaveVoucherData,
  details: VoucherDetailData[],
  voucherBoxes: VoucherBoxData[] = [],
  goldDetails?: any[], // للتحقق من goldDetails في سندات الذهب
): { isValid: boolean; error?: string } {
  // سندات الذهب (4, 5, 111, 222): استخدام goldDetails بدلاً من details
  const isGoldVoucher = [4, 5, 111, 222].includes(voucherData.vouch_type || 0);

  if (isGoldVoucher) {
    // التحقق من وجود goldDetails
    if (!goldDetails || goldDetails.length === 0) {
      return {
        isValid: false,
        error: "يجب إضافة تفاصيل للقيد",
      };
    }

    // التحقق من وجود goldDetails صحيحة (item_id > 0)
    const validGoldDetails = goldDetails.filter(
      (detail) => detail && detail.item_id && detail.item_id > 0,
    );

    if (validGoldDetails.length === 0) {
      return {
        isValid: false,
        error: "يرجى إدخال صنف صحيح على الأقل",
      };
    }

    // التحقق من التوازن لسندات الذهب
    // في سندات الذهب (4, 5, 111, 222)، التوازن يتم بين الصناديق والذهب
    // لا نحتاج إلى التحقق من details لأن goldDetails لا تحتوي على acc_id
    // التحقق من وجود صناديق
    if (voucherBoxes.length === 0) {
      return {
        isValid: false,
        error: "يرجى إدخال صندوق واحد على الأقل",
      };
    }

    const totalBoxes = voucherBoxes.reduce(
      (sum, box) => sum + (box.amount || 0),
      0,
    );

    if (totalBoxes <= 0) {
      return {
        isValid: false,
        error: "يرجى إدخال مبلغ صحيح للصناديق",
      };
    }

    // التحقق من رقم السند
    if (
      !voucherData.vouch_id ||
      voucherData.vouch_id <= 0 ||
      !isFinite(voucherData.vouch_id)
    ) {
      return {
        isValid: false,
        error: "خطأ: رقم القيد غير صحيح",
      };
    }

    // التحقق من التاريخ
    const voucherDate = new Date(voucherData.vouch_date);
    const today = new Date();

    today.setHours(23, 59, 59, 999);

    if (voucherDate > today) {
      return {
        isValid: false,
        error: "لا يمكن إنشاء قيد بتاريخ أكبر من تاريخ اليوم",
      };
    }

    return { isValid: true };
  }

  // للسندات الأخرى: استخدام details العادية
  // التحقق من وجود التفاصيل
  if (!details || details.length === 0) {
    return {
      isValid: false,
      error: "يجب إضافة تفاصيل للقيد",
    };
  }

  // التحقق من وجود حسابات صحيحة
  const validDetails = details.filter(
    (detail) => detail && detail.acc_id && detail.acc_id > 0,
  );

  if (validDetails.length === 0) {
    return {
      isValid: false,
      error: "يرجى إدخال حساب صحيح على الأقل",
    };
  }

  // التحقق من التوازن
  const balanceValidation = validateVoucherBalance(
    validDetails,
    voucherBoxes,
    voucherData.vouch_type,
  );

  if (!balanceValidation.isValid) {
    return balanceValidation;
  }

  // التحقق من رقم السند
  if (
    !voucherData.vouch_id ||
    voucherData.vouch_id <= 0 ||
    !isFinite(voucherData.vouch_id)
  ) {
    return {
      isValid: false,
      error: "خطأ: رقم القيد غير صحيح",
    };
  }

  // التحقق من التاريخ
  const voucherDate = new Date(voucherData.vouch_date);
  const today = new Date();

  today.setHours(23, 59, 59, 999);

  if (voucherDate > today) {
    return {
      isValid: false,
      error: "لا يمكن إنشاء قيد بتاريخ أكبر من تاريخ اليوم",
    };
  }

  return { isValid: true };
}
