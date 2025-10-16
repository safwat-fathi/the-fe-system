import { HttpService } from "@/services/base";
import { API_ENDPOINTS } from "@/utilities/api";
import { IPaginatedResponse } from "@/types/services/base";

interface Item {
  id: number;
  // Add other item properties as needed
}

class ItemService extends HttpService<Item> {
  constructor() {
    super("");
  }

  async getAllItems(): Promise<IPaginatedResponse<Item> | null> {
    try {
      const response = await this.get<IPaginatedResponse<Item>>(
        "GetItemsList/",
        undefined,
        {
          cache: "force-cache",
          next: { tags: ["items"] },
        },
      );

      if (!response.success || !response.data) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching items:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات الأصناف");
    }
  }

  async getItemCount(): Promise<number> {
    try {
      const items = await this.getAllItems();
      return items?.count ?? 0;
    } catch (error) {
      console.error("Error counting items:", error);
      return 0;
    }
  }

  async getHomeSettings(): Promise<any[]> {
    try {
      const response = await this.get<any[]>("home_list", undefined, {
        cache: "force-cache",
        next: { tags: ["home_settings"] },
      });
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching home settings:", error);
      throw new Error("حدث خطأ أثناء جلب إعدادات النظام");
    }
  }

  async getItemByBarcode(barcode: string): Promise<Item | null> {
    try {
      const response = await this.get<Item[]>(
        `ItemBarcode/${encodeURIComponent(barcode)}`,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (
        response.success &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        return response.data[0];
      }
      return null;
    } catch (error) {
      console.error("Error fetching item by barcode:", error);
      return null;
    }
  }

  async searchItems(
    query: string,
    page = 1,
  ): Promise<IPaginatedResponse<Item> | null> {
    try {
      const response = await this.get<IPaginatedResponse<Item>>(
        "SearchItemsList",
        {
          q: query,
          page,
        },
        {
          cache: "no-store",
        },
      );

      if (!response.success || !response.data) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error("Error searching items:", error);
      throw new Error("حدث خطأ أثناء البحث عن الأصناف");
    }
  }
}

export default new ItemService();
