"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
} from "@heroui/react";
import { formatAmount } from "@/utilities/formatAmount";
import { GLTransaction } from "@/types/models/gl-transaction";
import { accountService } from "@/services/api";

import "bootstrap-icons/font/bootstrap-icons.css";

// دالة لتنسيق التاريخ
function formatDate(dateString: string): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return dateString;
  }
}

interface GLTransactionsClientProps {
  initialTransactions: GLTransaction[];
}

// دالة للحصول على رابط الحركة حسب نوعها
// نستخدم trans_id (vouch_id) للبحث في الجداول ثم نستخدم id (primary key) للتنقل
function getVoucherRoute(vouchType: number, vouchId: number): string {
  // للتنقل، نستخدم vouch_id مباشرة لأن صفحات [id] تستطيع البحث بـ id أو vouch_id
  switch (vouchType) {
    case 0:
      return `/forms/balance?mode=preview`; // قيد افتتاحي
    case 1:
      return `/forms/voucher1/${vouchId}?mode=preview`; // سند قبض
    case 2:
      return `/forms/voucher1/${vouchId}?mode=preview`; // سند صرف
    case 3:
      return `/forms/voucher/${vouchId}?mode=preview`; // قيد تسوية
    case 4:
      return `/forms/gvoucher4/${vouchId}?mode=preview`; // سند قبض عميل
    case 5:
      return `/forms/gvoucher4/${vouchId}?mode=preview`; // سند صرف عميل
    case 111:
      return `/forms/receipt/${vouchId}?mode=preview`; // استلام
    case 222:
      return `/forms/delivery/${vouchId}?mode=preview`; // تسليم
    default:
      return "#";
  }
}

// دالة للحصول على اسم نوع الحركة
function getVoucherTypeName(vouchType: number): string {
  const typeNames: Record<number, string> = {
    0: "قيد افتتاحي",
    1: "سند قبض",
    2: "سند صرف",
    3: "قيد تسوية",
    4: "سند قبض عميل",
    5: "سند صرف عميل",
    111: "استلام",
    222: "تسليم",
  };
  return typeNames[vouchType] || "غير محدد";
}

