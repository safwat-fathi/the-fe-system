import { ToWords } from "to-words";
import { toArabicWord } from "number-to-arabic-words/dist/index-node.js";

export function formatAmount(
  value: number | string | null | undefined,
  fraction: number = 2,
): string {
  const num = Number(value);

  if (isNaN(num)) return "0";

  return num.toLocaleString("en-US", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  });
}

/* ----------------------------------
 * Currency Config
 * ---------------------------------- */

type Currency = "SAR";

const currencyConfig = {
  SAR: {
    en: {
      major: { singular: "Saudi Riyal", plural: "Saudi Riyals" },
      minor: { singular: "Halala", plural: "Halalas" },
      symbol: "SAR",
    },
    ar: {
      major: "ريال سعودي",
      minor: "هللة",
    },
  },
} as const;

/* ----------------------------------
 * English Converter (to-words)
 * ---------------------------------- */

function amountToEnglishWords(amount: number, currency: Currency) {
  const config = currencyConfig[currency].en;

  const toWords = new ToWords({
    localeCode: "en-US",
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      currencyOptions: {
        name: config.major.singular,
        plural: config.major.plural,
        symbol: config.symbol,
        fractionalUnit: {
          name: config.minor.singular,
          plural: config.minor.plural,
          symbol: config.minor.singular,
        },
      },
    },
  });

  return toWords.convert(amount);
}

/* ----------------------------------
 * Arabic Converter (tafqeet-style)
 * ---------------------------------- */

function amountToArabicWords(amount: number, currency: Currency) {
  const config = currencyConfig[currency].ar;

  const [integerPart, decimalPart] = amount.toFixed(2).split(".").map(Number);

  const integerWords = toArabicWord(integerPart);

  if (decimalPart === 0) {
    return `${integerWords} ${config.major}`;
  }

  const decimalWords = toArabicWord(decimalPart);

  return `${integerWords} ${config.major} و ${decimalWords} ${config.minor}`;
}

/* ----------------------------------
 * Public API
 * ---------------------------------- */

type AmountToWordsOptions = {
  language: "en" | "ar";
  currency?: Currency;
};

export function amountToWords(amount: number, options: AmountToWordsOptions) {
  const { language, currency = "SAR" } = options;

  if (language === "en") {
    return amountToEnglishWords(amount, currency);
  }

  return amountToArabicWords(amount, currency);
}
