import { HttpService } from "@/services/base";
import { LoginRequest, LoginResponse, RegisterRequest, User } from "@/types/services/auth";

class AuthService extends HttpService<User> {
  constructor() {
    super("");
  }

  async login(credentials: LoginRequest, requestOptions?: RequestInit) {
    try {
      const response = await this.post<LoginResponse>("login/", credentials, undefined, requestOptions);

      return response;
    } catch (error) {
      throw new Error("حدث خطأ غير متوقع في الاتصال");
    }
  }

  async register(userData: RegisterRequest) {
    return this.post<LoginResponse>("/register", userData);
  }

  async logout() {
    return this.post("/logout", {});
  }

  async refreshToken() {
    return this.post<LoginResponse>("/refresh", {});
  }

  async getProfile() {
    return this.get<User>("/profile");
  }

  async updateProfile(data: Partial<User>) {
    return this.put<User>("/profile", data);
  }

  async resetPassword(token: string, password: string) {
    return this.post("/reset-password", { token, password });
  }
}

export default new AuthService();
