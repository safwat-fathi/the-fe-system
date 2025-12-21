"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CreditCardIcon } from "@heroicons/react/24/outline";

import { RiyalIcon } from "@/components/RiyalIcon";
import { PaymentTypes } from "@/types/models/invoice";

interface InvoiceTotalsDisplayProps {
  totalAmount: number;
  totalDiscount: number;
  totalGWeight: number;
  totalValueTax: number;
  totalWagesTax: number;
  taxAmount: number;
  netAmount: number;
  fractions: { frac: number; frac2: number };
  paymentMethod: PaymentTypes;
  isNewInvoice: boolean;
  invoiceNumber: string;
  customerName: string;
  invoiceId: string;
}

export default function InvoiceTotalsDisplay({
  totalAmount,
  totalDiscount,
  totalGWeight,
  totalValueTax,
  totalWagesTax,
  taxAmount,
  netAmount,
  fractions,
  paymentMethod,
  isNewInvoice,
  invoiceNumber,
  customerName,
  invoiceId,
}: InvoiceTotalsDisplayProps) {
  const t = useTranslations("forms.invoices.totals");

  // Build payment URL with all required params
  const paymentUrl = `/forms/invoices/payment?total=${netAmount}&inv_number=${encodeURIComponent(invoiceNumber)}&customer=${encodeURIComponent(customerName)}&inv=${encodeURIComponent(invoiceId)}`;

  return (
    <>
      <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200 print:border-0 print:mt-2">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">{t("total")}:</span>
            <span className="font-semibold text-blue-800 flex items-center gap-1">
              {Number(totalAmount).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">
              {t("totalDiscount")}:
            </span>
            <span className="font-semibold text-red-800 flex items-center gap-1">
              {Number(totalDiscount).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">
              {t("totalGWeight")}:
            </span>
            <span className="font-semibold text-amber-800 flex items-center gap-1">
              {Number(totalGWeight).toFixed(fractions.frac2)}
              <span className="text-xs text-amber-800">{t("gramUnit")}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">{t("valueTax")}:</span>
            <span className="font-semibold text-green-800 flex items-center gap-1">
              {Number(totalValueTax).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">{t("wagesTax")}:</span>
            <span className="font-semibold text-green-800 flex items-center gap-1">
              {Number(totalWagesTax).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">{t("tax")}:</span>
            <span className="font-semibold text-green-800 flex items-center gap-1">
              {Number(taxAmount).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-800 font-semibold">
              {t("netAmount")}:
            </span>
            <span className="font-bold text-blue-900 flex items-center gap-1">
              {Number(netAmount).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>
        </div>
      </div>

      {isNewInvoice && paymentMethod === PaymentTypes.CASH && (
        <div className="mt-3 flex justify-start">
          <Link
            className="h-8 px-4 text-sm bg-purple-600 text-white hover:bg-purple-700 border border-purple-600 rounded-md shadow-sm inline-flex items-center gap-2 transition-colors"
            href={paymentUrl}
            prefetch
          >
            <CreditCardIcon className="w-4 h-4" />
            {t("payment")}
          </Link>
        </div>
      )}
    </>
  );
}
