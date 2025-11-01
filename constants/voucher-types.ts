/**
 * أنواع القيود والسندات
 * Voucher Types
 */

export const VOUCHER_TYPES = {
  OPENING_ENTRY: 0, // قيد افتتاحي
  RECEIPT: 1, // سند قبض
  PAYMENT: 2, // سند صرف
  ADJUSTMENT: 3, // قيد تسوية
  CUSTOMER_RECEIPT: 4, // سند قبض عميل
  CUSTOMER_PAYMENT: 5, // سند صرف عميل
} as const;

export type VoucherType = (typeof VOUCHER_TYPES)[keyof typeof VOUCHER_TYPES];

/**
 * أسماء أنواع القيود بالعربية
 */
export const VOUCHER_TYPE_NAMES = {
  [VOUCHER_TYPES.OPENING_ENTRY]: "قيد افتتاحي",
  [VOUCHER_TYPES.RECEIPT]: "سند قبض",
  [VOUCHER_TYPES.PAYMENT]: "سند صرف",
  [VOUCHER_TYPES.ADJUSTMENT]: "قيد تسوية",
  [VOUCHER_TYPES.CUSTOMER_RECEIPT]: "سند قبض عميل",
  [VOUCHER_TYPES.CUSTOMER_PAYMENT]: "سند صرف عميل",
} as const;

/**
 * أسماء أنواع القيود بالإنجليزية
 */
export const VOUCHER_TYPE_NAMES_EN = {
  [VOUCHER_TYPES.OPENING_ENTRY]: "Opening Entry",
  [VOUCHER_TYPES.RECEIPT]: "Receipt Voucher",
  [VOUCHER_TYPES.PAYMENT]: "Payment Voucher",
  [VOUCHER_TYPES.ADJUSTMENT]: "Adjustment Entry",
  [VOUCHER_TYPES.CUSTOMER_RECEIPT]: "Customer Receipt Voucher",
  [VOUCHER_TYPES.CUSTOMER_PAYMENT]: "Customer Payment Voucher",
} as const;

/**
 * دالة مساعدة للحصول على اسم نوع القيد
 */
export const getVoucherTypeName = (
  type: number,
  lang: "ar" | "en" = "ar",
): string => {
  if (lang === "ar") {
    return VOUCHER_TYPE_NAMES[type as VoucherType] || "غير محدد";
  }

  return VOUCHER_TYPE_NAMES_EN[type as VoucherType] || "Unknown";
};
