"use client";

import { useEffect, useState } from "react";
import {
  API_BASE_URL,
  API_ENDPOINTS,
  fetchData,
  fetchGoldPrice,
} from "@/utilities/api";

const { CREATE_INVOICE_DTL } = API_ENDPOINTS;
import "bootstrap-icons/font/bootstrap-icons.css";
import toast from "react-hot-toast";
import InvoiceSelectors from "@/components/InvoiceSelectors";
import InvoiceItemTable from "@/components/InvoiceItemTable";
import InvoiceTotalsActions from "@/components/InvoiceTotalsActions";
import type { InvoiceItem } from "@/types/invoice-item";


interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_price: number;
  karat: string;
  
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

export default function InvoicePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<number>(1);
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    {
      id: Date.now(),
      item_id: null,
      item_code: "",
      quantity: 1,
      weight: 0,
      karat: "",
      price_per_gram: 0,
      discount: 0,
      note: "",
    },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [employee, setEmployee] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [handlingMethod, setHandlingMethod] = useState<string>("");
  const [mobileMethod, setMobileMethod] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [vatNumber, setVatNumber] = useState<string>("");
  const [payType, setPayType] = useState<number>(1);
  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const selectedCust = customers.find(c => c.id === selectedCustomer);

  useEffect(() => {
    if (goldPrice !== null) {
      setInvoiceItems(items =>
        items.map(itm => ({
          ...itm,
          price_per_gram: itm.price_per_gram || goldPrice,
        }))
      );
    }
  }, [goldPrice]);

  useEffect(() => {
    fetchItems();
    fetchCustomers();
    if (typeof window !== "undefined") {
      const now = new Date();
      setInvoiceDate(now.toISOString());
    }
    getGoldPrice();
    getNextInvoiceNumber().then(setInvoiceNumber);
  }, []);

  useEffect(() => {
    setSelectedCustomer(null);
  }, [paymentMethod]);

  const getGoldPrice = async () => {
  const price = await fetchGoldPrice();
  setGoldPrice(price);
  };

  async function fetchItems() {
    const response = await fetchData<{ results: Item[] }>(`${API_BASE_URL}GetItemsList/`);

    if (response && Array.isArray(response.results)) {
      setItems(response.results);
    } else {
      setItems([]);
    }
  }


  async function fetchCustomers() {
    const response = await fetchData<Customer[]>(`${API_BASE_URL}customers_list`);

    if (response) {
      setCustomers(response);
    } else {
      setCustomers([]);
    }
    console.log("العملاء:", response);

  }




  const totalAmount = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.price_per_gram), 0);
  const taxAmount = totalAmount * 0.15;
  const netAmount = totalAmount + taxAmount;

  const formattedDateTime = new Date(invoiceDate).toLocaleString("ar-EG", {
    dateStyle: "short",
    timeStyle: "short",
  });

const getNextInvoiceNumber = async (): Promise<number> => {
  const invoices = await fetchData<any[]>(`${API_BASE_URL}invoices_list`);
  if (!Array.isArray(invoices) || invoices.length === 0) return 1000;

  const maxInvId = invoices.reduce((max, curr) => {
    return curr.inv_id > max ? curr.inv_id : max;
  }, 1000);

  return maxInvId + 1;
};

