export type Account = {
  acc_code: any;
  id: number;
  acc_id: string;
  acc_name: string;
  acc_name_e?: string;
  acc_type: number;
  parent: number | null;
  acc_level: number;
  acc_kind: number;
  acc_rep: number;
  acc_digit: number;
  acc_priv: number;
  acc_cat: number;
  acc_notes?: string;
  cur?: number | null;
  children?: Account[];
};
