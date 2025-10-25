import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import toast from "react-hot-toast";
import useFractions, { type Fractions } from "@/utilities/useFractions";
import {
  Invoice,
  InvoiceDetail,
  InvoicePayType,
  INVOICE_PAY_TYPES,
  TransTypes,
} from "@/types/models/invoice";
import {
  createInvoiceAction,
  updateInvoiceAction,
  createInvoiceDetailAction,
  updateInvoiceDetailAction,
  deleteInvoiceDetailAction,
  getInvoiceByIdAction,
  getInvoiceDetailsAction,
  getNextInvoiceIdAction,
} from "@/app/actions/invoice";
import { generateZatcaQR } from "@/utilities/zatca";

type NumericValue = number | string;

type InvoiceItemRow = {
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

type FormState = {
  cust_code: any | null;
  cust_name: string;
  inv_id: number | string | null;
  inv_date: string;
  pay_type: InvoicePayType;
  inv_notes: string;
  ref_no: string;
  vat_no: string;
  cr_no: string;
  gov: string;
  city: string;
  area: string;
  street: string;
  build_no: string;
  post_no: string;
  post_code: string;
  commit: boolean;
  print: boolean;
};

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: any }
  | { type: "SET_ALL"; payload: Partial<FormState> }
  | { type: "RESET"; payload: FormState };

const defaultInvoiceDate = new Date().toISOString();

const PAYMENT_METHOD_INV_TYPES = {
  cash: 1,
  credit: 2,
} as const;

const PAY_TYPE_VALUES = Object.values(
  INVOICE_PAY_TYPES,
) as InvoicePayType[];

const normalizePayType = (value: unknown): InvoicePayType => {
  const numeric = Number(value);
  return PAY_TYPE_VALUES.includes(numeric as InvoicePayType)
    ? (numeric as InvoicePayType)
    : INVOICE_PAY_TYPES.VALUE_AND_WAGES;
};

const EMPLOYEE_CODE_MAP: Record<string, number> = {
  hashem: 1,
  othman: 2,
};

const parseDefaultIdentifier = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const DEFAULT_COMPANY_ID = parseDefaultIdentifier(
  process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID,
  1,
);

const DEFAULT_YEAR_ID = parseDefaultIdentifier(
  process.env.NEXT_PUBLIC_DEFAULT_YEAR_ID,
  1,
);

type InvoiceFormContext =
  | "sale"
  | "purchase"
  | "sale_return"
  | "purchase_return";

const INVOICE_FORM_CONFIG: Record<
  InvoiceFormContext,
  {
    transType: TransTypes;
    contactLabel: string;
    customerFilter?: (customer: any) => boolean;
  }
> = {
  sale: {
    transType: TransTypes.SALES,
    contactLabel: "العميل",
    customerFilter: (customer) => customer.box_type !== 2,
  },
  purchase: {
    transType: TransTypes.PURCHASE,
    contactLabel: "المورد",
    customerFilter: (customer) => customer.box_type !== 2,
  },
  sale_return: {
    transType: TransTypes.SALES_RETURN,
    contactLabel: "العميل",
    customerFilter: (customer) => customer.box_type !== 2,
  },
  purchase_return: {
    transType: TransTypes.PURCHASE_RETURN,
    contactLabel: "المورد",
    customerFilter: (customer) => customer.box_type !== 2,
  },
};

const parseNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const ensurePositiveNumber = (value: unknown): number | null => {
  const numeric = parseNumber(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const formatDecimalString = (value: number, digits: number): string => {
  const normalized = Number.isFinite(value) ? value : 0;
  return normalized.toFixed(digits);
};

const formatNumber = (value: number, digits: number): number =>
  Number.parseFloat(value.toFixed(digits));

const mapDetailToRow = (
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
  };
};

const getItemIdFromRow = (row: InvoiceItemRow): number | null => {
  const candidate =
    row.item_id ??
    (typeof row.item === "number"
      ? row.item
      : parseNumber((row.item as unknown) ?? 0));

  const parsed = parseNumber(candidate);
  return parsed > 0 ? parsed : null;
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_ALL":
      return { ...state, ...action.payload };
    case "RESET":
      return action.payload;
    default:
      return state;
  }
}

