import { HttpService } from "@/services/base";
import { HomeSettings } from "@/types/models/home";
import { ServiceResponse } from "@/types/services/base";

class HomeService extends HttpService<HomeSettings> {
  constructor() {
    // Increase timeout to 30 seconds for home_list
    super("", 30000);
  }

  async getHomeList(): Promise<HomeSettings[]> {
    try {
      const response = await this.get<HomeSettings[]>("home_list", undefined, {
        cache: "force-cache",
        next: { tags: ["home_list"] },
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
      console.error("Error fetching home list:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات النظام");
    }
  }

  async getHomeListWithDebug(params?: {
    com?: string;
    year?: string;
  }): Promise<ServiceResponse<HomeSettings[]>> {
    try {
      // Build query params
      const queryParams: any = {};

      if (params?.com) queryParams.com = params.com;
      if (params?.year) queryParams.year = params.year;

      console.log("🔍 HomeService Request:");
      console.log("  - URL: home_list");
      console.log("  - Params:", queryParams);
      console.log("  - Base URL:", process.env.NEXT_PUBLIC_API_BASE_URL);

      const startTime = Date.now();

      const response = await this.get<HomeSettings[]>(
        "home_list",
        queryParams,
        {
          cache: "no-store",
        },
      );

      const endTime = Date.now();

      console.log(`⏱️ Request took: ${endTime - startTime}ms`);
      console.log("✅ HomeService Response:", response);

      if (response.success) {
        if (Array.isArray(response.data)) {
          return {
            success: true,
            data: response.data,
            message: `تم جلب ${response.data.length} سجل بنجاح`,
          };
        } else if (Array.isArray((response.data as any)?.results)) {
          return {
            success: true,
            data: (response.data as any).results,
            message: `تم جلب ${(response.data as any).results.length} سجل بنجاح`,
          };
        }
      }

      return {
        success: false,
        data: [],
        message: response.message || "No data returned from API",
      };
    } catch (error) {
      console.error("❌ Error fetching home list:", error);

      return {
        success: false,
        data: [],
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء جلب بيانات النظام",
      };
    }
  }

  /**
   * Get fractions (frac, frac2) from home settings
   * Used for decimal precision in calculations
   */
  async getFractions(): Promise<{ frac: number; frac2: number }> {
    try {
      const homeList = await this.getHomeList();

      if (homeList.length > 0) {
        const frac = homeList[0].frac || 2;
        const frac2 = homeList[0].frac2 || 3;

        return { frac, frac2 };
      }

      return { frac: 2, frac2: 3 };
    } catch (error) {
      console.error("Error fetching fractions:", error);

      return { frac: 2, frac2: 3 };
    }
  }

  /**
   * Get home settings with additional data (purity, vat_perc, etc.)
   */
  async getHomeSettings(): Promise<HomeSettings | null> {
    try {
      const homeList = await this.getHomeList();

      return homeList.length > 0 ? homeList[0] : null;
    } catch (error) {
      console.error("Error fetching home settings:", error);

      return null;
    }
  }
}

export default new HomeService();
