// Responsive Design Utilities

// Breakpoints
export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
  "3xl": 1920,
} as const;

// Screen size types
export type ScreenSize = keyof typeof BREAKPOINTS;

// Device types
export const DEVICE_TYPES = {
  mobile: "mobile",
  tablet: "tablet",
  desktop: "desktop",
  large: "large",
} as const;

export type DeviceType = keyof typeof DEVICE_TYPES;

// Get device type based on screen width
export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.md) return "mobile";
  if (width < BREAKPOINTS.lg) return "tablet";
  if (width < BREAKPOINTS["2xl"]) return "desktop";

  return "large";
}

// Check if screen is mobile
export function isMobile(width: number): boolean {
  return width < BREAKPOINTS.md;
}

// Check if screen is tablet
export function isTablet(width: number): boolean {
  return width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
}

// Check if screen is desktop
export function isDesktop(width: number): boolean {
  return width >= BREAKPOINTS.lg;
}

// Get responsive class based on device type
export function getResponsiveClass(
  baseClass: string,
  deviceType: DeviceType,
): string {
  const deviceClasses = {
    mobile: `${baseClass} sm:hidden`,
    tablet: `hidden sm:block md:hidden`,
    desktop: `hidden md:block lg:hidden`,
    large: `hidden lg:block`,
  };

  return deviceClasses[deviceType];
}

// Get responsive text size
export function getResponsiveTextSize(
  size: "xs" | "sm" | "base" | "lg" | "xl" | "2xl",
): string {
  const textSizes = {
    xs: "responsive-text-xs",
    sm: "responsive-text-sm",
    base: "responsive-text-base",
    lg: "responsive-text-lg",
    xl: "responsive-text-xl",
    "2xl": "responsive-text-2xl",
  };

  return textSizes[size];
}

// Get responsive spacing
export function getResponsiveSpacing(
  type: "p" | "px" | "py" | "m" | "mx" | "my",
): string {
  const spacingTypes = {
    p: "responsive-p",
    px: "responsive-px",
    py: "responsive-py",
    m: "responsive-m",
    mx: "responsive-mx",
    my: "responsive-my",
  };

  return spacingTypes[type];
}

// Get responsive width
export function getResponsiveWidth(
  size: "full" | "auto" | "sm" | "md" | "lg",
): string {
  const widthSizes = {
    full: "responsive-w-full",
    auto: "responsive-w-auto",
    sm: "responsive-w-sm",
    md: "responsive-w-md",
    lg: "responsive-w-lg",
  };

  return widthSizes[size];
}

// Responsive layout helpers
export const ResponsiveHelpers = {
  // Container
  container: "responsive-container",

  // Grid
  grid: "responsive-grid",
  grid1: "responsive-grid-1",
  grid2: "responsive-grid-2",
  grid3: "responsive-grid-3",
  grid4: "responsive-grid-4",
  grid6: "responsive-grid-6",

  // Flex
  flex: "responsive-flex",
  flexWrap: "responsive-flex-wrap",
  flexCenter: "responsive-flex-center",
  flexBetween: "responsive-flex-between",

  // Text
  textXs: "responsive-text-xs",
  textSm: "responsive-text-sm",
  textBase: "responsive-text-base",
  textLg: "responsive-text-lg",
  textXl: "responsive-text-xl",
  text2xl: "responsive-text-2xl",

  // Spacing
  p: "responsive-p",
  px: "responsive-px",
  py: "responsive-py",
  m: "responsive-m",
  mx: "responsive-mx",
  my: "responsive-my",

  // Width
  wFull: "responsive-w-full",
  wAuto: "responsive-w-auto",
  wSm: "responsive-w-sm",
  wMd: "responsive-w-md",
  wLg: "responsive-w-lg",

  // Table
  table: "responsive-table",
  tableContainer: "responsive-table-container",
  tableWrapper: "responsive-table-wrapper",

  // Form
  form: "responsive-form",
  formGrid: "responsive-form-grid",
  formFull: "responsive-form-full",

  // Button
  btn: "responsive-btn",
  btnGroup: "responsive-btn-group",

  // Card
  card: "responsive-card",
  cardGrid: "responsive-card-grid",

  // Navigation
  nav: "responsive-nav",
  navMenu: "responsive-nav-menu",
  navMobile: "responsive-nav-mobile",

  // Search
  search: "responsive-search",
  searchGroup: "responsive-search-group",

  // Pagination
  pagination: "responsive-pagination",

  // Filters
  filters: "responsive-filters",

  // Actions
  actions: "responsive-actions",

  // Stats
  stats: "responsive-stats",

  // Chart
  chart: "responsive-chart",

  // Dashboard
  dashboard: "responsive-dashboard",
  dashboardMain: "responsive-dashboard-main",
  dashboardSidebar: "responsive-dashboard-sidebar",

  // Invoice
  invoice: "responsive-invoice",
  invoiceMain: "responsive-invoice-main",
  invoiceSidebar: "responsive-invoice-sidebar",
} as const;

// Hook for responsive design (for future use)
export function useResponsive() {
  // This can be extended with React hooks for dynamic responsive behavior
  return {
    BREAKPOINTS,
    DEVICE_TYPES,
    getDeviceType,
    isMobile,
    isTablet,
    isDesktop,
    getResponsiveClass,
    getResponsiveTextSize,
    getResponsiveSpacing,
    getResponsiveWidth,
    ResponsiveHelpers,
  };
}
