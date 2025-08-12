export interface Invoice {
  inv_id: number;
  inv_date: string;
  cust_name?: string;
  inv_net?: number; // صافي الفاتورة
  inv_amt?: number; // إجمالي الفاتورة بدون الضريبة
  tax?: number; // قيمة الضريبة
  trans_type?: number; // نوع المعاملة (2 = بيع، 3 = مرتجع)
  pay_type?: number; // نوع الدفع (3 = آجل)
}
