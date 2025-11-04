/**
 * Group Service
 * API service for groups management
 */

import HttpService from "@/services/base/http.service";
import { Group, GroupWithPermissions } from "../types/groups";

class GroupService extends HttpService {
  constructor() {
    super("");
  }

  /**
   * Get all groups
   * Note: API endpoint is not ready yet - returns mock data
   */
  async getAll(): Promise<Group[]> {
    // TODO: Uncomment when API is ready
    // try {
    //   const { default: genericService } = await import("@/services/api/generic.service");
    //   const response = await genericService.getTableData("groups_list");
    //   
    //   if (response.success && Array.isArray(response.data)) {
    //     return response.data;
    //   }
    //   return [];
    // } catch (error) {
    //   console.warn("Groups API not available:", error);
    //   return [];
    // }
    
    // Return empty array for now - mock data is handled in component
    return [];
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
  async delete(id: number): Promise<boolean> {
    try {
      const response = await this.delete(`api_delete_group/${id}`);

      return response.success;
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
        return response.data;
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
  async updatePermissions(
    id: number,
    permissions: any[],
  ): Promise<boolean> {
    try {
      const response = await this.put(`groups/${id}/permissions`, {
        permissions,
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

