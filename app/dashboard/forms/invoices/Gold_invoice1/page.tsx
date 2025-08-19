"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import useFractions from "@/utilities/useFractions";
import {
  API_BASE_URL,
  API_ENDPOINTS,
  fetchData,
  fetchGoldPrice,
  apiFetch,
} from "@/utilities/api";

import InvoiceSelectors from "@/components/InvoiceSelectors";
import InvoiceItemTable from "@/components/InvoiceItemTable";
import InvoiceTotalsActions from "@/components/InvoiceTotalsActions";

import type { InvoiceItem } from "@/types/invoice-item";

export default function GoldInvoice1Page() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<number>(1);
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [searchNumber, setSearchNumber] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [currentRecord, setCurrentRecord] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(1);
  const [autoTotalValue, setAutoTotalValue] = useState<number>(0);
  const [autoTotalWages, setAutoTotalWages] = useState<number>(0);
  const [manualTotalValue, setManualTotalValue] = useState<number>(0);
  const [manualTotalWages, setManualTotalWages] = useState<number>(0);
  const [useManualTotals, setUseManualTotals] = useState<boolean>(false);
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
      trans_type: 1, // فاتورة شراء
      purity: "",
      total: 0,
      total_w: 0,
      total_a: 0,
      tax: 0,
      tax_prc: 15,
      stones: "",
      item_disc_amt: 0,
    },
  ]);
  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const [homePurity, setHomePurity] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [payType, setPayType] = useState<number>(3);
  const [note, setNote] = useState<string>("");
  const [handlingMethod, setHandlingMethod] = useState<string>("");
  const [mobileMethod, setMobileMethod] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [vatNumber, setVatNumber] = useState<string>("");
  const [crNo, setCrNo] = useState<string>("");
  const [gov, setGov] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [street, setStreet] = useState<string>("");
  const [buildNo, setBuildNo] = useState<string>("");
  const [postNo, setPostNo] = useState<string>("");
  const [postCode, setPostCode] = useState<string>("");
  const [employee, setEmployee] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(true);

  const searchParams = useSearchParams();
  const frac = useFractions("frac") as number;

  const selectedCust = customers.find((c) => c.id === selectedCustomer);

  useEffect(() => {
    fetchItems();
    fetchCustomers();
    fetchCategories();
    fetchHomePurity();
    getGoldPrice();
    if (typeof window !== "undefined") {
      const now = new Date();
      setInvoiceDate(now.toISOString());
    }
  }, []);

  const getGoldPrice = async () => {
    const price = await fetchGoldPrice();
    setGoldPrice(price);
  };

  const fetchHomePurity = async () => {
    try {
      const res = await fetchData<any[]>(API_ENDPOINTS.HOME_LIST);
      if (Array.isArray(res) && res.length > 0) {
        const p = parseFloat(res[0]?.purity);
        if (!isNaN(p)) setHomePurity(p);
      }
    } catch (e) {
      console.error("failed to load home settings", e);
    }
  };

  async function fetchItems() {
    try {
      const response = await fetchData<{ results: any[] }>(
        `${API_BASE_URL}GetItemsList/`,
      );
      if (response && Array.isArray(response.results)) {
        setItems(response.results);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    }
  }

  async function fetchCustomers() {
    const response = await fetchData<any[]>(`${API_BASE_URL}customers_list`);
    if (response) {
      setCustomers(response);
    }
  }

  async function fetchCategories() {
    const response = await fetchData<{ results: any[] }>(API_ENDPOINTS.CATEGORIES_LIST);
    if (response && Array.isArray(response.results)) {
      setCategories(response.results);
    }
  }

  const totalAmount = invoiceItems.reduce((sum, item) => {
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

  const saveInvoice = async () => {
    if (!selectedCustomer) return toast.error("يرجى اختيار العميل");

    const validItems = invoiceItems.filter((itm) => itm.item_id);
    if (validItems.length === 0) {
      return toast.error("يرجى إدخال تفاصيل الفاتورة");
    }

    toast.success("تم حفظ الفاتورة بنجاح");
  };

  const previewInvoice = () => {
    if (!selectedCustomer) {
      toast.error("يرجى اختيار العميل");
      return;
    }

    const validItems = invoiceItems.filter((itm) => itm.item_id);
    if (validItems.length === 0) {
      toast.error("يرجى إدخال تفاصيل الفاتورة");
      return;
    }

    toast.success("معاينة الفاتورة");
  };

  // دوال الإجماليات اليدوية
  const handleManualTotalChange = (type: 'value' | 'wages', value: number) => {
    if (type === 'value') {
      setManualTotalValue(value);
    } else {
      setManualTotalWages(value);
    }
  };

  const resetManualTotals = () => {
    setManualTotalValue(0);
    setManualTotalWages(0);
    setUseManualTotals(false);
  };

  // دوال البحث والتنقل
  const handleInvoiceSearch = () => {
    toast.success("البحث برقم الفاتورة");
  };

  const handleBarcodeSearch = () => {
    toast.success("البحث بالباركود");
  };

  const navigateToInvoice = (direction: 'prev' | 'next' | 'first' | 'last') => {
    const directionText = {
      'prev': 'السابق',
      'next': 'التالي',
      'first': 'الأول',
      'last': 'الأخير'
    };
    toast.success(`التنقل إلى ${directionText[direction]}`);
  };

  const handleItemRemoved = (removedItem: any) => {
    console.log("تم حذف العنصر:", removedItem);
  };

                 return (
      <>
        <InvoiceTotalsActions
           invoiceNumber={invoiceNumber}
           formattedDateTime={new Date(invoiceDate).toLocaleString("ar-EG")}
           saveInvoice={saveInvoice}
           previewInvoice={previewInvoice}
           totalAmount={totalAmount}
           taxAmount={taxAmount}
           netAmount={netAmount}
           totalDiscount={totalDiscount}
           commit={false}
           setCommit={() => {}}
           print={false}
           setPrint={() => {}}
           isEditing={isEditing}
           onEdit={() => setIsEditing(true)}
           invoiceType="purchase"
           autoTotalValue={autoTotalValue}
           autoTotalWages={autoTotalWages}
           manualTotalValue={manualTotalValue}
           manualTotalWages={manualTotalWages}
           useManualTotals={useManualTotals}
           onManualTotalChange={handleManualTotalChange}
           onUseManualTotalsChange={setUseManualTotals}
           onResetManualTotals={resetManualTotals}
           searchNumber={searchNumber}
           setSearchNumber={setSearchNumber}
           onInvoiceSearch={handleInvoiceSearch}
           totalGWeight={totalGWeight}
           totalValueTax={totalValueTax}
           totalWagesTax={totalWagesTax}
           totalTax={totalTax}
           paymentMethod={paymentMethod}
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
               saleInvoices={[]}
               selectedCustomer={selectedCustomer}
               onInvoiceSelect={() => {}}
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
               isEditing={isEditing}
               items={items}
               payType={payType}
               setInvoiceItems={setInvoiceItems}
               setItems={setItems}
               onItemRemoved={handleItemRemoved}
             />
           </div>
                   </InvoiceTotalsActions>
      </>
    );
  }
