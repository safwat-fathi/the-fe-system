export enum TransTypes {
  PURCHASE = 1,
  SALES = 2,
  PURCHASE_RETURN = 3,
  SALES_RETURN = 4,
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
export enum InvoiceTypes {
  VALUE = 1,
  WAGES = 2,
  BOTH = 3,
}

export const INVOICE_PAY_TYPES = {
  VALUE: 1,
  WAGES: 2,
  VALUE_AND_WAGES: 3,
} as const;

export type InvoicePayType =
  (typeof INVOICE_PAY_TYPES)[keyof typeof INVOICE_PAY_TYPES];

/**
 * Represents how the invoice was paid (cash vs credit).
 * Distinct from InvoicePayType which controls value/wages calculation.
 */
export enum PaymentTypes {
  CASH = 1,
  CREDIT = 2,
}

export interface Invoice {
  id: string | number;
  inv_id: string | number;
  inv_date: string;
  inv_amt?: number | null;
  inv_net?: number | null;
  gold_price?: number | null;
  com?: number | null;
  year?: number | null;
  cust?: number | null;
  inv_type: InvoiceTypes;
  trans_type: TransTypes;
  pay_type: InvoicePayType;
  ref_no: string | null;
  cust_code: string;
  cust_name: string;
  mobile: string | null;
  address: string | null;
  vat_no: string | null;
  disc_amount: number | null;
  disc_percent: number | null;
  price: number | null;
  price2: number | null;
  charge: number | null;
  inv_amt_g: number | null;
  emp_id?: string | null;
  commit?: boolean;
  print?: boolean;
  cr_no?: string | null;
  gov?: string | null;
  city?: string | null;
  area?: string | null;
  street?: string | null;
  build_no?: string | null;
  post_no?: string | null;
  post_code?: string | null;
  inv_notes?: string | null;
  handling?: string | null;
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
  tax?: number | null;
  first_invoice_id: string | null;
  last_invoice_id: string | null;
  next_invoice_id: string | null;
  previous_invoice_id: string | null;
  invoices_count: string | null;
}

/**
 * Interface representing a single item transaction in the API response.
 */
export interface InvoiceDetail {
  id: number;
  trans_type: number;
  G875: number | null; // Assumed to be a number if not null
  k?: number | null;
  qty: string | number; // API may return string but we can send numeric values
  price: string | number; // '17.0000...' or numeric value
  price_w: string | number; // '17.0000...' or numeric value
  weight: string | number; // '51.4400...' or numeric value
  g_weight: string | number; // '51.4400...' or numeric value
  total: string | number; // '1005.6520...' or numeric value
  total_w: string | number; // '874.4800...' or numeric value
  total_a: string | number; // '874.4800...' or numeric value
  inv_notes: string | null; // Assumed to be a string if not null
  diff: number | null; // Assumed to be a number if not null
  tax: string | number; // '131.1720...' or numeric value
  tax_prc: string | number; // '15.00' or numeric value
  stones: number | null; // Assumed to be a number if not null
  item_disc_prc: string | number; // '0.00' or numeric value
  item_disc_amt: string | number; // '0.0000...' or numeric value
  sn: string; // ''
  item_desc: string; // ''
  item_code?: string;
  note?: string | null;
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

export interface CreateInvoiceBoxDto {
  com: number; // company id
  trans_type: TransTypes; // transaction type (1: purchase, 2: sales, 3: purchase return, 4: sales return)
  amt: string;
  box: string; // customer id
  acc_change: string; // exchange currency (SAR, USD, ...)
  notes: string;
  cr_date: string;
  cr_user: string; // logged in user id
  inv: number; // invoice id not inv_id
}

export interface InvoiceBox {
  id: number;
  trans_type: number;
  amt: string;
  acc_change: string;
  notes: string;
  cr_date: string;
  cr_user: string;
  upd_date: string | null;
  upd_user: string | null;
  com: number;
  inv: number;
  box: number;
}

export interface PaidType {
  id: number;
  code_id: number;
  code_desc: string;
  code_desc_l: string;
  type_id: number;
}
