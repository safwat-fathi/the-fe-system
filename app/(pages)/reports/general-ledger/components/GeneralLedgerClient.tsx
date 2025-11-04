"use client";

import { useState, useEffect } from "react";
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
  getAccountSummary,
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

interface GeneralLedgerRow {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  netMovement: number;
  accountId: string | number;
}

interface Account {
  id: number;
  acc_id: string;
  acc_name: string;
  acc_level: number;
}

export default function GeneralLedgerClient() {
  const [startDate, setStartDate] = useState(getYearStartDate());
  const [endDate, setEndDate] = useState(getCurrentDate());
  const [level, setLevel] = useState("7");
  const [showNetMovement, setShowNetMovement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState<GeneralLedgerRow[]>([]);
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
      // جلب جميع الحركات للفترة المحددة
      const transactions = await fetchGLTransactions({
        fromDate: startDate,
        toDate: endDate,
        com: 1,
      });

      if (transactions.length === 0) {
        toast.info("لا توجد حركات في الفترة المحددة");
        setLedgerData([]);

        return;
      }

      // تجميع الحركات حسب الحساب
      const groupedByAccount = groupTransactionsByAccount(transactions);

      // الحصول على الحسابات حسب المستوى المحدد
      const targetLevel = parseInt(level || "7");
      const filteredAccounts = accounts.filter(
        (acc) => acc.acc_level <= targetLevel,
      );

      // إنشاء بيانات دفتر الأستاذ
      const ledgerRows: GeneralLedgerRow[] = [];

      filteredAccounts.forEach((account) => {
        const accountId = account.acc_id;
        const accountTransactions =
          groupedByAccount.get(String(accountId)) || [];

        if (accountTransactions.length > 0) {
          const { totalDebit, totalCredit, balance } =
            calculateAccountBalance(accountTransactions);

          ledgerRows.push({
            accountCode: account.acc_id,
            accountName: account.acc_name,
            debit: totalDebit,
            credit: totalCredit,
            netMovement: balance, // المدين - الدائن
            accountId: accountId,
          });
        }
      });

      // ترتيب حسب رقم الحساب
      ledgerRows.sort((a, b) =>
        String(a.accountCode).localeCompare(String(b.accountCode)),
      );

      setLedgerData(ledgerRows);
      toast.success(`تم جلب ${ledgerRows.length} حساب بنجاح`);
    } catch (error) {
      console.error("Error loading general ledger:", error);
      toast.error("حدث خطأ أثناء جلب البيانات");
      setLedgerData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStartDate(getYearStartDate());
    setEndDate(getCurrentDate());
    setLevel("7");
    setShowNetMovement(false);
    setLedgerData([]);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <div className="flex items-center gap-2">
              <Switch
                isSelected={showNetMovement}
                size="sm"
                onValueChange={setShowNetMovement}
              >
                <span className="text-sm">عرض صافي الحركة</span>
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
              ملخص دفتر الأستاذ
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
            <Table aria-label="General Ledger Table">
              <TableHeader>
                <TableColumn>الحساب</TableColumn>
                <TableColumn>مدين</TableColumn>
                <TableColumn>دائن</TableColumn>
                <TableColumn
                  className={showNetMovement ? "" : "hidden"}
                >
                  صافي الحركة
                </TableColumn>
              </TableHeader>
              <TableBody emptyContent="لا توجد بيانات - اضغط على زر 'بحث' لتحميل البيانات">
                {ledgerData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {row.accountCode} - {row.accountName}
                    </TableCell>
                    <TableCell>
                      {row.debit > 0 ? formatAmount(row.debit, 2) : ""}
                    </TableCell>
                    <TableCell>
                      {row.credit > 0 ? formatAmount(row.credit, 2) : ""}
                    </TableCell>
                    <TableCell
                      className={showNetMovement ? "" : "hidden"}
                    >
                      {formatAmount(row.netMovement, 2)}
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
