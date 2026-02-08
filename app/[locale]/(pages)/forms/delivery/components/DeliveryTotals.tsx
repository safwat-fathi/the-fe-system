import { useTranslations } from "use-intl";

import { DeliveryTotalsKeys } from "../constants";

import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";

type TotalsType = {
  totalGoldWeight: number;
  totalGoldGWeight: number;
  totalWork: number;
  totalBoxes: number;
};

type TotalsTranslationKey =
  | "totalGoldStanding"
  | "totalGoldCalibrated"
  | "totalWages"
  | "totalCash"
  | "unit";

const TOTALS_TRANSLATION_MAP: Record<keyof TotalsType, TotalsTranslationKey> = {
  totalGoldWeight: "totalGoldStanding",
  totalGoldGWeight: "totalGoldCalibrated",
  totalWork: "totalWages",
  totalBoxes: "totalCash",
};

const DeliveryTotals = ({ totals }: { totals: TotalsType }) => {
  const t = useTranslations("forms.customerGoldVoucher.totals");

  return (
    <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-200 mt-1.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {DeliveryTotalsKeys.map(({ key, icon }) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">
            {t(TOTALS_TRANSLATION_MAP[key as keyof TotalsType])}:
          </span>
          <span className="font-semibold text-yellow-600">
            {icon === "riyal"
              ? formatAmount(totals[key as keyof TotalsType])
              : totals[key as keyof TotalsType].toFixed(5)}{" "}
            {icon === "riyal" ? <RiyalIcon /> : t("unit")}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DeliveryTotals;
