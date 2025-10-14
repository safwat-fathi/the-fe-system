"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";

interface DynamicDataTableProps {
  data: any[];
  tableName: string;
}

const DynamicDataTable = ({ data, tableName }: DynamicDataTableProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        لا توجد بيانات لعرضها
      </div>
    );
  }

  // Extract column names from first data item
  const columns = Object.keys(data[0]);

  // Format column name for display (convert snake_case to Title Case)
  const formatColumnName = (columnName: string): string => {
    return columnName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format cell value for display
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "-";
    }
    if (typeof value === "boolean") {
      return value ? "✓" : "✗";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="responsive-table">
      <div className="mb-4">
        <h3 className="font-bold text-lg">
          📊 جدول: <span className="text-blue-600">{tableName}</span>
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          عدد الأعمدة: {columns.length} | عدد السجلات: {data.length}
        </p>
      </div>

      <Table aria-label={`جدول ${tableName}`}>
        <TableHeader>
          {columns.map((column) => (
            <TableColumn key={column}>{formatColumnName(column)}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={item.id || index}>
              {columns.map((column) => (
                <TableCell key={`${index}-${column}`}>
                  {formatCellValue(item[column])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DynamicDataTable;

