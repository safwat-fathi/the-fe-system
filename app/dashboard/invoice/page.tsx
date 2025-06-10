"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { API_BASE_URL, fetchData ,fetchGoldPrice} from "@/utilities/api";
import QRCode from "react-qr-code";
import "bootstrap-icons/font/bootstrap-icons.css";
import toast from "react-hot-toast";
import ReactSelect from "react-select";
import CreatableSelect from "react-select/creatable";


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
  vat_no?: string;
  address?: string;
  mobile?: string;
  acc?: number;
  handling?: string;
  cr_no?: string;
  gov?: string;
  city?: string;
  area?: string;
  street?: string;
  build_no?: string;
  post_no?: string;
  post_code?: string;
}

interface InvoiceItem {
  item_id: number | null;
  item_name?: string;
  quantity: number;
  weight: number;
  karat: string;
  price_per_gram: number;
  discount: number;
  note: string;
}


export default function InvoicePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [qrValue, setQrValue] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<number>(1);
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([{
    item_id: null,
    quantity: 1,
    weight: 0,
    karat: "",
    price_per_gram: 0,
    discount: 0,
    note: "",
  }]);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [deliveryType, setDeliveryType] = useState<string>("");
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
    fetchItems();
    fetchCustomers();
    const now = new Date();
    // setInvoiceDate(now.toISOString());
    if (typeof window !== "undefined") {
      const now = new Date();
      setInvoiceDate(now.toISOString());
    }
    getGoldPrice();
  }, []);

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


const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
  const updated = [...invoiceItems] as InvoiceItem[];

  if (field === "item_id") {
    updated[index][field] = parseInt(value) as never;
  } else if (
    field === "weight" ||
    field === "quantity" ||
    field === "price_per_gram" ||
    field === "discount"
  ) {
    updated[index][field] = parseFloat(value) as never;
  } else {
    updated[index][field] = value as never;
  }

  setInvoiceItems(updated);
};

