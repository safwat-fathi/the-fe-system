import { HttpService } from "@/services/base";
import { LoginRequest, LoginResponse, RegisterRequest, User } from "@/types/services/auth";

class AuthService extends HttpService<User> {
  constructor() {
    super("");
  }

  async login(credentials: LoginRequest, requestOptions?: RequestInit) {
    try {
      const response = await this.post<LoginResponse>("login/", credentials, undefined, requestOptions);

      console.log("🚀 ~ :13 ~ AuthService ~ login ~ response:", response)
      return response;

      //   if (!response.ok) {
      //     // If there's an error message from the server, use it
      //     if (data && data.message) {
      //       throw new Error(data.message);
      //     }
      //     // Otherwise use a generic error message
      //     throw new Error(`خطأ في الاتصال: ${response.status}`);
      //   }

      //   // Ensure the response has the expected format
      //   if (!data || typeof data !== 'object') {
      //     throw new Error('استجابة غير صحيحة من الخادم');
      //   }

      //   // Return the data in the format expected by the frontend
      //   return {
      //     token: data.token || data.auth_token || '',
      //     user: data.user,
      //     success: data.success || !!data.token || !!data.auth_token,
      //     message: data.message
      //   };
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
