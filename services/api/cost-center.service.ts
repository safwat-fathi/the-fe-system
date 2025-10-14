import { HttpService } from "@/services/base";

interface CostCenter {
  id: number;
  cost_name: string;
  cost_name_e: string;
  cost_type: number;
  cr_date: string;
  cr_user: number | null;
  upd_date: string | null;
  upd_user: number | null;
  cost_status: number;
  acc: number | null;
  parent: number | null;
}

interface Account {
  id: number;
  acc_name: string;
  acc_name_e: string;
}

class CostCenterService extends HttpService<CostCenter> {
  constructor() {
    super("");
  }

  async getAllCostCenters(): Promise<CostCenter[]> {
    try {
      const response = await this.get<CostCenter[]>(
        "cost_centers_list",
        undefined,
        {
          cache: "no-store",
          next: { tags: ["cost-centers"] },
        },
      );

      if (response.success) {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray((response.data as any)?.results)) {
          return (response.data as any).results;
        }
      }

      return [];
    } catch (error) {
      console.error("Error fetching cost centers:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات مراكز التكلفة");
    }
  }

  async createCostCenter(
    costCenter: Omit<CostCenter, "id">,
  ): Promise<CostCenter | null> {
    try {
      const costCenterData = {
        ...costCenter,
        cost_status: costCenter.cost_status || 1, // Default active status
        cost_type: costCenter.cost_type || 1, // Default cost type
      };

      const response = await this.post<CostCenter>(
        "api_create_cost_center",
        costCenterData,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as CostCenter;
      }

      return null;
    } catch (error) {
      console.error("Error creating cost center:", error);
      throw new Error("حدث خطأ أثناء إنشاء مركز التكلفة");
    }
  }

  async updateCostCenter(
    id: number,
    costCenter: Partial<CostCenter>,
  ): Promise<CostCenter | null> {
    try {
      const costCenterData = {
        ...costCenter,
        cost_status: costCenter.cost_status || 1,
        cost_type: costCenter.cost_type || 1,
      };

      const response = await this.put<CostCenter>(
        `api_update_cost_center/${id}`,
        costCenterData,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as CostCenter;
      }

      return null;
    } catch (error) {
      console.error("Error updating cost center:", error);
      throw new Error("حدث خطأ أثناء تحديث مركز التكلفة");
    }
  }

  async deleteCostCenter(id: number): Promise<boolean> {
    try {
      const response = await this.delete(
        `api_delete_cost_center/${id}`,
        undefined,
        {
          cache: "no-store",
        },
      );

      return response.success;
    } catch (error) {
      console.error("Error deleting cost center:", error);
      throw new Error("حدث خطأ أثناء حذف مركز التكلفة");
    }
  }

  async getCostCenterById(id: number): Promise<CostCenter | null> {
    try {
      const costCenters = await this.getAllCostCenters();

      return costCenters.find((costCenter) => costCenter.id === id) || null;
    } catch (error) {
      console.error("Error fetching cost center by ID:", error);

      return null;
    }
  }

  async getAccounts(): Promise<Account[]> {
    try {
      const response = await this.get<Account[]>("accounts_list", undefined, {
        cache: "no-store",
        next: { tags: ["accounts"] },
      });

      if (response.success) {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray((response.data as any)?.results)) {
          return (response.data as any).results;
        }
      }

      return [];
    } catch (error) {
      console.error("Error fetching accounts:", error);

      return [];
    }
  }
}

export default new CostCenterService();
