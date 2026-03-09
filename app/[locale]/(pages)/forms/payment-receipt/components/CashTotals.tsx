import { useTranslations } from "next-intl";

import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";

const CashTotals = ({
  totals,
  balance,
  isBalanced,
  textAlign,
}: {
  totals: {
    totalBoxes: number;
    totalDetails: number;
  };
  balance: number;
  isBalanced: boolean;
  textAlign: string;
}) => {
  const t = useTranslations("forms.cashReceiptVoucher");

  return (
    <div className="mt-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className={`flex items-center gap-2 ${textAlign}`}>
          <span className={`text-gray-700 font-medium ${textAlign}`}>
            {t("totals.totalCash")}:
          </span>
          <span
            className={`font-semibold text-blue-700 flex items-center gap-1 ${textAlign}`}
          >
            {formatAmount(totals.totalBoxes)}
            <RiyalIcon color="currentColor" />
          </span>
        </div>

        <div className={`flex items-center gap-2 ${textAlign}`}>
          <span className={`text-gray-700 font-medium ${textAlign}`}>
            {t("totals.totalDetails")}:
          </span>
          <span
            className={`font-semibold text-green-700 flex items-center gap-1 ${textAlign}`}
          >
            {formatAmount(totals.totalDetails)}
            <RiyalIcon color="currentColor" />
          </span>
        </div>

        {!isBalanced && (
          <div className={`flex items-center gap-2 ${textAlign}`}>
            <span className={`text-gray-700 font-medium ${textAlign}`}>
              {t("totals.difference")}:
            </span>
            <span
              className={`font-semibold text-red-700 flex items-center gap-1 ${textAlign}`}
            >
              {formatAmount(Math.abs(balance))}
              <RiyalIcon color="currentColor" />
              <span className="text-xs text-red-600">
                ({balance > 0 ? t("totals.debit") : t("totals.credit")})
              </span>
            </span>
          </div>
        )}

        <div className={`flex items-center gap-2 ${textAlign}`}>
          <span className={`text-gray-700 font-medium ${textAlign}`}>
            {t("totals.status")}:
          </span>
          <span
            className={`font-semibold ${
              isBalanced ? "text-green-700" : "text-red-700"
            }`}
          >
            {isBalanced ? t("status.balanced") : t("status.unbalanced")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CashTotals;