function handleFieldChange(index: number, field: keyof InvoiceItem, value: any) {
  const updated = [...invoiceItems];

  if (["weight", "price_per_gram", "quantity", "discount"].includes(field)) {
    updated[index][field] = parseFloat(value) || 0;
  } else {
    updated[index][field] = value;
  }

  setInvoiceItems(updated);

  // ✅ إضافة سطر تلقائي إذا المستخدم وصل لنهاية الجدول وبدأ يعبّي
  const isLastRow = index === invoiceItems.length - 1;
  const isRowFilled =
    updated[index].item_id || updated[index].item_name || updated[index].weight > 0;

  if (isLastRow && isRowFilled) {
    setInvoiceItems([
      ...updated,
      {
        item_id: null,
        quantity: 1,
        weight: 0,
        karat: "",
        price_per_gram: 0,
        discount: 0,
        note: "",
      },
    ]);
  }
}

  const addRow = () => {
    setInvoiceItems([
  ...invoiceItems,
  {
    item_id: null,
    quantity: 1,
    weight: 0,
    karat: "",
    price_per_gram: 0,
    discount: 0,
    note: "",
  },
]);

  };

  const removeRow = (index: number) => {
    const updated = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(updated);
  };

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

  const generatedInvId = await getNextInvoiceNumber();

  const employeeMap: Record<string, number> = {
    hashem: 1,
    othman: 2,
  };

  const invData = {
  inv_id: generatedInvId,
  inv_date: invoiceDate,         
  cust_id: selectedCustomer,
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
    const invId = result.id;

    for (const [index, row] of invoiceItems.entries()) {
      if (!row.item_id) continue;

      const dtl = {
        inv_id: invId,
        item_id: row.item_id,
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

      const dtlRes = await fetch(`${API_BASE_URL}api_create_invoices_dtl`, {
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
    <div className="p-6 max-w-[1500px] mx-auto bg-white rounded shadow">
<div className="flex justify-between items-center border-b pb-3 mb-6">
  <div className="flex items-center gap-4">
    <span className="text-lg font-bold text-black-400">فاتورة</span>
    <span className="text-lg font-bold">#{invoiceNumber}</span>
    <span className="text-sm text-gray-400">{formattedDateTime}</span>
  </div>
<div className="flex items-center gap-2">
  <Button
    onClick={saveInvoice}
    className="bg-green-600 text-white hover:bg-green-700 px-2 py-1 text-sm rounded"
  >
    <i className="bi bi-save me-2"></i> حفظ الفاتورة
  </Button>
  <Button
    onClick={() => window.location.reload()}
    className="bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 text-sm rounded"
  >
    <i className="bi bi-file-earmark-plus me-2"></i> فاتورة جديدة
  </Button>
  <Button
    onClick={previewInvoice}
    className="bg-gray-600 text-white hover:bg-gray-700 px-2 py-1 text-sm rounded"
  >
    <i className="bi bi-eye me-2"></i> معاينة الفاتورة
  </Button>
</div>

</div>
<div className="grid grid-cols-12 gap-2 text-sm mb-4">
  <div className="col-span-4">
    <label className="block mb-1">العميل:</label>
    <ReactSelect
      instanceId="customer-select"
      className="w-full text-sm"
      classNamePrefix="react-select"
      isSearchable
      options={customers.map((cust) => ({
        value: cust.id,
        label: cust.cust_name,
      }))}
      value={
        selectedCustomer
          ? {
              value: selectedCustomer,
              label:
                customers.find((c) => c.id === selectedCustomer)?.cust_name ||
                `عميل رقم ${selectedCustomer}`,
            }
          : null
      }
      onChange={(selectedOption) => {
        setSelectedCustomer(selectedOption?.value ?? null);

        const selectedCust = customers.find((c) => c.id === selectedOption?.value);

        if (selectedCust) {
          if (selectedCust.mobile) setMobileMethod(selectedCust.mobile);
          if (selectedCust.acc) setHandlingMethod(selectedCust.handling.toString());
          if (selectedCust.vat_no) setVatNumber(selectedCust.vat_no);
        }
      }}
      placeholder="اختر العميل..."
      styles={{
        control: (base) => ({ ...base, height: 38, minHeight: 38 }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      }}
      menuPortalTarget={typeof window !== "undefined" ? document.body : null}
      menuPosition="fixed"
      components={{ IndicatorSeparator: () => null }}
    />
  </div>


  <div className="col-span-4">
    <label className="block mb-1">طريقة الدفع:</label>
    <div className="w-full h-[38px] border rounded flex items-center justify-around px-2">
      <label className="flex items-center gap-1">
        <input
          type="radio"
          name="payment"
          value="cash"
          checked={paymentMethod === "cash"}
          onChange={(e) => setPaymentMethod(e.target.value)}
        />
        نقداً
      </label>
      <label className="flex items-center gap-1">
        <input
          type="radio"
          name="payment"
          value="credit"
          checked={paymentMethod === "credit"}
          onChange={(e) => setPaymentMethod(e.target.value)}
        />
        أجل
      </label>
    </div>
  </div>

  <div className="col-span-4">
  <label className="block mb-1">على:</label>
  <select
    className="w-full h-[38px] border px-2 rounded"
    value={payType}
    onChange={(e) => setPayType(parseInt(e.target.value))}
  >
    <option value={1}>القيمة</option>
    <option value={2}>الأجور</option>
    <option value={3}>قيمة وأجور</option>
  </select>
</div>

  <div className="col-span-4">
    <label className="block mb-1">رقم المرجع:</label>
    <input
      type="text"
      className="w-full h-[38px] border px-2 rounded"
      value={referenceNumber}
      onChange={(e) => setReferenceNumber(e.target.value)}
      placeholder=" المرجع "
    />
  </div>

  <div className="col-span-4">
    <label className="block mb-1">الرقم الضريبي:</label>
    <input
      type="text"
      className="w-full h-[38px] border px-2 rounded"
      value={vatNumber}
      readOnly
      placeholder="الرقم الضريبي"
    />
  </div>
    
  <div className="col-span-4">
    <label className="block mb-1">مناولة:</label>
    <input
      type="text"
      className="w-full h-[38px] border px-2 rounded"
      value={handlingMethod}
      onChange={(e) => setHandlingMethod(e.target.value)}
      placeholder="مناولة"
    />
  </div>

  <div className="col-span-4">
    <label className="block mb-1">جوال:</label>
    <input
      type="text"
      className="w-full h-[38px] border px-2 rounded"
      value={mobileMethod}
      onChange={(e) => setMobileMethod(e.target.value)}
      placeholder=" الجوال"
    />
  </div>

  <div className="col-span-4">
    <label className="block mb-1">البائع:</label>
    <select
      className="w-full h-[38px] border px-2 rounded"
      value={employee}
      onChange={(e) => setEmployee(e.target.value)}
    >
      <option value="">-- اختر --</option>
      <option value="hashem">هاشم</option>
      <option value="othman">عثمان</option>
    </select>
  </div>

<div className="col-span-4">
  <label className="block mb-1">سعر الذهب بالريال:</label>
  <input
    type="text"
    className="w-full h-[38px] border px-2 rounded bg-gray-100"
    value={goldPrice ? `${goldPrice} ﷼` : "جاري التحميل..."}
    readOnly
  />
</div>

  <div className="col-span-12">
    <label className="block mb-1">البيان:</label>
    <input
      type="text"
      className="w-full h-[38px] border px-2 rounded"
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="البيان"
    />
  </div>

  <div className="col-span-12 text-sm text-gray-700">
  {(() => {
    const cust = customers.find((c) => c.id === selectedCustomer);
    if (!cust) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        {cust.cr_no && <span>السجل: {cust.cr_no}</span>}
        {cust.gov && <span>العنوان: {cust.gov}</span>}
        {cust.city && <span>المدينة: {cust.city}</span>}
        {cust.area && <span>المنطقة: {cust.area}</span>}
        {cust.street && <span>الشارع: {cust.street}</span>}
        {cust.build_no && <span>مبنى: {cust.build_no}</span>}
        {cust.post_no && <span>ص.ب: {cust.post_no}</span>}
        {cust.post_code && <span>الرمز: {cust.post_code}</span>}
      </div>
    );
  })()}
</div>

</div>


      {/* جدول الأصناف */}
<div className="w-full overflow-x-auto mb-6 max-w-full">
  <table className="min-w-[1000px] border text-sm text-center table-fixed">
    <thead className="bg-gray-100 text-xs font-semibold">
      <tr>
        <th className="w-[400px]">اسم الصنف</th>
        <th className="w-[100px]">الوزن القائم</th>
        <th className="w-[100px]">وزن معايير</th>
        <th className="w-[80px]">العيار</th>
        <th className="w-[100px]">سعر الجرام</th>
        <th className="w-[80px]">نسبة الضريبة</th>
        <th className="w-[100px]">الضريبة</th>
        <th className="w-[100px]">المبلغ</th>
        <th className="w-[130px]">الإجمالي شامل الضريبة</th>
        <th className="w-[200px]">البيان</th>
        <th className="w-[40px]"></th>
      </tr>
    </thead>
    <tbody>
      {invoiceItems.map((item, index) => {
        const totalBeforeTax = item.weight * item.price_per_gram;
        const tax = (totalBeforeTax - item.discount) * 0.15;
        const total = totalBeforeTax - item.discount + tax;

        return (
          <tr key={index}>
            <td>
              <CreatableSelect
                instanceId={`item-select-${index}`}
                className="text-xs"
                classNamePrefix="select"
                isSearchable
                isClearable
                isCreatable
                options={items.map((item) => ({
                  value: item.id,
                  label: `${item.item_code} - ${item.item_name}`,
                }))}
                formatCreateLabel={(inputValue) => `إضافة صنف جديد: "${inputValue}"`}
                onCreateOption={(inputValue) => {
                  const newItem = {
                    id: Math.floor(Math.random() * 1000000),
                    item_code: "000000", // أو خليه فارغ حسب الحاجة
                    item_name: inputValue,
                    karat: "",
                    item_price: 0,
                  };
                  setItems((prev) => [...prev, newItem]);
                  const updated = [...invoiceItems];
                  updated[index] = {
                    ...updated[index],
                    item_id: newItem.id,
                    item_name: newItem.item_name,
                    karat: newItem.karat,
                    price_per_gram: newItem.item_price,
                  };
                  setInvoiceItems(updated);
                }}
                onChange={(selectedOption) => {
                  const selected = items.find((itm) => itm.id === selectedOption?.value);
                  const updated = [...invoiceItems];
                  updated[index].item_id = selected?.id ?? null;
                  updated[index].item_name = selected?.item_name ?? "";
                  updated[index].karat = selected?.karat ?? "";
                  updated[index].price_per_gram = selected?.item_price ?? 0;
                  setInvoiceItems(updated);
                }}
                value={
                  item.item_id
                    ? {
                        value: item.item_id,
                        label: `${item.item_id} - ${item.item_name}`,
                      }
                    : null
                }
                placeholder="اختر الصنف..."
                styles={{
                  control: (base) => ({ ...base, minHeight: 30, height: 30 }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                menuPosition="fixed"
                components={{ IndicatorSeparator: () => null }}
              />

            </td>
            <td>
              <input
                type="number"
                className="border w-full p-1 text-xs text-center"

                style={{ minWidth: 0, maxWidth: "100%" }}
                value={item.weight}
                onChange={(e) => handleFieldChange(index, "weight", e.target.value)}
              />
            </td>
            <td>
              <input
                type="number"
                className="border w-full p-1 text-xs text-center"

                style={{ minWidth: 0, maxWidth: "100%" }}
                value={item.quantity}
                onChange={(e) => handleFieldChange(index, "quantity", e.target.value)}
              />
            </td>
            <td>
              <input
                className="border w-full p-1 text-xs text-center"

                style={{ minWidth: 0, maxWidth: "100%" }}
                value={item.karat}
                onChange={(e) => handleFieldChange(index, "karat", e.target.value)}
              />
            </td>
            <td>
              <input
                type="number"
                className="border w-full p-1 text-xs text-center"

                style={{ minWidth: 0, maxWidth: "100%" }}
                value={item.price_per_gram}
                onChange={(e) => handleFieldChange(index, "price_per_gram", e.target.value)}
              />
            </td>
            <td>15%</td>
            <td>{tax.toFixed(2)}</td>
            <td>{(totalBeforeTax - item.discount).toFixed(2)}</td>
            <td>{total.toFixed(2)}</td>
            <td>
              <input
                className="border w-full p-1 text-xs text-center"

                style={{ minWidth: 0, maxWidth: "100%" }}
                value={item.note}
                onChange={(e) => handleFieldChange(index, "note", e.target.value)}
              />
            </td>
            <td>
              <button
                className="text-red-600 font-bold"
                onClick={() => removeRow(index)}
              >
                ×
              </button>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>

<div className="flex justify-between items-center mt-4">

  <div className="flex items-center gap-6 text-sm font-semibold">
    <div className="text-gray-600">
      <span>الإجمالي: </span>
      <span>{totalAmount.toFixed(2)} ﷼</span>
    </div>
    <div className="text-green-500">
      <span>الضريبة: </span>
      <span>{taxAmount.toFixed(2)} ﷼</span>
    </div>
    <div className="text-gray-600 text-base font-bold">
      <span>الصافي: </span>
      <span>{netAmount.toFixed(2)} ﷼</span>
    </div>
  </div>
</div>
    </div>
  );
}
