"use client";

import type { VoucherBox } from "@/types/voucher";

import { useTranslations } from "next-intl";
import { memo, useCallback, type KeyboardEvent } from "react";
import ReactSelect, { SingleValue } from "react-select";

import { tableSelectStyles } from "../../constants/selectStyles";

type BoxOption = {
  value: number;
  label: string;
};

type BoxSelectCellProps = {
  index: number;
  isEditing: boolean;
  options: BoxOption[];
  value: BoxOption | null;
  onChange: (index: number, field: keyof VoucherBox, value: number) => void;
  onKeyDown: (
    e: KeyboardEvent,
    index: number,
    colIndex: number,
    options?: object,
  ) => void;
  setInputRef: (
    index: number,
    colIndex: number,
  ) => (el: HTMLInputElement | null) => void;
  focusNextField: (index: number, colIndex: number) => void;
};

const COL_INDEX = 1;
const FOCUS_DELAY = 100;
const REF_DELAY = 50;
const NAVIGATION_KEYS = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"];

const BoxSelectCell = ({
  index,
  isEditing,
  options,
  value,
  onChange,
  onKeyDown,
  setInputRef,
  focusNextField,
}: BoxSelectCellProps) => {
  const t = useTranslations(
    "forms.customerGoldVoucher.tables.cash.placeholders",
  );

  const handleChange = useCallback(
    (newValue: SingleValue<BoxOption>) => {
      if (!isEditing) return;

      const boxId = newValue?.value ?? 0;

      onChange(index, "box_id", boxId);
      setTimeout(() => focusNextField(index, COL_INDEX), FOCUS_DELAY);
    },
    [isEditing, index, onChange, focusNextField],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;

      if (!target) return;

      if (target.closest('[role="listbox"]') || e.key === "Escape") return;

      const selectButton = target.closest('[role="combobox"]');
      const isExpanded = selectButton?.getAttribute("aria-expanded") === "true";

      if (NAVIGATION_KEYS.includes(e.key)) {
        if (!isExpanded) {
          onKeyDown(e as unknown as KeyboardEvent, index, COL_INDEX);
        }

        return;
      }

      if (e.key === "Enter" && !isExpanded) {
        e.preventDefault();
        e.stopPropagation();
        onKeyDown(e as unknown as KeyboardEvent, index, COL_INDEX);
      }
    },
    [index, onKeyDown],
  );

  const handleRef = useCallback(
    (el: HTMLDivElement | null) => {
      const refSetter = setInputRef(index, COL_INDEX);

      if (el) {
        setTimeout(() => {
          const selectButton = document.querySelector(
            `#cash-box-select-${index}`,
          );

          refSetter((selectButton as unknown as HTMLInputElement) || null);
        }, REF_DELAY);
      } else {
        refSetter(null);
      }
    },
    [index, setInputRef],
  );

  return (
    <div id={`cash-box-wrapper-${index}`} ref={handleRef} className="h-full">
      <ReactSelect<BoxOption>
        isSearchable
        className="text-xs"
        classNamePrefix="react-select"
        components={{ IndicatorSeparator: () => null }}
        instanceId={`cash-box-select-${index}`}
        isDisabled={!isEditing || options.length === 0}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        options={options}
        placeholder={t("selectBox")}
        styles={tableSelectStyles}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default memo(BoxSelectCell);
