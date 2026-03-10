export const voucherStatuses = [
  { id: 0, name: "cancelled" },
  { id: 1, name: "active" },
  { id: 2, name: "suspended" },
  { id: 3, name: "incomplete" },
];

export const voucherStatusKeyMap: Record<
  string,
  "cancelled" | "active" | "suspended" | "incomplete"
> = {
  cancelled: "cancelled",
  active: "active",
  suspended: "suspended",
  incomplete: "incomplete",
};

export const CASH_RECEIPT_TABLE_COLUMNS = [
  { key: "amount", label: "tables.cash.columns.amount", width: "w-32" },
  { key: "box", label: "tables.cash.columns.box", width: "w-48" },
  { key: "notes", label: "tables.cash.columns.notes", width: "w-80" },
  { key: "costCenter", label: "tables.cash.columns.costCenter", width: "w-48" },
  {
    key: "invoiceNumber",
    label: "tables.cash.columns.invoiceNumber",
    width: "w-32",
  },
  { key: "delete", label: "tables.cash.columns.delete", width: "w-12" },
];

export const ACCOUNTS_TABLE_COLUMNS = [
  { key: "account", label: "tables.accounts.columns.account", width: "w-32" },
  { key: "amount", label: "tables.accounts.columns.amount", width: "w-48" },
  { key: "notes", label: "tables.accounts.columns.notes", width: "w-80" },
  {
    key: "costCenter",
    label: "tables.accounts.columns.costCenter",
    width: "w-48",
  },
  { key: "delete", label: "tables.accounts.columns.delete", width: "w-12" },
];
