import HttpService from "../base/http.service";

interface UserPermissionsResponse {
  username: string;
  permissions: string[];
}

class UserService extends HttpService {
  constructor() {
    super("");
  }

  async getUserPermissions(username: string) {
    return this.get<UserPermissionsResponse>(
      `/user_permissions/${username}`,
      undefined,
      {
        cache: "force-cache",
        next: { tags: [`user-permissions-${username}`] },
      },
    );
  }
}

export default new UserService();
