"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectItem, Input, Button } from "@heroui/react";

// List of common tables available in the API
const COMMON_TABLES = [
  { value: "home_list", label: "Home List" },
  { value: "customers_list", label: "Customers List" },
  { value: "items_list", label: "Items List" },
  { value: "invoices_list", label: "Invoices List" },
  { value: "accounts_list", label: "Accounts List" },
  { value: "boxes_list", label: "Boxes List" },
  { value: "categories_list", label: "Categories List" },
  { value: "cost_centers_list", label: "Cost Centers List" },
  { value: "currencies_list", label: "Currencies List" },
  { value: "cust_type_list", label: "Customer Types List" },
  { value: "units_list", label: "Units List" },
  { value: "users_list", label: "Users List" },
] as const;

interface TableSelectorProps {
  currentTable: string;
}

const TableSelector = ({ currentTable }: TableSelectorProps) => {
  const router = useRouter();
  const [selectedTable, setSelectedTable] = useState(currentTable);
  const [customTable, setCustomTable] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const handleApply = () => {
    const tableToUse = useCustom && customTable ? customTable : selectedTable;

    if (tableToUse) {
      router.push(`/test-service?table=${encodeURIComponent(tableToUse)}`);
    }
  };

  const handleSelectChange = (value: string) => {
    setSelectedTable(value);
    setUseCustom(false);
    // Auto-navigate when selecting from dropdown
    router.push(`/test-service?table=${encodeURIComponent(value)}`);
  };

  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">🔍 اختيار الجدول</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Dropdown for common tables */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            اختر من القائمة:
          </label>
          <Select
            aria-label="اختر جدول من القائمة"
            className="max-w-full"
            placeholder="اختر جدول"
            selectedKeys={[selectedTable]}
            onChange={(e) => handleSelectChange(e.target.value)}
          >
            {COMMON_TABLES.map((table) => (
              <SelectItem key={table.value} value={table.value}>
                {table.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Custom input for any table */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            أو اكتب اسم الجدول:
          </label>
          <Input
            aria-label="اكتب اسم الجدول يدوياً"
            className="max-w-full"
            placeholder="مثال: home_list"
            value={customTable}
            onChange={(e) => {
              setCustomTable(e.target.value);
              setUseCustom(true);
            }}
          />
        </div>
      </div>

      {/* Apply button - visible only when using custom input */}
      {useCustom && customTable && (
        <div className="flex items-center justify-between">
          <Button
            className="font-bold px-8"
            color="primary"
            size="lg"
            onClick={handleApply}
          >
            🔄 تحديث الجدول
          </Button>

          <div className="text-sm text-gray-600">
            الجدول الحالي:{" "}
            <span className="font-bold text-blue-600">{currentTable}</span>
          </div>
        </div>
      )}

      {/* Current table info when not using custom input */}
      {(!useCustom || !customTable) && (
        <div className="text-sm text-gray-600 text-center bg-white/50 p-3 rounded-lg">
          📋 الجدول الحالي:{" "}
          <span className="font-bold text-blue-600 text-base">
            {currentTable}
          </span>
          <span className="block text-xs mt-1 text-gray-500">
            * يتم التحديث تلقائياً عند اختيار جدول من القائمة
          </span>
        </div>
      )}
    </div>
  );
};

export default TableSelector;
