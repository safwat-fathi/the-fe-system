import { memo } from "react";
import { useTranslations } from "next-intl";

import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";

interface TotalBalanceProps {
  totals: {
    totalDebit: number;
    totalCredit: number;
    totalDebitG: number;
    totalCreditG: number;
  };
  isCashBalanced: boolean;
  cashBalance: number;
  isGoldBalanced: boolean;
  goldBalance: number;
  textAlign: string;
}

const TotalBalance = memo(
  ({
    totals,
    isCashBalanced,
    cashBalance,
    isGoldBalanced,
    goldBalance,
    textAlign,
  }: TotalBalanceProps) => {
    const t = useTranslations("forms.balanceVoucher");

    return (
      <div className="mt-1.5 bg-gray-50 rounded-lg p-1.5 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
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

          {!isCashBalanced && (
            <div className={`flex items-center gap-2 ${textAlign}`}>
              <span className={`text-gray-700 font-medium ${textAlign}`}>
                {t("totals.cashDifference")}:
              </span>
              <span
                className={`font-semibold text-red-700 flex items-center gap-1 ${textAlign}`}
              >
                {formatAmount(Math.abs(cashBalance))}
                <span className="text-xs">
                  ({cashBalance > 0 ? t("totals.debit") : t("totals.credit")})
                </span>
                <RiyalIcon color="currentColor" />
              </span>
            </div>
          )}

          <div className={`flex items-center gap-2 ${textAlign}`}>
            <span className={`text-amber-800 font-medium ${textAlign}`}>
              {t("totals.totalDebitCalibrated")}:
            </span>
            <span
              className={`font-semibold text-yellow-600 flex items-center gap-1 ${textAlign}`}
            >
              {formatAmount(totals.totalDebitG)}
              <span className="text-xs text-yellow-500">
                {t("totals.gram")}
              </span>
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
              <span className="text-xs text-yellow-500">
                {t("totals.gram")}
              </span>
            </span>
          </div>

          {!isGoldBalanced && (
            <div className={`flex items-center gap-2 ${textAlign}`}>
              <span className={`text-amber-800 font-medium ${textAlign}`}>
                {t("totals.goldDifference")}:
              </span>
              <span
                className={`font-semibold text-red-700 flex items-center gap-1 ${textAlign}`}
              >
                {formatAmount(Math.abs(goldBalance))}
                <span className="text-xs">
                  ({goldBalance > 0 ? t("totals.debit") : t("totals.credit")})
                </span>
                <span className="text-xs text-yellow-500">
                  {t("totals.gram")}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

TotalBalance.displayName = "TotalBalance";

export default TotalBalance;