export default function GLTransactionsClient({
  initialTransactions,
}: GLTransactionsClientProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<GLTransaction[]>(initialTransactions);
  const [accounts, setAccounts] = useState<any[]>([]);

  // جلب الحسابات
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

  // دالة للحصول على اسم الحساب
  const getAccountName = (accId: number | string | null | undefined): string => {
    if (!accId) return "";
    const account = accounts.find(
      (acc) => acc.id === Number(accId) || acc.acc_id === String(accId),
    );
    return account ? account.acc_name || "" : "";
  };

  // حساب التوازن لكل حركة
  const transactionBalances = useMemo(() => {
    const balances: Record<number, {
      totalDebitBase: number;
      totalCreditBase: number;
      totalGDebitBase: number;
      totalGCreditBase: number;
      isBalanced: boolean;
    }> = {};

    transactions.forEach((trans) => {
      const transId = trans.trans_id || 0;
      if (!balances[transId]) {
        balances[transId] = {
          totalDebitBase: 0,
          totalCreditBase: 0,
          totalGDebitBase: 0,
          totalGCreditBase: 0,
          isBalanced: true,
        };
      }

      balances[transId].totalDebitBase += Number(trans.debit_base || 0);
      balances[transId].totalCreditBase += Number(trans.credit_base || 0);
      balances[transId].totalGDebitBase += Number(trans.g_debit_base || 0);
      balances[transId].totalGCreditBase += Number(trans.g_credit_base || 0);
    });

    // التحقق من التوازن
    Object.keys(balances).forEach((key) => {
      const balance = balances[Number(key)];
      const cashBalanced = Math.abs(balance.totalDebitBase - balance.totalCreditBase) < 0.01;
      const goldBalanced = Math.abs(balance.totalGDebitBase - balance.totalGCreditBase) < 0.01;
      balance.isBalanced = cashBalanced && goldBalanced;
    });

    return balances;
  }, [transactions]);

  // تجميع الحركات حسب trans_id
  const groupedTransactions = useMemo(() => {
    const grouped: Record<number, GLTransaction[]> = {};

    transactions.forEach((trans) => {
      const transId = trans.trans_id || 0;
      if (!grouped[transId]) {
        grouped[transId] = [];
      }
      grouped[transId].push(trans);
    });

    return grouped;
  }, [transactions]);

  // تحويل إلى array وترتيب حسب trans_id
  const groupedArray = useMemo(() => {
    return Object.entries(groupedTransactions)
      .map(([transId, transList]) => ({
        transId: Number(transId),
        transactions: transList,
        firstTransaction: transList[0],
        balance: transactionBalances[Number(transId)],
      }))
      .sort((a, b) => b.transId - a.transId); // ترتيب تنازلي
  }, [groupedTransactions, transactionBalances]);

  const handleViewVoucher = (vouchType: number, vouchId: number) => {
    const route = getVoucherRoute(vouchType, vouchId);
    router.push(route);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">جميع القيود المحاسبية</h1>
          <p className="text-sm text-gray-600 mt-1">
            إجمالي الحركات: {groupedArray.length} | إجمالي السجلات: {transactions.length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <Table
            aria-label="GL Transactions Table"
            className="min-w-full"
            removeWrapper
          >
            <TableHeader>
              <TableColumn className="text-center">#</TableColumn>
              <TableColumn className="text-center">نوع الحركة</TableColumn>
              <TableColumn className="text-center">رقم الحركة</TableColumn>
              <TableColumn className="text-center">المرجع</TableColumn>
              <TableColumn className="text-center">التاريخ</TableColumn>
              <TableColumn className="text-center">عدد السجلات</TableColumn>
              <TableColumn className="text-center">مدين أساس</TableColumn>
              <TableColumn className="text-center">دائن أساس</TableColumn>
              <TableColumn className="text-center">مدين ذهب معاير (جم)</TableColumn>
              <TableColumn className="text-center">دائن ذهب معاير (جم)</TableColumn>
              <TableColumn className="text-center">التوازن</TableColumn>
              <TableColumn className="text-center">الإجراءات</TableColumn>
            </TableHeader>
            <TableBody>
              {groupedArray.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 text-gray-500">
                    <i className="bi bi-info-circle text-4xl mb-3 block text-gray-400" />
                    <p className="text-lg">لا توجد حركات محاسبية</p>
                  </TableCell>
                </TableRow>
              ) : (
                groupedArray.map((group, index) => {
                  const { transId, transactions: transList, firstTransaction, balance } = group;
                  const debitBase = balance.totalDebitBase;
                  const creditBase = balance.totalCreditBase;
                  const gDebitBase = balance.totalGDebitBase;
                  const gCreditBase = balance.totalGCreditBase;

                  return (
                    <TableRow key={transId} className={!balance.isBalanced ? "bg-red-50" : ""}>
                      <TableCell className="text-center text-sm">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">
                        {getVoucherTypeName(firstTransaction.trans_type)}
                      </TableCell>
                      <TableCell className="text-center text-sm font-semibold">
                        {transId}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {firstTransaction.ref || "-"}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {formatDate(firstTransaction.d)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {transList.length}
                      </TableCell>
                      <TableCell className="text-center">
                        {debitBase > 0 ? (
                          <span className="font-semibold text-gray-800">
                            {formatAmount(debitBase)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {creditBase > 0 ? (
                          <span className="font-semibold text-green-600">
                            {formatAmount(creditBase)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {gDebitBase > 0 ? (
                          <span className="font-semibold text-yellow-600">
                            {formatAmount(gDebitBase)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {gCreditBase > 0 ? (
                          <span className="font-semibold text-yellow-600">
                            {formatAmount(gCreditBase)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {balance.isBalanced ? (
                          <Chip color="success" size="sm" variant="flat">
                            متزن
                          </Chip>
                        ) : (
                          <Chip color="danger" size="sm" variant="flat">
                            غير متزن
                          </Chip>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          color="primary"
                          variant="light"
                          onPress={() => handleViewVoucher(firstTransaction.trans_type, transId)}
                        >
                          <i className="bi bi-eye w-4 h-4 me-1" />
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

