import type { Table } from "@tanstack/react-table";

import { InvoiceItemRow } from "../invoiceForm";
import { amountToArabic } from "../formatAmount";

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

function escapeHtml(input: string): string {
  return input
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

// Build HTML for printing invoice
export const buildInvoicePrintHtml = ({
  invoice,
  invoiceItems,
  totals,
  invoiceType,
  selectedCustomer,
  fractions,
}: {
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
}): string => {
  const frac = fractions?.frac ?? 2;
  const frac2 = fractions?.frac2 ?? 3;

  // Determine invoice title
  const getInvoiceTitle = () => {
    switch (invoiceType) {
      case TransTypes.SALES_RETURN:
        return "مردود بيع";
      case TransTypes.PURCHASE:
        return "شراء";
      case TransTypes.PURCHASE_RETURN:
        return "مردود شراء";
      default:
        return "بيع";
    }
  };

  const invoiceTitle = getInvoiceTitle();

  // Escape HTML function
  const escapeHtml = (input: string): string => {
    return String(input)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  };

  // Build invoice items table rows
  const MIN_ROWS = 15;
  const itemsHtml = invoiceItems
    .map((item, index) => {
      return `
				<tr style="${index % 2 === 0 ? "background-color: #f9fafb;" : ""}">
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.total).toFixed(frac)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${escapeHtml(`${item.tax_prc} %`)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.tax).toFixed(frac)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.price).toFixed(frac)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.g_weight).toFixed(frac2)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.g_weight).toFixed(frac2)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.weight).toFixed(frac2)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center;">${Number(item.qty).toFixed(frac2)}</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: right;">${escapeHtml(item.item_desc || item.sn || "غير محدد")}</td>
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

  const allRowsHtml = itemsHtml + emptyRowsHtml;

  return `<!doctype html>
<html lang="ar" dir="rtl">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>فاتورة ${escapeHtml(invoiceTitle)} - ${escapeHtml(String(invoice.inv_id || ""))}</title>
		<style>
			@font-face {
				font-family: "Cairo";
				src: url("/fonts/CairoFont.ttf") format("truetype");
			}
			@page { size: A4; margin: 0.8cm; }
			body { 
				direction: rtl; 
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
			.page-header .right-info { text-align: right; }
			.page-header .left-info { text-align: left; direction: ltr; }
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
      }
			.customer-info { display:flex; border-bottom: 2px solid black; padding: 5px 20px; justify-content: space-between; align-items: start; font-size:10px }
			.customer-info div { text-align: right; }
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
		</style>
	</head>
	<body>
  <div class="title">
    <h1>فاتورة ضريبية مبسطة</h1>
  </div>
		<div class="page-header">
			<div class="right-info">
				<p>تليفون :</p>
				<p>سجل تجاري : 5907523858</p>
				<p>رخصه معادن : ص.ب 6511</p>
				<p>جوال : 0532800540</p>
			</div>
			<div class="left-info">
				<p>For Gold & Jewellery</p>
				<p>C.R: - Tel.:</p>
				<p>Metal license:</p>
			</div>
		</div>
		<div class="container">
		<div class="customer-info">
    <div>
				<p style="margin: 2px 0;"><strong>الرقم الضريبي:</strong> ${escapeHtml(String(invoice.vat_no || "غير محدد"))}</p>
				<p style="margin: 2px 0;"><strong>رقم العميل:</strong> ${escapeHtml(String(invoice.cust_code || ""))}</p>
      	<p style="margin: 2px 0;"><strong>اسم العميل:</strong> ${escapeHtml(invoice.cust_name)}</p>
        <div class="address-info">
         <div class="address-line">
          <p style="margin: 2px 0;"><strong>الجوال:</strong> ${escapeHtml(selectedCustomer?.mobile || "غير متوفر")}</p>
          <p style="margin: 2px 0;"><strong>المنطقه:</strong> ${escapeHtml(selectedCustomer?.area || "غير متوفر")}</p>
          <p style="margin: 2px 0;"><strong>الشارع:</strong> ${escapeHtml(selectedCustomer?.street || "غير متوفر")}</p>
          <p style="margin: 2px 0;"><strong>الرمز البريدي:</strong> ${escapeHtml(selectedCustomer?.post_code || "غير متوفر")}</p>
         </div>
          <div class="address-line">
          <p style="margin: 2px 0;"><strong>المدينه:</strong> ${escapeHtml(selectedCustomer?.city || "غير متوفر")}</p>
          <p style="margin: 2px 0;"><strong>المبني:</strong> ${escapeHtml(selectedCustomer?.build_no || "غير متوفر")}</p>
          <p style="margin: 2px 0;"><strong>س.ت:</strong> ${escapeHtml(selectedCustomer?.cr_no || "غير متوفر")}</p>
         </div>
        </div>
    </div>
    <div>
      <p style="margin: 2px 0;"><strong>رقم الفاتورة:</strong> ${escapeHtml(String(invoice.inv_id || "غير محدد"))}</p>
      <p style="margin: 2px 0;"><strong>المرجع:</strong> ${escapeHtml(invoice.ref_no || "لا يوجد")}</p>
      <p style="margin: 2px 0;"><strong>تاريخ الفاتورة:</strong> ${escapeHtml(
        (() => {
          const d = new Date(invoice.inv_date);
          const dateStr = d.toLocaleDateString("ar-SA");
          const hours = d.getHours();
          const minutes = d.getMinutes();
          const period = hours >= 12 ? "م" : "ص";
          const h12 = hours % 12 || 12;
          const arabicHH = h12.toLocaleString("ar-EG", {
            minimumIntegerDigits: 2,
          });
          const arabicMM = minutes.toLocaleString("ar-EG", {
            minimumIntegerDigits: 2,
          });

          return `${dateStr} - ${arabicHH}:${arabicMM} ${period}`;
        })(),
      )}</p>
      <p style="margin: 2px 0;"><strong>موافق:</strong> ${escapeHtml(hijriDateTime(invoice.inv_date))}</p>
    </div>
		</div>

			<table>
				<thead>
					<tr>
						<th style="text-align: center; background-color: #DBE7F3; width: 8%;">الإجمالي (ريال)</th>
						<th style="text-align:center; background-color: #DBE7F3; width: 6%;">نسبه الضريبة</th>
						<th style="text-align: center; background-color: #DBE7F3; width: 7%;">ضريبة القيمه</th>
						<th style="text-align: center; background-color: #DBE7F3; width: 7%;">السعر</th>
						<th style="text-align: center; background-color: #DBE7F3; width: 7%;">وزن الاحجار</th>
						<th style="text-align: center; background-color: #DBE7F3; width: 6%;">العيار</th>
						<th style="text-align: center; background-color: #DBE7F3; width: 7%;">الوزن</th>
						<th style="text-align: center; background-color: #DBE7F3; width: 6%;">العدد</th>
						<th style="text-align: right; background-color: #DBE7F3; width: 46%;">البيان</th>
					</tr>
				</thead>
				<tbody style="border-bottom: 2px solid #000;">
					${allRowsHtml}
				</tbody>
				<tfoot>
					<tr>
						<td style="text-align: right;">
							${(totals.totalAmount - totals.totalDiscount).toFixed(2)}
						</td>
						<td colspan="5" style="text-align: right; font-weight: bold;">
						الاجمالي
						</td>
						<td style="text-align: center;">
							${(totals.totalGWeight ?? 0).toFixed(2)}
						</td>
						<td colspan="2"></td>
					</tr>
					<tr>
						<td  style="text-align: right;">
							${totals.totalDiscount.toFixed(2)}
						</td>
						<td colspan="8" style="text-align: right; font-weight: bold;">
						الخصم
						</td>
					</tr>
				<tr>
						<td  style="text-align: right;">
							${totals.totalAmount.toFixed(2)}
						</td>
						<td colspan="8" style="text-align: right; font-weight: bold;">
						الاجمالي غير شامل ضريبة القيمة المضافة
						</td>
					</tr>
					<tr>
						<td  style="text-align: right;">
							${totals.taxAmount.toFixed(2)}
						</td>
						<td colspan="8" style="text-align: right; font-weight: bold;">
						ضريبه القيمه المضافه
						</td>
					</tr>
					<tr>
						<td  style="text-align: right;">
							${totals.netAmount.toFixed(2)}
						</td>
						<td colspan="8" style="text-align: right; font-weight: bold;">
						المجموع شامل الضريبه القيمه المضافه: <span style="font-weight: normal; font-size: 10px;">${amountToArabic(totals.netAmount)}</span>
						</td>
					</tr>
				</tfoot>
			</table>
    </div>
		${`<p style="text-align: right; font-size: 11px; margin-top: 10px; padding: 0 10px;">البائع : ${escapeHtml(invoice.seller_name || "")}</p>`}
	</body>
</html>`;
};
