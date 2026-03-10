/**
 * Group Service
 * API service for groups management
 */

import { Group } from "../types/groups";

import HttpService from "@/services/base/http.service";
import {
  normalizePermissionActions,
  serializePermissionActionsForBackend,
} from "@/utilities/auth/authorization-core";

class GroupService extends HttpService {
  constructor() {
    super("");
  }

  /**
   * Get all groups
   */
  async getAll(): Promise<Group[]> {
    try {
      const { default: genericService } = await import(
        "@/services/api/generic.service"
      );
      const response = await genericService.getTableData("groups_list");

      if (response.success && Array.isArray(response.data)) {
        return response.data as Group[];
      }

      throw new Error(response.message || "Groups API is not available");
    } catch (error) {
      console.error("Error fetching groups:", error);
      throw new Error("تعذر تحميل المجموعات. يرجى التأكد من جاهزية الخدمة.");
    }
  }

  /**
   * Get group by ID
   */
  async getById(id: number): Promise<Group | null> {
    try {
      const response = await this.get<Group>(`groups_list/${id}`, undefined, {
        cache: "force-cache",
        next: { tags: [`group-${id}`], revalidate: 300 },
      });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error("Error fetching group:", error);

      return null;
    }
  }

  /**
   * Create a new group
   */
  async create(group: Omit<Group, "id">): Promise<Group | null> {
    try {
      const response = await this.post<Group>("api_create_group", group);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  }

  /**
   * Update a group
   */
  async update(id: number, group: Partial<Group>): Promise<Group | null> {
    try {
      const response = await this.put<Group>(`api_update_group/${id}`, group);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error("Error updating group:", error);
      throw error;
    }
  }

  /**
   * Delete a group
   */
  async remove(id: number): Promise<boolean> {
    try {
      const response = await super.delete(`api_delete_group/${id}`);

      return Boolean(response.success);
    } catch (error) {
      console.error("Error deleting group:", error);
      throw error;
    }
  }

  /**
   * Get group permissions
   */
  async getPermissions(id: number): Promise<any[]> {
    try {
      const response = await this.get<any[]>(
        `groups/${id}/permissions`,
        undefined,
        {
          cache: "force-cache",
          next: { tags: [`group-permissions-${id}`], revalidate: 300 },
        },
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data.map((permission) => ({
          ...permission,
          permissions: normalizePermissionActions(permission.permissions),
        }));
      }

      return [];
    } catch (error) {
      console.error("Error fetching group permissions:", error);

      return [];
    }
  }

  /**
   * Update group permissions
   */
  async updatePermissions(id: number, permissions: any[]): Promise<boolean> {
    try {
      const normalizedPermissions = permissions.map((permission) => ({
        ...permission,
        permissions: serializePermissionActionsForBackend(
          permission.permissions,
        ),
      }));

      const response = await this.put(`groups/${id}/permissions`, {
        permissions: normalizedPermissions,
      });

      return response.success;
    } catch (error) {
      console.error("Error updating group permissions:", error);
      throw error;
    }
  }

  /**
   * Get group users
   */
  async getUsers(id: number): Promise<any[]> {
    try {
      const response = await this.get<any[]>(`groups/${id}/users`, undefined, {
        cache: "force-cache",
        next: { tags: [`group-users-${id}`], revalidate: 300 },
      });

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Error fetching group users:", error);

      return [];
    }
  }
}

export default new GroupService();
