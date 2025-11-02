export type RawTaxRate = {
  id?: number;
  tax_prc?: string | number | null;
  value?: string | number | null;
};

export interface Tax {
  id: number;
  tax_name?: string;
  tax_name_e?: string;
  tax_symbol?: string;
  tax_prc?: number;
  tax_account?: number;
  acc_name?: string;
  acc_id?: string;
}
