"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input, Button } from "@heroui/react";
import toast from "react-hot-toast";

import useFractions from "@/utilities/useFractions";
import { renderInvoicePreview } from "@/components/invoices/TaxInvoicePreview";
import {
  API_BASE_URL,
  API_ENDPOINTS,
  fetchData,
  fetchGoldPrice,
  apiFetch,
} from "@/utilities/api";
import { formatAmount } from "@/utilities/formatAmount";

const { CREATE_INVOICE_DTL } = API_ENDPOINTS;

import "bootstrap-icons/font/bootstrap-icons.css";

import InvoiceSelectors from "@/components/InvoiceSelectors";
import InvoiceItemTable from "@/components/InvoiceItemTable";
import InvoiceTotalsActions from "@/components/InvoiceTotalsActions";

import type { InvoiceItem } from "@/types/invoice-item";

import { generateZatcaQR } from "@/utilities/zatca";

interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_price: number;
  item_weight?: number;
  item_g_weight?: number;
  work_price?: number;
  stones?: string;
  k?: string;
  purity?: string;
  cat?: number;
  [key: string]: any;
}

interface Customer {
  id: number;
  cust_name: string;
  cust_code?: string;
  vat_no?: string;
  address?: string;
  mobile?: string;
  acc?: number;
  handling?: string;
  cust_type?: number;
  cr_no?: string;
  gov?: string;
  city?: string;
  area?: string;
  street?: string;
  build_no?: string;
  post_no?: string;
  post_code?: string;
}

interface Category {
  id: number;
  gauge?: string;
  k?: string;
  purity?: string;
}

