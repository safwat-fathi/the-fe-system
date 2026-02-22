export type TableColumnConfig = {
  translationKey: string;
  width: string;
  rowSpan?: number;
  colSpan?: number;
  /** If true, this column is only shown when cost centers exist */
  conditionalOnCostCenters?: boolean;
};

/** First header row columns */
export const BALANCE_TABLE_FIRST_ROW_COLUMNS: TableColumnConfig[] = [
  {
    translationKey: "table.columns.account",
    width: "w-64",
    rowSpan: 2,
  },
  {
    translationKey: "table.columns.cash",
    width: "w-40",
    colSpan: 2,
  },
  {
    translationKey: "table.columns.goldStanding",
    width: "w-40",
    colSpan: 2,
  },
  {
    translationKey: "table.columns.gauge",
    width: "w-20",
    rowSpan: 2,
  },
  {
    translationKey: "table.columns.goldCalibrated",
    width: "w-40",
    colSpan: 2,
  },
  {
    translationKey: "table.columns.costCenter",
    width: "w-40",
    rowSpan: 2,
    conditionalOnCostCenters: true,
  },
  {
    translationKey: "table.columns.notes",
    width: "w-48",
    rowSpan: 2,
  },
  {
    translationKey: "table.columns.delete",
    width: "w-12",
    rowSpan: 2,
  },
];

/** Second header row columns (sub-headers for cash, goldStanding, goldCalibrated) */
export const BALANCE_TABLE_SECOND_ROW_COLUMNS: TableColumnConfig[] = [
  { translationKey: "table.columns.cashDebit", width: "w-20" },
  { translationKey: "table.columns.cashCredit", width: "w-20" },
  { translationKey: "table.columns.goldStandingDebit", width: "w-20" },
  { translationKey: "table.columns.goldStandingCredit", width: "w-20" },
  { translationKey: "table.columns.goldCalibratedDebit", width: "w-20" },
  { translationKey: "table.columns.goldCalibratedCredit", width: "w-20" },
];

export const BALANCE_TABLE_TH_BASE_CLASS =
  "p-0.5 font-bold text-slate-700 border text-center";

export type NumericColumnConfig = {
  col: number;
  field: string;
  defaultVal: string;
  step: string;
  placeholder: string;
  placeholderKey?: string;
  titleKey?: string;
  rawTitle?: string;
  bgClass?: string;
  fallback?: number;
};

export const NUMERIC_COLUMNS: NumericColumnConfig[] = [
  { col: 1, field: "debit", defaultVal: "", step: "0.01", placeholder: "0.00" },
  {
    col: 2,
    field: "credit",
    defaultVal: "",
    step: "0.01",
    placeholder: "0.00",
  },
  {
    col: 3,
    field: "g_debit",
    defaultVal: "",
    step: "0.01",
    placeholder: "0.00",
    bgClass: "bg-amber-50",
  },
  {
    col: 4,
    field: "g_credit",
    defaultVal: "",
    step: "0.01",
    placeholder: "0.00",
    bgClass: "bg-amber-50",
  },
  {
    col: 5,
    field: "gauge",
    defaultVal: "875",
    step: "0.01",
    placeholder: "875",
    placeholderKey: "table.columns.gaugePlaceholder",
    titleKey: "table.columns.gaugeTooltip",
    fallback: 875,
  },
  {
    col: 6,
    field: "g_debit_base",
    defaultVal: "",
    step: "0.000001",
    placeholder: "0.00",
    bgClass: "bg-amber-50",
    rawTitle: "يمكن تعديل الذهب المعاير، وسيتم تحديث المعايرة تلقائياً",
  },
  {
    col: 7,
    field: "g_credit_base",
    defaultVal: "",
    step: "0.000001",
    placeholder: "0.00",
    bgClass: "bg-amber-50",
    titleKey: "table.columns.gaugeTooltip",
  },
];
