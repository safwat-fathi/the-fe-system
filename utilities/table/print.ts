import type { Table } from "@tanstack/react-table";

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
export function buildSimpleTablePrintHtml<T>(table: Table<T>, opts?: {
  title?: string;
  direction?: "rtl" | "ltr";
  columnIds?: string[]; // optional allowlist & order
}): string {
  const title = opts?.title ?? "قائمة";
  const direction = opts?.direction ?? "rtl";

  const allColumnsRaw = table.getAllLeafColumns().filter((c) => c.getIsVisible());
  const selected = Array.isArray(opts?.columnIds) && opts!.columnIds!.length
    ? opts!.columnIds!.map((id) => allColumnsRaw.find((c) => String(c.id) === id)).filter(Boolean)
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

  const isNumericString = (s: string) => /^-?\d+(?:\.\d+)?$/.test(s.replace(/,/g, "").trim());
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
          const v = row.getValue ? row.getValue(col!.id) : row.original?.[col!.id];
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
  opts?: { title?: string; direction?: "rtl" | "ltr"; columnIds?: string[] }
) {
  const html = buildSimpleTablePrintHtml(table, opts);
	
  const w = window.open("", "_blank", "width=1024,height=768,scrollbars=yes,resizable=yes");
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
