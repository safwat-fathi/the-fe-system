import type { Table } from "@tanstack/react-table";

import { InvoiceItemRow } from "../invoiceForm";

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

          if (v === null || v === undefined) {
            text = "";
          } else if (String(col!.id).includes("date")) {
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
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: ${direction === "rtl" ? "right" : "left"}; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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
  systemName = "نظام نفيس ويب",
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
  systemName?: string;
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
  const itemsHtml = invoiceItems
    .map((item, index) => {
      return `
				<tr style="${index % 2 === 0 ? "background-color: #f9fafb;" : ""}">
					<td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${index + 1}</td>
					<td style="border: 1px solid #d1d5db; padding: 6px; text-align: right;">${escapeHtml(item.item_desc || item.sn || "غير محدد")}</td>
					<td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${Number(item.qty).toFixed(frac2)}</td>
					<td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${Number(item.weight).toFixed(frac2)}</td>
					<td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${Number(item.g_weight).toFixed(frac2)}</td>
					<td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${escapeHtml(item.k || "غير محدد")}</td>
					<td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${Number(item.price).toFixed(frac)}</td>
					<td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${Number(item.total).toFixed(frac)}</td>
				</tr>
			`;
    })
    .join("");

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
			.header { text-align: center; border-bottom: 2px solid black; padding-bottom: 15px; margin-bottom: 20px; }
			.header h1 { font-size: 24px; margin: 0; }
			.header h2 { font-size: 18px; margin: 10px 0 0 0; }
			.customer-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
			.customer-info div { text-align: right; }
			table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
			th, td { border: 1px solid #d1d5db; padding: 6px; text-align: right; }
			th { background-color: #f3f4f6; font-weight: bold; text-align: center; }
			.totals { background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 20px; }
			.totals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
			.totals-right { text-align: right; }
			.total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
			.net-amount { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 2px solid #d1d5db; padding-top: 8px; margin-top: 8px; }
			.footer { text-align: center; border-top: 1px solid #d1d5db; padding-top: 15px; font-size: 11px; color: #6b7280; }
		</style>
	</head>
	<body>
		<div class="header">
			<h1>نظام الفواتير</h1>
			<h2>فاتورة ${escapeHtml(invoiceTitle)}</h2>
		</div>
		
		<div class="customer-info">
			<div>
				<p style="margin: 5px 0;"><strong>رقم الفاتورة:</strong> ${escapeHtml(String(invoice.inv_id || "غير محدد"))}</p>
				<p style="margin: 5px 0;"><strong>تاريخ الفاتورة:</strong> ${escapeHtml(new Date(invoice.inv_date).toLocaleDateString("ar-EG"))}</p>
				<p style="margin: 5px 0;"><strong>ملاحظات:</strong> ${escapeHtml(invoice.inv_notes || "لا توجد")}</p>
			</div>
			<div>
				<p style="margin: 5px 0;"><strong>اسم العميل:</strong> ${escapeHtml(invoice.cust_name)}</p>
				<p style="margin: 5px 0;"><strong>رقم العميل:</strong> ${escapeHtml(String(invoice.cust_code || ""))}</p>
				<p style="margin: 5px 0;"><strong>الهاتف:</strong> ${escapeHtml(selectedCustomer?.mobile || "غير متوفر")}</p>
			</div>
			<div>
				<p style="margin: 5px 0;"><strong>العنوان:</strong> ${escapeHtml(selectedCustomer?.address || "غير متوفر")}</p>
				<p style="margin: 5px 0;"><strong>الرقم الضريبي:</strong> ${escapeHtml(invoice.vat_no)}</p>
				<p style="margin: 5px 0;"><strong>رقم المراجع:</strong> ${escapeHtml(invoice.ref_no || "لا يوجد")}</p>
			</div>
		</div>

		<table>
			<thead>
				<tr>
					<th style="text-align: center;">#</th>
					<th style="text-align: right;">اسم الصنف</th>
					<th style="text-align: center;">الكمية</th>
					<th style="text-align: center;">الوزن</th>
					<th style="text-align: center;">الوزن المعاير</th>
					<th style="text-align: center;">النوع</th>
					<th style="text-align: center;">السعر</th>
					<th style="text-align: center;">الإجمالي</th>
				</tr>
			</thead>
			<tbody>
				${itemsHtml}
			</tbody>
		</table>

		<div class="totals">
			<div class="totals-grid">
				<div class="text-right">
					<p style="margin: 5px 0;"><strong>إجمالي الأصناف:</strong> ${invoiceItems.length}</p>
					<p style="margin: 5px 0;"><strong>إجمالي الوزن المعاير:</strong> ${(totals.totalGWeight || 0).toFixed(frac2)} جم</p>
				</div>
				<div class="totals-right">
					<div class="total-row">
						<span><strong>إجمالي الأصناف:</strong></span>
						<span>${totals.totalAmount.toFixed(frac)}</span>
					</div>
					<div class="total-row">
						<span><strong>إجمالي الخصم:</strong></span>
						<span>${totals.totalDiscount.toFixed(frac)}</span>
					</div>
					<div class="total-row">
						<span><strong>قيمة الضريبة:</strong></span>
						<span>${totals.taxAmount.toFixed(frac)}</span>
					</div>
					<div class="net-amount">
						<span>الصافي:</span>
						<span>${totals.netAmount.toFixed(frac)}</span>
					</div>
				</div>
			</div>
		</div>

		<div class="footer">
			<p>تم إنشاء هذه الفاتورة عبر ${escapeHtml(systemName)}</p>
			<p style="margin-top: 8px;">تاريخ الطباعة: ${escapeHtml(
        new Date().toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      )}</p>
		</div>
	</body>
</html>`;
};
