import { MenuObject, ObjectType } from "@/types/models/menu";

/**
 * Menu utility functions
 */

/**
 * Build hierarchical menu tree from flat array
 */
export const buildMenuTree = (
  objects: MenuObject[],
  parentId: number | null = null,
): MenuObject[] => {
  const result: MenuObject[] = [];

  const children = objects
    .filter((obj) => obj.parent_id === parentId)
    .sort((a, b) => a.order - b.order);

  for (const child of children) {
    const descendants = buildMenuTree(objects, child.id);

    result.push({
      ...child,
      children: descendants.length > 0 ? descendants : undefined,
    });
  }

  return result;
};

/**
 * Flatten menu tree to array
 */
export const flattenMenuTree = (menuTree: MenuObject[]): MenuObject[] => {
  const result: MenuObject[] = [];

  for (const item of menuTree) {
    result.push(item);

    if (item.children && item.children.length > 0) {
      result.push(...flattenMenuTree(item.children));
    }
  }

  return result;
};

/**
 * Filter menu by type
 */
export const filterByType = (
  menu: MenuObject[],
  type: ObjectType,
): MenuObject[] => {
  return menu.filter((item) => item.type === type);
};

/**
 * Get all screens from menu tree
 */
export const getScreens = (menu: MenuObject[]): MenuObject[] => {
  const allItems = flattenMenuTree(menu);

  return allItems.filter((item) => item.type === "screen" && item.path);
};

/**
 * Find menu item by ID
 */
export const findMenuById = (
  menu: MenuObject[],
  id: number,
): MenuObject | null => {
  for (const item of menu) {
    if (item.id === id) {
      return item;
    }

    if (item.children) {
      const found = findMenuById(item.children, id);

      if (found) {
        return found;
      }
    }
  }

  return null;
};

/**
 * Find menu item by path
 */
export const findMenuByPath = (
  menu: MenuObject[],
  path: string,
): MenuObject | null => {
  for (const item of menu) {
    if (item.path === path) {
      return item;
    }

    if (item.children) {
      const found = findMenuByPath(item.children, path);

      if (found) {
        return found;
      }
    }
  }

  return null;
};

/**
 * Get breadcrumb path for a menu item
 */
export const getBreadcrumbPath = (
  menu: MenuObject[],
  targetPath: string,
): MenuObject[] => {
  const findPath = (
    items: MenuObject[],
    path: string,
    breadcrumb: MenuObject[],
  ): MenuObject[] | null => {
    for (const item of items) {
      const currentPath = [...breadcrumb, item];

      if (item.path === path) {
        return currentPath;
      }

      if (item.children && item.children.length > 0) {
        const found = findPath(item.children, path, currentPath);

        if (found) {
          return found;
        }
      }
    }

    return null;
  };

  return findPath(menu, targetPath, []) || [];
};

/**
 * Check if menu item is active based on current path
 */
export const isMenuItemActive = (
  item: MenuObject,
  currentPath: string,
): boolean => {
  // Exact match
  if (item.path === currentPath) {
    return true;
  }

  // Check if current path starts with item path (for nested routes)
  if (item.path && currentPath.startsWith(item.path)) {
    return true;
  }

  // Check children
  if (item.children && item.children.length > 0) {
    return item.children.some((child) => isMenuItemActive(child, currentPath));
  }

  return false;
};

/**
 * Get icon component name from string
 * Converts icon string to a react component name
 */
export const getIconName = (icon?: string): string | null => {
  if (!icon) {
    return null;
  }

  // If already a valid component name, return as is
  if (icon.endsWith("Icon")) {
    return icon;
  }

  // Convert snake_case or kebab-case to PascalCase and add Icon suffix
  const formatted = icon
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

  return `${formatted}Icon`;
};
