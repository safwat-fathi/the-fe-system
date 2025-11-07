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

class HelperService extends HttpService {
  constructor() {
    super("");
  }

  // جلب الفئات
  async getCategories(params?: { xcom_id?: number | string }): Promise<Category[]> {
    try {
      let xcom_id: number | string | undefined = params?.xcom_id;
      if (xcom_id === undefined) {
        try {
          const { getBranchParams } = await import("@/app/actions/branch-params");
          const branch = await getBranchParams();
          const parsed = Number(branch?.com ?? 1);
          xcom_id = Number.isFinite(parsed) ? parsed : 1;
        } catch {
          xcom_id = 1;
        }
      }
      const response = await this.get<Category[]>(
        "categories_list",
        { xcom_id },
        {
          cache: "no-store",
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
  async getBoxes(): Promise<Box[]> {
    try {
      const response = await this.get<Box[]>("boxes_list", undefined, {
        cache: "no-store",
        next: { tags: ["boxes"] },
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
      console.error("Error fetching boxes:", error);

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
      const response = await this.get<CatStatus[]>(
        "getCatStatusList",
        undefined,
        {
          cache: "no-store",
          next: { tags: ["cat-statuses"] },
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
