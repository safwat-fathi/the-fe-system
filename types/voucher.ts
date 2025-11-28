export interface Voucher {
  id?: number;
  vouch_id: number | string;
  vouch_date: string;
  vouch_type: number;
  vouch_amt?: number | null;
  vouch_notes?: string | null;
  vouch_status?: number | null;
  cr_date?: string;
  acc_id?: number | null;
  cur_id?: number | null;
  cust_id?: number | null;
  cust?: number | null;
  cust_name?: string | null;
  cr_user?: string;
  upd_date?: string;
  upd_user?: string;
  address?: string | null;
  attachments?: string | null;
  bag_wt?: number | null;
  commit?: boolean;
  com?: number | null;
  com_id?: number | null;
  cost_id?: number | null;
  box_id?: number | null;
  cur_name?: string | null;
  details?: VoucherDetail[];
  handling?: string | null;
  handling_e?: string | null;
  inv_id?: number | null;
  mobile?: string | null;
  opps_vouch?: number | null;
  pay_type?: number | null;
  phone?: string | null;
  post?: boolean;
  print?: boolean;
  ref_no?: string | null;
  vat_no?: number | string | null;
  year_id?: number | null;
  non_field_errors?: string[] | string | null;
  [key: string]: unknown;
}

export interface VoucherDetail {
  id?: number;
  credit: number | undefined;
  debit: number | undefined;
  tax_prc?: number | undefined;
  tax?: number | undefined;
  vouch_notes?: string;
  vouch_status?: number;
  cr_date: string;
  acc_id: number;
  acc_code?: string;
  acc_name?: string;
  cr_user?: string;
  upd_date?: string;
  upd_user?: string;
  vouch_id: number | string;
  credit_base?: number | null;
  debit_base?: number | null;
  base_credit?: number | null;
  base_debit?: number | null;
  p_credit?: number | null;
  p_debit?: number | null;
  change?: number;
  com_id?: number | null;
  cost_id?: number | null;
  g_credit?: number | undefined;
  credit_g?: number | undefined;
  cur_id?: number | null;
  cust_id?: number | null;
  g_debit?: number | undefined;
  debit_g?: number | undefined;
  gauge?: number;
  g_credit_base?: number | null;
  g_debit_base?: number | null;
  inv_id?: number | null;
  vat_no?: number;
  [key: string]: unknown;
}

export interface VoucherBox {
  id?: number;
  vouch_id: number;
  box_id: number;
  box?: {
    id: number;
    cust_name?: string;
    name?: string;
    cust_code?: string;
    box_type?: number;
  };
  amount: number;
  amount_g?: number;
  total_amount?: number;
  vouch_notes?: string;
  cost_id?: number | null;
  inv_id?: number | null;
  close_weight?: number | null;
  cr_date: string;
  cr_user?: string;
  upd_date?: string;
  upd_user?: string;
  com_id?: number | null;
  vat_no?: number | null;
  tax_prc?: number | null;
  tax?: number | null;
  [key: string]: unknown;
}

export interface GVoucherDetail {
  id?: number;
  vouch_id: number | string;
  item_id: number; // item (ForeignKey to Items)
  item_code?: string; // رمز الصنف
  item_name?: string; // اسم الصنف
  k?: number; // معايرة/عيار
  weight?: number; // الوزن القائم
  g_weight?: number; // الوزن المعاير
  weight2?: number; // وزن إضافي
  g_weight2?: number; // وزن معاير إضافي
  box_id?: number; // box (ForeignKey to Boxes)
  box_name?: string; // اسم الصندوق
  notes?: string; // البيان
  diff?: number; // فرق عيار
  close_amt?: number; // مبلغ التسكير
  close_weight?: number; // وزن التسكير
  inv_id?: number; // inv (ForeignKey to Invoices)
  cost_id?: number; // cost (ForeignKey to Cost_Centers)
  cost_name?: string; // اسم مركز التكلفة
  work_amt?: number; // مبلغ العمل
  total_work?: number; // إجمالي العمل
  qty?: number; // الكمية
  vouch_status?: number;
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

export type AccountOption = {
  value: number;
  label: string;
  account: any;
};

export type AccountSearchResponse = {
  options: AccountOption[];
  hasMore: boolean;
  nextPage: number;
};
