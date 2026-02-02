import type { Box, GetBoxesParams } from "@/types/models/box";

import { HttpService } from "@/services/base";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

class BoxesService extends HttpService<Box> {
  constructor() {
    super("");
  }

  async getBoxes(_params: GetBoxesParams = {}): Promise<Box[]> {
    try {
      const response = await this.get<Box[]>("boxes_list", undefined, {
        cache: "force-cache",
        next: { tags: ["boxes", `boxes-company-{xcom_id}`] },
        signal: AbortSignal.timeout(30000),
      });

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

  async getGoldBoxes(_params: GetBoxesParams = {}): Promise<Box[]> {
    try {
      const response = await this.get<Box[]>("getGoldBoxes", undefined, {
        cache: "force-cache",
        next: {
          tags: ["boxes", "boxes-gold"],
        },
        signal: AbortSignal.timeout(30000),
      });

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
