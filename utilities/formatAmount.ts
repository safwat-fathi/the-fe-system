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

export function amountToArabic(amount: number) {
  const [integerPart, decimalPart] = amount.toFixed(2).split(".").map(Number);

  const integerWords = toArabicWord(integerPart);

  if (decimalPart === 0) {
    return integerWords;
  }

  const decimalWords = toArabicWord(decimalPart);

  return `${integerWords} فاصل ${decimalWords} هللة`;
}
