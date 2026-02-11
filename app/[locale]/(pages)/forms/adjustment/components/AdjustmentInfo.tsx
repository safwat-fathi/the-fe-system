import type {
  CostCenter,
  VoucherStatus,
  VoucherType,
} from "@/types/voucher-form";
import type { Voucher } from "@/types/voucher";

import { useTranslations } from "next-intl";
import React, { type KeyboardEvent, useMemo } from "react";
import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline";

import { voucherStatusKeyMap, voucherTypeKeyMap } from "../constants";

import FormSelect from "@/components/FormSelect";

const AdjustmentInfo = ({
  textAlign,
  isEditing,
  voucher,
  setVoucher,
  voucherStatuses,
  voucherTypes,
  costCenters,
  handleCostCenter,

  focusFirstInRow,

  setIsNotesModalOpen,
  registerField,
  handleFieldEnter,
}: {
  textAlign: string;
  isEditing: boolean;
  voucher: Voucher;
  setVoucher: React.Dispatch<React.SetStateAction<Voucher>>;
  voucherStatuses: VoucherStatus[];
  voucherTypes: VoucherType[];
  costCenters: CostCenter[];
  handleCostCenter: (costCenter: CostCenter) => void;

  focusFirstInRow: (index: number) => void;

  setIsNotesModalOpen: (open: boolean) => void;
  registerField: (index: number) => (el: { focus: () => void } | null) => void;
  handleFieldEnter: (
    e: React.KeyboardEvent<HTMLElement>,
    index: number,
  ) => void;
}) => {
  const t = useTranslations("forms.adjustment");

  // Register the jump-to-table action at index 6 (after Notes)
  React.useEffect(() => {
    registerField(6)({
      focus: () => {
        // When focusing "index 6", we actually want to focus the first row of the table
        focusFirstInRow(0);
      },
    } as HTMLElement);
  }, [registerField, focusFirstInRow]);

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

  const renderVoucherType = (type: VoucherType) => {
    const typeValue =
      type.Id !== undefined && type.Id !== null
        ? String(type.Id)
        : String(type.Id || "");
    const typeKey = voucherTypeKeyMap[type.name];
    const translatedLabel = typeKey
      ? t(`voucherTypes.${typeKey}` as const, {
          fallback: type.name,
        })
      : type.name;

    return (
      <option key={type.Id || type.id} value={typeValue}>
        {translatedLabel}
      </option>
    );
  };

  const getCostCenterSelectValue = (costId: number | null | undefined) => {
    if (!costId || costId <= 0) {
      return null;
    }

    const center = costCenters.find((c) => {
      const centerId = c.id;

      return centerId === costId;
    });

    if (!center) {
      return null;
    }

    return {
      value: String(center.id),
      label: center.cost_name || `مركز ${center.id}`,
    };
  };

  const costCenterSelectOptions = useMemo(() => {
    return (costCenters || []).map((center) => {
      const centerId = center.id;

      return {
        value: String(centerId),
        label: center.cost_name || `مركز ${centerId}`,
        id: center.id,
      };
    });
  }, [costCenters]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-1.5">
      <div className="p-1">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-1.5">
          <div className="flex flex-col gap-0.5 md:col-span-1">
            <label
              className={`text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
              htmlFor="voucher-ref-no"
            >
              {t("fields.refNo")}
            </label>
            <input
              id="voucher-ref-no"
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 disabled:cursor-not-allowed disabled:bg-slate-50"
              disabled={!isEditing}
              placeholder={t("fields.refNoPlaceholder")}
              readOnly={!isEditing}
              ref={
                registerField(0) as unknown as React.RefObject<HTMLInputElement>
              }
              value={voucher.ref_no || ""}
              onChange={(e) =>
                setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))
              }
              onKeyDown={(e) => handleFieldEnter(e, 0)}
            />
          </div>
          <div className="flex flex-col gap-0.5 md:col-span-1">
            <label
              className={`text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
              htmlFor="voucher-date-time"
            >
              {t("fields.dateTime")}
            </label>
            <input
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 disabled:cursor-not-allowed disabled:bg-slate-50"
              disabled={!isEditing}
              id="voucher-date-time"
              max={new Date().toISOString().slice(0, 16)}
              readOnly={!isEditing}
              ref={
                registerField(1) as unknown as React.RefObject<HTMLInputElement>
              }
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
              onKeyDown={(e) => handleFieldEnter(e, 1)}
            />
          </div>
          <div className="flex flex-col gap-0.5 md:col-span-1">
            <label
              className={`text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
              htmlFor="voucher-status"
            >
              {t("fields.status")}
            </label>
            <select
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 disabled:cursor-not-allowed disabled:bg-slate-50"
              disabled={!isEditing}
              id="voucher-status"
              ref={
                registerField(
                  2,
                ) as unknown as React.RefObject<HTMLSelectElement>
              }
              value={String(voucher.vouch_status ?? 1)}
              onChange={(e) =>
                setVoucher((prev) => ({
                  ...prev,
                  vouch_status: parseInt(e.target.value),
                }))
              }
              onKeyDown={(e) => handleFieldEnter(e, 2)}
            >
              {voucherStatuses?.length > 0 &&
                voucherStatuses.map((status) => renderVoucherStatus(status))}
            </select>
          </div>
          <div className="flex flex-col gap-0.5 md:col-span-1">
            <label
              className={`text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
              htmlFor="voucher-type"
            >
              {t("fields.voucherType")}
            </label>
            <select
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 disabled:cursor-not-allowed disabled:bg-slate-50"
              disabled={!isEditing}
              id="voucher-type"
              ref={
                registerField(
                  3,
                ) as unknown as React.RefObject<HTMLSelectElement>
              }
              value={voucher.vouch_type || 2}
              onChange={(e) =>
                setVoucher((prev) => ({
                  ...prev,
                  vouch_type: parseInt(e.target.value),
                }))
              }
              onKeyDown={(e) => handleFieldEnter(e, 3)}
            >
              {voucherTypes.length > 0 &&
                voucherTypes.map((type) => renderVoucherType(type))}
            </select>
          </div>
          <div className="flex flex-col gap-0.5 md:col-span-1">
            <FormSelect
              isSearchable
              label={t("fields.costCenter")}
              inputId="voucher-cost-center-select"
              instanceId="voucher-cost-center-select"
              isDisabled={!isEditing || costCenters.length === 0}
              options={costCenterSelectOptions}
              placeholder={t("fields.costCenterPlaceholder")}
              ref={registerField(4)}
              value={getCostCenterSelectValue(voucher.cost_id)}
              onChange={(newValue: unknown) => {
                if (!isEditing || !newValue) return;
                const option = newValue as { id: number };
                const costCenter = costCenters.find((c) => c.id === option.id);

                if (costCenter) {
                  handleCostCenter(costCenter);
                }
              }}
              onKeyDown={(e) => handleFieldEnter(e, 4)}
            />
          </div>
        </div>
        <div className="mb-1.5">
          <label
            className={`block text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
            htmlFor="voucher-notes"
          >
            {t("fields.notes")}
          </label>
          <div className="relative">
            <input
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 pr-8 disabled:cursor-not-allowed disabled:bg-slate-50"
              disabled={!isEditing}
              id="voucher-notes"
              placeholder={t("fields.notesPlaceholder")}
              readOnly={!isEditing}
              ref={
                registerField(5) as unknown as React.RefObject<HTMLInputElement>
              }
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
              onKeyDown={(e) => handleFieldEnter(e, 5)}
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
    </div>
  );
};

export default AdjustmentInfo;
