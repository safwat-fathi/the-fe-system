"use client";

import { useEffect, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import QRCode from "react-qr-code";

import {
  API_BASE_URL,
  API_ENDPOINTS,
  fetchData,
  fetchGoldPrice,
  apiFetch,
} from "@/utilities/api";

const { CREATE_INVOICE_DTL } = API_ENDPOINTS;

import "bootstrap-icons/font/bootstrap-icons.css";
import toast from "react-hot-toast";

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
  karat: string;
  item_weight?: number;
  item_g_weight?: number;
  stones?: string;
  purity?: string;
  work_price?: number;
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
      qty: 0,
      weight: 0,
      g_weight: 0,
      karat: "",
      price: 0,
      price_w: 0,
      note: "",
      trans_type: 2,
      G875: "",
      total: 0,
      total_w: 0,
      total_a: 0,
      inv_note: "",
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
  const [payType, setPayType] = useState<number>(1);
  const [goldPrice, setGoldPrice] = useState<number | null>(null);
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

          return {
            ...updated,
            total_a: updated.g_weight * updated.price,
            total_w: updated.g_weight * updated.price_w,
            total:
              updated.g_weight * updated.price +
              updated.g_weight * updated.price_w -
              (updated.item_disc_amt ?? 0),
          };
        }),
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
    const response = await fetchData<{ results: Item[] }>(
      `${API_BASE_URL}GetItemsList/`,
    );

    if (response && Array.isArray(response.results)) {
      setItems(response.results);
    } else {
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
    console.log("العملاء:", response);
  }

  const totalAmount = invoiceItems.reduce((sum, item) => {
    const totalA = item.g_weight * item.price;
    const totalW = item.g_weight * (item.price_w ?? 0);
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
  const taxAmount = totalAmount * 0.15;
  const netAmount = totalAmount + taxAmount;
  const totalDiscount = invoiceItems.reduce(
    (sum, item) => sum + (item.item_disc_amt ?? 0),
    0,
  );

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

    const invQR = generateZatcaQR({
      sellerName: "شركة ثمار الصفاء المتميزة التجارية",
      vatNumber: "311452959900003",
      timestamp: invoiceDate,
      totalWithVat: netAmount.toFixed(2),
      vatTotal: taxAmount.toFixed(2),
    });

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
      inv_QR: invQR,
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
          id: row.id,
          trans_type: row.trans_type ?? 2,
          G875: row.G875 ?? "",
          qty: row.qty,
          stones: row.stones ?? "",
          price: row.price,
          price_w: row.price_w,
          weight: row.weight,
          g_weight: row.g_weight ?? 0,
          total:
            row.total ??
            row.g_weight * row.price +
              row.g_weight * row.price_w -
              (row.item_disc_amt ?? 0),
          total_w: row.total_w ?? row.g_weight * row.price_w,
          total_a: row.total_a ?? row.g_weight * row.price,
          inv_note: row.note || "",
          tax: row.tax ?? 0,
          tax_prc: row.tax_prc ?? 15,
          item_disc_prc: row.item_disc_prc ?? 0,
          item_disc_amt: row.item_disc_amt ?? 0,
          sn: row.sn ?? "",
          item_desc: row.item_name,
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

        console.log(`📦 تفاصيل السطر ${index + 1}:`);
        console.table(dtl);

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
    } catch (err) {
      console.error("❌ خطأ أثناء الحفظ:", err);
      toast.error("حدث خطأ أثناء حفظ الفاتورة");
    }
  };

  const previewInvoice = () => {
    if (!selectedCustomer) return toast.error("يرجى اختيار العميل");

    const previewWindow = window.open(
      "",
      "InvoicePreview",
      "width=850,height=1000",
    );

    if (!previewWindow) return toast.error("تعذر فتح نافذة المعاينة");

    const customer = customers.find((c) => c.id === selectedCustomer);
    const invQR = generateZatcaQR({
      sellerName: "شركة ثمار الصفاء المتميزة التجارية",
      vatNumber: "311452959900003",
      timestamp: invoiceDate,
      totalWithVat: netAmount.toFixed(2),
      vatTotal: taxAmount.toFixed(2),
    });
    const qrMarkup = renderToStaticMarkup(<QRCode size={120} value={invQR} />);
    const rowsHtml = invoiceItems
      .map((item, index) => {
        let rowTotal = 0;

        if (payType === 1) {
          rowTotal = item.g_weight * item.price;
        } else if (payType === 2) {
          rowTotal = item.g_weight * (item.price_w ?? 0);
        } else {
          rowTotal =
            item.g_weight * item.price + item.g_weight * (item.price_w ?? 0);
        }
        const tax = (rowTotal - (item.item_disc_amt ?? 0)) * 0.15;
        const total = rowTotal - (item.item_disc_amt ?? 0) + tax;

        return `
      <tr>
        <td>${index + 1}</td>
        <td>${item.item_name || ""}</td>
        ${payType !== 1 ? `<td>${item.qty}</td>` : ""}
        ${payType !== 2 ? `<td>${item.weight.toFixed(2)}</td>` : ""}
        <td>${item.karat}</td>
        <td>${item.price.toFixed(2)}</td>
        <td>15%</td>
        <td>${tax.toFixed(2)}</td>
        <td>${(rowTotal - (item.item_disc_amt ?? 0)).toFixed(2)}</td>
        <td>${total.toFixed(2)}</td>
      </tr>`;
      })
      .join("");

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
        .qr { text-align: center; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">فاتورة ضريبية</div>
      <div class="qr">${qrMarkup}</div>
      <div class="section">
        <p>العميل: ${customer?.cust_name || ""}</p>
        <p>التاريخ: ${new Date(invoiceDate).toLocaleDateString("ar-EG")}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>اسم الصنف</th>
            ${payType !== 1 ? "<th>العدد</th>" : ""}
            ${payType !== 2 ? "<th>الوزن</th>" : ""}
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
      formattedDateTime={formattedDateTime}
      invoiceNumber={invoiceNumber}
      netAmount={netAmount}
      previewInvoice={previewInvoice}
      saveInvoice={saveInvoice}
      taxAmount={taxAmount}
      totalAmount={totalAmount}
      totalDiscount={totalDiscount}
    >
      <InvoiceSelectors
        customers={customers}
        employee={employee}
        goldPrice={goldPrice}
        handlingMethod={handlingMethod}
        mobileMethod={mobileMethod}
        note={note}
        payType={payType}
        paymentMethod={paymentMethod}
        referenceNumber={referenceNumber}
        selectedCustomer={selectedCustomer}
        setEmployee={setEmployee}
        setHandlingMethod={setHandlingMethod}
        setMobileMethod={setMobileMethod}
        setNote={setNote}
        setPayType={setPayType}
        setPaymentMethod={setPaymentMethod}
        setReferenceNumber={setReferenceNumber}
        setSelectedCustomer={setSelectedCustomer}
        setVatNumber={setVatNumber}
        vatNumber={vatNumber}
      />
      <InvoiceItemTable
        goldPrice={goldPrice}
        invoiceItems={invoiceItems}
        items={items}
        payType={payType}
        setInvoiceItems={setInvoiceItems}
        setItems={setItems}
      />
    </InvoiceTotalsActions>
  );
}
