import type { Box } from "@/types/models/box";

import { HttpService } from "@/services/base";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

interface BoxType {
  id: number;
  code_id: number;
  code_desc: string;
  code_desc_l: string | null;
  type_id: number;
}

type CreateBoxDTO = Omit<Box, "id">;
type UpdateBoxDTO = Partial<Box>;

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

  async createBox(box: CreateBoxDTO): Promise<Box | null> {
    try {
      // جلب معاملات الفرع لإضافة com
      let companyId: string;

      try {
        const branchParams = await import("@/app/actions/branch-params").then(
          (m) => m.getBranchParams(),
        );

        companyId = branchParams.com || "1";
      } catch {
        companyId = "1";
      }

      // تنظيف البيانات - إزالة acc_name وضمان تحويل الأرقام
      const { ...rest } = box as any;
      const boxData = {
        ...rest,
        com: companyId, // إضافة حقل com المطلوب
        cust_type: 99, // Set customer type to 99 for boxes
        cust_code: (box as any).cust_code || "",
        cust_status: (box as any).cust_status || 1, // Default active status
        acc:
          box.acc !== undefined && box.acc !== null
            ? Number(box.acc as any) || null
            : null,
        vat_no:
          box.vat_no !== undefined && box.vat_no !== null
            ? Number(box.vat_no as any) || null
            : null,
        cr_no:
          box.cr_no !== undefined && box.cr_no !== null
            ? Number(box.cr_no as any) || null
            : null,
        perc:
          box.perc !== undefined && box.perc !== null
            ? Number(box.perc as any) || null
            : null,
        expt: !!(box as any).expt,
        hide: !!(box as any).hide,
        post_code: (box as any).post_code || "",
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
            errorMessages.push(
              ...messages.map((msg: string) => `كود الصندوق: ${msg}`),
            );
          }
        }

        if (errorData.cust_name) {
          const messages = Array.isArray(errorData.cust_name)
            ? errorData.cust_name
            : [errorData.cust_name];

          if (messages.some((msg: string) => msg.includes("already exists"))) {
            errorMessages.push("❌ اسم الصندوق موجود مسبقاً");
          } else {
            errorMessages.push(
              ...messages.map((msg: string) => `اسم الصندوق: ${msg}`),
            );
          }
        }

        // إضافة أي رسائل خطأ أخرى
        Object.keys(errorData).forEach((key) => {
          if (key !== "cust_code" && key !== "cust_name") {
            const messages = Array.isArray(errorData[key])
              ? errorData[key]
              : [errorData[key]];

            errorMessages.push(
              ...messages.map((msg: string) => `${key}: ${msg}`),
            );
          }
        });

        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join("\n");
        }
      }

      throw new Error(errorMessage);
    } catch (error) {
      rethrowAuthenticationError(error);

      if (error instanceof Error) {
        throw error;
      }
      console.error("Error creating box:", error);
      throw new Error("حدث خطأ أثناء إنشاء الصندوق");
    }
  }

  async updateBox(id: number, box: UpdateBoxDTO): Promise<Box | null> {
    try {
      // جلب معاملات الفرع لإضافة com
      let companyId: string;

      try {
        const branchParams = await import("@/app/actions/branch-params").then(
          (m) => m.getBranchParams(),
        );

        companyId = branchParams.com || "1";
      } catch {
        companyId = "1";
      }

      // تنظيف البيانات - إزالة acc_name وضمان تحويل الأرقام
      const { ...rest } = box as any;
      const boxData = {
        ...rest,
        com: companyId, // إضافة حقل com المطلوب
        cust_type: 99, // Ensure it remains a box
        cust_code: box.cust_code || String(id),
        cust_status: box.cust_status || 1,
        acc:
          box.acc !== undefined
            ? box.acc !== null
              ? Number(box.acc as any) || null
              : null
            : undefined,
        vat_no:
          box.vat_no !== undefined
            ? box.vat_no !== null
              ? Number(box.vat_no as any) || null
              : null
            : undefined,
        cr_no:
          box.cr_no !== undefined
            ? box.cr_no !== null
              ? Number(box.cr_no as any) || null
              : null
            : undefined,
        perc:
          box.perc !== undefined
            ? box.perc !== null
              ? Number(box.perc as any) || null
              : null
            : undefined,
        expt: (box as any).expt !== undefined ? !!(box as any).expt : undefined,
        hide: (box as any).hide !== undefined ? !!(box as any).hide : undefined,
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
            errorMessages.push(
              ...messages.map((msg: string) => `كود الصندوق: ${msg}`),
            );
          }
        }

        if (errorData.cust_name) {
          const messages = Array.isArray(errorData.cust_name)
            ? errorData.cust_name
            : [errorData.cust_name];

          if (messages.some((msg: string) => msg.includes("already exists"))) {
            errorMessages.push("❌ اسم الصندوق موجود مسبقاً");
          } else {
            errorMessages.push(
              ...messages.map((msg: string) => `اسم الصندوق: ${msg}`),
            );
          }
        }

        // إضافة أي رسائل خطأ أخرى
        Object.keys(errorData).forEach((key) => {
          if (key !== "cust_code" && key !== "cust_name") {
            const messages = Array.isArray(errorData[key])
              ? errorData[key]
              : [errorData[key]];

            errorMessages.push(
              ...messages.map((msg: string) => `${key}: ${msg}`),
            );
          }
        });

        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join("\n");
        }
      }

      throw new Error(errorMessage);
    } catch (error) {
      rethrowAuthenticationError(error);

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
      const response = await this.delete(
        `api_delete_customer/${id}`,
        undefined,
        {
          cache: "no-store",
        },
      );

      return response.success;
    } catch (error) {
      console.error("Error deleting box:", error);
      throw new Error("حدث خطأ أثناء حذف الصندوق");
    }
  }

  async getBoxById(id: number, xcom_id?: number | string): Promise<Box | null> {
    try {
      // جلب معاملات الفرع إذا لم يتم توفيرها
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
        { xcom_id: companyId },
        {
          cache: "no-store",
          next: { tags: ["boxes"] },
        },
      );

      if (response.success) {
        let boxes: Box[] = [];

        if (Array.isArray(response.data)) {
          boxes = response.data;
        } else if (Array.isArray((response.data as any)?.results)) {
          boxes = (response.data as any).results;
        }

        return boxes.find((box) => box.id === id) || null;
      }

      return null;
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
