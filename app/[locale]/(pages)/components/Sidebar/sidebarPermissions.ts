export const SIDEBAR_OBJECT_IDS = {
  accountingSystem: [1],
  accountingBasic: [11],
  accountingForms: [12],
  goldSystem: [2],
  goldBasic: [21],
  goldForms: [22],
  reports: [15, 23],
  settings: [9],
} as const;

export type SidebarPermissionKey = keyof typeof SIDEBAR_OBJECT_IDS;
