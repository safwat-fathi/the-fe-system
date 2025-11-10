import { Metadata } from "next";

import GLTransactionsClient from "./components/GLTransactionsClient";

import Breadcrumb from "@/components/Breadcrumb";
import { glTransactionService } from "@/services/api";
import { getVoucherRoute, getVoucherTypeName } from "@/utilities/voucher/routing";
import type { GLTransaction } from "@/types/models/gl-transaction";
import type { GLAuditLog } from "@/types/models/gl-audit-log";

export const metadata: Metadata = {
  title: "القيد المحاسبي - NafeesWeb",
  description: "عرض جميع القيود المحاسبية",
};

export const revalidate = 60;

const NUMERIC_TOLERANCE = 0.01;

type HealthIssue = {
  transId: number;
  transType: number;
  cashDiff: number;
  goldDiff: number;
  route: string;
  label: string;
};

type HealthSummary = {
  totalVouchers: number;
  balancedCount: number;
  unbalancedCount: number;
  issues: HealthIssue[];
  lastAudit?: {
    runDate: string;
    status: string;
    totalIssues: number;
  } | null;
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : 0;
}

function extractLogs(payload: any): GLAuditLog[] {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload as GLAuditLog[];
  }

  if (Array.isArray(payload.results)) {
    return payload.results as GLAuditLog[];
  }

  return [];
}

function buildHealthSummary(transactions: GLTransaction[]): HealthSummary {
  const grouped = new Map<
    string,
    { transType: number; transId: number; rows: GLTransaction[] }
  >();

  for (const row of transactions) {
    const transType = Number(row.trans_type || 0);
    const transId = Number(row.trans_id || 0);

    if (!Number.isFinite(transType) || !Number.isFinite(transId)) {
      continue;
    }

    const key = `${transType}-${transId}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        transType,
        transId,
        rows: [],
      });
    }

    grouped.get(key)!.rows.push(row);
  }

  let balancedCount = 0;
  let unbalancedCount = 0;
  const issues: HealthIssue[] = [];

  for (const group of grouped.values()) {
    const totals = group.rows.reduce(
      (acc, trx) => {
        acc.debit += toNumber(trx.debit_base ?? trx.debit);
        acc.credit += toNumber(trx.credit_base ?? trx.credit);
        acc.goldDebit += toNumber(trx.g_debit_base ?? trx.g_debit);
        acc.goldCredit += toNumber(trx.g_credit_base ?? trx.g_credit);

        return acc;
      },
      { debit: 0, credit: 0, goldDebit: 0, goldCredit: 0 },
    );

    const cashDiff = Math.abs(totals.debit - totals.credit);
    const goldDiff = Math.abs(totals.goldDebit - totals.goldCredit);
    const isBalanced =
      cashDiff < NUMERIC_TOLERANCE && goldDiff < NUMERIC_TOLERANCE;

    if (isBalanced) {
      balancedCount++;
    } else {
      unbalancedCount++;
      issues.push({
        transId: group.transId,
        transType: group.transType,
        cashDiff: Number(cashDiff.toFixed(4)),
        goldDiff: Number(goldDiff.toFixed(4)),
        route: getVoucherRoute(group.transType, group.transId, "preview"),
        label: `${getVoucherTypeName(group.transType)} #${group.transId}`,
      });
    }
  }

  return {
    totalVouchers: grouped.size,
    balancedCount,
    unbalancedCount,
    issues,
    lastAudit: null,
  };
}

export default async function GLTransactionsPage() {
  // جلب جميع الحركات من gl_transaction
  const response = await glTransactionService.getAll({
    xcom_id: "1",
    xyear_id: "0",
    xfrom_date: "0",
    xto_date: "0",
    xtrans_id: "0",
    xtrans_type: "0",
  });

  const transactions =
    response.success && response.data
      ? Array.isArray(response.data)
        ? response.data
        : []
      : [];

  const healthSummary = buildHealthSummary(transactions as GLTransaction[]);

  return (
    <div className="font-cairo space-y-4 p-4">
      <Breadcrumb />
      <GLTransactionsClient
        initialTransactions={transactions}
        initialHealthSummary={healthSummary}
      />
    </div>
  );
}
