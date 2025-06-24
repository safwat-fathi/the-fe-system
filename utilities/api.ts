export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://149.102.143.102:8000/api/";

export async function fetchGoldPrice(): Promise<number | null> {
  try {
    const response = await fetch("https://data-asg.goldprice.org/dbXRates/SAR");

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    const pricePerOunce = data?.items?.[0]?.xauPrice;

    if (!pricePerOunce) return null;

    const pricePerGram = pricePerOunce / 31.1035;

    const { frac } = await fetchFractions();

    // const pricePerGram = pricePerOunce / 3.75;
    return parseFloat(pricePerGram.toFixed(frac));
  } catch (error) {
    console.error("❌ فشل جلب سعر الذهب:", error);

    return null;
  }
}

export function appendBranchParams(url: string): string {
  if (typeof window !== "undefined") {
    const com = localStorage.getItem("selectedBranch");
    const year = localStorage.getItem("selectedYear");

    if (com) {
      const u = new URL(url, url.startsWith("http") ? undefined : API_BASE_URL);

      u.searchParams.set("com", com);
      if (year) u.searchParams.set("year", year);

      return u.toString();
    }
  }

  return url;
}

export async function fetchData<T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
): Promise<T | null> {
  try {
    url = appendBranchParams(url);
    const response = await fetch(url, { method });

    if (!response.ok) {
      const errorMessage = await response.text();

      throw new Error(`HTTP ${response.status} - ${errorMessage}`);
    }

    return await response.json();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Fetch error:", errorMessage);

    return null;
  }
}

let fractionsCache: { frac: number; frac2: number } | null = null;

export async function fetchFractions() {
  if (fractionsCache) return fractionsCache;

  try {
    const res = await fetchData<any[]>(API_ENDPOINTS.HOME_LIST);

    if (Array.isArray(res) && res.length > 0) {
      const frac = parseInt(res[0].frac);
      const frac2 = parseInt(res[0].frac2);
      fractionsCache = {
        frac: isNaN(frac) ? 2 : frac,
        frac2: isNaN(frac2) ? 3 : frac2,
      };
    } else {
      fractionsCache = { frac: 2, frac2: 3 };
    }
  } catch (e) {
    console.error('failed to fetch fractions', e);
    fractionsCache = { frac: 2, frac2: 3 };
  }

  return fractionsCache;
}

export const API_ENDPOINTS = {
  // روابط العملاء
  CUSTOMERS_LIST: `${API_BASE_URL}customers_list`,
  CREATE_CUSTOMER: `${API_BASE_URL}api_create_customer`,
  UPDATE_CUSTOMER: (id: number) => `${API_BASE_URL}api_update_customer/${id}`,
  DELETE_CUSTOMER: (id: number) => `${API_BASE_URL}api_delete_customer/${id}`,
  CUSTOMER_TYPES: `${API_BASE_URL}cust_type_list`,

  // الحسابات
  ACCOUNTS_LIST: `${API_BASE_URL}accounts_list`,

  // روابط الفئات والأصناف
  CATEGORIES_LIST: `${API_BASE_URL}categories_list/`,
  ITEMS_LIST: `${API_BASE_URL}items_list/`,
  CREATE_ITEM: `${API_BASE_URL}api_create_item`,
  UPDATE_ITEM: (id: number) => `${API_BASE_URL}api_update_item/${id}`,
  DELETE_ITEM: `${API_BASE_URL}api_delete_item/`,
  ITEM_TYPES_LIST: `${API_BASE_URL}item_type_list`,
  UNITS_LIST: `${API_BASE_URL}units_list/`,
  CAT_ITEMS_LIST: `${API_BASE_URL}cat_items_list/`,
  GET_ITEMS_LIST: `${API_BASE_URL}GetItemsList/`,
  BOXES_LIST: `${API_BASE_URL}boxes_list`,
  CREATE_BOX: `${API_BASE_URL}api_create_box`,
  UPDATE_BOX: (id: number) => `${API_BASE_URL}api_update_box/${id}`,
  DELETE_BOX: (id: number) => `${API_BASE_URL}api_delete_box/${id}`,

  //codec api's
  Companies_List: `${API_BASE_URL}getCompaniesList`,
  CaratTypeList: `${API_BASE_URL}getCaratTypeList`,
  CatTypeList: `${API_BASE_URL}getCatTypeList`,
  CatStatusList: `${API_BASE_URL}getCatStatusList`,
  CitiesList: `${API_BASE_URL}getCitiesList`,
  ProductStageList: `${API_BASE_URL}getProductStageList`,
  WasteTypeList: `${API_BASE_URL}getWasteTypeList`,
  OperationTypeList: `${API_BASE_URL}getOperationTypeList`,
  AccountsCategoryList: `${API_BASE_URL}getAccountsCategoryList`,
  VoucherStageList: `${API_BASE_URL}getVoucherStageList`,
  TaxPrcList: `${API_BASE_URL}getTaxPrcList`,
  AccTypeList: `${API_BASE_URL}getAccTypeList`,
  AccKindList: `${API_BASE_URL}getAccKindList`,
  BoxTypeList: `${API_BASE_URL}getBoxTypeList`,
  VoucherTypeList: `${API_BASE_URL}getVoucherTypeList`,
  PayTypeList: `${API_BASE_URL}getPayTypeList`,
  ItemStatusList: `${API_BASE_URL}getItemStatus`, // add by Moseed 31-5-2025
  INVOICE_BOX_LIST: `${API_BASE_URL}invoices_box_list`,
  CREATE_INVOICE_BOX: `${API_BASE_URL}api_create_invoice_box`,
  UPDATE_INVOICE_BOX: (id: number) =>
    `${API_BASE_URL}api_update_invoice_box/${id}`,
  DELETE_INVOICE_BOX: (id: number) =>
    `${API_BASE_URL}api_delete_invoice_box/${id}`,

  // system settings
  HOME_LIST: `${API_BASE_URL}home_list`,
  UPDATE_HOME: (id: number) => `${API_BASE_URL}api_update_home/${id}`,

  // قوائم الفواتير
  INVOICES_LIST: `${API_BASE_URL}invoices_list`,
  DELETE_INVOICE: (id: number) => `${API_BASE_URL}api_delete_invoice/${id}`,

  // تفاصيل الفواتير
  INVOICES_DTL_LIST: `${API_BASE_URL}invoices_dtl_list`,
  CREATE_INVOICE_DTL: `${API_BASE_URL}api_create_invoice_dtl`,
  UPDATE_INVOICE_DTL: (id: number) =>
    `${API_BASE_URL}api_update_invoice_dtl/${id}`,
  DELETE_INVOICE_DTL: (id: number) =>
    `${API_BASE_URL}api_delete_invoice_dtl/${id}`,

  // companies
  COMPANIES_LIST: `${API_BASE_URL}companies_list`,
};

export function fetchCompanies() {
  return fetchData<any[]>(API_ENDPOINTS.COMPANIES_LIST);
}

export function apiFetch(input: string, init?: RequestInit) {
  return fetch(appendBranchParams(input), init);
}