export default function InvoicePage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<number>(1);
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    {
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
      item_disc_prc: 0,
      item_disc_amt: 0,
      sn: "",
      item_desc: "",
      cr_date: "",
      cr_user: "",
      upd_date: "",
      upd_user: "",
      com: 0,
      inv: 0,
      item: 0,
    },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [employee, setEmployee] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [handlingMethod, setHandlingMethod] = useState<string>("");
  const [mobileMethod, setMobileMethod] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [vatNumber, setVatNumber] = useState<string>("");
  // payType: 1=gold value, 2=wage only, 3=both
  const [payType, setPayType] = useState<number>(1);
  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const [crNo, setCrNo] = useState<string>("");
  const [gov, setGov] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [street, setStreet] = useState<string>("");
  const [buildNo, setBuildNo] = useState<string>("");
  const [postNo, setPostNo] = useState<string>("");
  const [postCode, setPostCode] = useState<string>("");
  const [searchNumber, setSearchNumber] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [commitVal, setCommitVal] = useState<boolean>(false);
  const [printVal, setPrintVal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [isExistingInvoice, setIsExistingInvoice] = useState<boolean>(false);
  const [invoicePk, setInvoicePk] = useState<number | null>(null);
  const [homePurity, setHomePurity] = useState<number>(1000);
  const [defaultTaxPrc, setDefaultTaxPrc] = useState<number>(15);
  
  // إجماليات قابلة للإدخال
  const [manualTotalValue, setManualTotalValue] = useState<number>(0);
  const [manualTotalWages, setManualTotalWages] = useState<number>(0);
  const [useManualTotals, setUseManualTotals] = useState<boolean>(false);
  
  // متغيرات التنقل
  const [currentRecord, setCurrentRecord] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  
  // معالجة إرجاع useFractions (قد يرجع رقم أو كائن)
  const fractions = useFractions();
  const frac = typeof fractions === "object" ? fractions.frac : 2;
  const frac2 = typeof fractions === "object" ? fractions.frac2 : 2;
  const searchParams = useSearchParams();

  // منع تكرار استدعاء نفس الفاتورة
  const [lastLoadedInvoice, setLastLoadedInvoice] = useState<string | null>(null);
  // منع تكرار استدعاء نفس الفاتورة بشكل فوري
  const lastLoadedInvoiceRef = useRef<string | null>(null);

  useEffect(() => {
    const invId = searchParams.get("inv_id");
    const isNewInvoice = searchParams.get("new") === "true";

    // إذا كان هناك طلب لفاتورة جديدة، قم بإعادة تعيين الحالة
    if (isNewInvoice) {
      resetInvoiceForm();
      return;
    }

    if (invId) {
      setSearchNumber(invId);
      handleInvoiceSearch(invId);
    }
  }, [searchParams]);
  const selectedCust = customers.find((c) => c.id === selectedCustomer);

  useEffect(() => {
    if (goldPrice !== null) {
      setInvoiceItems((items) =>
        items.map((itm) => {
          const updated = {
            ...itm,
            price: itm.price || goldPrice,
            price_w: itm.price_w || 0,
            g_weight: itm.g_weight || itm.weight,
          };

          const baseTotal =
            updated.weight * updated.price +
            updated.weight * updated.price_w -
            (updated.item_disc_amt ?? 0);

          const tax = baseTotal * ((updated.tax_prc ?? 15) / 100);

          return {
            ...updated,

            total_a: updated.weight * updated.price,

            total_w: updated.weight * updated.price_w,

            total: baseTotal + tax,
            tax,
          };
        }),
      );
    }
  }, [goldPrice]);

  // تحديث الإجماليات اليدوية عند تغيير العناصر
  useEffect(() => {
    if (!useManualTotals) {
      const { autoTotalValue, autoTotalWages } = calculateAutoTotals();
      setManualTotalValue(autoTotalValue);
      setManualTotalWages(autoTotalWages);
    }
  }, [invoiceItems, useManualTotals]);

  useEffect(() => {
    setInvoiceItems((items) =>
      items.map((itm) => {
        const purityVal = parseFloat(itm.purity || "0");
        const weightVal = parseFloat(String(itm.weight)) || 0;

        if (!homePurity || purityVal === 0) return itm;
        const g = (weightVal * purityVal) / homePurity;

        return { ...itm, g_weight: parseFloat(g.toFixed(frac2)) };
      }),
    );
  }, [homePurity]);

  // معادلة عكسية: حساب العيار من الوزن المعاير عند تغيير الوزن المعاير
  useEffect(() => {
    setInvoiceItems((items) =>
      items.map((itm) => {
        const gWeightVal = parseFloat(String(itm.g_weight)) || 0;
        const weightVal = parseFloat(String(itm.weight)) || 0;

        // إذا كان الوزن المعاير تم تغييره يدوياً وكان الوزن موجود
        if (homePurity && weightVal > 0 && gWeightVal > 0) {
          const purity = (gWeightVal * homePurity) / weightVal;
          return { ...itm, purity: parseFloat(purity.toFixed(2)).toString() };
        }
        return itm;
      }),
    );
  }, [homePurity]);

  useEffect(() => {
    fetchItems();
    fetchCustomers();
    fetchCategories();
    fetchHomePurity();
    if (typeof window !== "undefined") {
      const now = new Date();
      setInvoiceDate(now.toISOString());
    }
    getGoldPrice();
    loadInvoicesList(); // تحميل قائمة الفواتير للتنقل
    const invId = searchParams.get("inv_id");
    // توليد رقم فاتورة جديد فقط إذا لم يكن هناك inv_id ولم تكن الفاتورة في وضع التعديل
    if (!invId && !isExistingInvoice) {
      setTimeout(() => {
        setInvoiceNumber((prev) => {
          if (prev && prev !== 1) return prev; // إذا تم تعيين رقم فاتورة حقيقي لا تغيّره
          getNextInvoiceNumber().then(setInvoiceNumber);
          return prev;
        });
      }, 0);
    }
  }, [searchParams]);

  const getGoldPrice = async () => {
    const price = await fetchGoldPrice();

    setGoldPrice(price);
  };

  const fetchHomePurity = async () => {
    try {
      const res = await fetchData<any[]>(API_ENDPOINTS.HOME_LIST);

      if (Array.isArray(res) && res.length > 0) {
        const p = parseFloat(res[0]?.purity);
        const vatPerc = parseFloat(res[0]?.Vat_perc);

        if (!isNaN(p)) setHomePurity(p);
        if (!isNaN(vatPerc)) setDefaultTaxPrc(vatPerc);
      }
    } catch (e) {
      console.error("failed to load home settings", e);
    }
  };

  async function fetchItems() {
    try {
      const response = await fetchData<{ results: Item[] }>(
        `${API_BASE_URL}GetItemsList/`,
      );

      if (response && Array.isArray(response.results)) {
        setItems(response.results);
      } else {
        console.warn("No items found or invalid response.");
        setItems([]);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    }
  }

  async function fetchCustomers() {
    const response = await fetchData<Customer[]>(
      `${API_BASE_URL}customers_list`,
    );

    if (response) {
      setCustomers(response);
    } else {
      setCustomers([]);
    }
  }

  async function fetchCategories() {
    const response = await fetchData<{ results: Category[] }>(
      API_ENDPOINTS.CATEGORIES_LIST,
    );

    if (response && Array.isArray(response.results)) {
      setCategories(response.results);
    } else if (response && Array.isArray((response as any).data)) {
      // some apis may return {data:[]}
      // @ts-ignore
      setCategories((response as any).data);
    } else if (Array.isArray(response)) {
      // if array directly
      setCategories(response as unknown as Category[]);
    } else {
      setCategories([]);
    }
  }

  // حساب الإجماليات التلقائية
  const calculateAutoTotals = () => {
    const autoTotalValue = invoiceItems.reduce((sum, item) => {
      return sum + (item.weight * item.price);
    }, 0);
    
    const autoTotalWages = invoiceItems.reduce((sum, item) => {
      return sum + (item.weight * (item.price_w ?? 0));
    }, 0);
    
    return { autoTotalValue, autoTotalWages };
  };

  const { autoTotalValue, autoTotalWages } = calculateAutoTotals();

  // استخدام الإجماليات اليدوية أو التلقائية
  const effectiveTotalValue = useManualTotals ? manualTotalValue : autoTotalValue;
  const effectiveTotalWages = useManualTotals ? manualTotalWages : autoTotalWages;

  const totalAmount = invoiceItems.reduce((sum, item) => {
    const totalA = effectiveTotalValue > 0 ? (item.weight * item.price * effectiveTotalValue / autoTotalValue) : (item.weight * item.price);
    const totalW = effectiveTotalWages > 0 ? (item.weight * (item.price_w ?? 0) * effectiveTotalWages / autoTotalWages) : (item.weight * (item.price_w ?? 0));
    let rowTotal = 0;

    // 1=gold only, 2=wage only, 3=both
    if (payType === 1) {
      rowTotal = totalA;
    } else if (payType === 2) {
      rowTotal = totalW;
    } else {
      rowTotal = totalA + totalW;
    }

    return sum + rowTotal - (item.item_disc_amt ?? 0);
  }, 0);
  const taxAmount = invoiceItems.reduce((sum, item) => {
    const totalA = item.weight * item.price;
    const totalW = item.weight * (item.price_w ?? 0);
    let rowTotal = 0;

    if (payType === 1) {
      rowTotal = totalA;
    } else if (payType === 2) {
      rowTotal = totalW;
    } else {
      rowTotal = totalA + totalW;
    }
    const base = rowTotal - (item.item_disc_amt ?? 0);

    return sum + base * 0.15;
  }, 0);
  const netAmount = totalAmount + taxAmount;
  const totalDiscount = invoiceItems.reduce(
    (sum, item) => sum + (parseFloat(String(item.item_disc_amt)) || 0),
    0,
  );

  // حساب الإجماليات الإضافية الجديدة
  const totalGWeight = invoiceItems.reduce((sum, item) => {
    return sum + (item.g_weight || 0);
  }, 0);

  const totalValueTax = invoiceItems.reduce((sum, item) => {
    const totalA = item.weight * item.price;
    const base = totalA - (item.item_disc_amt ?? 0);
    return sum + (base * 0.15);
  }, 0);

  const totalWagesTax = invoiceItems.reduce((sum, item) => {
    const totalW = item.weight * (item.price_w ?? 0);
    const base = totalW - (item.item_disc_amt ?? 0);
    return sum + (base * 0.15);
  }, 0);

  const totalTax = totalValueTax + totalWagesTax;

  // تحديث الإجماليات اليدوية عند تغييرها
  const handleManualTotalChange = (type: 'value' | 'wages', newValue: number) => {
    if (type === 'value') {
      setManualTotalValue(newValue);
    } else {
      setManualTotalWages(newValue);
    }
  };

  // إعادة تعيين الإجماليات اليدوية
  const resetManualTotals = () => {
    setManualTotalValue(autoTotalValue);
    setManualTotalWages(autoTotalWages);
    setUseManualTotals(false);
  };

  const formattedDateTime = new Date(invoiceDate).toLocaleString("ar-EG", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const getNextInvoiceNumber = async (): Promise<number> => {
    const invoices = await fetchData<any[]>(`${API_BASE_URL}invoices_list`);

    if (!Array.isArray(invoices) || invoices.length === 0) return 1;

    const maxInvId = invoices.reduce((max, curr) => {
      return curr.inv_id > max ? curr.inv_id : max;
    }, 0);

    return maxInvId + 1;
  };

  const saveInvoice = async () => {
    if (isExistingInvoice) {
      // إذا كانت الفاتورة موجودة، لا يتم توليد رقم جديد ويتم التحديث فقط
      return updateInvoice();
    }
    if (!selectedCustomer) return toast.error("يرجى اختيار العميل");

    const validItems = invoiceItems.filter((itm) => itm.item_id);

    if (validItems.length === 0) {
      return toast.error("يرجى إدخال تفاصيل الفاتورة");
    }

    // فقط في حالة الإضافة الجديدة يتم توليد رقم جديد
    // إذا لم يكن هناك inv_id في الرابط ولم تكن الفاتورة موجودة
    const generatedInvId = await getNextInvoiceNumber();
    setInvoiceNumber(generatedInvId);

    const employeeMap: Record<string, number> = {
      hashem: 1,
      othman: 2,
    };

    const invQR = generateZatcaQR({
      sellerName: "شركة ثمار الصفاء المتميزة التجارية",
      vatNumber: "311452959900003",
      timestamp: invoiceDate,
      totalWithVat: netAmount.toFixed(frac),
      vatTotal: taxAmount.toFixed(frac),
    });

    const invData = {
      inv_id: generatedInvId,
      inv_date: invoiceDate,
      cust: selectedCustomer,
      cust_name: selectedCust?.cust_name || null,
      cust_code: selectedCust?.cust_code || null,
      inv_amt: parseFloat(Number(netAmount).toFixed(frac2)),
      inv_net: parseFloat(Number(totalAmount).toFixed(frac2)),
      tax: taxAmount.toFixed(frac),
      tax_prc: parseFloat(defaultTaxPrc.toFixed(2)),
      inv_status: 1,
      trans_type: 2,
      cr_date: invoiceDate,
      inv_type: paymentMethod === "cash" ? 1 : 2,
      emp_id: employeeMap[employee] || null,
      inv_notes: note || null,
      handling: handlingMethod || null,
      mobile: mobileMethod || null,
      ref_no: referenceNumber || null,
      print: printVal,
      commit: true,
      is_done: false,
      is_ok: false,
      suspend: false,
      post: false,
      tx: false,
      dist: false,
      gauge_diff: false,
      pay_chick: false,
      vat_no: vatNumber,
      pay_type: payType,
      gold_price: goldPrice ?? 0,
      cr_no: crNo || null,
      gov: gov || null,
      city: city || null,
      area: area || null,
      street: street || null,
      build_no: buildNo || null,
      post_no: postNo || null,
      post_code: postCode || null,
      inv_QR: invQR,
    };

    try {
      const res = await fetch(`${API_BASE_URL}api_create_invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invData),
      });

      if (!res.ok) {
        const errorText = await res.text();

        console.error("❌ فشل إنشاء الفاتورة:", errorText);

        return toast.error("فشل في حفظ الفاتورة");
      }

      const result = await res.json();
      const invPk = result.id;

      setInvoicePk(invPk);

      for (const [index, row] of validItems.entries()) {
        if (!row.item_id) continue;

        const dtlPrice = payType === 2 ? row.price_w : row.price;
        const dtlTotalA =
          payType === 2
            ? (row.total_w ?? row.weight * row.price_w)
            : (row.total_a ?? row.weight * row.price);

                 const dtl = {
           id: row.id,
           trans_type: row.trans_type ?? 2,
           G875: row.purity ? parseFloat(row.purity) : null,
           k: row.k ?? "",
           qty: row.qty,
           stones: row.stones ?? "",
           price: dtlPrice,
           price_w: row.price_w,
           weight: row.weight,
           g_weight: row.g_weight ?? 0,
           // totals stored with the row (total includes tax)
           total:
             row.total ??
             row.weight * row.price +
               row.weight * row.price_w -
               (row.item_disc_amt ?? 0),
           total_w: row.total_w ?? row.weight * row.price_w,
           total_a: dtlTotalA,
           tax:
             row.tax ??
             (row.weight * row.price +
               row.weight * row.price_w -
               (row.item_disc_amt ?? 0)) *
               ((row.tax_prc ?? 15) / 100),
           tax_prc: row.tax_prc ?? 15,
           item_disc_prc: row.item_disc_prc ?? 0,
           item_disc_amt: row.item_disc_amt ?? 0,
           sn: row.sn ?? "",
           item_desc: row.item_desc || row.item_name || "",
           inv_notes: row.note || "",
          cr_date: invoiceDate,
          cr_user: row.cr_user ?? "",
          upd_date: row.upd_date || new Date().toISOString(),
          upd_user: row.upd_user ?? "",
          com:
            typeof window !== "undefined"
              ? Number(localStorage.getItem("selectedBranch")) || undefined
              : undefined,
          inv: invPk,
          item: row.item_id,
        };

        const dtlRes = await apiFetch(CREATE_INVOICE_DTL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dtl),
        });

        if (!dtlRes.ok) {
          const dtlError = await dtlRes.text();

          console.error(`❌ خطأ في تفاصيل السطر ${index + 1}:`, dtlError);
          toast.error(`فشل في حفظ تفاصيل السطر ${index + 1}`);
        }
      }

      toast.success("تم حفظ الفاتورة بنجاح ✅");
      setCommitVal(true);
      setIsExistingInvoice(true);
      setIsEditing(false);
    } catch (err) {
      console.error("❌ خطأ أثناء الحفظ:", err);
      toast.error("حدث خطأ أثناء حفظ الفاتورة");
    }
  };

  const updateInvoice = async () => {
    if (!selectedCustomer) return toast.error("يرجى اختيار العميل");

    const validItems = invoiceItems.filter((itm) => itm.item_id);

    if (validItems.length === 0) {
      return toast.error("يرجى إدخال تفاصيل الفاتورة");
    }

    const employeeMap: Record<string, number> = {
      hashem: 1,
      othman: 2,
    };

    const invData = {
      inv_id: invoiceNumber,
      inv_date: invoiceDate,
      cust: selectedCustomer,
      cust_name: selectedCust?.cust_name || null,
      cust_code: selectedCust?.cust_code || null,
      inv_amt: Math.round(netAmount),
      inv_net: Math.round(totalAmount),
      tax: taxAmount.toFixed(frac),
      tax_prc: parseFloat(defaultTaxPrc.toFixed(2)),
      inv_status: 1,
      trans_type: 2,
      cr_date: invoiceDate,
      inv_type: paymentMethod === "cash" ? 1 : 2,
      emp_id: employeeMap[employee] || null,
      inv_notes: note || null,
      handling: handlingMethod || null,
      mobile: mobileMethod || null,
      ref_no: referenceNumber || null,
      print: printVal,
      commit: true,
      is_done: false,
      is_ok: false,
      suspend: false,
      post: false,
      tx: false,
      dist: false,
      gauge_diff: false,
      pay_chick: false,
      vat_no: vatNumber,
      pay_type: payType,
      gold_price: goldPrice ?? 0,
      cr_no: crNo || null,
      gov: gov || null,
      city: city || null,
      area: area || null,
      street: street || null,
      build_no: buildNo || null,
      post_no: postNo || null,
      post_code: postCode || null,
      inv_QR: generateZatcaQR({
        sellerName: "شركة ثمار الصفاء المتميزة التجارية",
        vatNumber: "311452959900003",
        timestamp: invoiceDate,
        totalWithVat: netAmount.toFixed(frac),
        vatTotal: taxAmount.toFixed(frac),
      }),
    };

    try {
      if (invoicePk === null) throw new Error("Invoice primary key missing");

      // تنظيف الحقول ذات القيمة null أو undefined
      const cleanInvData = Object.fromEntries(
        Object.entries(invData).filter(([_, v]) => v !== null && v !== undefined)
      );
      console.log("[updateInvoice] cleanInvData:", cleanInvData);

      const res = await apiFetch(`${API_BASE_URL}api_update_invoice/${invoicePk}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanInvData),
      });

      if (!res.ok) {
        const errorText = await res.text();

        console.error("❌ فشل تعديل الفاتورة:", errorText);

        return toast.error("فشل في تعديل الفاتورة");
      }

      // تحديث ذكي لتفاصيل الفاتورة عند التعديل
      // 1. تحديث الأسطر المعدلة (PATCH)
      // 2. إضافة الأسطر الجديدة (POST)
      // 3. حذف الأسطر المحذوفة (DELETE)
      const originalIds = originalInvoiceItems.map((item) => item.id);
      const currentIds = invoiceItems.map((item) => item.id);

      // حذف الأسطر المحذوفة من قاعدة البيانات
      if (deletedItems.length > 0) {
        console.log(`🔴 سيتم حذف ${deletedItems.length} صنف من قاعدة البيانات:`, deletedItems.map(item => `${item.item_name} (ID: ${item.id})`));
        
        for (const itemToDelete of deletedItems) {
          try {
            console.log(`🔄 جاري حذف الصنف: ${itemToDelete.item_name} (ID: ${itemToDelete.id})`);
            const deleteRes = await apiFetch(`${API_BASE_URL}api_delete_invoice_dtl/${itemToDelete.id}`, { 
              method: "DELETE" 
            });
            
            if (!deleteRes.ok) {
              const errorText = await deleteRes.text();
              console.error(`❌ فشل في حذف الصنف ${itemToDelete.id}:`, errorText);
              toast.error(`فشل في حذف الصنف ${itemToDelete.item_name || itemToDelete.id}`);
            } else {
              console.log(`✅ تم حذف الصنف ${itemToDelete.item_name || itemToDelete.id} بنجاح`);
            }
          } catch (error) {
            console.error(`❌ خطأ في حذف الصنف ${itemToDelete.id}:`, error);
            toast.error(`خطأ في حذف الصنف ${itemToDelete.item_name || itemToDelete.id}`);
          }
        }
      } else {
        console.log("📝 لا توجد عناصر محذوفة");
      }

      // تحديث أو إضافة الأسطر
      for (const row of invoiceItems) {
        if (!row.item_id) continue;
        const dtlPrice = payType === 2 ? row.price_w : row.price;
        const dtlTotalA =
          payType === 2
            ? (row.total_w ?? row.weight * row.price_w)
            : (row.total_a ?? row.weight * row.price);
                 const dtl = {
           id: row.id,
           trans_type: row.trans_type ?? 2,
           G875: row.purity ? parseFloat(row.purity) : null,
           k: row.k ?? "",
           qty: row.qty,
           stones: row.stones ?? "",
           price: dtlPrice,
           price_w: row.price_w,
           weight: row.weight,
           g_weight: row.g_weight ?? 0,
           total:
             row.total ??
             row.weight * row.price +
               row.weight * row.price_w -
               (row.item_disc_amt ?? 0),
           total_w: row.total_w ?? row.weight * row.price_w,
           total_a: dtlTotalA,
           tax:
             row.tax ??
             (row.weight * row.price +
               row.weight * row.price_w -
               (row.item_disc_amt ?? 0)) *
               ((row.tax_prc ?? 15) / 100),
           tax_prc: row.tax_prc ?? 15,
           item_disc_prc: row.item_disc_prc ?? 0,
           item_disc_amt: row.item_disc_amt ?? 0,
           sn: row.sn ?? "",
           item_desc: row.item_desc || row.item_name || "",
           inv_notes: row.note || "",
          cr_date: row.cr_date || invoiceDate,
          upd_date: new Date().toISOString(),
          com:
            typeof window !== "undefined"
              ? Number(localStorage.getItem("selectedBranch")) || undefined
              : undefined,
          inv: invoicePk ?? invoiceNumber,
          item: row.item_id,
        };
        if (originalIds.includes(row.id)) {
          // تحديث سطر موجود
          await apiFetch(`${API_BASE_URL}api_update_invoice_dtl/${row.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dtl),
          });
        } else {
          // إضافة سطر جديد
          await apiFetch(`${API_BASE_URL}api_create_invoice_dtl`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dtl),
          });
        }
      }

      toast.success("تم تعديل الفاتورة بنجاح ✅");
      setCommitVal(true);
      setIsEditing(false);
      
      // تحديث originalInvoiceItems ليعكس التغييرات الحالية
      setOriginalInvoiceItems([...invoiceItems]);
      // مسح قائمة العناصر المحذوفة بعد الحفظ الناجح
      setDeletedItems([]);
    } catch (err) {
      console.error("❌ خطأ أثناء التعديل:", err);
      toast.error("حدث خطأ أثناء تعديل الفاتورة");
    }
  };

  const previewInvoice = async () => {
    if (!selectedCustomer) return toast.error("يرجى اختيار العميل");

    const previewWindow = window.open(
      "",
      "InvoicePreview",
      "width=850,height=1000",
    );

    if (!previewWindow) return toast.error("تعذر فتح نافذة المعاينة");

    // جلب بيانات المنشأة من قاعدة البيانات
    const homeData = await fetchData<any[]>(API_ENDPOINTS.HOME_LIST);
    const home =
      Array.isArray(homeData) && homeData.length > 0 ? homeData[0] : {};

    // تجهيز بيانات التقرير
    const previewCustomer = selectedCust
      ? {
          ...selectedCust,
          address: [gov, city, area, street, buildNo, postNo, postCode]
            .filter(Boolean)
            .join(" - "),
        }
      : undefined;

    const html = renderInvoicePreview({
      items: invoiceItems.map(item => ({
        item_name: item.item_name || "",
        qty: item.qty,
        weight: item.weight,
        price: item.price,
        price_w: item.price_w || 0,
        item_disc_amt: item.item_disc_amt || 0,
        k: item.k || "",
      })) as any,
      customer: previewCustomer,
      companyAName: home.comp_a_name || "",
      companyLName: home.comp_l_name || "",
      addressA: home.ADDRESS || "",
      addressL: home.ADDRESS_E || "",
      signImg: home.sign || "",
      footerText: home.footer || "",
      invoiceNumber,
      invoiceDate,
      invQR: generateZatcaQR({
        sellerName: home.comp_a_name || "اسم المنشأة",
        vatNumber: String(selectedCust?.vat_no || ""),
        timestamp: invoiceDate,
        totalWithVat: netAmount.toFixed(frac),
        vatTotal: taxAmount.toFixed(frac),
      }),
      totalAmount,
      taxAmount,
      netAmount,
      payType,
      frac,
      frac2,
    });

    previewWindow.document.write(html);
    previewWindow.document.close();
  };

  const handleBarcodeSearch = async () => {
    if (!searchValue.trim() || !isEditing) return;

    try {
      console.log("البحث عن الكود:", searchValue.trim());
      
      const searchTerm = searchValue.trim();
      let exactMatch = null;
      
      console.log("بدء البحث المحسن...");
      
      console.log("البحث السريع في الأصناف المحملة:", items.length, "صنف");
      exactMatch = items.find((item: any) => {
        const itemCode = (item.item_code ?? item.code ?? "").toString().trim();
        return itemCode === searchTerm;
      });
      
      if (!exactMatch) {
        console.log("لم يجد في الأصناف المحملة، البحث في API...");
        
        const res = await fetch(
          `${API_BASE_URL}SearchItemsList/?q=${encodeURIComponent(searchTerm)}&page=1`,
        );
        const json = await res.json();
        
        console.log("نتائج API:", {
          count: json.count,
          resultsCount: json.results?.length || 0
        });
        
        if (Array.isArray(json.results)) {
        
          exactMatch = json.results.find((item: any) => {
            const itemCode = (item.item_code ?? item.code ?? "").toString().trim();
            
            console.log("مقارنة دقيقة:", `"${itemCode}" === "${searchTerm}"`);
            console.log("نوع البيانات:", typeof itemCode, typeof searchTerm);
            console.log("طول النصوص:", itemCode.length, searchTerm.length);
            
            // البحث عن تطابق دقيق في الكود فقط
            if (itemCode === searchTerm) {
              console.log("✅ وجد تطابق دقيق في الكود:", itemCode);
              return true;
            }
            
            return false;
          });
        }
      } else {
        console.log("✅ وجد تطابق دقيق في الأصناف المحملة:", exactMatch.item_code);
      }

              if (exactMatch) {
          const firstEmptyRowIndex = invoiceItems.findIndex(
            (item) => !item.item_id && !item.item_name && item.weight === 0
          );

          const targetIndex = firstEmptyRowIndex !== -1 ? firstEmptyRowIndex : 0;
          const updated = [...invoiceItems];

          if (firstEmptyRowIndex === -1) {
            updated.unshift({
              id: Date.now(),
              item_id: null,
              item_code: "",
              qty: 1,
              g_weight: 0,
              weight: 0,
              k: "",
              price: goldPrice ?? 0,
              price_w: goldPrice ?? 0,
              note: "",
              trans_type: 2,
              purity: "",
              total: 0,
              total_w: 0,
              total_a: 0,
              item_desc: "",
              tax: 0,
              tax_prc: 15,
              stones: "",
              item_disc_prc: 0,
              item_disc_amt: 0,
              sn: "",
              cr_date: "",
              cr_user: "",
              upd_date: "",
              upd_user: "",
              com: 0,
              inv: 0,
              item: 0,
            });
          }

          const selected = exactMatch;

          if (!items.find((i) => i.id === selected.id)) {
            setItems([...items, selected]);
          }

          updated[targetIndex].item_id = selected.id ?? null;
          updated[targetIndex].item_code = selected.item_code ?? "";
          updated[targetIndex].item_name = selected.item_name ?? "";
          updated[targetIndex].item_desc = selected.item_name ?? "";

          const selk = selected.k ?? "";
          const selPurity = selected.purity ?? "";

          updated[targetIndex].k = selected.k ?? "";
          updated[targetIndex].price = goldPrice ?? Number(selected.item_price ?? 0);
          updated[targetIndex].price_w = Number(selected.work_price ?? 0);
          updated[targetIndex].purity = selected.purity ?? "";
          updated[targetIndex].stones = selected.stones ?? "";

          if (
            selected.item_weight !== undefined &&
            selected.item_weight !== null &&
            selected.item_weight !== ""
          ) {
            updated[targetIndex].weight = Number(selected.item_weight ?? 0);
            updated[targetIndex].g_weight = Number(
              selected.item_g_weight ?? selected.item_weight ?? 0
            );
          }

          if (
            selected.item_g_weight !== undefined &&
            selected.item_g_weight !== null &&
            selected.item_g_weight !== ""
          ) {
            updated[targetIndex].g_weight = Number(selected.item_g_weight);
          }

          if (
            (selk === "" || selk === "0" || selPurity === "" || selPurity === "0") &&
            selected.cat
          ) {
            const cat = categories.find((c) => c.id === selected.cat);
            if (cat) {
              if (!selk || selk === "0")
                updated[targetIndex].k = (cat.gauge ?? cat.k ?? "") as string;
              if (!selPurity || selPurity === "0")
                updated[targetIndex].purity = cat.purity ?? "";
            }
          }

          if (!updated[targetIndex].purity || updated[targetIndex].purity === "0" || updated[targetIndex].purity === "") {
            updated[targetIndex].purity = homePurity.toString();
          }

          const wCalc =
            updated[targetIndex].weight < 1 &&
            updated[targetIndex].g_weight > updated[targetIndex].weight
              ? updated[targetIndex].weight * 1000
              : updated[targetIndex].weight;

          updated[targetIndex].total_a =
            payType === 2
              ? wCalc * updated[targetIndex].price_w
              : wCalc * updated[targetIndex].price;
          updated[targetIndex].total_w = wCalc * updated[targetIndex].price_w;

          const base =
            (payType === 1
              ? updated[targetIndex].total_a
              : payType === 2
                ? updated[targetIndex].total_w
                : updated[targetIndex].total_a + updated[targetIndex].total_w) -
            (updated[targetIndex].item_disc_amt ?? 0);

          updated[targetIndex].tax = (base * (updated[targetIndex].tax_prc ?? 15)) / 100;
          updated[targetIndex].total = base + updated[targetIndex].tax;

          setInvoiceItems(updated);

                      setSearchValue("");

            toast.success(`✅ تم إضافة الصنف: ${selected.item_name || selected.item_code} (${selected.item_code})`);

            const isLastRow = targetIndex === updated.length - 1;
          const isRowFilled =
            updated[targetIndex].item_id ||
            updated[targetIndex].item_name ||
            updated[targetIndex].weight > 0;

          if (isLastRow && isRowFilled) {
            setInvoiceItems([
              ...updated,
              {
                id: Date.now(),
                item_id: null,
                item_code: "",
                qty: 1,
                g_weight: 0,
                weight: 0,
                k: "",
                price: goldPrice ?? 0,
                price_w: goldPrice ?? 0,
                note: "",
                trans_type: 2,
                purity: "",
                total: 0,
                total_w: 0,
                total_a: 0,
                item_desc: "",
                tax: 0,
                tax_prc: 15,
                stones: "",
                item_disc_prc: 0,
                item_disc_amt: 0,
                sn: "",
                cr_date: "",
                cr_user: "",
                upd_date: "",
                upd_user: "",
                com: 0,
                inv: 0,
                item: 0,
              },
            ]);
          }
        } else {
          // إذا لم يجد تطابق دقيق، لا تعرض أي شيء
          console.log("❌ لم يجد تطابق دقيق للكود:", searchValue.trim());
          console.log("تم البحث في الأصناف المحملة و API");
          
          toast.error(`لم يتم العثور على صنف : ${searchValue.trim()}`);
          setSearchValue("");
          return;
        }
    } catch (error) {
      console.error("خطأ في البحث بالباركود:", error);
      toast.error("حدث خطأ أثناء البحث بالباركود");
    }
  };

  const handleInvoiceSearch = async (searchVal?: string) => {
    const num = searchVal ?? searchNumber;
    if (!num || num === lastLoadedInvoiceRef.current) return; 
    lastLoadedInvoiceRef.current = num;

    
    if (lastLoadedInvoice === searchVal) return;

    setDeletedItems([]);

    try {
      const invList = await fetchData<any[]>(
        `${API_BASE_URL}invoices_list?inv_id=${num}`,
      );

      if (!invList || invList.length === 0) {
        toast.error("الفاتورة غير موجودة");

        return;
      }

      const inv = invList.find((i) => String(i.inv_id) === String(num));

      if (!inv) {
        toast.error("الفاتورة غير موجودة");

        return;
      }

      const invoicePk = inv.id;

      setInvoicePk(invoicePk);

      // تعبئة البيانات الأساسية
      setInvoiceNumber(inv.inv_id);
      if (inv.inv_date) setInvoiceDate(inv.inv_date);
      if (inv.cust) setSelectedCustomer(inv.cust);
      if (inv.inv_type)
        setPaymentMethod(inv.inv_type === 1 ? "cash" : "credit");
      if (inv.ref_no) setReferenceNumber(inv.ref_no);
      if (inv.vat_no) setVatNumber(inv.vat_no);
      if (inv.handling) setHandlingMethod(inv.handling);
      if (inv.mobile) setMobileMethod(inv.mobile);
      if (inv.pay_type) setPayType(inv.pay_type);
      if (typeof inv.commit !== "undefined") {
        setCommitVal(!!inv.commit);
      }
      if (typeof inv.print !== "undefined") setPrintVal(!!inv.print);
      if (inv.emp_id)
        setEmployee(
          inv.emp_id === 1 ? "hashem" : inv.emp_id === 2 ? "othman" : "",
        );
      if (inv.inv_notes) setNote(inv.inv_notes);
      if (inv.gold_price) setGoldPrice(parseFloat(inv.gold_price));
      if (inv.cr_no) setCrNo(String(inv.cr_no));
      if (inv.gov) setGov(inv.gov);
      if (inv.city) setCity(inv.city);
      if (inv.area) setArea(inv.area);
      if (inv.street) setStreet(inv.street);
      if (inv.build_no) setBuildNo(inv.build_no);
      if (inv.post_no) setPostNo(inv.post_no);
      if (inv.post_code) setPostCode(inv.post_code);

      // تحديث currentRecord للتنقل
      const currentIndex = invoicesList.findIndex(v => v.id === inv.id);
      if (currentIndex !== -1) {
        setCurrentRecord(currentIndex + 1);
      }

      setIsExistingInvoice(true);
      setIsEditing(false);

      // جلب التفاصيل وربطها بالـ id الأساسي
      const detailsRes = await fetchData<any>(
        `${API_BASE_URL}invoices_dtl_list`,
      );

      let detailRows: any[] = [];

      if (Array.isArray(detailsRes)) {
        detailRows = detailsRes;
      } else if (Array.isArray(detailsRes.results)) {
        detailRows = detailsRes.results;
      } else if (Array.isArray(detailsRes.data)) {
        detailRows = detailsRes.data;
      }

      const filteredDetails = detailRows.filter(
        (row) => Number(row.inv) === invoicePk,
      );

      if (filteredDetails.length > 0) {
                         setInvoiceItems(
          filteredDetails.map((row) => ({
            id: row.id,
            item_id: row.item ?? row.item_id ?? null,
            item_code: row.item_code ?? "",
            item_name: row.item_name ?? row.item_desc ?? "",
            qty: parseFloat(row.qty) || 0,
            weight: parseFloat(row.weight) || 0,
            g_weight: parseFloat(row.g_weight) || 0,
            k: row.k ?? "",
            price: parseFloat(row.price) || 0,
            price_w: parseFloat(row.price_w) || 0,
            note: row.inv_notes ?? "",
            trans_type: row.trans_type ?? 2,
            purity: row.G875 ?? "",
            total: parseFloat(row.total) || 0,
             total_w: parseFloat(row.total_w) || 0,
             total_a: parseFloat(row.total_a) || 0,
             tax: parseFloat(row.tax) || 0,
             tax_prc: parseFloat(row.tax_prc) || 0,
             stones: row.stones ?? "",
             item_disc_prc: parseFloat(row.item_disc_prc) || 0,
             item_disc_amt: parseFloat(row.item_disc_amt) || 0,
             sn: row.sn ?? "",
             item_desc: row.item_desc ?? "",
            cr_date: row.cr_date ?? "",
            cr_user: row.cr_user ?? "",
            upd_date: row.upd_date ?? "",
            upd_user: row.upd_user ?? "",
            com: row.com ?? 0,
            inv: row.inv ?? 0,
            item: row.item ?? 0,
          })),
        );
                 setOriginalInvoiceItems(
           filteredDetails.map((row) => ({
             id: row.id,
             item_id: row.item ?? row.item_id ?? null,
             item_code: row.item_code ?? "",
             item_name: row.item_name ?? row.item_desc ?? "",
             qty: parseFloat(row.qty) || 0,
             weight: parseFloat(row.weight) || 0,
             g_weight: parseFloat(row.g_weight) || 0,
             k: row.k ?? "",
             price: parseFloat(row.price) || 0,
             price_w: parseFloat(row.price_w) || 0,
             note: row.inv_notes ?? "",
             trans_type: row.trans_type ?? 2,
             purity: row.G875 ?? "",
             total: parseFloat(row.total) || 0,
             total_w: parseFloat(row.total_w) || 0,
             total_a: parseFloat(row.total_a) || 0,
             tax: parseFloat(row.tax) || 0,
             tax_prc: parseFloat(row.tax_prc) || 0,
             stones: row.stones ?? "",
             item_disc_prc: parseFloat(row.item_disc_prc) || 0,
             item_disc_amt: parseFloat(row.item_disc_amt) || 0,
             sn: row.sn ?? "",
             item_desc: row.item_desc ?? "",
            cr_date: row.cr_date ?? "",
            cr_user: row.cr_user ?? "",
            upd_date: row.upd_date ?? "",
            upd_user: row.upd_user ?? "",
            com: row.com ?? 0,
            inv: row.inv ?? 0,
            item: row.item ?? 0,
          })),
        );
      } else {
        setInvoiceItems([]);
        setOriginalInvoiceItems([]);
        setDeletedItems([]);
      }

      // تحديث الإجماليات اليدوية بعد تحميل الفاتورة
      setTimeout(() => {
        const { autoTotalValue, autoTotalWages } = calculateAutoTotals();
        setManualTotalValue(autoTotalValue);
        setManualTotalWages(autoTotalWages);
        setUseManualTotals(false);
      }, 100);

      toast.success("تم جلب الفاتورة بنجاح ✅");
    } catch (err) {
      console.error("❌ خطأ في جلب الفاتورة:", err);
      toast.error("فشل في جلب الفاتورة");
    }
  };

  // قائمة تفاصيل الفاتورة الأصلية عند تحميل الفاتورة (للمقارنة عند التعديل)
  const [originalInvoiceItems, setOriginalInvoiceItems] = useState<InvoiceItem[]>([]);
  // قائمة العناصر المحذوفة (للتأكد من حذفها من قاعدة البيانات)
  const [deletedItems, setDeletedItems] = useState<InvoiceItem[]>([]);

    // دالة لإعادة تعيين حالة الفاتورة لفاتورة جديدة
  const resetInvoiceForm = () => {
    // إعادة تعيين جميع الحقول
    setSelectedCustomer(null);
    setInvoiceItems([{
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
      item_disc_prc: 0,
      item_disc_amt: 0,
      sn: "",
      item_desc: "",
      cr_date: "",
      cr_user: "",
      upd_date: "",
      upd_user: "",
      com: 0,
      inv: 0,
      item: 0,
    }]);
    setPaymentMethod("cash");
    setEmployee("");
    setNote("");
    setHandlingMethod("");
    setMobileMethod("");
    setReferenceNumber("");
    setVatNumber("");
    setPayType(1);
    setCrNo("");
    setGov("");
    setCity("");
    setArea("");
    setStreet("");
    setBuildNo("");
    setPostNo("");
    setPostCode("");
    setSearchNumber("");
    setSearchValue("");
    setCommitVal(false);
    setPrintVal(false);
    setIsEditing(true);
    setIsExistingInvoice(false);
    setInvoicePk(null);
    setOriginalInvoiceItems([]);
    setDeletedItems([]);
    setLastLoadedInvoice(null);
    lastLoadedInvoiceRef.current = null;
    
    // إعادة تعيين الإجماليات اليدوية
    setManualTotalValue(0);
    setManualTotalWages(0);
    setUseManualTotals(false);
    
    // تعيين التاريخ الحالي
    if (typeof window !== "undefined") {
      const now = new Date();
      setInvoiceDate(now.toISOString());
    }
    
    // توليد رقم فاتورة جديد
    getNextInvoiceNumber().then(setInvoiceNumber);
    
    console.log("تم إعادة تعيين الفاتورة لفاتورة جديدة");
  };

  const navigateToInvoice = (direction: 'first' | 'prev' | 'next' | 'last') => {
    if (invoicesList.length === 0) return;

    let targetIndex = 0;
    const currentIndex = invoicesList.findIndex(v => v.id === invoicePk);

    switch (direction) {
      case 'first':
        targetIndex = 0;
        break;
      case 'prev':
        targetIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        break;
      case 'next':
        targetIndex = currentIndex < invoicesList.length - 1 ? currentIndex + 1 : invoicesList.length - 1;
        break;
      case 'last':
        targetIndex = invoicesList.length - 1;
        break;
    }

    const targetInvoice = invoicesList[targetIndex];
    if (targetInvoice) {
      router.push(`/dashboard/forms/invoice?inv_id=${targetInvoice.inv_id}`);
    }
  };

  // تحميل قائمة الفواتير للتنقل
  const loadInvoicesList = async () => {
    try {
      const response = await fetchData<any[]>(`${API_BASE_URL}invoices_list?trans_type=2`);
      if (Array.isArray(response)) {
        setInvoicesList(response);
        setTotalRecords(response.length);
        
        // تحديث currentRecord إذا كان هناك فاتورة محملة
        if (invoicePk) {
          const currentIndex = response.findIndex(v => v.id === invoicePk);
          if (currentIndex !== -1) {
            setCurrentRecord(currentIndex + 1);
          }
        }
      }
    } catch (error) {
      console.error("Error loading invoices list:", error);
    }
  };

  // دالة لتحديث قائمة العناصر المحذوفة عند حذف صنف
  const handleItemRemoved = (removedItem: InvoiceItem) => {
    // التحقق من أن العنصر المحذوف موجود في originalInvoiceItems (أي أنه عنصر موجود في قاعدة البيانات)
    const isOriginalItem = originalInvoiceItems.some(item => item.id === removedItem.id);

    if (isOriginalItem) {
      // إضافة العنصر إلى قائمة العناصر المحذوفة بدلاً من حذفه من originalInvoiceItems
      setDeletedItems(prev => [...prev, removedItem]);
      console.log(`🗑️ تم إضافة الصنف "${removedItem.item_name}" (ID: ${removedItem.id}) إلى قائمة العناصر المحذوفة`);
    } else {
      console.log(`ℹ️ الصنف "${removedItem.item_name}" (ID: ${removedItem.id}) ليس عنصراً أصلياً، لن يتم حذفه من قاعدة البيانات`);
    }
  };

  // تحويل invoiceItems إلى items متوافقة مع Item[] عند تمريرها فقط
  const itemsForTable: Item[] = invoiceItems.map((itm) => ({
    id: itm.id,
    item_code: itm.item_code || "",
    item_name: typeof itm.item_name === "string" ? itm.item_name : (itm.item_name ? String(itm.item_name) : ""),
    item_price: typeof itm.price === "number" ? itm.price : Number(itm.price) || 0,
    item_weight: typeof itm.weight === "number" ? itm.weight : Number(itm.weight) || 0,
    item_g_weight: typeof itm.g_weight === "number" ? itm.g_weight : Number(itm.g_weight) || 0,
    work_price: typeof itm.price_w === "number" ? itm.price_w : Number(itm.price_w) || 0,
    stones: typeof itm.stones === "string" ? itm.stones : (itm.stones ? String(itm.stones) : ""),
    k: typeof itm.k === "string" ? itm.k : (itm.k ? String(itm.k) : ""),
    purity: typeof itm.purity === "string" ? itm.purity : (itm.purity ? String(itm.purity) : ""),
    cat: undefined,
  }));

  return (
    <>
      <InvoiceTotalsActions
        commit={commitVal}
        formattedDateTime={formattedDateTime}
        invoiceNumber={invoiceNumber}
        isEditing={isEditing}
        netAmount={netAmount}
        previewInvoice={previewInvoice}
        print={printVal}
        saveInvoice={saveInvoice}
        setCommit={setCommitVal}
        setPrint={setPrintVal}
        taxAmount={taxAmount}
        totalAmount={totalAmount}
        totalDiscount={totalDiscount}
        onEdit={() => setIsEditing(true)}
        invoiceType="invoice"
        // إجماليات قابلة للإدخال
        autoTotalValue={autoTotalValue}
        autoTotalWages={autoTotalWages}
        manualTotalValue={manualTotalValue}
        manualTotalWages={manualTotalWages}
        useManualTotals={useManualTotals}
        onManualTotalChange={handleManualTotalChange}
        onUseManualTotalsChange={setUseManualTotals}
        onResetManualTotals={resetManualTotals}
        // البحث برقم الفاتورة
        searchNumber={searchNumber}
        setSearchNumber={setSearchNumber}
        onInvoiceSearch={() => handleInvoiceSearch()}
        // إجماليات إضافية جديدة
        totalGWeight={totalGWeight}
        totalValueTax={totalValueTax}
        totalWagesTax={totalWagesTax}
        totalTax={totalTax}
        // طريقة الدفع
        paymentMethod={paymentMethod}
        // أزرار التنقل
        currentRecord={currentRecord}
        totalRecords={totalRecords}
        navigateToInvoice={navigateToInvoice}
      >
        <div className={isEditing ? "" : "pointer-events-none opacity-70"}>
          <InvoiceSelectors
            area={area}
            buildNo={buildNo}
            city={city}
            crNo={crNo}
            customers={customers}
            employee={employee}
            goldPrice={goldPrice}
            gov={gov}
            handlingMethod={handlingMethod}
            mobileMethod={mobileMethod}
            note={note}
            payType={payType}
            paymentMethod={paymentMethod}
            postCode={postCode}
            postNo={postNo}
            referenceNumber={referenceNumber}
            selectedCustomer={selectedCustomer}
            setArea={setArea}
            setBuildNo={setBuildNo}
            setCity={setCity}
            setCrNo={setCrNo}
            setEmployee={setEmployee}
            setGov={setGov}
            setHandlingMethod={setHandlingMethod}
            setMobileMethod={setMobileMethod}
            setNote={setNote}
            setPayType={setPayType}
            setPaymentMethod={setPaymentMethod}
            setPostCode={setPostCode}
            setPostNo={setPostNo}
            setReferenceNumber={setReferenceNumber}
            setSelectedCustomer={setSelectedCustomer}
            setStreet={setStreet}
            setVatNumber={setVatNumber}
            street={street}
            vatNumber={vatNumber}
            // البحث بالباركود
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            onBarcodeSearch={handleBarcodeSearch}
            isEditing={isEditing}
          />
          <InvoiceItemTable
            categories={categories}
            goldPrice={goldPrice}
            homePurity={homePurity}
            invoiceItems={invoiceItems}
            items={itemsForTable}
            payType={payType}
            setInvoiceItems={setInvoiceItems}
            setItems={setItems}
            isEditing={isEditing}
            onItemRemoved={handleItemRemoved}
          />
        </div>
      </InvoiceTotalsActions>
    </>
  );
}
