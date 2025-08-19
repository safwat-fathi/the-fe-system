export interface Invoice {
  inv_id: number;
  inv_date: string;
  cust_name?: string;
  inv_net?: number; // صافي الفاتورة
  inv_amt?: number; // إجمالي الفاتورة بدون الضريبة
  tax?: number; // قيمة الضريبة
  trans_type?: number; // نوع المعاملة (1 = شراء، 2 = بيع، 3 = مردود شراء، 4 = مردود بيع)
  pay_type?: number; // نوع الدفع (3 = آجل)
  vat_rate?: number; // نسبة الضريبة المضافة
  adjustment_amount?: number; // مبلغ التعديل (المرتجع)
}
