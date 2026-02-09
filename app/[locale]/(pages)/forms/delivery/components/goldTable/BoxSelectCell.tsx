"use client";

import { useTranslations } from "next-intl";
import { memo, KeyboardEvent, useCallback } from "react";
import ReactSelect from "react-select";

type BoxOption = {
  value: number;
  label: string;
};

type BoxSelectCellProps = {
  index: number;
  isEditing: boolean;
  options: BoxOption[];
  value: BoxOption | null;
  placeholder?: string;
  onChange: (index: number, selectedOption: BoxOption | null) => void;
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

const COL_INDEX = 6;
const FOCUS_DELAY = 100;
const REF_DELAY = 50;
const NAVIGATION_KEYS = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"];

const selectStyles = {
  control: (base: object, state: { isDisabled: boolean }) => ({
    ...base,
    minHeight: "100%",
    height: "100%",
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    backgroundColor: "transparent",
    "&:hover": {
      border: "none",
      boxShadow: "none",
    },
  }),
  menuPortal: (base: object) => ({
    ...base,
    zIndex: 9999,
  }),
  valueContainer: (base: object) => ({
    ...base,
    padding: "0.125rem 0.25rem",
    height: "100%",
  }),
  input: (base: object) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),
};

const BoxSelectCell = ({
  index,
  isEditing,
  options,
  value,
  placeholder,
  onChange,
  onKeyDown,
  setInputRef,
  focusNextField,
}: BoxSelectCellProps) => {
  const t = useTranslations(
    "forms.customerGoldVoucher.tables.cash.placeholders",
  );

  const handleChange = useCallback(
    (selectedOption: BoxOption | null) => {
      if (!isEditing) return;

      onChange(index, selectedOption);
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
        onKeyDown(e as unknown as KeyboardEvent, index, COL_INDEX, {
          allowEnterDefaultWhenRowMissing: !value,
        });
      }
    },
    [index, value, onKeyDown],
  );

  const handleRef = useCallback(
    (el: HTMLDivElement | null) => {
      const refSetter = setInputRef(index, COL_INDEX);

      if (el) {
        setTimeout(() => {
          const selectButton = document.querySelector(`#box-select-${index}`);

          refSetter((selectButton as unknown as HTMLInputElement) || null);
        }, REF_DELAY);
      } else {
        refSetter(null);
      }
    },
    [index, setInputRef],
  );

  return (
    <div id={`gold-box-wrapper-${index}`} ref={handleRef} className="h-full">
      <ReactSelect
        isSearchable
        isClearable
        className="text-xs"
        classNamePrefix="react-select"
        components={{ IndicatorSeparator: () => null }}
        instanceId={`box-select-${index}`}
        isDisabled={!isEditing || options.length === 0}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        options={options}
        placeholder={placeholder || t("selectBox")}
        styles={selectStyles}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default memo(BoxSelectCell);
