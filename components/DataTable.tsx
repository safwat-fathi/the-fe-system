"use client";

import { useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Button, Chip } from "@heroui/react";
import { MagnifyingGlassIcon, FunnelIcon, ArrowsUpDownIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title?: string;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  className?: string;
}

export default function DataTable({
  columns,
  data,
  title,
  searchable = true,
  filterable = true,
  sortable = true,
  className = ""
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter data based on search term
  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
    return sortDirection === "asc" ? <ChevronUpIcon className="h-4 w-4 text-blue-500" /> : <ChevronDownIcon className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </div>
      )}

      {/* Search and Filters */}
      {(searchable || filterable) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="البحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
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

      {/* Table */}
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
            {columns.map((column) => (
              <TableColumn
                key={column.key}
                className={`${sortable && column.sortable ? "cursor-pointer select-none" : ""}`}
                onClick={() => sortable && column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  <span>{column.label}</span>
                  {sortable && column.sortable && getSortIcon(column.key)}
                </div>
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                  لا توجد بيانات متاحة
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>إجمالي النتائج: {sortedData.length}</span>
        {searchTerm && (
          <span>نتائج البحث عن: "{searchTerm}"</span>
        )}
      </div>
    </div>
  );
}
