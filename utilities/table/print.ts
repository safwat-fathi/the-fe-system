import type { Table } from "@tanstack/react-table";

import QRCode from "react-qr-code";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import { InvoiceItemRow } from "../invoiceForm";
import { amountToWords } from "../formatAmount";

import { FormState } from "@/app/[locale]/(pages)/forms/invoices/hooks/useInvoiceForm";
import { TransTypes } from "@/types/models/invoice";

// Collect all rows before pagination (i.e., across all pages) using TanStack Table v8 API.
// Falls back to the current row model if pre‑pagination is unavailable.
export function collectAllRowsPrePagination<T>(table: Table<T>): T[] {
  // Prefer rows before pagination so we can print/export everything regardless of the current page
  const rowModel =
    (table.getPrePaginationRowModel && table.getPrePaginationRowModel()) ||
    table.getRowModel();

  // Use flatRows to include leaf rows even if expansion/grouping is enabled
  const flat = (rowModel as any).flatRows ?? rowModel.rows;

  return flat.map((r: any) => r.original as T);
}

// Build a very simple printable HTML for the current table (all rows pre‑pagination).
// Notes:
// - Only string/number headers are supported. For other header renderers we fallback to column id.
// - Values are pulled via row.getValue(column.id) to respect accessors.
export function buildSimpleTablePrintHtml<T>(
  table: Table<T>,
  opts?: {
    title?: string;
    direction?: "rtl" | "ltr";
    columnIds?: string[]; // optional allowlist & order
  },
): string {
  const title = opts?.title ?? "قائمة";
  const direction = opts?.direction ?? "rtl";

  const allColumnsRaw = table
    .getAllLeafColumns()
    .filter((c) => c.getIsVisible());
  const selected =
    Array.isArray(opts?.columnIds) && opts!.columnIds!.length
      ? opts!
          .columnIds!.map((id) =>
            allColumnsRaw.find((c) => String(c.id) === id),
          )
          .filter(Boolean)
      : allColumnsRaw;

  const headers = selected.map((c) => {
    const raw = c!.columnDef.header as any;

    if (typeof raw === "string") return raw;
    if (typeof raw === "function") {
      try {
        const val = raw({} as any);

        if (typeof val === "string") return val;
      } catch {}
    }

    return typeof c!.id === "string" ? (c!.id as string) : String(c!.id);
  });

  const preRows =
    (table.getPrePaginationRowModel && table.getPrePaginationRowModel()) ||
    table.getRowModel();
  const rows = ((preRows as any).rows ?? (preRows as any).flatRows) as any[];

  const toDateOnly = (val: any): string => {
    const d = new Date(val);

    if (isNaN(d.getTime())) return String(val ?? "");
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
  };

  const isNumericString = (s: string) =>
    /^-?\d+(?:\.\d+)?$/.test(s.replace(/,/g, "").trim());
  const fmtNum = (n: number) => {
    // Match UI: integers no decimals, otherwise 2 fixed decimals
    const frac = Number.isInteger(n) ? 0 : 2;

    return n.toLocaleString("en-US", {
      minimumFractionDigits: frac,
      maximumFractionDigits: frac,
    });
  };

  const bodyHtml = rows
    .map((row: any) => {
      const cells = selected
        .map((col) => {
          const v = row.getValue
            ? row.getValue(col!.id)
            : row.original?.[col!.id];
          let text = "";

          if (v !== null && v !== undefined) {
            if (String(col!.id).includes("date")) {
              text = toDateOnly(v);
            } else if (typeof v === "number") {
              text = fmtNum(v);
            } else if (typeof v === "string") {
              const cleaned = v.replace(/,/g, "").trim();

              if (isNumericString(cleaned)) {
                const num = Number.parseFloat(cleaned);

                text = fmtNum(num);
              } else {
                text = v;
              }
            } else {
              text = String(v);
            }
          }

          return `<td>${escapeHtml(text)}</td>`;
        })
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  const headerHtml = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");

  return `<!doctype html>
<html lang="ar" dir="${direction}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { size: A4; margin: 1cm; }
      body { direction: ${direction}; font-family: 'Cairo', system-ui, -apple-system, Segoe UI, Tahoma, sans-serif; color: #000; }
      h1 { font-size: 16px; margin: 0 0 8px 0; text-align: center; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #000; padding: 6px 8px; text-align: ${direction === "rtl" ? "right" : "left"}; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      th { background: #f3f4f6; font-weight: 700; }
      /* Default widths optimized for 7 columns (inv_id, inv_date, cust_name, inv_net, tax, inv_amt, type) */
      thead th:nth-child(1), tbody td:nth-child(1) { width: 8%; }
      thead th:nth-child(2), tbody td:nth-child(2) { width: 14%; }
      thead th:nth-child(3), tbody td:nth-child(3) { width: 26%; }
      thead th:nth-child(4), tbody td:nth-child(4) { width: 12%; }
      thead th:nth-child(5), tbody td:nth-child(5) { width: 10%; }
      thead th:nth-child(6), tbody td:nth-child(6) { width: 18%; }
      thead th:nth-child(7), tbody td:nth-child(7) { width: 8%; }
    </style>
  </head>
  <body>

    <table>
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  </body>
  </html>`;
}

function escapeHtml(input: any): string {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function hijriDateTime(date: string): string {
  const d = new Date(date);

  return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

// Convenience: open a new window and print the table contents (all rows pre‑pagination).
export function printTableInNewWindow<T>(
  table: Table<T>,
  opts?: { title?: string; direction?: "rtl" | "ltr"; columnIds?: string[] },
) {
  const html = buildSimpleTablePrintHtml(table, opts);

  const w = window.open(
    "",
    "_blank",
    "width=1024,height=768,scrollbars=yes,resizable=yes",
  );

  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    try {
      w.focus();
      setTimeout(() => {
        w.print();
        w.close();
      }, 100);
    } catch {}
  };
}

// Print translations type
export type PrintTranslations = {
  invoiceTitle: string;
  simpleInvoiceTitle: string;
  invoiceTypes: {
    sale: string;
    salesReturn: string;
    purchase: string;
    purchaseReturn: string;
  };
  header: {
    phone: string;
    crNumber: string;
    metalLicense: string;
    mobile: string;
    forGoldJewellery: string;
  };
  customer: {
    vatNumber: string;
    customerCode: string;
    customerName: string;
    mobile: string;
    area: string;
    street: string;
    postalCode: string;
    city: string;
    building: string;
    crNumber: string;
  };
  invoice: {
    invoiceNumber: string;
    reference: string;
    invoiceDate: string;
    hijriDate: string;
  };
  columns: {
    description: string;
    quantity: string;
    weight: string;
    calibration: string;
    stoneWeight: string;
    price: string;
    taxAmount: string;
    taxRate: string;
    total: string;
  };
  totals: {
    total: string;
    discount: string;
    beforeTax: string;
    vat: string;
    netAmount: string;
  };
  footer: {
    countryEn: string;
    countryAr: string;
    seller: string;
    box: string;
  };
  notSpecified: string;
  notAvailable: string;
  noReference: string;
};

// Helper to determine AM/PM period
const getPeriod = (hours: number, locale: string): string => {
  if (hours >= 12) {
    return locale === "ar" ? "م" : "PM";
  }

  return locale === "ar" ? "ص" : "AM";
};

// Helper to render invoice rows
const renderInvoiceRows = (
  invoiceItems: InvoiceItemRow[],
  fractions: { frac: number; frac2: number },
  isRtl: boolean,
  notSpecified: string,
): string => {
  const { frac, frac2 } = fractions;
  const MIN_ROWS = 15;

  const itemsHtml = invoiceItems
    .map((item, index) => {
      return `
				<tr style="${index % 2 === 0 ? "background-color: #f9fafb;" : ""}">
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.totalBeforeTax).toFixed(frac)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${escapeHtml(`${item.tax_prc} %`)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.tax).toFixed(frac)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.price).toFixed(frac)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.g_weight).toFixed(frac2)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.g_weight).toFixed(frac2)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.weight).toFixed(frac2)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.qty).toFixed(frac2)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: ${isRtl ? "right" : "left"};">${escapeHtml(item.item_desc || item.sn || notSpecified)}</td>
				</tr>
			`;
    })
    .join("");

  const emptyRowsCount = Math.max(0, MIN_ROWS - invoiceItems.length);
  const emptyRowsHtml = Array(emptyRowsCount)
    .fill(null)
    .map((_, index) => {
      const rowIndex = invoiceItems.length + index;

      return `
				<tr style="${rowIndex % 2 === 0 ? "background-color: #f9fafb;" : ""}">
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; height: 24px;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px;">&nbsp;</td>
				</tr>
			`;
    })
    .join("");

  return itemsHtml + emptyRowsHtml;
};

// Helper to get invoice title text
const getInvoiceTitleText = (
  invoiceType: TransTypes,
  t: PrintTranslations,
): string => {
  switch (invoiceType) {
    case TransTypes.SALES_RETURN:
      return t.invoiceTypes.salesReturn;
    case TransTypes.PURCHASE:
      return t.invoiceTypes.purchase;
    case TransTypes.PURCHASE_RETURN:
      return t.invoiceTypes.purchaseReturn;
    default:
      return t.invoiceTypes.sale;
  }
};

// Helper to format invoice date
const formatInvoiceDate = (date: string, locale: string): string => {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US");
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const period = getPeriod(hours, locale);
  const h12 = hours % 12 || 12;
  const hh = h12.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    minimumIntegerDigits: 2,
  });
  const mm = minutes.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    minimumIntegerDigits: 2,
  });

  return `${dateStr} - ${hh}:${mm} ${period}`;
};

