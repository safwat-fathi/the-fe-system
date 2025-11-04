/**
 * Utility functions for voucher formatting
 * تنسيق بيانات السندات
 */

import { formatDate as formatDateUtil } from "@/utilities/dateUtils";

/**
 * Format voucher date for display
 * @param dateString - تاريخ السند
 * @returns تاريخ منسق
 */
export function formatVoucherDate(dateString: string | Date): string {
  if (!dateString) return "-";

  return formatDateUtil(dateString);
}

/**
 * Format voucher amount for display
 * @param amount - المبلغ
 * @param decimals - عدد الأرقام العشرية (افتراضي 2)
 * @returns مبلغ منسق
 */
export function formatVoucherAmount(
  amount: number | string | undefined,
  decimals: number = 2,
): string {
  if (amount === undefined || amount === null) return "0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num)) return "0.00";

  return num.toFixed(decimals);
}

/**
 * Format gold weight for display
 * @param weight - الوزن بالجرام
 * @param decimals - عدد الأرقام العشرية (افتراضي 3)
 * @returns وزن منسق
 */
export function formatGoldWeight(
  weight: number | string | undefined,
  decimals: number = 3,
): string {
  if (weight === undefined || weight === null) return "0.000";
  const num = typeof weight === "string" ? parseFloat(weight) : weight;

  if (isNaN(num)) return "0.000";

  return `${num.toFixed(decimals)} جم`;
}

/**
 * Format voucher status for display
 * @param status - حالة السند
 * @returns حالة منسقة
 */
export function formatVoucherStatus(status?: number): string {
  const statusMap: Record<number, string> = {
    0: "ملغي",
    1: "مفتوح",
    2: "مغلق",
  };

  return statusMap[status ?? 1] || "غير محدد";
}

/**
 * Get voucher status color class
 * @param status - حالة السند
 * @returns CSS class name
 */
export function getVoucherStatusColor(status?: number): string {
  const statusColors: Record<number, string> = {
    0: "bg-red-100 text-red-800",
    1: "bg-emerald-100 text-emerald-800",
    2: "bg-yellow-100 text-yellow-800",
  };

  return statusColors[status ?? 1] || "bg-gray-100 text-gray-800";
}
