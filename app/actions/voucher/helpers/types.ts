/**
 * Shared types for voucher actions
 */

export interface SaveVoucherData {
  vouch_id: number;
  vouch_date: string;
  vouch_type: number;
  vouch_amt: number;
  vouch_notes?: string;
  vouch_status?: number;
  pay_type: number;
  ref_no?: string;
  opps_vouch?: number;
  cust_id?: number | null;
  handling?: string | null;
}

export interface VoucherDetailData {
  id?: number;
  vouch_id: number;
  acc_id: number;
  debit: number | undefined;
  credit: number | undefined;
  debit_base?: number | undefined;
  credit_base?: number | undefined;
  p_debit?: number | undefined;
  p_credit?: number | undefined;
  gauge: number | undefined;
  g_debit: number | undefined;
  g_credit: number | undefined;
  g_debit_base?: number | undefined;
  g_credit_base?: number | undefined;
  vouch_notes?: string;
  cost_id?: number | null;
}

export interface VoucherBoxData {
  id?: number;
  box_id: number;
  amount: number;
  vouch_notes?: string;
  cost_id?: number | null;
  inv_id?: number;
  close_weight?: number;
}

export interface GVoucherDetailData {
  id?: number;
  item_id: number;
  k?: number;
  weight?: number;
  g_weight?: number;
  weight2?: number;
  g_weight2?: number;
  box_id?: number;
  notes?: string;
  diff?: number;
  close_amt?: number;
  close_weight?: number;
  inv_id?: number | null;
  cost_id?: number | null;
  work_amt?: number;
  total_work?: number;
  qty?: number;
}
