import { useEffect, useState } from "react";
import { fetchFractions } from "./api";

export interface Fractions {
  frac: number;
  frac2: number;
}

export default function useFractions() {
  const [digits, setDigits] = useState<Fractions>({ frac: 2, frac2: 3 });

  useEffect(() => {
    fetchFractions().then((res) => {
      if (res) setDigits(res);
    });
  }, []);

  return digits;
}