// Helper to get current timestamp for key
const getCurrentTimestamp = (locale: string): string => {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  const hrs = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, "0");
  const secs = String(now.getSeconds()).padStart(2, "0");
  const period = getPeriod(hrs, locale);
  const h = hrs % 12 || 12;
  const hStr = String(h).padStart(2, "0");

  return `${hStr}:${mins}:${secs} ${d}/${m}/${y} ${period}`;
};

// Helper to get print styles
const getPrintStyles = (direction: string, isRtl: boolean): string => {
  return `
			@font-face {
				font-family: "Cairo";
				src: url("/fonts/CairoFont.ttf") format("truetype");
			}
			@page { size: A4; margin: 0.8cm; }
			body { 
				direction: ${direction}; 
				font-family: 'Cairo', system-ui, -apple-system, Segoe UI, Tahoma, sans-serif; 
				color: #000; 
				margin: 0; 
				padding: 16px; 
				background: white;
			}
      
		.page-header {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				padding: 8px 10px;
				font-size: 10px;
				line-height: 1.4;
			}
			.page-header p { margin: 1px 0; }
			.page-header .right-info { text-align: ${isRtl ? "right" : "left"}; }
			.page-header .left-info { text-align: ${isRtl ? "left" : "right"}; direction: ${isRtl ? "ltr" : "rtl"}; }
			.container {
				border: 2px solid #000;
				margin: 0 10px;
        position: relative;
			}
        .title {
        position: absolute;
        top: 65px;
        border: 1px solid #000;
        padding: 0px 10px;
        background-color: white;
        z-index: 1000;
        left: 50%;
        transform: translateX(-50%);
        font-size: 8px;
        font-weight: bold;
        text-align: center;
      }
			.customer-info { display:flex; border-bottom: 2px solid black; padding: 5px 20px; justify-content: space-between; align-items: start; font-size:10px; margin-top: 30px; }
			.customer-info div { text-align: ${isRtl ? "right" : "left"}; }
      .address-info { display:flex; justify-content: space-between; align-items: start; font-size:8px }
			table { width: 100%; border-collapse: collapse; font-size: 11px; }
			th { border: 1px solid black; padding: 6px; text-align: center; background-color: #f3f4f6; font-weight: bold; }
			tbody td { border-left: 1px solid black; border-right: 1px solid black; border-top: none; border-bottom: none; padding: 6px; text-align: right; }
			tfoot td { border: 1px solid black; font-size: 10px; padding: 0 2px; }
			.totals { background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 20px; }
			.totals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
			.totals-right { text-align: right; }
			.total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
			.net-amount { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 2px solid #d1d5db; padding-top: 8px; margin-top: 8px; }
			.footer { text-align: center; border-top: 1px solid #d1d5db; padding-top: 15px; font-size: 11px; color: #6b7280; }
  `;
};

