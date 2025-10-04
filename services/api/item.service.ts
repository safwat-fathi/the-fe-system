import { HttpService } from "@/services/base";
import { API_ENDPOINTS } from "@/utilities/api";

interface Item {
  id: number;
  item_name: string;
  item_name_e: string;
  item_price: string;
  item_img: string;
  item_code: string;
  item_barcode: string;
  first_cost: string;
  item_weight: string;
  item_g_weight: string;
  stones: string;
  model: string;
  k: string;
  purity: string;
  item_status: number;
  cr_date: string;
  cr_user: string;
  upd_date: string;
  upd_user: string;
  cat: number | null;
  item_type: number | null;
  unit: number | null;
}

class ItemService extends HttpService<Item> {
  constructor() {
    super("");
  }

  async getAllItems(): Promise<Item[]> {
    try {
      const response = await this.get<Item[]>("items_list/", undefined, {
        cache: "no-store",
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

  async createItem(item: Omit<Item, 'id'>): Promise<Item | null> {
    try {
      const response = await this.post<Item>(
        "api_create_item",
        item,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as Item;
      }

      return null;
    } catch (error) {
      console.error("Error creating item:", error);
      throw new Error("حدث خطأ أثناء إنشاء الصنف");
    }
  }

  async updateItem(id: number, item: Partial<Item>): Promise<Item | null> {
    try {
      const response = await this.put<Item>(
        `api_update_item/${id}`,
        item,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as Item;
      }

      return null;
    } catch (error) {
      console.error("Error updating item:", error);
      throw new Error("حدث خطأ أثناء تحديث الصنف");
    }
  }

  async deleteItem(id: number): Promise<boolean> {
    try {
      const response = await this.delete(
        `api_delete_item/${id}`,
        undefined,
        {
          cache: "no-store",
        },
      );

      return response.success;
    } catch (error) {
      console.error("Error deleting item:", error);
      throw new Error("حدث خطأ أثناء حذف الصنف");
    }
  }

  async getItemById(id: number): Promise<Item | null> {
    try {
      const items = await this.getAllItems();
      return items.find(item => item.id === id) || null;
    } catch (error) {
      console.error("Error fetching item by ID:", error);
      return null;
    }
  }
}

export default new ItemService();
