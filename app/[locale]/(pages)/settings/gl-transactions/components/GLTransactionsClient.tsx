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
  initialHealthSummary?: GLHealthSummary;
}

interface GLHealthIssue {
  transId: number;
  transType: number;
  cashDiff: number;
  goldDiff: number;
  route: string;
  label: string;
}

interface GLHealthSummary {
  totalVouchers: number;
  balancedCount: number;
  unbalancedCount: number;
  issues: GLHealthIssue[];
  lastAudit?: {
    runDate: string;
    status: string;
    totalIssues: number;
  } | null;
}

const statusBadgeClass: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  warnings: "bg-amber-100 text-amber-700 border border-amber-200",
  errors: "bg-red-100 text-red-700 border border-red-200",
};

export default function GLTransactionsClient({
  initialTransactions,
  initialHealthSummary,
}: GLTransactionsClientProps) {
  const router = useRouter();
  const [transactions] = useState<GLTransaction[]>(initialTransactions);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [healthSummary] = useState<GLHealthSummary | undefined>(
    initialHealthSummary,
  );

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

  const totals = useMemo(() => {
    const totalDebit = sortedTransactions.reduce(
      (sum, trans) => sum + Number(trans.debit_base || 0),
      0,
    );
    const totalCredit = sortedTransactions.reduce(
      (sum, trans) => sum + Number(trans.credit_base || 0),
      0,
    );
    const totalGoldDebit = sortedTransactions.reduce(
      (sum, trans) => sum + Number(trans.g_debit_base || 0),
      0,
    );
    const totalGoldCredit = sortedTransactions.reduce(
      (sum, trans) => sum + Number(trans.g_credit_base || 0),
      0,
    );

    const cashDiff = totalDebit - totalCredit;
    const goldDiff = totalGoldDebit - totalGoldCredit;

    return {
      totalDebit,
      totalCredit,
      totalGoldDebit,
      totalGoldCredit,
      cashDiff,
      goldDiff,
      cashBalanced: Math.abs(cashDiff) < 0.01,
      goldBalanced: Math.abs(goldDiff) < 0.01,
    };
  }, [sortedTransactions]);

  const handleViewVoucher = (vouchType: number, vouchId: number) => {
    const route = getVoucherRoute(vouchType, vouchId, "preview");

    router.push(route);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            جميع القيود المحاسبية
          </h1>
        </div>
      </div>

      {healthSummary && (
        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">إجمالي القيود</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {healthSummary.totalVouchers.toLocaleString()}
            </p>
            <div className="mt-3 flex items-center gap-6 text-sm">
              <span className="font-semibold text-emerald-600">
                {healthSummary.balancedCount.toLocaleString()} متوازن
              </span>
              <span className="font-semibold text-red-600">
                {healthSummary.unbalancedCount.toLocaleString()} يحتاج مراجعة
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">أحدث فحص ترحيل</p>
            {healthSummary.lastAudit ? (
              <div className="mt-2 space-y-2">
                <p className="text-lg font-semibold text-gray-900">
                  {formatVoucherDate(healthSummary.lastAudit.runDate)}
                </p>
                <span
                  className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass[healthSummary.lastAudit.status] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}
                >
                  {healthSummary.lastAudit.status === "success" &&
                    "بدون ملاحظات"}
                  {healthSummary.lastAudit.status === "warnings" && "تحذيرات"}
                  {healthSummary.lastAudit.status === "errors" && "أخطاء"}
                  {!["success", "warnings", "errors"].includes(
                    healthSummary.lastAudit.status,
                  ) && healthSummary.lastAudit.status}
                </span>
                <p className="text-sm text-gray-500">
                  {healthSummary.lastAudit.totalIssues} ملاحظة مسجلة
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                لم يتم تسجيل فحص سابق للترحيل.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">قيود تحتاج تدخل</p>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {healthSummary.issues.length}
              </span>
            </div>

            {healthSummary.issues.length === 0 ? (
              <p className="mt-3 text-sm font-semibold text-emerald-600">
                جميع القيود متوازنة ✨
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                {healthSummary.issues.slice(0, 5).map((issue) => (
                  <li
                    key={`${issue.transType}-${issue.transId}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-red-700">
                        {issue.label}
                      </p>
                      <p className="text-xs text-red-600">
                        فرق نقدي: {issue.cashDiff.toFixed(2)} | فرق ذهب:{" "}
                        {issue.goldDiff.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      color="danger"
                      size="sm"
                      variant="light"
                      onPress={() => router.push(issue.route)}
                    >
                      مراجعة
                    </Button>
                  </li>
                ))}
                {healthSummary.issues.length > 5 && (
                  <li className="text-xs text-gray-500">
                    + {healthSummary.issues.length - 5} قيود إضافية تحتاج مراجعة
                  </li>
                )}
              </ul>
            )}
          </div>
        </section>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <Table
            removeWrapper
            aria-label="GL Transactions Table"
            className="min-w-full"
          >
            <TableHeader>
              <TableColumn className="text-center">نوع الحركة</TableColumn>
              <TableColumn className="text-center">رقم الحركة</TableColumn>
              <TableColumn className="text-center">المرجع</TableColumn>
              <TableColumn className="text-center">التاريخ</TableColumn>
              <TableColumn className="text-center">الحساب</TableColumn>
              <TableColumn className="text-center">مدين أساس</TableColumn>
              <TableColumn className="text-center">دائن أساس</TableColumn>
              <TableColumn className="text-center">
                مدين ذهب معاير (جم)
              </TableColumn>
              <TableColumn className="text-center">
                دائن ذهب معاير (جم)
              </TableColumn>
              <TableColumn className="text-center">مركز التكلفة</TableColumn>
              <TableColumn className="text-center">الإجراءات</TableColumn>
            </TableHeader>
            <TableBody>
              {sortedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="text-center py-12 text-gray-500"
                    colSpan={11}
                  >
                    <i className="bi bi-info-circle text-4xl mb-3 block text-gray-400" />
                    <p className="text-lg">لا توجد حركات محاسبية</p>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {sortedTransactions.map((transaction, index) => {
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
                        <TableCell className="text-center text-sm">
                          {transaction.cost || "-"}
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
                  })}

                  <TableRow className="bg-gray-50">
                    <TableCell
                      className="text-center text-sm font-semibold text-gray-700"
                      colSpan={5}
                    >
                      الإجماليات
                    </TableCell>
                    <TableCell className="text-center text-sm font-bold text-emerald-700">
                      {formatAmount(totals.totalDebit)}
                    </TableCell>
                    <TableCell className="text-center text-sm font-bold text-red-600">
                      {formatAmount(totals.totalCredit)}
                    </TableCell>
                    <TableCell className="text-center text-sm font-bold text-amber-600">
                      {formatAmount(totals.totalGoldDebit)}
                    </TableCell>
                    <TableCell className="text-center text-sm font-bold text-amber-600">
                      {formatAmount(totals.totalGoldCredit)}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-500">
                      -
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-400">
                      -
                    </TableCell>
                  </TableRow>

                  {(Math.abs(totals.cashDiff) >= 0.01 ||
                    Math.abs(totals.goldDiff) >= 0.01) && (
                    <TableRow className="bg-gray-100">
                      <TableCell
                        className="text-center text-xs font-semibold text-gray-700"
                        colSpan={5}
                      >
                        الفارق
                      </TableCell>
                      <TableCell
                        className={`text-center text-xs font-semibold ${
                          totals.cashBalanced
                            ? "text-emerald-700"
                            : "text-red-600"
                        }`}
                      >
                        {formatAmount(Math.abs(totals.cashDiff))}
                        <span className="mr-1 text-[10px]">
                          ({totals.cashDiff > 0 ? "مدين" : "دائن"})
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-xs text-gray-400">
                        -
                      </TableCell>
                      <TableCell
                        className={`text-center text-xs font-semibold ${
                          totals.goldBalanced
                            ? "text-emerald-700"
                            : "text-red-600"
                        }`}
                      >
                        {formatAmount(Math.abs(totals.goldDiff))}
                        <span className="mr-1 text-[10px]">
                          ({totals.goldDiff > 0 ? "مدين" : "دائن"})
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-xs text-gray-400">
                        -
                      </TableCell>
                      <TableCell className="text-center text-xs text-gray-400">
                        -
                      </TableCell>
                      <TableCell className="text-center text-xs text-gray-400">
                        -
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
