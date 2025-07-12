import { useEffect, useState } from "react";
import { fetchFractions } from "@/utilities/api";

export interface Fractions {
  frac: number;
  frac2: number;
}

export default function useFractions(fieldName?: string): Fractions | number {
  const [digits, setDigits] = useState<Fractions>({ frac: 2, frac2: 3 });

  useEffect(() => {
    fetchFractions().then((res) => {
      if (res) setDigits(res);
    });
  }, []);

  if (!fieldName) return digits;

  if (fieldName === "qty") return 0;

  const mapping: Record<string, number> = {
    weight: digits.frac,
    g_weight: digits.frac2,
    price: digits.frac,
    price_w: digits.frac,
    total_a: digits.frac,
    total_w: digits.frac,
    total: digits.frac,
    tax: digits.frac,
    item_disc_amt: digits.frac,
    item_disc_prc: digits.frac,
  };

  return mapping[fieldName] ?? digits.frac ?? 2;
}
