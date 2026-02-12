import type { VoucherTotals } from "@/utilities/voucher/balance";

import { useTranslations } from "next-intl";

import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";

const AdjustmentTotals = ({
  totals,
  textAlign,
}: {
  totals: VoucherTotals;
  textAlign: string;
}) => {
  const t = useTranslations("forms.adjustment");

  return (
    <div className="mt-1.5 bg-gray-50 rounded-lg p-1.5 border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className={`flex items-center gap-2 ${textAlign}`}>
        <span className={`text-gray-700 font-medium ${textAlign}`}>
          {t("totals.totalDebit")}:
        </span>
        <span
          className={`font-semibold text-emerald-700 flex items-center gap-1 ${textAlign}`}
        >
          {formatAmount(totals.totalDebit)}
          <RiyalIcon color="currentColor" />
        </span>
      </div>
      <div className={`flex items-center gap-2 ${textAlign}`}>
        <span className={`text-gray-700 font-medium ${textAlign}`}>
          {t("totals.totalCredit")}:
        </span>
        <span
          className={`font-semibold text-red-700 flex items-center gap-1 ${textAlign}`}
        >
          {formatAmount(totals.totalCredit)}
          <RiyalIcon color="currentColor" />
        </span>
      </div>

      <div className={`flex items-center gap-2 ${textAlign}`}>
        <span className={`text-amber-800 font-medium ${textAlign}`}>
          {t("totals.totalDebitCalibrated")}:
        </span>
        <span
          className={`font-semibold text-yellow-600 flex items-center gap-1 ${textAlign}`}
        >
          {formatAmount(totals.totalDebitG)}
          <span className="text-xs text-yellow-500">{t("totals.gram")}</span>
        </span>
      </div>
      <div className={`flex items-center gap-2 ${textAlign}`}>
        <span className={`text-amber-800 font-medium ${textAlign}`}>
          {t("totals.totalCreditCalibrated")}:
        </span>
        <span
          className={`font-semibold text-yellow-600 flex items-center gap-1 ${textAlign}`}
        >
          {formatAmount(totals.totalCreditG)}
          <span className="text-xs text-yellow-500">{t("totals.gram")}</span>
        </span>
      </div>
    </div>
  );
};

export default AdjustmentTotals;
