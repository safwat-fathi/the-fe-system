"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback, type KeyboardEvent } from "react";
import ReactSelect from "react-select";

const NAVIGATION_KEYS = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"];
const COL_INDEX = 12; // Adjusted to match the column index in GoldRowTable (index 12)
const FOCUS_DELAY = 100;
const REF_DELAY = 50;

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
  option: (base: object) => ({
    ...base,
    fontSize: "12px",
  }),
  placeholder: (base: object) => ({
    ...base,
    fontSize: "12px",
  }),
  singleValue: (base: object) => ({
    ...base,
    fontSize: "12px",
  }),
};

type CostCenterSelectCellProps = {
  index: number;
  isEditing: boolean;
  options: { value: string; label: string }[];
  value: { value: string; label: string } | null;
  onChange: (
    index: number,
    selectedOption: { value: string; label: string } | null,
  ) => void;
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

const CostCenterSelectCell = ({
  index,
  isEditing,
  options,
  value,
  onChange,
  onKeyDown,
  setInputRef,
  focusNextField,
}: CostCenterSelectCellProps) => {
  const t = useTranslations(
    "forms.customerGoldVoucher.tables.gold.placeholders",
  );

  const handleChange = useCallback(
    (selectedOption: { value: string; label: string } | null) => {
      if (!isEditing) return;

      onChange(index, selectedOption);
      // Logic to focus next field could be different for the last column or handled by parent
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
          isLastCol: true,
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
          const selectButton = document.querySelector(
            `#cost-center-select-${index}`,
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
    <div id={`cost-center-wrapper-${index}`} ref={handleRef} className="h-full">
      <ReactSelect
        isSearchable
        isClearable
        className="text-xs"
        classNamePrefix="react-select"
        components={{ IndicatorSeparator: () => null }}
        instanceId={`cost-center-select-${index}`}
        isDisabled={!isEditing || options.length === 0}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        options={options}
        placeholder={t("selectCostCenter")}
        styles={selectStyles}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default memo(CostCenterSelectCell);
