import { HttpService } from "@/services/base";

interface Box {
  id: number;
  cust_code?: string;
  cust_name: string;
  cust_name_e: string;
  mobile: number | string;
  email: string;
  address: string;
  vat_no: number | null;
  cr_no: number | null;
  phone: string;
  fax: string;
  gov: string;
  city: string;
  area: string;
  street: string;
  build_no: string;
  post_code: string;
  cust_status: number;
  acc?: number;
  acc_name?: string;
  cust_type?: number;
  box_type: string;
  handling: string;
  handling_e?: string;
  perc?: number;
  expt?: boolean;
  hide?: boolean;
}

interface BoxType {
  id: number;
  code_id: number;
  code_desc: string;
  code_desc_l: string | null;
  type_id: number;
}

class BoxService extends HttpService<Box> {
  constructor() {
    super("");
  }

  async getAllBoxes(): Promise<Box[]> {
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
      throw new Error("حدث خطأ أثناء جلب بيانات الصناديق");
    }
  }

  async createBox(box: Omit<Box, "id">): Promise<Box | null> {
    try {
      // جلب معاملات الفرع لإضافة com
      let companyId = "1";
      try {
        const branchParams = await import("@/app/actions/branch-params").then(
          (m) => m.getBranchParams(),
        );
        companyId = branchParams.com || "1";
      } catch {
        companyId = "1";
      }

      // تنظيف البيانات - إزالة acc_name وضمان تحويل الأرقام
      const { acc_name, ...rest } = box;
      const boxData = {
        ...rest,
        com: companyId, // إضافة حقل com المطلوب
        cust_type: 99, // Set customer type to 99 for boxes
        cust_code: box.cust_code || "",
        cust_status: box.cust_status || 1, // Default active status
        acc: Number(box.acc) || null,
        vat_no: Number(box.vat_no) || null,
        cr_no: Number(box.cr_no) || null,
        perc: Number(box.perc) || null,
        expt: !!box.expt,
        hide: !!box.hide,
        post_code: box.post_code || "",
      };

      // استخدام api_create_customer لأن الصناديق هي نوع من العملاء
      const response = await this.post<Box>(
        "api_create_customer",
        boxData,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as Box;
      }

      // استخراج رسائل الخطأ من API response
      let errorMessage = "حدث خطأ أثناء إنشاء الصندوق";
      if (response.data && typeof response.data === "object") {
        const errorData = response.data as any;
        const errorMessages: string[] = [];

        if (errorData.cust_code) {
          const messages = Array.isArray(errorData.cust_code)
            ? errorData.cust_code
            : [errorData.cust_code];
          if (messages.some((msg: string) => msg.includes("already exists"))) {
            errorMessages.push("❌ كود الصندوق موجود مسبقاً");
          } else {
            errorMessages.push(...messages.map((msg: string) => `كود الصندوق: ${msg}`));
          }
        }

        if (errorData.cust_name) {
          const messages = Array.isArray(errorData.cust_name)
            ? errorData.cust_name
            : [errorData.cust_name];
          if (messages.some((msg: string) => msg.includes("already exists"))) {
            errorMessages.push("❌ اسم الصندوق موجود مسبقاً");
          } else {
            errorMessages.push(...messages.map((msg: string) => `اسم الصندوق: ${msg}`));
          }
        }

        // إضافة أي رسائل خطأ أخرى
        Object.keys(errorData).forEach((key) => {
          if (key !== "cust_code" && key !== "cust_name") {
            const messages = Array.isArray(errorData[key])
              ? errorData[key]
              : [errorData[key]];
            errorMessages.push(...messages.map((msg: string) => `${key}: ${msg}`));
          }
        });

        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join("\n");
        }
      }

      throw new Error(errorMessage);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error("Error creating box:", error);
      throw new Error("حدث خطأ أثناء إنشاء الصندوق");
    }
  }

  async updateBox(id: number, box: Partial<Box>): Promise<Box | null> {
    try {
      // جلب معاملات الفرع لإضافة com
      let companyId = "1";
      try {
        const branchParams = await import("@/app/actions/branch-params").then(
          (m) => m.getBranchParams(),
        );
        companyId = branchParams.com || "1";
      } catch {
        companyId = "1";
      }

      // تنظيف البيانات - إزالة acc_name وضمان تحويل الأرقام
      const { acc_name, ...rest } = box;
      const boxData = {
        ...rest,
        com: companyId, // إضافة حقل com المطلوب
        cust_type: 99, // Ensure it remains a box
        cust_code: box.cust_code || String(id),
        cust_status: box.cust_status || 1,
        acc: box.acc !== undefined ? (Number(box.acc) || null) : undefined,
        vat_no: box.vat_no !== undefined ? (Number(box.vat_no) || null) : undefined,
        cr_no: box.cr_no !== undefined ? (Number(box.cr_no) || null) : undefined,
        perc: box.perc !== undefined ? (Number(box.perc) || null) : undefined,
        expt: box.expt !== undefined ? !!box.expt : undefined,
        hide: box.hide !== undefined ? !!box.hide : undefined,
        post_code: box.post_code || "",
      };

      // استخدام api_update_customer لأن الصناديق هي نوع من العملاء
      const response = await this.put<Box>(
        `api_update_customer/${id}`,
        boxData,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as Box;
      }

      // استخراج رسائل الخطأ من API response
      let errorMessage = "حدث خطأ أثناء تحديث الصندوق";
      if (response.data && typeof response.data === "object") {
        const errorData = response.data as any;
        const errorMessages: string[] = [];

        if (errorData.cust_code) {
          const messages = Array.isArray(errorData.cust_code)
            ? errorData.cust_code
            : [errorData.cust_code];
          if (messages.some((msg: string) => msg.includes("already exists"))) {
            errorMessages.push("❌ كود الصندوق موجود مسبقاً");
          } else {
            errorMessages.push(...messages.map((msg: string) => `كود الصندوق: ${msg}`));
          }
        }

        if (errorData.cust_name) {
          const messages = Array.isArray(errorData.cust_name)
            ? errorData.cust_name
            : [errorData.cust_name];
          if (messages.some((msg: string) => msg.includes("already exists"))) {
            errorMessages.push("❌ اسم الصندوق موجود مسبقاً");
          } else {
            errorMessages.push(...messages.map((msg: string) => `اسم الصندوق: ${msg}`));
          }
        }

        // إضافة أي رسائل خطأ أخرى
        Object.keys(errorData).forEach((key) => {
          if (key !== "cust_code" && key !== "cust_name") {
            const messages = Array.isArray(errorData[key])
              ? errorData[key]
              : [errorData[key]];
            errorMessages.push(...messages.map((msg: string) => `${key}: ${msg}`));
          }
        });

        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join("\n");
        }
      }

      throw new Error(errorMessage);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error("Error updating box:", error);
      throw new Error("حدث خطأ أثناء تحديث الصندوق");
    }
  }

  async deleteBox(id: number): Promise<boolean> {
    try {
      // استخدام api_delete_customer لأن الصناديق هي نوع من العملاء
      const response = await this.delete(`api_delete_customer/${id}`, undefined, {
        cache: "no-store",
      });

      return response.success;
    } catch (error) {
      console.error("Error deleting box:", error);
      throw new Error("حدث خطأ أثناء حذف الصندوق");
    }
  }

  async getBoxById(id: number): Promise<Box | null> {
    try {
      const boxes = await this.getAllBoxes();

      return boxes.find((box) => box.id === id) || null;
    } catch (error) {
      console.error("Error fetching box by ID:", error);

      return null;
    }
  }

  async getBoxTypes(): Promise<BoxType[]> {
    try {
      const response = await this.get<BoxType[]>("get_box_type", undefined, {
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

export default new BoxService();
