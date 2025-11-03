"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Button,
  Input,
  Switch,
  Select,
  SelectItem,
  Card,
  CardBody,
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
  FunnelIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { accountService } from "@/services/api";
import { formatAmount } from "@/utilities/formatAmount";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return dateString;

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
};

interface AccountStatementTransaction {
  date: string;
  type: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  project?: string;
}

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

export default function AccountStatementClient() {
  const [advancedAnalysis, setAdvancedAnalysis] = useState(true);
  const [startDate, setStartDate] = useState(getYearStartDate());
  const [endDate, setEndDate] = useState(getCurrentDate());
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterOptions, setFilterOptions] = useState<string>("");
  const [project, setProject] = useState<string>("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<AccountStatementTransaction[]>([]);

  // جلب قائمة الحسابات
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accountsData = await accountService.getAllAccounts();
        setAccounts(accountsData || []);
      } catch (error) {
        console.error("Error loading accounts:", error);
        toast.error("حدث خطأ أثناء تحميل الحسابات");
      }
    };

    loadAccounts();
  }, []);

  // حساب الرصيد
  const calculateBalance = useCallback(() => {
    let balance = 0;
    const balanceTransactions: AccountStatementTransaction[] = [];

    // الرصيد الافتتاحي (سيتم حسابه من API لاحقاً)
    const openingBalanceDate = new Date(startDate);
    openingBalanceDate.setDate(openingBalanceDate.getDate() - 1);
    balanceTransactions.push({
      date: formatDate(openingBalanceDate.toISOString()),
      type: "",
      description: "الرصيد الافتتاحي",
      reference: "",
      debit: 0,
      credit: 0,
      balance: 0, // سيتم حسابه من API
    });

    // إضافة الحركات (سيتم جلبها من API)
    transactions.forEach((transaction) => {
      balance += transaction.credit - transaction.debit;
      balanceTransactions.push({
        ...transaction,
        balance,
      });
    });

    // حساب الإجماليات
    const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
    const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);

    // إضافة صف الإجمالي
    balanceTransactions.push({
      date: "",
      type: "",
      description: "المجموع",
      reference: "",
      debit: totalDebit,
      credit: totalCredit,
      balance: 0,
    });

    // إضافة صف صافي الحركة
    const netMovement = totalCredit - totalDebit;
    balanceTransactions.push({
      date: formatDate(endDate),
      type: "",
      description: "صافي الحركة",
      reference: "",
      debit: netMovement > 0 ? 0 : Math.abs(netMovement),
      credit: netMovement > 0 ? netMovement : 0,
      balance: 0,
    });

    // إضافة الرصيد الختامي
    balanceTransactions.push({
      date: formatDate(endDate),
      type: "",
      description: "الرصيد الختامي",
      reference: "",
      debit: 0,
      credit: 0,
      balance,
    });

    return balanceTransactions;
  }, [transactions, startDate, endDate]);

  const balanceTransactions = useMemo(() => calculateBalance(), [calculateBalance]);

  // البحث عن كشف الحساب
  const handleSearch = async () => {
    if (!selectedAccountId) {
      toast.error("يرجى اختيار الحساب");
      return;
    }

    setLoading(true);
    try {
      // TODO: استدعاء API لجلب كشف الحساب
      // const statementData = await accountService.getAccountStatement({
      //   accountId: selectedAccountId,
      //   startDate,
      //   endDate,
      // });
      
      // مؤقتاً: بيانات تجريبية
      const mockTransactions: AccountStatementTransaction[] = [
        {
          date: "2025-11-03",
          type: "فاتورة مبيعات",
          description: "ماجد",
          reference: "INV1",
          debit: 0,
          credit: 2000,
          balance: 2000,
        },
        {
          date: "2025-11-03",
          type: "إشعار دائن",
          description: "ماجد - CRN1",
          reference: "CRN1",
          debit: 1000,
          credit: 0,
          balance: 1000,
        },
      ];

      setTransactions(mockTransactions);
    } catch (error) {
      console.error("Error loading account statement:", error);
      toast.error("حدث خطأ أثناء جلب كشف الحساب");
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setAdvancedAnalysis(true);
    setStartDate(getYearStartDate());
    setEndDate(getCurrentDate());
    setSelectedAccountId("");
    setFilterType("");
    setFilterOptions("");
    setProject("");
    setTransactions([]);
  };

  const selectedAccount = accounts.find((acc) => String(acc.id) === selectedAccountId);

  return (
    <>
      {/* Filters */}
      <div className="responsive-filters mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch
              isSelected={advancedAnalysis}
              onValueChange={setAdvancedAnalysis}
              size="sm"
            />
            <span className="text-sm">تحليل متقدم</span>
          </div>

          <Input
            type="date"
            size="sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="min-w-[150px]"
          />

          <Input
            type="date"
            size="sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="min-w-[150px]"
          />

          <Select
            size="sm"
            placeholder="اختر الحساب"
            selectedKeys={selectedAccountId ? [selectedAccountId] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;
              setSelectedAccountId(val || "");
            }}
            className="min-w-[250px]"
          >
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.acc_id} - {account.acc_name}
              </SelectItem>
            ))}
          </Select>

          <Select
            size="sm"
            placeholder="نوع التصفية"
            selectedKeys={filterType ? [filterType] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;
              setFilterType(val || "");
            }}
            className="min-w-[150px]"
          >
            <SelectItem key="all" value="all">
              الكل
            </SelectItem>
          </Select>

          <Select
            size="sm"
            placeholder="خيارات التصفية"
            selectedKeys={filterOptions ? [filterOptions] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;
              setFilterOptions(val || "");
            }}
            className="min-w-[150px]"
          >
            <SelectItem key="all" value="all">
              الكل
            </SelectItem>
          </Select>

          <Input
            size="sm"
            placeholder="مشروع: خيارات التصفية"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="min-w-[200px]"
          />

          <Button
            className="btn-secondary"
            size="sm"
            onPress={handleSearch}
            isLoading={loading}
          >
            <MagnifyingGlassIcon className="h-4 w-4" /> بحث
          </Button>

          <Button
            className="btn-secondary"
            size="sm"
            onPress={resetFilters}
          >
            <ArrowPathIcon className="h-4 w-4" /> إعادة تعيين
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <Card>
        <CardBody className="p-6">
          {/* Report Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              كشف الحساب {selectedAccount ? `${selectedAccount.acc_id} - ${selectedAccount.acc_name}` : ""}
            </h2>
            <p className="text-lg text-gray-600 mb-2">(NAJAH)</p>
            <p className="text-sm text-gray-500">
              من {formatDate(startDate)} إلى {formatDate(endDate)}
            </p>
          </div>

          {/* Empty State */}
          {!selectedAccountId && (
            <div className="text-center py-12 text-gray-500">
              <p>يرجى اختيار حساب لعرض كشف الحساب</p>
            </div>
          )}

          {/* Report Table */}
          {selectedAccountId && (
            <div className="overflow-x-auto">
              <Table aria-label="Account Statement Table">
                <TableHeader>
                  <TableColumn>التاريخ</TableColumn>
                  <TableColumn>النوع</TableColumn>
                  <TableColumn>وصف العملية</TableColumn>
                  <TableColumn>المرجع</TableColumn>
                  <TableColumn>مدين</TableColumn>
                  <TableColumn>دائن</TableColumn>
                  <TableColumn>الرصيد</TableColumn>
                  <TableColumn>مشروع</TableColumn>
                </TableHeader>
                <TableBody>
                  {balanceTransactions.map((transaction, index) => {
                    const isTotalRow = transaction.description === "المجموع";
                    const isOpeningBalance = transaction.description === "الرصيد الافتتاحي";
                    const isClosingBalance = transaction.description === "الرصيد الختامي";
                    const isNetMovement = transaction.description === "صافي الحركة";

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {transaction.date ? formatDate(transaction.date) : ""}
                        </TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>
                          <span
                            className={
                              isTotalRow || isOpeningBalance || isClosingBalance || isNetMovement
                                ? "font-bold"
                                : ""
                            }
                          >
                            {transaction.description}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.reference}</TableCell>
                        <TableCell>
                          {transaction.debit > 0 ? (
                            <span className="font-semibold text-gray-700">
                              {formatAmount(transaction.debit)}
                            </span>
                          ) : (
                            "0.00"
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.credit > 0 ? (
                            <span className="font-semibold text-green-600">
                              {formatAmount(transaction.credit)}
                            </span>
                          ) : (
                            "0.00"
                          )}
                        </TableCell>
                        <TableCell>
                          {(transaction.balance !== 0 || isOpeningBalance || isClosingBalance) && (
                            <span
                              className={`font-semibold ${
                                isClosingBalance ? "text-blue-600" : "text-gray-700"
                              }`}
                            >
                              {formatAmount(Math.abs(transaction.balance))}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{transaction.project || ""}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

        </CardBody>
      </Card>
    </>
  );
}

