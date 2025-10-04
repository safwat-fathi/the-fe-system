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
  code_id: number;
  code_desc: string;
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

  async createBox(box: Omit<Box, 'id'>): Promise<Box | null> {
    try {
      const boxData = {
        ...box,
        cust_type: 99, // Set customer type to 99 for boxes
        cust_code: box.cust_code || String(box.id || ""),
        cust_status: box.cust_status || 1, // Default active status
      };

      const response = await this.post<Box>(
        "api_create_box",
        boxData,
        undefined,
        {
          cache: "no-store",
        },
      );
      if (response.success) { 
        return response.data as Box; 
      }
      return null;
    } catch (error) {
      console.error("Error creating box:", error);
      throw new Error("حدث خطأ أثناء إنشاء الصندوق");
    }
  }

  async updateBox(id: number, box: Partial<Box>): Promise<Box | null> {
    try {
      const boxData = {
        ...box,
        cust_type: 99, // Ensure it remains a box
        cust_code: box.cust_code || String(id),
        cust_status: box.cust_status || 1,
      };

      const response = await this.put<Box>(
        `api_update_box/${id}`,
        boxData,
        undefined,
        {
          cache: "no-store",
        },
      );
      if (response.success) { 
        return response.data as Box; 
      }
      return null;
    } catch (error) {
      console.error("Error updating box:", error);
      throw new Error("حدث خطأ أثناء تحديث الصندوق");
    }
  }

  async deleteBox(id: number): Promise<boolean> {
    try {
      const response = await this.delete(
        `api_delete_box/${id}`,
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

  async getBoxById(id: number): Promise<Box | null> {
    try {
      const boxes = await this.getAllBoxes();
      return boxes.find(box => box.id === id) || null;
    } catch (error) {
      console.error("Error fetching box by ID:", error);
      return null;
    }
  }

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

export default new BoxService();
