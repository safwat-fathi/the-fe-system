export interface HomeSettings {
  id: number;
  comp_id: number;
  year: number;
  frac: number;
  frac2: number;
  comp_name?: string;
  comp_name_e?: string;
  address?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  vat_no?: string;
  cr_no?: string;
  logo?: string;
  purity?: number;
  Vat_perc?: number;
  [key: string]: any; // Allow additional properties from API
}

