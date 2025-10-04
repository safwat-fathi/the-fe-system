import { HttpService } from "@/services/base";

interface Unit {
  id: number;
  unit_name: string;
  unit_name_e: string;
  unit_type: number;
  unit_status: boolean;
  unit_default: boolean;
}

class UnitService extends HttpService<Unit> {
  constructor() {
    super("");
  }

  async getAllUnits(): Promise<Unit[]> {
    try {
      const response = await this.get<Unit[]>("units_list/", undefined, {
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
      throw new Error("حدث خطأ أثناء جلب بيانات الوحدات");
    }
  }

  async createUnit(unit: Omit<Unit, 'id'>): Promise<Unit | null> {
    try {
      const response = await this.post<Unit>(
        "api_create_unit",
        unit,
        undefined,
        {
          cache: "no-store",
        },
      );
      if (response.success) { 
        return response.data as Unit; 
      }
      return null;
    } catch (error) {
      console.error("Error creating unit:", error);
      throw new Error("حدث خطأ أثناء إنشاء الوحدة");
    }
  }

  async updateUnit(id: number, unit: Partial<Unit>): Promise<Unit | null> {
    try {
      const response = await this.put<Unit>(
        `api_update_unit/${id}`,
        unit,
        undefined,
        {
          cache: "no-store",
        },
      );
      if (response.success) { 
        return response.data as Unit; 
      }
      return null;
    } catch (error) {
      console.error("Error updating unit:", error);
      throw new Error("حدث خطأ أثناء تحديث الوحدة");
    }
  }

  async deleteUnit(id: number): Promise<boolean> {
    try {
      const response = await this.delete(
        `api_delete_unit/${id}`,
        undefined,
        {
          cache: "no-store",
        },
      );
      return response.success;
    } catch (error) {
      console.error("Error deleting unit:", error);
      throw new Error("حدث خطأ أثناء حذف الوحدة");
    }
  }

  async getUnitById(id: number): Promise<Unit | null> {
    try {
      const units = await this.getAllUnits();
      return units.find(unit => unit.id === id) || null;
    } catch (error) {
      console.error("Error fetching unit by ID:", error);
      return null;
    }
  }
}

export default new UnitService();
