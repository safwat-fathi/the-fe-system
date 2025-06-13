export interface InvoiceItem {
  id: number;
  item_id: number | null;
  item_code?: string;
  item_name?: string;
  /** Number of pieces */
  qty: number;
  /** Gross weight */
  weight: number;
  /** Net/gauged weight */
  g_weight: number;
  karat: string;
  /** Price per gram */
  price: number;
  /** Discount amount */
  item_disc_amt: number;
  note: string;
  trans_type?: number;
  G875?: string;
  price_w: number;
  total?: number;
  total_w?: number;
  total_a?: number;
  inv_note?: string;
  tax?: number;
  tax_prc?: number;
  stones?: string;
  item_disc_prc?: number;
  sn?: string;
  item_desc?: string;
  cr_date?: string;
  cr_user?: string;
  upd_date?: string;
  upd_user?: string;
  com?: number;
  inv?: number;
  item?: number;
}
