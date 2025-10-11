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
  fetchItemByBarcode,
} from "@/utilities/api";
import homeService from "@/services/api/home.service";

import InvoiceSelectors from "@/components/InvoiceSelectors";
import InvoiceItemTable from "@/components/InvoiceItemTable";
import InvoiceTotalsActions from "@/components/InvoiceTotalsActions";

import type { InvoiceItem } from "@/types/invoice-item";

export default function GoldInvoice3Page() {
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
      trans_type: 3, // فاتورة مردود شراء
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
      const homeSettings = await homeService.getHomeSettings();
      if (homeSettings) {
        const p = homeSettings.purity || 0;
        if (p) setHomePurity(p);
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
      // تصفية العملاء والموردين بحيث لا يكون box_type = 2
      const filteredCustomers = response.filter((customer) => customer.box_type !== 2);
      setCustomers(filteredCustomers);
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
    if (!selectedCustomer) return toast.error("يرجى اختيار المورد");

    const validItems = invoiceItems.filter((itm) => itm.item_id);
    if (validItems.length === 0) {
      return toast.error("يرجى إدخال تفاصيل الفاتورة");
    }

    toast.success("تم حفظ فاتورة مردود الشراء بنجاح");
  };

  const previewInvoice = () => {
    if (!selectedCustomer) {
      toast.error("يرجى اختيار المورد");
      return;
    }

    const validItems = invoiceItems.filter((itm) => itm.item_id);
    if (validItems.length === 0) {
      toast.error("يرجى إدخال تفاصيل الفاتورة");
      return;
    }

    toast.success("معاينة فاتورة مردود الشراء");
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

  const handleBarcodeSearch = async () => {
    if (!searchValue.trim() || !isEditing) return;

    try {
      console.log("البحث بالباركود:", searchValue.trim());
      
      const searchTerm = searchValue.trim();
      let exactMatch = null;
      
      // البحث في الأصناف المحملة أولاً
      console.log("البحث في الأصناف المحملة:", items.length, "صنف");
      exactMatch = items.find((item: any) => {
        const itemBarcode = (item.item_barcode ?? "").toString().trim();
        const itemCode = (item.item_code ?? "").toString().trim();
        
        // البحث في الباركود أولاً، ثم في الكود
        return itemBarcode === searchTerm || itemCode === searchTerm;
      });
      
      if (!exactMatch) {
        console.log("لم يجد في الأصناف المحملة، البحث في API...");
        
        // استخدام دالة البحث بالباركود المخصصة
        const barcodeResult = await fetchItemByBarcode(searchTerm);
        
        if (barcodeResult) {
          exactMatch = barcodeResult;
          console.log("✅ وجد تطابق في API بالباركود:", exactMatch.item_barcode);
        } else {
          // إذا لم يجد بالباركود، جرب البحث في الكود
          const res = await fetch(
            `${API_BASE_URL}SearchItemsList/?q=${encodeURIComponent(searchTerm)}&page=1`,
          );
          const json = await res.json();
          
          if (Array.isArray(json.results)) {
            exactMatch = json.results.find((item: any) => {
              const itemCode = (item.item_code ?? "").toString().trim();
              return itemCode === searchTerm;
            });
          }
        }
      } else {
        console.log("✅ وجد تطابق في الأصناف المحملة:", exactMatch.item_barcode || exactMatch.item_code);
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
            price_w: 0,
            note: "",
            trans_type: 3,
            purity: "",
            total: 0,
            total_w: 0,
            total_a: 0,
            tax: 0,
            tax_prc: 15,
            stones: "",
            item_disc_amt: 0,
          });
        }

        const selected = exactMatch;

        if (!items.find((i) => i.id === selected.id)) {
          setItems([...items, selected]);
        }

        updated[targetIndex].item_id = selected.id ?? null;
        updated[targetIndex].item_code = selected.item_code ?? "";
        updated[targetIndex].item_name = selected.item_name ?? "";

        updated[targetIndex].k = selected.k ?? "";
        updated[targetIndex].price = goldPrice ?? Number(selected.item_price ?? 0);
        updated[targetIndex].price_w = Number(selected.work_price ?? 0);
        updated[targetIndex].purity = selected.purity ?? "";
        updated[targetIndex].stones = selected.stones ?? "";

        if (selected.item_weight !== undefined && selected.item_weight !== null && selected.item_weight !== "") {
          updated[targetIndex].weight = Number(selected.item_weight ?? 0);
          updated[targetIndex].g_weight = Number(selected.item_g_weight ?? selected.item_weight ?? 0);
        }

        if (selected.item_g_weight !== undefined && selected.item_g_weight !== null && selected.item_g_weight !== "") {
          updated[targetIndex].g_weight = Number(selected.item_g_weight);
        }

        if (!updated[targetIndex].purity || updated[targetIndex].purity === "0" || updated[targetIndex].purity === "") {
          updated[targetIndex].purity = homePurity.toString();
        }

        const wCalc = updated[targetIndex].weight < 1 && updated[targetIndex].g_weight > updated[targetIndex].weight
          ? updated[targetIndex].weight * 1000
          : updated[targetIndex].weight;

        updated[targetIndex].total_a = payType === 2
          ? wCalc * updated[targetIndex].price_w
          : wCalc * updated[targetIndex].price;
        updated[targetIndex].total_w = wCalc * updated[targetIndex].price_w;

        const base = (payType === 1
          ? updated[targetIndex].total_a
          : payType === 2
            ? updated[targetIndex].total_w
            : updated[targetIndex].total_a + updated[targetIndex].total_w) - (updated[targetIndex].item_disc_amt ?? 0);

        updated[targetIndex].tax = (base * (updated[targetIndex].tax_prc ?? 15)) / 100;
        updated[targetIndex].total = base + updated[targetIndex].tax;

        setInvoiceItems(updated);
        setSearchValue("");
        toast.success(`✅ تم إضافة الصنف: ${selected.item_name || selected.item_code} (${selected.item_code})`);

        const isLastRow = targetIndex === updated.length - 1;
        const isRowFilled = updated[targetIndex].item_id || updated[targetIndex].item_name || updated[targetIndex].weight > 0;

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
              price_w: 0,
              note: "",
              trans_type: 3,
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
        }
      } else {
        console.log("❌ لم يجد تطابق للكود:", searchValue.trim());
        toast.error(`لم يتم العثور على صنف: ${searchValue.trim()}`);
        setSearchValue("");
        return;
      }
    } catch (error) {
      console.error("خطأ في البحث بالباركود:", error);
      toast.error("حدث خطأ أثناء البحث بالباركود");
    }
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
           invoiceType="purchase_return"
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
               invoiceType="purchase_return"
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
