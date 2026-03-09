"use client";

import { useTranslations } from "next-intl";

import { useVoucherSearch } from "../hooks/useVoucherSearch";

const CashReceiptSearch = ({ vouchType }: { vouchType: number }) => {
  const { searchTerm, setSearchTerm, handleSearch } =
    useVoucherSearch(vouchType);
  const t = useTranslations("forms.cashReceipt");

  return (
    <div className="flex items-center gap-2">
      {/* خط فاصل قبل البحث */}
      <div className="h-6 w-px bg-slate-300" />

      {/* البحث - ثابت في الطرف */}
      <div className="flex items-center gap-1">
        <input
          className="w-32 h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
          placeholder={t("actions.search")}
          type="number"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <button
          className="h-7 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
          onClick={handleSearch}
        >
          <i className="bi bi-search w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CashReceiptSearch;
