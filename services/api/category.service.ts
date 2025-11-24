import { HttpService } from "@/services/base";

export interface Category {
  id: number;
  cat_name: string;
  cat_name_e: string;
  k: string;
  purity: string;
  box: number | null;
  tax_type: boolean;
  tax: number;
  cat_type: string;
  cat_status: boolean;
}

class CategoryService extends HttpService<Category> {
  constructor() {
    super("");
  }

  async getAllCategories(companyId: number | string = 1): Promise<Category[]> {
    try {
      const response = await this.get<Category[]>(
        "categories_list",
        { xcom_id: String(companyId) },
        {
          cache: "force-cache",
          next: { tags: ["categories"] },
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
      console.error("Error fetching categories:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات الفئات");
    }
  }

  async getCategoryCount(companyId: number | string = 1): Promise<number> {
    try {
      const categories = await this.getAllCategories(companyId);

      return categories.length;
    } catch (error) {
      console.error("Error counting categories:", error);

      return 0;
    }
  }

  async createCategory(
    category: Omit<Category, "id">,
  ): Promise<Category | null> {
    try {
      const response = await this.post<Category>(
        "api_create_category",
        category,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as Category;
      }

      return null;
    } catch (error) {
      console.error("Error creating category:", error);
      throw new Error("حدث خطأ أثناء إنشاء الفئة");
    }
  }

  async updateCategory(
    id: number,
    category: Partial<Category>,
  ): Promise<Category | null> {
    try {
      const response = await this.put<Category>(
        `api_update_category/${id}`,
        category,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as Category;
      }

      return null;
    } catch (error) {
      console.error("Error updating category:", error);
      throw new Error("حدث خطأ أثناء تحديث الفئة");
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      const response = await this.delete(
        `api_delete_category/${id}`,
        undefined,
        {
          cache: "no-store",
        },
      );

      return response.success;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw new Error("حدث خطأ أثناء حذف الفئة");
    }
  }

  async getCategoryById(
    id: number,
    companyId: number | string = 1,
  ): Promise<Category | null> {
    try {
      const categories = await this.getAllCategories(companyId);

      return categories.find((cat) => cat.id === id) || null;
    } catch (error) {
      console.error("Error fetching category by ID:", error);

      return null;
    }
  }
}

export default new CategoryService();
