export type Category = {
  id: number;
  cat_name: string;
  cat_name_e: string;
  cr_date: string;
  gauge: number;
  purity: number;
  box: number;
  tax: number;
  cat_type: number;
  cat_status: number;
};

export type Unit = {
  id: number;
  unit_name: string;
};

export type ItemForm = {
  id: number;
  item_name: string;
  item_name_e: string;
  item_price: string;
  item_img: string | File;
  item_code: string;
  item_barcode: string;
  first_cost: string;
  item_weight: string;
  item_g_weight: string;
  stones: string;
  model: string;
  k: string;
  purity: string;
  item_status: number;
  cr_date: string;
  cr_user: string;
  upd_date: string;
  upd_user: string;
  cat: number | null;
  item_type: number | null;
  unit: number | null;
};

export type ItemType = {
  id: number;
  type_name: string;
  type_name_e: string;
};

export type ItemBox = {
  id: number;
  box_name: string;
};

export type ItemCodeDescription = {
  code_id: number;
  code_desc: string;
};
