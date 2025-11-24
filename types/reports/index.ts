/**
 * Centralized report types
 * أنواع التقارير الموحدة
 */

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  accountId?: number;
  accountIds?: number[];
  branchId?: number;
  yearId?: number;
}

export interface ReportSummary {
  totalDebit: number;
  totalCredit: number;
  totalDebitG: number;
  totalCreditG: number;
  balance: number;
  balanceG: number;
}

export interface PaginatedReportResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AccountStatementTransaction {
  date: string;
  type: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface GLTransactionSummary {
  transId: number;
  transType: number;
  date: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  totalDebitG: number;
  totalCreditG: number;
  isBalanced: boolean;
}
