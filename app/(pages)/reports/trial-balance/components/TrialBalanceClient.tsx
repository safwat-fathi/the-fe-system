"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
  Switch,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import glTransactionService from "@/services/api/gl-transaction.service";
import accountService from "@/services/api/account.service";
import { formatAmount } from "@/utilities/formatAmount";

const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getYearStartDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  return `${year}-01-01`;
};

interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  openingDebit: number;
  openingCredit: number;
  movementDebit: number;
  movementCredit: number;
  netDebit: number;
  netCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export default function TrialBalanceClient() {
  const [startDate, setStartDate] = useState(getYearStartDate());
  const [endDate, setEndDate] = useState(getCurrentDate());
  const [level, setLevel] = useState("7");
  const [filterType, setFilterType] = useState("");
  const [showDetailed, setShowDetailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceRow[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // TODO: جلب البيانات من API
      toast.success("تم جلب البيانات بنجاح");
      // مؤقتاً بيانات تجريبية
      setTrialBalanceData([]);
    } catch (error) {
      console.error("Error loading trial balance:", error);
      toast.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStartDate(getYearStartDate());
    setEndDate(getCurrentDate());
    setLevel("7");
    setFilterType("");
    setShowDetailed(false);
    setTrialBalanceData([]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast.success("تم تصدير التقرير بنجاح");
  };

  const totals = useMemo(() => {
    return trialBalanceData.reduce(
      (acc, row) => ({
        openingDebit: acc.openingDebit + row.openingDebit,
        openingCredit: acc.openingCredit + row.openingCredit,
        movementDebit: acc.movementDebit + row.movementDebit,
        movementCredit: acc.movementCredit + row.movementCredit,
        netDebit: acc.netDebit + row.netDebit,
        netCredit: acc.netCredit + row.netCredit,
        closingDebit: acc.closingDebit + row.closingDebit,
        closingCredit: acc.closingCredit + row.closingCredit,
      }),
      {
        openingDebit: 0,
        openingCredit: 0,
        movementDebit: 0,
        movementCredit: 0,
        netDebit: 0,
        netCredit: 0,
        closingDebit: 0,
        closingCredit: 0,
      }
    );
  }, [trialBalanceData]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
            <Select
              label="نوع التصفية"
              selectedKeys={filterType ? [filterType] : []}
              onSelectionChange={(keys) =>
                setFilterType(Array.from(keys)[0] as string)
              }
              size="sm"
            >
              <SelectItem key="all">الكل</SelectItem>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                isSelected={showDetailed}
                onValueChange={setShowDetailed}
                size="sm"
              >
                <span className="text-sm">إظهار التفاصيل</span>
              </Switch>
            </div>
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
              ميزان المراجعة
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
            <Table aria-label="Trial Balance Table">
              <TableHeader>
                <TableColumn>الحساب</TableColumn>
                <TableColumn>الرصيد الافتتاحي</TableColumn>
                <TableColumn>الحركة</TableColumn>
                <TableColumn>صافي الحركة</TableColumn>
                <TableColumn>الرصيد الختامي</TableColumn>
              </TableHeader>
              <TableBody emptyContent="لا توجد بيانات">
                {trialBalanceData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {row.accountCode} - {row.accountName}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-4">
                        <span className={row.openingDebit > 0 ? "text-red-600" : ""}>
                          {formatAmount(row.openingDebit, 2)}
                        </span>
                        <span className={row.openingCredit > 0 ? "text-green-600" : ""}>
                          {formatAmount(row.openingCredit, 2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-4">
                        <span className={row.movementDebit > 0 ? "text-red-600" : ""}>
                          {formatAmount(row.movementDebit, 2)}
                        </span>
                        <span className={row.movementCredit > 0 ? "text-green-600" : ""}>
                          {formatAmount(row.movementCredit, 2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-4">
                        <span className={row.netDebit > 0 ? "text-red-600" : ""}>
                          {formatAmount(row.netDebit, 2)}
                        </span>
                        <span className={row.netCredit > 0 ? "text-green-600" : ""}>
                          {formatAmount(row.netCredit, 2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-4">
                        <span className={row.closingDebit > 0 ? "text-red-600" : ""}>
                          {formatAmount(row.closingDebit, 2)}
                        </span>
                        <span className={row.closingCredit > 0 ? "text-green-600" : ""}>
                          {formatAmount(row.closingCredit, 2)}
                        </span>
                      </div>
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
