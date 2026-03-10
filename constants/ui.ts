/**
 * Single UI/design reference for list screens and shared components.
 * Change here to apply across: customers, boxes, cust_type, cost-centers,
 * categories, currencies, taxes (and any screen using these constants).
 */

export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OVERRIDES = {
  customers: 20,
  categories: 10,
  currencies: 12,
} as const;

export type TableClassNames = {
  wrapper?: string;
  th?: string;
  td?: string;
  tr?: string;
};

export const TABLE_STYLE: TableClassNames = {
  wrapper: "shadow-none",
  th: "bg-gray-50 text-gray-700 font-semibold text-sm border-b border-gray-200",
  td: "border-b border-gray-100 text-sm",
  tr: "hover:bg-gray-50 transition-colors",
};

export const FONT = {
  table: "text-sm",
  label: "text-sm font-medium text-gray-700",
  hint: "text-sm text-gray-500",
} as const;

export const TOOLBAR = {
  root: "flex flex-wrap items-center gap-3 mb-2",
  addButton: "bg-gray-100",
  addButtonVariant: "bordered" as const,
  divider: "h-8 w-px bg-gray-300",
  searchWrapper: "flex-1 min-w-[200px]",
  inputSize: "sm" as const,
  iconAdd: "h-3 w-3",
  iconSearch: "h-4 w-4 text-gray-400",
} as const;

export const PAGINATION_BAR = {
  root: "py-4 flex justify-between items-center",
  countText: "text-sm text-gray-500",
  color: "primary" as const,
} as const;

export const ACTION_BUTTONS = {
  wrapper: "flex gap-2",
  size: "sm" as const,
  variant: "light" as const,
  iconSize: "h-4 w-4",
  iconView: "h-4 w-4 text-blue-500",
  iconEdit: "h-4 w-4 text-yellow-500",
} as const;

export const CONFIRM_MODAL = {
  confirmColor: "danger" as const,
  size: "md" as const,
} as const;

/**
 * Unified form action buttons for view/edit screens (customers, accounts,
 * categories, cust_type, currencies, boxes, cost-centers, units, items).
 * Use: رجوع (flat) + تعديل (warning flat) in view | حفظ/تحديث (emerald + check) in edit/add.
 */
export const FORM_ACTIONS = {
  wrapper: "flex gap-2",
  size: "sm" as const,
  back: {
    variant: "flat" as const,
    iconSize: "h-4 w-4",
  },
  edit: {
    color: "warning" as const,
    variant: "flat" as const,
  },
  save: {
    color: "primary" as const,
    className: "bg-emerald-600 hover:bg-emerald-700",
    iconSize: "h-4 w-4",
  },
} as const;
