import type { ItemForm } from "@/types/items";

import { HttpService } from "@/services/base";
import { IPaginatedResponse } from "@/types/services/base";
import {
  Item,
  SearchItemsParams,
  SearchItemsVoucherListParams,
} from "@/types/models/item";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";
import { getBranchParams } from "@/app/actions/branch-params";

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

  private processPaginatedResponse(data: any): IPaginatedResponse<Item> {
    const results = Array.isArray(data?.results) ? data.results : [];

    let count = 0;

    if (typeof data?.count === "number") {
      count = data.count;
    } else if (Array.isArray(results)) {
      count = results.length;
    }

    const next =
      typeof data?.next === "string" || data?.next === null ? data.next : null;
    const previous =
      typeof data?.previous === "string" || data?.previous === null
        ? data.previous
        : null;

    return {
      results,
      count,
      next,
      previous,
    };
  }

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
      rethrowAuthenticationError(error);
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

  async getItemById(id: number, companyId: number = 1): Promise<Item | null> {
    try {
      // البحث عن الصنف في جميع الصفحات
      // نبدأ بصفحة واحدة ثم نبحث في النتائج
      let page = 1;
      let found: Item | null = null;
      const maxPages = 10; // حد أقصى 10 صفحات للبحث

      while (!found && page <= maxPages) {
        const response = await this.get<IPaginatedResponse<Item>>(
          "items_list",
          {
            xcom_id: companyId,
            xcat_id: "0",
            xtype_id: "0",
            xitem_status: "0",
            page,
          },
          {
            cache: "force-cache",
            next: {
              tags: [`item-by-id-${id}-company-${companyId}`],
            },
          },
        );

        if (response.success && response.data?.results) {
          found = response.data.results.find((item) => item.id === id) || null;
          if (found) break;
        }

        // إذا لم تكن هناك صفحة تالية، توقف
        if (!response.data?.next) break;

        page++;
      }

      return found;
    } catch (error) {
      console.error("Error fetching item by id:", error);

      return null;
    }
  }

  async searchItems({
    page = 1,
    categoryId = 0,
    itemTypeId = 0,
    itemStatus = 0,
    searchTerm = "",
  }: SearchItemsParams = {}): Promise<IPaginatedResponse<Item>> {
    const emptyResponse: IPaginatedResponse<Item> = {
      results: [],
      count: 0,
      next: null,
      previous: null,
    };

    const { com } = await getBranchParams();

    try {
      const response = await this.get<IPaginatedResponse<Item>>(
        "SearchItemsList",
        {
          xcom_id: com,
          page,
          q: searchTerm,
          xcat_id: categoryId || "0",
          xtype_id: itemTypeId || "0",
          xitem_status: itemStatus || "0",
        },
        {
          cache: "no-store",
          next: {
            tags: [
              "items-search-list",
              `items-search-list-company-${com}`,
              `items-search-list-page-${page}`,
              `items-search-list-query-${searchTerm}`,
            ],
            revalidate: 0,
          },
        },
      );

      if (!response.success || !response.data) {
        return emptyResponse;
      }

      return this.processPaginatedResponse(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب بيانات الأصناف", { cause: error });
    }
  }

  async searchItemsVoucherList(
    params: SearchItemsVoucherListParams = {},
  ): Promise<
    IPaginatedResponse<Item> & {
      hasMore: boolean;
      currentPage: number;
    }
  > {
    const { query = "", page = 1, companyId = 1 } = params;
		const { com } = await getBranchParams();

    const emptyResponse: IPaginatedResponse<Item> & {
      hasMore: boolean;
      currentPage: number;
    } = {
      results: [],
      count: 0,
      next: null,
      previous: null,
      hasMore: false,
      currentPage: page,
    };

    try {
      const response = await this.get<IPaginatedResponse<Item>>(
        "SearchItemsList",
        {
          xcom_id: com,
          page,
          ...(query ? { q: query } : {}),
        },
        {
          cache: "no-store",
          next: {
            tags: [
              "items-voucher",
              `items-voucher-company-${companyId}`,
              `items-voucher-page-${page}`,
              `items-voucher-query-${query || "all"}`,
            ],
            revalidate: 0,
          },
          signal: AbortSignal.timeout(30000),
        },
      );

      if (!response.success || !response.data) {
        return emptyResponse;
      }

      const processed = this.processPaginatedResponse(response.data);

      return {
        ...processed,
        hasMore: Boolean(processed.next),
        currentPage: page,
      };
    } catch (error) {
      console.error("Error fetching items for voucher:", error);
      rethrowAuthenticationError(error);
      throw new Error(
        "حدث خطأ أثناء جلب بيانات الأصناف لقائمة سند الاستلام/التسليم",
      );
    }
  }

  async createItem(item: ItemForm): Promise<Item | null> {
    try {
      const companyId = Number(item.com);

      if (!Number.isFinite(companyId) || companyId <= 0) {
        throw new Error("رمز الفرع مطلوب قبل إنشاء الصنف");
      }

      // الصورة غير إجبارية

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
      rethrowAuthenticationError(error);

      return null;
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
      rethrowAuthenticationError(error);

      return null;
    }
  }

  async deleteItem(id: number): Promise<boolean> {
    try {
      // نفس الطريقة المستخدمة في deleteCostCenter و deleteCategory
      const response = await this.delete(`api_delete_item/${id}`, undefined, {
        cache: "no-store",
      });

      if (response.success) {
        return true;
      }

      // إذا كان الـ response غير ناجح
      const errorMessage = response.message || "حدث خطأ أثناء حذف الصنف";

      // إذا كان الخطأ 500 من الخادم، نعطي رسالة أوضح
      if (
        errorMessage.includes("500") ||
        errorMessage.includes("Internal Server Error")
      ) {
        throw new Error(
          "لا يمكن حذف الصنف حالياً. قد يكون مرتبطاً ببيانات أخرى في النظام",
        );
      }

      return false;
    } catch (error: any) {
      console.error("Error deleting item:", error);
      rethrowAuthenticationError(error);

      return false;
    }
  }
}

export default new ItemService();
