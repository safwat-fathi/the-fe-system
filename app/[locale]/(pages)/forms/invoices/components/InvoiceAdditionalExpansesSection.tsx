import { RefObject, useState } from "react";
import { useTranslations } from "next-intl";

import AdditionalExpansesTable, {
  type AdditionalExpansesTableHandle,
} from "./AdditionalExpansesTable";

import { Account } from "@/types/models/account";

interface InvoiceAdditionalExpansesSectionProps {
  isEditing: boolean;
  accounts: Account[];
  additionalExpansesRef?: RefObject<AdditionalExpansesTableHandle | null>;
}

export default function InvoiceAdditionalExpansesSection({
  isEditing,
  accounts,
  additionalExpansesRef,
}: InvoiceAdditionalExpansesSectionProps) {
  const t = useTranslations("forms.invoices.selectors");
  const [isAdditionalExpansesOpen, setIsAdditionalExpansesOpen] =
    useState(false);

  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div
        role="button"
        className="flex items-center justify-between p-2 md:p-3 hover:bg-gray-50 transition-colors"
        onClick={() => setIsAdditionalExpansesOpen(!isAdditionalExpansesOpen)}
      >
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span>📍</span>
          <span>{t("additionalExpanses.title")}</span>
        </h3>
        <button
          className="pointer-events-none text-gray-600 hover:text-gray-800 transition-transform duration-200"
          style={{
            transform: isAdditionalExpansesOpen
              ? "rotate(180deg)"
              : "rotate(0deg)",
          }}
          tabIndex={-1}
        >
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isAdditionalExpansesOpen ? "1000px" : "0",
          opacity: isAdditionalExpansesOpen ? 1 : 0,
        }}
      >
        <div className="px-3 pb-3 md:px-4 md:pb-4 border-t border-gray-200">
          <AdditionalExpansesTable
            ref={additionalExpansesRef as any}
            accounts={accounts}
            isEditing={isEditing}
          />
        </div>
      </div>
    </section>
  );
}