const generateQrCodeHtml = (
  data: string | null | undefined,
  size: number = 120,
): string => {
  if (!data) return "";

  const qrCodeSvg = renderToStaticMarkup(
    createElement(QRCode, {
      value: data,
      size: size,
      level: "M",
    }),
  );

  return `
    <div style="display: flex; justify-content: center; align-items: center; padding: 10px;">
      ${qrCodeSvg}
    </div>
  `;
};

export const buildInvoicePrintHtml = ({
  locale,
  invoice,
  invoiceItems,
  totals,
  invoiceType,
  selectedCustomer,
  fractions,
  translations,
  invoiceQrLink,
}: {
  locale: string;
  invoice: FormState;
  invoiceItems: InvoiceItemRow[];
  totals: {
    totalAmount: number;
    taxAmount: number;
    netAmount: number;
    totalDiscount: number;
    totalGWeight?: number;
  };
  invoiceType: TransTypes;
  selectedCustomer: any;
  fractions: { frac: number; frac2: number };
  translations: PrintTranslations;
  invoiceQrLink?: string | null;
}): string => {
  const qrCodeHtml = generateQrCodeHtml(invoiceQrLink);
  const frac = fractions?.frac ?? 2;
  const frac2 = fractions?.frac2 ?? 3;
  const isRtl = locale === "ar";
  const dir = isRtl ? "rtl" : "ltr";
  const lang = isRtl ? "ar" : "en";
  const t = translations;

  const invoiceTitle = getInvoiceTitleText(invoiceType, t);
  const preparedItems = invoiceItems.map((item) => ({
    ...item,
    totalBeforeTax: Number(item.total ?? 0) - Number(item.tax ?? 0),
    totalWithTax: Number(item.total ?? 0),
  }));

  const allRowsHtml = renderInvoiceRows(
    preparedItems,
    { frac, frac2 },
    isRtl,
    t.notSpecified,
  );
  const styles = getPrintStyles(dir, isRtl);

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>${escapeHtml(t.invoiceTitle)} ${escapeHtml(invoiceTitle)} - ${escapeHtml(String(invoice.inv_id || ""))}</title>
		<style>
      ${styles}
		</style>
	</head>
	<body>
  <div class="title">
    <h1>${invoice.vat_no ? t.invoiceTitle : t.simpleInvoiceTitle}</h1>
  </div>
		<div class="page-header">
			<div class="right-info">
				<p>${t.header.phone}:</p>
				<p>${t.header.crNumber}: 5907523858</p>
				<p>${t.header.metalLicense}: ص.ب 6511</p>
				<p>${t.header.mobile}: 0532800540</p>
			</div>
			<div class="left-info">
				<p>${t.header.forGoldJewellery}</p>
				<p>C.R: - Tel.:</p>
				<p>Metal license:</p>
			</div>
		</div>
		<div class="container">
		<div class="customer-info">
    <div>
				<p style="margin: 2px 0;"><strong>${t.customer.vatNumber}:</strong> ${escapeHtml(String(invoice.vat_no || t.notSpecified))}</p>
				<p style="margin: 2px 0;"><strong>${t.customer.customerCode}:</strong> ${escapeHtml(String(invoice.cust_code || ""))}</p>
      	<p style="margin: 2px 0;"><strong>${t.customer.customerName}:</strong> ${escapeHtml(invoice.cust_name)}</p>
        <div class="address-info">
         
         <div class="address-line">
          <p style="margin: 2px 0;"><strong>${t.customer.mobile}:</strong> ${escapeHtml(selectedCustomer?.mobile || t.notAvailable)}</p>
          <p style="margin: 2px 0;"><strong>${t.customer.area}:</strong> ${escapeHtml(selectedCustomer?.area || t.notAvailable)}</p>
          <p style="margin: 2px 0;"><strong>${t.customer.street}:</strong> ${escapeHtml(selectedCustomer?.street || t.notAvailable)}</p>
          <p style="margin: 2px 0;"><strong>${t.customer.postalCode}:</strong> ${escapeHtml(selectedCustomer?.post_code || t.notAvailable)}</p>
         </div>
         
          <div class="address-line">
          <p style="margin: 2px 0;"><strong>${t.customer.city}:</strong> ${escapeHtml(selectedCustomer?.city || t.notAvailable)}</p>
          <p style="margin: 2px 0;"><strong>${t.customer.building}:</strong> ${escapeHtml(selectedCustomer?.build_no || t.notAvailable)}</p>
          <p style="margin: 2px 0;"><strong>${t.customer.crNumber}:</strong> ${escapeHtml(selectedCustomer?.cr_no || t.notAvailable)}</p>
         </div>
        </div>
    </div>
    ${qrCodeHtml}
    <div>
      <p style="margin: 2px 0;"><strong>${t.invoice.invoiceNumber}:</strong> ${escapeHtml(String(invoice.inv_id || t.notSpecified))}</p>
      <p style="margin: 2px 0;"><strong>${t.invoice.reference}:</strong> ${escapeHtml(invoice.ref_no || t.noReference)}</p>
      <p style="margin: 2px 0;"><strong>${t.invoice.invoiceDate}:</strong> ${escapeHtml(
        formatInvoiceDate(invoice.inv_date, locale),
      )}</p>
      <p style="margin: 2px 0;"><strong>${t.invoice.hijriDate}:</strong> ${escapeHtml(hijriDateTime(invoice.inv_date))}</p>
    </div>
		</div>

			<table>
				<thead>
					<tr>
						<th style="text-align: center; background-color: #DBE7F3; white-space: nowrap;">${t.columns.total}</th>
						<th style="text-align:center; background-color: #DBE7F3; white-space: nowrap;">${t.columns.taxRate}</th>
						<th style="text-align: center; background-color: #DBE7F3; white-space: nowrap;">${t.columns.taxAmount}</th>
						<th style="text-align: center; background-color: #DBE7F3; white-space: nowrap;">${t.columns.price}</th>
						<th style="text-align: center; background-color: #DBE7F3; white-space: nowrap;">${t.columns.stoneWeight}</th>
						<th style="text-align: center; background-color: #DBE7F3; white-space: nowrap;">${t.columns.calibration}</th>
						<th style="text-align: center; background-color: #DBE7F3; white-space: nowrap;">${t.columns.weight}</th>
						<th style="text-align: center; background-color: #DBE7F3; white-space: nowrap;">${t.columns.quantity}</th>
						<th style="text-align: ${isRtl ? "right" : "left"}; background-color: #DBE7F3;">${t.columns.description}</th>
					</tr>
				</thead>
				<tbody style="border-bottom: 2px solid #000;">
					${allRowsHtml}
				</tbody>
				<tfoot>
					<tr>
						<td style="text-align: ${isRtl ? "right" : "left"};">
							${(totals.totalAmount - totals.totalDiscount).toFixed(2)}
						</td>
						<td colspan="5" style="text-align: ${isRtl ? "right" : "left"}; font-weight: bold;">
						${t.totals.total}
						</td>
						<td style="text-align: center;">
							${(totals.totalGWeight ?? 0).toFixed(2)}
						</td>
						<td colspan="2"></td>
					</tr>
					<tr>
						<td  style="text-align: ${isRtl ? "right" : "left"};">
							${totals.totalDiscount.toFixed(2)}
						</td>
						<td colspan="8" style="text-align: ${isRtl ? "right" : "left"}; font-weight: bold;">
						${t.totals.discount}
						</td>
					</tr>
				<tr>
						<td  style="text-align: ${isRtl ? "right" : "left"};">
							${totals.totalAmount.toFixed(2)}
						</td>
						<td colspan="8" style="text-align: ${isRtl ? "right" : "left"}; font-weight: bold;">
						${t.totals.beforeTax}
						</td>
					</tr>
					<tr>
						<td  style="text-align: ${isRtl ? "right" : "left"};">
							${totals.taxAmount.toFixed(2)}
						</td>
						<td colspan="8" style="text-align: ${isRtl ? "right" : "left"}; font-weight: bold;">
						${t.totals.vat}
						</td>
					</tr>
					<tr>
						<td  style="text-align: ${isRtl ? "right" : "left"};">
							${totals.netAmount.toFixed(2)}
						</td>
						<td colspan="8" style="text-align: ${isRtl ? "right" : "left"}; font-weight: bold;">
						${t.totals.netAmount}: <span style="font-weight: normal; font-size: 10px;">${amountToWords(totals.netAmount, { language: locale as "en" | "ar" })}</span>
						</td>
					</tr>
				</tfoot>
			</table>
     
    </div>
     <div style="text-align: ${isRtl ? "right" : "left"}; font-size: 11px; margin-top: 10px; padding: 0 10px;">${t.footer.box}: </div>
    
    <footer style="position: fixed; bottom: 0; left: 0; right: 0; border-top: 1px solid #d1d5db; padding-top: 5px; font-size: 11px; background-color: white; direction: ltr;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <div style="font-weight: bold;">${t.footer.countryEn}</div>
        <div style="font-weight: bold;">${t.footer.countryAr}</div>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <div>${t.footer.seller}: ${escapeHtml(invoice.seller_name || "")}</div>
        <div>
          ${getCurrentTimestamp(locale)}
        </div>
      </div>
    </footer>
	</body>
</html>`;
};
