import {
  INVOICE_PAY_TYPES,
  type InvoiceDetail,
  type InvoicePayType,
} from "@/types/models/invoice";

// Shared lightweight types used within the invoice form domain
export type NumericValue = number | string;

export type InvoiceItemRow = {
  id: number;
  item_id: number | null;
  item?: number | null;
  item_code: string;
  item_name?: string;
  qty: NumericValue;
  weight: NumericValue;
  g_weight: NumericValue;
  k: string;
  price: NumericValue;
  price_w: NumericValue;
  note: string;
  trans_type: number;
  purity: string;
  total: NumericValue;
  total_w: NumericValue;
  total_a: NumericValue;
  tax: NumericValue;
  tax_prc: NumericValue;
  stones: NumericValue | null;
  item_disc_amt: NumericValue;
  item_disc_prc?: NumericValue;
  sn?: string;
  item_desc?: string;
  inv_notes?: string | null;
  cr_date?: string;
  cr_user?: string;
  upd_date?: string;
  upd_user?: string;
  com?: number;
  year?: number | null;
  inv?: number;
  box?: number | null;
};

export type ComparableRow = {
  itemId: number | null;
  qty: number;
  weight: number;
  gWeight: number;
  price: number;
  priceW: number;
  total: number;
  totalW: number;
  totalA: number;
  tax: number;
  taxRate: number;
  discountAmount: number;
  discountRate: number;
  stones: number | null;
  purity: string;
  note: string;
  extraNote: string;
  itemCode: string;
  itemDesc: string;
  transType: number;
  karat: string;
  box: number | null;
};

// Numeric helpers
export const parseNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    const parsed = Number(cleaned);

    return Number.isFinite(parsed) ? parsed : 0;
  }
  const numeric = Number(value ?? 0);

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
export const getItemIdFromRow = (row: InvoiceItemRow): number | null => {
  const primary =
    typeof row.item === "number"
      ? row.item
      : parseNumber((row.item as any) ?? 0);
  const fallback = parseNumber((row.item_id as any) ?? 0);
  const candidate =
    Number.isFinite(primary) && primary > 0 ? primary : fallback;
  const parsed = parseNumber(candidate);

  return parsed > 0 ? parsed : null;
};

