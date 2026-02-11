import {
  CheckIcon,
  DocumentTextIcon,
  PencilIcon,
  PlusIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";

import NavigationArrows, {
  type NavigationArrowsProps,
} from "./NavigationArrows";

const VoucherHeader = ({
  textAlign,
  title,
  vouch_id,
  isEditing,
  isLoading,
  saveVoucher,
  formMode,
  handleEditClick,
  handleCreateClick,
  isPrinting,
  printVoucher,
  DBId,
  voucher_commit,
  setIsGLModalOpen,
  navigationMetadata,
  voucherNumber,
  handleSearch,
  setSearchTerm,
  searchTerm,
}: {
  textAlign: string;
  title: string;
  vouch_id: number | string;
  isEditing: boolean;
  isLoading: boolean;
  saveVoucher: () => void;
  formMode: "new" | "edit" | "preview";
  handleEditClick: () => void;
  handleCreateClick: () => void;
  isPrinting: boolean;
  printVoucher: () => void;
  DBId: number | undefined;
  voucher_commit: boolean | undefined;
  setIsGLModalOpen: (open: boolean) => void;
  navigationMetadata: NavigationArrowsProps["navigationMetadata"];
  voucherNumber: string;
  handleSearch: () => void;
  setSearchTerm: (searchTerm: string) => void;
  searchTerm: string;
}) => {
  const t = useTranslations("forms.adjustment");

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-1.5 mb-1 border border-slate-200 flex items-center justify-between gap-1.5 flex-wrap">
      <div className="flex items-center gap-1.5 flex-wrap">
        <h1
          className={`text-lg font-bold text-slate-800 flex items-center gap-1.5 ${textAlign}`}
        >
          {title}
          <span className="text-slate-600 font-medium">
            #
            {vouch_id && Number(vouch_id) > 0 && isFinite(Number(vouch_id))
              ? vouch_id
              : t("status.numbering")}
          </span>
        </h1>
        <div className="h-6 w-px bg-slate-300" />
        <Button
          className="h-7 px-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm"
          isDisabled={!isEditing}
          isLoading={isLoading}
          startContent={<CheckIcon className="w-4 h-4" />}
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
          onPress={handleCreateClick}
        >
          {t("actions.new")}
        </Button>

        <Button
          className="h-7 px-1.5 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
          isDisabled={!vouch_id || Number(vouch_id) <= 0}
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
          isDisabled={!DBId || Number(DBId) <= 0 || !voucher_commit}
          startContent={<DocumentTextIcon className="w-4 h-4" />}
          variant="solid"
          onPress={() => setIsGLModalOpen(true)}
        >
          {t("actions.viewGLTransactions")}
        </Button>

        <NavigationArrows
          navigationMetadata={navigationMetadata}
          voucherNumber={voucherNumber}
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <input
            className="w-32 h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            placeholder={t("actions.search")}
            type="number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="h-7 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
            onClick={handleSearch}
          >
            <i className="bi bi-search w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoucherHeader;
