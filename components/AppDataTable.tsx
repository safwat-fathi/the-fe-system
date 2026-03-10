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
import clsx from "clsx";

import { TABLE_STYLE, type TableClassNames } from "@/constants/ui";

type AppDataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  title?: string;
  searchable?: boolean;
  filterable?: boolean;
  className?: string;
  searchPlaceholder?: string;
  emptyContent?: string;
  onTableReady?: (table: TanTable<TData>) => void;
  tableClassNames?: TableClassNames;
  bare?: boolean;
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
  onTableReady,
  tableClassNames,
  bare = false,
}: AppDataTableProps<TData>) {
  const tableStyles = {
    wrapper: tableClassNames?.wrapper ?? `${TABLE_STYLE.wrapper ?? ""} h-full`.trim(),
    th: tableClassNames?.th ?? TABLE_STYLE.th,
    td: tableClassNames?.td ?? TABLE_STYLE.td,
    tr: tableClassNames?.tr ?? TABLE_STYLE.tr,
  };
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

  return (
    <div
      className={clsx("p-0.5 space-y-0 flex gap-0 flex-col h-full", className)}
    >
      {title && (
        <div className="flex-shrink-0 flex items-center justify-between mb-0.5">
          <h2 className="text-xl m-0 font-semibold text-gray-800">{title}</h2>
        </div>
      )}

      <div className="flex-shrink-0 flex flex-col sm:flex-row gap-1 items-start sm:items-center justify-between mb-0.5">
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
        </div>
      </div>

      <div
        className={clsx(
          "flex-1 min-h-0 overflow-hidden p-0 flex flex-col",
          !bare && "card",
        )}
      >
        <div className="flex-1 min-h-0 overflow-auto">
          <Table
            aria-label={title || "جدول البيانات"}
            classNames={{
              wrapper: tableStyles.wrapper,
              th: tableStyles.th,
              td: tableStyles.td,
              tr: tableStyles.tr,
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
                    className="text-center py-4 text-gray-500 text-sm"
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
      </div>

      {globalFilter && (
        <div className="flex-shrink-0 flex items-center justify-between text-sm text-gray-500 pt-0.5">
          <span>نتائج البحث عن: &quot;{globalFilter}&quot;</span>
        </div>
      )}
    </div>
  );
}
