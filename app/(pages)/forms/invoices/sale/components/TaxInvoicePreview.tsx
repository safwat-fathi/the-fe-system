import { renderToStaticMarkup } from "react-dom/server";
import QRCode from "react-qr-code";
import writtenNumber from "written-number";

interface Item {
  item_name: string;
  qty: number;
  weight: number;
  price: number;
  price_w?: number;
  item_disc_amt?: number;
  k?: string;
}

interface Customer {
  cust_name: string;
  mobile?: string;
  address?: string;
}

interface InvoicePreviewProps {
  items: Item[];
  customer?: Customer;
  companyAName: string;
  companyLName: string;
  addressA: string;
  addressL: string;
  signImg: string;
  footerText?: string;
  invoiceNumber: number;
  invoiceDate: string;
  invQR: string;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  payType: number;
  frac: number;
  frac2: number;
}

writtenNumber.defaults.lang = "ar";

function formatAmountInWords(amount: number): string {
  const integer = Math.floor(amount);
  const fraction = Math.round((amount - integer) * 100);
  const words = `${writtenNumber(integer)} ريال${fraction > 0 ? ` و ${writtenNumber(fraction)} هللة` : ""} فقط لا غير`;

  return words;
}

export function renderInvoicePreview(data: InvoicePreviewProps) {
  const {
    items,
    customer,
    companyAName,
    companyLName,
    addressA,
    addressL,
    signImg,
    footerText,
    invoiceNumber,
    invoiceDate,
    invQR,
    totalAmount,
    taxAmount,
    netAmount,
    payType,
    frac,
    frac2,
  } = data;

  const formattedDate = new Date(invoiceDate).toLocaleDateString("ar-EG");
  const formattedTime = new Date(invoiceDate).toLocaleTimeString("ar-EG");
  const qrMarkup = renderToStaticMarkup(<QRCode size={120} value={invQR} />);
  const netAmountInWords = formatAmountInWords(netAmount);

  const rowsHtml = items
    .map((item, index) => {
      let rowTotal = 0;

      if (payType === 1) rowTotal = item.weight * item.price;
      else if (payType === 2) rowTotal = item.qty * (item.price_w ?? 0);
      else rowTotal = item.weight * item.price + item.qty * (item.price_w ?? 0);

      const discount = item.item_disc_amt ?? 0;
      const tax = (rowTotal - discount) * 0.15;
      const total = rowTotal - discount + tax;

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${item.item_name}</td>
          ${payType !== 1 ? `<td>${item.qty}</td>` : ""}
          ${payType !== 2 ? `<td>${item.weight.toFixed(frac2)}</td>` : ""}
          <td>${item.k ?? ""}</td>
          <td>${item.price.toFixed(frac)}</td>
          <td>15%</td>
          <td>${tax.toFixed(frac)}</td>
          <td>${(rowTotal - discount).toFixed(frac)}</td>
          <td>${total.toFixed(frac)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <html dir="rtl">
    <head>
      <title>معاينة الفاتورة</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo&display=swap" rel="stylesheet" />
      <style>
        body { font-family: 'Cairo', sans-serif; margin: 40px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #333; padding: 6px; font-size: 12px; text-align: center; }
        .inv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .inv-header .left { direction: ltr; text-align: left; }
        .inv-header .right { text-align: right; }
        .inv-header .center { flex: 0 0 150px; text-align: center; }
        .inv-header img { max-height: 100px; }
        .comp-name { font-weight: bold; }
        .header-title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; }
        .section { margin-top: 12px; }
        .qr { text-align: center; margin-top: 10px; }
        .footer { border-top: 2px solid #000; margin-top: 30px; text-align: center; padding-top: 8px; font-size: 12px; }
        .summary-row td { text-align: left; font-weight: bold; font-size: 14px; padding-top: 10px; }
        .summary-value { text-align: center; font-weight: bold; font-size: 14px; }
        .actions { margin-top: 20px; text-align: center; }
        .actions button { margin: 5px; padding: 8px 16px; font-size: 14px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div id="invoice-content">
        <div class="inv-header">
          <div class="right">
            <div class="comp-name">${companyAName}</div>
            <div>${addressA}</div>
          </div>
          <div class="center"><img src="${signImg}" alt="sign" /></div>
          <div class="left">
            <div class="comp-name">${companyLName}</div>
            <div>${addressL}</div>
          </div>
        </div>

        <div class="header-title">فاتورة ضريبية</div>

        <div class="section">
          <p>رقم الفاتورة: ${invoiceNumber}</p>
          <p>التاريخ: ${formattedDate}</p>
          <p>الوقت: ${formattedTime}</p>
          <p>العميل: ${customer?.cust_name ?? ""}</p>
          ${customer?.mobile ? `<p>رقم الجوال: ${customer.mobile}</p>` : ""}
          ${customer?.address ? `<p>العنوان: ${customer.address}</p>` : ""}
        </div>

        <div class="qr">${qrMarkup}</div>

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
              <th>الإجمالي بدون ضريبة</th>
              <th>الإجمالي مع الضريبة</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="summary-row"><td colspan="8">الإجمالي</td><td class="summary-value">${totalAmount.toFixed(frac)}</td></tr>
            <tr class="summary-row"><td colspan="8">قيمة الضريبة (15%)</td><td class="summary-value">${taxAmount.toFixed(frac)}</td></tr>
            <tr class="summary-row"><td colspan="8">الإجمالي شامل الضريبة</td><td class="summary-value">${netAmount.toFixed(frac)}</td></tr>
            <tr class="summary-row"><td colspan="9">${netAmountInWords}</td></tr>
          </tbody>
        </table>

        <div class="footer">${footerText ?? ""}</div>
      </div>

      <div class="actions">
        <button onclick="window.print()">🖨️ طباعة</button>
        <button onclick="html2pdf().from(document.getElementById('invoice-content')).save('invoice_${invoiceNumber}.pdf')">📄 تصدير PDF</button>
      </div>
    </body>
    </html>
  `;
}
