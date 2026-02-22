"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { useTranslations } from "next-intl";

import { GLTransaction } from "@/types/models/gl-transaction";
import { glTransactionService, accountService } from "@/services/api";
import { formatAmount } from "@/utilities/formatAmount";
import { getVoucherTypeName } from "@/utilities/voucher/routing";

import "bootstrap-icons/font/bootstrap-icons.css";

interface GLTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transId: number | string;
  transType: number;
  voucherTitle?: string;
}

export default function GLTransactionModal({
  isOpen,
  onClose,
  transId,
  transType,
  voucherTitle,
}: GLTransactionModalProps) {
  const t = useTranslations("forms.glTransactionModal");
  const [transactions, setTransactions] = useState<GLTransaction[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب القيود عند فتح Modal
  useEffect(() => {
    const numericTransId = Number(transId);

    if (isOpen && transId && Number.isFinite(numericTransId) && numericTransId > 0) {
      loadTransactions();
      loadAccounts();
    } else {
      setTransactions([]);
      setError(null);
    }
  }, [isOpen, transId, transType]);

  const loadTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const numericTransId = Number(transId);
      let transactions: GLTransaction[] = [];
      
      // محاولة 1: استخدام getByTransaction مع skipCache لضمان جلب أحدث البيانات
      try {
        const response = await glTransactionService.getByTransaction(
          transId,
          transType,
          { xyear_id: "0" },
          true, // skipCache: true لضمان جلب أحدث البيانات بعد التعديل
        );

        if (response.success && response.data) {
          transactions = response.data;
        }
      } catch {
        // تجاهل الخطأ ومحاولة الطريقة البديلة
      }
      
      // محاولة 2: إذا فشلت المحاولة الأولى، نستخدم getByType ثم نفلتر محلياً
      if (transactions.length === 0 && Number.isFinite(numericTransId) && numericTransId > 0) {
        try {
          const byTypeResponse = await glTransactionService.getByType(
            transType,
            { xyear_id: "0", skipCache: true }, // skipCache: true لضمان جلب أحدث البيانات
          );
          
          if (byTypeResponse.success && byTypeResponse.data) {
            // تصفية محلياً للعثور على القيود المرتبطة بهذا السند المحدد
            transactions = byTypeResponse.data.filter(
              (glTrans) => Number(glTrans.trans_id) === numericTransId
            );
          }
        } catch {
          // تجاهل الخطأ
        }
      }
      
      if (transactions.length > 0) {
        setTransactions(transactions);
        setError(null);
      } else {
        setError(t("messages.noTransactions"));
        setTransactions([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("messages.fetchError"),
      );
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const accountsData = await accountService.getAllAccounts();

      setAccounts(accountsData || []);
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  };

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

  // ترتيب الحركات حسب seq
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const seqA = a.seq || 0;
      const seqB = b.seq || 0;

      return seqA - seqB;
    });
  }, [transactions]);

  // حساب التوازن
  const balance = useMemo(() => {
    const totals = sortedTransactions.reduce(
      (acc, trans) => {
        acc.debitBase += Number(trans.debit_base || 0);
        acc.creditBase += Number(trans.credit_base || 0);
        acc.gDebitBase += Number(trans.g_debit_base || 0);
        acc.gCreditBase += Number(trans.g_credit_base || 0);

        return acc;
      },
      {
        debitBase: 0,
        creditBase: 0,
        gDebitBase: 0,
        gCreditBase: 0,
      },
    );

    const cashDiff = totals.debitBase - totals.creditBase;
    const goldDiff = totals.gDebitBase - totals.gCreditBase;

    return {
      ...totals,
      cashDiff,
      goldDiff,
      cashBalanced: Math.abs(cashDiff) < 0.01,
      goldBalanced: Math.abs(goldDiff) < 0.01,
      isBalanced: Math.abs(cashDiff) < 0.01 && Math.abs(goldDiff) < 0.01,
    };
  }, [sortedTransactions]);

  const displayTitle =
    voucherTitle ||
    `${getVoucherTypeName(transType)} رقم ${transId}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      classNames={{
        base: "font-cairo",
        header: "border-b border-gray-200",
        footer: "border-t border-gray-200",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-bold text-gray-900">
              {t("title")}
            </h2>
            <span className="text-sm text-gray-600 font-medium">
              {displayTitle}
            </span>
          </div>
        </ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" color="primary" />
              <span className="mr-3 text-gray-600">{t("loading")}</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <i className="bi bi-exclamation-triangle text-4xl text-red-500 mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : sortedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <i className="bi bi-info-circle text-4xl text-gray-400 mb-3" />
              <p className="text-gray-500 text-lg">{t("messages.noTransactions")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* حالة التوازن */}
              <div
                className={`rounded-lg border p-4 ${
                  balance.isBalanced
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i
                      className={`bi ${
                        balance.isBalanced
                          ? "bi-check-circle-fill text-emerald-600"
                          : "bi-x-circle-fill text-red-600"
                      } text-xl`}
                    />
                    <span
                      className={`font-semibold ${
                        balance.isBalanced
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      {balance.isBalanced
                        ? t("status.balanced")
                        : t("status.unbalanced")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {t("status.cash")}:{" "}
                      <span
                        className={
                          balance.cashBalanced
                            ? "text-emerald-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {balance.cashBalanced ? t("status.cashBalanced") : t("status.cashUnbalanced")}
                      </span>
                    </span>
                    <span className="text-gray-600">
                      {t("status.gold")}:{" "}
                      <span
                        className={
                          balance.goldBalanced
                            ? "text-emerald-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {balance.goldBalanced ? t("status.goldBalanced") : t("status.goldUnbalanced")}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* جدول القيود */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table removeWrapper aria-label="GL Transactions Table">
                    <TableHeader>
                      <TableColumn className="text-center">{t("table.columns.seq")}</TableColumn>
                      <TableColumn className="text-center">{t("table.columns.account")}</TableColumn>
                      <TableColumn className="text-center">{t("table.columns.debitBase")}</TableColumn>
                      <TableColumn className="text-center">{t("table.columns.creditBase")}</TableColumn>
                      <TableColumn className="text-center">
                        {t("table.columns.gDebitBase")}
                      </TableColumn>
                      <TableColumn className="text-center">
                        {t("table.columns.gCreditBase")}
                      </TableColumn>
                      <TableColumn className="text-center">
                        {t("table.columns.costCenter")}
                      </TableColumn>
                    </TableHeader>
                    <TableBody>
                      {sortedTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            className="text-center py-12 text-gray-500"
                            colSpan={7}
                          >
                            <i className="bi bi-info-circle text-4xl mb-3 block text-gray-400" />
                            <p className="text-lg">{t("messages.noTransactions")}</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {sortedTransactions.map((transaction, index) => {
                            const debitBase = Number(transaction.debit_base || 0);
                            const creditBase = Number(transaction.credit_base || 0);
                            const gDebitBase = Number(transaction.g_debit_base || 0);
                            const gCreditBase = Number(
                              transaction.g_credit_base || 0,
                            );

                            return (
                              <TableRow key={transaction.id || index}>
                                <TableCell className="text-center text-sm font-medium">
                                  {transaction.seq || index + 1}
                                </TableCell>
                                <TableCell className="text-center text-sm font-medium">
                                  {transaction.acc ? (
                                    <div className="flex flex-col items-center">
                                      <span className="font-semibold text-gray-900">
                                        {transaction.acc}
                                      </span>
                                      {getAccountName(transaction.acc) && (
                                        <span className="text-xs text-gray-500 mt-1">
                                          {getAccountName(transaction.acc)}
                                        </span>
                                      )}
                                    </div>
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
                              </TableRow>
                            );
                          })}

                          {/* صف الإجماليات */}
                          <TableRow className="bg-gray-50 font-semibold">
                            <TableCell
                              className="text-center text-sm text-gray-700"
                              colSpan={2}
                            >
                              {t("table.totals.total")}
                            </TableCell>
                            <TableCell className="text-center text-sm font-bold text-emerald-700">
                              {formatAmount(balance.debitBase)}
                            </TableCell>
                            <TableCell className="text-center text-sm font-bold text-red-600">
                              {formatAmount(balance.creditBase)}
                            </TableCell>
                            <TableCell className="text-center text-sm font-bold text-amber-600">
                              {formatAmount(balance.gDebitBase)}
                            </TableCell>
                            <TableCell className="text-center text-sm font-bold text-amber-600">
                              {formatAmount(balance.gCreditBase)}
                            </TableCell>
                            <TableCell className="text-center text-sm text-gray-500">
                              -
                            </TableCell>
                          </TableRow>

                          {/* صف الفروقات */}
                          {(Math.abs(balance.cashDiff) >= 0.01 ||
                            Math.abs(balance.goldDiff) >= 0.01) && (
                            <TableRow className="bg-gray-100">
                              <TableCell
                                className="text-center text-xs font-semibold text-gray-700"
                                colSpan={2}
                              >
                                {t("table.totals.difference")}
                              </TableCell>
                              <TableCell
                                className={`text-center text-xs font-semibold ${
                                  balance.cashBalanced
                                    ? "text-emerald-700"
                                    : "text-red-600"
                                }`}
                              >
                                {Math.abs(balance.cashDiff) >= 0.01
                                  ? `${formatAmount(Math.abs(balance.cashDiff))} (${
                                      balance.cashDiff > 0 ? t("table.totals.debit") : t("table.totals.credit")
                                    })`
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-center text-xs text-gray-400">
                                -
                              </TableCell>
                              <TableCell
                                className={`text-center text-xs font-semibold ${
                                  balance.goldBalanced
                                    ? "text-emerald-700"
                                    : "text-red-600"
                                }`}
                              >
                                {Math.abs(balance.goldDiff) >= 0.01
                                  ? `${formatAmount(Math.abs(balance.goldDiff))} (${
                                      balance.goldDiff > 0 ? t("table.totals.debit") : t("table.totals.credit")
                                    })`
                                  : "-"}
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
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            {t("actions.close")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
