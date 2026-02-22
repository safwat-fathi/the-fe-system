import type { Account } from "@/types/models/account";
import type { AccountOption, VoucherDetail } from "@/types/voucher";
import type { CostCenter } from "@/types/voucher-form";

import React from "react";
import { useTranslations } from "next-intl";

import SelectCol from "./SelectCol";

import { getAccountSelectValue } from "@/utilities/account.actions";
import {
  getCostCenterSelectValue,
  type CostCenterOption,
} from "@/utilities/costCenter.actions";

const FIELDS_PER_ROW = 10;
const INFO_FIELDS_COUNT = 6;

const fieldIndex = (rowIndex: number, fieldOffset: number) =>
  INFO_FIELDS_COUNT + rowIndex * FIELDS_PER_ROW + fieldOffset;

interface AdjustmentColumnProps {
  detail: VoucherDetail;
  isEditing: boolean;
  initialAccounts: Account[];
  accountOptions: AccountOption[];
  initialCostCenters: CostCenter[];
  costCenterOptions: CostCenterOption[];
  updateDetail: (index: number, detail: Partial<VoucherDetail>) => void;
  removeDetailRow: (index: number) => void;
  details: VoucherDetail[];
  index: number;
  registerField: (index: number) => (el: { focus: () => void } | null) => void;
  handleFieldEnter: (
    e: React.KeyboardEvent<HTMLElement>,
    index: number,
  ) => void;
}

const disabledClass = "cursor-not-allowed";
const inputBase =
  "w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0";
const numberInputStyle = {
  MozAppearance: "textfield" as const,
  WebkitAppearance: "none" as const,
  appearance: "none" as const,
};

