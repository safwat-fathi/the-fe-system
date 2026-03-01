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
  },
  {
    translationKey: "cost-centers",
    translationSource: "segment",
    href: "/basic/cost-centers",
    icon: <CalculatorIcon className="h-5 w-5" />,
    prefetch: true,
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
  },
];

export const accountingFormLinks: SidebarLinkConfig[] = [
  {
    translationKey: "balance",
    translationSource: "segment",
    href: "/forms/balance",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    requiredObjectIds: [121],
  },
  {
    translationKey: "voucher1",
    translationSource: "segment",
    href: "/forms/voucher1",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    requiredObjectIds: [123],
  },
  {
    translationKey: "voucher2",
    translationSource: "segment",
    href: "/forms/voucher2",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    requiredObjectIds: [124],
  },
  {
    translationKey: "adjustment",
    translationSource: "segment",
    href: "/forms/adjustment?mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    requiredObjectIds: [122],
  },
];

export const goldBasicLinks: SidebarLinkConfig[] = [
  {
    translationKey: "customers",
    translationSource: "segment",
    href: "/basic/customers",
    icon: <UserGroupIcon className="h-5 w-5" />,
    prefetch: true,
  },
  {
    translationKey: "cust_type",
    translationSource: "segment",
    href: "/basic/cust_type",
    icon: <UserGroupIcon className="h-5 w-5" />,
    prefetch: true,
  },
  {
    translationKey: "items",
    translationSource: "segment",
    href: "/basic/items",
    icon: <CubeIcon className="h-5 w-5" />,
    prefetch: true,
  },
  {
    translationKey: "categories",
    translationSource: "segment",
    href: "/basic/categories",
    icon: <TagIcon className="h-5 w-5" />,
    prefetch: true,
  },
  {
    translationKey: "units",
    translationSource: "segment",
    href: "/basic/units",
    icon: <TagIcon className="h-5 w-5" />,
    prefetch: true,
  },
];

export const goldFormLinks: SidebarLinkConfig[] = [
  {
    translationKey: "purchase-invoices",
    translationSource: "segment",
    href: "/forms/invoices?type=purchase&mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    requiredObjectIds: [221],
  },
  {
    translationKey: "links.purchaseReturnInvoices",
    translationSource: "sidebar",
    href: "/forms/invoices?type=purchase-return&mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    requiredObjectIds: [223],
  },
  {
    translationKey: "sales-invoices",
    translationSource: "segment",
    href: "/forms/invoices?type=sale&mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    requiredObjectIds: [222],
  },
  {
    translationKey: "links.saleReturnInvoices",
    translationSource: "sidebar",
    href: "/forms/invoices?type=sale-return&mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    requiredObjectIds: [224],
  },
  {
    translationKey: "gvoucher4",
    translationSource: "segment",
    href: "/forms/gvoucher4",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    requiredObjectIds: [229],
  },
  {
    translationKey: "gvoucher5",
    translationSource: "segment",
    href: "/forms/gvoucher5",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    requiredObjectIds: [2210],
  },
  {
    translationKey: "receipt",
    translationSource: "segment",
    href: "/forms/receipt",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    requiredObjectIds: [2222],
  },
  {
    translationKey: "delivery",
    translationSource: "segment",
    href: "/forms/delivery",
    icon: <DocumentTextIcon className="h-5 w-5" />,
    requiredObjectIds: [2223],
  },
];

export const ReportsIcon = ChartBarIcon;
