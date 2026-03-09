import type { VoucherDetail } from "@/types/voucher";
import type { Account } from "@/types/models/account";
import type { CostCenter } from "@/types/voucher-form";

import React, { memo, useCallback } from "react";
import { useTranslations } from "next-intl";

import TableAsyncSelect from "./shared/TableAsyncSelect";
import InputTable from "./shared/InputTable";
import TableSelect from "./shared/TableSelect";

import {
  getAccountSelectValue,
  type AccountOption,
} from "@/utilities/account.actions";
import {
  getCostCenterSelectValue,
  type CostCenterOption,
} from "@/utilities/costCenter.actions";

interface DetailsItemRowProps {
  detail: VoucherDetail;
  accounts: Account[];
  accountOptions: AccountOption[];
  costCenters: CostCenter[];
  costCenterOptions: CostCenterOption[];
  detailIndex: number;
  isEditing: boolean;

  updateDetail: (
    index: number,
    changes: Partial<VoucherDetail> & { amount?: number },
  ) => void;
  handleDetailKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    col: number,
    options?: { isLastCol?: boolean },
  ) => void;
  removeDetail: (index: number) => void;
  isRemoveDisabled: boolean;
  setInputRef: (
    rowIndex: number,
    colIndex: number,
  ) => (el: HTMLInputElement | null) => void;
}

const DetailsItemRow = ({
  detail,
  accounts,
  accountOptions,
  costCenters,
  costCenterOptions,
  detailIndex,
  isEditing,

  updateDetail,
  handleDetailKeyDown,
  removeDetail,
  isRemoveDisabled,
  setInputRef,
}: DetailsItemRowProps) => {
  const t = useTranslations("forms.cashReceiptVoucher");

  const loadAccountOptions = useCallback(
    (inputValue: string) =>
      new Promise<AccountOption[]>((resolve) => {
        const filteredOptions = accountOptions.filter(
          (option) =>
            option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
            option.value.toString().includes(inputValue),
        );

        resolve(filteredOptions);
      }),
    [accountOptions],
  );

  return (
    <tr className="border-b">
      <td className="p-0 border">
        {(() => {
          const colIndex = 0;

          return (
            <div
              id={`account-select-${detailIndex}`}
              ref={(el) => {
                if (el) {
                  const combobox = el.querySelector(
                    '[role="combobox"]',
                  ) as HTMLInputElement;

                  if (combobox) setInputRef(detailIndex, colIndex)(combobox);
                }
              }}
              onKeyDownCapture={(e) => {
                const target = e.target as HTMLElement;
                const combobox = target.closest('[role="combobox"]');

                if (combobox) {
                  const isExpanded =
                    combobox.getAttribute("aria-expanded") === "true";

                  if (isExpanded && e.key !== "Escape") {
                    return;
                  }

                  if (e.key === "Enter" && !isExpanded) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDetailKeyDown(
                      e as unknown as React.KeyboardEvent<HTMLInputElement>,
                      detailIndex,
                      colIndex,
                    );

                    return;
                  }

                  if (
                    (e.key === "ArrowUp" ||
                      e.key === "ArrowDown" ||
                      e.key === "ArrowLeft" ||
                      e.key === "ArrowRight") &&
                    !isExpanded
                  ) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDetailKeyDown(
                      e as unknown as React.KeyboardEvent<HTMLInputElement>,
                      detailIndex,
                      colIndex,
                    );

                    return;
                  }
                }
                if (e.key === "Escape") return;
              }}
            >
              <TableAsyncSelect
                isEditing={isEditing}
                loadOptions={loadAccountOptions}
                placeholder={t("tables.accounts.columns.accountPlaceholder")}
                value={getAccountSelectValue(detail, accounts)}
                onChange={(value) => {
                  const selectedAccount = accounts.find(
                    (acc) => acc.id === value?.value,
                  );

                  updateDetail(detailIndex, {
                    acc_id: value?.value,
                    acc_code:
                      value?.account?.acc_code ??
                      selectedAccount?.acc_code ??
                      "",
                    acc_name:
                      value?.account?.acc_name ??
                      selectedAccount?.acc_name ??
                      "",
                  });
                }}
              />
            </div>
          );
        })()}
      </td>
      <td className="p-0 border">
        {(() => {
          const colIndex = 1;

          return (
            <div
              ref={(el) => {
                if (el) {
                  const input = el.querySelector("input");

                  if (input) setInputRef(detailIndex, colIndex)(input);
                }
              }}
              className="w-full h-full"
            >
              <InputTable
                type="number"
                isEditing={isEditing}
                value={
                  (detail.debit || detail.credit || 0) === 0
                    ? ""
                    : detail.debit || detail.credit || 0
                }
                onChange={(value) =>
                  updateDetail(detailIndex, {
                    amount: Number(value),
                  })
                }
                onKeyDown={(e) =>
                  handleDetailKeyDown(e, detailIndex, colIndex, {
                    isLastCol: false,
                  })
                }
              />
            </div>
          );
        })()}
      </td>
      <td className="p-0 border">
        {(() => {
          const colIndex = 2;

          return (
            <div
              ref={(el) => {
                if (el) {
                  const input = el.querySelector("input");

                  if (input) setInputRef(detailIndex, colIndex)(input);
                }
              }}
              className="w-full h-full"
            >
              <InputTable
                type="text"
                isEditing={isEditing}
                value={detail.vouch_notes || ""}
                onChange={(value) =>
                  updateDetail(detailIndex, {
                    vouch_notes: String(value),
                  })
                }
                onKeyDown={(e) =>
                  handleDetailKeyDown(e, detailIndex, colIndex, {
                    isLastCol: false,
                  })
                }
              />
            </div>
          );
        })()}
      </td>
      <td className="p-0 border">
        {(() => {
          const colIndex = 3;

          return (
            <div
              id={`cost-center-detail-select-${detailIndex}`}
              ref={(el) => {
                if (el) {
                  const combobox = el.querySelector(
                    '[role="combobox"]',
                  ) as HTMLInputElement;

                  if (combobox) setInputRef(detailIndex, colIndex)(combobox);
                }
              }}
              onKeyDownCapture={(e) => {
                const target = e.target as HTMLElement;
                const combobox = target.closest('[role="combobox"]');

                if (combobox) {
                  const isExpanded =
                    combobox.getAttribute("aria-expanded") === "true";

                  if (e.key === "Enter" && !isExpanded) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDetailKeyDown(
                      e as unknown as React.KeyboardEvent<HTMLInputElement>,
                      detailIndex,
                      colIndex,
                    );

                    return;
                  }
                }
              }}
            >
              <TableSelect<CostCenterOption>
                isDisabled={!isEditing}
                placeholder={t("tables.accounts.columns.costCenter")}
                options={costCenterOptions}
                value={getCostCenterSelectValue(
                  { ...detail, cost_id: detail.cost_id },
                  costCenters,
                )}
                onChange={(selectedOption) => {
                  if (!isEditing) return;
                  updateDetail(detailIndex, {
                    cost_id: selectedOption?.value || 0,
                  });
                }}
              />
            </div>
          );
        })()}
      </td>
      <td className="p-1 border">
        <button
          className="font-bold text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          disabled={!isEditing || isRemoveDisabled}
          onClick={() => removeDetail(detailIndex)}
        >
          ×
        </button>
      </td>
    </tr>
  );
};

export default memo(DetailsItemRow);
