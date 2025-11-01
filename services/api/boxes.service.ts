import type { Box, GetBoxesParams } from "@/types/models/box";

import { HttpService } from "@/services/base";

class BoxesService extends HttpService<Box> {
  constructor() {
    super("");
  }

  async getBoxes(params: GetBoxesParams = {}): Promise<Box[]> {
    const companyId =
      params.xcom_id !== undefined && params.xcom_id !== null
        ? String(params.xcom_id)
        : "1";

    try {
      const response = await this.get<Box[]>(
        "boxes_list",
        { xcom_id: companyId },
        {
          cache: "force-cache",
          next: { tags: ["boxes", `boxes-company-${companyId}`] },
          signal: AbortSignal.timeout(30000),
        },
      );

      if (!response.success) {
        return [];
      }

      const { data } = response;

      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray((data as { results?: unknown[] })?.results)) {
        return (data as { results?: Box[] }).results ?? [];
      }

      return [];
    } catch (error) {
      console.error("Error fetching boxes:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات الصناديق");
    }
  }
}

export default new BoxesService();
