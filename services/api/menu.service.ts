import HttpService from "../base/http.service";

import { MenuObject, MenuResponse } from "@/types/models/menu";

class MenuService extends HttpService {
  constructor() {
    super("");
  }

  /**
   * Get all menu objects with tree structure
   * Fetches from objects table and builds hierarchical tree
   */
  async getMenuTree(): Promise<MenuObject[]> {
    try {
      const response = await this.get<MenuResponse["data"]>(
        "objects_list",
        undefined,
        {
          cache: "force-cache",
          next: { tags: ["menu"], revalidate: 300 }, // Cache for 5 minutes
        },
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Error fetching menu tree:", error);

      return [];
    }
  }

  /**
   * Get flat list of menu objects
   */
  async getMenuList(): Promise<MenuObject[]> {
    try {
      const response = await this.get<MenuResponse["data"]>(
        "objects_list",
        undefined,
        {
          cache: "force-cache",
          next: { tags: ["menu-list"], revalidate: 300 },
        },
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Error fetching menu list:", error);

      return [];
    }
  }

  /**
   * Get active menu objects only
   */
  async getActiveMenuTree(): Promise<MenuObject[]> {
    try {
      const allObjects = await this.getMenuList();

      // Filter to only active objects and build tree
      return this.buildMenuTree(
        allObjects.filter((obj) => obj.is_active === true),
      );
    } catch (error) {
      console.error("Error fetching active menu tree:", error);

      return [];
    }
  }

  /**
   * Build hierarchical menu tree from flat array
   */
  private buildMenuTree(
    objects: MenuObject[],
    parentId: number | null = null,
  ): MenuObject[] {
    const result: MenuObject[] = [];

    const children = objects
      .filter((obj) => obj.parent_id === parentId)
      .sort((a, b) => a.order - b.order);

    for (const child of children) {
      const descendants = this.buildMenuTree(objects, child.id);

      result.push({
        ...child,
        children: descendants.length > 0 ? descendants : undefined,
      });
    }

    return result;
  }

  /**
   * Get route permissions mapping from menu objects
   * Returns a map of paths to required permissions
   */
  async getRoutePermissions(): Promise<Record<string, string[]>> {
    try {
      const menuList = await this.getMenuList();
      const routePermissions: Record<string, string[]> = {};

      // Add dashboard permission
      routePermissions[""] = ["view"];

      // Map screen paths to their permissions
      for (const item of menuList) {
        if (item.path && item.type === "screen" && item.permissions) {
          routePermissions[item.path] = item.permissions;

          // Add wildcard pattern for nested routes
          if (!item.path.endsWith("*")) {
            routePermissions[`${item.path}/*`] = item.permissions;
          }
        }
      }

      return routePermissions;
    } catch (error) {
      console.error("Error fetching route permissions:", error);

      return {};
    }
  }
}

export default new MenuService();
