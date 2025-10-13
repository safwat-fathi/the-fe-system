import { useCallback, useEffect, useReducer, useState } from "react";
import toast from "react-hot-toast";
import useFractions from "@/utilities/useFractions";
import {
  API_BASE_URL,
  API_ENDPOINTS,
  fetchData,
  fetchGoldPrice,
  fetchItemByBarcode,
} from "@/utilities/api";
import { Invoice, InvoiceDetail } from "@/types/models/invoice";

type InvoiceItemRow = {
  id: number;
  item_id: number | null;
  item_code: string;
  item_name?: string;
  qty: number;
  weight: number;
  g_weight: number;
  k: string;
  price: number;
  price_w: number;
  note: string;
  trans_type: number;
  purity: string;
  total: number;
  total_w: number;
  total_a: number;
  tax: number;
  tax_prc: number;
  stones: string;
  item_disc_amt: number;
};

type FormState = {
  cust_code: any | null;
  inv_id: number | string | null;
  inv_date: string;
  pay_type: number;
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
}: {
  invoiceData: Invoice | null;
  invoiceDetailsData: InvoiceDetail[];
  isNewInvoice: boolean;
}) {
  // lists
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // UI state
  const [employee, setEmployee] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(isNewInvoice);
  const [isLoading, setIsLoading] = useState<boolean>(!isNewInvoice);

  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const [homePurity, setHomePurity] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [handlingMethod, setHandlingMethod] = useState<string>("");
  const [mobileMethod, setMobileMethod] = useState<string>("");
  const [searchNumber, setSearchNumber] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [currentRecord, setCurrentRecord] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(1);

  const frac = useFractions("frac") as number;

  // form reducer
  const initialFormState: FormState = {
    cust_code: invoiceData?.cust_code ?? null,
    inv_id: invoiceData?.inv_id ?? null,
    inv_date: invoiceData?.inv_date ?? defaultInvoiceDate,
    pay_type: invoiceData?.pay_type ?? 3,
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
      item_code: "",
      qty: 1,
      weight: 0,
      g_weight: 0,
      k: "",
      price: 0,
      price_w: 0,
      note: "",
      trans_type: 2,
      purity: "",
      total: 0,
      total_w: 0,
      total_a: 0,
      tax: 0,
      tax_prc: 15,
      stones: "",
      item_disc_amt: 0,
    }),
    [],
  );

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemRow[]>(
    invoiceDetailsData && invoiceDetailsData.length > 0
      ? (invoiceDetailsData as unknown as InvoiceItemRow[])
      : [makeEmptyRow()],
  );

  // sync incoming invoiceData/details
  useEffect(() => {
    if (!invoiceData) return;

    dispatchForm({
      type: "SET_ALL",
      payload: {
        cust_code: invoiceData.cust_code ?? null,
        inv_id: invoiceData.inv_id ?? null,
        inv_date: invoiceData.inv_date ?? defaultInvoiceDate,
        pay_type: invoiceData.pay_type ?? 3,
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

    if (invoiceDetailsData && invoiceDetailsData.length > 0) {
      setInvoiceItems(invoiceDetailsData as unknown as InvoiceItemRow[]);
    }

    setIsLoading(false);
  }, [invoiceData, invoiceDetailsData]);

  // fetch helpers
  const getGoldPrice = useCallback(async () => {
    try {
      const price = await fetchGoldPrice();
      setGoldPrice(price);
    } catch (e) {
      console.error("failed to fetch gold price", e);
    }
  }, []);

  const fetchHomePurity = useCallback(async () => {
    try {
      const res = await fetchData<any[]>(API_ENDPOINTS.HOME_LIST);
      if (Array.isArray(res) && res.length > 0) {
        const p = parseFloat(res[0]?.purity);
        if (!isNaN(p)) setHomePurity(p);
      }
    } catch (e) {
      console.error("failed to load home settings", e);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetchData<{ results: any[] }>(
        `${API_BASE_URL}GetItemsList/`,
      );
      if (response && Array.isArray(response.results))
        setItems(response.results);
      else setItems([]);
    } catch (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetchData<any[]>(`${API_BASE_URL}customers_list`);
      if (response) setCustomers(response.filter((c) => c.box_type !== 2));
      else setCustomers([]);
    } catch (e) {
      console.error("failed to load customers", e);
      setCustomers([]);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetchData<{ results: any[] }>(
        API_ENDPOINTS.CATEGORIES_LIST,
      );
      if (response && Array.isArray(response.results))
        setCategories(response.results);
      else setCategories([]);
    } catch (e) {
      console.error("failed to load categories", e);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchCustomers();
    fetchCategories();
    fetchHomePurity();
    getGoldPrice();

    if (isNewInvoice) setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // totals (simple helpers returned to consumer can compute more if needed)
  const computeTotals = useCallback(
    (payType: number, rows: InvoiceItemRow[]) => {
      const totalAmount = rows.reduce((sum, item) => {
        const totalA = (item.weight || 0) * (item.price || 0);
        const totalW = (item.weight || 0) * (item.price_w || 0);
        let rowTotal = 0;

        if (payType === 1) rowTotal = totalA;
        else if (payType === 2) rowTotal = totalW;
        else rowTotal = totalA + totalW;

        return sum + rowTotal - (item.item_disc_amt ?? 0);
      }, 0);

      const taxAmount = rows.reduce((sum, item) => {
        const totalA = (item.weight || 0) * (item.price || 0);
        const totalW = (item.weight || 0) * (item.price_w || 0);
        let rowTotal = 0;

        if (payType === 1) rowTotal = totalA;
        else if (payType === 2) rowTotal = totalW;
        else rowTotal = totalA + totalW;

        const base = rowTotal - (item.item_disc_amt ?? 0);
        return sum + base * 0.15;
      }, 0);

      const totalDiscount = rows.reduce(
        (sum, item) => sum + (parseFloat(String(item.item_disc_amt)) || 0),
        0,
      );

      const totalGWeight = rows.reduce(
        (sum, item) => sum + (item.g_weight || 0),
        0,
      );

      return {
        totalAmount,
        taxAmount,
        totalDiscount,
        totalGWeight,
        netAmount: totalAmount + taxAmount,
      };
    },
    [],
  );

  // barcode search logic kept here so consumer can call it. It mutates invoiceItems and items lists.
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
          const barcodeResult = await fetchItemByBarcode(searchTerm);
          if (barcodeResult) exactMatch = barcodeResult;
          else {
            const res = await fetch(
              `${API_BASE_URL}SearchItemsList/?q=${encodeURIComponent(searchTerm)}&page=1`,
            );
            const json = await res.json();
            if (Array.isArray(json.results)) {
              exactMatch = json.results.find(
                (item: any) =>
                  (item.item_code ?? "").toString().trim() === searchTerm,
              );
            }
          }
        }

        if (!exactMatch) {
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
          item_code: selected.item_code ?? "",
          item_name: selected.item_name ?? "",
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
          form.pay_type === 2
            ? wCalc * (row.price_w ?? 0)
            : wCalc * (row.price ?? 0);
        row.total_w = wCalc * (row.price_w ?? 0);

        const base =
          (form.pay_type === 1
            ? row.total_a
            : form.pay_type === 2
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

  const saveInvoice = useCallback(async () => {
    if (!form.cust_code) return toast.error("يرجى اختيار العميل");

    const validItems = invoiceItems.filter((itm) => itm.item_id);
    if (validItems.length === 0)
      return toast.error("يرجى إدخال تفاصيل الفاتورة");

    try {
      setIsLoading(true);
      if (isNewInvoice) toast.success("تم حفظ الفاتورة بنجاح");
      else toast.success("تم تحديث الفاتورة بنجاح");
    } catch (error) {
      console.error("خطأ في حفظ الفاتورة:", error);
      toast.error("حدث خطأ أثناء حفظ الفاتورة");
    } finally {
      setIsLoading(false);
    }
  }, [form.cust_code, invoiceItems, isNewInvoice]);

  const previewInvoice = useCallback(() => {
    if (!form.cust_code) return toast.error("يرجى اختيار العميل");

    const validItems = invoiceItems.filter((itm) => itm.item_id);
    if (validItems.length === 0)
      return toast.error("يرجى إدخال تفاصيل الفاتورة");

    toast.success("معاينة الفاتورة");
  }, [form.cust_code, invoiceItems]);

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

  const handleItemRemoved = useCallback((removedItem: any) => {
    console.log("تم حذف العنصر:", removedItem);
  }, []);

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
