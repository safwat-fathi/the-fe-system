export type Item = {
  id: number;
  item_name: string;
  item_name_e: string;
  item_price: string | number;
  item_img: string | null;
  item_code: string | null;
  item_barcode: string | null;
  first_cost: string | number;
  item_weight: string | number;
  item_g_weight: string | number;
  stones: string | number | null;
  model: string | null;
  k: string | null;
  purity: string | number | null;
  item_status: number | null;
  cr_date: string | null;
  cr_user: string | null;
  upd_date: string | null;
  upd_user: string | null;
  cat: number | null;
  item_type: number | null;
  unit: number | null;
};

export type SearchItemsParams = {
  page?: number;
  companyId?: number | string;
  categoryId?: number | string;
  itemTypeId?: number | string;
  itemStatus?: number | string;
};
