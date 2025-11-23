/**
 * Shared component for report filters
 * مكون مشترك لفلترة التقارير
 */

"use client";

import { Input, Button, Select, SelectItem } from "@heroui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface ReportFiltersProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClearFilters: () => void;
  additionalFilters?: React.ReactNode;
  showDateFilters?: boolean;
}

export default function ReportFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  additionalFilters,
  showDateFilters = true,
}: ReportFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
      {showDateFilters && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              من تاريخ
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              size="sm"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              إلى تاريخ
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              size="sm"
              className="w-full"
            />
          </div>
        </>
      )}

      {additionalFilters}

      <div>
        <Button
          className="btn-secondary w-full"
          variant="bordered"
          onPress={onClearFilters}
          size="md"
        >
          <MagnifyingGlassIcon className="h-4 w-4" /> مسح الفلاتر
        </Button>
      </div>
    </div>
  );
}

