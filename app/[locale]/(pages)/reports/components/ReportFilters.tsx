/**
 * Shared component for report filters
 * مكون مشترك لفلترة التقارير
 */

"use client";

import { Input, Button } from "@heroui/react";
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
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="report-filter-start-date"
            >
              من تاريخ
            </label>
            <Input
              className="w-full"
              id="report-filter-start-date"
              size="sm"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="report-filter-end-date"
            >
              إلى تاريخ
            </label>
            <Input
              className="w-full"
              id="report-filter-end-date"
              size="sm"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
        </>
      )}

      {additionalFilters}

      <div>
        <Button
          className="btn-secondary w-full"
          size="md"
          variant="bordered"
          onPress={onClearFilters}
        >
          <MagnifyingGlassIcon className="h-4 w-4" /> مسح الفلاتر
        </Button>
      </div>
    </div>
  );
}
