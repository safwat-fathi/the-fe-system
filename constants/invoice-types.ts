// أنواع الفواتير
export const INVOICE_TYPES = {
  PURCHASE: 1, // فاتورة شراء
  SALES: 2, // فاتورة بيع
  PURCHASE_RETURN: 3, // فاتورة مردود شراء
  SALES_RETURN: 4, // فاتورة مردود بيع
} as const;

// أسماء أنواع الفواتير
export const INVOICE_TYPE_LABELS = {
  [INVOICE_TYPES.PURCHASE]: "شراء",
  [INVOICE_TYPES.SALES]: "بيع",
  [INVOICE_TYPES.PURCHASE_RETURN]: "مردود شراء",
  [INVOICE_TYPES.SALES_RETURN]: "مردود بيع",
} as const;

// ألوان أنواع الفواتير
export const INVOICE_TYPE_COLORS = {
  [INVOICE_TYPES.PURCHASE]: "primary",
  [INVOICE_TYPES.SALES]: "success",
  [INVOICE_TYPES.PURCHASE_RETURN]: "warning",
  [INVOICE_TYPES.SALES_RETURN]: "danger",
} as const;

// خيارات الفلترة للتقارير
export const INVOICE_FILTER_OPTIONS = [
  { key: "all", label: "جميع الفواتير", color: "default" },
  {
    key: "purchase",
    label: "فواتير الشراء",
    color: "primary",
    value: INVOICE_TYPES.PURCHASE,
  },
  {
    key: "sales",
    label: "فواتير البيع",
    color: "success",
    value: INVOICE_TYPES.SALES,
  },
  {
    key: "purchase_return",
    label: "مردود الشراء",
    color: "warning",
    value: INVOICE_TYPES.PURCHASE_RETURN,
  },
  {
    key: "sales_return",
    label: "مردود البيع",
    color: "danger",
    value: INVOICE_TYPES.SALES_RETURN,
  },
] as const;

// دالة مساعدة للحصول على اسم النوع
export function getInvoiceTypeLabel(transType: number): string {
  return (
    INVOICE_TYPE_LABELS[transType as keyof typeof INVOICE_TYPE_LABELS] ||
    "غير محدد"
  );
}

// دالة مساعدة للحصول على لون النوع
export function getInvoiceTypeColor(transType: number): string {
  return (
    INVOICE_TYPE_COLORS[transType as keyof typeof INVOICE_TYPE_COLORS] ||
    "default"
  );
}
