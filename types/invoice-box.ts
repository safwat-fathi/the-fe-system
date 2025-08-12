export interface InvoiceBox {
  id: number;
  box_name: string;
  box_name_e: string;
  box_type?: string | null;
  box_status: boolean;
  balance_amt?: number | null;
  balance_gold?: number | null;
  box_default: boolean;
  cancel: boolean;
  cr_date: string;
  cr_user?: string | null;
  upd_date?: string | null;
  upd_user?: string | null;
  acc?: number | null;
}

