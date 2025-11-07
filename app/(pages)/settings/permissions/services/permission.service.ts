/**
 * Permission Service
 * API service for permissions management
 */

import HttpService from "@/services/base/http.service";
import { UserPermissions, UserPermissionsResponse } from "../types/users";

class PermissionService extends HttpService {
  constructor() {
    super("");
  }

  /**
   * Get user permissions including group and user-specific permissions
   */
  async getUserPermissions(userId: number): Promise<UserPermissions | null> {
    try {
      const response = await this.get<UserPermissionsResponse["data"]>(
        `user_permissions/${userId}`,
        undefined,
        {
          cache: "force-cache",
          next: {
            tags: [`user-permissions-${userId}`],
            revalidate: 300, // Cache for 5 minutes
          },
        },
      );

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user permissions:", error);

      return null;
    }
  }

  /**
   * Check if user has specific permission on an object
   */
  async checkPermission(
    userId: number,
    objectId: number,
    permission: string,
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      if (!userPermissions) {
        return false;
      }

      const objectPermissions =
        userPermissions.merged_permissions[objectId.toString()] || [];

      return objectPermissions.includes(permission);
    } catch (error) {
      console.error("Error checking permission:", error);

      return false;
    }
  }

  /**
   * Check if user has any of the required permissions on an object
   */
  async checkAnyPermission(
    userId: number,
    objectId: number,
    permissions: string[],
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      if (!userPermissions) {
        return false;
      }

      const objectPermissions =
        userPermissions.merged_permissions[objectId.toString()] || [];

      return permissions.some((perm) => objectPermissions.includes(perm));
    } catch (error) {
      console.error("Error checking permissions:", error);

      return false;
    }
  }

  /**
   * Check if user has all required permissions on an object
   */
  async checkAllPermissions(
    userId: number,
    objectId: number,
    permissions: string[],
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      if (!userPermissions) {
        return false;
      }

      const objectPermissions =
        userPermissions.merged_permissions[objectId.toString()] || [];

      return permissions.every((perm) => objectPermissions.includes(perm));
    } catch (error) {
      console.error("Error checking all permissions:", error);

      return false;
    }
  }
}

export default new PermissionService();

