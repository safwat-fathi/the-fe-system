import { HttpService } from "@/services/base";

interface Category {
  id: number;
  cat_name: string;
  cat_name_e: string;
  cr_date: string;
  gauge: number;
  purity: number;
  box: number;
  tax: number;
  cat_type: number;
  cat_status: number;
}

interface ItemType {
  id: number;
  type_name: string;
  type_name_e: string;
}

interface Unit {
  id: number;
  unit_name: string;
}

interface Box {
  id: number;
  box_name: string;
}

interface CatType {
  code_id: number;
  code_desc: string;
}

interface CatStatus {
  code_id: number;
  code_desc: string;
}

interface CustomerType {
  id: number;
  type_name: string;
  type_name_e?: string;
}

interface CustomerStatus {
  code_id: number;
  code_desc: string;
}

interface BoxType {
  code_id: string;
  code_desc: string;
}

interface Branch {
  id: number;
  com_name?: string;
  com_name_e?: string;
  com_code?: string;
  com_status?: number;
}

class HelperService extends HttpService {
  constructor() {
    super("");
  }

  private _extractArray<T>(payload: unknown): T[] {
    if (!payload) {
      return [];
    }

    if (Array.isArray(payload)) {
      return payload as T[];
    }

    if (typeof payload === "object" && payload !== null) {
      const maybeResults = (payload as { results?: unknown }).results;

      if (Array.isArray(maybeResults)) {
        return maybeResults as T[];
      }
    }

    return [];
  }

  // جلب الفئات
  async getCategories(xcom_id?: string | number): Promise<Category[]> {
    try {
      // جلب companyId من branch-params إذا لم يتم توفيره
      let companyId = xcom_id;

      if (!companyId) {
        try {
          const { getBranchParams } = await import(
            "@/app/actions/branch-params"
          );
          const branchParams = await getBranchParams();

          companyId = branchParams.com || "1";
        } catch {
          // إذا فشل جلب branch params، استخدم القيمة الافتراضية
          companyId = "1";
        }
      }

      // التأكد من أن companyId هو string
      const companyIdString = String(companyId || "1");

      const response = await this.get<Category[]>(
        "categories_list",
        { xcom_id: companyIdString },
        {
          cache: "no-store",
          next: {
            tags: ["categories", `categories-company-${companyIdString}`],
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
      console.error("Error fetching categories:", error);

      // في حالة الخطأ، إرجاع مصفوفة فارغة بدلاً من رمي الخطأ
      return [];
    }
  }

  // جلب أنواع الأصناف
  async getItemTypes(): Promise<ItemType[]> {
    try {
      const response = await this.get<ItemType[]>("item_type_list", undefined, {
        cache: "no-store",
        next: { tags: ["item-types"] },
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
      console.error("Error fetching item types:", error);

      return [];
    }
  }

  // جلب الوحدات
  async getUnits(): Promise<Unit[]> {
    try {
      const response = await this.get<Unit[]>("units_list", undefined, {
        cache: "no-store",
        next: { tags: ["units"] },
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
      console.error("Error fetching units:", error);

      return [];
    }
  }

  // جلب الصناديق
  async getBoxes(xcom_id?: string | number): Promise<Box[]> {
    try {
      // جلب companyId من branch-params إذا لم يتم توفيره
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

      const response = await this.get<Box[]>(
        "boxes_list",
        { xcom_id: String(companyId) },
        {
          cache: "no-store",
          next: { tags: ["boxes"] },
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
      console.error("Error fetching boxes:", error);

      return [];
    }
  }

  // جلب الفروع (قائمة الشركات)
  async getBranches(com_id?: string | number): Promise<Branch[]> {
    try {
      let companyId = com_id;

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

      const branchKey = String(companyId || "1");
      const response = await this.get<Branch[]>("companies_list", {
        com_id: branchKey,
        xcom_id: branchKey,
      });

      if (response.success) {
        return this._extractArray<Branch>(response.data);
      }

      return [];
    } catch (error) {
      console.error("Error fetching branches:", error);

      return [];
    }
  }

  // جلب أنواع الفئات
  async getCatTypes(): Promise<CatType[]> {
    try {
      const response = await this.get<CatType[]>("getCatTypeList", undefined, {
        cache: "no-store",
        next: { tags: ["cat-types"] },
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
      console.error("Error fetching cat types:", error);

      return [];
    }
  }

  // جلب حالات الفئات
  async getCatStatuses(): Promise<CatStatus[]> {
    try {
      const response = await this.get<CatStatus[]>("getCatStatus", undefined, {
        cache: "no-store",
        next: { tags: ["cat-statuses"] },
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
      console.error("Error fetching cat statuses:", error);

      return [];
    }
  }

  // جلب أنواع العملاء
  async getCustomerTypes(): Promise<CustomerType[]> {
    try {
      const response = await this.get<CustomerType[]>(
        "cust_type_list",
        undefined,
        {
          cache: "no-store",
          next: { tags: ["customer-types"] },
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
      console.error("Error fetching customer types:", error);

      return [];
    }
  }

  // جلب حالات العملاء
  async getCustomerStatuses(): Promise<CustomerStatus[]> {
    try {
      const response = await this.get<CustomerStatus[]>(
        "getCustomerStatus",
        undefined,
        {
          cache: "no-store",
          next: { tags: ["customer-statuses"] },
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
      console.error("Error fetching customer statuses:", error);

      return [];
    }
  }

  // جلب أنواع الصناديق
  async getBoxTypes(): Promise<BoxType[]> {
    try {
      const response = await this.get<BoxType[]>("getBoxTypeList", undefined, {
        cache: "no-store",
        next: { tags: ["box-types"] },
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
      console.error("Error fetching box types:", error);

      return [];
    }
  }
}

export default new HelperService();
