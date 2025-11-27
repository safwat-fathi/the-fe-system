import HttpService from "@/services/base/http.service";

export interface UserCompany {
  id: number;
  user: number;
  com: number;
  branch_name?: string | null;
  branch_code?: string | null;
}

export interface CreateUserCompanyPayload {
  user: number;
  com: number;
}

class UserCompanyService extends HttpService<UserCompany> {
  constructor() {
    super("");
  }

  async list(params: { xcom_id: string | number; xuser_id: string | number }) {
    const response = await this.get<any>(
      "api/user_companies",
      {
        xcom_id: String(params.xcom_id ?? "1"),
        xuser_id: String(params.xuser_id),
      },
      { cache: "no-store", next: { tags: ["user-companies"] } },
    );

    if (!response.success) {
      return [];
    }

    const { data } = response;

    if (Array.isArray(data)) {
      return data as UserCompany[];
    }

    if (data && Array.isArray((data as any)?.results)) {
      return (data as any).results as UserCompany[];
    }

    return [];
  }

  async create(payload: CreateUserCompanyPayload) {
    return this.post<UserCompany>("api_create_user_company", payload);
  }

  async update(id: number, payload: Partial<CreateUserCompanyPayload>) {
    return this.patch<UserCompany>(`api_update_user_company/${id}`, payload);
  }

  async remove(id: number) {
    return super.delete(`api_delete_user_company/${id}`);
  }
}

const userCompanyService = new UserCompanyService();

export default userCompanyService;
