import { TransTypes } from "@/types/models/invoice";

export const INVOICE_TYPE_FILTERS = [
  { key: "0", label: "جميع الفواتير", color: "default" },
  {
    key: String(TransTypes.PURCHASE),
    label: "فواتير الشراء",
    color: "primary",
  },
  {
    key: String(TransTypes.SALES),
    label: "فواتير البيع",
    color: "success",
  },
  {
    key: String(TransTypes.PURCHASE_RETURN),
    label: "مردود الشراء",
    color: "warning",
  },
  {
    key: String(TransTypes.SALES_RETURN),
    label: "مردود البيع",
    color: "danger",
  },
] as const;

export const TRANS_TYPE_META: Record<
  TransTypes,
  { label: string; color: "default" | "primary" | "success" | "warning" | "danger" }
> = {
  [TransTypes.PURCHASE]: { label: "شراء", color: "primary" },
  [TransTypes.SALES]: { label: "بيع", color: "success" },
  [TransTypes.PURCHASE_RETURN]: { label: "مردود شراء", color: "warning" },
  [TransTypes.SALES_RETURN]: { label: "مردود بيع", color: "danger" },
};
