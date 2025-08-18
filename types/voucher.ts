export interface Voucher {
  id?: number;
  vouch_id: number;
  vouch_date: string;
  vouch_type: number;
  vouch_amt: number;
  vouch_notes?: string;
  vouch_status?: number;
  cr_date: string;
  acc_id?: number;
  cur_id?: number;
  cust_id?: number;
  cr_user?: string;
  upd_date?: string;
  upd_user?: string;
  Address?: number;
  attachments?: string;
  bag_wt?: number;
  commit?: boolean;
  inv_id_id?: number;
  mobile?: number;
  opps_vouch?: boolean;
  pay_type: number;
  post?: boolean;
  print?: boolean;
  ref_no?: string;
  vat_no?: number;
  com_id?: number;
  year_id?: number;
}

export interface VoucherDetail {
  id?: number;
  credit: number;
  debit: number;
  tax_prc?: number;
  tax?: number;
  vouch_notes?: string;
  vouch_status?: number;
  cr_date: string;
  acc_id: number;
  acc_code?: string; // رمز الحساب
  acc_name?: string; // اسم الحساب
  cr_user?: string;
  upd_date?: string;
  upd_user?: string;
  vouch_id: number;
  base_credit?: number;
  base_debit?: number;
  p_credit?: number;
  p_debit?: number;
  change?: number;
  com_id?: number;
  cost_id?: number;
  credit_g?: number;
  cur_id?: number;
  cust_id?: number;
  debit_g?: number;
  g_credit?: number;
  g_debit?: number;
  gauge?: number;
  inv_id?: number;
  vat_no?: number;
}

export interface VoucherBox {
  id?: number;
  vouch_id: number;
  box_id: number;
  amount: number;
  amount_g?: number;
  tax_prc?: number;
  tax?: number;
  total_amount?: number;
  vouch_notes?: string;
  cr_date: string;
  cr_user?: string;
  upd_date?: string;
  upd_user?: string;
  com_id?: number;
}

export interface VoucherFormData {
  voucher: Voucher;
  details: VoucherDetail[];
  boxDetails: VoucherBox[];
}
