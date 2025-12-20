import { HttpService } from "@/services/base";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

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

  /**
   * استخراج رسالة الخطأ من response
   */
  private extractErrorMessage(response: any): string {
    if (!response.data) {
      return response.message || "حدث خطأ أثناء العملية";
    }

    // إذا كان data هو object يحتوي على رسائل خطأ
    if (typeof response.data === "object" && response.data !== null) {
      const errors: string[] = [];

      // استخراج جميع رسائل الخطأ من الحقول
      Object.keys(response.data).forEach((key) => {
        const fieldErrors = response.data[key];

        if (Array.isArray(fieldErrors)) {
          fieldErrors.forEach((error: string) => {
            if (error && typeof error === "string") {
              errors.push(error);
            }
          });
        } else if (typeof fieldErrors === "string" && fieldErrors) {
          errors.push(fieldErrors);
        }
      });

      if (errors.length > 0) {
        return errors.join(". ");
      }

      // إذا كان هناك message مباشر
      if (response.data.message && typeof response.data.message === "string") {
        return response.data.message;
      }
    }

    // إذا كان data هو string
    if (typeof response.data === "string") {
      return response.data;
    }

    return response.message || "حدث خطأ أثناء العملية";
  }

  async getAllCostCenters(): Promise<CostCenter[]> {
    try {
      let companyId: string;

      try {
        const branchParams = await import("@/app/actions/branch-params").then(
          (m) => m.getBranchParams(),
        );

        companyId = branchParams.com || "1";
      } catch {
        companyId = "1";
      }

      const response = await this.get<CostCenter[]>(
        "cost_centers_list",
        {
          xcom_id: companyId || "1",
        },
        {
          cache: "force-cache",
          next: {
            revalidate: 300, // Cache for 5 minutes
            tags: [
              "cost_centers_list",
              "cost-centers",
              `cost-centers-${companyId}`,
            ],
          },
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
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب بيانات مراكز التكلفة");
    }
  }

  async createCostCenter(
    costCenter: Omit<CostCenter, "id">,
  ): Promise<CostCenter | null> {
    try {
      // جلب معاملات الفرع لإضافة com
      let companyId = "1";

      try {
        const branchParams = await import("@/app/actions/branch-params").then(
          (m) => m.getBranchParams(),
        );

        companyId = branchParams.com || "1";
      } catch {
        companyId = "1";
      }

      const costCenterData = {
        ...costCenter,
        com: companyId, // إضافة حقل com المطلوب من API
        cost_status: costCenter.cost_status || 1, // Default active status
        cost_type: costCenter.cost_type || 1, // Default cost type
      };

      const response = await this.post<CostCenter>(
        "api_create_cost",
        costCenterData,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as CostCenter;
      }

      // استخراج رسالة الخطأ من response
      const errorMessage = this.extractErrorMessage(response);
      throw new Error(errorMessage);
    } catch (error) {
      // إذا كان error من نوع Error، نرميه مباشرة
      if (error instanceof Error) {
        rethrowAuthenticationError(error);
        throw error;
      }

      console.error("Error creating cost center:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء إنشاء مركز التكلفة");
    }
  }

  async updateCostCenter(
    id: number,
    costCenter: Partial<CostCenter>,
  ): Promise<CostCenter | null> {
    try {
      // جلب معاملات الفرع لإضافة com
      let companyId: string;

      try {
        const branchParams = await import("@/app/actions/branch-params").then(
          (m) => m.getBranchParams(),
        );

        companyId = branchParams.com || "1";
      } catch {
        companyId = "1";
      }

      const costCenterData = {
        ...costCenter,
        com: companyId, // إضافة حقل com المطلوب من API
        cost_status: costCenter.cost_status || 1,
        cost_type: costCenter.cost_type || 1,
      };

      const response = await this.put<CostCenter>(
        `api_updatecost/${id}`,
        costCenterData,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as CostCenter;
      }

      // استخراج رسالة الخطأ من response
      const errorMessage = this.extractErrorMessage(response);
      throw new Error(errorMessage);
    } catch (error) {
      // إذا كان error من نوع Error، نرميه مباشرة
      if (error instanceof Error) {
        rethrowAuthenticationError(error);
        throw error;
      }

      console.error("Error updating cost center:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء تحديث مركز التكلفة");
    }
  }

  async deleteCostCenter(id: number): Promise<boolean> {
    try {
      const response = await this.delete(`api_delete_cost/${id}`, undefined, {
        cache: "no-store",
      });

      return response.success;
    } catch (error) {
      console.error("Error deleting cost center:", error);
      rethrowAuthenticationError(error);
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

  async getAccounts(xcom_id?: number | string): Promise<Account[]> {
    try {
      let companyId = xcom_id;

      if (!companyId) {
        try {
          const branchParams = await import("@/app/actions/branch-params").then(
            (m) => m.getBranchParams(),
          );

          companyId = branchParams.com || "1";
        } catch {
          companyId = "1";
        }
      }

      const response = await this.get<Account[]>(
        "accounts_list",
        {
          xcom_id: companyId || "1",
        },
        {
          cache: "no-store",
          next: { tags: ["accounts"] },
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
      console.error("Error fetching accounts:", error);

      return [];
    }
  }
}

export default new CostCenterService();
