"use client";

import type { GVoucherDetail } from "@/types/voucher";
import type { ItemSelectOption, FormItem as Item } from "../../useDeliveryForm";

import { useCallback, memo, KeyboardEvent } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";

const NAVIGATION_KEYS = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"];
const COL_INDEX = 0;
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
    cursor: state.isDisabled ? "not-allowed" : "default",
    backgroundColor: "transparent",
    "&:hover": {
      border: "none",
      boxShadow: "none",
    },
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
  menuPortal: (base: object) => ({
    ...base,
    zIndex: 9999,
  }),
};

type ItemSelectCellProps = {
  index: number;
  detail: GVoucherDetail;
  isEditing: boolean;
  items: Item[];
  placeholder: string;
  defaultOptions: ItemSelectOption[];
  value: ItemSelectOption | null;
  loadItemOptions: (
    search: string,
    loadedOptions: readonly ItemSelectOption[],
    additional: { page?: number },
  ) => Promise<ItemSelectOption[]>;
  onItemChange: (
    index: number,
    selectedOption: ItemSelectOption | null,
  ) => void;
  onKeyDown: (
    e: KeyboardEvent,
    index: number,
    colIndex: number,
    options?: { allowEnterDefaultWhenRowMissing?: boolean },
  ) => void;
  setInputRef: (
    index: number,
    colIndex: number,
  ) => (el: HTMLInputElement | null) => void;
  focusNextField: (index: number, colIndex: number) => void;
};

const ItemSelectCell = ({
  index,
  detail,
  isEditing,
  items,
  placeholder,
  defaultOptions,
  value,
  loadItemOptions,
  onItemChange,
  onKeyDown,
  setInputRef,
  focusNextField,
}: ItemSelectCellProps) => {
  const handleLoadOptions = useCallback(
    async (inputValue: string) => {
      try {
        const results = await loadItemOptions(inputValue, [], { page: 1 });

        return Array.isArray(results) ? results : [];
      } catch {
        return [];
      }
    },
    [loadItemOptions],
  );

  const handleChange = useCallback(
    (selectedOption: ItemSelectOption | null) => {
      if (!isEditing) return;

      if (!selectedOption) {
        onItemChange(index, null);

        return;
      }

      const selected: Item | undefined =
        selectedOption?.item ||
        items.find((itm) => itm.id === selectedOption?.value);

      if (selected) {
        onItemChange(index, {
          value: selected.id,
          label: `${selected.item_code ?? ""} - ${selected.item_name ?? ""}`,
          item: selected,
        });
        setTimeout(() => focusNextField(index, COL_INDEX), FOCUS_DELAY);
      }
    },
    [isEditing, index, items, onItemChange, focusNextField],
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
          allowEnterDefaultWhenRowMissing: !detail?.item_id,
        });
      }
    },
    [index, detail?.item_id, onKeyDown],
  );

  const handleRef = useCallback(
    (el: HTMLDivElement | null) => {
      const refSetter = setInputRef(index, COL_INDEX);

      if (el) {
        setTimeout(() => {
          const selectInput = document.querySelector(
            `#item-select-${index}`,
          ) as HTMLInputElement;

          refSetter(selectInput || null);
        }, REF_DELAY);
      } else {
        refSetter(null);
      }
    },
    [index, setInputRef],
  );

  return (
    <td className="p-0 border">
      <div
        id={`item-select-wrapper-${index}`}
        ref={handleRef}
        className="h-full"
      >
        <AsyncCreatableSelect
          isClearable
          isSearchable
          className="text-xs"
          classNamePrefix="select"
          components={{ IndicatorSeparator: () => null }}
          defaultOptions={defaultOptions.length > 0 ? defaultOptions : true}
          instanceId={`item-select-${index}`}
          isDisabled={!isEditing}
          loadOptions={handleLoadOptions}
          menuPortalTarget={
            typeof window !== "undefined" ? document.body : null
          }
          menuPosition="fixed"
          placeholder={placeholder}
          styles={selectStyles}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>
    </td>
  );
};

export default memo(ItemSelectCell);
