/**
 * Centralized voucher types
 * أنواع السندات الموحدة
 */

export type { Voucher, VoucherDetail } from "../voucher";

export interface VoucherFilters {
  vouch_type?: number;
  vouch_id?: number | string;
  from_date?: string;
  to_date?: string;
  vouch_status?: number;
  com_id?: number;
  year_id?: number;
}

export interface VoucherDetailFilters {
  vouch_id: number;
  acc_id?: number;
  com_id?: number;
}

export interface VoucherBoxFilters {
  vouch_id: number;
  box_id?: number;
  com_id?: number;
}

export interface VoucherSummary {
  totalDebit: number;
  totalCredit: number;
  totalDebitG: number;
  totalCreditG: number;
  voucherCount: number;
}

export interface VoucherValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