const saveInvoice = async () => {
  if (!selectedCustomer) return toast.error("يرجى اختيار العميل");

  const validItems = invoiceItems.filter((itm) => itm.item_id);
  if (validItems.length === 0) {
    return toast.error("يرجى إدخال تفاصيل الفاتورة");
  }

  const generatedInvId = await getNextInvoiceNumber();
  setInvoiceNumber(generatedInvId);

  const employeeMap: Record<string, number> = {
    hashem: 1,
    othman: 2,
  };

  const invData = {
  inv_id: generatedInvId,
  inv_date: invoiceDate,
  cust: selectedCustomer,
  cust_name: selectedCust?.cust_name || null,
  cust_code: selectedCust?.cust_code || null,
  inv_amt: Math.round(netAmount),
  inv_net: Math.round(totalAmount), 
  tax: taxAmount.toFixed(2),
  inv_status: 1,
  trans_type: 2,
  cr_date: invoiceDate,
  inv_type: paymentMethod === "cash" ? 1 : 2,
  emp_id: employeeMap[employee] || null,
  inv_notes: note || null,
  handling: handlingMethod || null,
  mobile: mobileMethod || null,
  ref_no: referenceNumber || null,
  print: true,
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
  cr_no: selectedCust?.cr_no || null,
  gov: selectedCust?.gov || null,
  city: selectedCust?.city || null,
  area: selectedCust?.area || null,
  street: selectedCust?.street || null,
  build_no: selectedCust?.build_no || null,
  post_no: selectedCust?.post_no || null,
  post_code: selectedCust?.post_code || null,

};

  console.log("🚀 بيانات الفاتورة:");
  console.table(invData);

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

    for (const [index, row] of validItems.entries()) {
      if (!row.item_id) continue;

      const dtl = {
        inv: invPk,
        item: row.item_id,
        item_desc: row.item_name,
        item_qty: row.quantity,
        item_price: row.price_per_gram,
        inv_tax: 15,
        tax_amt: parseFloat((row.quantity * row.price_per_gram * 0.15).toFixed(2)),
        inv_status: 1,
        cr_date: invoiceDate,
        inv_notes: row.note || null,
      };

      console.log(`📦 تفاصيل السطر ${index + 1}:`);
      console.table(dtl);

      const dtlRes = await fetch(CREATE_INVOICE_DTL, {
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
  } catch (err) {
    console.error("❌ خطأ أثناء الحفظ:", err);
    toast.error("حدث خطأ أثناء حفظ الفاتورة");
  }
};


  const previewInvoice = () => {
  if (!selectedCustomer) return toast.error("يرجى اختيار العميل");

  const previewWindow = window.open("", "InvoicePreview", "width=850,height=1000");

  if (!previewWindow) return toast.error("تعذر فتح نافذة المعاينة");

  const customer = customers.find((c) => c.id === selectedCustomer);
  const rowsHtml = invoiceItems.map((item, index) => {
    const totalBeforeTax = item.weight * item.price_per_gram;
    const tax = (totalBeforeTax - item.discount) * 0.15;
    const total = totalBeforeTax - item.discount + tax;
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${item.item_name || ""}</td>
        <td>${item.quantity}</td>
        <td>${item.weight.toFixed(2)}</td>
        <td>${item.karat}</td>
        <td>${item.price_per_gram.toFixed(2)}</td>
        <td>15%</td>
        <td>${tax.toFixed(2)}</td>
        <td>${(totalBeforeTax - item.discount).toFixed(2)}</td>
        <td>${total.toFixed(2)}</td>
      </tr>
    `;
  }).join("");

  const htmlContent = `
    <html dir="rtl">
    <head>
      <title>معاينة الفاتورة</title>
      <style>
        body { font-family: Arial; margin: 40px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #333; padding: 6px; font-size: 12px; text-align: center; }
        .header { text-align: center; font-size: 18px; font-weight: bold; }
        .section { margin-top: 20px; }
        .totals { margin-top: 20px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">فاتورة ضريبية</div>
      <div class="section">
        <p>العميل: ${customer?.cust_name || ""}</p>
        <p>التاريخ: ${new Date(invoiceDate).toLocaleDateString("ar-EG")}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>اسم الصنف</th>
            <th>العدد</th>
            <th>الوزن</th>
            <th>العيار</th>
            <th>سعر الجرام</th>
            <th>الضريبة</th>
            <th>قيمة الضريبة</th>
            <th>الصافي</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="totals">
        <p>الإجمالي غير شامل الضريبة: ${totalAmount.toFixed(2)}</p>
        <p>الضريبة (15%): ${taxAmount.toFixed(2)}</p>
        <p><strong>الصافي: ${netAmount.toFixed(2)} ريال</strong></p>
      </div>
    </body>
    </html>
  `;

  previewWindow.document.write(htmlContent);
  previewWindow.document.close();
};


  return (
    <InvoiceTotalsActions
      invoiceNumber={invoiceNumber}
      formattedDateTime={formattedDateTime}
      saveInvoice={saveInvoice}
      previewInvoice={previewInvoice}
      totalAmount={totalAmount}
      taxAmount={taxAmount}
      netAmount={netAmount}
    >
      <InvoiceSelectors
        customers={customers}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        payType={payType}
        setPayType={setPayType}
        referenceNumber={referenceNumber}
        setReferenceNumber={setReferenceNumber}
        vatNumber={vatNumber}
        setVatNumber={setVatNumber}
        handlingMethod={handlingMethod}
        setHandlingMethod={setHandlingMethod}
        mobileMethod={mobileMethod}
        setMobileMethod={setMobileMethod}
        employee={employee}
        setEmployee={setEmployee}
        goldPrice={goldPrice}
        note={note}
        setNote={setNote}
      />
      <InvoiceItemTable
        items={items}
        setItems={setItems}
        invoiceItems={invoiceItems}
        setInvoiceItems={setInvoiceItems}
        goldPrice={goldPrice}
      />
    </InvoiceTotalsActions>
  );
}
