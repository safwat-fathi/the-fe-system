import type { Box } from "@/types/models/box";
import type { VoucherBox } from "@/types/voucher";
import type { CostCenter } from "@/types/voucher-form";

import React from "react";
import { useTranslations } from "next-intl";

import InputTable from "./shared/InputTable";
import TableSelect from "./shared/TableSelect";

import {
  getCostCenterSelectValue,
  type CostCenterOption,
} from "@/utilities/costCenter.actions";
import { getBoxSelectValue, type BoxOption } from "@/utilities/box.actions";

interface CashItemRowProps {
  isEditing: boolean;
  cashItem: VoucherBox;
  handleCashChange: (index: number, changes: Partial<VoucherBox>) => void;
  handleCashKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    col: number,
    options?: { isLastCol?: boolean },
  ) => void;
  setInputRef: (
    rowIndex: number,
    colIndex: number,
  ) => (el: HTMLInputElement | null) => void;
  index: number;

  boxes: Box[];
  boxOptions: BoxOption[];
  costCenters: CostCenter[];
  costCenterOptions: CostCenterOption[];
  removeCashBox: (index: number) => void;
  isRemoveDisabled: boolean;
}

const CashItemRow = ({
  isEditing,
  cashItem,
  handleCashChange,
  handleCashKeyDown,
  setInputRef,

  index,
  boxes,
  boxOptions,
  costCenters,
  costCenterOptions,
  removeCashBox,
  isRemoveDisabled,
}: CashItemRowProps) => {
  const t = useTranslations("forms.paymentReceipt");

  return (
    <tr className="border-b">
      <td className="p-0 border">
        {(() => {
          const colIndex = 0;

          return (
            <div
              ref={(el) => {
                if (el) {
                  const input = el.querySelector("input");

                  if (input) setInputRef(index, colIndex)(input);
                }
              }}
              className="w-full h-full"
            >
              <InputTable
                type="number"
                isEditing={isEditing}
                value={cashItem.amount === 0 ? "" : cashItem.amount}
                onChange={(value) =>
                  handleCashChange(index, {
                    amount: Number(value),
                  })
                }
                onKeyDown={(e) =>
                  handleCashKeyDown(e, index, colIndex, {
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
          const colIndex = 1;

          return (
            <div
              id={`box-select-${index}`}
              ref={(el) => {
                if (el) {
                  const combobox = el.querySelector(
                    '[role="combobox"]',
                  ) as HTMLInputElement;

                  if (combobox) setInputRef(index, colIndex)(combobox);
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
                    handleCashKeyDown(
                      e as unknown as React.KeyboardEvent<HTMLInputElement>,
                      index,
                      colIndex,
                      {
                        isLastCol: false,
                      },
                    );
                  }
                }
              }}
            >
              <TableSelect<BoxOption>
                isDisabled={!isEditing}
                placeholder={t("tables.cash.columns.boxPlaceholder")}
                options={boxOptions}
                value={getBoxSelectValue(cashItem, boxes)}
                onChange={(selectedOption) => {
                  if (!isEditing) return;
                  const selectedBoxId = selectedOption?.value || 0;
                  const selectedBox = boxes.find((b) => b.id === selectedBoxId);

                  const changes: Partial<VoucherBox> = {
                    box_id: selectedBoxId,
                  };

                  if (selectedBox) {
                    changes.box = {
                      id: selectedBox.id,
                      cust_name: selectedBox.cust_name || "",
                      cust_code: selectedBox.cust_code?.toString() || "",
                      box_type:
                        selectedBox.box_type !== null &&
                        selectedBox.box_type !== undefined
                          ? Number(selectedBox.box_type)
                          : undefined,
                    };
                  }

                  handleCashChange(index, changes);
                }}
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

                  if (input) setInputRef(index, colIndex)(input);
                }
              }}
              className="w-full h-full"
            >
              <InputTable
                type="text"
                isEditing={isEditing}
                value={cashItem.vouch_notes || ""}
                onChange={(value) =>
                  handleCashChange(index, {
                    vouch_notes: String(value),
                  })
                }
                onKeyDown={(e) =>
                  handleCashKeyDown(e, index, colIndex, {
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
              id={`cost-center-box-select-${index}`}
              ref={(el) => {
                if (el) {
                  const combobox = el.querySelector(
                    '[role="combobox"]',
                  ) as HTMLInputElement;

                  if (combobox) setInputRef(index, colIndex)(combobox);
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
                    handleCashKeyDown(
                      e as unknown as React.KeyboardEvent<HTMLInputElement>,
                      index,
                      colIndex,
                      {
                        isLastCol: false,
                      },
                    );
                  }
                }
              }}
            >
              <TableSelect<CostCenterOption>
                isDisabled={!isEditing}
                placeholder={t("tables.cash.columns.costCenter")}
                options={costCenterOptions}
                value={getCostCenterSelectValue(
                  {
                    ...cashItem,
                    cost_id: cashItem.cost_id,
                  } as unknown as import("@/types/voucher").VoucherDetail,
                  costCenters,
                )}
                onChange={(selectedOption) => {
                  if (!isEditing) return;
                  handleCashChange(index, {
                    cost_id: selectedOption?.value || 0,
                  });
                }}
              />
            </div>
          );
        })()}
      </td>
      <td className="p-0 border">
        {(() => {
          const colIndex = 4;

          return (
            <div
              ref={(el) => {
                if (el) {
                  const input = el.querySelector("input");

                  if (input) setInputRef(index, colIndex)(input);
                }
              }}
              className="w-full h-full"
            >
              <InputTable
                type="number"
                isEditing={isEditing}
                value={cashItem.inv_id || ""}
                onChange={(value) =>
                  handleCashChange(index, {
                    inv_id: value === "" ? null : Number(value),
                  })
                }
                onKeyDown={(e) =>
                  handleCashKeyDown(e, index, colIndex, {
                    isLastCol: true,
                  })
                }
              />
            </div>
          );
        })()}
      </td>
      <td className="p-1 border">
        <button
          className="font-bold text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          disabled={!isEditing || isRemoveDisabled}
          onClick={() => removeCashBox(index)}
        >
          ×
        </button>
      </td>
    </tr>
  );
};

export default React.memo(CashItemRow);
