export const API_BASE_URL: string = "http://149.102.143.102:8000/api/";

// export const GOLD_API_TOKEN: string =
//   process.env.NEXT_PUBLIC_GOLD_API_TOKEN || "goldapi-5chasmbzw52m3-io";

// وظائف المصادقة
export async function loginUser(username: string, password: string) {
  try {
    console.log("محاولة تسجيل الدخول إلى:", `${API_BASE_URL}/login/`);
    console.log("بيانات تسجيل الدخول:", { username, password: "***" });

    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    console.log("استجابة الخادم:", response.status, response.statusText);

    let data;
    try {
      data = await response.json();
      console.log("بيانات الاستجابة:", data);
    } catch (jsonError) {
      console.error("خطأ في تحليل JSON:", jsonError);
      throw new Error("استجابة غير صحيحة من الخادم");
    }

    if (!response.ok) {
      // إذا كان هناك رسالة خطأ من الخادم، استخدمها
      if (data && data.message) {
        throw new Error(data.message);
      }
      // وإلا استخدم رسالة خطأ عامة
      throw new Error(`خطأ في الاتصال: ${response.status}`);
    }

    // التحقق من أن الاستجابة تحتوي على البيانات المطلوبة
    if (!data || typeof data !== "object") {
      throw new Error("استجابة غير صحيحة من الخادم");
    }

    return data;
  } catch (error) {
    console.error("خطأ في تسجيل الدخول:", error);

    // معالجة أخطاء الشبكة
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("لا يمكن الاتصال بالخادم. تأكد من اتصال الإنترنت.");
    }

    // إعادة رمي الخطأ مع رسالة واضحة
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("حدث خطأ غير متوقع في الاتصال");
    }
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    // محاولة الحصول على التوكن من localStorage أولاً
    const localToken = localStorage.getItem("auth_token");
    if (localToken) {
      return localToken;
    }
    
    // إذا لم يوجد في localStorage، محاولة الحصول عليه من الكوكيز
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'access_token') {
        return value;
      }
    }
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
    // إضافة التوكن للكوكيز أيضاً للـ middleware
    document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Strict`;
  }
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
    // حذف التوكن من الكوكيز
    document.cookie =
      "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

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
  body?: any,
): Promise<T | null> {
  try {
    console.log(`Fetching: ${url} with method: ${method}`);
    url = appendBranchParams(url);
    console.log(`Final URL: ${url}`);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // إضافة التوكن للطلبات إذا كان موجوداً
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Token ${token}`;
    }

    const requestInit: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT")) {
      requestInit.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestInit);

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(`HTTP ${response.status} error for ${url}:`, errorMessage);

      // إذا كان الخطأ 401 (غير مصرح)، حذف التوكن وتوجيه لصفحة تسجيل الدخول
      if (response.status === 401) {
        // removeAuthToken();
        // if (typeof window !== "undefined") {
        //   window.location.href = "/";
        // }
      }

      // throw new Error(`HTTP ${response.status} - ${errorMessage}`);
    }

    const data = await response.json();
    console.log(`Success response from ${url}:`, data);
    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error(`Fetch error for ${url}:`, errorMessage);

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
    console.error("failed to fetch fractions", e);
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
  CREATE_ACCOUNT: `${API_BASE_URL}api_create_account`,
  UPDATE_ACCOUNT: (id: number) => `${API_BASE_URL}api_update_account/${id}`,
  DELETE_ACCOUNT: (id: number) => `${API_BASE_URL}api_delete_account/${id}`,

  //العملات
  CURRENCIES_LIST: `${API_BASE_URL}currencies_list/`,
  CREATE_CURRENCY: `${API_BASE_URL}api_create_currency`,
  UPDATE_CURRENCY: (id: number) => `${API_BASE_URL}api_update_currency/${id}`,
  DELETE_CURRENCY: (id: number) => `${API_BASE_URL}api_delete_currency/${id}`,

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
  INVOICE_BOX_LIST: `${API_BASE_URL}boxes_list`,
  CREATE_INVOICE_BOX: `${API_BASE_URL}api_create_box`,
  UPDATE_INVOICE_BOX: (id: number) => `${API_BASE_URL}api_update_box/${id}`,
  DELETE_INVOICE_BOX: (id: number) => `${API_BASE_URL}api_delete_box/${id}`,

  // روابط الصناديق من جدول العملاء (النوع = 99)
  CUSTOMER_BOXES_LIST: `${API_BASE_URL}customers_list?cust_type=99`,

  // Vouchers
  VOUCHERS_LIST: `${API_BASE_URL}vouchers_list`,
  CREATE_VOUCHER: `${API_BASE_URL}api_create_vouch`,
  UPDATE_VOUCHER: (id: number) => `${API_BASE_URL}api_update_vouch/${id}`,
  DELETE_VOUCHER: (id: number) => `${API_BASE_URL}api_delete_vouch/${id}`,

  // Cost Centers
  COST_CENTERS_LIST: `${API_BASE_URL}cost_centers_list`,
  CREATE_COST_CENTER: `${API_BASE_URL}api_create_cost`,
  UPDATE_COST_CENTER: (id: number) => `${API_BASE_URL}api_updatecost/${id}`,
  DELETE_COST_CENTER: (id: number) => `${API_BASE_URL}api_delete_cost/${id}`,

  // Voucher Details
  VOUCHERS_DTL_LIST: `${API_BASE_URL}vouchers_dtl_list`,
  VOUCHER_DETAILS: (vouchId: number) =>
    `${API_BASE_URL}vouchers_dtl_list?vouch_id=${vouchId}`,
  CREATE_VOUCHER_DTL: `${API_BASE_URL}api_create_vouch_dtl`,
  UPDATE_VOUCHER_DTL: (id: number) =>
    `${API_BASE_URL}api_update_vouch_dtl/${id}`,
  DELETE_VOUCHER_DTL: (id: number) =>
    `${API_BASE_URL}api_delete_vouch_dtl/${id}`,

  // Voucher Box Details
  VOUCHERS_BOX_LIST: `${API_BASE_URL}vouchers_box_list`,
  VOUCHER_BOX_DETAILS: (vouchId: number) =>
    `${API_BASE_URL}vouchers_box_list?vouch_id=${vouchId}`,
  CREATE_VOUCHER_BOX: `${API_BASE_URL}api_create_vouch_box`,
  UPDATE_VOUCHER_BOX: (id: number) =>
    `${API_BASE_URL}api_update_vouch_box/${id}`,
  DELETE_VOUCHER_BOX: (id: number) =>
    `${API_BASE_URL}api_delete_vouch_box/${id}`,

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

  // البحث بالباركود - API جديد للمطابقة التامة
  ITEM_BARCODE_SEARCH: (barcode: string) =>
    `${API_BASE_URL}ItemBarcode/${encodeURIComponent(barcode)}`,

  // البحث في الحسابات - API جديد للبحث في الحسابات
  SEARCH_ACCOUNTS: (query: string, page: number = 1) =>
    `${API_BASE_URL}SearchAccountsList/?q=${encodeURIComponent(query)}&page=${page}`,
};

