import { HttpService } from "@/services/base";

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
      throw new Error("حدث خطأ أثناء جلب بيانات العملات");
    }
  }

  async createCurrency(
    currency: Omit<Currency, "id">,
  ): Promise<Currency | null> {
    try {
      const response = await this.post<Currency>(
        "api_create_currency",
        currency,
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
      throw new Error("حدث خطأ أثناء إنشاء العملة");
    }
  }

  async updateCurrency(
    id: number,
    currency: Partial<Currency>,
  ): Promise<Currency | null> {
    try {
      const response = await this.put<Currency>(
        `api_update_currency/${id}`,
        currency,
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
