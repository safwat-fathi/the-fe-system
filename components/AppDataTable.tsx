"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
} from "@heroui/react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Table as TanTable,
} from "@tanstack/react-table";
import {
  ArrowsUpDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { printTableInNewWindow } from "@/utilities/table/print";
import clsx from "clsx";

type AppDataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  title?: string;
  searchable?: boolean;
  filterable?: boolean;
  className?: string;
  searchPlaceholder?: string;
  emptyContent?: string;
  printTitle?: string;
  printColumnIds?: string[]; // optional allowlist & order
  onTableReady?: (table: TanTable<TData>) => void;
};

const DEFAULT_EMPTY_CONTENT = "لا توجد بيانات متاحة";

const isClickableHeader = (sortable?: boolean) =>
  sortable ? "cursor-pointer select-none" : "";

export default function AppDataTable<TData>({
  columns,
  data,
  title,
  searchable = true,
  filterable = true,
  className = "",
  searchPlaceholder = "البحث...",
  emptyContent = DEFAULT_EMPTY_CONTENT,
  printTitle,
  printColumnIds,
  onTableReady,
}: AppDataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const tableColumns = useMemo(() => columns, [columns]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  // Option B: notify parent when the table instance is ready (and when data/columns identity changes)
  useEffect(() => {
		if (!onTableReady) return;

    if (tableColumns.length && data.length) onTableReady(table);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableColumns, data]);

  const renderSortIcon = (columnId: string) => {
    const sort = sorting.find((item) => item.id === columnId);

    if (!sort) return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;

    return sort.desc ? (
      <ChevronDownIcon className="h-4 w-4 text-blue-500" />
    ) : (
      <ChevronUpIcon className="h-4 w-4 text-blue-500" />
    );
  };

  // const onPrint = (table: TanTable<TData>) => {
  //   printTableInNewWindow(table, {
  //     title: printTitle || title || "قائمة",
  //     direction: "rtl",
  //     columnIds: printColumnIds,
  //   });
  // };

  return (
    <div className={clsx("p-2 space-y-0.5 flex gap-2 flex-col", className)}>
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl m-0 font-semibold text-gray-800">{title}</h2>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {searchable && (
          <div className="relative flex-1 max-w-md">
            <Input
              className="input-field"
              placeholder={searchPlaceholder}
              startContent={
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              }
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
        )}

        <div className="flex gap-2">
          {filterable && (
            <Button
              className="btn-secondary"
              startContent={<FunnelIcon className="h-4 w-4" />}
              variant="bordered"
            >
              تصفية
            </Button>
          )}
          {/* {enablePrint && (
            <Button
              className="btn-secondary"
              variant="bordered"
              onPress={() =>
                printTableInNewWindow(table, {
                  title: printTitle || title || "قائمة",
                  direction: "rtl",
                  columnIds: printColumnIds,
                })
              }
            >
              طباعة
            </Button>
          )} */}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <Table
          aria-label={title || "جدول البيانات"}
          classNames={{
            wrapper: "shadow-none",
            th: "bg-gray-50 text-gray-700 font-semibold text-xs border-b border-gray-200 p-1",
            td: "border-b border-gray-100 text-xs p-1",
            tr: "hover:bg-gray-50 transition-colors",
          }}
        >
          <TableHeader>
            {table
              .getFlatHeaders()
              .filter((header) => !header.isPlaceholder)
              .map((header) => {
                const isSortable = header.column.getCanSort();

                return (
                  <TableColumn
                    key={header.id}
                    className={isClickableHeader(isSortable)}
                    onClick={
                      isSortable
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {isSortable && renderSortIcon(header.column.id)}
                    </div>
                  </TableColumn>
                );
              })}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  className="text-center py-4 text-gray-500"
                  colSpan={table.getAllLeafColumns().length || 1}
                >
                  {emptyContent}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
        <span>إجمالي النتائج: {table.getFilteredRowModel().rows.length}</span>
        {globalFilter && <span>نتائج البحث عن: "{globalFilter}"</span>}
      </div>
    </div>
  );
}
