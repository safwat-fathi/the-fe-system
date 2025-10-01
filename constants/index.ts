// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: "/login/",
  LOGOUT: "/logout/",

  // Accounts
  ACCOUNTS: "/accounts/",
  ACCOUNT_DETAILS: (id: number) => `/accounts/${id}/`,

  // Vouchers
  VOUCHERS: "/vouchers/",
  VOUCHER_DETAILS: (id: number) => `/vouchers/${id}/details/`,

  // Invoices
  INVOICES: "/invoices/",
  INVOICE_DETAILS: (id: number) => `/invoices/${id}/`,

  // Items
  ITEMS: "/items/",
  SEARCH_ITEMS: "/SearchItemsList/",

  // Customers
  CUSTOMERS: "/customers/",

  // Categories
  CATEGORIES: "/categories/",

  // Currencies
  CURRENCIES: "/currencies/",

  // Gold Price
  GOLD_PRICE: process.env.NEXT_PUBLIC_API_GOLD_PRICE || "",
} as const;

export const ROUTE_RULES = {
  public: ["/auth/login", "/register", "/forgot-password"],
  private: [""],
  admin: ["/admin"],
};

// Payment Types
export const PAYMENT_TYPES = {
  GOLD: 1,
  WAGE: 2,
  BOTH: 3,
} as const;

// Transaction Types
export const TRANSACTION_TYPES = {
  PURCHASE: 1,
  SALE: 2,
  PURCHASE_RETURN: 3,
  SALES_RETURN: 4,
} as const;

// Voucher Types
export const VOUCHER_TYPES = {
  SETTLEMENT: 1,
  RECEIPT: 2,
  PAYMENT: 3,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {

  ACCESS_TOKEN: "auth_token",

  REFRESH_TOKEN: "refresh_token",
  SESSION: "session",
  USER_DATA: "user_data",
  THEME: "theme",
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 288, // 72 * 4 (w-72)
  SIDEBAR_COLLAPSED_WIDTH: 80, // 20 * 4 (w-20)
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'خطأ في الاتصال بالخادم',
  UNAUTHORIZED: 'غير مصرح لك بالوصول',
  VALIDATION_ERROR: 'بيانات غير صحيحة',
  SERVER_ERROR: 'خطأ في الخادم',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'تم الحفظ بنجاح',
  DELETE_SUCCESS: 'تم الحذف بنجاح',
  UPDATE_SUCCESS: 'تم التحديث بنجاح',
} as const;

// Export Invoice Types
export * from './invoice-types';
