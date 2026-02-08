export const GOLD_TABLE_COLUMNS = [
  { key: "itemNumber", width: "w-72" },
  { key: "weight", width: "w-32" },
  { key: "calibration", width: "w-32" },
  { key: "calibratedWeight", width: "w-32" },
  { key: "wageRate", width: "w-32" },
  { key: "wages", width: "w-32" },
  { key: "box", width: "w-48" },
  { key: "notes", width: "w-80" },
  { key: "caliberDifference", width: "w-32" },
  { key: "sealingAmount", width: "w-32" },
  { key: "sealingWeight", width: "w-32" },
  { key: "invoiceNumber", width: "w-32" },
  { key: "costCenter", width: "w-48" },
  { key: "delete", width: "w-12" },
] as const;

export const CASH_TABLE_COLUMNS = [
  { key: "amount", width: "w-[12%]" },
  { key: "box", width: "w-[18%]" },
  { key: "notes", width: "w-[30%]" },
  { key: "invoiceNumber", width: "w-[12%]" },
  { key: "costCenter", width: "w-[18%]" },
  { key: "delete", width: "w-[10%]" },
] as const;

export const DeliveryTotalsKeys = [
  { key: "totalGoldWeight", icon: "gm" },
  { key: "totalGoldGWeight", icon: "gm" },
  { key: "totalWork", icon: "riyal" },
  { key: "totalBoxes", icon: "riyal" },
];

export type GoldTableColumnKey = (typeof GOLD_TABLE_COLUMNS)[number]["key"];
export type CashTableColumnKey = (typeof CASH_TABLE_COLUMNS)[number]["key"];
export type DeliveryTotalsKey = (typeof DeliveryTotalsKeys)[number]["key"];
