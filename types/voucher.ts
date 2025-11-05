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
  opps_vouch?: number;
  pay_type: number;
  post?: boolean;
  print?: boolean;
  ref_no?: string;
  vat_no?: number;
  com_id?: number;
  year_id?: number;
  details?: VoucherDetail[];
  handling?: string; // مناولة
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
  acc_code?: string; // رمز الحساب
  acc_name?: string; // اسم الحساب
  cr_user?: string;
  upd_date?: string;
  upd_user?: string;
  vouch_id: number;
  credit_base?: number; // دائن اساس
  debit_base?: number; // مدين اساس
  p_credit?: number; // دائن مدفوع (غير مستخدم حالياً)
  p_debit?: number; // مدين مدفوع (غير مستخدم حالياً)
  change?: number;
  com_id?: number;
  cost_id?: number;
  g_credit?: number | undefined; // دائن (ذهب)
  cur_id?: number;
  cust_id?: number;
  g_debit?: number | undefined; // مدين (ذهب)
  gauge?: number; // العيار
  g_credit_base?: number; // دائن معاير (ذهب)
  g_debit_base?: number; // مدين معاير (ذهب)
  inv_id?: number;
  vat_no?: number;
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
  }; // حقل box من voucher_box (معلومات الصندوق الكاملة)
  amount: number; // vouch_amt في vouchers_box
  amount_g?: number;
  total_amount?: number;
  vouch_notes?: string;
  cost_id?: number; // مركز التكلفة
  inv_id?: number; // رقم الفاتورة
  close_weight?: number; // وزن التسكير
  cr_date: string;
  cr_user?: string;
  upd_date?: string;
  upd_user?: string;
  com_id?: number;
}

export interface GVoucherDetail {
  id?: number;
  vouch_id: number;
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
