export interface GLTransaction {
  id?: number;
  debit: string | number;
  credit: string | number;
  debit_base: string | number;
  credit_base: string | number;
  g_debit: string | number;
  g_credit: string | number;
  g_debit_base: string | number;
  g_credit_base: string | number;
  type: string;
  d: string; // تاريخ الحركة (YYYY-MM-DD)
  t: string; // وقت الحركة (HH:MM:SS)
  ref: string;
  trans_id: number; // رقم الحركة (vouch_id)
  trans_type: number; // نوع الحركة (vouch_type)
  note: string;
  source: string;
  seq: number; // تسلسل الحركة
  cust2?: number | null; // رقم العميل (ID)
  cr_date: string;
  cr_user: string | null;
  upd_date?: string | null;
  upd_user?: string | null;
  com: number;
  year: number;
  acc: number; // رقم الحساب
  cust?: number | null; // رقم العميل
  cost?: number | null; // مركز التكلفة
}
