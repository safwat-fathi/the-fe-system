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
import Breadcrumb from "@/components/Breadcrumb";

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
      // استخدام xacc_id للتصفية حسب الحساب
      // acc_id في Account هو رقم الحساب (string مثل "1131324")
      // acc في GLTransaction هو رقم الحساب أيضاً (number أو string)
      const accountIdToFilter = selectedAccount.acc_id || String(selectedAccount.id);
      
      console.log("[Account Statement] Account Info:", {
        selectedAccountId: selectedAccountId,
        accountIdToFilter: accountIdToFilter,
        acc_id: selectedAccount.acc_id,
        id: selectedAccount.id,
        acc_name: selectedAccount.acc_name,
      });
      
      // تحويل التواريخ من YYYY-MM-DD إلى timestamp أو format مناسب للـ API
      const startDateFormatted = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
      const endDateFormatted = endDate ? new Date(endDate).toISOString().split('T')[0] : '';

      // بناء المعاملات - جميع المعاملات مطلوبة الآن
      const apiParams: any = {
        xcom_id: 1,
        xyear_id: 0,
        xtrans_type: 0, // 0 = جميع الأنواع
        xtrans_id: 0, // 0 = جميع القيود
        xfrom_date: startDateFormatted || "0",
        xto_date: endDateFormatted || "0",
        xcost_id: 0, // 0 = جميع مراكز التكلفة
        xcust_id: 0, // 0 = جميع العملاء
        xacc_id: accountIdToFilter || "0", // رقم الحساب للتصفية
      };

      console.log("[Account Statement] API Request Params:", apiParams);

      const response = await glTransactionService.getAll(apiParams);

      // Handle different response types
      const responseData = (response as any)?.data || response || [];
      const glTransactions = Array.isArray(responseData)
        ? responseData
        : Array.isArray((response as any)?.results)
          ? (response as any).results
          : [];

      console.log("[Account Statement] Raw API Response:", {
        totalTransactions: glTransactions.length,
        sampleTransaction: glTransactions[0] || null,
        allFieldNames: glTransactions.length > 0 ? Object.keys(glTransactions[0]) : [],
      });

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
        .map((transaction: any, index: number) => {
          // استخدام debit_base و credit_base فقط (للنقد الأساسي)
          // debit_base و credit_base هي المبالغ الصحيحة حسب نوع GLTransaction
          const debitValue = parseFloat(String(transaction.debit_base || 0));
          const creditValue = parseFloat(String(transaction.credit_base || 0));

          // التحقق من أن الحركة للحساب المحدد (استخدام acc الذي هو رقم الحساب في GLTransaction)
          // acc في GLTransaction قد يكون number أو string
          const transAccId = String(transaction.acc || transaction.acc_id || "").trim();
          const targetAccId = String(accountIdToFilter).trim();

          // Log تفصيلي لكل حركة
          if (process.env.NODE_ENV === "development") {
            console.log(`[Transaction ${index + 1}]:`, {
              date: transaction.d || transaction.cr_date || transaction.date,
              acc: transaction.acc,
              acc_id: transaction.acc_id,
              target_acc_id: targetAccId,
              matches: transAccId === targetAccId,
              debit_base: transaction.debit_base,
              credit_base: transaction.credit_base,
              debit: transaction.debit, // للتوثيق فقط
              credit: transaction.credit, // للتوثيق فقط
              final_debit: debitValue,
              final_credit: creditValue,
              ref: transaction.ref || transaction.reference,
              note: transaction.note || transaction.description,
              trans_id: transaction.trans_id || transaction.id,
              trans_type: transaction.trans_type,
            });
          }

          // التحقق من أن الحركة للحساب المحدد فقط
          if (transAccId !== targetAccId) {
            console.warn(`[Transaction ${index + 1}] Skipped - Wrong Account:`, {
              transaction_acc: transAccId,
              target_acc: targetAccId,
            });
            // إرجاع null ليتم فلترتها لاحقاً
            return null;
          }

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
        .filter((transaction: AccountStatementTransaction | null): transaction is AccountStatementTransaction => transaction !== null) // إزالة الحركات المفلترة
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
      // الرصيد الافتتاحي = مجموع جميع الحركات قبل تاريخ البداية
      // ولكن فقط إذا كان تاريخ البداية يسبق تاريخ أول حركة في الحساب
      if (selectedAccountId && startDate && accountIdToFilter) {
        try {
          // أولاً: جلب تاريخ أول حركة للحساب (للتأكد من وجود رصيد افتتاحي)
          const firstTransactionParams: any = {
            xcom_id: 1,
            xyear_id: 0,
            xtrans_type: 0,
            xtrans_id: 0,
            xfrom_date: "0", // من بداية النظام
            xto_date: "9999-12-31", // حتى نهاية النظام
            xcost_id: 0,
            xcust_id: 0,
            xacc_id: accountIdToFilter,
          };

          const firstTransactionResponse = await glTransactionService.getAll(firstTransactionParams);
          const firstTransactionData = (firstTransactionResponse as any)?.data || firstTransactionResponse || [];
          const allTransactions = Array.isArray(firstTransactionData)
            ? firstTransactionData
            : Array.isArray((firstTransactionResponse as any)?.results)
              ? (firstTransactionResponse as any).results
              : [];

          // فلترة الحركات للحساب المحدد فقط وترتيبها حسب التاريخ
          const validTransactions = allTransactions
            .filter((trans: any) => {
              const transAccId = String(trans.acc || trans.acc_id || "").trim();
              return transAccId === String(accountIdToFilter).trim() && trans.d;
            })
            .sort((a: any, b: any) => {
              const dateA = new Date(a.d).getTime();
              const dateB = new Date(b.d).getTime();
              return dateA - dateB;
            });

          // إذا كانت هناك حركات، نحصل على تاريخ أول حركة
          let firstTransactionDate: Date | null = null;
          if (validTransactions.length > 0) {
            firstTransactionDate = new Date(validTransactions[0].d);
            firstTransactionDate.setHours(0, 0, 0, 0);
          }

          const startDateObj = new Date(startDate);
          startDateObj.setHours(0, 0, 0, 0);

          console.log("[Account Statement] First Transaction Check:", {
            hasTransactions: validTransactions.length > 0,
            firstTransactionDate: firstTransactionDate?.toISOString().split('T')[0] || "No transactions",
            startDate: startDateObj.toISOString().split('T')[0],
            shouldCalculateOpeningBalance: firstTransactionDate ? startDateObj > firstTransactionDate : false,
          });

          // إذا كان تاريخ البداية يسبق أو يساوي تاريخ أول حركة، لا يوجد رصيد افتتاحي
          if (!firstTransactionDate || startDateObj <= firstTransactionDate) {
            console.log("[Account Statement] No opening balance - start date is before or equal to first transaction date");
            setOpeningBalance(0);
          } else {
            // حساب الرصيد الافتتاحي من الحركات قبل تاريخ البداية
            const openingBalanceDate = new Date(startDate);
            openingBalanceDate.setDate(openingBalanceDate.getDate() - 1);
            const openingDateStr = openingBalanceDate.toISOString().split('T')[0];

            const openingApiParams: any = {
              xcom_id: 1,
              xyear_id: 0, // 0 = جميع السنوات (لضمان حساب الرصيد من جميع السنوات السابقة)
              xtrans_type: 0, // 0 = جميع الأنواع
              xtrans_id: 0, // 0 = جميع القيود
              xfrom_date: "0", // من بداية النظام
              xto_date: openingDateStr, // حتى يوم قبل تاريخ البداية
              xcost_id: 0, // 0 = جميع مراكز التكلفة
              xcust_id: 0, // 0 = جميع العملاء
              xacc_id: accountIdToFilter, // رقم الحساب المحدد فقط
            };

            console.log("[Account Statement] Opening Balance Request:", {
              accountId: accountIdToFilter,
              accountName: selectedAccount.acc_name,
              openingDate: openingDateStr,
              params: openingApiParams,
            });

            const openingResponse = await glTransactionService.getAll(openingApiParams);

            // Handle different response types
            const openingResponseData =
              (openingResponse as any)?.data || openingResponse || [];
            const openingTransactions = Array.isArray(openingResponseData)
              ? openingResponseData
              : Array.isArray((openingResponse as any)?.results)
                ? (openingResponse as any).results
                : [];

            console.log("[Account Statement] Opening Balance Transactions:", {
              count: openingTransactions.length,
              transactions: openingTransactions.slice(0, 5), // أول 5 حركات للفحص
            });

            if (openingTransactions.length > 0) {
              let balance = 0;
              let filteredCount = 0;
              
              openingTransactions.forEach((trans: any) => {
                // التحقق من أن الحركة للحساب المحدد فقط
                // استخدام acc (رقم الحساب في GLTransaction) وليس acc_id
                // acc قد يكون number أو string
                const transAccId = String(trans.acc || trans.acc_id || "").trim();
                const targetAccId = String(accountIdToFilter).trim();
                
                // إذا كانت الحركة للحساب المحدد
                if (transAccId === targetAccId) {
                  // استخدام debit_base و credit_base فقط (للنقد الأساسي)
                  const debit = parseFloat(String(trans.debit_base || 0));
                  const credit = parseFloat(String(trans.credit_base || 0));
                  balance += credit - debit;
                  filteredCount++;
                  
                  // Log للتحقق من الحركات
                  if (process.env.NODE_ENV === "development") {
                    console.log("[Opening Balance] Valid Transaction:", {
                      date: trans.d || trans.cr_date,
                      debit,
                      credit,
                      acc_id: transAccId,
                      note: trans.note,
                      balanceAfter: balance,
                    });
                  }
                } else {
                  // Log للحركات التي تم تجاهلها
                  if (process.env.NODE_ENV === "development") {
                    console.warn("[Opening Balance] Filtered Out Transaction (Wrong Account):", {
                      date: trans.d || trans.cr_date,
                      trans_acc_id: transAccId,
                      target_acc_id: targetAccId,
                      note: trans.note,
                    });
                  }
                }
              });
              
              console.log("[Account Statement] Opening Balance Filtering:", {
                totalTransactions: openingTransactions.length,
                filteredTransactions: filteredCount,
                finalBalance: balance,
              });
              
              console.log("[Account Statement] Calculated Opening Balance:", balance);
              setOpeningBalance(balance);
            } else {
              console.log("[Account Statement] No opening transactions found, balance = 0");
              setOpeningBalance(0);
            }
          }
        } catch (error) {
          console.error("Error calculating opening balance:", error);
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



  // بناء breadcrumb items مع تفاصيل الحساب إذا كان محدداً
  const breadcrumbItems = useMemo(() => {
    const items = [
      { name: "تقارير", href: "/reports" },
      { 
        name: selectedAccount 
          ? `كشف حساب ${selectedAccount.acc_id} - ${selectedAccount.acc_name}`
          : "كشف حساب"
      },
    ];
    return items;
  }, [selectedAccount]);

  return (
    <>
      {/* Breadcrumb with account details */}
      {selectedAccount && (
        <Breadcrumb 
          items={breadcrumbItems} 
          showHome={false}
          className="mb-4"
        />
      )}

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
