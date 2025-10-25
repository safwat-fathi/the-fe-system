import { HttpService } from "@/services/base";
import type { RawTaxRate } from "@/types/models/tax";

const DEFAULT_TAX_RATES = [0, 5, 10, 15, 20];

class TaxRateService extends HttpService<RawTaxRate> {
  constructor() {
    super("");
  }

  async getTaxRates(): Promise<number[]> {
    try {
      const response = await this.get<RawTaxRate[]>("getTaxPrcList", undefined, {
        /*
         * Tax rates are public data; omit credentials to avoid CORS rejections when
         * this service is consumed from client components.
         */
        credentials: "omit",
        cache: "force-cache",
        next: { tags: ["tax-rates"] },
      });
			
      if (!response.success || !response.data) {
        return DEFAULT_TAX_RATES;
      }
			
      const records = Array.isArray(response.data)
        ? response.data
        : Array.isArray((response.data as any)?.results)
          ? (response.data as any).results
          : [];

      if (records.length === 0) {
        return DEFAULT_TAX_RATES;
      }

      const parsedRates = records
        .map((record) => {
          const rate = record.tax_prc ?? record.value;
          if (rate === null || rate === undefined) return null;

          const numericRate =
            typeof rate === "number" ? rate : parseFloat(String(rate));

          return Number.isFinite(numericRate) ? numericRate : null;
        })
        .filter((rate): rate is number => rate !== null)
        .map((rate) => Number(rate.toFixed(2))); // normalize decimals

      const uniqueSortedRates = Array.from(new Set(parsedRates))
        .filter((rate) => rate > 0)
        .sort((a, b) => a - b);

      return uniqueSortedRates.length > 0
        ? [0, ...uniqueSortedRates]
        : DEFAULT_TAX_RATES;
    } catch (error) {
      console.error("Error fetching tax rates:", error);
      return DEFAULT_TAX_RATES;
    }
  }
}

export default new TaxRateService();
