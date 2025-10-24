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


export type InvoiceMaxIdPrimitive = number | string | null | undefined;

export type InvoiceMaxIdRecord = {
  max_inv_id?: InvoiceMaxIdPrimitive;
  maxInvId?: InvoiceMaxIdPrimitive;
  inv_id?: InvoiceMaxIdPrimitive;
  data?: unknown;
  results?: unknown;
};

export type InvoiceMaxIdPayload =
  | InvoiceMaxIdPrimitive
  | InvoiceMaxIdRecord
  | InvoiceMaxIdRecord[];
export enum PaymentTypes {
  CASH = 1,
  CREDIT = 2,
}

export interface Invoice {
  id: string;
  inv_id: string;
  inv_date: string;
  inv_amt?: string;
  inv_net?: string;
  gold_price?: string | null;
  com?: number;
  year?: number;
  cust?: number;
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
  emp_id?: string;
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
  inv_status?: number;
  is_done?: boolean;
  is_ok?: boolean;
  suspend?: boolean;
  post?: boolean;
  tx?: boolean;
  dist?: boolean;
  gauge_diff?: boolean;
  pay_chick?: boolean;
  inv_QR?: string | null;
  store?: string | null;
  gold_box?: string | null;
  // Add other invoice properties as needed
}

// export interface InvoiceDetail {
//   id: number;
//   inv: number;
//   item: number;
//   item_code?: string;
//   item_name?: string;
//   qty: number;
//   weight: number;
//   g_weight: number;
//   k?: string;
//   price: number;
//   price_w: number;
//   total: number;
//   total_w: number;
//   total_a: number;
//   tax: number;
//   tax_prc: number;
//   stones: string;
//   item_disc_prc: number;
//   item_disc_amt: number;
//   sn: string;
//   item_desc: string;
//   inv_notes: string;
//   cr_date: string;
//   cr_user: string;
//   upd_date: string;
//   upd_user: string;
//   com: number;
// }
/**
 * Interface representing a single item transaction in the API response.
 */
export interface InvoiceDetail {
  id: number;
  trans_type: number;
  G875: number | null; // Assumed to be a number if not null
  qty: string; // '0.00' - Treat as string to preserve decimal precision/format
  price: string; // '17.0000...' - Treat as string to preserve decimal precision/format
  price_w: string; // '17.0000...'
  weight: string; // '51.4400...'
  g_weight: string; // '51.4400...'
  total: string; // '1005.6520...'
  total_w: string; // '874.4800...'
  total_a: string; // '874.4800...'
  inv_notes: string | null; // Assumed to be a string if not null
  diff: number | null; // Assumed to be a number if not null
  tax: string; // '131.1720...'
  tax_prc: string; // '15.00'
  stones: number | null; // Assumed to be a number if not null
  item_disc_prc: string; // '0.00'
  item_disc_amt: string; // '0.0000...'
  sn: string; // ''
  item_desc: string; // ''
  price2: string | null;
  price2_w: string | null;
  total_a2: string | null;
  total2: string | null;
  total_w2: string | null;
  tax2: string | null;
  cr_date: string; // '2025-06-22T16:57:31.254849Z' - ISO date string
  cr_user: string; // ''
  upd_date: string; // '2025-06-22T16:56:53.153000Z' - ISO date string
  upd_user: string; // ''
  com: number;
  inv: number;
  item: number;
  box: number | null; // Assumed to be a number if not null
  year?: number | null;
}
