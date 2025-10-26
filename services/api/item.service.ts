import { HttpService } from "@/services/base";
import { IPaginatedResponse } from "@/types/services/base";
import { Item, SearchItemsParams } from "@/types/models/item";

class ItemService extends HttpService<Item> {
  constructor() {
    super("");
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
          next: { tags: [`items-search-${query}-${page}`] },
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
}

export default new ItemService();
