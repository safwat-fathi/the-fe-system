export type GLAuditLogStatus = "success" | "warnings" | "errors";

export interface GLAuditLogIssue {
  transType: number;
  transId: number;
  voucherMasterId: number;
  message: string;
  cashDiff: number;
  goldDiff: number;
  detailTotals: {
    debit: number;
    credit: number;
    goldDebit: number;
    goldCredit: number;
  };
  glTotals: {
    debit: number;
    credit: number;
    goldDebit: number;
    goldCredit: number;
  };
}

export interface CreateGLAuditLogPayload {
  run_date: string;
  from_date: string;
  to_date: string;
  voucher_type?: number | null;
  cost_center_id?: number | null;
  customer_id?: number | null;
  status: GLAuditLogStatus;
  total_vouchers: number;
  total_issues: number;
  issues: GLAuditLogIssue[];
  notes?: string | null;
}

export interface GLAuditLog extends CreateGLAuditLogPayload {
  id: number;
  created_at: string;
  created_by: string | null;
}

