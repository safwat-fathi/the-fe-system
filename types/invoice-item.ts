export interface InvoiceItem {
  id: number;
  trans_type?: number;
  G875?: string;
  qty: number;
  price?: number;
  price_w: number;
  weight: number;
  g_weight?: number;
  total?: number;
  total_w?: number;
  total_a?: number;
  tax?: number;
  tax_prc?: number;
  stones?: string;
  item_disc_prc?: number;
  item_disc_amt?: number;
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
