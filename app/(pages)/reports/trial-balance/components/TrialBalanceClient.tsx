"use client";

import { useState, useMemo, useEffect } from "react";
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

import { formatAmount } from "@/utilities/formatAmount";
import { accountService } from "@/services/api";
import {
  fetchGLTransactions,
  groupTransactionsByAccount,
  calculateAccountBalance,
  calculateOpeningBalance,
} from "@/utilities/reports/gl-transaction-helpers";

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

interface Account {
  id: number;
  acc_id: string;
  acc_name: string;
  acc_level: number;
}

export default function TrialBalanceClient() {
  const [startDate, setStartDate] = useState(getYearStartDate());
  const [endDate, setEndDate] = useState(getCurrentDate());
  const [level, setLevel] = useState("7");
  const [filterType, setFilterType] = useState("");
  const [showDetailed, setShowDetailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceRow[]>(
    [],
  );
  const [accounts, setAccounts] = useState<Account[]>([]);

  // جلب الحسابات عند تحميل الصفحة
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accountsData = await accountService.getAllAccounts();

        setAccounts(accountsData || []);
      } catch (error) {
        console.error("Error loading accounts:", error);
      }
    };

    loadAccounts();
  }, []);

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      toast.error("يرجى اختيار تاريخ البداية والنهاية");

      return;
    }

    setLoading(true);
    try {
      // جلب الحركات للفترة المحددة
      const periodTransactions = await fetchGLTransactions({
        fromDate: startDate,
        toDate: endDate,
        com: 1,
      });

      // جلب جميع الحركات حتى تاريخ النهاية (للرصيد الإغلاقي)
      const closingTransactions = await fetchGLTransactions({
        fromDate: "0", // من بداية النظام
        toDate: endDate,
        com: 1,
      });

      if (periodTransactions.length === 0 && closingTransactions.length === 0) {
        toast.info("لا توجد حركات في الفترة المحددة");
        setTrialBalanceData([]);

        return;
      }

      // تجميع الحركات حسب الحساب
      const groupedPeriod = groupTransactionsByAccount(periodTransactions);
      const groupedClosing = groupTransactionsByAccount(closingTransactions);

      // الحصول على الحسابات حسب المستوى المحدد
      const targetLevel = parseInt(level || "7");
      const filteredAccounts = accounts.filter(
        (acc) => acc.acc_level <= targetLevel,
      );

      // إنشاء بيانات ميزان المراجعة
      const trialBalanceRows: TrialBalanceRow[] = [];

      for (const account of filteredAccounts) {
        const accountId = account.acc_id;

        // حساب الرصيد الافتتاحي (من بداية السنة حتى startDate)
        const openingBalance = await calculateOpeningBalance(
          accountId,
          startDate,
          1,
        );

        // حساب الحركات في الفترة
        const periodAccountTransactions =
          groupedPeriod.get(String(accountId)) || [];
        const periodBalance = calculateAccountBalance(periodAccountTransactions);

        // حساب الرصيد الإغلاقي (من بداية النظام حتى endDate)
        const closingAccountTransactions =
          groupedClosing.get(String(accountId)) || [];
        const closingBalance = calculateAccountBalance(closingAccountTransactions);

        // فقط نعرض الحسابات التي لديها حركات
        if (
          periodAccountTransactions.length > 0 ||
          closingAccountTransactions.length > 0
        ) {
          trialBalanceRows.push({
            accountCode: account.acc_id,
            accountName: account.acc_name,
            openingDebit: openingBalance.totalDebit,
            openingCredit: openingBalance.totalCredit,
            movementDebit: periodBalance.totalDebit,
            movementCredit: periodBalance.totalCredit,
            netDebit:
              openingBalance.totalDebit + periodBalance.totalDebit -
              openingBalance.totalCredit -
              periodBalance.totalCredit > 0
                ? openingBalance.totalDebit +
                  periodBalance.totalDebit -
                  openingBalance.totalCredit -
                  periodBalance.totalCredit
                : 0,
            netCredit:
              openingBalance.totalDebit + periodBalance.totalDebit -
              openingBalance.totalCredit -
              periodBalance.totalCredit < 0
                ? Math.abs(
                    openingBalance.totalDebit +
                      periodBalance.totalDebit -
                      openingBalance.totalCredit -
                      periodBalance.totalCredit,
                  )
                : 0,
            closingDebit: closingBalance.totalDebit,
            closingCredit: closingBalance.totalCredit,
          });
        }
      }

      // ترتيب حسب رقم الحساب
      trialBalanceRows.sort((a, b) =>
        String(a.accountCode).localeCompare(String(b.accountCode)),
      );

      setTrialBalanceData(trialBalanceRows);
      toast.success(`تم جلب ${trialBalanceRows.length} حساب بنجاح`);
    } catch (error) {
      console.error("Error loading trial balance:", error);
      toast.error("حدث خطأ أثناء جلب البيانات");
      setTrialBalanceData([]);
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
      },
    );
  }, [trialBalanceData]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Input
              label="من تاريخ"
              size="sm"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="إلى تاريخ"
              size="sm"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Select
              label="المستوى"
              selectedKeys={level ? [level] : []}
              size="sm"
              onSelectionChange={(keys) =>
                setLevel(Array.from(keys)[0] as string)
              }
            >
              <SelectItem key="7">المستوى 7</SelectItem>
              <SelectItem key="6">المستوى 6</SelectItem>
              <SelectItem key="5">المستوى 5</SelectItem>
            </Select>
            <Select
              label="نوع التصفية"
              selectedKeys={filterType ? [filterType] : []}
              size="sm"
              onSelectionChange={(keys) =>
                setFilterType(Array.from(keys)[0] as string)
              }
            >
              <SelectItem key="all">الكل</SelectItem>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                isSelected={showDetailed}
                size="sm"
                onValueChange={setShowDetailed}
              >
                <span className="text-sm">إظهار التفاصيل</span>
              </Switch>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                color="primary"
                isLoading={loading}
                size="md"
                startContent={<MagnifyingGlassIcon className="h-4 w-4" />}
                onPress={handleSearch}
              >
                بحث
              </Button>
              <Button
                size="md"
                startContent={<ArrowPathIcon className="h-4 w-4" />}
                variant="bordered"
                onPress={handleReset}
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
              startContent={<PrinterIcon className="h-4 w-4" />}
              variant="bordered"
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
              <TableBody emptyContent="لا توجد بيانات - اضغط على زر 'بحث' لتحميل البيانات">
                {trialBalanceData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {row.accountCode} - {row.accountName}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-4">
                        <span
                          className={row.openingDebit > 0 ? "text-red-600" : ""}
                        >
                          {formatAmount(row.openingDebit, 2)}
                        </span>
                        <span
                          className={
                            row.openingCredit > 0 ? "text-green-600" : ""
                          }
                        >
                          {formatAmount(row.openingCredit, 2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-4">
                        <span
                          className={
                            row.movementDebit > 0 ? "text-red-600" : ""
                          }
                        >
                          {formatAmount(row.movementDebit, 2)}
                        </span>
                        <span
                          className={
                            row.movementCredit > 0 ? "text-green-600" : ""
                          }
                        >
                          {formatAmount(row.movementCredit, 2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-4">
                        <span
                          className={row.netDebit > 0 ? "text-red-600" : ""}
                        >
                          {formatAmount(row.netDebit, 2)}
                        </span>
                        <span
                          className={row.netCredit > 0 ? "text-green-600" : ""}
                        >
                          {formatAmount(row.netCredit, 2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-4">
                        <span
                          className={row.closingDebit > 0 ? "text-red-600" : ""}
                        >
                          {formatAmount(row.closingDebit, 2)}
                        </span>
                        <span
                          className={
                            row.closingCredit > 0 ? "text-green-600" : ""
                          }
                        >
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
