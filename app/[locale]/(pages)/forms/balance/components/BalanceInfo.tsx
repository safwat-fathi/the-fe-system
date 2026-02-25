import { memo, type Dispatch, type SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline";

import SelectBalance from "./shared/SelectBalance";

import { Voucher } from "@/types/voucher";

type BasicSelectOption = {
  value: string;
  label: string;
};

interface BalanceInfoProps {
  selectorsRef: React.RefObject<HTMLDivElement>;
  handleKeyDownSelectors: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  voucher: Voucher;
  isEditing: boolean;
  setVoucher: Dispatch<SetStateAction<Voucher>>;
  costCenterOptions: BasicSelectOption[];
  costCenterValue: BasicSelectOption | null;
  onCostCenterChange: (selectedOption: BasicSelectOption | null) => void;
  setIsNotesModalOpen: Dispatch<SetStateAction<boolean>>;
}

const BalanceInfo = memo(
  ({
    selectorsRef,
    handleKeyDownSelectors,
    voucher,
    isEditing,
    setVoucher,
    costCenterOptions,
    costCenterValue,
    onCostCenterChange,
    setIsNotesModalOpen,
  }: BalanceInfoProps) => {
    const t = useTranslations("forms.balanceVoucher");

    return (
      <div
        ref={selectorsRef}
        onKeyDownCapture={handleKeyDownSelectors}
        className="p-1 bg-white rounded-lg border border-slate-200 mb-1.5 grid grid-cols-1 md:grid-cols-12 gap-1.5"
      >
        <div className="flex flex-col gap-0.5 md:col-span-2">
          <label
            className="text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="balance-ref-no"
          >
            {t("fields.refNo")}
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 disabled:cursor-not-allowed disabled:bg-slate-50"
            disabled={!isEditing}
            id="balance-ref-no"
            placeholder={t("fields.refNoPlaceholder")}
            readOnly={!isEditing}
            value={voucher.ref_no || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-0.5 md:col-span-3">
          <label
            className="text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="balance-vouch-datetime"
          >
            {t("fields.vouchDateTime")}
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 disabled:cursor-not-allowed disabled:bg-slate-50"
            disabled={!isEditing}
            id="balance-vouch-datetime"
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
                vouch_date: e.target.value,
              }))
            }
          />
        </div>

        {costCenterOptions.length > 0 && (
          <div className="flex flex-col gap-0.5 md:col-span-2">
            <label
              className="text-xs font-medium text-slate-700 mb-0.5"
              htmlFor="balance-cost-center-select"
            >
              {t("fields.costCenter")}
            </label>
            <SelectBalance
              instanceId="balance-cost-center-select"
              isDisabled={!isEditing || costCenterOptions.length === 0}
              options={costCenterOptions}
              placeholder={t("fields.costCenterPlaceholder")}
              value={costCenterValue}
              onChange={(selected: BasicSelectOption | null) => {
                if (!isEditing) return;
                onCostCenterChange(selected);
              }}
              onKeyDown={() => {}}
              styles={{
                control: (base: any) => ({
                  ...base,
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  "&:hover": {
                    borderColor: "#cbd5e1",
                  },
                }),
              }}
            />
          </div>
        )}

        <div
          className={`flex flex-col gap-0.5 ${
            costCenterOptions.length > 0 ? "md:col-span-5" : "md:col-span-7"
          }`}
        >
          <label
            className={`text-xs font-medium text-slate-700 mb-0.5 `}
            htmlFor="balance-vouch-notes"
          >
            {t("fields.notes")}
          </label>
          <div className="relative">
            <input
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 pr-8 disabled:cursor-not-allowed disabled:bg-slate-50"
              disabled={!isEditing}
              id="balance-vouch-notes"
              placeholder={t("fields.notesPlaceholder")}
              readOnly={!isEditing}
              value={voucher.vouch_notes || ""}
              onChange={(e) =>
                setVoucher((prev) => ({
                  ...prev,
                  vouch_notes: e.target.value,
                }))
              }
              onDoubleClick={() => {
                if (isEditing) {
                  setIsNotesModalOpen(true);
                }
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
                if (e.key === "Enter" && !e.isDefaultPrevented()) {
                  e.preventDefault();
                  e.stopPropagation();
                  setTimeout(() => {
                    const firstAccountInput = document.querySelector(
                      `#account-input-0-0, #account-select-0 input`,
                    ) as HTMLElement;

                    if (firstAccountInput) {
                      firstAccountInput.focus();

                      return;
                    }
                    const firstDebitInput = document.querySelector(
                      `input[data-row="0"][data-col="1"]`,
                    ) as HTMLInputElement;

                    if (firstDebitInput) {
                      firstDebitInput.focus();
                    }
                  }, 50);
                }
              }}
            />
            {isEditing && (
              <button
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all duration-200"
                data-skip-key-as-tab="true"
                tabIndex={-1}
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
  },
);

BalanceInfo.displayName = "BalanceInfo";

export default BalanceInfo;
