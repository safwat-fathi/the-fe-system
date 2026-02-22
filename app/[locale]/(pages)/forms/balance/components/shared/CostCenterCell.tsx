import { memo, useCallback, useMemo, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import SelectBalance from "./SelectBalance";

interface CostCenterCellProps {
  detail: { cost_id?: number | null };
  index: number;
  isEditing: boolean;
  costCenters: { value: string; label: string }[];
  updateDetail: (index: number, field: string, value: unknown) => void;
  handleKeyDownTable: (
    e: KeyboardEvent<HTMLElement>,
    index: number,
    colIndex: number,
    options?: Record<string, unknown>,
  ) => void;
  focusNextField: (index: number, colIndex: number) => boolean;
  setInputRef: (
    rowIndex: number,
    colIndex: number,
  ) => (el: HTMLInputElement | null) => void;
  colIndex: number;
}

const CostCenterCell = memo(
  ({
    detail,
    index,
    isEditing,
    costCenters,
    updateDetail,
    handleKeyDownTable,
    focusNextField,
    setInputRef,
    colIndex,
  }: CostCenterCellProps) => {
    const t = useTranslations("forms.balanceVoucher");

    const handleChange = useCallback(
      (selectedOption: { value: string } | null) => {
        if (!isEditing) return;
        updateDetail(
          index,
          "cost_id",
          selectedOption?.value ? parseInt(selectedOption.value) : null,
        );
        setTimeout(() => {
          const moved = focusNextField(index, colIndex);

          if (!moved) {
            const selectButton = document.querySelector(
              `#cost-center-detail-select-${index} [role="combobox"]`,
            ) as HTMLElement;

            if (selectButton) {
              const syntheticEvent = {
                key: "Enter",
                preventDefault: () => {},
                stopPropagation: () => {},
                target: selectButton,
                currentTarget: selectButton,
              } as unknown as KeyboardEvent<HTMLElement>;

              handleKeyDownTable(syntheticEvent, index, colIndex);
            }
          }
        }, 100);
      },
      [
        isEditing,
        updateDetail,
        focusNextField,
        handleKeyDownTable,
        index,
        colIndex,
      ],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const selectButton = target.closest('[role="combobox"]');
        const isInListbox = target.closest('[role="listbox"]');

        if (isInListbox) return;

        if (selectButton) {
          const isExpanded =
            selectButton.getAttribute("aria-expanded") === "true";

          if (e.key === "Enter" && !isExpanded) {
            e.preventDefault();
            e.stopPropagation();
            handleKeyDownTable(
              e as unknown as KeyboardEvent<HTMLElement>,
              index,
              colIndex,
            );
          }
        }
      },
      [handleKeyDownTable, index, colIndex],
    );

    const value = useMemo(() => {
      if (detail.cost_id == null) return null;

      return (
        costCenters.find((c) => Number(c.value) === Number(detail.cost_id)) ||
        null
      );
    }, [detail.cost_id, costCenters]);

    return (
      <td className="p-0 border">
        <div
          id={`cost-center-detail-select-${index}`}
          ref={(el) => {
            if (setInputRef) {
              const refSetter = setInputRef(index, colIndex);

              if (el) {
                const findAndSetRef = () => {
                  const combobox = el.querySelector('[role="combobox"]');

                  if (combobox) {
                    refSetter(combobox as unknown as HTMLInputElement);

                    return true;
                  }

                  return false;
                };

                if (!findAndSetRef()) {
                  setTimeout(findAndSetRef, 100);
                }
              } else {
                refSetter(null);
              }
            }
          }}
        >
          <SelectBalance
            instanceId={`cost-center-detail-select-${index}`}
            isDisabled={!isEditing}
            options={costCenters}
            placeholder={t("table.columns.costCenterPlaceholder")}
            value={value}
            onChange={handleChange as (opt: unknown) => void}
            onKeyDown={handleKeyDown}
          />
        </div>
      </td>
    );
  },
);

CostCenterCell.displayName = "CostCenterCell";

export default CostCenterCell;
