"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatAmount } from "@/utilities/formatAmount";

const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface BalanceSheetRow {
  accountCode: string;
  accountName: string;
  amount: number;
  level: number;
}

export default function BalanceSheetClient() {
  const [date, setDate] = useState(getCurrentDate());
  const [level, setLevel] = useState("7");
  const [loading, setLoading] = useState(false);
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetRow[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // TODO: جلب البيانات من API
      toast.success("تم جلب البيانات بنجاح");
      setBalanceSheetData([]);
    } catch (error) {
      console.error("Error loading balance sheet:", error);
      toast.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDate(getCurrentDate());
    setLevel("7");
    setBalanceSheetData([]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast.success("تم تصدير التقرير بنجاح");
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              type="date"
              label="التاريخ"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              size="sm"
            />
            <Select
              label="المستوى"
              selectedKeys={level ? [level] : []}
              onSelectionChange={(keys) =>
                setLevel(Array.from(keys)[0] as string)
              }
              size="sm"
            >
              <SelectItem key="7">المستوى 7</SelectItem>
              <SelectItem key="6">المستوى 6</SelectItem>
              <SelectItem key="5">المستوى 5</SelectItem>
            </Select>
            <div className="flex gap-2">
              <Button
                color="primary"
                startContent={<MagnifyingGlassIcon className="h-4 w-4" />}
                onPress={handleSearch}
                isLoading={loading}
                size="md"
                className="flex-1"
              >
                بحث
              </Button>
              <Button
                variant="bordered"
                startContent={<ArrowPathIcon className="h-4 w-4" />}
                onPress={handleReset}
                size="md"
              >
                إعادة تعيين
              </Button>
            </div>
            <Button
              variant="bordered"
              className="w-full"
            >
              مقارنة بفترة سابقة
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Report Header */}
      <Card>
        <CardBody className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              الميزانية العمومية
            </h2>
            <p className="text-lg text-gray-600 mb-2">NAJAH</p>
            <p className="text-sm text-gray-500">
              من {date} إلى {date}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mb-4">
            <Button
              variant="bordered"
              startContent={<PrinterIcon className="h-4 w-4" />}
              onPress={handlePrint}
            >
              طباعة
            </Button>
            <Button
              color="primary"
              startContent={<ArrowDownTrayIcon className="h-4 w-4" />}
              onPress={handleExport}
            >
              تصدير
            </Button>
          </div>

          {/* Report Table */}
          <div className="overflow-x-auto">
            <Table aria-label="Balance Sheet Table">
              <TableHeader>
                <TableColumn>الحساب</TableColumn>
                <TableColumn>{date}</TableColumn>
              </TableHeader>
              <TableBody emptyContent="لا توجد بيانات">
                {balanceSheetData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell
                      style={{ paddingRight: `${row.level * 16}px` }}
                    >
                      {row.accountCode} - {row.accountName}
                    </TableCell>
                    <TableCell>
                      {formatAmount(row.amount, 2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
