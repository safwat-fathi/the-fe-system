import HttpService from "@/services/base/http.service";

export interface UserCostCenter {
  id: number;
  user: number;
  cost: number;
  cost_name?: string | null;
  cost_code?: string | null;
}

export interface CreateUserCostCenterPayload {
  user: number;
  cost: number;
}

class UserCostCenterService extends HttpService<UserCostCenter> {
  constructor() {
    super("");
  }

  async list(params: { xcom_id: string | number; xuser_id: string | number }) {
    const response = await this.get<any>(
      "api/user_cost_centers",
      {
        xcom_id: String(params.xcom_id ?? "1"),
        xuser_id: String(params.xuser_id),
      },
      { cache: "no-store", next: { tags: ["user-cost-centers"] } },
    );

    if (!response.success) {
      return [];
    }

    const { data } = response;

    if (Array.isArray(data)) {
      return data as UserCostCenter[];
    }

    if (data && Array.isArray((data as any)?.results)) {
      return (data as any).results as UserCostCenter[];
    }

    return [];
  }

  async create(payload: CreateUserCostCenterPayload) {
    return this.post<UserCostCenter>("api_create_user_cost", payload);
  }

  async update(id: number, payload: Partial<CreateUserCostCenterPayload>) {
    return this.patch<UserCostCenter>(`api_update_user_cost/${id}`, payload);
  }

  async delete(id: number) {
    return this.delete(`api_delete_user_cost/${id}`);
  }
}

const userCostCenterService = new UserCostCenterService();

export default userCostCenterService;
