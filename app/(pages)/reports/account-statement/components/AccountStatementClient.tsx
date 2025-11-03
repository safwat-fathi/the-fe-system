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
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import AsyncCreatableSelect from "react-select/async-creatable";

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
  const [advancedAnalysis, setAdvancedAnalysis] = useState(true);
  const [startDate, setStartDate] = useState(getYearStartDate());
  const [endDate, setEndDate] = useState(getCurrentDate());
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<string>("");
  const [filterOptions, setFilterOptions] = useState<string>("");
  const [project, setProject] = useState<string>("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<
    AccountStatementTransaction[]
  >([]);
  const [openingBalance, setOpeningBalance] = useState<number>(0);

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

  // دالة البحث في الحسابات
  const loadAccountOptions = useCallback(
    async (inputValue: string): Promise<any[]> => {
      try {
        // إذا لم يكن هناك بحث، إرجاع أول 20 حساب
        if (!inputValue || inputValue.trim().length === 0) {
          const accountsToShow = accounts.slice(0, 20);
          return accountsToShow.map((acc) => ({
            value: String(acc.id),
            label: `${acc.acc_id} - ${acc.acc_name}`,
            account: acc,
          }));
        }

        // البحث في الحسابات المحلية فقط (أسرع وأكثر موثوقية)
        const term = inputValue.trim().toLowerCase();
        const localMatches = accounts.filter((acc: any) => {
          const accountCode = (acc.acc_id ?? "").toString().toLowerCase();
          const accountName = (acc.acc_name ?? "").toLowerCase();

          return accountCode.includes(term) || accountName.includes(term);
        });

        return localMatches.map((acc: any) => ({
          value: String(acc.id),
          label: `${acc.acc_id} - ${acc.acc_name}`,
          account: acc,
        }));
      } catch (error) {
        console.error("Error in loadAccountOptions:", error);
        return [];
      }
    },
    [accounts],
  );

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
    if (!selectedAccountId) {
      toast.error("يرجى اختيار الحساب");

      return;
    }

    setLoading(true);
    try {
      // جلب البيانات من gl_transaction
      const accountId = parseInt(selectedAccountId);
      
      // تحويل التواريخ من YYYY-MM-DD إلى timestamp أو format مناسب للـ API
      const startDateFormatted = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
      const endDateFormatted = endDate ? new Date(endDate).toISOString().split('T')[0] : '';

      const response = await glTransactionService.getAll({
        xcom_id: 1,
        xyear_id: 0,
        xtrans_type: 0, // 0 = جميع الأنواع
        xtrans_id: 0, // 0 = جميع القيود
        xfrom_date: startDateFormatted || 0,
        xto_date: endDateFormatted || 0,
        acc: accountId, // رقم الحساب
      });

      if (!response.success || !response.data) {
        toast.error("فشل جلب بيانات كشف الحساب");
        setTransactions([]);
        return;
      }

      const glTransactions = Array.isArray(response.data) ? response.data : [];

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
        .sort((a, b) => {
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
          const accountId = parseInt(selectedAccountId);
          const openingBalanceDate = new Date(startDate);
          openingBalanceDate.setDate(openingBalanceDate.getDate() - 1);
          const openingDateStr = openingBalanceDate.toISOString().split('T')[0];

          const openingResponse = await glTransactionService.getAll({
            xcom_id: 1,
            xyear_id: 0,
            xtrans_type: 0,
            xtrans_id: 0,
            xfrom_date: 0,
            xto_date: openingDateStr,
            acc: accountId,
          });

          if (openingResponse.success && openingResponse.data) {
            const openingTransactions = Array.isArray(openingResponse.data) 
              ? openingResponse.data 
              : [];

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
      toast.error("حدث خطأ أثناء جلب كشف الحساب");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setAdvancedAnalysis(true);
    setStartDate(getYearStartDate());
    setEndDate(getCurrentDate());
    setSelectedAccountId("");
    setSelectedAccount(null);
    setFilterType("");
    setFilterOptions("");
    setProject("");
    setTransactions([]);
    setOpeningBalance(0);
  };

  return (
    <>
      {/* Filters */}
      <div className="responsive-filters mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch
              isSelected={advancedAnalysis}
              size="sm"
              onValueChange={setAdvancedAnalysis}
            />
            <span className="text-sm">تحليل متقدم</span>
          </div>

          <Input
            className="min-w-[150px]"
            size="sm"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            className="min-w-[150px]"
            size="sm"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <div className="min-w-[250px]">
            <AsyncCreatableSelect
              cacheOptions
              defaultOptions={accounts.slice(0, 20).map((acc) => ({
                value: String(acc.id),
                label: `${acc.acc_id} - ${acc.acc_name}`,
                account: acc,
              }))}
              loadOptions={loadAccountOptions}
              placeholder="ابحث عن الحساب..."
              isClearable
              isSearchable
              value={
                selectedAccount
                  ? {
                      value: String(selectedAccount.id),
                      label: `${selectedAccount.acc_id} - ${selectedAccount.acc_name}`,
                      account: selectedAccount,
                    }
                  : null
              }
              onChange={(selected: any) => {
                if (selected && selected.account) {
                  setSelectedAccount(selected.account);
                  setSelectedAccountId(String(selected.account.id));
                } else {
                  setSelectedAccount(null);
                  setSelectedAccountId("");
                }
              }}
              formatCreateLabel={(inputValue) => `استخدم "${inputValue}"`}
              noOptionsMessage={({ inputValue }) =>
                inputValue
                  ? `لا توجد نتائج للبحث "${inputValue}"`
                  : "ابدأ بالكتابة للبحث..."
              }
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "32px",
                  height: "32px",
                  fontSize: "14px",
                }),
                valueContainer: (base) => ({
                  ...base,
                  height: "32px",
                  padding: "0 8px",
                }),
                input: (base) => ({
                  ...base,
                  margin: "0px",
                }),
                indicatorsContainer: (base) => ({
                  ...base,
                  height: "32px",
                }),
              }}
            />
          </div>

          <Select
            className="min-w-[150px]"
            placeholder="نوع التصفية"
            selectedKeys={filterType ? [filterType] : []}
            size="sm"
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;

              setFilterType(val || "");
            }}
          >
            <SelectItem key="all" value="all">
              الكل
            </SelectItem>
          </Select>

          <Select
            className="min-w-[150px]"
            placeholder="خيارات التصفية"
            selectedKeys={filterOptions ? [filterOptions] : []}
            size="sm"
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;

              setFilterOptions(val || "");
            }}
          >
            <SelectItem key="all" value="all">
              الكل
            </SelectItem>
          </Select>

          <Input
            className="min-w-[200px]"
            placeholder="مشروع: خيارات التصفية"
            size="sm"
            value={project}
            onChange={(e) => setProject(e.target.value)}
          />

          <Button
            className="btn-secondary"
            isLoading={loading}
            size="sm"
            onPress={handleSearch}
          >
            <MagnifyingGlassIcon className="h-4 w-4" /> بحث
          </Button>

          <Button className="btn-secondary" size="sm" onPress={resetFilters}>
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
