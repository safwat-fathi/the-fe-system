"use client";

import { formatAmount } from "@/utilities/formatAmount";
import { RiyalIcon } from "@/components/RiyalIcon";

interface InvoicePreviewProps {
  invoiceNumber: number;
  invoiceDate: string;
  customer: any;
  items: any[];
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  totalDiscount: number;
  paymentMethod: string;
  payType: number;
  note: string;
  handlingMethod: string;
  mobileMethod: string;
  referenceNumber: string;
  vatNumber: string;
  crNo: string;
  gov: string;
  city: string;
  area: string;
  street: string;
  buildNo: string;
  postNo: string;
  postCode: string;
  employee: string;
  goldPrice: number | null;
  trans_type: number;
}

export function renderInvoicePreview(props: InvoicePreviewProps) {
  const {
    invoiceNumber,
    invoiceDate,
    customer,
    items,
    totalAmount,
    taxAmount,
    netAmount,
    totalDiscount,
    paymentMethod,
    payType,
    note,
    handlingMethod,
    mobileMethod,
    referenceNumber,
    vatNumber,
    crNo,
    gov,
    city,
    area,
    street,
    buildNo,
    postNo,
    postCode,
    employee,
    goldPrice,
    trans_type,
  } = props;

  const newWindow = window.open("", "_blank", "width=800,height=600");
  if (!newWindow) return;

  const getPayTypeText = (type: number) => {
    switch (type) {
      case 1:
        return "القيمة";
      case 2:
        return "الأجور";
      case 3:
        return "قيمة وأجور";
      default:
        return "";
    }
  };

  const getEmployeeName = (emp: string) => {
    switch (emp) {
      case "hashem":
        return "هاشم";
      case "othman":
        return "عثمان";
      default:
        return "";
    }
  };

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة شراء ذهب - ${invoiceNumber}</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
                direction: rtl;
            }
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin-bottom: 10px;
            }
            .invoice-title {
                font-size: 20px;
                color: #666;
                margin-bottom: 10px;
            }
            .invoice-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            .info-section {
                flex: 1;
            }
            .info-section h3 {
                margin: 0 0 10px 0;
                color: #333;
                font-size: 16px;
            }
            .info-item {
                margin: 5px 0;
                font-size: 14px;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .items-table th,
            .items-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: center;
                font-size: 12px;
            }
            .items-table th {
                background-color: #f8f9fa;
                font-weight: bold;
            }
            .totals-section {
                margin-top: 30px;
                text-align: left;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
                font-size: 14px;
            }
            .total-row.final {
                font-weight: bold;
                font-size: 16px;
                border-top: 2px solid #333;
                padding-top: 10px;
                margin-top: 10px;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #666;
            }
            @media print {
                body {
                    background-color: white;
                }
                .invoice-container {
                    box-shadow: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="header">
                <div class="company-name">شركة ثمار الصفاء المتميزة التجارية</div>
                <div class="invoice-title">فاتورة شراء ذهب</div>
                <div>رقم الفاتورة: ${invoiceNumber}</div>
                <div>التاريخ: ${invoiceDate}</div>
            </div>

            <div class="invoice-info">
                <div class="info-section">
                    <h3>معلومات المورد:</h3>
                    <div class="info-item">الاسم: ${customer?.cust_name || ""}</div>
                    <div class="info-item">الرمز: ${customer?.cust_code || ""}</div>
                    <div class="info-item">الرقم الضريبي: ${vatNumber || ""}</div>
                    <div class="info-item">الجوال: ${mobileMethod || ""}</div>
                    <div class="info-item">المناولة: ${handlingMethod || ""}</div>
                </div>
                <div class="info-section">
                    <h3>معلومات الفاتورة:</h3>
                    <div class="info-item">طريقة الدفع: ${paymentMethod === "cash" ? "نقداً" : "أجل"}</div>
                    <div class="info-item">نوع الدفع: ${getPayTypeText(payType)}</div>
                    <div class="info-item">البائع: ${getEmployeeName(employee)}</div>
                    <div class="info-item">سعر الذهب: ${goldPrice} ﷼</div>
                    <div class="info-item">المرجع: ${referenceNumber || ""}</div>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>الصنف</th>
                        <th>الوزن</th>
                        <th>العيار</th>
                        <th>سعر الجرام</th>
                        <th>أجرة الجرام</th>
                        <th>إجمالي القيمة</th>
                        <th>إجمالي الأجور</th>
                        <th>الخصم</th>
                        <th>الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${items
                      .map(
                        (item) => `
                        <tr>
                            <td>${item.item_code || ""}</td>
                            <td>${item.weight || 0}</td>
                            <td>${item.purity || ""}</td>
                            <td>${item.price || 0}</td>
                            <td>${item.price_w || 0}</td>
                            <td>${item.total || 0}</td>
                            <td>${item.total_w || 0}</td>
                            <td>${item.item_disc_amt || 0}</td>
                            <td>${item.total_a || 0}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>

            <div class="totals-section">
                <div class="total-row">
                    <span>إجمالي المبلغ:</span>
                    <span>${formatAmount(totalAmount)} ﷼</span>
                </div>
                <div class="total-row">
                    <span>إجمالي الخصم:</span>
                    <span>${formatAmount(totalDiscount)} ﷼</span>
                </div>
                <div class="total-row">
                    <span>الضريبة (15%):</span>
                    <span>${formatAmount(taxAmount)} ﷼</span>
                </div>
                <div class="total-row final">
                    <span>الإجمالي النهائي:</span>
                    <span>${formatAmount(netAmount)} ﷼</span>
                </div>
            </div>

            <div class="footer">
                <p>شكراً لتعاملكم معنا</p>
                <p>هذه فاتورة شراء ذهب - نوع المعاملة: ${trans_type}</p>
            </div>
        </div>
    </body>
    </html>
  `;

  newWindow.document.write(html);
  newWindow.document.close();
}
