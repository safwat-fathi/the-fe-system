import { useEffect, useState } from "react";

import homeService from "@/services/api/home.service";

export interface Fractions {
  frac: number;
  frac2: number;
}

const DEFAULT_FRACTIONS: Fractions = { frac: 2, frac2: 3 };

let cachedFractions: Fractions | null = null;
let pendingFractionsPromise: Promise<Fractions> | null = null;

const fetchFractionsOnce = async (): Promise<Fractions> => {
  if (cachedFractions) {
    return cachedFractions;
  }

  if (!pendingFractionsPromise) {
    pendingFractionsPromise = homeService
      .getFractions()
      .then((result) => {
        if (result) {
          cachedFractions = result;
        } else {
          cachedFractions = DEFAULT_FRACTIONS;
        }

        return cachedFractions;
      })
      .catch((error) => {
        console.error("Error fetching fractions:", error);

        return cachedFractions ?? DEFAULT_FRACTIONS;
      })
      .finally(() => {
        pendingFractionsPromise = null;
      });
  }

  return pendingFractionsPromise;
};

export default function useFractions(fieldName?: string): Fractions | number {
  const [digits, setDigits] = useState<Fractions>(
    () => cachedFractions ?? DEFAULT_FRACTIONS,
  );

  useEffect(() => {
    let isMounted = true;

    fetchFractionsOnce()
      .then((fractions) => {
        if (isMounted) {
          setDigits(fractions);
        }
      })
      .catch(() => {
        // already logged inside fetchFractionsOnce
      });

    return () => {
      isMounted = false;
    };
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
