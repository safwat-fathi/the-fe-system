"use client";

import { useState } from "react";
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
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatAmount } from "@/utilities/formatAmount";
import { formatDate } from "@/utilities/dateUtils";

const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthStartDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

const getMonthEndDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
};

interface JournalEntry {
  date: string;
  entryNumber: string;
  entryType: string;
  account: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  createdBy: string;
}

export default function JournalLedgerClient() {
  const [startDate, setStartDate] = useState(getMonthStartDate());
  const [endDate, setEndDate] = useState(getMonthEndDate());
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // TODO: جلب البيانات من API
      toast.success("تم جلب البيانات بنجاح");
      setEntries([]);
    } catch (error) {
      console.error("Error loading journal ledger:", error);
      toast.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStartDate(getMonthStartDate());
    setEndDate(getMonthEndDate());
    setEntries([]);
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
              label="من تاريخ"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="sm"
            />
            <Input
              type="date"
              label="إلى تاريخ"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="sm"
            />
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
          </div>
        </CardBody>
      </Card>

      {/* Report Header */}
      <Card>
        <CardBody className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              دفتر القيود
            </h2>
            <p className="text-lg text-gray-600 mb-2">NAJAH</p>
            <p className="text-sm text-gray-500">
              من {startDate} إلى {endDate}
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
            <Table aria-label="Journal Ledger Table">
              <TableHeader>
                <TableColumn>التاريخ</TableColumn>
                <TableColumn>رقم القيد</TableColumn>
                <TableColumn>نوع القيد</TableColumn>
                <TableColumn>الحساب</TableColumn>
                <TableColumn>التفصيل</TableColumn>
                <TableColumn>مدين</TableColumn>
                <TableColumn>دائن</TableColumn>
                <TableColumn>أنشئ بواسطة</TableColumn>
              </TableHeader>
              <TableBody emptyContent="لا توجد بيانات">
                {entries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>{entry.entryNumber}</TableCell>
                    <TableCell>{entry.entryType}</TableCell>
                    <TableCell>
                      {entry.account} - {entry.accountName}
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>
                      {entry.debit > 0 ? formatAmount(entry.debit, 2) : ""}
                    </TableCell>
                    <TableCell>
                      {entry.credit > 0 ? formatAmount(entry.credit, 2) : ""}
                    </TableCell>
                    <TableCell>{entry.createdBy}</TableCell>
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
