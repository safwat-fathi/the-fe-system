import HttpService from "../base/http.service";
import menuService from "../api/menu.service";
import permissionService from "../api/permission.service";

import { MenuObject, MergedPermissions } from "@/types/models/menu";
import { filterMenuByPermissions } from "@/utilities/permissions";

/**
 * BFF Service for Sidebar Data
 * Aggregates menu and permissions data in a single service
 */

export interface SidebarData {
  menuTree: MenuObject[];
  permissions: MergedPermissions;
}

class SidebarDataService extends HttpService<SidebarData> {
  constructor() {
    super("");
  }

  /**
   * Get complete sidebar data for a user
   * Fetches menu tree and user permissions, then filters menu by permissions
   */
  async getSidebarData(userId: number): Promise<SidebarData | null> {
    try {
      // Fetch menu tree and user permissions in parallel
      const [menuTree, userPermissions] = await Promise.all([
        menuService.getActiveMenuTree(),
        permissionService.getUserPermissions(userId),
      ]);

      if (!userPermissions) {
        console.error("No permissions found for user:", userId);

        return {
          menuTree: [],
          permissions: {},
        };
      }

      // Filter menu tree by user permissions
      const filteredMenu = filterMenuByPermissions(
        menuTree,
        userPermissions.merged_permissions,
      );

      return {
        menuTree: filteredMenu,
        permissions: userPermissions.merged_permissions,
      };
    } catch (error) {
      console.error("Error fetching sidebar data:", error);

      return null;
    }
  }

  /**
   * Get menu tree only (without filtering)
   */
  async getMenuTreeOnly(): Promise<MenuObject[]> {
    return menuService.getActiveMenuTree();
  }

  /**
   * Get user permissions only
   */
  async getUserPermissionsOnly(
    userId: number,
  ): Promise<MergedPermissions | null> {
    const userPermissions = await permissionService.getUserPermissions(userId);

    return userPermissions?.merged_permissions || null;
  }
}

export default new SidebarDataService();
