import { type ReactNode } from "react";

export type SegmentTranslationKey =
  | "accounts"
  | "boxes"
  | "categories"
  | "cost-centers"
  | "currencies"
  | "customers"
  | "cust_type"
  | "delivery"
  | "gvoucher4"
  | "gvoucher5"
  | "integrations"
  | "items"
  | "permissions"
  | "purchase-invoices"
  | "receipt"
  | "sales-invoices"
  | "taxes"
  | "units"
  | "cash-receipt"
  | "payment-receipt"
  | "balance"
  | "adjustment";

export type SidebarNamespaceLinkKey =
  | "links.systemSettings"
  | "links.userBranches"
  | "links.saleReturnInvoices"
  | "links.purchaseReturnInvoices";

export type SidebarLinkBase = {
  href: string;
  icon: ReactNode;
  prefetch?: boolean;
  requiredObjectIds?: number[];
  /** CASL subject string (e.g. "basic.items", "forms.purchase").
   *  When set, sidebar visibility is determined by ability.can(anyAction, caslSubject)
   *  instead of requiredObjectIds / menuObjects lookup. */
  caslSubject?: string;
};

export type HomeLinkConfig = SidebarLinkBase & {
  translationSource: "home";
  translationKey: "home";
};

export type SegmentLinkConfig = SidebarLinkBase & {
  translationSource: "segment";
  translationKey: SegmentTranslationKey;
};

export type SidebarNamespaceLinkConfig = SidebarLinkBase & {
  translationSource: "sidebar";
  translationKey: SidebarNamespaceLinkKey;
};

export type SidebarLinkConfig =
  | HomeLinkConfig
  | SegmentLinkConfig
  | SidebarNamespaceLinkConfig;
