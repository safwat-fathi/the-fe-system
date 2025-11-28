/**
 * Shared types for voucher actions
 */

export interface SaveVoucherData {
  vouch_id: number | string;
  vouch_date: string;
  vouch_type: number;
  vouch_amt: number;
  vouch_notes?: string;
  vouch_status?: number;
  pay_type?: number | null;
  ref_no?: string;
  opps_vouch?: number;
  cust_id?: number | null;
  handling?: string | null;
  cost_id?: number | null;
}

export interface VoucherDetailData {
  id?: number;
  vouch_id: number | string;
  acc_id: number;
  debit: number | undefined;
  credit: number | undefined;
  debit_base?: number | null;
  credit_base?: number | null;
  p_debit?: number | undefined;
  p_credit?: number | undefined;
  gauge: number | undefined;
  g_debit?: number | null;
  g_credit?: number | null;
  g_debit_base?: number | null;
  g_credit_base?: number | null;
  debit_g?: number | null;
  credit_g?: number | null;
  vouch_notes?: string;
  cost_id?: number | null;
}

export interface VoucherBoxData {
  id?: number;
  box_id: number;
  amount: number;
  vouch_notes?: string;
  cost_id?: number | null;
  inv_id?: number | null;
  close_weight?: number | null;
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
