import { create } from "zustand";
import type { Table as TanTable } from "@tanstack/react-table";
import { printTableInNewWindow } from "@/utilities/table/print";

type ReportTableState = {
  table: TanTable<any> | null;
  setTable: (table: TanTable<any> | null) => void;
  clear: () => void;
  hasTable: boolean;
  print: () => void;
};

export const useReportTableStore = create<ReportTableState>((set, get) => ({
  table: null,
  setTable: (table) => set({ table }),
  clear: () => set({ table: null }),
  get hasTable() {
    return !!get().table;
  },
  print: () => {
    const table = get().table;
    if (!table) return;
    printTableInNewWindow(table, {
      title: "تقارير الفواتير",
      direction: "rtl",
      columnIds: [
        "inv_id",
        "inv_date",
        "cust_name",
        "inv_net",
        "tax",
        "inv_amt",
        "type",
      ],
    });
  },
}));