export const getNumericRowId = (id: unknown): number | null => {
  const numeric = Number(id);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export const normalizeRowIdentifier = (id: unknown): string | null => {
  if (id === null || id === undefined) return null;
  const numeric = getNumericRowId(id);

  if (numeric !== null) return `num:${numeric}`;
  const stringValue = String(id).trim();

  return stringValue.length > 0 ? `str:${stringValue}` : null;
};

// Mapping helpers
export const mapDetailToRow = (
  detail: InvoiceDetail,
  fallbackTransType: number,
): InvoiceItemRow => {
  const itemId = Number(detail.item);

  return {
    id: Number(detail.id),
    item_id: Number.isFinite(itemId) ? itemId : null,
    item: Number.isFinite(itemId) ? itemId : null,
    item_code: detail.sn ?? "",
    item_name: detail.item_desc ?? "",
    qty: detail.qty ?? "0",
    weight: detail.weight ?? "0",
    g_weight: detail.g_weight ?? "0",
    k: "",
    price: detail.price ?? "0",
    price_w: detail.price_w ?? "0",
    note: detail.inv_notes ?? "",
    trans_type: detail.trans_type ?? fallbackTransType,
    purity: detail.G875 ? String(detail.G875) : "",
    total: detail.total ?? "0",
    total_w: detail.total_w ?? "0",
    total_a: detail.total_a ?? "0",
    tax: detail.tax ?? "0",
    tax_prc: detail.tax_prc ?? "15",
    stones: detail.stones ?? null,
    item_disc_amt: detail.item_disc_amt ?? "0",
    item_disc_prc: detail.item_disc_prc ?? "0",
    sn: detail.sn ?? "",
    item_desc: detail.item_desc ?? "",
    inv_notes: detail.inv_notes ?? "",
    cr_date: detail.cr_date ?? "",
    cr_user: detail.cr_user ?? "",
    upd_date: detail.upd_date ?? "",
    upd_user: detail.upd_user ?? "",
    com: detail.com ?? undefined,
    inv: detail.inv ?? undefined,
    box: detail.box ?? null,
    year: detail.year ?? null,
  };
};

export const normalizeRowForComparison = (
  row: InvoiceItemRow | undefined,
  fallbackTransType: number,
): ComparableRow | null => {
  if (!row) return null;

  return {
    itemId: getItemIdFromRow(row),
    qty: parseNumber(row.qty),
    weight: parseNumber(row.weight),
    gWeight: parseNumber(row.g_weight),
    price: parseNumber(row.price),
    priceW: parseNumber(row.price_w),
    total: parseNumber(row.total),
    totalW: parseNumber(row.total_w),
    totalA: parseNumber(row.total_a),
    tax: parseNumber(row.tax),
    taxRate: parseNumber(row.tax_prc),
    discountAmount: parseNumber(row.item_disc_amt),
    discountRate: parseNumber(row.item_disc_prc ?? 0),
    stones:
      row.stones === null || row.stones === "" ? null : parseNumber(row.stones),
    purity: row.purity ? String(row.purity).trim() : "",
    note: row.note ? String(row.note).trim() : "",
    extraNote: row.inv_notes ? String(row.inv_notes).trim() : "",
    itemCode: row.item_code ? String(row.item_code).trim() : "",
    itemDesc: row.item_desc ? String(row.item_desc).trim() : "",
    transType:
      row.trans_type !== undefined && row.trans_type !== null
        ? Number(row.trans_type)
        : fallbackTransType,
    karat: row.k !== undefined && row.k !== null ? String(row.k).trim() : "",
    box:
      row.box !== undefined && row.box !== null ? parseNumber(row.box) : null,
  };
};

export const hasRowChanged = (
  originalRow: InvoiceItemRow | undefined,
  currentRow: InvoiceItemRow,
  fallbackTransType: number,
): boolean => {
  const originalComparable = normalizeRowForComparison(
    originalRow,
    fallbackTransType,
  );
  const currentComparable = normalizeRowForComparison(
    currentRow,
    fallbackTransType,
  );

  if (!currentComparable) return false;
  if (!originalComparable) return true;

  const numericKeys: (keyof ComparableRow)[] = [
    "itemId",
    "qty",
    "weight",
    "gWeight",
    "price",
    "priceW",
    "total",
    "totalW",
    "totalA",
    "tax",
    "taxRate",
    "discountAmount",
    "discountRate",
  ];

  for (const key of numericKeys) {
    if (
      Number(originalComparable[key] ?? 0) !==
      Number(currentComparable[key] ?? 0)
    ) {
      return true;
    }
  }
  const stringKeys: (keyof ComparableRow)[] = [
    "purity",
    "note",
    "extraNote",
    "itemCode",
    "itemDesc",
    "karat",
  ];

  for (const key of stringKeys) {
    if (originalComparable[key] !== currentComparable[key]) return true;
  }
  if (originalComparable.box !== currentComparable.box) return true;
  if (originalComparable.transType !== currentComparable.transType) return true;
  if (originalComparable.stones !== currentComparable.stones) return true;

  return false;
};

export function mapRowToApiPayload(
  row: InvoiceItemRow,
  invoicePrimaryKey: number,
  companyId: number,
  yearId: number,
  cfg: {
    defaultTaxPrc: number;
    defaultTransType: number;
    payType: InvoicePayType;
  },
): Partial<InvoiceDetail> | null {
  const itemId = getItemIdFromRow(row);

  if (!itemId) return null;

  const resolvedCompanyId =
    ensurePositiveNumber(row.com) ?? ensurePositiveNumber(companyId);
  const resolvedYearId =
    ensurePositiveNumber(row.year) ?? ensurePositiveNumber(yearId);

  if (!resolvedCompanyId || !resolvedYearId) {
    throw new Error("تعذر تحديد بيانات الفرع أو السنة لسطر الفاتورة");
  }

  const numericValues = extractNumericValues(row, cfg);
  const {
    qty,
    weight,
    gWeight,
    price,
    priceW,
    itemDiscountAmount,
    taxRate,
    combinedTotal,
    computedTotalW,
    computedTotalA,
    taxValue,
    stonesValue,
  } = numericValues;

  const normalizedNote = normalizeNote(row);
  const normalizedRowId = getNumericRowId(row.id);
  const normalizedKValue = normalizeKValue(row.k);

  return {
    id: normalizedRowId ?? row.id,
    trans_type: cfg.defaultTransType,
    G875: row.purity ? parseNumber(row.purity) : null,
    k: normalizedKValue,
    qty,
    price,
    price_w: priceW,
    weight,
    g_weight: gWeight,
    total: combinedTotal,
    total_w: computedTotalW,
    total_a: computedTotalA,
    tax: taxValue,
    tax_prc: taxRate,
    stones: stonesValue ?? "",
    item_disc_prc: parseNumber(row.item_disc_prc ?? 0),
    item_disc_amt: itemDiscountAmount,
    sn: row.sn ?? "",
    item_desc: row.item_desc || row.item_name || "",
    item_code:
      (row.item_code && String(row.item_code)) ||
      (itemId ? String(itemId) : ""),
    inv_notes: normalizedNote || (row.item_desc ? String(row.item_desc) : null),
    cr_date: row.cr_date ?? new Date().toISOString(),
    cr_user: row.cr_user ?? "",
    upd_date: new Date().toISOString(),
    upd_user: row.upd_user ?? "",
    com: resolvedCompanyId,
    year: resolvedYearId,
    inv: invoicePrimaryKey,
    item: itemId,
    box: row.box ?? null,
  } as Partial<InvoiceDetail>;
}

function normalizeNote(row: InvoiceItemRow): string | null {
  const resolvedNote = row.note ?? row.inv_notes ?? "";

  return typeof resolvedNote === "string" && resolvedNote.trim().length === 0
    ? null
    : resolvedNote;
}

function normalizeKValue(k: any): number | null {
  if (k === undefined || k === null) return null;
  const rawK = String(k).trim();

  if (rawK.length === 0) return null;
  const numericK = parseNumber(k);

  return Number.isFinite(numericK) && numericK > 0 ? numericK : null;
}


// Helper to extract calculations from mapRowToApiPayload to reduce complexity
function extractNumericValues(
  row: InvoiceItemRow,
  cfg: {
    defaultTaxPrc: number;
    payType: InvoicePayType;
  },
) {
  const qty = parseNumber(row.qty);
  const weight = parseNumber(row.weight);
  const gWeight = parseNumber(row.g_weight);
  const price = parseNumber(row.price);
  const priceW = parseNumber(row.price_w);
  const itemDiscountAmount = parseNumber(row.item_disc_amt ?? 0);
  const taxRate =
    row.tax_prc !== undefined
      ? parseNumber(row.tax_prc)
      : (cfg.defaultTaxPrc ?? 15);

  const computedTotalW =
    row.total_w !== undefined ? parseNumber(row.total_w) : weight * priceW;

  let computedTotalA: number;

  if (row.total_a !== undefined) {
    computedTotalA = parseNumber(row.total_a);
  } else {
    const basePrice = cfg.payType === INVOICE_PAY_TYPES.WAGES ? priceW : price;

    computedTotalA = weight * basePrice;
  }

  const combinedTotal =
    row.total !== undefined
      ? parseNumber(row.total)
      : weight * price + weight * priceW - itemDiscountAmount;

  const taxValue =
    row.tax !== undefined
      ? parseNumber(row.tax)
      : (combinedTotal - itemDiscountAmount) * (taxRate / 100);

  const stonesValue =
    row.stones === null || row.stones === "" ? null : parseNumber(row.stones);

  return {
    qty,
    weight,
    gWeight,
    price,
    priceW,
    itemDiscountAmount,
    taxRate,
    combinedTotal,
    computedTotalW,
    computedTotalA,
    taxValue,
    stonesValue,
  };
}

export const calculateValueAndWagesTax = (
  invoiceItems: InvoiceItemRow[],
  payType: InvoicePayType,
) => {
  let valueTax = 0;
  let wagesTax = 0;

  invoiceItems.forEach((item) => {
    const { totalValueTax: v, totalWagesTax: w } = calculateRowTax(
      item,
      payType,
    );

    valueTax += v;
    wagesTax += w;
  });

  return { totalValueTax: valueTax, totalWagesTax: wagesTax };
};

function calculateRowTax(item: InvoiceItemRow, payType: InvoicePayType) {
  const qty = parseFloat(String(item.qty ?? 1)) || 1;
  const weight = parseFloat(String(item.weight ?? 0));
  const price = parseFloat(String(item.price ?? 0));
  const priceW = parseFloat(String(item.price_w ?? 0));
  const discount = parseFloat(String(item.item_disc_amt ?? 0));
  const taxRate = parseFloat(String(item.tax_prc ?? 15)) / 100;

  const totalA = qty * weight * price;
  const totalW = qty * weight * priceW;

  const finalTotalValue = weight > 0 ? totalA : qty * price;
  const finalTotalWages = weight > 0 ? totalW : qty * priceW;

  let valueTax = 0;
  let wagesTax = 0;

  if (
    payType === INVOICE_PAY_TYPES.VALUE ||
    payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES
  ) {
    const base = finalTotalValue + finalTotalWages;
    const proportionalDiscount =
      payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES && base > 0
        ? (finalTotalValue / base) * discount
        : discount;

    valueTax += (finalTotalValue - proportionalDiscount) * taxRate;
  }

  if (
    payType === INVOICE_PAY_TYPES.WAGES ||
    payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES
  ) {
    const base = finalTotalValue + finalTotalWages;
    const proportionalDiscount =
      payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES && base > 0
        ? (finalTotalWages / base) * discount
        : discount;

    wagesTax += (finalTotalWages - proportionalDiscount) * taxRate;
  }

  return { totalValueTax: valueTax, totalWagesTax: wagesTax };
}
