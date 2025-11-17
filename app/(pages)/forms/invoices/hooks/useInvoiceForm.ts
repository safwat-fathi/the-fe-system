import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type SetStateAction,
} from "react";
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
import {
  mapRowToApiPayload as mapRowToApiPayloadUtil,
  mapDetailToRow as mapDetailToRowUtil,
  getItemIdFromRow as getItemIdFromRowUtil,
  getNumericRowId as getNumericRowIdUtil,
  normalizeRowIdentifier as normalizeRowIdentifierUtil,
  parseNumber as parseNumberUtil,
  ensurePositiveNumber as ensurePositiveNumberUtil,
  formatDecimalString as formatDecimalStringUtil,
  formatNumber as formatNumberUtil,
} from "@/utilities/invoiceForm";
import { buildInvoicePrintHtml } from "@/utilities/table/print";

type NumericValue = number | string;

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

export type FormState = {
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
  is_done: boolean;
  is_ok: boolean;
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

const PAY_TYPE_VALUES = Object.values(INVOICE_PAY_TYPES) as InvoicePayType[];

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

const parseNumber = parseNumberUtil;
const ensurePositiveNumber = ensurePositiveNumberUtil;
const formatDecimalString = formatDecimalStringUtil;
const formatNumber = formatNumberUtil;

const mapDetailToRow = mapDetailToRowUtil;

const getItemIdFromRow = getItemIdFromRowUtil;

const getNumericRowId = getNumericRowIdUtil;

const normalizeRowIdentifier = normalizeRowIdentifierUtil;


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
  initialBoxes,
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
  initialBoxes: any[];
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
  const filterCustomers = useMemo(
    () => invoiceConfig.customerFilter ?? ((customer: any) => true),
    [invoiceConfig],
  );
  const resolvedInvoiceCustomerCode =
    invoiceData?.cust_code !== undefined && invoiceData?.cust_code !== null
      ? String(invoiceData.cust_code)
      : invoiceData?.cust !== undefined && invoiceData?.cust !== null
        ? String(invoiceData.cust)
        : null;

  // lists - using initial data directly
  const [items, setItems] = useState<any[]>(initialItems || []);
  const [categories, setCategories] = useState<any[]>(initialCategories || []);
  const [cashCustomers, setCashCustomers] = useState<any[]>(
    (initialBoxes ?? []).filter((customer: any) => filterCustomers(customer)),
  );
  const [creditCustomers, setCreditCustomers] = useState<any[]>(
    (initialCustomers ?? []).filter((customer: any) =>
      filterCustomers(customer),
    ),
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

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);

  const buildInitialFormState = useCallback((): FormState => {
    return {
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
      is_ok: invoiceData?.is_ok ?? false,
      is_done: invoiceData?.is_done ?? false,
    };
  }, [invoiceData, resolvedInvoiceCustomerCode]);

  const customers = useMemo(
    () => (paymentMethod === "cash" ? cashCustomers : creditCustomers),
    [cashCustomers, creditCustomers, paymentMethod],
  );

  const setCustomers = useCallback(
    (updater: SetStateAction<any[]>) => {
      if (paymentMethod === "cash") {
        setCashCustomers((prev) =>
          typeof updater === "function"
            ? (updater as (value: any[]) => any[])(prev)
            : updater,
        );
      } else {
        setCreditCustomers((prev) =>
          typeof updater === "function"
            ? (updater as (value: any[]) => any[])(prev)
            : updater,
        );
      }
    },
    [paymentMethod, setCashCustomers, setCreditCustomers],
  );

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
    setCashCustomers(
      (initialBoxes ?? []).filter((customer: any) => filterCustomers(customer)),
    );
  }, [filterCustomers, initialBoxes]);

  useEffect(() => {
    setCreditCustomers(
      (initialCustomers ?? []).filter((customer: any) =>
        filterCustomers(customer),
      ),
    );
  }, [filterCustomers, initialCustomers]);

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
      (invoiceData?.com !== undefined ? parseNumber(invoiceData.com) : null);

    const resolvedYear =
      readNumericValue("selectedYear") ??
      (invoiceData?.year !== undefined ? parseNumber(invoiceData.year) : null);

    setSelectedBranchId(resolvedBranch);
    setSelectedYearId(resolvedYear);
  }, [invoiceData]);

  // form reducer
  const [form, dispatchForm] = useReducer(
    formReducer,
    undefined,
    buildInitialFormState,
  );

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

  const originalInvoiceItemMap = useMemo(() => {
    const map = new Map<string, InvoiceItemRow>();

    for (const item of originalInvoiceItems) {
      const key = normalizeRowIdentifier(item.id);

      if (key) {
        map.set(key, item);
      }
    }

    return map;
  }, [originalInvoiceItems]);

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

    const findCustomerInList = (list: any[]) => {
      const matchByCode =
        list.find((customer: any) => {
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
        list.find(
          (customer: any) => String(customer.id ?? "") === normalizedCode,
        ) ?? null;

      if (matchById) {
        return matchById;
      }

      return null;
    };

    const activeMatch = findCustomerInList(customers);

    if (activeMatch) {
      return activeMatch;
    }

    const secondaryList =
      paymentMethod === "cash" ? creditCustomers : cashCustomers;
    const secondaryMatch = findCustomerInList(secondaryList);

    if (secondaryMatch) {
      return secondaryMatch;
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
  }, [
    cashCustomers,
    creditCustomers,
    customers,
    form.cust_code,
    form.cust_name,
    invoiceData,
    paymentMethod,
  ]);

  const mapRowToApiPayload = useCallback(
    (
      row: InvoiceItemRow,
      invoicePrimaryKey: number,
      companyId: number,
      yearId: number,
    ) =>
      mapRowToApiPayloadUtil(row, invoicePrimaryKey, companyId, yearId, {
        defaultTaxPrc: defaultTaxPrc ?? 15,
        defaultTransType,
        payType: form.pay_type,
      }),
    [defaultTaxPrc, defaultTransType, form.pay_type],
  );

  // sync incoming invoiceData/details
  useEffect(() => {
    if (!invoiceData) return;

    setInvoicePk(invoiceData.id ? Number(invoiceData.id) : null);
    dispatchForm({
      type: "RESET",
      payload: buildInitialFormState(),
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
  }, [
    buildInitialFormState,
    defaultTransType,
    invoiceData,
    invoiceDetailsData,
  ]);

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

  const saveInvoice = useCallback(async (): Promise<
    { ok: true; recordId: number; invoiceNumber: number } | { ok: false }
  > => {
    if (!selectedCustomer) {
      toast.error(`يرجى اختيار ${contactLabel}`);

      return;
    }

    const validItems = invoiceItems.filter((item) => {
      const hasId = getItemIdFromRow(item) !== null;
      const hasWeight =
        parseNumber(item.weight) > 0 || parseNumber(item.g_weight) > 0;
      const hasText =
        (item.item_code && String(item.item_code).trim().length > 0) ||
        (item.item_desc && String(item.item_desc).trim().length > 0) ||
        (item.item_name && String(item.item_name).trim().length > 0);

      return hasId || hasWeight || hasText;
    });

    if (validItems.length === 0) {
      toast.error("يرجى إدخال تفاصيل الفاتورة");

      return;
    }

    if (
      form.pay_type === INVOICE_PAY_TYPES.WAGES ||
      form.pay_type === INVOICE_PAY_TYPES.VALUE_AND_WAGES
    ) {
      const missingWageRate = validItems.some(
        (item) => parseNumber(item.price_w) <= 0,
      );

      if (missingWageRate) {
        toast.error("يرجى إدخال أجرة الجرام لكل الأصناف قبل الحفظ");

        return;
      }
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

      let savedInvoice: Invoice | null = null;

      if (isNewInvoice) {
        try {
          savedInvoice = await createInvoiceAction(
            invoicePayload as Partial<Invoice>,
          );
        } catch (actionError) {
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
        } catch (actionError) {
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

      const currentValidKeys = new Set<string>();

      validItems.forEach((item) => {
        const key = normalizeRowIdentifier(item.id);

        if (key) currentValidKeys.add(key);
      });

      const derivedDeletedIds = originalInvoiceItems
        .map((item) => {
          const key = normalizeRowIdentifier(item.id);
          const numericId = getNumericRowId(item.id);

          return { key, numericId };
        })
        .filter(
          ({ key, numericId }) =>
            key !== null &&
            !currentValidKeys.has(key) &&
            numericId !== null &&
            Number.isFinite(numericId) &&
            numericId > 0,
        )
        .map(({ numericId }) => numericId as number);

      const baseDeletions = Array.from(
        new Set([
          ...deletedItemIds,
          ...derivedDeletedIds.filter((id) => Number.isFinite(id) && id > 0),
        ]),
      );
      // Build set/map of original DB detail ids and rows
      const originalDetailIdSet = new Set(
        originalInvoiceItems
          .map((orig) => getNumericRowId(orig.id))
          .filter((v): v is number => v !== null),
      );
      const originalById = new Map<number, InvoiceItemRow>();

      for (const orig of originalInvoiceItems) {
        const idn = getNumericRowId(orig.id);

        if (idn !== null) originalById.set(idn, orig);
      }
      const replacementDeletions: number[] = [];

      for (const row of validItems) {
        const detailPayload = mapRowToApiPayload(
          row,
          resolvedInvoicePk,
          resolvedCompanyId,
          resolvedYearId,
        );

        if (!detailPayload) continue;

        const numericRowId = getNumericRowId(row.id);
        const isExistingRow =
          numericRowId !== null && originalDetailIdSet.has(numericRowId);
        const currentItemId = getItemIdFromRow(row);
        const originalRow =
          numericRowId !== null ? originalById.get(numericRowId) : undefined;
        const originalItemId = originalRow
          ? getItemIdFromRow(originalRow)
          : null;
        const itemChanged =
          isExistingRow &&
          originalItemId !== null &&
          currentItemId !== null &&
          originalItemId !== currentItemId;

        try {
          if (!isExistingRow) {
            // Create new detail row
            const createPayload = { ...(detailPayload as any) } as any;

            delete createPayload.id; // ensure no client id leaks into POST
            await createInvoiceDetailAction(createPayload, resolvedInvoicePk);
          } else if (itemChanged && numericRowId !== null) {
            // Replace: create new detail, then delete original row id
            const createPayload = { ...(detailPayload as any) } as any;

            delete createPayload.id;
            await createInvoiceDetailAction(createPayload, resolvedInvoicePk);
            replacementDeletions.push(numericRowId);
          } else if (numericRowId !== null) {
            // Update existing detail row (use path id, not body id)
            const updatePayload = { ...(detailPayload as any) } as any;

            delete updatePayload.id;
            await updateInvoiceDetailAction(
              numericRowId,
              updatePayload,
              resolvedInvoicePk,
            );
          }
        } catch (detailError) {
          console.error(`خطأ أثناء حفظ تفاصيل السطر ${row.id}:`, detailError);
        }
      }

      // Perform deletions after creates/updates (user + derived + replacements)
      const finalDeletions = Array.from(
        new Set<number>([...baseDeletions, ...replacementDeletions]),
      );

      for (const detailId of finalDeletions) {
        if (!detailId || detailId <= 0) continue;
        try {
          await deleteInvoiceDetailAction(detailId, resolvedInvoicePk);
        } catch (deleteError) {
          console.error(`فشل حذف السطر ${detailId}:`, deleteError);
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
      return {
        ok: true,
        recordId: resolvedInvoicePk,
        invoiceNumber: Number(invoiceNumber),
      };
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

      return { ok: false };
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
    originalInvoiceItemMap,
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

    try {
      // Mark the invoice as printed immediately
      dispatchForm({ type: "SET_FIELD", field: "print", value: true });

      // Calculate totals for printing
      const totals = computeTotals(form.pay_type, invoiceItems);

      // Build the HTML for the printable invoice
      const html = buildInvoicePrintHtml({
        invoice: form,
        invoiceItems: validItems,
        totals,
        invoiceType: context,
        selectedCustomer,
        fractions: { frac, frac2 },
      });

      // Open a new window and print the invoice
      const w = window.open(
        "",
        "_blank",
        "width=1024,height=768,scrollbars=yes,resizable=yes",
      );
      if (!w) {
        toast.error(
          "لم يتمكن من فتح نافذة الطباعة. يرجى التحقق من إعدادات المتصفح.",
        );
        return;
      }

      w.document.write(html);
      w.document.close();

      w.onload = () => {
        try {
          w.focus();
          setTimeout(() => {
            w.print();
            w.close();
          }, 500);
        } catch (err) {
          console.error("print error", err);
          toast.error("حدث خطأ أثناء الطباعة");
        }
      };
    } catch (err) {
      console.error("preview print error", err);
      toast.error("حدث خطأ أثناء إنشاء نموذج الطباعة");
    }
  }, [
    computeTotals,
    context,
    form.inv_date,
    form.inv_id,
    form.inv_notes,
    form.pay_type,
    form.vat_no,
    form.cr_no,
    form.gov,
    form.city,
    form.area,
    form.street,
    form.build_no,
    form.post_no,
    form.post_code,
    form.cust_name,
    form.cust_code,
    goldPrice,
    invoiceItems,
    paymentMethod,
    selectedCustomer,
    contactLabel,
    dispatchForm,
  ]);

  // manual totals state
  const [autoTotalValue, setAutoTotalValue] = useState<number>(0);
  const [autoTotalWages, setAutoTotalWages] = useState<number>(0);
  const [manualTotalValue, setManualTotalValue] = useState<number>(0);
  const [manualTotalWages, setManualTotalWages] = useState<number>(0);
  const [useManualTotals, setUseManualTotals] = useState<boolean>(false);

  const resetInvoiceState = useCallback(() => {
    const initialState = buildInitialFormState();

    dispatchForm({ type: "RESET", payload: initialState });
    setInvoiceItems([makeEmptyRow()]);
    setOriginalInvoiceItems([]);
    setDeletedItemIds([]);
    setInvoicePk(null);
    setEmployee("");
    setPaymentMethod("cash");
    setHandlingMethod("");
    setMobileMethod("");
    setSearchNumber("");
    setSearchValue("");
    setAutoTotalValue(0);
    setAutoTotalWages(0);
    setManualTotalValue(0);
    setManualTotalWages(0);
    setUseManualTotals(false);
    setIsEditing(isNewInvoice);
    setIsLoading(false);
    setDefaultTaxPrc(15);
  }, [buildInitialFormState, dispatchForm, isNewInvoice, makeEmptyRow]);

  const resetSignature = useMemo(
    () =>
      `${context}-${isNewInvoice ? "new" : "existing"}-${
        invoiceRecordId ?? "none"
      }-${invoiceData?.id ?? "none"}-${invoiceData?.inv_id ?? "none"}-${
        invoiceDetailsData.length
      }`,
    [
      context,
      invoiceData?.id,
      invoiceData?.inv_id,
      invoiceDetailsData.length,
      invoiceRecordId,
      isNewInvoice,
    ],
  );

  const previousResetSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      isNewInvoice &&
      !invoiceData &&
      previousResetSignatureRef.current !== null &&
      previousResetSignatureRef.current !== resetSignature
    ) {
      resetInvoiceState();
    }

    if (previousResetSignatureRef.current !== resetSignature) {
      previousResetSignatureRef.current = resetSignature;
    }
  }, [invoiceData, isNewInvoice, resetInvoiceState, resetSignature]);

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
