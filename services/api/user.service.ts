import { IParams } from "@/types/services/base";
import HttpService from "../base/http.service";
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from "@/types/services/user";

class UserService extends HttpService<User> {
  constructor() {
    super("/users");
  }

  async getUsers(filters?: UserFilters) {
    return this.getPaginated<User>("", filters as IParams);
  }

  async getUserById(id: string) {
    return this.get<User>(`/${id}`);
  }

  async createUser(userData: CreateUserRequest) {
    return this.post<User>("", userData);
  }

  async updateUser(id: string, userData: UpdateUserRequest) {
    return this.put<User>(`/${id}`, userData);
  }

  async deleteUser(id: string) {
    return this.delete(`/${id}`);
  }

  async uploadAvatar(id: string, file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    return this.post<User>(`/${id}/avatar`, formData);
  }

  async toggleUserStatus(id: string) {
    return this.patch<User>(`/${id}/toggle-status`, {});
  }

  async searchUsers(query: string) {
    return this.get<User[]>("/search", { q: query });
  }
}

export default new UserService();
