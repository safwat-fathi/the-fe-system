/**
 * User Service (for permissions module)
 * API service for users management in permissions context
 */

import { User } from "../types/users";

import HttpService from "@/services/base/http.service";

class UserPermissionService extends HttpService {
  constructor() {
    super("");
  }

  /**
   * Get all users
   */
  async getAll(): Promise<User[]> {
    try {
      const response = await this.get<User[]>("users_list", undefined, {
        cache: "force-cache",
        next: { tags: ["users"], revalidate: 300 },
      });

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Error fetching users:", error);

      return [];
    }
  }

  /**
   * Get user by ID
   */
  async getById(id: number): Promise<User | null> {
    try {
      const response = await this.get<User>(`users_list/${id}`, undefined, {
        cache: "force-cache",
        next: { tags: [`user-${id}`], revalidate: 300 },
      });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user:", error);

      return null;
    }
  }

  /**
   * Create a new user
   */
  async create(user: Omit<User, "id">): Promise<User | null> {
    try {
      const response = await this.post<User>("api_create_user", user);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Update a user
   */
  async update(id: number, user: Partial<User>): Promise<User | null> {
    try {
      const response = await this.put<User>(`api_update_user/${id}`, user);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async remove(id: number): Promise<boolean> {
    try {
      const response = await super.delete(`api_delete_user/${id}`);

      return Boolean(response.success);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  /**
   * Get user groups
   */
  async getGroups(id: number): Promise<any[]> {
    try {
      const response = await this.get<any[]>(`users/${id}/groups`, undefined, {
        cache: "force-cache",
        next: { tags: [`user-groups-${id}`], revalidate: 300 },
      });

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Error fetching user groups:", error);

      return [];
    }
  }

  /**
   * Update user groups
   */
  async updateGroups(id: number, groupIds: number[]): Promise<boolean> {
    try {
      const response = await this.put(`users/${id}/groups`, { groupIds });

      return response.success;
    } catch (error) {
      console.error("Error updating user groups:", error);
      throw error;
    }
  }

  /**
   * Get user permissions
   */
  async getPermissions(id: number): Promise<any[]> {
    try {
      const response = await this.get<any[]>(
        `users/${id}/permissions`,
        undefined,
        {
          cache: "force-cache",
          next: { tags: [`user-permissions-${id}`], revalidate: 300 },
        },
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Error fetching user permissions:", error);

      return [];
    }
  }

  /**
   * Update user permissions
   */
  async updatePermissions(id: number, permissions: any[]): Promise<boolean> {
    try {
      const response = await this.put(`users/${id}/permissions`, {
        permissions,
      });

      return response.success;
    } catch (error) {
      console.error("Error updating user permissions:", error);
      throw error;
    }
  }
}

export default new UserPermissionService();
