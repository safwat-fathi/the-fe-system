/**
 * Vouchers Filters Component
 * مكون فلترة السندات
 */

"use client";

import { Input, Button, Select, SelectItem, CardBody } from "@heroui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import Card from "@/components/Card";

interface VoucherType {
  id: number;
  type_name: string;
  type_name_e: string;
  type_desc?: string;
}

interface VouchersFiltersProps {
  searchQ: string;
  onSearchChange: (value: string) => void;
  voucherType: string;
  onVoucherTypeChange: (value: string) => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  voucherTypes: VoucherType[];
  onClearFilters: () => void;
}

export default function VouchersFilters({
  searchQ,
  onSearchChange,
  voucherType,
  onVoucherTypeChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  voucherTypes,
  onClearFilters,
}: VouchersFiltersProps) {
  return (
    <Card>
      <CardBody className="p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
          <Input
            placeholder="البحث بالرقم أو البيان..."
            startContent={
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            }
            value={searchQ}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Select
            placeholder="نوع السند"
            selectedKeys={[voucherType || "0"]}
            onSelectionChange={(keys) =>
              onVoucherTypeChange(Array.from(keys)[0] as string)
            }
          >
            {[
              <SelectItem key="0">جميع الأنواع</SelectItem>,
              ...voucherTypes.map((type, idx) => (
                <SelectItem key={type.id || `type-${idx}`}>
                  {type.type_name}
                </SelectItem>
              )),
            ]}
          </Select>
          <Input
            placeholder="من تاريخ"
            type="date"
            value={fromDate === "0" ? "" : fromDate}
            onChange={(e) => onFromDateChange(e.target.value || "0")}
          />
          <Input
            placeholder="إلى تاريخ"
            type="date"
            value={toDate === "0" ? "" : toDate}
            onChange={(e) => onToDateChange(e.target.value || "0")}
          />
          <Button
            className="btn-secondary"
            variant="bordered"
            onPress={onClearFilters}
          >
            مسح الفلاتر
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