const AdjustmentColumn = ({
  detail,
  isEditing,
  initialAccounts,
  accountOptions,
  initialCostCenters,
  costCenterOptions,
  updateDetail,
  removeDetailRow,
  details,
  index,
  registerField,
  handleFieldEnter,
}: AdjustmentColumnProps) => {
  const t = useTranslations("forms.adjustment");

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      {/* Account Select */}
      <td className="p-0 border bg-white">
        <SelectCol<AccountOption>
          selectRef={registerField(fieldIndex(index, 0))}
          onKeyDown={(e) => handleFieldEnter(e, fieldIndex(index, 0))}
          options={accountOptions}
          placeholder={t("table.columns.accountPlaceholder")}
          formatCreateLabel={(inputValue) =>
            t("table.addAccountLabel", { value: inputValue })
          }
          isEditing={isEditing}
          value={getAccountSelectValue(detail, initialAccounts)}
          onChange={(selectedOption) => {
            if (selectedOption) {
              const selectedAccountId = Number(
                selectedOption.account?.id ?? selectedOption.value,
              );

              updateDetail(index, {
                acc_id: Number.isFinite(selectedAccountId)
                  ? selectedAccountId
                  : 0,
                acc_code: selectedOption.account.acc_code,
                acc_name: selectedOption.account.acc_name,
              });
            } else {
              updateDetail(index, { acc_id: 0, acc_code: "", acc_name: "" });
            }
          }}
        />
      </td>

      <td className="p-0 border">
        <input
          data-row={index}
          data-col={1}
          className={`${inputBase} ${!isEditing ? disabledClass : ""}`}
          disabled={!isEditing}
          min="0"
          placeholder="0.00"
          readOnly={!isEditing}
          ref={
            registerField(fieldIndex(index, 1)) as React.Ref<HTMLInputElement>
          }
          onKeyDown={(e) => handleFieldEnter(e, fieldIndex(index, 1))}
          step="0.01"
          type="number"
          value={detail.debit ? String(detail.debit) : ""}
          onChange={(e) => {
            const val = e.target.value;

            if (!val || parseFloat(val) >= 0) {
              updateDetail(index, { debit: val ? parseFloat(val) : undefined });
            }
          }}
        />
      </td>

      <td className="p-0 border">
        <input
          data-row={index}
          data-col={2}
          className={`${inputBase} ${!isEditing ? disabledClass : ""}`}
          disabled={!isEditing}
          min="0"
          placeholder="0.00"
          readOnly={!isEditing}
          ref={
            registerField(fieldIndex(index, 2)) as React.Ref<HTMLInputElement>
          }
          onKeyDown={(e) => handleFieldEnter(e, fieldIndex(index, 2))}
          step="0.01"
          type="number"
          value={detail.credit ? String(detail.credit) : ""}
          onChange={(e) => {
            const val = e.target.value;

            updateDetail(index, { credit: val ? parseFloat(val) : undefined });
          }}
        />
      </td>

      <td className="p-0 border bg-amber-50">
        <input
          data-row={index}
          data-col={3}
          className={`${inputBase} bg-amber-50 ${!isEditing ? disabledClass : ""}`}
          disabled={!isEditing}
          min="0"
          placeholder="0.00"
          readOnly={!isEditing}
          ref={
            registerField(fieldIndex(index, 3)) as React.Ref<HTMLInputElement>
          }
          onKeyDown={(e) => handleFieldEnter(e, fieldIndex(index, 3))}
          step="0.01"
          style={numberInputStyle}
          type="number"
          value={detail.g_debit ? String(detail.g_debit) : ""}
          onChange={(e) => {
            updateDetail(index, {
              g_debit: e.target.value ? parseFloat(e.target.value) : undefined,
            });
          }}
        />
      </td>

      <td className="p-0 border bg-amber-50">
        <input
          data-row={index}
          data-col={4}
          className={`${inputBase} bg-amber-50 ${!isEditing ? disabledClass : ""}`}
          disabled={!isEditing}
          min="0"
          placeholder="0.00"
          readOnly={!isEditing}
          ref={
            registerField(fieldIndex(index, 4)) as React.Ref<HTMLInputElement>
          }
          onKeyDown={(e) => handleFieldEnter(e, fieldIndex(index, 4))}
          step="0.01"
          type="number"
          value={detail.g_credit ? String(detail.g_credit) : ""}
          onChange={(e) => {
            updateDetail(index, {
              g_credit: e.target.value ? parseFloat(e.target.value) : undefined,
            });
          }}
        />
      </td>

      <td className="p-0 border">
        <input
          data-row={index}
          data-col={5}
          className={`${inputBase} ${!isEditing ? disabledClass : ""}`}
          disabled={!isEditing}
          min="0"
          placeholder={t("table.columns.gaugePlaceholder")}
          readOnly={!isEditing}
          ref={
            registerField(fieldIndex(index, 5)) as React.Ref<HTMLInputElement>
          }
          onKeyDown={(e) => handleFieldEnter(e, fieldIndex(index, 5))}
          step="0.01"
          style={numberInputStyle}
          title={t("table.columns.gaugeTooltip")}
          type="number"
          value={detail.gauge ? String(detail.gauge) : "875"}
          onChange={(e) => {
            updateDetail(index, {
              gauge: e.target.value ? parseFloat(e.target.value) : undefined,
            });
          }}
        />
      </td>

      <td className="p-0 border bg-amber-50">
        <input
          data-row={index}
          data-col={6}
          className={`${inputBase} bg-amber-50 ${!isEditing ? disabledClass : ""}`}
          disabled={!isEditing}
          min="0"
          placeholder="0.00"
          readOnly={!isEditing}
          ref={
            registerField(fieldIndex(index, 6)) as React.Ref<HTMLInputElement>
          }
          onKeyDown={(e) => handleFieldEnter(e, fieldIndex(index, 6))}
          step="0.000001"
          style={numberInputStyle}
          title={t("table.columns.gaugeTooltip")}
          type="number"
          value={
            detail.g_debit_base !== undefined && detail.g_debit_base !== null
              ? String(detail.g_debit_base)
              : ""
          }
          onChange={(e) => {
            updateDetail(index, {
              g_debit_base: e.target.value
                ? parseFloat(e.target.value)
                : undefined,
            });
          }}
        />
      </td>

      <td className="p-0 border bg-amber-50">
        <input
          data-row={index}
          data-col={7}
          className={`${inputBase} bg-amber-50 ${!isEditing ? disabledClass : ""}`}
          disabled={!isEditing}
          min="0"
          placeholder="0.00"
          readOnly={!isEditing}
          ref={
            registerField(fieldIndex(index, 7)) as React.Ref<HTMLInputElement>
          }
          onKeyDown={(e) => handleFieldEnter(e, fieldIndex(index, 7))}
          step="0.000001"
          title={t("table.columns.gaugeTooltip")}
          type="number"
          value={
            detail.g_credit_base !== undefined && detail.g_credit_base !== null
              ? String(detail.g_credit_base)
              : ""
          }
          onChange={(e) => {
            updateDetail(index, {
              g_credit_base: e.target.value
                ? parseFloat(e.target.value)
                : undefined,
            });
          }}
        />
      </td>

      <td className="p-0 border">
        <SelectCol<CostCenterOption>
          selectRef={registerField(fieldIndex(index, 8))}
          onKeyDown={(e) => handleFieldEnter(e, fieldIndex(index, 8))}
          options={costCenterOptions}
          placeholder={t("table.columns.costCenterPlaceholder")}
          isEditing={isEditing}
          value={getCostCenterSelectValue(detail, initialCostCenters)}
          onChange={(selectedOption) => {
            if (selectedOption) {
              updateDetail(index, { cost_id: selectedOption.value });
            } else {
              updateDetail(index, { cost_id: 0 });
            }
          }}
        />
      </td>

      <td className="p-0 border">
        <input
          data-row={index}
          data-col={9}
          className={`${inputBase} ${!isEditing ? disabledClass : ""}`}
          disabled={!isEditing}
          placeholder={t("table.columns.notes")}
          readOnly={!isEditing}
          ref={
            registerField(fieldIndex(index, 9)) as React.Ref<HTMLInputElement>
          }
          onKeyDown={(e) => handleFieldEnter(e, fieldIndex(index, 9))}
          type="text"
          value={detail.vouch_notes || ""}
          onChange={(e) => updateDetail(index, { vouch_notes: e.target.value })}
        />
      </td>

      {/* Delete Row */}
      <td className="p-1 border">
        <button
          className={`font-bold ${
            details.length <= 2
              ? "text-gray-400 cursor-not-allowed"
              : "text-red-600"
          }`}
          disabled={!isEditing || details.length <= 2}
          tabIndex={-1}
          title={
            details.length <= 2
              ? t("table.minRowsError")
              : t("actions.deleteRow")
          }
          onClick={() => removeDetailRow(index)}
        >
          ×
        </button>
      </td>
    </tr>
  );
};

export default React.memo(AdjustmentColumn);
