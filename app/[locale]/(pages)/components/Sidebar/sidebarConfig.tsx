import {
  BanknotesIcon,
  CalculatorIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  HomeIcon,
  LinkIcon,
  ShieldCheckIcon,
  TagIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import { type SidebarLinkConfig } from "./sidebarTypes";

export const mainLinks: SidebarLinkConfig[] = [
  {
    translationKey: "home",
    translationSource: "home",
    href: "/",
    icon: <HomeIcon className="h-5 w-5" />,
  },
];

export const settingsLinks: SidebarLinkConfig[] = [
  {
    translationKey: "links.systemSettings",
    translationSource: "sidebar",
    href: "/settings",
    icon: <Cog6ToothIcon className="h-5 w-5" />,
  },
  {
    translationKey: "links.userBranches",
    translationSource: "sidebar",
    href: "/settings/user-assignments",
    icon: <UserGroupIcon className="h-5 w-5" />,
  },
  {
    translationKey: "permissions",
    translationSource: "segment",
    href: "/settings/permissions",
    icon: <ShieldCheckIcon className="h-5 w-5" />,
  },
  {
    translationKey: "taxes",
    translationSource: "segment",
    href: "/settings/taxes",
    icon: <DocumentCheckIcon className="h-5 w-5" />,
  },
  {
    translationKey: "integrations",
    translationSource: "segment",
    href: "/settings/integrations",
    icon: <LinkIcon className="h-5 w-5" />,
  },
];

export const accountingBasicLinks: SidebarLinkConfig[] = [
  {
    translationKey: "accounts",
    translationSource: "segment",
    href: "/basic/accounts",
    icon: <BanknotesIcon className="h-5 w-5" />,
    prefetch: true,
    caslSubject: "basic.accounts",
  },
  {
    translationKey: "cost-centers",
    translationSource: "segment",
    href: "/basic/cost-centers",
    icon: <CalculatorIcon className="h-5 w-5" />,
    prefetch: true,
    caslSubject: "basic.cost-centers",
  },
  {
    translationKey: "boxes",
    translationSource: "segment",
    href: "/basic/boxes",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    prefetch: false,
  },
  {
    translationKey: "currencies",
    translationSource: "segment",
    href: "/basic/currencies",
    icon: <BanknotesIcon className="h-5 w-5" />,
    prefetch: true,
    caslSubject: "basic.currencies",
  },
];

export const accountingFormLinks: SidebarLinkConfig[] = [
  {
    translationKey: "balance",
    translationSource: "segment",
    href: "/forms/balance",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    caslSubject: "forms.balance",
  },
  {
    translationKey: "cash-receipt",
    translationSource: "segment",
    href: "/forms/cash-receipt",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    caslSubject: "forms.cash-receipt",
  },
  {
    translationKey: "payment-receipt",
    translationSource: "segment",
    href: "/forms/payment-receipt",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    caslSubject: "forms.payment-receipt",
  },
  {
    translationKey: "adjustment",
    translationSource: "segment",
    href: "/forms/adjustment?mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    caslSubject: "forms.adjustment",
  },
];

export const goldBasicLinks: SidebarLinkConfig[] = [
  {
    translationKey: "customers",
    translationSource: "segment",
    href: "/basic/customers",
    icon: <UserGroupIcon className="h-5 w-5" />,
    prefetch: true,
    caslSubject: "basic.customers",
  },
  {
    translationKey: "cust_type",
    translationSource: "segment",
    href: "/basic/cust_type",
    icon: <UserGroupIcon className="h-5 w-5" />,
    prefetch: true,
    caslSubject: "basic.cust_type",
  },
  {
    translationKey: "items",
    translationSource: "segment",
    href: "/basic/items",
    icon: <CubeIcon className="h-5 w-5" />,
    prefetch: true,
    caslSubject: "basic.items",
  },
  {
    translationKey: "categories",
    translationSource: "segment",
    href: "/basic/categories",
    icon: <TagIcon className="h-5 w-5" />,
    prefetch: true,
    caslSubject: "basic.categories",
  },
  {
    translationKey: "units",
    translationSource: "segment",
    href: "/basic/units",
    icon: <TagIcon className="h-5 w-5" />,
    prefetch: true,
    caslSubject: "basic.units",
  },
];

export const goldFormLinks: SidebarLinkConfig[] = [
  {
    translationKey: "purchase-invoices",
    translationSource: "segment",
    href: "/forms/invoices?type=purchase&mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    caslSubject: "forms.purchase",
  },
  {
    translationKey: "links.purchaseReturnInvoices",
    translationSource: "sidebar",
    href: "/forms/invoices?type=purchase-return&mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    caslSubject: "forms.purchase-return",
  },
  {
    translationKey: "sales-invoices",
    translationSource: "segment",
    href: "/forms/invoices?type=sale&mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    caslSubject: "forms.sales",
  },
  {
    translationKey: "links.saleReturnInvoices",
    translationSource: "sidebar",
    href: "/forms/invoices?type=sale-return&mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    caslSubject: "forms.sale-return",
  },
  {
    translationKey: "gvoucher4",
    translationSource: "segment",
    href: "/forms/gvoucher4",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    caslSubject: "forms.gvoucher4",
  },
  {
    translationKey: "gvoucher5",
    translationSource: "segment",
    href: "/forms/gvoucher5",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    caslSubject: "forms.gvoucher5",
  },
  {
    translationKey: "receipt",
    translationSource: "segment",
    href: "/forms/receipt",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    caslSubject: "forms.receipt",
  },
  {
    translationKey: "delivery",
    translationSource: "segment",
    href: "/forms/delivery",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    caslSubject: "forms.delivery",
  },
];

export const ReportsIcon = ChartBarIcon;
