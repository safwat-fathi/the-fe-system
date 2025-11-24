import { HttpService } from "@/services/base";
import {
  CategoryAccount,
  UpsertCategoryAccountPayload,
} from "@/types/models/category-account";

const baseTags = ["category-accounts"];

class CategoryAccountService extends HttpService<CategoryAccount> {
  constructor() {
    super("");
  }

  private buildCacheTags(
    companyId: string | number,
    categoryId?: string | number,
  ): string[] {
    const tags = [...baseTags, `category-accounts-com-${companyId}`];

    if (categoryId && Number(categoryId) > 0) {
      tags.push(`category-accounts-cat-${categoryId}`);
    } else {
      tags.push("category-accounts-all");
    }

    return tags;
  }

  async getCategoryAccounts(
    companyId: number | string,
    categoryId?: number | string,
  ): Promise<CategoryAccount[]> {
    const queryParams = {
      xcom_id: String(companyId || "1"),
      xcat_id: categoryId ? String(categoryId) : "0",
    };

    try {
      const response = await this.get<CategoryAccount[]>(
        "cat_acc_list",
        queryParams,
        {
          cache: "force-cache",
          next: {
            tags: this.buildCacheTags(queryParams.xcom_id, queryParams.xcat_id),
          },
        },
      );

      if (response.success && response.data) {
        const payload = response.data as any;

        if (Array.isArray(payload)) {
          return payload;
        }

        if (Array.isArray(payload?.results)) {
          return payload.results;
        }

        if (payload && typeof payload === "object") {
          return [payload] as CategoryAccount[];
        }
      }

      return [];
    } catch (error) {
      console.error("Error fetching category accounts:", error);
      throw new Error("حدث خطأ أثناء جلب حسابات الفئات");
    }
  }

  async createCategoryAccount(
    payload: UpsertCategoryAccountPayload,
  ): Promise<CategoryAccount | null> {
    try {
      const response = await this.post<CategoryAccount>(
        "api_create_cat_acc",
        payload,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as CategoryAccount;
      }

      return null;
    } catch (error) {
      console.error("Error creating category account:", error);
      throw new Error("حدث خطأ أثناء إنشاء حساب الفئة");
    }
  }

  async updateCategoryAccount(
    id: number,
    payload: UpsertCategoryAccountPayload,
  ): Promise<CategoryAccount | null> {
    try {
      const response = await this.put<CategoryAccount>(
        `api_update_cat_acc/${id}`,
        payload,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as CategoryAccount;
      }

      return null;
    } catch (error) {
      console.error("Error updating category account:", error);
      throw new Error("حدث خطأ أثناء تحديث حساب الفئة");
    }
  }

  async deleteCategoryAccount(id: number): Promise<boolean> {
    try {
      const response = await this.delete(
        `api_delete_cat_acc/${id}`,
        undefined,
        {
          cache: "no-store",
        },
      );

      return response.success;
    } catch (error) {
      console.error("Error deleting category account:", error);
      throw new Error("حدث خطأ أثناء حذف حساب الفئة");
    }
  }
}

export default new CategoryAccountService();
