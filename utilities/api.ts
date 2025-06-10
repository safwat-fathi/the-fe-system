export const API_BASE_URL = "http://149.102.143.102:8000/api/";

export async function fetchGoldPrice(): Promise<number | null> {
  try {
    const response = await fetch("https://data-asg.goldprice.org/dbXRates/SAR");
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    const pricePerOunce = data?.items?.[0]?.xauPrice;

    if (!pricePerOunce) return null;

    const pricePerGram = pricePerOunce / 31.1035;
    // const pricePerGram = pricePerOunce / 3.75;
    return parseFloat(pricePerGram.toFixed(2));
  } catch (error) {
    console.error("❌ فشل جلب سعر الذهب:", error);
    return null;
  }
}


export async function fetchData<T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<T | null> {
  try {
    console.log(`Fetching data from: ${url}`);
    const response = await fetch(url, { method });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`HTTP ${response.status} - ${errorMessage}`);
    }

    return await response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Fetch error:", errorMessage);
    return null;
  }
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
  
};
