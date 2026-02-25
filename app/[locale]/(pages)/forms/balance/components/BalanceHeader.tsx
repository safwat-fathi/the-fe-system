import { useTranslations } from "next-intl";
import {
  CheckIcon,
  DocumentTextIcon,
  PencilIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";

import { Voucher } from "@/types/voucher";
import { VoucherType } from "@/types/voucher-form";

interface BalanceHeaderProps {
  voucher: Voucher;
  voucherTypes: VoucherType[];
  isEditing: boolean;
  isLoading: boolean;
  saveVoucher: () => void;
  handleEditClick: () => void;
  printVoucher: () => void;
  setIsGLModalOpen: (open: boolean) => void;
  formMode: "new" | "edit" | "preview";
  isPrinting: boolean;
}

const BalanceHeader = ({
  voucher,
  voucherTypes,
  isEditing,
  isLoading,
  saveVoucher,
  handleEditClick,
  printVoucher,
  setIsGLModalOpen,
  formMode,
  isPrinting,
}: BalanceHeaderProps) => {
  const t = useTranslations("forms.balanceVoucher");

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-1.5 mb-1 border border-slate-200">
      <div className="flex items-center gap-1.5 flex-wrap">
        <h1
          className={`text-lg font-bold text-slate-800 flex items-center gap-1.5`}
        >
          <span>
            {voucherTypes.find((type) => type.id === voucher.vouch_type)
              ?.name || t("messages.voucherType")}
          </span>
          <span className="text-slate-600 font-medium">
            #
            {voucher.vouch_id &&
            Number(voucher.vouch_id) > 0 &&
            isFinite(Number(voucher.vouch_id))
              ? Number(voucher.vouch_id)
              : voucher.id
                ? `DB-${voucher.id}`
                : t("messages.numbering")}
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
          isDisabled={
            !voucher.id || Number(voucher.id) <= 0
            // ✅ يعتمد فقط على وجود id (القيد محفوظ)، وليس على commit
          }
          startContent={<DocumentTextIcon className="w-4 h-4" />}
          variant="solid"
          onPress={() => setIsGLModalOpen(true)}
        >
          {t("actions.viewGLTransactions")}
        </Button>
      </div>
    </div>
  );
};

export default BalanceHeader;
