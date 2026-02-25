import type { VoucherDetail, AccountOption } from "@/types/voucher";
import type { Account } from "@/types/models/account";

import { memo, useCallback, useMemo, type KeyboardEvent } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";
import { type CSSObjectWithLabel } from "react-select";
import { useTranslations } from "next-intl";

import { useComboboxRef } from "@/hooks/useComboboxRef";

const selectStyles = {
  control: (base: CSSObjectWithLabel, isEditing: boolean) => ({
    ...base,
    minHeight: "100%",
    height: "100%",
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    cursor: !isEditing ? "not-allowed" : base.cursor,
    backgroundColor: "transparent",
    "&:hover": {
      border: "none",
      boxShadow: "none",
    },
  }),
  valueContainer: (base: CSSObjectWithLabel) => ({
    ...base,
    padding: "0.125rem 0.25rem",
    height: "100%",
  }),
  input: (base: CSSObjectWithLabel) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),
  menuPortal: (base: CSSObjectWithLabel) => ({
    ...base,
    zIndex: 9999,
  }),
};

interface AccountSelectCellProps {
  detail: VoucherDetail;
  index: number;
  isEditing: boolean;
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

const AccountSelectCell = memo(
  ({
    detail,
    index,
    isEditing,
    accounts,
    defaultAccountOptions,
    getAccountSelectValue,
    loadAccountOptions,
    updateAccountsList,
    updateDetail,
    handleKeyDownTable,
    focusNextField,
    setInputRef,
    colIndex,
  }: AccountSelectCellProps) => {
    const t = useTranslations("forms.balanceVoucher");
    const getComboboxRef = useComboboxRef();

    const accountValue = getAccountSelectValue(detail);
    const selectedAccountValue = accountValue
      ? typeof accountValue === "object"
        ? accountValue.value
        : accountValue
      : null;

    const optionsWithSelected = useMemo(() => {
      if (!selectedAccountValue) return defaultAccountOptions;

      const exists = defaultAccountOptions.some(
        (opt) => opt.value === selectedAccountValue,
      );

      if (exists) return defaultAccountOptions;

      const selectedLabel =
        accountValue && typeof accountValue === "object"
          ? accountValue.label
          : `حساب رقم: ${selectedAccountValue}`;

      return [
        ...defaultAccountOptions,
        {
          value: selectedAccountValue,
          label: selectedLabel,
          account:
            accounts.find((acc) => acc.id === selectedAccountValue) || null,
        },
      ];
    }, [defaultAccountOptions, selectedAccountValue, accountValue, accounts]);

    const handleAccountChange = useCallback(
      (selectedOption: Record<string, unknown> | null) => {
        if (!isEditing) return;
        const opt = selectedOption;
        const selected =
          (opt?.account as Account) ||
          accounts.find((acc) => acc.id === opt?.value);

        if (!selected) {
          updateDetail(index, "acc_id", null);
          updateDetail(index, "acc_code", "");
          updateDetail(index, "acc_name", "");

          setTimeout(() => {
            const moved = focusNextField(index, colIndex);

            if (!moved) {
              const firstDebitInput = document.querySelector(
                `input[data-row="${index}"][data-col="1"]`,
              ) as HTMLInputElement;

              if (firstDebitInput) {
                firstDebitInput.focus();
              }
            }
          }, 100);

          return;
        }

        if (!accounts.find((a) => a.id === selected.id)) {
          updateAccountsList(selected);
        }

        updateDetail(index, "acc_id", selected.id ?? null);
        updateDetail(index, "acc_code", (selected.acc_code ?? "") as string);
        updateDetail(index, "acc_name", (selected.acc_name ?? "") as string);

        setTimeout(() => {
          const moved = focusNextField(index, colIndex);

          if (!moved) {
            const selectButton = document.querySelector(
              `#account-select-${index}`,
            ) as HTMLButtonElement;

            if (selectButton) {
              const syntheticEvent = {
                key: "Enter",
                preventDefault: () => {},
                stopPropagation: () => {},
                target: selectButton,
                currentTarget: selectButton,
                nativeEvent: {} as unknown,
                bubbles: true,
                cancelable: true,
                defaultPrevented: false,
                eventPhase: 0,
                isTrusted: false,
                timeStamp: Date.now(),
                type: "keydown",
              } as unknown as KeyboardEvent<HTMLElement>;

              handleKeyDownTable(syntheticEvent, index, colIndex, {
                allowEnterDefaultWhenRowMissing: true,
              });
            }
          }
        }, 100);
      },
      [
        isEditing,
        accounts,
        updateDetail,
        updateAccountsList,
        focusNextField,
        handleKeyDownTable,
        index,
        colIndex,
      ],
    );

    const handleAccountKeyDown = useCallback(
      (e: KeyboardEvent<HTMLElement>) => {
        const target = e.target as HTMLElement | null;

        if (!target) return;

        const isInListbox = target.closest('[role="listbox"]');

        if (isInListbox) return;

        if (e.key === "Escape") return;

        if (e.key === "Enter") {
          const selectButton = target.closest('[role="combobox"]');
          const isExpanded =
            selectButton?.getAttribute("aria-expanded") === "true";

          if (isExpanded) return;

          if (!isExpanded) {
            e.preventDefault();
            e.stopPropagation();
            handleKeyDownTable(e, index, colIndex, {
              allowEnterDefaultWhenRowMissing: !detail?.acc_id,
            });

            return;
          }
        }

        if (
          e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight"
        ) {
          const selectButton = target.closest('[role="combobox"]');
          const isExpanded =
            selectButton?.getAttribute("aria-expanded") === "true";

          if (!isExpanded) {
            e.preventDefault();
            e.stopPropagation();
            handleKeyDownTable(e, index, colIndex);

            return;
          }
        }
      },
      [handleKeyDownTable, index, colIndex, detail?.acc_id],
    );

    const handleMenuOpen = useCallback(() => {
      setTimeout(() => {
        const combobox = document.querySelector(
          `#account-select-${index} [role="combobox"]`,
        ) as HTMLElement;

        if (combobox && document.activeElement !== combobox) {
          combobox.focus();
        }
      }, 0);
    }, [index]);

    const accountStyles = useMemo(
      () => ({
        control: (base: CSSObjectWithLabel) =>
          selectStyles.control(base, isEditing),
        valueContainer: selectStyles.valueContainer,
        input: selectStyles.input,
        menuPortal: selectStyles.menuPortal,
      }),
      [isEditing],
    );

    return (
      <td className="p-0 border">
        <div
          id={`account-select-${index}`}
          ref={getComboboxRef(setInputRef(index, colIndex))}
          className="h-full"
        >
          <AsyncCreatableSelect
            isClearable
            isSearchable
            cacheOptions
            className="text-xs"
            classNamePrefix="select"
            components={{ IndicatorSeparator: () => null }}
            defaultOptions={optionsWithSelected}
            formatCreateLabel={(inputValue: string) =>
              t("table.addAccountLabel", { value: inputValue })
            }
            instanceId={`account-select-${index}`}
            isDisabled={!isEditing}
            loadOptions={loadAccountOptions}
            menuPortalTarget={
              typeof window !== "undefined" ? document.body : null
            }
            menuPosition="fixed"
            placeholder={t("table.columns.accountPlaceholder")}
            styles={accountStyles}
            value={accountValue}
            onChange={handleAccountChange as (opt: unknown) => void}
            onKeyDown={handleAccountKeyDown}
            onMenuOpen={handleMenuOpen}
          />
        </div>
      </td>
    );
  },
);

AccountSelectCell.displayName = "AccountSelectCell";

export default AccountSelectCell;
