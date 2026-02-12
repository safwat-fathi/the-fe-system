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

export const voucherTypes = [
  { id: 1, name: "daily" },
  { id: 2, name: "reverse" },
  { id: 3, name: "adjustment" },
  { id: 4, name: "currencyDiff" },
  { id: 5, name: "inventoryDiff" },
  { id: 6, name: "salary" },
];

export const voucherTypeKeyMap: Record<
  string,
  | "daily"
  | "reverse"
  | "adjustment"
  | "currencyDiff"
  | "inventoryDiff"
  | "salary"
> = {
  daily: "daily",
  reverse: "reverse",
  adjustment: "adjustment",
  currencyDiff: "currencyDiff",
  inventoryDiff: "inventoryDiff",
  salary: "salary",
};

export const adjustmentTableColumns = [
  {
    key: "account",
    label: "account",
    width: "21%",
    rowSpan: 2,
    colSpan: 1,
  },
  {
    key: "cash",
    label: "cash",
    width: "14%",
    rowSpan: 1,
    colSpan: 2,
    subColumns: [
      { key: "cashDebit", label: "cashDebit" },
      { key: "cashCredit", label: "cashCredit" },
    ],
  },
  {
    key: "goldStanding",
    label: "goldStanding",
    width: "14%",
    rowSpan: 1,
    colSpan: 2,
    subColumns: [
      { key: "goldStandingDebit", label: "goldStandingDebit" },
      { key: "goldStandingCredit", label: "goldStandingCredit" },
    ],
  },
  {
    key: "gauge",
    label: "gauge",
    width: "6%",
    rowSpan: 2,
    colSpan: 1,
  },
  {
    key: "goldCalibrated",
    label: "goldCalibrated",
    width: "14%",
    rowSpan: 1,
    colSpan: 2,
    subColumns: [
      { key: "goldCalibratedDebit", label: "goldCalibratedDebit" },
      { key: "goldCalibratedCredit", label: "goldCalibratedCredit" },
    ],
  },
  {
    key: "costCenter",
    label: "costCenter",
    width: "13%",
    rowSpan: 2,
    colSpan: 1,
  },
  {
    key: "notes",
    label: "notes",
    width: "14%",
    rowSpan: 2,
    colSpan: 1,
  },
  {
    key: "delete",
    label: "delete",
    width: "4%",
    rowSpan: 2,
    colSpan: 1,
  },
] as const;
