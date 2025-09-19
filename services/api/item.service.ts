import { HttpService } from "@/services/base";
import { API_ENDPOINTS } from "@/utilities/api";

interface Item {
  id: number;
  // Add other item properties as needed
}

class ItemService extends HttpService<Item> {
  constructor() {
    super("");
  }

  async getAllItems(): Promise<Item[]> {
    try {
      const response = await this.get<Item[]>("items_list", undefined, {
        cache: "force-cache",
        next: { tags: ["items"] },
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
      console.error("Error fetching items:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات الأصناف");
    }
  }

  async getItemCount(): Promise<number> {
    try {
      const items = await this.getAllItems();
      return items.length;
    } catch (error) {
      console.error("Error counting items:", error);
      return 0;
    }
  }
}

export default new ItemService();
