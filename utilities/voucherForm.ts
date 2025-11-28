import type { VoucherDetail } from "@/types/voucher";

// Shared lightweight types used within the voucher form domain
export type NumericValue = number | string | undefined;

export type VoucherDetailRow = {
  id: number;
  vouch_id: number;
  acc_id: number;
  acc_code: string;
  acc_name: string;
  debit: NumericValue;
  credit: NumericValue;
  debit_g: NumericValue;
  credit_g: NumericValue;
  gauge: number;
  cost_id: number;
  vouch_notes: string;
  cr_date: string;
};

export type ComparableDetail = {
  accId: number | null;
  debit: number;
  credit: number;
  debitG: number;
  creditG: number;
  gauge: number;
  costId: number;
  notes: string;
};

// Numeric helpers
export const parseNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    const parsed = Number(cleaned);

    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value === undefined || value === null) return 0;
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : 0;
};

export const ensurePositiveNumber = (value: unknown): number | null => {
  const numeric = parseNumber(value);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export const formatDecimalString = (value: number, digits: number): string => {
  const normalized = Number.isFinite(value) ? value : 0;

  return normalized.toFixed(digits);
};

export const formatNumber = (value: number, digits: number): number =>
  Number.parseFloat(value.toFixed(digits));

// Identity helpers
export const getAccountIdFromDetail = (
  detail: VoucherDetail,
): number | null => {
  const primary = parseNumber((detail.acc_id as any) ?? 0);

  return primary > 0 ? primary : null;
};

export const getNumericDetailId = (id: unknown): number | null => {
  const numeric = Number(id);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export const normalizeDetailIdentifier = (id: unknown): string | null => {
  if (id === null || id === undefined) return null;
  const numeric = getNumericDetailId(id);

  if (numeric !== null) return `num:${numeric}`;
  const stringValue = String(id).trim();

  return stringValue.length > 0 ? `str:${stringValue}` : null;
};

// Mapping helpers
export const mapDetailToRow = (detail: VoucherDetail): VoucherDetailRow => {
  const accId = Number(detail.acc_id);

  return {
    id: Number(detail.id) || 0,
    vouch_id: Number(detail.vouch_id) || 0,
    acc_id: Number.isFinite(accId) ? accId : 0,
    acc_code: detail.acc_code ?? "",
    acc_name: detail.acc_name ?? "",
    debit: detail.debit,
    credit: detail.credit,
    debit_g: detail.debit_g,
    credit_g: detail.credit_g,
    gauge: parseNumber(detail.gauge) || 875,
    cost_id: parseNumber(detail.cost_id) || 0,
    vouch_notes: detail.vouch_notes ?? "",
    cr_date: detail.cr_date ?? new Date().toISOString(),
  };
};

export const normalizeDetailForComparison = (
  detail: VoucherDetailRow | undefined,
): ComparableDetail | null => {
  if (!detail) return null;

  return {
    accId: getAccountIdFromDetail(detail as any),
    debit: parseNumber(detail.debit),
    credit: parseNumber(detail.credit),
    debitG: parseNumber(detail.debit_g),
    creditG: parseNumber(detail.credit_g),
    gauge: parseNumber(detail.gauge),
    costId: parseNumber(detail.cost_id),
    notes: detail.vouch_notes ? String(detail.vouch_notes).trim() : "",
  };
};

export const hasDetailChanged = (
  originalDetail: VoucherDetailRow | undefined,
  currentDetail: VoucherDetailRow,
): boolean => {
  const originalComparable = normalizeDetailForComparison(originalDetail);
  const currentComparable = normalizeDetailForComparison(currentDetail);

  if (!currentComparable) return false;
  if (!originalComparable) return true;

  const numericKeys: (keyof ComparableDetail)[] = [
    "accId",
    "debit",
    "credit",
    "debitG",
    "creditG",
    "gauge",
    "costId",
  ];

  for (const key of numericKeys) {
    if (
      Number(originalComparable[key] ?? 0) !==
      Number(currentComparable[key] ?? 0)
    ) {
      return true;
    }
  }
  if (originalComparable.notes !== currentComparable.notes) return true;

  return false;
};

export function mapRowToApiPayload(
  detail: VoucherDetailRow,
  voucherId: number,
): Partial<VoucherDetail> | null {
  const accId = getAccountIdFromDetail(detail as any);

  if (!accId) return null;

  const normalizedDetailId = getNumericDetailId(detail.id);
  const costId = parseNumber(detail.cost_id);

  return {
    id: normalizedDetailId ?? detail.id,
    vouch_id: voucherId,
    acc_id: accId,
    debit: detail.debit !== undefined ? parseNumber(detail.debit) : undefined,
    credit:
      detail.credit !== undefined ? parseNumber(detail.credit) : undefined,
    debit_g:
      detail.debit_g !== undefined ? parseNumber(detail.debit_g) : undefined,
    credit_g:
      detail.credit_g !== undefined ? parseNumber(detail.credit_g) : undefined,
    gauge: parseNumber(detail.gauge) || 875,
    vouch_notes: detail.vouch_notes ?? "",
    cost_id: costId > 0 ? costId : null,
    cr_date: detail.cr_date ?? new Date().toISOString(),
  } as Partial<VoucherDetail>;
}

// Helper function to clear opposite field when entering debit/credit
export const clearOppositeField = (
  field: keyof VoucherDetail,
  value: any,
): {
  debit?: undefined;
  credit?: undefined;
  base_debit?: undefined;
  base_credit?: undefined;
  debit_g?: undefined;
  credit_g?: undefined;
} => {
  const cleared: any = {};
  const numValue = parseNumber(value);

  if (field === "debit" && numValue > 0) {
    cleared.credit = undefined;
  } else if (field === "credit" && numValue > 0) {
    cleared.debit = undefined;
  } else if (field === "base_debit" && numValue > 0) {
    cleared.base_credit = undefined;
  } else if (field === "base_credit" && numValue > 0) {
    cleared.base_debit = undefined;
  } else if (field === "debit_g" && numValue > 0) {
    cleared.credit_g = undefined;
  } else if (field === "credit_g" && numValue > 0) {
    cleared.debit_g = undefined;
  }

  return cleared;
};

// Helper function to get gauge from account or caratTypes
export const getAccountGauge = (
  selectedAccount: any,
  caratTypes: any[],
): number => {
  if (!selectedAccount || caratTypes.length === 0) return 875;

  const accountGauge = selectedAccount.gauge || selectedAccount.carat;

  if (!accountGauge) return 875;

  const matchedCaratType = caratTypes.find(
    (ct: any) =>
      ct.id === accountGauge ||
      ct.gauge === accountGauge ||
      ct.value === accountGauge,
  );

  if (matchedCaratType) {
    return (
      matchedCaratType.gauge ||
      matchedCaratType.value ||
      matchedCaratType.id ||
      875
    );
  }

  return accountGauge;
};

// Helper function to calculate totals
export const calculateVoucherTotals = (
  details: VoucherDetail[],
  includeBaseDebitCredit: boolean = false,
): {
  totalDebit: number;
  totalCredit: number;
  totalDebitG: number;
  totalCreditG: number;
  totalBaseDebit: number;
  totalBaseCredit: number;
} => {
  return details.reduce(
    (totals, detail) => {
      const debit = detail.debit !== undefined ? parseNumber(detail.debit) : 0;
      const credit =
        detail.credit !== undefined ? parseNumber(detail.credit) : 0;
      const baseDebit =
        includeBaseDebitCredit && detail.base_debit !== undefined
          ? parseNumber(detail.base_debit)
          : 0;
      const baseCredit =
        includeBaseDebitCredit && detail.base_credit !== undefined
          ? parseNumber(detail.base_credit)
          : 0;
      // استخدام g_debit_base و g_credit_base بدلاً من debit_g و credit_g
      // لأن هذه هي القيم التي يتم ترحيلها إلى GL
      const debitG =
        detail.g_debit_base !== undefined
          ? parseNumber(detail.g_debit_base)
          : detail.debit_g !== undefined
            ? parseNumber(detail.debit_g)
            : 0;
      const creditG =
        detail.g_credit_base !== undefined
          ? parseNumber(detail.g_credit_base)
          : detail.credit_g !== undefined
            ? parseNumber(detail.credit_g)
            : 0;

      return {
        totalDebit: totals.totalDebit + debit + baseDebit,
        totalCredit: totals.totalCredit + credit + baseCredit,
        totalDebitG: totals.totalDebitG + debitG,
        totalCreditG: totals.totalCreditG + creditG,
        totalBaseDebit: totals.totalBaseDebit + baseDebit,
        totalBaseCredit: totals.totalBaseCredit + baseCredit,
      };
    },
    {
      totalDebit: 0,
      totalCredit: 0,
      totalDebitG: 0,
      totalCreditG: 0,
      totalBaseDebit: 0,
      totalBaseCredit: 0,
    },
  );
};

// Helper function to calculate calibrated gold from base gold and gauge
// حساب الذهب المعاير من الذهب القائم والمعيار
export const calculateCalibratedGold = (
  baseValue: number,
  gauge: number,
  baseGauge: number = 875,
  decimalPlaces: number = 2,
): number => {
  if (!baseValue || baseValue <= 0 || !gauge || gauge <= 0) return 0;

  return parseFloat(((baseValue * gauge) / baseGauge).toFixed(decimalPlaces));
};

// Helper function to calculate reverse calibrated gold (from calibrated to base)
// حساب الذهب القائم من الذهب المعاير (الحساب العكسي)
export const calculateReverseCalibratedGold = (
  calibratedValue: number,
  gauge: number,
  baseGauge: number = 875,
): number => {
  if (!calibratedValue || calibratedValue <= 0 || !gauge || gauge <= 0)
    return 0;

  return parseFloat(((calibratedValue * baseGauge) / gauge).toFixed(6));
};

export const calculateGaugeFromCalibrated = (
  calibratedValue: number,
  actualValue: number,
  baseGauge: number = 875,
  decimalPlaces: number = 3,
): number => {
  if (
    !calibratedValue ||
    calibratedValue <= 0 ||
    !actualValue ||
    actualValue <= 0
  ) {
    return baseGauge;
  }

  return parseFloat(
    ((calibratedValue * baseGauge) / actualValue).toFixed(decimalPlaces),
  );
};
