import { memo } from "react";
import { useTranslations } from "next-intl";

interface UnbalancedModalMessageProps {
  totals: {
    totalDebit: number;
    totalCredit: number;
    totalDebitG: number;
    totalCreditG: number;
  };
  textAlign: string;
  t: ReturnType<typeof useTranslations>;
}

const UnbalancedModalMessage = memo(
  ({ totals, textAlign, t }: UnbalancedModalMessageProps) => (
    <div className={`space-y-2 ${textAlign}`}>
      <p className={`text-gray-700 ${textAlign}`}>
        {t("modals.unbalancedMessage")}
      </p>
      <div className={`bg-gray-50 p-3 rounded-lg space-y-1 ${textAlign}`}>
        <p className={`font-semibold text-gray-800 ${textAlign}`}>
          {t("modals.unbalancedDetails.totalDebit", {
            value: totals.totalDebit.toFixed(2),
          })}
        </p>
        <p className={`font-semibold text-gray-800 ${textAlign}`}>
          {t("modals.unbalancedDetails.totalCredit", {
            value: totals.totalCredit.toFixed(2),
          })}
        </p>
        <p className={`font-semibold text-gray-800 ${textAlign}`}>
          {t("modals.unbalancedDetails.totalGoldDebit", {
            value: totals.totalDebitG.toFixed(6),
          })}
        </p>
        <p className={`font-semibold text-gray-800 ${textAlign}`}>
          {t("modals.unbalancedDetails.totalGoldCredit", {
            value: totals.totalCreditG.toFixed(6),
          })}
        </p>
      </div>
      <p className={`mt-3 text-gray-600 text-sm ${textAlign}`}>
        {t("modals.unbalancedQuestion")}
      </p>
    </div>
  ),
);

UnbalancedModalMessage.displayName = "UnbalancedModalMessage";

export default UnbalancedModalMessage;
