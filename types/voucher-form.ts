import { Account } from "@/types/models/account";
import { Box } from "@/types/models/box";
import { Item } from "@/types/models/item";
import { Customer } from "@/types/models/customer";
import { Category } from "@/types/items";

export type CostCenter = {
  id: number;
  cost_name: string;
  cost_name_e: string;
  cost_type: number;
  cr_date: string;
  cr_user: number | null;
  upd_date: string | null;
  upd_user: number | null;
  cost_status: number;
  acc: number | null;
  parent: number | null;
};

export type VoucherType = {
  id: number;
  Id?: number;
  name: string;
  name_e?: string;
};

export type VoucherStatus = {
  id: number;
  name: string;
  name_e?: string;
};

export type CaratType = {
  id: number;
  name: string;
  name_e?: string;
  gauge?: number;
  value?: number;
};

export type VoucherFormData = {
  accounts: Account[];
  costCenters: CostCenter[];
  voucherTypes: VoucherType[];
  voucherStatuses: VoucherStatus[];
  caratTypes: CaratType[];
  boxes: Box[];
  goldBoxes?: Box[];
  items?: Item[];
  customers?: Customer[];
  categories?: Category[];
};

export type VoucherFormDataOptions = {
  goldBoxes?: boolean;
  includeItems?: boolean;
  includeCustomers?: boolean;
  includeCategories?: boolean;
};

export type BalanceVoucherFormData = Omit<
  VoucherFormData,
  "items" | "customers" | "boxes" | "goldBoxes" | "categories"
>;
