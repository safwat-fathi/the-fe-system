import type { Tax } from "@/types/models/tax";

import { HttpService } from "@/services/base";

class TaxService extends HttpService<Tax> {
  constructor() {
    super("");
  }

  async getAllTaxes(): Promise<Tax[]> {
    try {
      const response = await this.get<Tax[]>(
        "getTaxPrcList",
        undefined,
        {
          cache: "force-cache",
          next: { tags: ["taxes"] },
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
      console.error("Error fetching taxes:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات الضرائب");
    }
  }

  async getTaxById(id: number): Promise<Tax | null> {
    try {
      const taxes = await this.getAllTaxes();

      return taxes.find((tax) => tax.id === id) || null;
    } catch (error) {
      console.error("Error fetching tax by ID:", error);

      return null;
    }
  }
}

export default new TaxService();