export function fetchCompanies() {
  return fetchData<any[]>(API_ENDPOINTS.COMPANIES_LIST);
}

// دالة البحث بالباركود باستخدام API الجديد
export async function fetchItemByBarcode(barcode: string): Promise<any | null> {
  try {
    console.log("البحث بالباركود:", barcode);

    const response = await fetch(API_ENDPOINTS.ITEM_BARCODE_SEARCH(barcode), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("لم يتم العثور على الصنف بالباركود:", barcode);
        return null;
      }
      throw new Error(`خطأ في البحث: ${response.status}`);
    }

    const data = await response.json();
    console.log("نتيجة البحث بالباركود:", data);

    // API يعيد مصفوفة، نأخذ العنصر الأول
    if (Array.isArray(data) && data.length > 0) {
      console.log("تم العثور على الصنف:", data[0]);
      return data[0];
    } else if (Array.isArray(data) && data.length === 0) {
      console.log("لم يتم العثور على الصنف بالباركود:", barcode);
      return null;
    } else {
      // إذا لم تكن مصفوفة، نعيد البيانات كما هي
      return data;
    }
  } catch (error) {
    console.error("خطأ في البحث بالباركود:", error);
    throw error;
  }
}

// دالة البحث في الحسابات
export async function searchAccounts(
  query: string,
  page: number = 1,
): Promise<any> {
  try {
    console.log("البحث في الحسابات:", query);

    const response = await fetch(API_ENDPOINTS.SEARCH_ACCOUNTS(query, page), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`خطأ في البحث في الحسابات: ${response.status}`);
    }

    const data = await response.json();
    console.log("نتيجة البحث في الحسابات:", data);

    return data;
  } catch (error) {
    console.error("خطأ في البحث في الحسابات:", error);
    throw error;
  }
}

export function apiFetch(input: string, init?: RequestInit) {
  // لا تضف معاملات com و year إذا كان الرابط لتحديث الفاتورة أو تفاصيلها
  if (
    input.includes("api_update_invoice/") ||
    input.includes("api_update_invoice_dtl/")
  ) {
    return fetch(input, init);
  }

  const url = appendBranchParams(input);

  // إضافة التوكن للطلبات إذا كان موجوداً
  const token = getAuthToken();
  if (token && init) {
    init.headers = {
      ...init.headers,
      Authorization: `Token ${token}`,
    };
  } else if (token) {
    init = {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Token ${token}`,
      },
    };
  }

  return fetch(url, init);
}
