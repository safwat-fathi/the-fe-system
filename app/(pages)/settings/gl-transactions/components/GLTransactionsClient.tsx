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
} from "@heroui/react";

import { formatAmount } from "@/utilities/formatAmount";
import { GLTransaction } from "@/types/models/gl-transaction";
import { accountService } from "@/services/api";
import {
  getVoucherRoute,
  getVoucherTypeName,
} from "@/utilities/voucher/routing";
import { formatVoucherDate } from "@/utilities/voucher/formatting";

import "bootstrap-icons/font/bootstrap-icons.css";

interface GLTransactionsClientProps {
  initialTransactions: GLTransaction[];
}

export default function GLTransactionsClient({
  initialTransactions,
}: GLTransactionsClientProps) {
  const router = useRouter();
  const [transactions, setTransactions] =
    useState<GLTransaction[]>(initialTransactions);
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
  const getAccountName = (
    accId: number | string | null | undefined,
  ): string => {
    if (!accId) return "";
    const account = accounts.find(
      (acc) => acc.id === Number(accId) || acc.acc_id === String(accId),
    );

    return account ? account.acc_name || "" : "";
  };

  // ترتيب الحركات حسب trans_id ثم seq
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      // أولاً حسب trans_id
      const transIdA = a.trans_id || 0;
      const transIdB = b.trans_id || 0;

      if (transIdA !== transIdB) {
        return transIdB - transIdA; // ترتيب تنازلي
      }
      // ثم حسب seq
      const seqA = a.seq || 0;
      const seqB = b.seq || 0;

      return seqA - seqB; // ترتيب تصاعدي
    });
  }, [transactions]);

  // حساب التوازن لكل حركة (للتأكد من التوازن)
  const transactionBalances = useMemo(() => {
    const balances: Record<
      number,
      {
        totalDebitBase: number;
        totalCreditBase: number;
        totalGDebitBase: number;
        totalGCreditBase: number;
        isBalanced: boolean;
      }
    > = {};

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
      const cashBalanced =
        Math.abs(balance.totalDebitBase - balance.totalCreditBase) < 0.01;
      const goldBalanced =
        Math.abs(balance.totalGDebitBase - balance.totalGCreditBase) < 0.01;

      balance.isBalanced = cashBalanced && goldBalanced;
    });

    return balances;
  }, [transactions]);

  const handleViewVoucher = (vouchType: number, vouchId: number) => {
    const route = getVoucherRoute(vouchType, vouchId, "preview");

    router.push(route);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            جميع القيود المحاسبية
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            إجمالي السجلات: {sortedTransactions.length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <Table
            removeWrapper
            aria-label="GL Transactions Table"
            className="min-w-full"
          >
            <TableHeader>
              <TableColumn className="text-center">#</TableColumn>
              <TableColumn className="text-center">نوع الحركة</TableColumn>
              <TableColumn className="text-center">رقم الحركة</TableColumn>
              <TableColumn className="text-center">المرجع</TableColumn>
              <TableColumn className="text-center">التاريخ</TableColumn>
              <TableColumn className="text-center">التسلسل</TableColumn>
              <TableColumn className="text-center">الحساب</TableColumn>
              <TableColumn className="text-center">مدين أساس</TableColumn>
              <TableColumn className="text-center">دائن أساس</TableColumn>
              <TableColumn className="text-center">
                مدين ذهب معاير (جم)
              </TableColumn>
              <TableColumn className="text-center">
                دائن ذهب معاير (جم)
              </TableColumn>
              <TableColumn className="text-center">الإجراءات</TableColumn>
            </TableHeader>
            <TableBody>
              {sortedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="text-center py-12 text-gray-500"
                    colSpan={12}
                  >
                    <i className="bi bi-info-circle text-4xl mb-3 block text-gray-400" />
                    <p className="text-lg">لا توجد حركات محاسبية</p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedTransactions.map((transaction, index) => {
                  const transId = transaction.trans_id || 0;
                  const balance = transactionBalances[transId];
                  const debitBase = Number(transaction.debit_base || 0);
                  const creditBase = Number(transaction.credit_base || 0);
                  const gDebitBase = Number(transaction.g_debit_base || 0);
                  const gCreditBase = Number(transaction.g_credit_base || 0);

                  return (
                    <TableRow
                      key={transaction.id || index}
                      className={
                        balance && !balance.isBalanced ? "bg-red-50" : ""
                      }
                    >
                      <TableCell className="text-center text-sm">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">
                        {getVoucherTypeName(transaction.trans_type)}
                      </TableCell>
                      <TableCell className="text-center text-sm font-semibold">
                        {transId}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {transaction.ref || "-"}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {formatVoucherDate(transaction.d)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {transaction.seq || index + 1}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">
                        {transaction.acc ? (
                          <span>
                            {transaction.acc}
                            {getAccountName(transaction.acc) && (
                              <span className="text-gray-500 mr-1">
                                {" - "}
                                {getAccountName(transaction.acc)}
                              </span>
                            )}
                          </span>
                        ) : (
                          "-"
                        )}
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
                        <Button
                          color="primary"
                          size="sm"
                          variant="light"
                          onPress={() =>
                            handleViewVoucher(transaction.trans_type, transId)
                          }
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
