export enum TransTypes {
  PURCHASE = 1,
  SALES = 2,
  PURCHASE_RETURN = 3,
  SALES_RETURN = 4,
}

export enum InvoiceTypes {
  VALUE = 1,
  WAGES = 2,
  BOTH = 3,
}

export enum PaymentTypes {
	CASH = 1,
	CREDIT = 2,
}

export interface Invoice {
  id: number;
  inv_id: number;
  inv_date: string;
  inv_amt?: string;
  inv_net?: string;
  gold_price?: string;
  inv_type: InvoiceTypes;
  trans_type: TransTypes;
  pay_type: PaymentTypes;
  ref_no: string | null;
  cust_code: string;
  cust_name: string;
  mobile: string | null;
  address: string | null;
  vat_no: string;
  disc_amount: string | null;
  disc_percent: string | null;
  price: string | null;
  price2: string | null;
  charge: string | null;
  inv_amt_g: string | null;
  emp_id?: number;
  commit?: boolean;
  print?: boolean;
  cr_no?: string;
  gov?: string;
  city?: string;
  area?: string;
  street?: string;
  build_no?: string;
  post_no?: string;
  post_code?: string;
  inv_notes?: string;
  handling?: string;
  // Add other invoice properties as needed
}

export interface InvoiceDetail {
  id: number;
  inv: number;
  item: number;
  item_code?: string;
  item_name?: string;
  qty: number;
  weight: number;
  g_weight: number;
  k?: string;
  price: number;
  price_w: number;
  total: number;
  total_w: number;
  total_a: number;
  tax: number;
  tax_prc: number;
  stones: string;
  item_disc_prc: number;
  item_disc_amt: number;
  sn: string;
  item_desc: string;
  inv_notes: string;
  cr_date: string;
  cr_user: string;
  upd_date: string;
  upd_user: string;
  com: number;
}
