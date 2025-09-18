import { HttpService } from "@/services/base";
import { API_ENDPOINTS } from "@/utilities/api";

interface Category {
  id: number;
  // Add other category properties as needed
}

class CategoryService extends HttpService<Category> {
  constructor() {
    super("");
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await this.get<Category[]>(
        "categories_list",
        undefined,
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

  async getCategoryCount(): Promise<number> {
    try {
      const categories = await this.getAllCategories();
      return categories.length;
    } catch (error) {
      console.error("Error counting categories:", error);
      return 0;
    }
  }
}

export default new CategoryService();
