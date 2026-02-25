import type { Voucher } from "@/types/voucher";
import type { CostCenter, VoucherStatus } from "@/types/voucher-form";

import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { voucherStatusKeyMap } from "../constants";
import SelectInput from "../../cash-receipt/components/shared/SelectInput";

const PaymentReceiptInfo = ({
  voucher,
  setVoucher,
  refNoInput,
  onKeyDownCapture,
  isEditing,
  selectorsRef,
  initialCostCenters,
  handleMasterCostChange,
  voucherStatuses,
  notesInputRef,
  setIsNotesModalOpen,
  focusFirstPaymentTableInput,
}: {
  voucher: Voucher;
  setVoucher: React.Dispatch<React.SetStateAction<Voucher>>;
  refNoInput: React.RefObject<HTMLInputElement>;
  onKeyDownCapture: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isEditing: boolean;
  selectorsRef: React.RefObject<HTMLDivElement>;
  initialCostCenters: CostCenter[];
  handleMasterCostChange: (costId: number | null) => void;
  voucherStatuses: VoucherStatus[];
  notesInputRef: React.RefObject<HTMLInputElement>;
  setIsNotesModalOpen: (isOpen: boolean) => void;
  focusFirstPaymentTableInput: () => void;
}) => {
  const t = useTranslations("forms.paymentReceipt");

  const renderVoucherStatus = (status: VoucherStatus) => {
    const statusValue =
      status.id !== undefined && status.id !== null
        ? String(status.id)
        : String(status.id || "");
    const statusKey = voucherStatusKeyMap[status.name];
    const translatedLabel = statusKey
      ? t(`statusOptions.${statusKey}` as const, {
          fallback: status.name,
        })
      : status.name;

    return (
      <option key={status.id || ""} value={statusValue}>
        {translatedLabel}
      </option>
    );
  };

  return (
    <div
      className={`grid grid-cols-1 ${
        initialCostCenters.length > 0 ? "md:grid-cols-12" : "md:grid-cols-10"
      } gap-1.5 mb-2`}
      onKeyDownCapture={onKeyDownCapture}
      ref={selectorsRef}
    >
      <div className="md:col-span-2">
        <label
          htmlFor="payment-receipt-ref-no"
          className={`block text-xs font-medium text-slate-700 mb-0.5 `}
        >
          {t("fields.refNo")}
        </label>
        <input
          ref={refNoInput}
          className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
          disabled={!isEditing}
          id="payment-receipt-ref-no"
          readOnly={!isEditing}
          type="text"
          value={voucher.ref_no || ""}
          onChange={(e) =>
            setVoucher((prev: Voucher) => ({
              ...prev,
              ref_no: e.target.value,
            }))
          }
        />
      </div>
      <div className="md:col-span-3">
        <label
          className={`block text-xs font-medium text-slate-700 mb-0.5 `}
          htmlFor="payment-receipt-date-time"
        >
          {t("fields.dateTime")}
        </label>
        <input
          className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
          disabled={!isEditing}
          id="payment-receipt-date-time"
          readOnly={!isEditing}
          type="datetime-local"
          value={
            voucher.vouch_date
              ? new Date(voucher.vouch_date).toISOString().slice(0, 16)
              : ""
          }
          onChange={(e) =>
            setVoucher((prev) => ({
              ...prev,
              vouch_date: new Date(e.target.value).toISOString(),
            }))
          }
        />
      </div>
      <div className="md:col-span-2">
        <label
          className={`block text-xs font-medium text-slate-700 mb-0.5`}
          htmlFor="payment-receipt-cost-center"
        >
          {t("fields.costCenter")}
        </label>
        <SelectInput
          isSearchable
          isDisabled={!isEditing}
          options={(initialCostCenters || []).map((center) => ({
            value: center.id,
            label:
              center.cost_name || center.cost_name_e || `مركز ${center.id}`,
          }))}
          placeholder={t("fields.costCenterPlaceholder")}
          value={
            voucher.cost_id
              ? {
                  value: voucher.cost_id,
                  label:
                    initialCostCenters.find((c) => c.id === voucher.cost_id)
                      ?.cost_name ||
                    initialCostCenters.find((c) => c.id === voucher.cost_id)
                      ?.cost_name_e ||
                    `مركز ${voucher.cost_id}`,
                }
              : null
          }
          onChange={(selectedOption) => {
            handleMasterCostChange(selectedOption?.value ?? null);
          }}
        />
      </div>
      <div className={"md:col-span-1"}>
        <label
          className={`block text-xs font-medium text-slate-700 mb-0.5`}
          htmlFor="payment-receipt-status"
        >
          {t("fields.status")}
        </label>
        <select
          className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-1"
          disabled={!isEditing}
          id="payment-receipt-status"
          value={String(voucher.vouch_status ?? 1)}
          onChange={(e) =>
            setVoucher((prev) => ({
              ...prev,
              vouch_status: parseInt(e.target.value) || 1,
            }))
          }
        >
          {voucherStatuses.map((status) => renderVoucherStatus(status))}
        </select>
      </div>
      <div className={"md:col-span-4"}>
        <label
          className={`block text-xs font-medium text-slate-700 mb-0.5`}
          htmlFor="payment-receipt-notes"
        >
          {t("fields.notes")}
        </label>
        <div className="relative">
          <input
            ref={notesInputRef}
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 pr-8"
            disabled={!isEditing}
            id="payment-receipt-notes"
            placeholder={t("fields.notesPlaceholder")}
            readOnly={!isEditing}
            type="text"
            value={voucher.vouch_notes || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, vouch_notes: e.target.value }))
            }
            onDoubleClick={() => {
              if (isEditing) {
                setIsNotesModalOpen(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();

                focusFirstPaymentTableInput();
              }
            }}
          />
          {isEditing && (
            <button
              className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all duration-200"
              data-skip-key-as-tab="true"
              title={t("actions.expandNotes")}
              type="button"
              onClick={() => setIsNotesModalOpen(true)}
            >
              <ArrowsPointingOutIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptInfo;
