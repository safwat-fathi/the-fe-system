// خدمة لجلب أسعار صرف العملات من API خارجي
// استخدام exchangerate-api.com (API مجاني بدون مفتاح للاستخدام الأساسي)

interface ExchangeRateResponse {
  result?: string;
  conversion_rates?: Record<string, number>;
  rates?: Record<string, number>;
  base_code?: string;
  time_last_update_utc?: string;
}

class CurrencyExchangeService {
  /**
   * جلب سعر صرف العملة مقابل الريال السعودي (SAR)
   * @param currencyCode كود العملة (مثل USD, EUR)
   * @returns سعر الصرف أو null في حالة الخطأ
   */
  async getExchangeRateToSAR(currencyCode: string): Promise<number | null> {
    try {
      // إذا كانت العملة هي الريال السعودي، السعر = 1
      if (currencyCode.toUpperCase() === "SAR") {
        return 1;
      }

      // استخدام exchangerate-api.com v4 (API مجاني بدون مفتاح)
      // يعرض: كم وحدة من العملة المطلوبة = 1 وحدة من العملة الأساسية (SAR)
      // على سبيل المثال: 1 SAR = 0.266667 USD يعني 1 SAR = 0.266667 USD
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/SAR`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        console.warn(
          `⚠️ فشل جلب سعر الصرف للعملة ${currencyCode}:`,
          response.status,
        );
        return null;
      }

      const data = await response.json();

      // في exchangerate-api.com v4، البيانات تأتي بصيغة { rates: { USD: 0.266667, ... } }
      const rate = data?.rates?.[currencyCode.toUpperCase()];

      if (rate && typeof rate === "number" && rate > 0) {
        // السعر يعرض: 1 SAR = rate من العملة المطلوبة
        // نحتاج: 1 وحدة من العملة المطلوبة = ? SAR
        // لذلك نعكس السعر: 1 / rate
        return parseFloat((1 / rate).toFixed(6));
      }

      return null;
    } catch (error) {
      console.error(
        `❌ خطأ في جلب سعر الصرف للعملة ${currencyCode}:`,
        error,
      );
      return null;
    }
  }

  /**
   * جلب سعر صرف العملة من عملة معينة إلى أخرى
   * @param fromCurrency العملة المصدر (مثل USD)
   * @param toCurrency العملة المستهدفة (مثل SAR)
   * @returns سعر الصرف أو null
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string = "SAR",
  ): Promise<number | null> {
    try {
      if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
        return 1;
      }

      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency.toUpperCase()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const rate = data?.rates?.[toCurrency.toUpperCase()];

      if (rate && typeof rate === "number" && rate > 0) {
        return parseFloat(rate.toFixed(6));
      }

      return null;
    } catch (error) {
      console.error("❌ خطأ في جلب سعر الصرف:", error);
      return null;
    }
  }
}

export default new CurrencyExchangeService();

