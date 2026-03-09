import { API_ENDPOINTS } from "@/constants";

// Conversion factor from troy ounces to grams
// 1 troy ounce = 31.1035 grams (standard unit in precious metals trading)
const TROY_OUNCE_TO_GRAM = 31.1035;

// Used when API returns one currency to derive the other (e.g. goldprice.org returns SAR)
const USD_TO_SAR_RATE = 3.75;

export type GoldPrices = {
  pricePerGram: number | null;
  pricePerOunceUSD: number | null;
  pricePerOunceSAR: number | null;
  changeOunceUSD: number | null;
  changeOunceSAR: number | null;
  changePercent: number | null;
};

class GoldPriceService {
  /**
   * Returns gold price per gram (same as before, in SAR when API returns SAR).
   */
  async getCurrentGoldPrice(): Promise<number | null> {
    const prices = await this.getGoldPrices();

    return prices.pricePerGram;
  }

  /**
   * Returns gram price plus ounce price in USD and SAR for dashboard.
   * If the configured API returns SAR (e.g. dbXRates/SAR), ounce SAR is from API and USD is derived.
   */
  async getGoldPrices(): Promise<GoldPrices> {
    try {
      if (!API_ENDPOINTS.GOLD_PRICE) {
        console.warn("⚠️ Gold price API endpoint not configured");

        return {
          pricePerGram: null,
          pricePerOunceUSD: null,
          pricePerOunceSAR: null,
          changeOunceUSD: null,
          changeOunceSAR: null,
          changePercent: null,
        };
      }

      const response = await fetch(API_ENDPOINTS.GOLD_PRICE, {
        method: "GET",
        next: { revalidate: 3600, tags: ["gold-price"] },
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      const data = await response.json();
      const pricePerOunceFromApi = data?.items?.[0]?.xauPrice;

      if (!pricePerOunceFromApi) {
        return {
          pricePerGram: null,
          pricePerOunceUSD: null,
          pricePerOunceSAR: null,
          changeOunceUSD: null,
          changeOunceSAR: null,
          changePercent: null,
        };
      }

      const item = data?.items?.[0];
      const chgXau = item?.chgXau != null ? Number(item.chgXau) : null;
      const pcXau = item?.pcXau != null ? Number(item.pcXau) : null;

      // Assume API returns price in SAR (e.g. goldprice.org/dbXRates/SAR)
      const pricePerOunceSAR = parseFloat(
        Number(pricePerOunceFromApi).toFixed(2),
      );
      const pricePerOunceUSD = parseFloat(
        (pricePerOunceSAR / USD_TO_SAR_RATE).toFixed(2),
      );
      const pricePerGram = parseFloat(
        (pricePerOunceSAR / TROY_OUNCE_TO_GRAM).toFixed(2),
      );
      const changeOunceSAR =
        chgXau != null ? parseFloat(chgXau.toFixed(2)) : null;
      const changeOunceUSD =
        chgXau != null
          ? parseFloat((chgXau / USD_TO_SAR_RATE).toFixed(2))
          : null;
      const changePercent =
        pcXau != null ? parseFloat(pcXau.toFixed(2)) : null;

      return {
        pricePerGram,
        pricePerOunceUSD,
        pricePerOunceSAR,
        changeOunceUSD,
        changeOunceSAR,
        changePercent,
      };
    } catch (error) {
      console.error("❌ فشل جلب سعر الذهب:", error);

      return {
        pricePerGram: null,
        pricePerOunceUSD: null,
        pricePerOunceSAR: null,
        changeOunceUSD: null,
        changeOunceSAR: null,
        changePercent: null,
      };
    }
  }
}

export default new GoldPriceService();
