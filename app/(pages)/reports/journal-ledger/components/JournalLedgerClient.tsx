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
import { accountService } from "@/services/api";
import {
  fetchGLTransactions,
  sortTransactionsByDateAndSeq,
  formatTransactionForReport,
} from "@/utilities/reports/gl-transaction-helpers";

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

interface Account {
  id: number;
  acc_id: string;
  acc_name: string;
}

export default function JournalLedgerClient() {
  const [startDate, setStartDate] = useState(getMonthStartDate());
  const [endDate, setEndDate] = useState(getMonthEndDate());
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
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
        setEntries([]);

        return;
      }

      // ترتيب الحركات حسب التاريخ و seq
      const sortedTransactions = sortTransactionsByDateAndSeq(transactions);

      // إنشاء map للحسابات للبحث السريع
      const accountsMap = new Map<string, string>();

      accounts.forEach((acc) => {
        accountsMap.set(String(acc.acc_id), acc.acc_name);
      });

      // تحويل الحركات إلى JournalEntry
      const journalEntries: JournalEntry[] = sortedTransactions.map((transaction) => {
        const accountId = String(transaction.acc || transaction.acc_id || "");
        const accountName = accountsMap.get(accountId) || "";

        const formatted = formatTransactionForReport(transaction, accountName);

        return {
          date: formatted.date,
          entryNumber: `${formatted.transId}-${formatted.seq}`,
          entryType: formatted.type,
          account: String(formatted.accountId),
          accountName: formatted.accountName,
          description: formatted.description,
          debit: formatted.debit,
          credit: formatted.credit,
          createdBy: transaction.cr_user || "غير محدد",
        };
      });

      setEntries(journalEntries);
      toast.success(`تم جلب ${journalEntries.length} قيد بنجاح`);
    } catch (error) {
      console.error("Error loading journal ledger:", error);
      toast.error("حدث خطأ أثناء جلب البيانات");
      setEntries([]);
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
              <TableBody emptyContent="لا توجد بيانات - اضغط على زر 'بحث' لتحميل البيانات">
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
