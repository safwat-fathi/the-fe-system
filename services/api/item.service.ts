import type { ItemForm } from "@/types/items";

import { HttpService } from "@/services/base";
import { IPaginatedResponse } from "@/types/services/base";
import { Item, SearchItemsParams } from "@/types/models/item";

class ItemService extends HttpService<Item> {
  constructor() {
    super("");
  }

  private buildItemFormData(payload: Partial<ItemForm>): FormData {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (key === "item_img") {
        if (typeof File !== "undefined" && value instanceof File) {
          formData.append(key, value);
        }

        return;
      }

      formData.append(key, String(value));
    });

    return formData;
  }

  // async getAllItems(): Promise<IPaginatedResponse<Item> | null> {
  //   try {
  //     const response = await this.get<IPaginatedResponse<Item>>(
  //       "GetItemsList/",
  //       undefined,
  //       {
  //         cache: "force-cache",
  //         next: { tags: ["items"] },
  //       },
  //     );

  //     if (!response.success || !response.data) {
  //       return null;
  //     }

  //     return response.data;
  //   } catch (error) {
  //     console.error("Error fetching items:", error);
  //     throw new Error("حدث خطأ أثناء جلب بيانات الأصناف");
  //   }
  // }

  // async getItemCount(): Promise<number> {
  //   try {
  //     const items = await this.getAllItems();
  //     return items?.count ?? 0;
  //   } catch (error) {
  //     console.error("Error counting items:", error);
  //     return 0;
  //   }
  // }

  async getHomeSettings(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.get<unknown[]>("home_list", undefined, {
        cache: "force-cache",
        next: { tags: ["home_settings"] },
      });

      if (response.success && Array.isArray(response.data)) {
        return response.data as Record<string, unknown>[];
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
          cache: "force-cache",
          next: { tags: [`item-by-barcode-${barcode}`] },
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

  async searchItems({
    query = "",
    page = 1,
    companyId = 1,
  }: SearchItemsParams = {}): Promise<IPaginatedResponse<Item>> {
    const emptyResponse: IPaginatedResponse<Item> = {
      results: [],
      count: 0,
      next: null,
      previous: null,
    };

    try {
      const response = await this.get<IPaginatedResponse<Item>>(
        "SearchItemsList",
        {
          xcom_id: companyId,
          q: query || "0",
          page,
        },
        {
          cache: "force-cache",
          next: {
            tags: [
              "items",
              `items-company-${companyId}`,
              `items-search-${companyId}-${query}-${page}`,
            ],
          },
        },
      );

      if (!response.success || !response.data) {
        return emptyResponse;
      }

      const { results, count, next, previous } = response.data;

      return {
        results: Array.isArray(results) ? results : [],
        count:
          typeof count === "number"
            ? count
            : Array.isArray(results)
              ? results.length
              : 0,
        next: typeof next === "string" || next === null ? next : null,
        previous:
          typeof previous === "string" || previous === null ? previous : null,
      };
    } catch (error) {
      console.error("Error searching items:", error);
      throw new Error("حدث خطأ أثناء البحث عن الأصناف");
    }
  }

  async createItem(item: ItemForm): Promise<Item | null> {
    try {
      const companyId = Number(item.com);

      if (!Number.isFinite(companyId) || companyId <= 0) {
        throw new Error("رمز الفرع مطلوب قبل إنشاء الصنف");
      }

      if (typeof File !== "undefined" && !(item.item_img instanceof File)) {
        throw new Error("صورة الصنف مطلوبة قبل الإنشاء");
      }

      const formData = this.buildItemFormData({
        ...item,
        com: companyId,
      });

      const response = await this.post<Item>(
        "api_create_item",
        formData,
        undefined,
        {
          cache: "no-store",
          signal: AbortSignal.timeout(60000),
        },
      );

      if (response.success && response.data) {
        return response.data as Item;
      }

      return null;
    } catch (error) {
      console.error("Error creating item:", error);
      throw new Error("حدث خطأ أثناء إنشاء الصنف");
    }
  }

  async updateItem(id: number, item: Partial<ItemForm>): Promise<Item | null> {
    try {
      const response = await this.put<Item>(
        `api_update_item/${id}`,
        this.buildItemFormData(item),
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success && response.data) {
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
      const response = await this.delete(`api_delete_item/${id}`, undefined, {
        cache: "no-store",
      });

      return Boolean(response.success);
    } catch (error) {
      console.error("Error deleting item:", error);
      throw new Error("حدث خطأ أثناء حذف الصنف");
    }
  }
}

export default new ItemService();
