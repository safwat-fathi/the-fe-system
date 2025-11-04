import HttpService from "../base/http.service";

class UserService extends HttpService {
  constructor() {
    super("");
  }

  /**
   * Get user permissions by username
   * @deprecated Use permissionService.getUserPermissions instead
   */
  async getUserPermissions(username: string) {
    return this.get<{
      username: string;
      permissions: string[];
    }>(`/user_permissions/${username}`, undefined, {
      cache: "force-cache",
      next: { tags: [`user-permissions-${username}`] },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number) {
    return this.get<{
      id: number;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      is_staff: boolean;
      is_active: boolean;
      groups: any[];
      user_permissions: Array<{
        codename: string;
        name: string;
        content_type: number;
      }>;
    }>(`users_list`, undefined, {
      cache: "force-cache",
      next: { tags: [`user-${userId}`], revalidate: 300 },
    });
  }

  /**
   * Get current user from API
   */
  async getCurrentUser() {
    try {
      const response = await this.get<{
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        is_staff: boolean;
        is_active: boolean;
        groups: any[];
        user_permissions: Array<{
          codename: string;
          name: string;
          content_type: number;
        }>;
      }>(`current_user`, undefined, {
        cache: "force-cache",
        next: { tags: ["current-user"], revalidate: 300 },
      });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error("Error fetching current user:", error);

      return null;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    return this.get<any[]>("users_list", undefined, {
      cache: "force-cache",
      next: { tags: ["users"], revalidate: 300 },
    });
  }
}

export default new UserService();
