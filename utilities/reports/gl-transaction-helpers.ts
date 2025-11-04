/**
 * Utilities for processing GL Transaction data for reports
 */

import { GLTransaction } from "@/types/models/gl-transaction";
import { glTransactionService } from "@/services/api";
import { IParams } from "@/types/services/base";

/**
 * Fetch GL transactions with filters
 */
export async function fetchGLTransactions(
  params: {
    fromDate?: string;
    toDate?: string;
    accountId?: string | number;
    transType?: string | number;
    transId?: string | number;
    costId?: string | number;
    custId?: string | number;
    com?: string | number;
    year?: string | number;
  } = {},
): Promise<GLTransaction[]> {
  try {
    const apiParams: IParams = {
      xcom_id: String(params.com || "1"),
      xyear_id: String(params.year || "0"),
      xfrom_date: params.fromDate || "0",
      xto_date: params.toDate || "0",
      xtrans_type: String(params.transType || "0"),
      xtrans_id: String(params.transId || "0"),
      xcost_id: String(params.costId || "0"),
      xcust_id: String(params.custId || "0"),
      xacc_id: String(params.accountId || "0"),
    };

    const response = await glTransactionService.getAll(apiParams);

    const responseData = (response as any)?.data || response || [];
    const transactions = Array.isArray(responseData)
      ? responseData
      : Array.isArray((response as any)?.results)
        ? (response as any).results
        : [];

    return transactions as GLTransaction[];
  } catch (error) {
    console.error("Error fetching GL transactions:", error);

    return [];
  }
}

/**
 * Group transactions by account
 */
export function groupTransactionsByAccount(
  transactions: GLTransaction[],
): Map<string | number, GLTransaction[]> {
  const grouped = new Map<string | number, GLTransaction[]>();

  transactions.forEach((transaction) => {
    const accId = transaction.acc || transaction.acc_id;

    if (!accId) return;

    const accIdStr = String(accId);

    if (!grouped.has(accIdStr)) {
      grouped.set(accIdStr, []);
    }

    grouped.get(accIdStr)!.push(transaction);
  });

  return grouped;
}

/**
 * Calculate account balance from transactions
 */
export function calculateAccountBalance(
  transactions: GLTransaction[],
): {
  totalDebit: number;
  totalCredit: number;
  balance: number; // debit - credit (positive = debit balance, negative = credit balance)
} {
  let totalDebit = 0;
  let totalCredit = 0;

  transactions.forEach((transaction) => {
    const debit = parseFloat(String(transaction.debit_base || 0));
    const credit = parseFloat(String(transaction.credit_base || 0));

    totalDebit += debit;
    totalCredit += credit;
  });

  const balance = totalDebit - totalCredit;

  return {
    totalDebit,
    totalCredit,
    balance,
  };
}

/**
 * Calculate opening balance (transactions before startDate)
 */
export async function calculateOpeningBalance(
  accountId: string | number,
  startDate: string,
  com?: string | number,
): Promise<{
  totalDebit: number;
  totalCredit: number;
  balance: number;
}> {
  try {
    // Format startDate for API (subtract 1 day to get all transactions before startDate)
    const startDateObj = new Date(startDate);

    startDateObj.setDate(startDateObj.getDate() - 1);
    const beforeStartDate = startDateObj.toISOString().split("T")[0];

    const transactions = await fetchGLTransactions({
      fromDate: "0", // from beginning
      toDate: beforeStartDate,
      accountId,
      com,
    });

    return calculateAccountBalance(transactions);
  } catch (error) {
    console.error("Error calculating opening balance:", error);

    return {
      totalDebit: 0,
      totalCredit: 0,
      balance: 0,
    };
  }
}

/**
 * Format transaction for display in reports
 */
export function formatTransactionForReport(
  transaction: GLTransaction,
  accountName?: string,
): {
  date: string;
  accountId: string | number;
  accountName: string;
  type: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  debitGold?: number;
  creditGold?: number;
  transId: number;
  transType: number;
  seq: number;
  cost?: number | null;
  cust?: number | null;
} {
  const debitValue = parseFloat(String(transaction.debit_base || 0));
  const creditValue = parseFloat(String(transaction.credit_base || 0));
  const debitGold = parseFloat(String(transaction.g_debit_base || 0));
  const creditGold = parseFloat(String(transaction.g_credit_base || 0));

  return {
    date: transaction.d || transaction.cr_date || "",
    accountId: transaction.acc || transaction.acc_id || "",
    accountName: accountName || "",
    type: transaction.type || "",
    description: transaction.note || transaction.type || "",
    reference: transaction.ref || transaction.trans_id?.toString() || "",
    debit: debitValue,
    credit: creditValue,
    debitGold: debitGold > 0 ? debitGold : undefined,
    creditGold: creditGold > 0 ? creditGold : undefined,
    transId: transaction.trans_id || 0,
    transType: transaction.trans_type || 0,
    seq: transaction.seq || 0,
    cost: transaction.cost || null,
    cust: transaction.cust || transaction.cust2 || null,
  };
}

/**
 * Sort transactions by date and sequence
 */
export function sortTransactionsByDateAndSeq(
  transactions: GLTransaction[],
): GLTransaction[] {
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.d || a.cr_date || "").getTime();
    const dateB = new Date(b.d || b.cr_date || "").getTime();

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // If same date, sort by sequence
    const seqA = a.seq || 0;
    const seqB = b.seq || 0;

    return seqA - seqB;
  });
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(
  transactions: GLTransaction[],
  startDate?: string,
  endDate?: string,
): GLTransaction[] {
  if (!startDate && !endDate) {
    return transactions;
  }

  return transactions.filter((transaction) => {
    const transDate = transaction.d || transaction.cr_date;

    if (!transDate) return false;

    const date = new Date(transDate);

    if (startDate) {
      const start = new Date(startDate);

      start.setHours(0, 0, 0, 0);

      if (date < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);

      end.setHours(23, 59, 59, 999);

      if (date > end) return false;
    }

    return true;
  });
}

/**
 * Get account summary from transactions
 */
export function getAccountSummary(
  transactions: GLTransaction[],
  accountId: string | number,
): {
  accountId: string | number;
  transactionCount: number;
  totalDebit: number;
  totalCredit: number;
  balance: number;
} {
  const accountTransactions = transactions.filter(
    (t) => String(t.acc || t.acc_id || "") === String(accountId),
  );

  const { totalDebit, totalCredit, balance } =
    calculateAccountBalance(accountTransactions);

  return {
    accountId,
    transactionCount: accountTransactions.length,
    totalDebit,
    totalCredit,
    balance,
  };
}

