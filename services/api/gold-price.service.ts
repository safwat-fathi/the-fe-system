import { API_ENDPOINTS } from "@/constants";

// Conversion factor from troy ounces to grams
// 1 troy ounce = 31.1035 grams (standard unit in precious metals trading)
const TROY_OUNCE_TO_GRAM = 31.1035;

// Used when API returns one currency to derive the other (e.g. goldprice.org returns SAR or USD)
const USD_TO_SAR_RATE = 3.75;

export type GoldPrices = {
  pricePerGram: number | null;
  pricePerOunceUSD: number | null;
  pricePerOunceSAR: number | null;
  changeOunceUSD: number | null;
  changeOunceSAR: number | null;
  changePercent: number | null;
};

const EMPTY_GOLD_PRICES: GoldPrices = {
  pricePerGram: null,
  pricePerOunceUSD: null,
  pricePerOunceSAR: null,
  changeOunceUSD: null,
  changeOunceSAR: null,
  changePercent: null,
};

/** Parses goldprice.org-style response (items[0].xauPrice, chgXau, pcXau). inUSD: true when price is in USD (e.g. dbXRates/USD). */
function parseGoldPriceResponse(
  data: unknown,
  inUSD: boolean,
): GoldPrices | null {
  const pricePerOunceFromApi = (data as { items?: { xauPrice?: number; chgXau?: number; pcXau?: number }[] })?.items?.[0]?.xauPrice;

  if (pricePerOunceFromApi == null || Number.isNaN(Number(pricePerOunceFromApi))) {
    return null;
  }

  const item = (data as { items?: { chgXau?: number; pcXau?: number }[] })?.items?.[0];
  const chgXau = item?.chgXau != null ? Number(item.chgXau) : null;
  const pcXau = item?.pcXau != null ? Number(item.pcXau) : null;

  const num = Number(pricePerOunceFromApi);
  const pricePerOunceUSD = inUSD
    ? parseFloat(num.toFixed(2))
    : parseFloat((num / USD_TO_SAR_RATE).toFixed(2));
  const pricePerOunceSAR = inUSD
    ? parseFloat((num * USD_TO_SAR_RATE).toFixed(2))
    : parseFloat(num.toFixed(2));
  const pricePerGram = parseFloat(
    (pricePerOunceSAR / TROY_OUNCE_TO_GRAM).toFixed(2),
  );
  const changeOunceSAR =
    chgXau != null
      ? parseFloat(
          (inUSD ? chgXau * USD_TO_SAR_RATE : chgXau).toFixed(2),
        )
      : null;
  const changeOunceUSD =
    chgXau != null
      ? parseFloat(
          (inUSD ? chgXau : chgXau / USD_TO_SAR_RATE).toFixed(2),
        )
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
}

const FETCH_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

/** Fetches URL and returns parsed GoldPrices or null. Does not throw. */
async function fetchAndParse(
  url: string,
  inUSD: boolean,
): Promise<GoldPrices | null> {
  const response = await fetch(url, {
    method: "GET",
    headers: FETCH_HEADERS,
    next: { revalidate: 3600, tags: ["gold-price"] },
  });

  if (!response.ok) {
    return null;
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    return null;
  }

  return parseGoldPriceResponse(data, inUSD);
}

/** Goldprice.today API: { USD: { ounce, gram }, SAR: { ounce, gram } }. No change data. */
const GOLDPRICE_TODAY_URL = "https://goldprice.today/api.php?data=live";

function parseGoldPriceToday(data: unknown): GoldPrices | null {
  const o = data as {
    USD?: { ounce?: string; gram?: string };
    SAR?: { ounce?: string; gram?: string };
  };
  const usd = o?.USD;
  const sar = o?.SAR;
  const ounceUSD = usd?.ounce != null ? parseFloat(usd.ounce) : NaN;
  const ounceSAR = sar?.ounce != null ? parseFloat(sar.ounce) : NaN;
  const gramSAR = sar?.gram != null ? parseFloat(sar.gram) : NaN;

  if (
    !Number.isFinite(ounceUSD) ||
    !Number.isFinite(ounceSAR) ||
    !Number.isFinite(gramSAR)
  ) {
    return null;
  }

  return {
    pricePerGram: parseFloat(gramSAR.toFixed(2)),
    pricePerOunceUSD: parseFloat(ounceUSD.toFixed(2)),
    pricePerOunceSAR: parseFloat(ounceSAR.toFixed(2)),
    changeOunceUSD: null,
    changeOunceSAR: null,
    changePercent: null,
  };
}

async function fetchGoldPriceToday(): Promise<GoldPrices | null> {
  try {
    const response = await fetch(GOLDPRICE_TODAY_URL, {
      method: "GET",
      headers: FETCH_HEADERS,
      next: { revalidate: 3600, tags: ["gold-price"] },
    });

    if (!response.ok) return null;
    const data = await response.json();

    return parseGoldPriceToday(data);
  } catch {
    return null;
  }
}

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
   * Tries primary endpoint (e.g. dbXRates/SAR); on failure uses fallback (e.g. dbXRates/USD).
   */
  async getGoldPrices(): Promise<GoldPrices> {
    // Try primary
    if (API_ENDPOINTS.GOLD_PRICE) {
      const primary = await fetchAndParse(
        API_ENDPOINTS.GOLD_PRICE,
        false, // primary is assumed SAR (e.g. dbXRates/SAR)
      );

      if (primary) {
        return primary;
      }
      console.warn(
        "⚠️ Failed to fetch gold price from primary source. Trying fallback.",
      );
    } else {
      console.warn("⚠️ Gold price API endpoint not configured");
    }

    // Try fallback (e.g. goldprice.org dbXRates/USD)
    const fallbackUrl = API_ENDPOINTS.GOLD_PRICE_FALLBACK;

    if (fallbackUrl) {
      const fallback = await fetchAndParse(
        fallbackUrl,
        API_ENDPOINTS.GOLD_PRICE_FALLBACK_IN_USD,
      );

      if (fallback) {
        return fallback;
      }
      console.warn(
        "⚠️ Failed to fetch gold price from fallback source. Trying built-in provider.",
      );
    }

    // Built-in third source: goldprice.today (no API key, returns SAR + USD)
    const fromToday = await fetchGoldPriceToday();

    if (fromToday) {
      return fromToday;
    }
    console.warn(
      "⚠️ All gold price sources failed. Dashboard will show data without gold price.",
    );

    return EMPTY_GOLD_PRICES;
  }
}

export default new GoldPriceService();
