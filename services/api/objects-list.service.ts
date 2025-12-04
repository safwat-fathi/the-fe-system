import { HttpService } from "@/services/base";
import { MenuObject } from "@/types/models/menu";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

type SupportedLocale = "ar" | "en";

const normalizeLocale = (locale?: string): SupportedLocale => {
  if (locale?.toLowerCase().startsWith("en")) {
    return "en";
  }

  return "ar";
};

class ObjectsListService extends HttpService<MenuObject> {
  constructor() {
    super("");
  }

  async getObjects(locale?: string): Promise<MenuObject[]> {
    const language = normalizeLocale(locale);

    try {
      const response = await this.get<MenuObject[]>("objects_list", undefined, {
        headers: {
          "Accept-Language": language,
        },
        cache: "force-cache",
        next: { tags: ["objects-list", `objects-list-${language}`] },
      });

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      rethrowAuthenticationError(error);

      return [];
    }
  }
}

export default new ObjectsListService();
