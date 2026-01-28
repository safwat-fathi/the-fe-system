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
import { useLocale, useTranslations } from "next-intl";

import useFractions, { type Fractions } from "@/utilities/useFractions";
import {
  Invoice,
  InvoiceDetail,
  InvoicePayType,
  INVOICE_PAY_TYPES,
  TransTypes,
  PaymentTypes,
} from "@/types/models/invoice";
import {
  createInvoiceAction,
  updateInvoiceAction,
  createInvoiceDetailAction,
  updateInvoiceDetailAction,
  deleteInvoiceDetailAction,
  getInvoiceByIdAction,
  getInvoiceDetailsAction,
  createInvoiceBoxAction,
  getInvoiceBoxListAction,
  updateInvoiceBoxAction,
  createInvoiceGoldBoxAction,
  getInvoiceGoldBoxListAction,
  updateInvoiceGoldBoxAction,
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
import {
  buildInvoicePrintHtml,
  type PrintTranslations,
} from "@/utilities/table/print";
import { Nullable } from "@/types";

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
  seller_name?: string;
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

const getPaymentMethodKey = (
  method?: PaymentTypes | null,
): keyof typeof PAYMENT_METHOD_INV_TYPES =>
  method === PaymentTypes.CREDIT ? "credit" : "cash";

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

type UseInvoiceFormParams = {
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
  maxInvoiceId?: number | null;
};

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

const getResolvedInvoiceCustomerCode = (invoiceData: Invoice | null) => {
  if (invoiceData?.cust_code !== undefined && invoiceData?.cust_code !== null) {
    return String(invoiceData.cust_code);
  }

  if (invoiceData?.cust !== undefined && invoiceData?.cust !== null) {
    return String(invoiceData.cust);
  }

  return null;
};

const getInitialInvoicePkValue = (
  invoiceData: Invoice | null,
  invoiceRecordId?: Nullable<number | string>,
): number | null => {
  if (invoiceData?.id) {
    return Number(invoiceData.id);
  }

  if (invoiceRecordId !== null && invoiceRecordId !== undefined) {
    const parsed = Number(invoiceRecordId);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const normalizeCustomerCode = (
  rawCode: FormState["cust_code"],
  fallbackCode: string | null,
): string => {
  if (rawCode !== null && rawCode !== undefined) {
    return String(rawCode);
  }

  return fallbackCode ?? "";
};

const getRowBaseAmount = (
  payType: InvoicePayType,
  totalValue: number,
  totalWages: number,
): number => {
  if (payType === INVOICE_PAY_TYPES.VALUE) {
    return totalValue;
  }

  if (payType === INVOICE_PAY_TYPES.WAGES) {
    return totalWages;
  }

  return totalValue + totalWages;
};

const findFirstEditableRowIndex = (rows: InvoiceItemRow[]): number =>
  rows.findIndex(
    (row) => (!row.item_id && !row.item_name) || parseNumber(row.weight) === 0,
  );

const rowHasContent = (row: InvoiceItemRow): boolean =>
  Boolean(row.item_id || row.item_name || parseNumber(row.weight) > 0);

const prepareRowsForInsertion = (
  rows: InvoiceItemRow[],
  createEmptyRow: (description?: string) => InvoiceItemRow,
  description?: string,
): { rows: InvoiceItemRow[]; targetIndex: number } => {
  const firstEmptyIndex = findFirstEditableRowIndex(rows);
  const cloned = [...rows];

  if (firstEmptyIndex === -1) {
    cloned.unshift(createEmptyRow(description));

    return { rows: cloned, targetIndex: 0 };
  }

  return { rows: cloned, targetIndex: firstEmptyIndex };
};

const findItemBySearchTerm = (collection: any[], searchTerm: string) => {
  const normalized = searchTerm.trim();

  if (!normalized) return null;

  return (
    collection.find((item: any) => {
      const itemBarcode = (item.item_barcode ?? "").toString().trim();
      const itemCode = (item.item_code ?? "").toString().trim();

      return itemBarcode === normalized || itemCode === normalized;
    }) ?? null
  );
};

const ensureItemTracked = (
  itemsList: any[],
  selectedItem: any,
  setItems: (value: SetStateAction<any[]>) => void,
) => {
  if (itemsList.some((item) => item.id === selectedItem.id)) {
    return;
  }

  setItems((prev) => [...prev, selectedItem]);
};

type BuildRowFromItemParams = {
  baseRow: InvoiceItemRow;
  selectedItem: any;
  goldPrice: number | null;
  homePurity: number;
  payType: InvoicePayType;
};

const buildRowFromItem = ({
  baseRow,
  selectedItem,
  goldPrice,
  homePurity,
  payType,
}: BuildRowFromItemParams): InvoiceItemRow => {
  const priceFromSelected = Number(selectedItem.item_price ?? 0);
  const workPriceFromSelected = Number(selectedItem.work_price ?? 0);
  const nextRow: InvoiceItemRow = {
    ...baseRow,
    item_id: selectedItem.id ?? null,
    item: selectedItem.id ?? null,
    item_code: selectedItem.item_code ?? "",
    item_name: selectedItem.item_name ?? "",
    item_desc: baseRow.item_desc ?? "",
    k: selectedItem.k ?? "",
    price: goldPrice ?? priceFromSelected,
    price_w: workPriceFromSelected,
    purity:
      selectedItem.purity ?? (homePurity ? String(homePurity) : baseRow.purity),
    stones: selectedItem.stones ?? baseRow.stones,
    box: selectedItem.box_id ?? baseRow.box ?? null,
  };

  const hasItemWeight =
    selectedItem.item_weight !== undefined &&
    selectedItem.item_weight !== null &&
    selectedItem.item_weight !== "";

  if (hasItemWeight) {
    nextRow.weight = Number(selectedItem.item_weight ?? 0);
    nextRow.g_weight =
      Number(selectedItem.item_g_weight ?? selectedItem.item_weight ?? 0) || 0;
  }

  const hasItemGWeight =
    selectedItem.item_g_weight !== undefined &&
    selectedItem.item_g_weight !== null &&
    selectedItem.item_g_weight !== "";

  if (hasItemGWeight) {
    nextRow.g_weight = Number(selectedItem.item_g_weight);
  }

  const numericWeight = parseNumber(nextRow.weight);
  const numericGWeight = parseNumber(nextRow.g_weight);
  const wCalc =
    numericWeight < 1 && numericGWeight > numericWeight
      ? numericWeight * 1000
      : numericWeight;

  const wagePrice = Number(nextRow.price_w ?? 0);
  const valuePrice = Number(nextRow.price ?? 0);

  if (payType === INVOICE_PAY_TYPES.WAGES) {
    nextRow.total_a = wCalc * wagePrice;
  } else {
    nextRow.total_a = wCalc * valuePrice;
  }
  nextRow.total_w = wCalc * wagePrice;

  const totalValue = parseNumber(nextRow.total_a);
  const totalWages = parseNumber(nextRow.total_w);
  const discount = parseNumber(nextRow.item_disc_amt ?? 0);
  const base = getRowBaseAmount(payType, totalValue, totalWages) - discount;
  const taxRate = parseNumber(nextRow.tax_prc);

  nextRow.tax = (base * taxRate) / 100;
  nextRow.total = base + nextRow.tax;

  return nextRow;
};

const shouldAppendBlankRow = (rows: InvoiceItemRow[], index: number): boolean =>
  index === rows.length - 1 && rowHasContent(rows[index]);

const collectValidRowKeys = (rows: InvoiceItemRow[]) => {
  const keys = new Set<string>();

  rows.forEach((item) => {
    const key = normalizeRowIdentifier(item.id);

    if (key) keys.add(key);
  });

  return keys;
};

const deriveDeletedIds = (
  originalRows: InvoiceItemRow[],
  validKeys: Set<string>,
) =>
  originalRows
    .map((item) => {
      const key = normalizeRowIdentifier(item.id);
      const numericId = getNumericRowId(item.id);

      return { key, numericId };
    })
    .filter(
      ({ key, numericId }) =>
        key !== null &&
        !validKeys.has(key) &&
        numericId !== null &&
        Number.isFinite(numericId) &&
        numericId > 0,
    )
    .map(({ numericId }) => numericId as number);

const buildOriginalDetailLookup = (originalRows: InvoiceItemRow[]) => {
  const originalDetailIdSet = new Set(
    originalRows
      .map((orig) => getNumericRowId(orig.id))
      .filter((v): v is number => v !== null),
  );
  const originalById = new Map<number, InvoiceItemRow>();

  for (const orig of originalRows) {
    const idn = getNumericRowId(orig.id);

    if (idn !== null) originalById.set(idn, orig);
  }

  return { originalDetailIdSet, originalById };
};

type MapRowToPayloadFn = (
  row: InvoiceItemRow,
  invoicePrimaryKey: number,
  companyId: number,
  yearId: number,
) => Record<string, unknown> | null;

type DetailMutationParams = {
  row: InvoiceItemRow;
  resolvedInvoicePk: number;
  resolvedCompanyId: number;
  resolvedYearId: number;
  originalDetailIdSet: Set<number>;
  originalById: Map<number, InvoiceItemRow>;
};

const mutateDetailRow = async (
  params: DetailMutationParams,
  mapRowToApiPayloadFn: MapRowToPayloadFn,
) => {
  const {
    row,
    resolvedInvoicePk,
    resolvedCompanyId,
    resolvedYearId,
    originalDetailIdSet,
    originalById,
  } = params;
  const detailPayload = mapRowToApiPayloadFn(
    row,
    resolvedInvoicePk,
    resolvedCompanyId,
    resolvedYearId,
  );

  if (!detailPayload) return { replacedId: null };

  const numericRowId = getNumericRowId(row.id);
  const isExistingRow =
    numericRowId !== null && originalDetailIdSet.has(numericRowId);
  const currentItemId = getItemIdFromRow(row);
  const originalRow =
    numericRowId !== null ? originalById.get(numericRowId) : undefined;
  const originalItemId = originalRow ? getItemIdFromRow(originalRow) : null;
  const itemChanged =
    isExistingRow &&
    originalItemId !== null &&
    currentItemId !== null &&
    originalItemId !== currentItemId;

  if (!isExistingRow) {
    const createPayload = { ...(detailPayload as any) } as any;

    delete createPayload.id;
    await createInvoiceDetailAction(createPayload, resolvedInvoicePk);

    return { replacedId: null };
  }

  if (itemChanged && numericRowId !== null) {
    const createPayload = { ...(detailPayload as any) } as any;

    delete createPayload.id;
    await createInvoiceDetailAction(createPayload, resolvedInvoicePk);

    return { replacedId: numericRowId };
  }

  if (numericRowId !== null) {
    const updatePayload = { ...(detailPayload as any) } as any;

    delete updatePayload.id;
    await updateInvoiceDetailAction(
      numericRowId,
      updatePayload,
      resolvedInvoicePk,
    );
  }

  return { replacedId: null };
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
  initialBoxes,
  initialCustomers,
  initialItems,
  initialCategories,
  initialGoldPrice,
  initialHomePurity,
  invoiceRecordId = null,
  context = "sale",
  maxInvoiceId = null,
}: UseInvoiceFormParams) {
  const locale = useLocale();
  const tPrint = useTranslations("forms.invoices.print");
  const invoiceConfig = INVOICE_FORM_CONFIG[context];
  const defaultTransType = invoiceConfig.transType;
  const contactLabel = invoiceConfig.contactLabel;
  const filterCustomers = useMemo(
    () => invoiceConfig.customerFilter ?? (() => true),
    [invoiceConfig],
  );
  const resolvedInvoiceCustomerCode =
    getResolvedInvoiceCustomerCode(invoiceData);

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

  const [goldPrice] = useState<number | null>(initialGoldPrice);
  const [homePurity] = useState<number>(initialHomePurity);
  const [paymentMethod, setPaymentMethod] = useState<PaymentTypes>(
    PaymentTypes.CASH,
  );
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
      seller_name: "",
    };
  }, [invoiceData, resolvedInvoiceCustomerCode]);

  const customers = useMemo(
    () =>
      paymentMethod === PaymentTypes.CASH ? cashCustomers : creditCustomers,
    [cashCustomers, creditCustomers, paymentMethod],
  );

  const setCustomers = useCallback(
    (updater: SetStateAction<any[]>) => {
      if (paymentMethod === PaymentTypes.CASH) {
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
  const [invoicePk, setInvoicePk] = useState<number | null>(() =>
    getInitialInvoicePkValue(invoiceData, invoiceRecordId),
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
    (description?: string): InvoiceItemRow => ({
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
      item_desc: description ?? "",
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
    const normalizedCode = normalizeCustomerCode(
      form.cust_code,
      resolvedInvoiceCustomerCode,
    );

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
      paymentMethod === PaymentTypes.CASH ? creditCustomers : cashCustomers;
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
    resolvedInvoiceCustomerCode,
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
          ? PaymentTypes.CREDIT
          : PaymentTypes.CASH,
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
        const qty = parseNumber(item.qty) || 1;
        const weight = parseNumber(item.weight);
        const price = parseNumber(item.price);
        const priceW = parseNumber(item.price_w);
        const discount = parseNumber(item.item_disc_amt);

        const totalA = qty * weight * price;
        const totalW = qty * weight * priceW;

        // If weight is 0, fallback to qty * price (for non-weight items)
        // This matches logic where if weight is present, it is treated as Unit Weight
        const finalTotalA = weight > 0 ? totalA : qty * price;
        const finalTotalW = weight > 0 ? totalW : qty * priceW;

        const rowTotal = getRowBaseAmount(payType, finalTotalA, finalTotalW);

        return sum + rowTotal - discount;
      }, 0);

      const taxAmount = rows.reduce((sum, item) => {
        const qty = parseNumber(item.qty) || 1;
        const weight = parseNumber(item.weight);
        const price = parseNumber(item.price);
        const priceW = parseNumber(item.price_w);
        const discount = parseNumber(item.item_disc_amt);
        const taxRate = parseNumber(item.tax_prc ?? defaultTaxPrc ?? 15) / 100;

        const totalA = qty * weight * price;
        const totalW = qty * weight * priceW;

        const finalTotalA = weight > 0 ? totalA : qty * price;
        const finalTotalW = weight > 0 ? totalW : qty * priceW;

        const rowTotal = getRowBaseAmount(payType, finalTotalA, finalTotalW);
        const base = rowTotal - discount;

        return sum + base * taxRate;
      }, 0);

      const totalDiscount = rows.reduce((sum, item) => {
        const discount = parseNumber(item.item_disc_amt);

        return sum + discount;
      }, 0);

      const totalGWeight = rows.reduce((sum, item) => {
        const qty = parseNumber(item.qty) || 1;
        const gWeight = parseNumber(item.g_weight);

        // multiply by qty to get total weight
        return sum + gWeight * qty;
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
        const selected = findItemBySearchTerm(items, searchTerm);

        if (!selected) {
          toast.error(`لم يتم العثور على صنف: ${searchTerm}`);
          setSearchValue("");

          return;
        }

        const { rows: updatedRows, targetIndex } = prepareRowsForInsertion(
          invoiceItems,
          makeEmptyRow,
          form.inv_notes,
        );

        ensureItemTracked(items, selected, setItems);

        const populatedRow = buildRowFromItem({
          baseRow: updatedRows[targetIndex],
          selectedItem: selected,
          goldPrice,
          homePurity,
          payType: form.pay_type,
        });

        updatedRows[targetIndex] = populatedRow;
        setInvoiceItems(updatedRows);
        setSearchValue("");

        toast.success(
          `✅ تم إضافة الصنف: ${selected.item_name || selected.item_code} (${selected.item_code})`,
        );

        if (shouldAppendBlankRow(updatedRows, targetIndex)) {
          setInvoiceItems((prev) => [...prev, makeEmptyRow(form.inv_notes)]);
        }
      } catch (error) {
        console.error("خطأ في البحث بالباركود:", error);
        toast.error("حدث خطأ أثناء البحث بالباركود");
      }
    },
    [
      form.pay_type,
      goldPrice,
      homePurity,
      invoiceItems,
      isEditing,
      items,
      makeEmptyRow,
      searchValue,
      setInvoiceItems,
      setItems,
      setSearchValue,
    ],
  );

  type ValidationResult =
    | { ok: true; validItems: InvoiceItemRow[]; customer: any }
    | { ok: false };

  const validateBeforeSave = useCallback((): ValidationResult => {
    if (!selectedCustomer) {
      toast.error(`يرجى اختيار ${contactLabel}`);

      return { ok: false };
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

      return { ok: false };
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

        return { ok: false };
      }
    }

    return { ok: true, validItems, customer: selectedCustomer };
  }, [contactLabel, form.pay_type, invoiceItems, selectedCustomer]);

  type InvoiceSaveContext = {
    totals: {
      totalAmount: number;
      taxAmount: number;
      totalDiscount: number;
      totalGWeight: number;
      netAmount: number;
    };
    invoiceNumber: Nullable<number | string>;
    invoicePayload: Record<string, unknown>;
    resolvedCompanyId: number;
    resolvedYearId: number;
  };

  const buildInvoiceSaveContext = useCallback(
    (validItems: InvoiceItemRow[], customer: any): InvoiceSaveContext => {
      const totals = computeTotals(form.pay_type, validItems);
      // For new invoices, use maxInvoiceId + 1 if available, otherwise let backend generate
      // If the user manually entered an ID, respect it
      const rawInvId = form.inv_id ? parseNumber(form.inv_id) : 0;
      let invoiceNumber: Nullable<number | string>;

      if (isNewInvoice && (rawInvId === 0 || rawInvId === null)) {
        // For new invoices without manual ID, use maxInvoiceId + 1 or null
        invoiceNumber =
          maxInvoiceId !== null && maxInvoiceId !== undefined
            ? maxInvoiceId + 1
            : 1;
      } else {
        // For existing invoices or manually entered IDs, use the raw value
        invoiceNumber = rawInvId;
      }

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
        cust: parseNumber(customer.id),
        cust_name: customer.cust_name ?? "",
        cust_code: customer.cust_code ?? String(customer.id ?? ""),
        inv_amt: formatDecimalString(totals.totalAmount, frac2),
        inv_net: formatDecimalString(totals.netAmount, frac2),
        tax: formatDecimalString(totals.taxAmount, frac),
        tax_prc: formatDecimalString(defaultTaxPrc ?? 15, frac),
        inv_status: 1,
        trans_type: defaultTransType,
        cr_date: form.inv_date,
        inv_type:
          PAYMENT_METHOD_INV_TYPES[getPaymentMethodKey(paymentMethod)] ?? 1,
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

      return {
        totals,
        invoiceNumber,
        invoicePayload,
        resolvedCompanyId,
        resolvedYearId,
      };
    },
    [
      computeTotals,
      defaultTaxPrc,
      defaultTransType,
      employee,
      form.area,
      form.build_no,
      form.city,
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
      frac,
      frac2,
      goldPrice,
      handlingMethod,
      invoiceData,
      isNewInvoice,
      maxInvoiceId,
      mobileMethod,
      paymentMethod,
      selectedBranchId,
      selectedYearId,
    ],
  );

  const runInvoiceMutation = useCallback(
    async (invoicePayload: Record<string, unknown>) => {
      const mutationPayload = invoicePayload as Partial<Invoice>;

      if (isNewInvoice) {
        const savedInvoice = await createInvoiceAction(mutationPayload);

        if (!savedInvoice) {
          throw new Error("create-invoice-failed");
        }

        return savedInvoice;
      }

      if (!invoicePk) {
        throw new Error("invoice primary key is missing");
      }

      const savedInvoice = await updateInvoiceAction(
        invoicePk,
        mutationPayload,
      );

      if (!savedInvoice) {
        throw new Error("update-invoice-failed");
      }

      return savedInvoice;
    },
    [invoicePk, isNewInvoice],
  );

  const resolveInvoicePrimaryKey = useCallback(
    async (
      savedInvoice: Invoice | null,
      invoiceNumber: number | string | null,
    ) => {
      let resolvedInvoicePk = savedInvoice?.id
        ? parseNumber(savedInvoice.id)
        : invoicePk;

      if (!resolvedInvoicePk || resolvedInvoicePk <= 0) {
        const fetchedInvoice = await getInvoiceByIdAction(
          String(invoiceNumber ?? ""),
        );

        resolvedInvoicePk = fetchedInvoice?.id
          ? parseNumber(fetchedInvoice.id)
          : null;
      }

      if (!resolvedInvoicePk || resolvedInvoicePk <= 0) {
        throw new Error("invoice primary key could not be resolved");
      }

      return resolvedInvoicePk;
    },
    [invoicePk],
  );

  const persistInvoiceRecord = useCallback(
    async (
      invoicePayload: Record<string, unknown>,
      invoiceNumber: number | string | null,
    ) => {
      const savedInvoice = await runInvoiceMutation(invoicePayload);
      const resolvedInvoicePk = await resolveInvoicePrimaryKey(
        savedInvoice,
        invoiceNumber,
      );

      // If we didn't have a number before (auto-gen), use the one from the saved invoice
      const finalInvoiceNumber =
        invoiceNumber ?? savedInvoice?.inv_id ?? savedInvoice?.id;

      setInvoicePk(resolvedInvoicePk);
      dispatchForm({
        type: "SET_FIELD",
        field: "inv_id",
        value: finalInvoiceNumber,
      });

      return resolvedInvoicePk;
    },
    [dispatchForm, resolveInvoicePrimaryKey, runInvoiceMutation, setInvoicePk],
  );

  const syncInvoiceDetails = useCallback(
    async (
      validItems: InvoiceItemRow[],
      resolvedInvoicePk: number,
      resolvedCompanyId: number,
      resolvedYearId: number,
    ) => {
      const currentValidKeys = collectValidRowKeys(validItems);
      const derivedDeletedIds = deriveDeletedIds(
        originalInvoiceItems,
        currentValidKeys,
      );
      const baseDeletions = Array.from(
        new Set([
          ...deletedItemIds,
          ...derivedDeletedIds.filter((id) => Number.isFinite(id) && id > 0),
        ]),
      );

      const { originalDetailIdSet, originalById } =
        buildOriginalDetailLookup(originalInvoiceItems);
      const replacementDeletions: number[] = [];

      for (const row of validItems) {
        const { replacedId } = await mutateDetailRow(
          {
            row,
            resolvedInvoicePk,
            resolvedCompanyId,
            resolvedYearId,
            originalDetailIdSet,
            originalById,
          },
          mapRowToApiPayload,
        );

        if (replacedId) {
          replacementDeletions.push(replacedId);
        }
      }

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
    },
    [deletedItemIds, mapRowToApiPayload, originalInvoiceItems],
  );

  const refreshInvoiceDetailsState = useCallback(
    async (resolvedInvoicePk: number) => {
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
    },
    [
      defaultTransType,
      makeEmptyRow,
      setDeletedItemIds,
      setInvoiceItems,
      setIsEditing,
      setOriginalInvoiceItems,
    ],
  );

  const saveInvoice = useCallback(
    async (options?: {
      skipDefaultBoxCreation?: boolean;
    }): Promise<
      | {
          ok: true;
          recordId: number;
          invoiceNumber: number;
          invoiceBoxCount: number;
          hasAmountChanged: boolean;
        }
      | { ok: false }
    > => {
      const validation = validateBeforeSave();

      if (!validation.ok) {
        return { ok: false };
      }

      setIsLoading(true);

      try {
        const context = buildInvoiceSaveContext(
          validation.validItems,
          validation.customer,
        );

        // Persist the invoice record to get/ensure primary key
        const savedRecordId = await persistInvoiceRecord(
          context.invoicePayload,
          context.invoiceNumber,
        );

        await syncInvoiceDetails(
          validation.validItems,
          savedRecordId,
          context.resolvedCompanyId,
          context.resolvedYearId,
        );

        await refreshInvoiceDetailsState(savedRecordId);

        // Reload the full invoice header to ensure we have the generated inv_id and other fields
        // This solves the issue of the UI not showing the new number.
        const freshInvoice = await getInvoiceByIdAction(String(savedRecordId));

        if (freshInvoice) {
          dispatchForm({
            type: "SET_ALL",
            payload: {
              inv_id: freshInvoice.inv_id,
              inv_date: freshInvoice.inv_date,
              is_done: freshInvoice.is_done ?? false,
              is_ok: freshInvoice.is_ok ?? false,
              commit: freshInvoice.commit ?? true,
            },
          });
        }

        const existingInvoiceBoxes = await getInvoiceBoxListAction(
          String(savedRecordId),
        );
        const invoiceBoxCount = existingInvoiceBoxes?.length ?? 0;

        const existingBoxesTotal =
          existingInvoiceBoxes?.reduce(
            (sum, box) => sum + (parseFloat(String(box.amt)) || 0),
            0,
          ) ?? 0;

        const hasAmountChanged =
          Math.abs(existingBoxesTotal - context.totals.netAmount) > 0.01;

        if (!options?.skipDefaultBoxCreation && invoiceBoxCount <= 1) {
          await handleInvoiceBox(
            savedRecordId,
            context.resolvedCompanyId,
            defaultTransType,
            context.totals.netAmount,
            String(validation.customer.id),
            form.inv_notes,
            frac,
          );
        }

        await handleGoldBox(
          savedRecordId,
          context.resolvedCompanyId,
          defaultTransType,
          context.totals.totalGWeight,
          form.inv_notes,
          frac,
        );

        toast.success(
          isNewInvoice ? "تم حفظ الفاتورة بنجاح" : "تم تحديث الفاتورة بنجاح",
        );

        return {
          ok: true,
          recordId: savedRecordId,
          invoiceNumber: Number(freshInvoice?.inv_id ?? context.invoiceNumber),
          invoiceBoxCount,
          hasAmountChanged,
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
    },
    [
      buildInvoiceSaveContext,
      isNewInvoice,
      persistInvoiceRecord,
      refreshInvoiceDetailsState,
      syncInvoiceDetails,
      validateBeforeSave,
    ],
  );

  const previewInvoice = useCallback(async () => {
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
      const printTranslations: PrintTranslations = {
        invoiceTitle: tPrint("invoiceTitle"),
        simpleInvoiceTitle: tPrint("simpleInvoiceTitle"),
        invoiceTypes: {
          sale: tPrint("invoiceTypes.sale"),
          salesReturn: tPrint("invoiceTypes.salesReturn"),
          purchase: tPrint("invoiceTypes.purchase"),
          purchaseReturn: tPrint("invoiceTypes.purchaseReturn"),
        },
        header: {
          phone: tPrint("header.phone"),
          crNumber: tPrint("header.crNumber"),
          metalLicense: tPrint("header.metalLicense"),
          mobile: tPrint("header.mobile"),
          forGoldJewellery: tPrint("header.forGoldJewellery"),
        },
        customer: {
          vatNumber: tPrint("customer.vatNumber"),
          customerCode: tPrint("customer.customerCode"),
          customerName: tPrint("customer.customerName"),
          mobile: tPrint("customer.mobile"),
          area: tPrint("customer.area"),
          street: tPrint("customer.street"),
          postalCode: tPrint("customer.postalCode"),
          city: tPrint("customer.city"),
          building: tPrint("customer.building"),
          crNumber: tPrint("customer.crNumber"),
        },
        invoice: {
          invoiceNumber: tPrint("invoice.invoiceNumber"),
          reference: tPrint("invoice.reference"),
          invoiceDate: tPrint("invoice.invoiceDate"),
          hijriDate: tPrint("invoice.hijriDate"),
        },
        columns: {
          description: tPrint("columns.description"),
          quantity: tPrint("columns.quantity"),
          weight: tPrint("columns.weight"),
          calibration: tPrint("columns.calibration"),
          stoneWeight: tPrint("columns.stoneWeight"),
          price: tPrint("columns.price"),
          taxAmount: tPrint("columns.taxAmount"),
          taxRate: tPrint("columns.taxRate"),
          total: tPrint("columns.total"),
        },
        totals: {
          total: tPrint("totals.total"),
          discount: tPrint("totals.discount"),
          beforeTax: tPrint("totals.beforeTax"),
          vat: tPrint("totals.vat"),
          netAmount: tPrint("totals.netAmount"),
        },
        footer: {
          countryEn: tPrint("footer.countryEn"),
          countryAr: tPrint("footer.countryAr"),
          seller: tPrint("footer.seller"),
          box: tPrint("footer.box"),
        },
        notSpecified: tPrint("notSpecified"),
        notAvailable: tPrint("notAvailable"),
        noReference: tPrint("noReference"),
      };
      const html = await buildInvoicePrintHtml({
        locale,
        invoice: form,
        invoiceItems: validItems,
        totals,
        invoiceType: defaultTransType,
        selectedCustomer,
        fractions: { frac, frac2 },
        translations: printTranslations,
        invoiceQrLink: invoiceData?.inv_QR,
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
    setPaymentMethod(PaymentTypes.CASH);
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
    (removedItem: InvoiceItemRow) => {
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

async function handleInvoiceBox(
  savedRecordId: number,
  companyId: number,
  transType: number,
  amount: number,
  customerId: string,
  notes: string | null,
  frac: number,
) {
  const invoiceBoxes = await getInvoiceBoxListAction(String(savedRecordId));
  const existingBox = invoiceBoxes.find(
    (b) => String(b.box) === String(customerId),
  );

  const boxPayload = {
    com: companyId,
    trans_type: transType,
    amt: formatDecimalString(amount, frac),
    box: String(customerId),
    acc_change: "1",
    notes: notes ?? "",
    inv: savedRecordId,
  };

  if (existingBox) {
    await updateInvoiceBoxAction(existingBox.id, {
      ...boxPayload,
      up_date: new Date().toISOString(),
    });
  } else {
    await createInvoiceBoxAction({
      ...boxPayload,
      cr_date: new Date().toISOString(),
    });
  }
}

async function handleGoldBox(
  savedRecordId: number,
  companyId: number,
  transType: number,
  totalGWeight: number,
  notes: string | null,
  frac: number,
) {
  if (totalGWeight <= 0) return;

  const goldBoxes = await getInvoiceGoldBoxListAction(String(savedRecordId));
  const existingBox = goldBoxes && goldBoxes.length > 0 ? goldBoxes[0] : null;

  const goldBoxPayload = {
    com: companyId,
    trans_type: transType,
    gold: formatDecimalString(totalGWeight, frac),
    box: "1",
    acc_change: "1",
    k: 21,
    gold2: 21,
    notes: notes ?? "",
    inv: savedRecordId,
  };

  if (existingBox) {
    await updateInvoiceGoldBoxAction(existingBox.id, {
      ...goldBoxPayload,
      up_date: new Date().toISOString(),
    });
  } else {
    await createInvoiceGoldBoxAction({
      ...goldBoxPayload,
      cr_date: new Date().toISOString(),
    });
  }
}
