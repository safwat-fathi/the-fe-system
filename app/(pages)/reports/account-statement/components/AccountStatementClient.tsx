"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Button,
  Input,
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { accountService, glTransactionService } from "@/services/api";
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
  const [startDate, setStartDate] = useState(getYearStartDate());
  const [endDate, setEndDate] = useState(getCurrentDate());
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<
    AccountStatementTransaction[]
  >([]);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [accountSearchValue, setAccountSearchValue] = useState<string>("");

  // جلب قائمة الحسابات الأولية
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

  // فلترة الحسابات حسب البحث (للعرض في Autocomplete)
  const accountOptions = useMemo(() => {
    if (!accountSearchValue.trim()) {
      return accounts.map((acc: any) => ({
        key: String(acc.id),
        id: acc.id,
        acc_id: acc.acc_id,
        acc_name: acc.acc_name,
        label: `${acc.acc_id} - ${acc.acc_name}`,
      }));
    }

    const searchTerm = accountSearchValue.toLowerCase().trim();
    return accounts
      .filter((acc: any) => {
        const accountCode = (acc.acc_id ?? "").toString().toLowerCase();
        const accountName = (acc.acc_name ?? "").toLowerCase();

        return accountCode.includes(searchTerm) || accountName.includes(searchTerm);
      })
      .map((acc: any) => ({
        key: String(acc.id),
        id: acc.id,
        acc_id: acc.acc_id,
        acc_name: acc.acc_name,
        label: `${acc.acc_id} - ${acc.acc_name}`,
      }));
  }, [accounts, accountSearchValue]);

  // اختيار حساب
  const handleAccountSelection = useCallback((key: React.Key | null) => {
    if (!key) {
      setSelectedAccount(null);
      setSelectedAccountId("");
      setAccountSearchValue("");
      return;
    }

    const selectedKey = String(key);
    const account = accounts.find((acc: any) => String(acc.id) === selectedKey);
    
    if (account) {
      setSelectedAccount(account);
      setSelectedAccountId(selectedKey);
      setAccountSearchValue(`${account.acc_id} - ${account.acc_name}`);
    }
  }, [accounts]);

  // حساب الرصيد
  const calculateBalance = useCallback(() => {
    let balance = openingBalance;
    const balanceTransactions: AccountStatementTransaction[] = [];

    // إضافة صف الرصيد الافتتاحي
    const openingBalanceDate = new Date(startDate);
    openingBalanceDate.setDate(openingBalanceDate.getDate() - 1);
    balanceTransactions.push({
      date: formatDate(openingBalanceDate.toISOString()),
      type: "",
      description: "الرصيد الافتتاحي",
      reference: "",
      debit: balance < 0 ? Math.abs(balance) : 0,
      credit: balance > 0 ? balance : 0,
      balance: balance,
    });

    // إضافة الحركات مع حساب الرصيد المتجمع
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
      debit: balance < 0 ? Math.abs(balance) : 0,
      credit: balance > 0 ? balance : 0,
      balance: balance,
    });

    return balanceTransactions;
  }, [transactions, startDate, endDate, openingBalance]);

  const balanceTransactions = useMemo(
    () => calculateBalance(),
    [calculateBalance],
  );

  // البحث عن كشف الحساب
  const handleSearch = async () => {
    if (!selectedAccountId || !selectedAccount) {
      toast.error("يرجى اختيار الحساب");

      return;
    }

    setLoading(true);
    try {
      // استخدام acc_id للتصفية
      // قد يحتاج الـ backend إلى acc_id (string) أو acc (number) حسب الـ API
      const accountIdToFilter = selectedAccount.acc_id || String(selectedAccount.id);
      
      // تحويل التواريخ من YYYY-MM-DD إلى timestamp أو format مناسب للـ API
      const startDateFormatted = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
      const endDateFormatted = endDate ? new Date(endDate).toISOString().split('T')[0] : '';

      // بناء المعاملات مع إرسال كل من acc و acc_id للتوافق
      const apiParams: any = {
        xcom_id: 1,
        xyear_id: 0,
        xtrans_type: 0, // 0 = جميع الأنواع
        xtrans_id: 0, // 0 = جميع القيود
        xfrom_date: startDateFormatted || "0",
        xto_date: endDateFormatted || "0",
      };

      // إضافة معامل تصفية الحساب - جرب acc_id أولاً (عادة يكون هذا هو المطلوب)
      if (accountIdToFilter) {
        apiParams.acc_id = accountIdToFilter;
        // أيضاً أضف acc كبديل في حالة كان الـ backend يحتاجه
        apiParams.acc = accountIdToFilter;
      }

      console.log("[Account Statement] API Request Params:", apiParams);

      const response = await glTransactionService.getAll(apiParams);

      // Handle different response types
      const responseData = (response as any)?.data || response || [];
      const glTransactions = Array.isArray(responseData)
        ? responseData
        : Array.isArray((response as any)?.results)
          ? (response as any).results
          : [];

      // تحويل البيانات من gl_transaction إلى AccountStatementTransaction
      const convertedTransactions: AccountStatementTransaction[] = glTransactions
        .filter((transaction: any) => {
          // فلترة إضافية حسب التاريخ (في حالة عدم دعم API للفلترة)
          if (startDate && transaction.d) {
            const transDate = new Date(transaction.d);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            return transDate >= start && transDate <= end;
          }
          return true;
        })
        .map((transaction: any) => {
          const debitValue = parseFloat(String(transaction.debit || 0));
          const creditValue = parseFloat(String(transaction.credit || 0));

          return {
            date: transaction.d || transaction.cr_date || "",
            type: transaction.type || "",
            description: transaction.note || transaction.type || "",
            reference: transaction.ref || transaction.trans_id?.toString() || "",
            debit: debitValue,
            credit: creditValue,
            balance: 0, // سيتم حسابه لاحقاً
            project: transaction.cost ? `مركز تكلفة ${transaction.cost}` : "",
          };
        })
        .sort((a: AccountStatementTransaction, b: AccountStatementTransaction) => {
          // ترتيب حسب التاريخ
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          
          if (dateA !== dateB) {
            return dateA - dateB;
          }
          
          // إذا كان التاريخ نفسه، ترتيب حسب seq
          return 0;
        });

      setTransactions(convertedTransactions);
      
      // حساب الرصيد الافتتاحي
      if (selectedAccountId && startDate) {
        try {
          const openingBalanceDate = new Date(startDate);
          openingBalanceDate.setDate(openingBalanceDate.getDate() - 1);
          const openingDateStr = openingBalanceDate.toISOString().split('T')[0];

          const openingApiParams: any = {
            xcom_id: 1,
            xyear_id: 0,
            xtrans_type: 0,
            xtrans_id: 0,
            xfrom_date: "0",
            xto_date: openingDateStr,
          };

          if (accountIdToFilter) {
            openingApiParams.acc_id = accountIdToFilter;
            openingApiParams.acc = accountIdToFilter;
          }

          const openingResponse = await glTransactionService.getAll(openingApiParams);

          // Handle different response types
          const openingResponseData =
            (openingResponse as any)?.data || openingResponse || [];
          const openingTransactions = Array.isArray(openingResponseData)
            ? openingResponseData
            : Array.isArray((openingResponse as any)?.results)
              ? (openingResponse as any).results
              : [];

          if (openingTransactions.length > 0) {

            let balance = 0;
            openingTransactions.forEach((trans: any) => {
              const debit = parseFloat(String(trans.debit || 0));
              const credit = parseFloat(String(trans.credit || 0));
              balance += credit - debit;
            });
            
            setOpeningBalance(balance);
          } else {
            setOpeningBalance(0);
          }
        } catch (error) {
          console.warn("Error calculating opening balance:", error);
          setOpeningBalance(0);
        }
      } else {
        setOpeningBalance(0);
      }
      
      if (convertedTransactions.length === 0) {
        toast.success("لا توجد حركات للحساب المحدد في الفترة المحددة");
      } else {
        toast.success(`تم جلب ${convertedTransactions.length} حركة`);
      }
    } catch (error) {
      console.error("Error loading account statement:", error);
      
      // رسالة خطأ أكثر تفصيلاً
      const errorMessage = error instanceof Error 
        ? error.message 
        : "حدث خطأ أثناء جلب كشف الحساب";
      
      toast.error(
        errorMessage.includes("500") || errorMessage.includes("Internal Server Error")
          ? "خطأ في الخادم: يرجى التحقق من معاملات API أو التواصل مع المطور"
          : errorMessage
      );
      
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      {/* Filters */}
      <div className="mb-6">
        <Card className="overflow-visible">
          <CardBody className="p-4 overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  من تاريخ
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  size="sm"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  إلى تاريخ
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  size="sm"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الحساب واسم الحساب
                </label>
                <Autocomplete
                  placeholder="ابحث عن الحساب (رقم الحساب أو الاسم)..."
                  size="sm"
                  className="w-full"
                  items={accountOptions}
                  selectedKey={selectedAccountId || null}
                  inputValue={accountSearchValue}
                  onInputChange={(value) => {
                    setAccountSearchValue(value);
                    // إذا تم مسح النص، إلغاء اختيار الحساب
                    if (!value) {
                      setSelectedAccount(null);
                      setSelectedAccountId("");
                    }
                  }}
                  onSelectionChange={handleAccountSelection}
                  inputProps={{
                    startContent: <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />,
                  }}
                  allowsCustomValue={false}
                  menuTrigger="input"
                  variant="bordered"
                >
                  {(account) => (
                    <AutocompleteItem key={account.key} textValue={account.label}>
                      {account.label}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
              </div>

              <div>
                <Button
                  className="btn-secondary w-full"
                  isLoading={loading}
                  size="md"
                  onPress={handleSearch}
                >
                  <MagnifyingGlassIcon className="h-4 w-4" /> بحث
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Report Content */}
      <Card>
        <CardBody className="p-6">
          {/* Report Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              كشف الحساب{" "}
              {selectedAccount
                ? `${selectedAccount.acc_id} - ${selectedAccount.acc_name}`
                : ""}
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
                    const isOpeningBalance =
                      transaction.description === "الرصيد الافتتاحي";
                    const isClosingBalance =
                      transaction.description === "الرصيد الختامي";
                    const isNetMovement =
                      transaction.description === "صافي الحركة";

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {transaction.date ? formatDate(transaction.date) : ""}
                        </TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>
                          <span
                            className={
                              isTotalRow ||
                              isOpeningBalance ||
                              isClosingBalance ||
                              isNetMovement
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
                          {(transaction.balance !== 0 ||
                            isOpeningBalance ||
                            isClosingBalance) && (
                            <span
                              className={`font-semibold ${
                                isClosingBalance
                                  ? "text-blue-600"
                                  : "text-gray-700"
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
