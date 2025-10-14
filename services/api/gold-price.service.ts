import { API_ENDPOINTS } from "@/constants";

// Conversion factor from troy ounces to grams
// 1 troy ounce = 31.1035 grams (standard unit in precious metals trading)
const TROY_OUNCE_TO_GRAM = 31.1035;

class GoldPriceService {
  async getCurrentGoldPrice(): Promise<number | null> {
    try {

      const response = await fetch(API_ENDPOINTS.GOLD_PRICE, {
      // Check if the gold price API endpoint is configured
      if (!API_ENDPOINTS.GOLD_PRICE) {
        console.warn("⚠️ Gold price API endpoint not configured");
        return null;
      }
        method: "GET",
        next: { revalidate: 3600, tags: ["gold-price"] },
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      const data = await response.json();
      const pricePerOunce = data?.items?.[0]?.xauPrice;

      if (!pricePerOunce) return null;

      const pricePerGram = pricePerOunce / TROY_OUNCE_TO_GRAM;
      return parseFloat(pricePerGram.toFixed(2));
    } catch (error) {
      console.error("❌ فشل جلب سعر الذهب:", error);
      return null;
    }
  }
}

export default new GoldPriceService();
