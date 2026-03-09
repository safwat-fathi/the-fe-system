import type { VoucherDetail, AccountOption } from "@/types/voucher";
import type { Account } from "@/types/models/account";

import { memo, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { NUMERIC_COLUMNS } from "../constants";

import AccountSelectCell from "./shared/AccountSelectCell";
import CostCenterCell from "./shared/CostCenterCell";
import TableInput from "./shared/TableInput";
interface BalanceDetailRowProps {
  detail: VoucherDetail;
  index: number;
  handleKeyDownTable: (
    e: KeyboardEvent<HTMLElement>,
    index: number,
    colIndex: number,
    options?: Record<string, unknown>,
  ) => void;
  updateDetail: (index: number, field: string, value: unknown) => void;
  isEditing: boolean;
  setInputRef: (
    rowIndex: number,
    colIndex: number,
  ) => (el: HTMLInputElement | null) => void;
  focusNextField: (index: number, colIndex: number) => boolean;
  costCenters: { value: string; label: string }[];
  removeDetailRow: (index: number) => void;
  accounts: Account[];
  defaultAccountOptions: AccountOption[];
  getAccountSelectValue: (
    detail: VoucherDetail,
  ) => { value: number; label: string } | null;
  loadAccountOptions: (
    inputValue: string,
    callback: (options: AccountOption[]) => void,
  ) => void;
  updateAccountsList: (account: Account) => void;
}

const ACCOUNT_COL = 0;
const COST_CENTER_COL = 8;
const NOTES_COL = 9;

const getFieldValue = (
  detail: VoucherDetail,
  field: string,
  defaultVal: string,
): string => {
  const val = detail[field as keyof VoucherDetail];

  if (val !== undefined && val !== null) return String(val);

  return defaultVal;
};

const BalanceDetailRow = memo(
  ({
    detail,
    index,
    handleKeyDownTable,
    updateDetail,
    isEditing,
    setInputRef,
    focusNextField,
    costCenters,
    removeDetailRow,
    accounts,
    defaultAccountOptions,
    getAccountSelectValue,
    loadAccountOptions,
    updateAccountsList,
  }: BalanceDetailRowProps) => {
    const t = useTranslations("forms.balanceVoucher");

    return (
      <tr className="border-b border-slate-100 hover:bg-slate-50">
        <AccountSelectCell
          accounts={accounts}
          colIndex={ACCOUNT_COL}
          defaultAccountOptions={defaultAccountOptions}
          detail={detail}
          focusNextField={focusNextField}
          getAccountSelectValue={getAccountSelectValue}
          handleKeyDownTable={handleKeyDownTable}
          index={index}
          isEditing={isEditing}
          loadAccountOptions={loadAccountOptions}
          setInputRef={setInputRef}
          updateAccountsList={updateAccountsList}
          updateDetail={updateDetail}
        />
        {NUMERIC_COLUMNS.map((config) => {
          const {
            col,
            field,
            defaultVal,
            step,
            placeholder,
            placeholderKey,
            titleKey,
            rawTitle,
            bgClass,
            fallback,
          } = config;

          return (
            <td key={field} className={`p-0 border ${bgClass || ""}`}>
              <TableInput
                className={bgClass || ""}
                isEditing={isEditing}
                placeholder={
                  placeholderKey
                    ? t(placeholderKey as Parameters<typeof t>[0])
                    : placeholder
                }
                ref={setInputRef(index, col)}
                step={step}
                title={
                  titleKey ? t(titleKey as Parameters<typeof t>[0]) : rawTitle
                }
                type="number"
                value={getFieldValue(detail, field, defaultVal)}
                onChange={(val) => {
                  if (val === 0 || Number(val) >= 0) {
                    updateDetail(index, field, val ? Number(val) : fallback);
                  }
                }}
                onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
                  handleKeyDownTable(e, index, col);
                }}
              />
            </td>
          );
        })}
        {costCenters.length > 0 && (
          <CostCenterCell
            colIndex={COST_CENTER_COL}
            costCenters={costCenters}
            detail={detail}
            focusNextField={focusNextField}
            handleKeyDownTable={handleKeyDownTable}
            index={index}
            isEditing={isEditing}
            setInputRef={setInputRef}
            updateDetail={updateDetail}
          />
        )}
        <td className="p-0 border">
          <TableInput
            isEditing={isEditing}
            placeholder={t("table.columns.notes")}
            ref={setInputRef(index, NOTES_COL)}
            type="text"
            value={(detail.vouch_notes as string) || ""}
            onChange={(val) => {
              updateDetail(index, "vouch_notes", val ? String(val) : undefined);
            }}
            onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
              handleKeyDownTable(e, index, NOTES_COL, { isLastCol: true });
            }}
          />
        </td>
        <td className="p-1 border">
          <button
            className="font-bold text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            disabled={!isEditing}
            tabIndex={-1}
            title={t("actions.delete")}
            onClick={() => removeDetailRow(index)}
          >
            ×
          </button>
        </td>
      </tr>
    );
  },
);

BalanceDetailRow.displayName = "BalanceDetailRow";

export default BalanceDetailRow;
