/**
 * Utility functions for voucher routing
 * تحديد المسارات حسب نوع السند
 */

/**
 * Get the route path for a voucher based on its type
 * @param vouchType - نوع السند (0-5, 111, 222)
 * @param vouchId - رقم السند
 * @param mode - وضع العرض (preview, edit, new)
 * @returns Route path
 */
export function getVoucherRoute(
  vouchType: number,
  vouchId: number | string,
  mode: "preview" | "edit" | "new" = "preview",
): string {
  const routes: Record<number, string> = {
    0: "/forms/balance", // قيد افتتاحي
    1: "/forms/cash-receipt", // سند قبض
    2: "/forms/payment-receipt", // سند صرف
    3: "/forms/voucher", // قيد تسوية
    4: "/forms/gvoucher4", // سند قبض عميل
    5: "/forms/gvoucher5", // سند صرف عميل
    111: "/forms/receipt", // سند استلام
    222: "/forms/delivery", // سند تسليم
  };

  const baseRoute = routes[vouchType] || "/forms/voucher";

  if (mode === "new") {
    return `${baseRoute}?mode=new`;
  }

  return `${baseRoute}/${vouchId}?mode=${mode}`;
}

/**
 * Get voucher type name in Arabic
 * @param vouchType - نوع السند
 * @returns اسم نوع السند بالعربية
 */
export function getVoucherTypeName(vouchType: number): string {
  const typeNames: Record<number, string> = {
    0: "قيد افتتاحي",
    1: "سند قبض",
    2: "سند صرف",
    3: "قيد تسوية",
    4: "سند قبض عميل",
    5: "سند صرف عميل",
    111: "استلام",
    222: "تسليم",
  };

  return typeNames[vouchType] || "غير محدد";
}

/**
 * Check if voucher type requires boxes (cash boxes)
 * @param vouchType - نوع السند
 * @returns true if voucher type requires boxes
 */
export function requiresBoxes(vouchType: number): boolean {
  return [1, 2, 4, 5, 111, 222].includes(vouchType);
}

/**
 * Check if voucher type requires gold details
 * @param vouchType - نوع السند
 * @returns true if voucher type requires gold details
 */
export function requiresGoldDetails(vouchType: number): boolean {
  return [4, 5, 111, 222].includes(vouchType);
}

/**
 * Check if voucher type is a receipt type
 * @param vouchType - نوع السند
 * @returns true if voucher is a receipt
 */
export function isReceiptType(vouchType: number): boolean {
  return [1, 4, 111].includes(vouchType);
}

/**
 * Check if voucher type is a payment type
 * @param vouchType - نوع السند
 * @returns true if voucher is a payment
 */
export function isPaymentType(vouchType: number): boolean {
  return [2, 5, 222].includes(vouchType);
}
