import type { Box, GetBoxesParams } from "@/types/models/box";

import { HttpService } from "@/services/base";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

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

      const paginated = (data as { results?: Box[] } | undefined)?.results;
      if (Array.isArray(paginated)) {
        return paginated;
      }

      return [];
    } catch (error) {
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب بيانات الصناديق");
    }
  }

  async getGoldBoxes(params: GetBoxesParams = {}): Promise<Box[]> {
    const companyId =
      params.xcom_id !== undefined && params.xcom_id !== null
        ? String(params.xcom_id)
        : "1";

    try {
      const response = await this.get<Box[]>(
        "boxes_list_gold",
        { xcom_id: companyId },
        {
          cache: "force-cache",
          next: {
            tags: ["boxes", "boxes-gold", `boxes-gold-company-${companyId}`],
          },
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

      const paginated = (data as { results?: Box[] } | undefined)?.results;
      if (Array.isArray(paginated)) {
        return paginated;
      }

      return [];
    } catch (error) {
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب صناديق الذهب");
    }
  }
}

export default new BoxesService();