export default function useInvoiceForm({
  invoiceData,
  invoiceDetailsData,
  isNewInvoice,
  initialCustomers,
  initialItems,
  initialCategories,
  initialGoldPrice,
  initialHomePurity,
  invoiceRecordId = null,
  context = "sale",
}: {
  invoiceData: Invoice | null;
  invoiceDetailsData: InvoiceDetail[];
  isNewInvoice: boolean;
  initialCustomers: any[];
  initialItems: any[];
  initialCategories: any[];
  initialGoldPrice: number | null;
  initialHomePurity: number;
  invoiceRecordId?: number | string | null;
  context?: InvoiceFormContext;
}) {
  const invoiceConfig = INVOICE_FORM_CONFIG[context];
  const defaultTransType = invoiceConfig.transType;
  const contactLabel = invoiceConfig.contactLabel;
  const resolvedInvoiceCustomerCode =
    invoiceData?.cust_code !== undefined && invoiceData?.cust_code !== null
      ? String(invoiceData.cust_code)
      : invoiceData?.cust !== undefined && invoiceData?.cust !== null
        ? String(invoiceData.cust)
        : null;

  // lists - using initial data directly
  const [items, setItems] = useState<any[]>(initialItems || []);
  const [categories, setCategories] = useState<any[]>(initialCategories || []);
  const filterCustomers = invoiceConfig.customerFilter ?? (() => true);
  const [customers, setCustomers] = useState<any[]>(
    initialCustomers?.filter((c: any) => filterCustomers(c)) || [],
  );

  // UI state
  const [employee, setEmployee] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(isNewInvoice);
  const [isLoading, setIsLoading] = useState<boolean>(false); // No more loading since data is provided

  const [goldPrice, setGoldPrice] = useState<number | null>(initialGoldPrice);
  const [homePurity, setHomePurity] = useState<number>(initialHomePurity);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [handlingMethod, setHandlingMethod] = useState<string>("");
  const [mobileMethod, setMobileMethod] = useState<string>("");
  const [searchNumber, setSearchNumber] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [currentRecord, setCurrentRecord] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(1);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);

  const fractions = useFractions() as Fractions;
  const frac = fractions?.frac ?? 2;
  const frac2 = fractions?.frac2 ?? 3;
  const [invoicePk, setInvoicePk] = useState<number | null>(
    invoiceData?.id
      ? Number(invoiceData.id)
      : invoiceRecordId !== null && invoiceRecordId !== undefined
        ? Number(invoiceRecordId)
        : null,
  );
  const [originalInvoiceItems, setOriginalInvoiceItems] = useState<
    InvoiceItemRow[]
  >(
    invoiceDetailsData?.length
      ? invoiceDetailsData.map((detail) =>
          mapDetailToRow(detail, defaultTransType),
        )
      : [],
  );
  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([]);
  const [defaultTaxPrc, setDefaultTaxPrc] = useState<number>(15);

  useEffect(() => {
    const candidate =
      invoiceData?.id ??
      (invoiceRecordId !== null && invoiceRecordId !== undefined
        ? invoiceRecordId
        : null);

    if (candidate === null || candidate === undefined || candidate === "") {
      return;
    }

    const parsed = Number(candidate);
    setInvoicePk(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
  }, [invoiceData?.id, invoiceRecordId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readNumericValue = (key: string): number | null => {
      const localValue = window.localStorage.getItem(key);
      const cookieValue = document.cookie
        .split(";")
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith(`${key}=`))
        ?.split("=")[1];

      const rawValue = localValue ?? cookieValue;
      if (!rawValue || rawValue === "undefined" || rawValue === "null") {
        return null;
      }

      const parsed = Number(rawValue);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const resolvedBranch =
      readNumericValue("selectedBranch") ??
      (invoiceData?.com !== undefined
        ? parseNumber(invoiceData.com)
        : null);

    const resolvedYear =
      readNumericValue("selectedYear") ??
      (invoiceData?.year !== undefined
        ? parseNumber(invoiceData.year)
        : null);

    setSelectedBranchId(resolvedBranch);
    setSelectedYearId(resolvedYear);
  }, [invoiceData]);

  // form reducer
  const initialFormState: FormState = {
    cust_code: resolvedInvoiceCustomerCode,
    cust_name: invoiceData?.cust_name ?? "",
    inv_id: invoiceData?.inv_id ?? null,
    inv_date: invoiceData?.inv_date ?? defaultInvoiceDate,
    pay_type: normalizePayType(invoiceData?.pay_type),
    inv_notes: invoiceData?.inv_notes ?? "",
    ref_no: invoiceData?.ref_no ?? "",
    vat_no: invoiceData?.vat_no ?? "",
    cr_no: invoiceData?.cr_no ?? "",
    gov: invoiceData?.gov ?? "",
    city: invoiceData?.city ?? "",
    area: invoiceData?.area ?? "",
    street: invoiceData?.street ?? "",
    build_no: invoiceData?.build_no ?? "",
    post_no: invoiceData?.post_no ?? "",
    post_code: invoiceData?.post_code ?? "",
    commit: invoiceData?.commit ?? false,
    print: invoiceData?.print ?? false,
  };

  const [form, dispatchForm] = useReducer(formReducer, initialFormState);

  // invoice items state
  const makeEmptyRow = useCallback(
    (): InvoiceItemRow => ({
      id: Date.now(),
      item_id: null,
      item: null,
      item_code: "",
      qty: 1 as number,
      weight: 0 as number,
      g_weight: 0 as number,
      k: "",
      price: 0 as number,
      price_w: 0 as number,
      note: "",
      trans_type: defaultTransType,
      purity: "",
      total: 0 as number,
      total_w: 0 as number,
      total_a: 0 as number,
      tax: 0 as number,
      tax_prc: 15 as number,
      stones: null,
      item_disc_amt: 0 as number,
      item_disc_prc: 0 as number,
      sn: "",
      item_desc: "",
      inv_notes: "",
      cr_date: new Date().toISOString(),
      upd_date: new Date().toISOString(),
    }),
    [defaultTransType],
  );

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemRow[]>(
    originalInvoiceItems.length > 0 ? originalInvoiceItems : [makeEmptyRow()],
  );

  const selectedCustomer = useMemo(() => {
    const rawCode = form.cust_code;
    const normalizedCode =
      rawCode !== null && rawCode !== undefined
        ? String(rawCode)
        : invoiceData?.cust_code !== undefined &&
            invoiceData?.cust_code !== null
          ? String(invoiceData.cust_code)
          : "";

    if (!normalizedCode) {
      return null;
    }

    const matchByCode =
      customers.find((customer: any) => {
        if (
          customer.cust_code !== undefined &&
          customer.cust_code !== null &&
          `${customer.cust_code}`.trim().length > 0
        ) {
          return String(customer.cust_code) === normalizedCode;
        }
        return false;
      }) ?? null;

    if (matchByCode) {
      return matchByCode;
    }

    const matchById =
      customers.find(
        (customer: any) => String(customer.id ?? "") === normalizedCode,
      ) ?? null;

    if (matchById) {
      return matchById;
    }

    if (invoiceData) {
      return {
        id:
          invoiceData.cust ??
          (Number.isFinite(Number(normalizedCode))
            ? Number(normalizedCode)
            : normalizedCode),
        cust_code: invoiceData.cust_code ?? normalizedCode,
        cust_name: invoiceData.cust_name ?? form.cust_name ?? "",
        vat_no: invoiceData.vat_no ?? "",
        mobile: invoiceData.mobile ?? "",
        handling: invoiceData.handling ?? "",
        cr_no: invoiceData.cr_no ?? "",
        gov: invoiceData.gov ?? "",
        city: invoiceData.city ?? "",
        area: invoiceData.area ?? "",
        street: invoiceData.street ?? "",
        build_no: invoiceData.build_no ?? "",
        post_no: invoiceData.post_no ?? "",
        post_code: invoiceData.post_code ?? "",
      } as any;
    }

    return null;
  }, [customers, form.cust_code, form.cust_name, invoiceData]);

  const mapRowToApiPayload = useCallback(
    (
      row: InvoiceItemRow,
      invoicePrimaryKey: number,
      companyId: number,
      yearId: number,
    ) => {
      const itemId = getItemIdFromRow(row);
      if (!itemId) return null;

      const resolvedCompanyId =
        ensurePositiveNumber(row.com) ?? ensurePositiveNumber(companyId);
      const resolvedYearId =
        ensurePositiveNumber(row.year) ?? ensurePositiveNumber(yearId);

      if (!resolvedCompanyId || !resolvedYearId) {
        throw new Error("تعذر تحديد بيانات الفرع أو السنة لسطر الفاتورة");
      }

      const qty = parseNumber(row.qty);
      const weight = parseNumber(row.weight);
      const gWeight = parseNumber(row.g_weight);
      const price = parseNumber(row.price);
      const priceW = parseNumber(row.price_w);
      const itemDiscountAmount = parseNumber(row.item_disc_amt ?? 0);
      const taxRate =
        row.tax_prc !== undefined
          ? parseNumber(row.tax_prc)
          : (defaultTaxPrc ?? 15);

      const computedTotalW =
        row.total_w !== undefined ? parseNumber(row.total_w) : weight * priceW;

      const computedTotalA =
        row.total_a !== undefined
          ? parseNumber(row.total_a)
          : weight *
              (form.pay_type === INVOICE_PAY_TYPES.WAGES ? priceW : price);

      const combinedTotal =
        row.total !== undefined
          ? parseNumber(row.total)
          : weight * price + weight * priceW - itemDiscountAmount;

      const taxValue =
        row.tax !== undefined
          ? parseNumber(row.tax)
          : (combinedTotal - itemDiscountAmount) * (taxRate / 100);

      const stonesValue =
        row.stones === null || row.stones === ""
          ? null
          : formatDecimalString(parseNumber(row.stones), frac);

      const resolvedNote = row.note ?? row.inv_notes ?? "";
      const normalizedNote =
        typeof resolvedNote === "string" && resolvedNote.trim().length === 0
          ? null
          : resolvedNote;

      return {
        id: row.id,
        trans_type: row.trans_type ?? defaultTransType,
        G875: row.purity ? parseNumber(row.purity) : null,
        k:
          row.k !== undefined && row.k !== null && row.k !== ""
            ? parseNumber(row.k)
            : null,
        qty: formatDecimalString(qty, frac),
        price: formatDecimalString(price, frac),
        price_w: formatDecimalString(priceW, frac),
        weight: formatDecimalString(weight, frac2),
        g_weight: formatDecimalString(gWeight, frac2),
        total: formatDecimalString(combinedTotal, frac),
        total_w: formatDecimalString(computedTotalW, frac),
        total_a: formatDecimalString(computedTotalA, frac),
        tax: formatDecimalString(taxValue, frac),
        tax_prc: formatDecimalString(taxRate, frac),
        stones: stonesValue,
        item_disc_prc: formatDecimalString(
          parseNumber(row.item_disc_prc ?? 0),
          frac,
        ),
        item_disc_amt: formatDecimalString(itemDiscountAmount, frac),
        sn: row.sn ?? "",
        item_desc: row.item_desc ?? row.item_name ?? "",
        item_code: row.item_code ?? "",
        inv_notes: normalizedNote,
        cr_date: row.cr_date ?? new Date().toISOString(),
        cr_user: row.cr_user ?? "",
        upd_date: new Date().toISOString(),
        upd_user: row.upd_user ?? "",
        com: resolvedCompanyId,
        year: resolvedYearId,
        inv: invoicePrimaryKey,
        item: itemId,
        box: row.box ?? null,
      };
    },
    [
      defaultTaxPrc,
      defaultTransType,
      frac,
      frac2,
      form.pay_type,
    ],
  );

  // sync incoming invoiceData/details
  useEffect(() => {
    if (!invoiceData) return;

    setInvoicePk(invoiceData.id ? Number(invoiceData.id) : null);
    dispatchForm({
      type: "SET_ALL",
      payload: {
        cust_code:
          invoiceData.cust_code !== undefined && invoiceData.cust_code !== null
            ? String(invoiceData.cust_code)
            : invoiceData.cust !== undefined && invoiceData.cust !== null
              ? String(invoiceData.cust)
              : null,
        cust_name: invoiceData.cust_name ?? "",
        inv_id: invoiceData.inv_id ?? null,
        inv_date: invoiceData.inv_date ?? defaultInvoiceDate,
        pay_type: normalizePayType(invoiceData.pay_type),
        inv_notes: invoiceData.inv_notes ?? "",
        ref_no: invoiceData.ref_no ?? "",
        vat_no: invoiceData.vat_no ?? "",
        cr_no: invoiceData.cr_no ?? "",
        gov: invoiceData.gov ?? "",
        city: invoiceData.city ?? "",
        area: invoiceData.area ?? "",
        street: invoiceData.street ?? "",
        build_no: invoiceData.build_no ?? "",
        post_no: invoiceData.post_no ?? "",
        post_code: invoiceData.post_code ?? "",
        commit: invoiceData.commit ?? false,
        print: invoiceData.print ?? false,
      },
    });

    if (invoiceData.inv_type) {
      setPaymentMethod(
        invoiceData.inv_type === PAYMENT_METHOD_INV_TYPES.credit
          ? "credit"
          : "cash",
      );
    }

    if (invoiceDetailsData && invoiceDetailsData.length > 0) {
      const mappedDetails = invoiceDetailsData.map((detail) =>
        mapDetailToRow(detail, defaultTransType),
      );
      setInvoiceItems(mappedDetails);
      setOriginalInvoiceItems(mappedDetails);
      setDeletedItemIds([]);
    }
  }, [invoiceData, invoiceDetailsData, defaultTransType]);

  // totals (simple helpers returned to consumer can compute more if needed)
  const computeTotals = useCallback(
    (payType: InvoicePayType, rows: InvoiceItemRow[]) => {
      const totalAmount = rows.reduce((sum, item) => {
        const weight = parseNumber(item.weight);
        const price = parseNumber(item.price);
        const priceW = parseNumber(item.price_w);
        const discount = parseNumber(item.item_disc_amt);

        const totalA = weight * price;
        const totalW = weight * priceW;

        const rowTotal =
          payType === INVOICE_PAY_TYPES.VALUE
            ? totalA
            : payType === INVOICE_PAY_TYPES.WAGES
              ? totalW
              : totalA + totalW;

        return sum + rowTotal - discount;
      }, 0);

      const taxAmount = rows.reduce((sum, item) => {
        const weight = parseNumber(item.weight);
        const price = parseNumber(item.price);
        const priceW = parseNumber(item.price_w);
        const discount = parseNumber(item.item_disc_amt);
        const taxRate = parseNumber(item.tax_prc ?? defaultTaxPrc ?? 15) / 100;

        const totalA = weight * price;
        const totalW = weight * priceW;
        const rowTotal =
          payType === INVOICE_PAY_TYPES.VALUE
            ? totalA
            : payType === INVOICE_PAY_TYPES.WAGES
              ? totalW
              : totalA + totalW;
        const base = rowTotal - discount;
        return sum + base * taxRate;
      }, 0);

      const totalDiscount = rows.reduce((sum, item) => {
        const discount = parseNumber(item.item_disc_amt);
        return sum + discount;
      }, 0);

      const totalGWeight = rows.reduce((sum, item) => {
        const gWeight = parseNumber(item.g_weight);
        return sum + gWeight;
      }, 0);

      return {
        totalAmount,
        taxAmount,
        totalDiscount,
        totalGWeight,
        netAmount: totalAmount + taxAmount,
      };
    },
    [defaultTaxPrc],
  );

  // barcode search logic kept here so consumer can call it. It mutates invoiceItems and items lists.
  // NOTE: This function needs to be updated to not make API calls, but will require more complex refactoring
  const handleBarcodeSearch = useCallback(
    async (term?: string) => {
      const searchTerm = (term ?? searchValue).trim();
      if (!searchTerm || !isEditing) return;

      try {
        let exactMatch: any | null = null;

        exactMatch = items.find((item: any) => {
          const itemBarcode = (item.item_barcode ?? "").toString().trim();
          const itemCode = (item.item_code ?? "").toString().trim();
          return itemBarcode === searchTerm || itemCode === searchTerm;
        });

        if (!exactMatch) {
          // In the updated version, we should not make API calls here
          // This would need to be refactored to use a service that can be called from the server component
          toast.error(`لم يتم العثور على صنف: ${searchTerm}`);
          setSearchValue("");
          return;
        }

        const firstEmptyRowIndex = invoiceItems.findIndex(
          (it) => (!it.item_id && !it.item_name) || Number(it.weight) === 0,
        );

        const updated = [...invoiceItems];
        const targetIndex = firstEmptyRowIndex !== -1 ? firstEmptyRowIndex : 0;

        if (firstEmptyRowIndex === -1) updated.unshift(makeEmptyRow());

        const selected = exactMatch;
        if (!items.find((i) => i.id === selected.id))
          setItems((prev) => [...prev, selected]);

        const priceFromSelected = Number(selected.item_price ?? 0);
        const workPriceFromSelected = Number(selected.work_price ?? 0);

        const row = {
          ...updated[targetIndex],
          item_id: selected.id ?? null,
          item: selected.id ?? null,
          item_code: selected.item_code ?? "",
          item_name: selected.item_name ?? "",
          item_desc: selected.item_name ?? updated[targetIndex].item_desc ?? "",
          k: selected.k ?? "",
          price: goldPrice ?? priceFromSelected,
          price_w: workPriceFromSelected,
          purity:
            selected.purity ??
            (homePurity ? String(homePurity) : updated[targetIndex].purity),
          stones: selected.stones ?? updated[targetIndex].stones,
        } as InvoiceItemRow;

        if (
          selected.item_weight !== undefined &&
          selected.item_weight !== null &&
          selected.item_weight !== ""
        ) {
          row.weight = Number(selected.item_weight ?? 0);
          row.g_weight =
            Number(selected.item_g_weight ?? selected.item_weight ?? 0) || 0;
        }

        if (
          selected.item_g_weight !== undefined &&
          selected.item_g_weight !== null &&
          selected.item_g_weight !== ""
        ) {
          row.g_weight = Number(selected.item_g_weight);
        }

        const wCalc =
          row.weight < 1 && row.g_weight > row.weight
            ? row.weight * 1000
            : row.weight;

        row.total_a =
          form.pay_type === INVOICE_PAY_TYPES.WAGES
            ? wCalc * (row.price_w ?? 0)
            : wCalc * (row.price ?? 0);
        row.total_w = wCalc * (row.price_w ?? 0);

        const base =
          (form.pay_type === INVOICE_PAY_TYPES.VALUE
            ? row.total_a
            : form.pay_type === INVOICE_PAY_TYPES.WAGES
              ? row.total_w
              : (row.total_a || 0) + (row.total_w || 0)) -
          (row.item_disc_amt ?? 0);

        row.tax = (base * (row.tax_prc ?? 15)) / 100;
        row.total = base + row.tax;

        updated[targetIndex] = row;
        setInvoiceItems(updated);
        setSearchValue("");

        toast.success(
          `✅ تم إضافة الصنف: ${selected.item_name || selected.item_code} (${selected.item_code})`,
        );

        const isLastRow = targetIndex === updated.length - 1;
        const isRowFilled =
          updated[targetIndex].item_id ||
          updated[targetIndex].item_name ||
          updated[targetIndex].weight > 0;

        if (isLastRow && isRowFilled)
          setInvoiceItems((prev) => [...prev, makeEmptyRow()]);
      } catch (error) {
        console.error("خطأ في البحث بالباركود:", error);
        toast.error("حدث خطأ أثناء البحث بالباركود");
      }
    },
    [
      invoiceItems,
      items,
      makeEmptyRow,
      goldPrice,
      homePurity,
      isEditing,
      searchValue,
      form.pay_type,
    ],
  );

  const getNextInvoiceNumber = useCallback(async () => {
    try {
      const nextInvoiceId = await getNextInvoiceIdAction(
        Number(defaultTransType),
      );

      if (!Number.isFinite(nextInvoiceId) || nextInvoiceId <= 0) {
        throw new Error("invalid-next-invoice-id");
      }

      return nextInvoiceId;
    } catch (error) {
      console.error("فشل في جلب رقم الفاتورة التالي:", error);
      throw new Error("تعذر الحصول على رقم فاتورة جديد");
    }
  }, [defaultTransType]);

  const saveInvoice = useCallback(async () => {
    if (!selectedCustomer) {
      toast.error(`يرجى اختيار ${contactLabel}`);
      return;
    }

    const validItems = invoiceItems.filter(
      (item) => getItemIdFromRow(item) !== null,
    );

    if (validItems.length === 0) {
      toast.error("يرجى إدخال تفاصيل الفاتورة");
      return;
    }

    setIsLoading(true);

    try {
      const totals = computeTotals(form.pay_type, validItems);
      const invoiceNumber =
        !isNewInvoice && form.inv_id
          ? parseNumber(form.inv_id)
          : await getNextInvoiceNumber();

      const invoiceQr = generateZatcaQR({
        sellerName: "شركة ثمار الصفاء المتميزة التجارية",
        vatNumber: "311452959900003",
        timestamp: form.inv_date,
        totalWithVat: formatNumber(totals.netAmount, frac),
        vatTotal: formatNumber(totals.taxAmount, frac),
      });

      const resolvedCompanyId =
        ensurePositiveNumber(selectedBranchId) ??
        ensurePositiveNumber(invoiceData?.com) ??
        ensurePositiveNumber(DEFAULT_COMPANY_ID);
      const resolvedYearId =
        ensurePositiveNumber(selectedYearId) ??
        ensurePositiveNumber(invoiceData?.year) ??
        ensurePositiveNumber(DEFAULT_YEAR_ID);

      if (!resolvedCompanyId || !resolvedYearId) {
        toast.error("يرجى اختيار الفرع والسنة قبل إنشاء الفاتورة");
        throw new Error("missing-company-or-year");
      }

      const invoicePayload: Record<string, unknown> = {
        inv_id: invoiceNumber,
        inv_date: form.inv_date,
        cust: parseNumber(selectedCustomer.id),
        cust_name: selectedCustomer.cust_name ?? "",
        cust_code:
          selectedCustomer.cust_code ?? String(selectedCustomer.id ?? ""),
        inv_amt: formatDecimalString(totals.totalAmount, frac2),
        inv_net: formatDecimalString(totals.netAmount, frac2),
        tax: formatDecimalString(totals.taxAmount, frac),
        tax_prc: formatDecimalString(defaultTaxPrc ?? 15, frac),
        inv_status: 1,
        trans_type: defaultTransType,
        cr_date: form.inv_date,
        inv_type:
          PAYMENT_METHOD_INV_TYPES[
            (paymentMethod ?? "cash") as keyof typeof PAYMENT_METHOD_INV_TYPES
          ] ?? 1,
        emp_id: EMPLOYEE_CODE_MAP[employee] ?? null,
        inv_notes:
          form.inv_notes && form.inv_notes.trim().length > 0
            ? form.inv_notes
            : null,
        handling: handlingMethod || null,
        mobile: mobileMethod || null,
        ref_no: form.ref_no || null,
        print: form.print ?? false,
        commit: true,
        is_done: false,
        is_ok: false,
        suspend: false,
        post: false,
        tx: false,
        dist: false,
        gauge_diff: false,
        pay_chick: false,
        vat_no: form.vat_no ?? "",
        pay_type: form.pay_type,
        gold_price:
          goldPrice !== null && goldPrice !== undefined
            ? formatDecimalString(goldPrice, frac)
            : null,
        cr_no: form.cr_no || null,
        gov: form.gov || null,
        city: form.city || null,
        area: form.area || null,
        street: form.street || null,
        build_no: form.build_no || null,
        post_no: form.post_no || null,
        post_code: form.post_code || null,
        inv_QR: invoiceQr,
        com: resolvedCompanyId,
        year: resolvedYearId,
      };

      console.log("🧾 Saving invoice with payload:", invoicePayload);

      let savedInvoice: Invoice | null = null;

      if (isNewInvoice) {
        try {
          savedInvoice = await createInvoiceAction(
            invoicePayload as Partial<Invoice>,
          );
          console.log(
            "🧾 createInvoiceAction response:",
            savedInvoice ?? "⛔️ null response",
          );
        } catch (actionError) {
          console.error("🧾 createInvoiceAction threw:", actionError);
          throw actionError;
        }
      } else {
        if (!invoicePk) {
          throw new Error("invoice primary key is missing");
        }
        try {
          savedInvoice = await updateInvoiceAction(
            invoicePk,
            invoicePayload as Partial<Invoice>,
          );
          console.log(
            "🧾 updateInvoiceAction response:",
            savedInvoice ?? "⛔️ null response",
          );
        } catch (actionError) {
          console.error("🧾 updateInvoiceAction threw:", actionError);
          throw actionError;
        }
      }

      if (!savedInvoice) {
        throw new Error(
          isNewInvoice ? "create-invoice-failed" : "update-invoice-failed",
        );
      }

      let resolvedInvoicePk = savedInvoice.id
        ? parseNumber(savedInvoice.id)
        : invoicePk;

      if (!resolvedInvoicePk || resolvedInvoicePk <= 0) {
        const fetchedInvoice = await getInvoiceByIdAction(
          String(invoiceNumber),
        );
        resolvedInvoicePk = fetchedInvoice?.id
          ? parseNumber(fetchedInvoice.id)
          : null;
      }

      if (!resolvedInvoicePk || resolvedInvoicePk <= 0) {
        throw new Error("invoice primary key could not be resolved");
      }

      setInvoicePk(resolvedInvoicePk);
      dispatchForm({
        type: "SET_FIELD",
        field: "inv_id",
        value: invoiceNumber,
      });

      const currentValidIds = new Set(
        validItems
          .map((item) => Number(item.id))
          .filter((id) => Number.isFinite(id) && id > 0),
      );

      const derivedDeletedIds = originalInvoiceItems
        .filter((item) => !currentValidIds.has(item.id))
        .map((item) => item.id);

      const deletions = Array.from(
        new Set([
          ...deletedItemIds,
          ...derivedDeletedIds.filter((id) => Number.isFinite(id) && id > 0),
        ]),
      );

      for (const detailId of deletions) {
        if (!detailId || detailId <= 0) continue;
        try {
          await deleteInvoiceDetailAction(detailId);
        } catch (deleteError) {
          console.error(`فشل حذف السطر ${detailId}:`, deleteError);
        }
      }

      for (const row of validItems) {
        const detailPayload = mapRowToApiPayload(
          row,
          resolvedInvoicePk,
          resolvedCompanyId,
          resolvedYearId,
        );
        if (!detailPayload) continue;

        const isExistingRow = originalInvoiceItems.some(
          (item) => item.id === row.id && item.id > 0,
        );

        if (isExistingRow) {
          try {
            await updateInvoiceDetailAction(Number(row.id), detailPayload);
          } catch (updateError) {
            console.error(
              `خطأ أثناء تحديث تفاصيل السطر ${row.id}:`,
              updateError,
            );
          }
        } else {
          try {
            const { id, ...creationPayload } = detailPayload;
            await createInvoiceDetailAction(creationPayload);
          } catch (createError) {
            console.error("خطأ أثناء إنشاء تفاصيل السطر:", createError);
          }
        }
      }

      const refreshedDetails = await getInvoiceDetailsAction(
        String(resolvedInvoicePk),
      );
      const mappedDetails = refreshedDetails.map((detail) =>
        mapDetailToRow(detail, defaultTransType),
      );

      setInvoiceItems(
        mappedDetails.length > 0 ? mappedDetails : [makeEmptyRow()],
      );
      setOriginalInvoiceItems(mappedDetails);
      setDeletedItemIds([]);
      setIsEditing(false);

      toast.success(
        isNewInvoice ? "تم حفظ الفاتورة بنجاح" : "تم تحديث الفاتورة بنجاح",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء حفظ الفاتورة";

      console.error("خطأ في حفظ الفاتورة:", errorMessage, error);
      if (error instanceof Error) {
        console.error("تفاصيل الخطأ:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    contactLabel,
    computeTotals,
    defaultTransType,
    deletedItemIds,
    employee,
    form.commit,
    form.cr_no,
    form.gov,
    form.inv_date,
    form.inv_id,
    form.inv_notes,
    form.pay_type,
    form.post_code,
    form.post_no,
    form.print,
    form.ref_no,
    form.street,
    form.vat_no,
    form.area,
    form.city,
    form.build_no,
    frac,
    frac2,
    defaultTaxPrc,
    getNextInvoiceNumber,
    goldPrice,
    handlingMethod,
    invoiceItems,
    invoicePk,
    isNewInvoice,
    mapRowToApiPayload,
    mobileMethod,
    originalInvoiceItems,
    paymentMethod,
    invoiceData,
    selectedBranchId,
    selectedYearId,
    selectedCustomer,
  ]);

  const previewInvoice = useCallback(() => {
    if (!selectedCustomer) {
      toast.error(`يرجى اختيار ${contactLabel}`);
      return;
    }

    const validItems = invoiceItems.filter(
      (item) => getItemIdFromRow(item) !== null,
    );

    if (validItems.length === 0) {
      toast.error("يرجى إدخال تفاصيل الفاتورة");
      return;
    }

    toast.success("معاينة الفاتورة");
  }, [contactLabel, invoiceItems, selectedCustomer]);

  // manual totals state
  const [autoTotalValue, setAutoTotalValue] = useState<number>(0);
  const [autoTotalWages, setAutoTotalWages] = useState<number>(0);
  const [manualTotalValue, setManualTotalValue] = useState<number>(0);
  const [manualTotalWages, setManualTotalWages] = useState<number>(0);
  const [useManualTotals, setUseManualTotals] = useState<boolean>(false);

  const handleManualTotalChange = useCallback(
    (type: "value" | "wages", value: number) => {
      if (type === "value") setManualTotalValue(value);
      else setManualTotalWages(value);
    },
    [],
  );

  const resetManualTotals = useCallback(() => {
    setManualTotalValue(0);
    setManualTotalWages(0);
    setUseManualTotals(false);
  }, []);

  const handleInvoiceSearch = useCallback(() => {
    toast.success("البحث برقم الفاتورة");
  }, []);

  const navigateToInvoice = useCallback(
    (direction: "prev" | "next" | "first" | "last") => {
      const directionText = {
        prev: "السابق",
        next: "التالي",
        first: "الأول",
        last: "الأخير",
      };
      toast.success(`التنقل إلى ${directionText[direction]}`);
    },
    [],
  );

  const handleItemRemoved = useCallback(
    (removedItem: InvoiceDetail) => {
      const removedId = parseNumber(removedItem?.id);
      const existsOriginally = originalInvoiceItems.some(
        (item) => item.id === removedId,
      );

      if (!existsOriginally || !removedId || removedId <= 0) return;

      setDeletedItemIds((prev) =>
        prev.includes(removedId) ? prev : [...prev, removedId],
      );
    },
    [originalInvoiceItems],
  );

  return {
    // lists
    items,
    categories,
    customers,
    setItems,
    setCategories,
    setCustomers,

    // UI state
    employee,
    setEmployee,
    isEditing,
    setIsEditing,
    isLoading,

    // form & invoice items
    form,
    dispatchForm,
    invoiceItems,
    setInvoiceItems,
    makeEmptyRow,

    // prices & settings
    goldPrice,
    homePurity,
    paymentMethod,
    setPaymentMethod,
    handlingMethod,
    setHandlingMethod,
    mobileMethod,
    setMobileMethod,

    // search
    searchNumber,
    setSearchNumber,
    searchValue,
    setSearchValue,

    // records
    currentRecord,
    setCurrentRecord,
    totalRecords,
    setTotalRecords,

    // helpers & actions
    frac,
    computeTotals,
    handleBarcodeSearch,
    saveInvoice,
    previewInvoice,
    handleInvoiceSearch,
    handleItemRemoved,
    navigateToInvoice,

    // manual totals
    autoTotalValue,
    setAutoTotalValue,
    autoTotalWages,
    setAutoTotalWages,
    manualTotalValue,
    manualTotalWages,
    useManualTotals,
    setUseManualTotals,
    handleManualTotalChange,
    resetManualTotals,
  } as const;
}
