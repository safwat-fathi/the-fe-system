/**
 * System Map
 * Defines the hierarchical structure: Systems → Sections → Screens
 * This maps all systems, sections, and screens in the application
 */

import { SystemMap } from "../types/systems";

export const SYSTEM_MAP: SystemMap = {
  systems: [
    {
      id: "accounting",
      name: "نظام الحسابات",
      name_en: "Accounting System",
      icon: "BanknotesIcon",
      color: "blue",
      order: 1,
      sections: [
        {
          id: "accounting-basic",
          system_id: "accounting",
          name: "البيانات الأساسية",
          name_en: "Basic Data",
          icon: "DocumentTextIcon",
          order: 1,
          screens: [
            {
              id: "accounts",
              section_id: "accounting-basic",
              system_id: "accounting",
              name: "الحسابات",
              name_en: "Accounts",
              path: "/basic/accounts",
              icon: "BanknotesIcon",
              order: 1,
            },
            {
              id: "cost-centers",
              section_id: "accounting-basic",
              system_id: "accounting",
              name: "مراكز التكلفة",
              name_en: "Cost Centers",
              path: "/basic/cost-centers",
              icon: "CalculatorIcon",
              order: 2,
            },
            {
              id: "boxes",
              section_id: "accounting-basic",
              system_id: "accounting",
              name: "الصناديق",
              name_en: "Boxes",
              path: "/basic/boxes",
              icon: "DocumentTextIcon",
              order: 3,
            },
            {
              id: "currencies",
              section_id: "accounting-basic",
              system_id: "accounting",
              name: "العملات",
              name_en: "Currencies",
              path: "/basic/currencies",
              icon: "BanknotesIcon",
              order: 4,
            },
          ],
        },
        {
          id: "accounting-forms",
          system_id: "accounting",
          name: "النماذج",
          name_en: "Forms",
          icon: "DocumentTextIcon",
          order: 2,
          screens: [
            {
              id: "balance",
              section_id: "accounting-forms",
              system_id: "accounting",
              name: "قيد افتتاحي",
              name_en: "Opening Entry",
              path: "/forms/balance",
              icon: "DocumentTextIcon",
              order: 1,
            },
            {
              id: "voucher1",
              section_id: "accounting-forms",
              system_id: "accounting",
              name: "سند قبض",
              name_en: "Receipt Voucher",
              path: "/forms/voucher1",
              icon: "DocumentTextIcon",
              order: 2,
            },
            {
              id: "voucher2",
              section_id: "accounting-forms",
              system_id: "accounting",
              name: "سند صرف",
              name_en: "Payment Voucher",
              path: "/forms/voucher2",
              icon: "DocumentTextIcon",
              order: 3,
            },
            {
              id: "gvoucher4",
              section_id: "accounting-forms",
              system_id: "accounting",
              name: "سند قبض عميل",
              name_en: "Customer Receipt Voucher",
              path: "/forms/gvoucher4",
              icon: "DocumentTextIcon",
              order: 4,
            },
            {
              id: "gvoucher5",
              section_id: "accounting-forms",
              system_id: "accounting",
              name: "سند صرف عميل",
              name_en: "Customer Payment Voucher",
              path: "/forms/gvoucher5",
              icon: "DocumentTextIcon",
              order: 5,
            },
            {
              id: "voucher",
              section_id: "accounting-forms",
              system_id: "accounting",
              name: "قيد تسوية",
              name_en: "Adjustment Entry",
              path: "/forms/voucher?mode=new",
              icon: "DocumentTextIcon",
              order: 6,
            },
            {
              id: "receipt",
              section_id: "accounting-forms",
              system_id: "accounting",
              name: "سند استلام",
              name_en: "Receipt Voucher",
              path: "/forms/receipt",
              icon: "DocumentTextIcon",
              order: 7,
            },
            {
              id: "delivery",
              section_id: "accounting-forms",
              system_id: "accounting",
              name: "سند تسليم",
              name_en: "Delivery Voucher",
              path: "/forms/delivery",
              icon: "DocumentTextIcon",
              order: 8,
            },
          ],
        },
        {
          id: "accounting-reports",
          system_id: "accounting",
          name: "التقارير",
          name_en: "Reports",
          icon: "ChartBarIcon",
          order: 3,
          screens: [
            {
              id: "vouchers",
              section_id: "accounting-reports",
              system_id: "accounting",
              name: "تقرير السندات",
              name_en: "Vouchers Report",
              path: "/reports/vouchers",
              icon: "DocumentTextIcon",
              order: 1,
            },
            {
              id: "account-statement",
              section_id: "accounting-reports",
              system_id: "accounting",
              name: "كشف حساب",
              name_en: "Account Statement",
              path: "/reports/account-statement",
              icon: "DocumentTextIcon",
              order: 2,
            },
            {
              id: "income-statement",
              section_id: "accounting-reports",
              system_id: "accounting",
              name: "قائمة الدخل",
              name_en: "Income Statement",
              path: "/reports/income-statement",
              icon: "ChartBarIcon",
              order: 3,
            },
            {
              id: "balance-sheet",
              section_id: "accounting-reports",
              system_id: "accounting",
              name: "الميزانية العمومية",
              name_en: "Balance Sheet",
              path: "/reports/balance-sheet",
              icon: "ChartBarIcon",
              order: 4,
            },
            {
              id: "trial-balance",
              section_id: "accounting-reports",
              system_id: "accounting",
              name: "ميزان المراجعة",
              name_en: "Trial Balance",
              path: "/reports/trial-balance",
              icon: "ChartBarIcon",
              order: 5,
            },
            {
              id: "journal-ledger",
              section_id: "accounting-reports",
              system_id: "accounting",
              name: "دفتر القيود",
              name_en: "Journal Ledger",
              path: "/reports/journal-ledger",
              icon: "DocumentTextIcon",
              order: 6,
            },
            {
              id: "general-ledger",
              section_id: "accounting-reports",
              system_id: "accounting",
              name: "دفتر الأستاذ",
              name_en: "General Ledger",
              path: "/reports/general-ledger",
              icon: "DocumentTextIcon",
              order: 7,
            },
            {
              id: "gl-transactions",
              section_id: "accounting-reports",
              system_id: "accounting",
              name: "قيود اليومية",
              name_en: "GL Transactions",
              path: "/settings/gl-transactions",
              icon: "DocumentTextIcon",
              order: 8,
            },
          ],
        },
      ],
    },
    {
      id: "gold",
      name: "نظام الذهب",
      name_en: "Gold System",
      icon: "CubeIcon",
      color: "amber",
      order: 2,
      sections: [
        {
          id: "gold-basic",
          system_id: "gold",
          name: "البيانات الأساسية",
          name_en: "Basic Data",
          icon: "DocumentTextIcon",
          order: 1,
          screens: [
            {
              id: "customers",
              section_id: "gold-basic",
              system_id: "gold",
              name: "العملاء",
              name_en: "Customers",
              path: "/basic/customers",
              icon: "UserGroupIcon",
              order: 1,
            },
            {
              id: "cust-type",
              section_id: "gold-basic",
              system_id: "gold",
              name: "أنواع العملاء",
              name_en: "Customer Types",
              path: "/basic/cust_type",
              icon: "UserGroupIcon",
              order: 2,
            },
            {
              id: "items",
              section_id: "gold-basic",
              system_id: "gold",
              name: "الأصناف",
              name_en: "Items",
              path: "/basic/items",
              icon: "CubeIcon",
              order: 3,
            },
            {
              id: "categories",
              section_id: "gold-basic",
              system_id: "gold",
              name: "الفئات",
              name_en: "Categories",
              path: "/basic/categories",
              icon: "TagIcon",
              order: 4,
            },
            {
              id: "units",
              section_id: "gold-basic",
              system_id: "gold",
              name: "الوحدات",
              name_en: "Units",
              path: "/basic/units",
              icon: "TagIcon",
              order: 5,
            },
          ],
        },
        {
          id: "gold-forms",
          system_id: "gold",
          name: "النماذج",
          name_en: "Forms",
          icon: "DocumentTextIcon",
          order: 2,
          screens: [
            {
              id: "purchase-invoice",
              section_id: "gold-forms",
              system_id: "gold",
              name: "فواتير الشراء",
              name_en: "Purchase Invoices",
              path: "/forms/invoices?type=purchase&mode=new",
              icon: "DocumentTextIcon",
              order: 1,
            },
            {
              id: "purchase-return",
              section_id: "gold-forms",
              system_id: "gold",
              name: "فواتير مردود الشراء",
              name_en: "Purchase Return Invoices",
              path: "/forms/invoices?type=purchase-return&mode=new",
              icon: "DocumentTextIcon",
              order: 2,
            },
            {
              id: "sale-invoice",
              section_id: "gold-forms",
              system_id: "gold",
              name: "فواتير البيع",
              name_en: "Sale Invoices",
              path: "/forms/invoices?type=sale&mode=new",
              icon: "DocumentTextIcon",
              order: 3,
            },
            {
              id: "sale-return",
              section_id: "gold-forms",
              system_id: "gold",
              name: "فواتير مردود البيع",
              name_en: "Sale Return Invoices",
              path: "/forms/invoices?type=sale-return&mode=new",
              icon: "DocumentTextIcon",
              order: 4,
            },
          ],
        },
        {
          id: "gold-reports",
          system_id: "gold",
          name: "التقارير",
          name_en: "Reports",
          icon: "ChartBarIcon",
          order: 3,
          screens: [
            {
              id: "invoices",
              section_id: "gold-reports",
              system_id: "gold",
              name: "قائمة الفواتير",
              name_en: "Invoices List",
              path: "/reports/invoices",
              icon: "DocumentTextIcon",
              order: 1,
            },
            {
              id: "vat",
              section_id: "gold-reports",
              system_id: "gold",
              name: "تقرير الضريبة",
              name_en: "VAT Report",
              path: "/reports/vat",
              icon: "DocumentTextIcon",
              order: 2,
            },
            {
              id: "tax",
              section_id: "gold-reports",
              system_id: "gold",
              name: "التقارير الضريبية",
              name_en: "Tax Reports",
              path: "/reports/tax",
              icon: "DocumentTextIcon",
              order: 3,
            },
          ],
        },
      ],
    },
    {
      id: "settings",
      name: "الإعدادات",
      name_en: "Settings",
      icon: "Cog6ToothIcon",
      color: "slate",
      order: 3,
      sections: [
        {
          id: "settings-main",
          system_id: "settings",
          name: "الإعدادات",
          name_en: "Settings",
          icon: "Cog6ToothIcon",
          order: 1,
          screens: [
            {
              id: "settings",
              section_id: "settings-main",
              system_id: "settings",
              name: "إعدادات النظام",
              name_en: "System Settings",
              path: "/settings",
              icon: "Cog6ToothIcon",
              order: 1,
            },
            {
              id: "permissions",
              section_id: "settings-main",
              system_id: "settings",
              name: "الصلاحيات",
              name_en: "Permissions",
              path: "/settings/permissions",
              icon: "ShieldCheckIcon",
              order: 2,
            },
            {
              id: "taxes",
              section_id: "settings-main",
              system_id: "settings",
              name: "الضرائب",
              name_en: "Taxes",
              path: "/settings/taxes",
              icon: "DocumentCheckIcon",
              order: 3,
            },
            {
              id: "integrations",
              section_id: "settings-main",
              system_id: "settings",
              name: "خدمات الربط",
              name_en: "Integration Services",
              path: "/settings/integrations",
              icon: "LinkIcon",
              order: 4,
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Get all screens from the system map
 */
export const getAllScreens = () => {
  const screens: SystemMap["systems"][0]["sections"][0]["screens"] = [];

  SYSTEM_MAP.systems.forEach((system) => {
    system.sections.forEach((section) => {
      screens.push(...section.screens);
    });
  });

  return screens;
};

/**
 * Get screen by path
 */
export const getScreenByPath = (path: string) => {
  const screens = getAllScreens();

  return screens.find(
    (screen) =>
      screen.path === path ||
      (path.includes("?") && screen.path === path.split("?")[0]),
  );
};

/**
 * Get system by ID
 */
export const getSystemById = (systemId: string) => {
  return SYSTEM_MAP.systems.find((system) => system.id === systemId);
};

/**
 * Get section by ID
 */
export const getSectionById = (sectionId: string) => {
  for (const system of SYSTEM_MAP.systems) {
    const section = system.sections.find((s) => s.id === sectionId);

    if (section) return section;
  }

  return undefined;
};

