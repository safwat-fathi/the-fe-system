import { useEffect, useState } from "react";
import { fetchFractions } from "./api";

export interface Fractions {
  frac: number;
  frac2: number;
}

export default function useFractions(
  fieldName?: string,
): Fractions | number {
  const [digits, setDigits] = useState<Fractions>({ frac: 2, frac2: 3 });

  useEffect(() => {
    fetchFractions().then((res) => {
      if (res) setDigits(res);
    });
  }, []);

  if (!fieldName) return digits;

  const mapping: Record<string, keyof Fractions> = {
    qty: "frac2",
    weight: "frac2",
    g_weight: "frac2",
    price: "frac",
    price_w: "frac",
    total: "frac",
    total_a: "frac",
    total_w: "frac",
    item_disc_amt: "frac",
    tax: "frac",
  };

  const key = mapping[fieldName] ?? "frac";
  return digits[key];
}
