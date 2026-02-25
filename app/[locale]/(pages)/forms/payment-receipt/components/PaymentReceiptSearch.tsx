import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import useVoucherSearch from "../../cash-receipt/hooks/useVoucherSearch";

const PaymentReceiptSearch = ({ vouchType }: { vouchType: number }) => {
  const { searchTerm, setSearchTerm, handleSearch } =
    useVoucherSearch(vouchType);
  const t = useTranslations("forms.paymentReceipt");

  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-px bg-slate-300" />
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
          <MagnifyingGlassIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PaymentReceiptSearch;
