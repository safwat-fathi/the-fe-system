"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { formatAmount } from "@/utilities/formatAmount";
import { GLTransaction } from "@/types/models/gl-transaction";
import { accountService } from "@/services/api";
import { useEffect, useState, useMemo } from "react";

interface GLTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  transactions: GLTransaction[];
  voucherId: number;
  refNo?: string;
}

export default function GLTransactionModal({
  isOpen,
  onClose,
  loading,
  transactions,
  voucherId,
  refNo,
}: GLTransactionModalProps) {
  const [accounts, setAccounts] = useState<any[]>([]);

  // جلب الحسابات عند فتح المودال
  useEffect(() => {
    if (isOpen && accounts.length === 0) {
      const loadAccounts = async () => {
        try {
          const accountsData = await accountService.getAllAccounts();
          setAccounts(accountsData || []);
        } catch (error) {
          console.error("Error loading accounts:", error);
        }
      };
      loadAccounts();
    }
  }, [isOpen, accounts.length]);

  // دالة للحصول على اسم الحساب
  const getAccountName = (accId: number | string | null | undefined): string => {
    if (!accId) return "";
    const account = accounts.find((acc) => acc.id === Number(accId) || acc.acc_id === String(accId));
    return account ? account.acc_name || "" : "";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalContent className="max-h-[85vh]">
        <ModalHeader className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex flex-col w-full">
            <h3 className="text-xl font-bold text-indigo-900">القيد المحاسبي</h3>
            <p className="text-sm text-gray-600 mt-1">
              القيد رقم: <span className="font-semibold">{voucherId}</span>{" "}
              {refNo && (
                <>
                  - المرجع: <span className="font-semibold">{refNo}</span>
                </>
              )}
            </p>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="mr-4 text-gray-600">جاري التحميل...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <i className="bi bi-info-circle text-4xl mb-3 block text-gray-400" />
              <p className="text-lg">لا توجد سجلات ترحيل لهذا القيد</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table
                  aria-label="GL Transactions Table"
                  className="min-w-full"
                  removeWrapper
                >
                    <TableHeader>
                      <TableColumn className="text-center">#</TableColumn>
                      <TableColumn className="text-center">الحساب</TableColumn>
                      <TableColumn className="text-center">مدين (ر.س)</TableColumn>
                      <TableColumn className="text-center">دائن (ر.س)</TableColumn>
                      <TableColumn className="text-center">مدين أساس</TableColumn>
                      <TableColumn className="text-center">دائن أساس</TableColumn>
                      <TableColumn className="text-center">مدين ذهب معاير (جم)</TableColumn>
                      <TableColumn className="text-center">دائن ذهب معاير (جم)</TableColumn>
                    </TableHeader>
                  <TableBody>
                      {transactions.map((transaction, index) => {
                        const debit = Number(transaction.debit || 0);
                        const credit = Number(transaction.credit || 0);
                        const debitBase = Number(transaction.debit_base || 0);
                        const creditBase = Number(transaction.credit_base || 0);
                        const gDebitBase = Number(transaction.g_debit_base || 0);
                        const gCreditBase = Number(transaction.g_credit_base || 0);
                        const accountName = getAccountName(transaction.acc);

                        return (
                          <TableRow key={transaction.id || index}>
                            <TableCell className="text-center text-sm">
                              {transaction.seq || index + 1}
                            </TableCell>
                            <TableCell className="text-center text-sm font-medium">
                              {transaction.acc ? (
                                <span>
                                  {transaction.acc}
                                  {accountName && (
                                    <span className="text-gray-500 mr-1">
                                      {" - "}
                                      {accountName}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {debit > 0 ? (
                                <span className="font-semibold text-gray-800">
                                  {formatAmount(debit)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {credit > 0 ? (
                                <span className="font-semibold text-green-600">
                                  {formatAmount(credit)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {debitBase > 0 ? formatAmount(debitBase) : "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {creditBase > 0 ? formatAmount(creditBase) : "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {gDebitBase > 0 ? formatAmount(gDebitBase) : "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {gCreditBase > 0 ? formatAmount(gCreditBase) : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {/* صف الإجماليات */}
                      {(() => {
                        const totals = transactions.reduce(
                          (acc, trans) => {
                            acc.totalDebit += Number(trans.debit || 0);
                            acc.totalCredit += Number(trans.credit || 0);
                            acc.totalDebitBase += Number(trans.debit_base || 0);
                            acc.totalCreditBase += Number(trans.credit_base || 0);
                            acc.totalGDebitBase += Number(trans.g_debit_base || 0);
                            acc.totalGCreditBase += Number(trans.g_credit_base || 0);
                            return acc;
                          },
                          {
                            totalDebit: 0,
                            totalCredit: 0,
                            totalDebitBase: 0,
                            totalCreditBase: 0,
                            totalGDebitBase: 0,
                            totalGCreditBase: 0,
                          },
                        );

                        return (
                          <TableRow className="bg-gradient-to-r from-gray-50 to-slate-50 border-t-2 border-gray-300">
                            <TableCell
                              colSpan={2}
                              className="text-center font-bold text-base text-gray-800"
                            >
                              الإجمالي
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-bold text-gray-900">
                                {formatAmount(totals.totalDebit)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-bold text-green-700">
                                {formatAmount(totals.totalCredit)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-gray-700">
                                {formatAmount(totals.totalDebitBase)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-gray-700">
                                {formatAmount(totals.totalCreditBase)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-yellow-600">
                                {formatAmount(totals.totalGDebitBase)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-yellow-600">
                                {formatAmount(totals.totalGCreditBase)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })()}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

