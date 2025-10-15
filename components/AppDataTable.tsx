"use client";

import { useMemo, useState } from "react";
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
} from "@tanstack/react-table";
import {
  ArrowsUpDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

type AppDataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  title?: string;
  searchable?: boolean;
  filterable?: boolean;
  className?: string;
  searchPlaceholder?: string;
  emptyContent?: string;
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
    <div className={`p-4 space-y-4 ${className}`}>
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </div>
      )}

      {(searchable || filterable) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                startContent={
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                }
                className="input-field"
              />
            </div>
          )}

          {filterable && (
            <div className="flex gap-2">
              <Button
                variant="bordered"
                startContent={<FunnelIcon className="h-4 w-4" />}
                className="btn-secondary"
              >
                تصفية
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <Table
          aria-label={title || "جدول البيانات"}
          classNames={{
            wrapper: "shadow-none",
            th: "bg-gray-50 text-gray-700 font-semibold text-sm border-b border-gray-200",
            td: "border-b border-gray-100 text-sm",
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
                  className="text-center py-8 text-gray-500"
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          إجمالي النتائج: {table.getFilteredRowModel().rows.length}
        </span>
        {globalFilter && <span>نتائج البحث عن: "{globalFilter}"</span>}
      </div>
    </div>
  );
}
