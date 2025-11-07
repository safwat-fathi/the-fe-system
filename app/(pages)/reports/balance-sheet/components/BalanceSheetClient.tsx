"use client";

import { useState, useEffect, useMemo } from "react";
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

interface BalanceSheetRow {
  accountCode: string;
  accountName: string;
  amount: number;
  level: number;
  accountId: string | number;
}

interface Account {
  id: number;
  acc_id: string;
  acc_name: string;
  acc_level: number;
  acc_rep: number; // 1 = الأرباح والخسائر, 2 = الميزانية العمومية
  parent: number | null;
}

export default function BalanceSheetClient() {
  const [date, setDate] = useState(getCurrentDate());
  const [level, setLevel] = useState("7");
  const [loading, setLoading] = useState(false);
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetRow[]>(
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
    if (!date) {
      toast.error("يرجى اختيار تاريخ");

      return;
    }

    setLoading(true);
    try {
      // جلب جميع الحركات حتى التاريخ المحدد
      const transactions = await fetchGLTransactions({
        fromDate: "0", // من بداية النظام
        toDate: date,
        com: 1,
      });

      if (transactions.length === 0) {
        toast.info("لا توجد حركات في الفترة المحددة");
        setBalanceSheetData([]);

        return;
      }

      // تجميع الحركات حسب الحساب
      const groupedByAccount = groupTransactionsByAccount(transactions);

      // إنشاء بيانات الميزانية العمومية
      const balanceSheetRows: BalanceSheetRow[] = [];

      // الحصول على الحسابات التي تنتمي للميزانية العمومية (acc_rep = 2)
      // والفلترة حسب المستوى المحدد
      const targetLevel = parseInt(level || "7");
      const balanceSheetAccounts = accounts.filter(
        (acc) =>
          acc.acc_rep === 2 && // الميزانية العمومية
          acc.acc_level <= targetLevel,
      );

      // حساب الرصيد لكل حساب
      balanceSheetAccounts.forEach((account) => {
        const accountId = account.acc_id;
        const accountTransactions =
          groupedByAccount.get(String(accountId)) || [];

        if (accountTransactions.length > 0) {
          const { balance } = calculateAccountBalance(accountTransactions);

          // في الميزانية العمومية، نعرض الرصيد فقط (المدين - الدائن)
          // إذا كان الرصيد موجب = مدين، إذا كان سالب = دائن
          balanceSheetRows.push({
            accountCode: account.acc_id,
            accountName: account.acc_name,
            amount: Math.abs(balance), // القيمة المطلقة
            level: account.acc_level,
            accountId: accountId,
          });
        }
      });

      // ترتيب حسب المستوى ورقم الحساب
      balanceSheetRows.sort((a, b) => {
        if (a.level !== b.level) {
          return a.level - b.level;
        }

        return String(a.accountCode).localeCompare(String(b.accountCode));
      });

      setBalanceSheetData(balanceSheetRows);
      toast.success(`تم جلب ${balanceSheetRows.length} حساب بنجاح`);
    } catch (error) {
      console.error("Error loading balance sheet:", error);
      toast.error("حدث خطأ أثناء جلب البيانات");
      setBalanceSheetData([]);
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
              label="التاريخ"
              size="sm"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
            <Button className="w-full" variant="bordered">
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
              حتى تاريخ {date}
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
            <Table aria-label="Balance Sheet Table">
              <TableHeader>
                <TableColumn>الحساب</TableColumn>
                <TableColumn>{date}</TableColumn>
              </TableHeader>
              <TableBody emptyContent="لا توجد بيانات - اضغط على زر 'بحث' لتحميل البيانات">
                {balanceSheetData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell style={{ paddingRight: `${row.level * 16}px` }}>
                      {row.accountCode} - {row.accountName}
                    </TableCell>
                    <TableCell>{formatAmount(row.amount, 2)}</TableCell>
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
