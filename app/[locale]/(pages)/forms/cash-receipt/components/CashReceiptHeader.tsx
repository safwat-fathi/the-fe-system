import type { Voucher } from "@/types/voucher";

import {
  CheckIcon,
  DocumentTextIcon,
  PencilIcon,
  PlusIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

import NavigationBar from "./NavigationBar";
import CashReceiptSearch from "./CashReceiptSearch";

const CashReceiptHeader = ({
  voucher,
  textAlign,
  isEditing,
  isLoading,
  saveVoucher,
  formMode,
  setVoucher,
  isPrinting,
  printVoucher,
  setIsGLModalOpen,
  navigationInfo,
  vouchType,
}: {
  voucher: Voucher;
  textAlign: string;
  isEditing: boolean;
  isLoading: boolean;
  saveVoucher: () => void;
  formMode: "new" | "edit" | "preview";
  setVoucher: Dispatch<SetStateAction<Voucher>>;
  isPrinting: boolean;
  printVoucher: () => void;
  setIsGLModalOpen: Dispatch<SetStateAction<boolean>>;
  navigationInfo: {
    next: number | null;
    previous: number | null;
    last: number | null;
    first: number | null;
    vouchersCount: number | null;
  };
  vouchType: number;
}) => {
  const t = useTranslations("forms.cashReceipt");
  const router = useRouter();

  const handleEditClick = () => {
    setVoucher((prev: Voucher) => ({
      ...prev,
      commit: false,
    }));

    const basePath = "/forms/cash-receipt";
    const vouchIdToUse = voucher.vouch_id;

    if (vouchIdToUse && Number(vouchIdToUse) > 0) {
      router.push(`${basePath}/${vouchIdToUse}?mode=edit`);
    }
  };

  const handleNewClick = () => {
    setVoucher((prev: Voucher) => ({
      ...prev,
      commit: false,
    }));

    const basePath = "/forms/cash-receipt";

    router.push(basePath);
  };

  const voucherNumber = voucher.vouch_id ? String(voucher.vouch_id) : "";

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-1.5 mb-1 border border-slate-200 flex items-center justify-between gap-1.5 flex-wrap">
      <div className="flex items-center gap-1.5 flex-wrap">
        <h1
          className={`text-lg font-bold text-slate-800 flex items-center gap-1.5 ${textAlign}`}
        >
          <span>{t("title")}</span>
          <span className="text-slate-600 font-medium">
            #
            {voucher.vouch_id && Number(voucher.vouch_id) > 0
              ? voucher.vouch_id
              : t("status.numbering")}
          </span>
        </h1>
        <div className="h-6 w-px bg-slate-300" />
        <Button
          className="h-7 px-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm"
          isDisabled={!isEditing}
          isLoading={isLoading}
          startContent={
            !isLoading ? <CheckIcon className="w-4 h-4" /> : undefined
          }
          variant="solid"
          onPress={saveVoucher}
        >
          {t("actions.save")}
        </Button>
        <Button
          className="h-7 px-1.5 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
          isDisabled={formMode === "new" || isEditing || isLoading}
          startContent={<PencilIcon className="w-4 h-4 text-slate-500" />}
          variant="solid"
          onPress={handleEditClick}
        >
          {t("actions.edit")}
        </Button>
        <Button
          className="h-7 px-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
          startContent={<PlusIcon className="w-4 h-4" />}
          variant="solid"
          onPress={handleNewClick}
        >
          {t("actions.new")}
        </Button>

        <Button
          className="h-7 px-1.5 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
          isDisabled={!voucher.vouch_id || Number(voucher.vouch_id) <= 0}
          isLoading={isPrinting}
          startContent={
            !isPrinting ? <PrinterIcon className="w-4 h-4" /> : undefined
          }
          variant="solid"
          onPress={printVoucher}
        >
          {t("actions.print")}
        </Button>

        <Button
          className="h-7 px-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
          isDisabled={!voucher.id || Number(voucher.id) <= 0 || !voucher.commit}
          startContent={<DocumentTextIcon className="w-4 h-4" />}
          variant="solid"
          onPress={() => setIsGLModalOpen(true)}
        >
          {t("actions.viewGLTransactions")}
        </Button>
        <NavigationBar
          voucherNumber={voucherNumber}
          textAlign={textAlign}
          navigationInfo={navigationInfo}
        />
      </div>
      <CashReceiptSearch vouchType={vouchType} />
    </div>
  );
};

export default CashReceiptHeader;
