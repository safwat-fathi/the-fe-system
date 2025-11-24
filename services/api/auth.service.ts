import { HttpService } from "@/services/base";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "@/types/services/auth";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

class AuthService extends HttpService {
  constructor() {
    super("");
  }

  async login(credentials: LoginRequest, requestOptions?: RequestInit) {
    try {
      const response = await this.post<LoginResponse>(
        "login",
        credentials,
        undefined,
        requestOptions,
      );

      return response;
    } catch (error) {
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ غير متوقع في الاتصال");
    }
  }

  async register(userData: RegisterRequest) {
    return this.post<LoginResponse>("register", userData);
  }

  async logout() {
    return this.post("logout", {});
  }

  async refreshToken() {
    return this.post<LoginResponse>("token", {});
  }

  async resetPassword(token: string, password: string) {
    return this.post("reset-password", { token, password });
  }
}

export default new AuthService();
