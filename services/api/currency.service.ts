import { HttpService } from "@/services/base";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

interface Currency {
  id: number;
  cur_name: string;
  cur_name_e: string;
  cur_part: string;
  cur_part_e: string;
  cur_sign: string;
  cur_price: string;
  cur_tag: string;
  cr_date: string;
  cur_status: boolean;
}

class CurrencyService extends HttpService<Currency> {
  constructor() {
    super("");
  }

  async getAllCurrencies(): Promise<Currency[]> {
    try {
      const response = await this.get<Currency[]>(
        "currencies_list",
        undefined,
        {
          cache: "no-store",
          next: { tags: ["currencies"] },
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
      console.error("Error fetching currencies:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب بيانات العملات");
    }
  }

  async createCurrency(
    currency: Omit<Currency, "id">,
  ): Promise<Currency | null> {
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

      // التحقق من أن cur_price موجود وليس فارغ
      if (!currency.cur_price || currency.cur_price.trim() === "") {
        throw new Error("السعر مطلوب");
      }

      // تقييد cur_tag لحرف واحد فقط (أول حرف من الكود أو الرمز)
      const curTag = currency.cur_tag
        ? currency.cur_tag.length > 1
          ? currency.cur_tag.charAt(0).toUpperCase()
          : currency.cur_tag.toUpperCase()
        : currency.cur_sign?.charAt(0)?.toUpperCase() || "";

      // تقييد cur_price إلى منزلتين عشريتين فقط
      const curPrice = parseFloat(currency.cur_price);
      const formattedPrice = isNaN(curPrice)
        ? currency.cur_price
        : curPrice.toFixed(2);

      const currencyData = {
        ...currency,
        com: companyId, // إضافة حقل com المطلوب
        cur_tag: curTag, // تقييد لحرف واحد فقط
        cur_price: formattedPrice, // تقييد إلى منزلتين عشريتين
      };

      const response = await this.post<Currency>(
        "api_create_currency",
        currencyData,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as Currency;
      }

      return null;
    } catch (error) {
      console.error("Error creating currency:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء إنشاء العملة");
    }
  }

  async updateCurrency(
    id: number,
    currency: Partial<Currency>,
  ): Promise<Currency | null> {
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

      // تقييد cur_price إلى منزلتين عشريتين فقط (إن وجد)
      let formattedPrice: string | undefined = undefined;

      if (currency.cur_price) {
        const curPrice = parseFloat(String(currency.cur_price));

        formattedPrice = isNaN(curPrice)
          ? String(currency.cur_price)
          : curPrice.toFixed(2);
      }

      // تقييد cur_tag لحرف واحد فقط إذا كان موجوداً
      const currencyData: any = {
        ...currency,
        com: companyId, // إضافة حقل com المطلوب
      };

      if (currency.cur_tag) {
        currencyData.cur_tag =
          currency.cur_tag.length > 1
            ? currency.cur_tag.charAt(0).toUpperCase()
            : currency.cur_tag.toUpperCase();
      }

      // تحديث cur_price إذا كان موجوداً
      if (formattedPrice !== undefined) {
        currencyData.cur_price = formattedPrice;
      }

      const response = await this.put<Currency>(
        `api_update_currency/${id}`,
        currencyData,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as Currency;
      }

      return null;
    } catch (error) {
      console.error("Error updating currency:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء تحديث العملة");
    }
  }

  async deleteCurrency(id: number): Promise<boolean> {
    try {
      const response = await this.delete(
        `api_delete_currency/${id}`,
        undefined,
        {
          cache: "no-store",
        },
      );

      return response.success;
    } catch (error) {
      console.error("Error deleting currency:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء حذف العملة");
    }
  }

  async getCurrencyById(id: number): Promise<Currency | null> {
    try {
      const currencies = await this.getAllCurrencies();

      return currencies.find((currency) => currency.id === id) || null;
    } catch (error) {
      console.error("Error fetching currency by ID:", error);

      return null;
    }
  }
}

export default new CurrencyService();
