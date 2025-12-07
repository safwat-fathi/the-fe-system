"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import AsyncCreatableSelect from "react-select/async-creatable";
import ReactSelect, { type CSSObjectWithLabel } from "react-select";
import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@heroui/react";
import {
  ArrowsPointingOutIcon,
  CheckIcon,
  PencilIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { useTranslations, useLocale } from "next-intl";

import useEnterKeyNavigation from "../invoices/hooks/useEnterKeyNavigation";

import { getLocaleDir } from "@/i18n/config";
import { ConfirmationModal } from "@/components/Modal";
import { RiyalIcon } from "@/components/RiyalIcon";
import useKeyAsTab from "@/hooks/useKeyAsTab";
import { useBalanceVoucherForm } from "@/hooks/useBalanceVoucherForm";
import { formatAmount } from "@/utilities/formatAmount";

import "bootstrap-icons/font/bootstrap-icons.css";

export interface BalanceVoucherClientPageProps {
  voucherData?: any;
  voucherDetailsData?: any[];
  formData: any;
  formMode?: "new" | "edit" | "preview";
  voucherRecordId?: number | string | null;
  isNewVoucher?: boolean;
  startInEditMode?: boolean;
}

type BasicSelectOption = {
  value: string;
  label: string;
};

export default function BalanceVoucherClientPage({
  voucherData,
  voucherDetailsData,
  formData,
  formMode: initialFormMode = "new",
  voucherRecordId,
  isNewVoucher = true,
  startInEditMode: propStartInEditMode,
}: BalanceVoucherClientPageProps) {
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("forms.balanceVoucher");

  // Dynamic text alignment classes based on locale
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const textAlignCenter = "text-center";

  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || initialFormMode;
  const formMode = (
    mode === "new" ? "new" : mode === "edit" ? "edit" : "preview"
  ) as "new" | "edit" | "preview";

  // حالة المودال لتوسيع البيان
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  // Use the hook for all state management and business logic
  const {
    // State
    voucher,
    setVoucher,
    details,
    accounts,
    costCenters,
    voucherTypes,
    isLoading,
    isEditing,
    isPrinting,
    showUnbalancedModal,
    defaultAccountOptions,

    // Totals and balances
    totals,
    cashBalance,
    goldBalance,
    isCashBalanced,
    isGoldBalanced,
    isBalanced,

    // Functions
    addDetailRow,
    removeDetailRow,
    updateDetail,
    handleMasterCostChange,
    saveVoucher,
    printVoucher,
    handleEditClick,
    loadAccountOptions,
    getAccountSelectValue,
    updateAccountsList,
    handleUnbalancedConfirm,
    handleUnbalancedCancel,
  } = useBalanceVoucherForm({
    voucherData,
    voucherDetailsData,
    formData,
    formMode,
    voucherRecordId,
    isNewVoucher,
    startInEditMode: propStartInEditMode,
  });

  const costCenterSelectOptions = useMemo<BasicSelectOption[]>(() => {
    return (costCenters || []).map((center) => ({
      value: String(center.id),
      label: center.name || center.cost_name || `مركز ${center.id}`,
    }));
  }, [costCenters]);

  const getCostCenterSelectValue = useCallback(
    (costId?: number | null) => {
      if (costId === null || costId === undefined) {
        return null;
      }

      return (
        costCenterSelectOptions.find(
          (option) => Number(option.value) === Number(costId),
        ) ?? null
      );
    },
    [costCenterSelectOptions],
  );

  // استخدام defaultAccountOptions مباشرة (تم تحسينها في useBalanceVoucherForm)
  const accountDefaultOptions = defaultAccountOptions;

  // Refs for keyboard navigation
  const selectorsRef = useRef<HTMLDivElement>(null);

  // Hook for Enter key navigation in top form fields
  const { handleKeyDown: handleKeyDownSelectors } = useKeyAsTab({
    keys: ["Enter"],
    containerRef: selectorsRef,
    disabled: !isEditing,
    shouldIgnoreEvent: (event) => {
      const target = event.target as HTMLElement | null;

      if (!target) return false;

      // Ignore elements with data-skip-key-as-tab="true"
      if (target.closest("[data-skip-key-as-tab='true']")) {
        return true;
      }

      // Ignore textareas and buttons
      const tagName = target.tagName.toLowerCase();

      if (tagName === "textarea" || tagName === "button") {
        return true;
      }

      // Ignore if inside an open dropdown list
      const listboxElement = target.closest('[role="listbox"]');

      if (listboxElement) {
        return true;
      }

      // Ignore if inside an open popover or dropdown
      const popoverElement = target.closest(
        '[role="dialog"], [role="menu"], [data-headlessui-state]',
      );

      if (popoverElement) {
        return true;
      }

      // Ignore select button itself when Enter is pressed (don't open it)
      const selectButton = target.closest('[role="combobox"]');

      if (selectButton) {
        const isExpanded =
          selectButton.getAttribute("aria-expanded") === "true";

        if (!isExpanded) {
          return true; // Ignore select on Enter if closed
        }
      }

      return false;
    },
    filterElement: (element) => {
      // Exclude elements with tabIndex={-1}
      if (element.tabIndex === -1) {
        return false;
      }

      // Exclude buttons with data-skip-key-as-tab="true"
      if (element.tagName.toLowerCase() === "button") {
        if (
          element.hasAttribute("data-skip-key-as-tab") ||
          element.closest("[data-skip-key-as-tab='true']")
        ) {
          return false;
        }
      }

      // Skip Cost Center select from navigation
      const selectButton = element.closest('[role="combobox"]');

      if (selectButton) {
        const selectContainer = selectButton.closest(
          '[class*="flex flex-col gap-1"]',
        );

        if (
          selectContainer &&
          selectContainer
            .querySelector("label")
            ?.textContent?.includes("مركز التكلفة")
        ) {
          return false;
        }
      }

      return true;
    },
  });

  // Hook for Enter key navigation in table rows
  const { setInputRef, handleKeyDown: handleKeyDownTable } =
    useEnterKeyNavigation({
      rows: details,
      rowHasValue: (row) => {
        return !!(
          row?.acc_id ||
          (row?.debit && row.debit > 0) ||
          (row?.credit && row.credit > 0) ||
          (row?.g_debit && row.g_debit > 0) ||
          (row?.g_credit && row.g_credit > 0)
        );
      },
      onAddRow: addDetailRow,
    });

  // دالة مساعدة للانتقال للحقل التالي مباشرة
  const focusNextField = useCallback((rowIndex: number, colIndex: number) => {
    // البحث عن input التالي مباشرة
    const nextCol = colIndex + 1;
    const nextInput = document.querySelector(
      `input[data-row="${rowIndex}"][data-col="${nextCol}"]`,
    ) as HTMLInputElement;

    if (nextInput) {
      nextInput.focus();
      nextInput.select?.();

      return true;
    }

    return false;
  }, []);

  return (
    <div className="p-1 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header - رأس القيد مع الأزرار */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-1.5 mb-1 border border-slate-200">
        {/* الصف الأول: معلومات القيد */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div>
              <h1
                className={`text-lg font-bold text-slate-800 flex items-center gap-2 ${textAlign}`}
              >
                <span>
                  {voucherTypes.find((type) => type.id === voucher.vouch_type)
                    ?.name || t("messages.voucherType")}
                </span>
                <span className="text-slate-600 font-medium">
                  #
                  {voucher.vouch_id &&
                  Number(voucher.vouch_id) > 0 &&
                  isFinite(Number(voucher.vouch_id))
                    ? Number(voucher.vouch_id)
                    : voucher.id
                      ? `DB-${voucher.id}`
                      : t("messages.numbering")}
                </span>
                <span
                  className={`text-sm text-slate-600 font-medium flex items-center gap-1 ${textAlign}`}
                >
                  <i className="bi bi-calendar3 w-4 h-4 text-slate-500" />
                  {new Date(voucher.vouch_date).toLocaleString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* الصف الثاني: الأزرار والحالة */}
        <div className="flex items-center justify-between">
          {/* الأزرار من اليسار لليمين */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              className="h-7 px-3 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm"
              isDisabled={!isEditing}
              isLoading={isLoading}
              startContent={
                !isLoading ? <CheckIcon className="w-4 h-4" /> : undefined
              }
              variant="solid"
              onPress={saveVoucher}
            >
              {t("actions.save")}
            </Button>

            <Button
              className="h-7 px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
              isDisabled={formMode === "new" || isEditing || isLoading}
              startContent={<PencilIcon className="w-4 h-4 text-slate-500" />}
              variant="solid"
              onPress={handleEditClick}
            >
              {t("actions.edit")}
            </Button>

            <Button
              className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              isDisabled={!voucher.vouch_id || Number(voucher.vouch_id) <= 0}
              isLoading={isPrinting}
              startContent={
                !isPrinting ? <PrinterIcon className="w-4 h-4" /> : undefined
              }
              variant="solid"
              onPress={printVoucher}
            >
              {t("actions.print")}
            </Button>
          </div>

          {/* حالة القيد */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <Checkbox
                color="success"
                isDisabled
                isSelected={voucher.commit}
                size="sm"
              />
              <span className={`text-xs text-slate-600 ${textAlign}`}>
                {t("status.committed")}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Checkbox
                color="warning"
                isDisabled
                isSelected={voucher.post}
                size="sm"
              />
              <span className={`text-xs text-slate-600 ${textAlign}`}>
                {t("status.posted")}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Checkbox
                color="warning"
                isDisabled
                isSelected={voucher.print}
                size="sm"
              />
              <span className={`text-xs text-slate-600 ${textAlign}`}>
                {t("status.printed")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form - نموذج بيانات القيد */}
      <div className="bg-white rounded-lg border border-slate-200 mb-1.5">
        <div
          ref={selectorsRef}
          className="p-1"
          onKeyDownCapture={handleKeyDownSelectors}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5">
            {/* رقم المرجع - أضيق */}
            <div className="flex flex-col gap-0.5 md:col-span-2">
              <label
                className={`text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
                htmlFor="balance-ref-no"
              >
                {t("fields.refNo")}
              </label>
              <input
                className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 disabled:cursor-not-allowed disabled:bg-slate-50"
                disabled={!isEditing}
                id="balance-ref-no"
                placeholder={t("fields.refNoPlaceholder")}
                readOnly={!isEditing}
                value={voucher.ref_no || ""}
                onChange={(e) =>
                  setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))
                }
              />
            </div>

            {/* تاريخ ووقت القيد - توسع قليلاً */}
            <div className="flex flex-col gap-0.5 md:col-span-3">
              <label
                className={`text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
                htmlFor="balance-vouch-datetime"
              >
                {t("fields.vouchDateTime")}
              </label>
              <input
                className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 disabled:cursor-not-allowed disabled:bg-slate-50"
                disabled={!isEditing}
                id="balance-vouch-datetime"
                readOnly={!isEditing}
                type="datetime-local"
                value={
                  voucher.vouch_date
                    ? new Date(voucher.vouch_date).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setVoucher((prev) => ({
                    ...prev,
                    vouch_date: e.target.value,
                  }))
                }
              />
            </div>

            {costCenters.length > 0 && (
              <div className="flex flex-col gap-0.5 md:col-span-2">
                <label
                  className={`text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
                  htmlFor="balance-cost-center-select"
                >
                  {t("fields.costCenter")}
                </label>
                <div>
                  <ReactSelect
                    isSearchable
                    className="text-xs"
                    classNamePrefix="react-select"
                    components={{ IndicatorSeparator: () => null }}
                    instanceId="balance-cost-center-select"
                    isDisabled={!isEditing || costCenters.length === 0}
                    menuPortalTarget={
                      typeof window !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                    options={costCenterSelectOptions}
                    placeholder={t("fields.costCenterPlaceholder")}
                    styles={{
                      control: (base: CSSObjectWithLabel) => ({
                        ...base,
                        minHeight: "32px",
                        height: "32px",
                        fontSize: "12px",
                      }),
                      menuPortal: (base: CSSObjectWithLabel) => ({
                        ...base,
                        zIndex: 9999,
                      }),
                      option: (base: CSSObjectWithLabel) => ({
                        ...base,
                        fontSize: "12px",
                      }),
                      placeholder: (base: CSSObjectWithLabel) => ({
                        ...base,
                        fontSize: "12px",
                      }),
                      singleValue: (base: CSSObjectWithLabel) => ({
                        ...base,
                        fontSize: "12px",
                      }),
                    }}
                    value={getCostCenterSelectValue(voucher.cost_id)}
                    onChange={(selectedOption: any) => {
                      if (!isEditing) return;
                      const selected = selectedOption?.value
                        ? Number(selectedOption.value)
                        : null;

                      handleMasterCostChange(
                        selected !== null && Number.isFinite(selected)
                          ? selected
                          : null,
                      );
                    }}
                    onKeyDown={(e: ReactKeyboardEvent<HTMLElement>) => {
                      const target = e.target as HTMLElement | null;

                      if (!target) return;

                      const isInListbox = target.closest('[role="listbox"]');

                      if (isInListbox) {
                        return;
                      }

                      const selectButton = target.closest('[role="combobox"]');

                      if (selectButton) {
                        const isExpanded =
                          selectButton.getAttribute("aria-expanded") === "true";

                        // إذا كانت القائمة مفتوحة، نسمح بالتفاعل الطبيعي
                        if (isExpanded && e.key !== "Escape") {
                          return;
                        }

                        if (e.key === "Enter" && !isExpanded) {
                          e.preventDefault();
                          e.stopPropagation();
                          const notesInput =
                            selectorsRef.current?.querySelector(
                              'input[placeholder*="بيان"]',
                            ) as HTMLInputElement;

                          if (notesInput) {
                            notesInput.focus();
                          }
                        }

                        if (e.key === "Escape") {
                          return;
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* البيان - أوسع مع زر توسيع */}
            <div
              className={`flex flex-col gap-0.5 ${
                costCenters.length > 0 ? "md:col-span-5" : "md:col-span-7"
              }`}
            >
              <label
                className={`text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
                htmlFor="balance-vouch-notes"
              >
                {t("fields.notes")}
              </label>
              <div className="relative">
                <input
                  className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 pr-8 disabled:cursor-not-allowed disabled:bg-slate-50"
                  disabled={!isEditing}
                  id="balance-vouch-notes"
                  placeholder={t("fields.notesPlaceholder")}
                  readOnly={!isEditing}
                  value={voucher.vouch_notes || ""}
                  onChange={(e) =>
                    setVoucher((prev) => ({
                      ...prev,
                      vouch_notes: e.target.value,
                    }))
                  }
                  onDoubleClick={() => {
                    if (isEditing) {
                      setIsNotesModalOpen(true);
                    }
                  }}
                  onKeyDown={(e: ReactKeyboardEvent<HTMLElement>) => {
                    if (e.key === "Enter" && !e.isDefaultPrevented()) {
                      e.preventDefault();
                      e.stopPropagation();
                      setTimeout(() => {
                        const firstAccountInput = document.querySelector(
                          `#account-input-0-0, #account-select-0 input`,
                        ) as HTMLElement;

                        if (firstAccountInput) {
                          firstAccountInput.focus();

                          return;
                        }
                        const firstDebitInput = document.querySelector(
                          `input[data-row="0"][data-col="1"]`,
                        ) as HTMLInputElement;

                        if (firstDebitInput) {
                          firstDebitInput.focus();
                        }
                      }, 50);
                    }
                  }}
                />
                {isEditing && (
                  <button
                    className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all duration-200"
                    data-skip-key-as-tab="true"
                    tabIndex={-1}
                    title={t("actions.expandNotes")}
                    type="button"
                    onClick={() => setIsNotesModalOpen(true)}
                  >
                    <ArrowsPointingOutIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Table - جدول تفاصيل القيد */}
      <div className="bg-white rounded-lg border border-slate-200 mb-1.5">
        <div className="p-0.5">
          <div className="flex justify-between items-center mb-0.5">
            <button
              className={`text-xs px-2 py-0.5 btn ${textAlign}`}
              data-skip-key-as-tab="true"
              disabled={!isEditing}
              tabIndex={-1}
              type="button"
              onClick={addDetailRow}
            >
              {t("actions.addRow")}
            </button>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                isBalanced
                  ? "bg-emerald-200 text-emerald-900"
                  : "bg-red-200 text-red-900"
              }`}
            >
              <i
                className={`bi ${isBalanced ? "bi-check-circle" : "bi-exclamation-triangle"} me-0.5`}
              />
              {isBalanced ? t("status.balanced") : t("status.unbalanced")}
            </span>
          </div>
          <div className="overflow-x-auto mb-0.5 max-w-full">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="min-w-[1400px] border text-xs text-center table-fixed">
                <thead className="sticky top-0 z-10 bg-gray-100 text-xs font-bold">
                  <tr>
                    <th
                      className={`w-64 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                      rowSpan={2}
                    >
                      {t("table.columns.account")}
                    </th>
                    <th
                      className={`w-40 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                      colSpan={2}
                    >
                      {t("table.columns.cash")}
                    </th>
                    <th
                      className={`w-40 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                      colSpan={2}
                    >
                      {t("table.columns.goldStanding")}
                    </th>
                    <th
                      className={`w-20 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                      rowSpan={2}
                    >
                      {t("table.columns.gauge")}
                    </th>
                    <th
                      className={`w-40 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                      colSpan={2}
                    >
                      {t("table.columns.goldCalibrated")}
                    </th>
                    {costCenters.length > 0 && (
                      <th
                        className={`w-40 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                        rowSpan={2}
                      >
                        {t("table.columns.costCenter")}
                      </th>
                    )}
                    <th
                      className={`w-48 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                      rowSpan={2}
                    >
                      {t("table.columns.notes")}
                    </th>
                    <th
                      className={`w-12 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                      rowSpan={2}
                    >
                      {t("table.columns.delete")}
                    </th>
                  </tr>
                  <tr>
                    <th
                      className={`w-20 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                    >
                      {t("table.columns.cashDebit")}
                    </th>
                    <th
                      className={`w-20 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                    >
                      {t("table.columns.cashCredit")}
                    </th>
                    <th
                      className={`w-20 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                    >
                      {t("table.columns.goldStandingDebit")}
                    </th>
                    <th
                      className={`w-20 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                    >
                      {t("table.columns.goldStandingCredit")}
                    </th>
                    <th
                      className={`w-20 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                    >
                      {t("table.columns.goldCalibratedDebit")}
                    </th>
                    <th
                      className={`w-20 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                    >
                      {t("table.columns.goldCalibratedCredit")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail, index) => {
                    let currentColIndex = -1;

                    return (
                      <tr
                        key={index}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="p-0 border">
                          {(() => {
                            const thisCol = ++currentColIndex; // 0

                            // الحصول على القيمة المحددة
                            const accountValue = getAccountSelectValue(detail);
                            const selectedAccountValue = accountValue
                              ? typeof accountValue === "object"
                                ? accountValue.value
                                : accountValue
                              : null;

                            // إضافة القيمة المحددة إلى accountDefaultOptions إذا لم تكن موجودة
                            let optionsWithSelected = accountDefaultOptions;

                            if (selectedAccountValue) {
                              const exists = accountDefaultOptions.some(
                                (opt) => opt.value === selectedAccountValue,
                              );

                              if (!exists) {
                                // إضافة القيمة المحددة كخيار
                                const selectedLabel =
                                  accountValue &&
                                  typeof accountValue === "object"
                                    ? accountValue.label
                                    : `حساب رقم: ${selectedAccountValue}`;

                                optionsWithSelected = [
                                  ...accountDefaultOptions,
                                  {
                                    value: selectedAccountValue,
                                    label: selectedLabel,
                                    account:
                                      accounts.find(
                                        (acc) =>
                                          acc.id === selectedAccountValue,
                                      ) || null,
                                  },
                                ];
                              }
                            }

                            return (
                              <div
                                id={`account-select-${index}`}
                                ref={(el) => {
                                  const refSetter = setInputRef(index, thisCol);

                                  if (el) {
                                    // البحث عن combobox مباشرة
                                    const findAndSetRef = () => {
                                      const combobox = el.querySelector(
                                        '[role="combobox"]',
                                      ) as HTMLElement;

                                      if (combobox) {
                                        refSetter(
                                          combobox as unknown as HTMLInputElement,
                                        );

                                        return true;
                                      }

                                      return false;
                                    };

                                    // محاولة فورية
                                    if (!findAndSetRef()) {
                                      // محاولة بعد requestAnimationFrame
                                      requestAnimationFrame(() => {
                                        if (!findAndSetRef()) {
                                          // محاولة بعد setTimeout
                                          setTimeout(() => {
                                            findAndSetRef();
                                          }, 10);
                                        }
                                      });
                                    }

                                    // محاولات إضافية
                                    setTimeout(() => {
                                      findAndSetRef();
                                    }, 100);
                                  } else {
                                    refSetter(null);
                                  }
                                }}
                                className="h-full"
                              >
                                <AsyncCreatableSelect
                                  isClearable
                                  isSearchable
                                  className="text-xs"
                                  classNamePrefix="select"
                                  components={{
                                    IndicatorSeparator: () => null,
                                  }}
                                  defaultOptions={optionsWithSelected}
                                  formatCreateLabel={(inputValue: string) =>
                                    t("table.addAccountLabel", {
                                      value: inputValue,
                                    })
                                  }
                                  instanceId={`account-select-${index}`}
                                  isDisabled={!isEditing}
                                  loadOptions={loadAccountOptions}
                                  cacheOptions
                                  menuPortalTarget={
                                    typeof window !== "undefined"
                                      ? document.body
                                      : null
                                  }
                                  menuPosition="fixed"
                                  placeholder={t(
                                    "table.columns.accountPlaceholder",
                                  )}
                                  onMenuOpen={() => {
                                    setTimeout(() => {
                                      const combobox = document.querySelector(
                                        `#account-select-${index} [role="combobox"]`,
                                      ) as HTMLElement;

                                      if (
                                        combobox &&
                                        document.activeElement !== combobox
                                      ) {
                                        combobox.focus();
                                      }
                                    }, 0);
                                  }}
                                  styles={{
                                    control: (base: CSSObjectWithLabel) => ({
                                      ...base,
                                      minHeight: "100%",
                                      height: "100%",
                                      border: "none",
                                      borderRadius: 0,
                                      boxShadow: "none",
                                      cursor: !isEditing
                                        ? "not-allowed"
                                        : base.cursor,
                                      backgroundColor: "transparent",
                                      "&:hover": {
                                        border: "none",
                                        boxShadow: "none",
                                      },
                                    }),
                                    valueContainer: (
                                      base: CSSObjectWithLabel,
                                    ) => ({
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
                                  }}
                                  value={getAccountSelectValue(detail)}
                                  onChange={(selectedOption: any) => {
                                    if (!isEditing) return;
                                    const opt: any = selectedOption;
                                    const selected =
                                      opt?.account ||
                                      accounts.find(
                                        (acc) => acc.id === opt?.value,
                                      );

                                    if (!selected) {
                                      // إذا تم مسح الحساب
                                      updateDetail(index, "acc_id", null);
                                      updateDetail(index, "acc_code", "");
                                      updateDetail(index, "acc_name", "");

                                      setTimeout(() => {
                                        const moved = focusNextField(
                                          index,
                                          thisCol,
                                        );

                                        if (!moved) {
                                          const firstDebitInput =
                                            document.querySelector(
                                              `input[data-row="${index}"][data-col="1"]`,
                                            ) as HTMLInputElement;

                                          if (firstDebitInput) {
                                            firstDebitInput.focus();
                                          }
                                        }
                                      }, 100);

                                      return;
                                    }

                                    if (
                                      !accounts.find(
                                        (a) => a.id === selected.id,
                                      )
                                    ) {
                                      updateAccountsList(selected);
                                    }

                                    updateDetail(
                                      index,
                                      "acc_id",
                                      selected.id ?? null,
                                    );
                                    updateDetail(
                                      index,
                                      "acc_code",
                                      selected.acc_code ?? selected.code ?? "",
                                    );
                                    updateDetail(
                                      index,
                                      "acc_name",
                                      selected.acc_name ?? selected.name ?? "",
                                    );

                                    // الانتقال للحقل التالي بعد اختيار الحساب
                                    setTimeout(() => {
                                      const moved = focusNextField(
                                        index,
                                        thisCol,
                                      );

                                      if (!moved) {
                                        const selectButton =
                                          document.querySelector(
                                            `#account-select-${index}`,
                                          ) as HTMLButtonElement;

                                        if (selectButton) {
                                          const syntheticEvent = {
                                            key: "Enter",
                                            preventDefault: () => {},
                                            stopPropagation: () => {},
                                            target: selectButton,
                                            currentTarget: selectButton,
                                            nativeEvent: {} as any,
                                            bubbles: true,
                                            cancelable: true,
                                            defaultPrevented: false,
                                            eventPhase: 0,
                                            isTrusted: false,
                                            timeStamp: Date.now(),
                                            type: "keydown",
                                          } as unknown as ReactKeyboardEvent;

                                          handleKeyDownTable(
                                            syntheticEvent,
                                            index,
                                            thisCol,
                                            {
                                              allowEnterDefaultWhenRowMissing:
                                                true,
                                            },
                                          );
                                        }
                                      }
                                    }, 100);
                                  }}
                                  onKeyDown={(
                                    e: ReactKeyboardEvent<HTMLElement>,
                                  ) => {
                                    const target =
                                      e.target as HTMLElement | null;

                                    if (!target) {
                                      return;
                                    }

                                    const isInListbox =
                                      target.closest('[role="listbox"]');

                                    if (isInListbox) {
                                      return;
                                    }

                                    if (e.key === "Escape") {
                                      return;
                                    }

                                    if (e.key === "Enter") {
                                      const selectButton =
                                        target.closest('[role="combobox"]');
                                      const isExpanded =
                                        selectButton?.getAttribute(
                                          "aria-expanded",
                                        ) === "true";

                                      // إذا كان combobox مفتوحاً، نسمح بالتفاعل الطبيعي مع القائمة
                                      if (isExpanded) {
                                        return; // لا نمنع - نسمح بالتفاعل الطبيعي
                                      }

                                      // إذا كان مغلقاً، ننتقل للحقل التالي
                                      if (!isExpanded) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleKeyDownTable(e, index, thisCol, {
                                          allowEnterDefaultWhenRowMissing:
                                            !detail?.acc_id,
                                        });

                                        return;
                                      }
                                    }

                                    // ✅ معالجة الأسهم عندما تكون القائمة مغلقة
                                    if (
                                      e.key === "ArrowUp" ||
                                      e.key === "ArrowDown" ||
                                      e.key === "ArrowLeft" ||
                                      e.key === "ArrowRight"
                                    ) {
                                      const selectButton =
                                        target.closest('[role="combobox"]');
                                      const isExpanded =
                                        selectButton?.getAttribute(
                                          "aria-expanded",
                                        ) === "true";

                                      // إذا كانت القائمة مغلقة، ننتقل للصف التالي/السابق أو الحقل التالي/السابق
                                      if (!isExpanded) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleKeyDownTable(e, index, thisCol);

                                        return;
                                      }
                                    }
                                  }}
                                />
                              </div>
                            );
                          })()}
                        </td>

                        <td className="p-0 border">
                          {(() => {
                            const thisCol = ++currentColIndex; // 1

                            return (
                              <input
                                ref={setInputRef(index, thisCol)}
                                className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                                data-col={thisCol}
                                data-row={index}
                                disabled={!isEditing}
                                min="0"
                                placeholder="0.00"
                                readOnly={!isEditing}
                                step="0.01"
                                style={{
                                  MozAppearance: "textfield",
                                  WebkitAppearance: "none",
                                  appearance: "none",
                                }}
                                type="number"
                                value={detail.debit ? String(detail.debit) : ""}
                                onChange={(e) => {
                                  const val = e.target.value;

                                  if (!val || parseFloat(val) >= 0) {
                                    updateDetail(
                                      index,
                                      "debit",
                                      val ? parseFloat(val) : undefined,
                                    );
                                  }
                                }}
                                onKeyDown={(
                                  e: ReactKeyboardEvent<HTMLElement>,
                                ) => {
                                  handleKeyDownTable(e, index, thisCol);
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            );
                          })()}
                        </td>

                        <td className="p-0 border">
                          {(() => {
                            const thisCol = ++currentColIndex; // 2

                            return (
                              <input
                                ref={setInputRef(index, thisCol)}
                                className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                                data-col={thisCol}
                                data-row={index}
                                disabled={!isEditing}
                                min="0"
                                placeholder="0.00"
                                readOnly={!isEditing}
                                step="0.01"
                                style={{
                                  MozAppearance: "textfield",
                                  WebkitAppearance: "none",
                                  appearance: "none",
                                }}
                                type="number"
                                value={
                                  detail.credit ? String(detail.credit) : ""
                                }
                                onChange={(e) => {
                                  const val = e.target.value;

                                  if (!val || parseFloat(val) >= 0) {
                                    updateDetail(
                                      index,
                                      "credit",
                                      val ? parseFloat(val) : undefined,
                                    );
                                  }
                                }}
                                onKeyDown={(
                                  e: ReactKeyboardEvent<HTMLElement>,
                                ) => {
                                  handleKeyDownTable(e, index, thisCol);
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            );
                          })()}
                        </td>

                        {/* حقول ذهب قائم (g_debit/g_credit) */}
                        <td className="p-0 border bg-amber-50">
                          {(() => {
                            const thisCol = ++currentColIndex; // 3

                            return (
                              <input
                                ref={setInputRef(index, thisCol)}
                                className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-amber-50 ${!isEditing ? "cursor-not-allowed" : ""}`}
                                data-col={thisCol}
                                data-row={index}
                                disabled={!isEditing}
                                min="0"
                                placeholder="0.00"
                                readOnly={!isEditing}
                                step="0.01"
                                style={{
                                  MozAppearance: "textfield",
                                  WebkitAppearance: "none",
                                  appearance: "none",
                                }}
                                type="number"
                                value={
                                  detail.g_debit ? String(detail.g_debit) : ""
                                }
                                onChange={(e) => {
                                  const val = e.target.value;

                                  if (!val || parseFloat(val) >= 0) {
                                    updateDetail(
                                      index,
                                      "g_debit",
                                      val ? parseFloat(val) : undefined,
                                    );
                                  }
                                }}
                                onKeyDown={(
                                  e: ReactKeyboardEvent<HTMLElement>,
                                ) => {
                                  handleKeyDownTable(e, index, thisCol);
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            );
                          })()}
                        </td>

                        <td className="p-0 border bg-amber-50">
                          {(() => {
                            const thisCol = ++currentColIndex; // 4

                            return (
                              <input
                                ref={setInputRef(index, thisCol)}
                                className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-amber-50 ${!isEditing ? "cursor-not-allowed" : ""}`}
                                data-col={thisCol}
                                data-row={index}
                                disabled={!isEditing}
                                min="0"
                                placeholder="0.00"
                                readOnly={!isEditing}
                                step="0.01"
                                style={{
                                  MozAppearance: "textfield",
                                  WebkitAppearance: "none",
                                  appearance: "none",
                                }}
                                type="number"
                                value={
                                  detail.g_credit ? String(detail.g_credit) : ""
                                }
                                onChange={(e) => {
                                  const val = e.target.value;

                                  if (!val || parseFloat(val) >= 0) {
                                    updateDetail(
                                      index,
                                      "g_credit",
                                      val ? parseFloat(val) : undefined,
                                    );
                                  }
                                }}
                                onKeyDown={(
                                  e: ReactKeyboardEvent<HTMLElement>,
                                ) => {
                                  handleKeyDownTable(e, index, thisCol);
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            );
                          })()}
                        </td>

                        {/* حقل المعايرة */}
                        <td className="p-0 border">
                          {(() => {
                            const thisCol = ++currentColIndex; // 5

                            return (
                              <input
                                ref={setInputRef(index, thisCol)}
                                className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                                data-col={thisCol}
                                data-row={index}
                                disabled={!isEditing}
                                min="0"
                                placeholder={t(
                                  "table.columns.gaugePlaceholder",
                                )}
                                readOnly={!isEditing}
                                step="0.01"
                                style={{
                                  MozAppearance: "textfield",
                                  WebkitAppearance: "none",
                                  appearance: "none",
                                }}
                                title={t("table.columns.gaugeTooltip")}
                                type="number"
                                value={
                                  detail.gauge ? String(detail.gauge) : "875"
                                }
                                onChange={(e) => {
                                  const val = e.target.value;

                                  if (!val || parseFloat(val) >= 0) {
                                    updateDetail(
                                      index,
                                      "gauge",
                                      val ? parseFloat(val) : 875,
                                    );
                                  }
                                }}
                                onKeyDown={(
                                  e: ReactKeyboardEvent<HTMLElement>,
                                ) => {
                                  handleKeyDownTable(e, index, thisCol);
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            );
                          })()}
                        </td>

                        {/* حقول ذهب معاير (g_debit_base/g_credit_base) */}
                        <td className="p-0 border bg-amber-50">
                          {(() => {
                            const thisCol = ++currentColIndex; // 6

                            return (
                              <input
                                ref={setInputRef(index, thisCol)}
                                className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-amber-50 ${!isEditing ? "cursor-not-allowed" : ""}`}
                                data-col={thisCol}
                                data-row={index}
                                disabled={!isEditing}
                                min="0"
                                placeholder="0.00"
                                readOnly={!isEditing}
                                step="0.000001"
                                style={{
                                  MozAppearance: "textfield",
                                  WebkitAppearance: "none",
                                  appearance: "none",
                                }}
                                title="يمكن تعديل الذهب المعاير، وسيتم تحديث المعايرة تلقائياً"
                                type="number"
                                value={
                                  detail.g_debit_base !== undefined &&
                                  detail.g_debit_base !== null
                                    ? String(detail.g_debit_base)
                                    : ""
                                }
                                onChange={(e) => {
                                  if (!isEditing) return;
                                  const val = e.target.value;

                                  if (!val || parseFloat(val) >= 0) {
                                    updateDetail(
                                      index,
                                      "g_debit_base",
                                      val ? parseFloat(val) : undefined,
                                    );
                                  }
                                }}
                                onKeyDown={(
                                  e: ReactKeyboardEvent<HTMLElement>,
                                ) => {
                                  handleKeyDownTable(e, index, thisCol);
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            );
                          })()}
                        </td>

                        <td className="p-0 border bg-amber-50">
                          {(() => {
                            const thisCol = ++currentColIndex; // 7

                            return (
                              <input
                                ref={setInputRef(index, thisCol)}
                                className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-amber-50 ${!isEditing ? "cursor-not-allowed" : ""}`}
                                data-col={thisCol}
                                data-row={index}
                                disabled={!isEditing}
                                min="0"
                                placeholder="0.00"
                                readOnly={!isEditing}
                                step="0.000001"
                                style={{
                                  MozAppearance: "textfield",
                                  WebkitAppearance: "none",
                                  appearance: "none",
                                }}
                                title={t("table.columns.gaugeTooltip")}
                                type="number"
                                value={
                                  detail.g_credit_base !== undefined &&
                                  detail.g_credit_base !== null
                                    ? String(detail.g_credit_base)
                                    : ""
                                }
                                onChange={(e) => {
                                  if (!isEditing) return;
                                  const val = e.target.value;

                                  if (!val || parseFloat(val) >= 0) {
                                    updateDetail(
                                      index,
                                      "g_credit_base",
                                      val ? parseFloat(val) : undefined,
                                    );
                                  }
                                }}
                                onKeyDown={(
                                  e: ReactKeyboardEvent<HTMLElement>,
                                ) => {
                                  handleKeyDownTable(e, index, thisCol);
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            );
                          })()}
                        </td>

                        {costCenters.length > 0 && (
                          <td className="p-0 border">
                            {(() => {
                              const thisCol = ++currentColIndex; // 8

                              return (
                                <div
                                  id={`cost-center-detail-select-${index}`}
                                  ref={(el) => {
                                    const refSetter = setInputRef(
                                      index,
                                      thisCol,
                                    );

                                    if (el) {
                                      // البحث عن combobox مباشرة
                                      const findAndSetRef = () => {
                                        const combobox = el.querySelector(
                                          '[role="combobox"]',
                                        ) as HTMLElement;

                                        if (combobox) {
                                          refSetter(
                                            combobox as unknown as HTMLInputElement,
                                          );

                                          return true;
                                        }

                                        return false;
                                      };

                                      // محاولة فورية
                                      if (!findAndSetRef()) {
                                        setTimeout(() => {
                                          findAndSetRef();
                                        }, 100);
                                      }
                                    } else {
                                      refSetter(null);
                                    }
                                  }}
                                >
                                  <ReactSelect
                                    isSearchable
                                    className="text-xs"
                                    classNamePrefix="react-select"
                                    components={{
                                      IndicatorSeparator: () => null,
                                    }}
                                    instanceId={`cost-center-detail-select-${index}`}
                                    isDisabled={!isEditing}
                                    menuPortalTarget={
                                      typeof window !== "undefined"
                                        ? document.body
                                        : null
                                    }
                                    menuPosition="fixed"
                                    options={costCenterSelectOptions}
                                    placeholder={t(
                                      "table.columns.costCenterPlaceholder",
                                    )}
                                    styles={{
                                      control: (base: CSSObjectWithLabel) => ({
                                        ...base,
                                        minHeight: "32px",
                                        height: "32px",
                                        fontSize: "12px",
                                        border: "none",
                                        borderRadius: "0",
                                        boxShadow: "none",
                                        cursor: isEditing
                                          ? "pointer"
                                          : "not-allowed",
                                        backgroundColor: "transparent",
                                      }),
                                      menuPortal: (
                                        base: CSSObjectWithLabel,
                                      ) => ({
                                        ...base,
                                        zIndex: 9999,
                                      }),
                                      option: (base: CSSObjectWithLabel) => ({
                                        ...base,
                                        fontSize: "12px",
                                      }),
                                      placeholder: (
                                        base: CSSObjectWithLabel,
                                      ) => ({
                                        ...base,
                                        fontSize: "12px",
                                      }),
                                      singleValue: (
                                        base: CSSObjectWithLabel,
                                      ) => ({
                                        ...base,
                                        fontSize: "12px",
                                      }),
                                    }}
                                    value={getCostCenterSelectValue(
                                      detail.cost_id,
                                    )}
                                    onChange={(selectedOption: any) => {
                                      if (!isEditing) return;
                                      updateDetail(
                                        index,
                                        "cost_id",
                                        selectedOption?.value
                                          ? parseInt(selectedOption.value)
                                          : null,
                                      );

                                      // الانتقال للحقل التالي (البيان) بعد الاختيار
                                      setTimeout(() => {
                                        const moved = focusNextField(
                                          index,
                                          thisCol,
                                        );

                                        if (!moved) {
                                          const selectButton =
                                            document.querySelector(
                                              `#cost-center-detail-select-${index} [role="combobox"]`,
                                            ) as HTMLElement;

                                          if (selectButton) {
                                            const syntheticEvent = {
                                              key: "Enter",
                                              preventDefault: () => {},
                                              stopPropagation: () => {},
                                              target: selectButton,
                                              currentTarget: selectButton,
                                              nativeEvent: {} as any,
                                              bubbles: true,
                                              cancelable: true,
                                              defaultPrevented: false,
                                              eventPhase: 0,
                                              isTrusted: false,
                                              timeStamp: Date.now(),
                                              type: "keydown",
                                            } as unknown as ReactKeyboardEvent;

                                            handleKeyDownTable(
                                              syntheticEvent,
                                              index,
                                              thisCol,
                                            );
                                          }
                                        }
                                      }, 100);
                                    }}
                                    onKeyDown={(
                                      e: ReactKeyboardEvent<HTMLElement>,
                                    ) => {
                                      const target = e.target as HTMLElement;
                                      const selectButton =
                                        target.closest('[role="combobox"]');
                                      const isInListbox =
                                        target.closest('[role="listbox"]');

                                      if (isInListbox) {
                                        return;
                                      }

                                      if (selectButton) {
                                        const isExpanded =
                                          selectButton.getAttribute(
                                            "aria-expanded",
                                          ) === "true";

                                        if (e.key === "Enter" && !isExpanded) {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleKeyDownTable(e, index, thisCol);

                                          return;
                                        }

                                        // ✅ معالجة الأسهم عندما تكون القائمة مغلقة
                                        if (
                                          (e.key === "ArrowUp" ||
                                            e.key === "ArrowDown" ||
                                            e.key === "ArrowLeft" ||
                                            e.key === "ArrowRight") &&
                                          !isExpanded
                                        ) {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleKeyDownTable(e, index, thisCol);

                                          return;
                                        }
                                      }

                                      if (e.key === "Escape") {
                                        return;
                                      }
                                    }}
                                  />
                                </div>
                              );
                            })()}
                          </td>
                        )}

                        <td className="p-0 border">
                          {(() => {
                            const thisCol = ++currentColIndex; // 9 (or 8 if no cost center)

                            return (
                              <input
                                ref={setInputRef(index, thisCol)}
                                className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                                data-col={thisCol}
                                data-row={index}
                                disabled={!isEditing}
                                placeholder={t("table.columns.notes")}
                                readOnly={!isEditing}
                                type="text"
                                value={detail.vouch_notes || ""}
                                onChange={(e) =>
                                  updateDetail(
                                    index,
                                    "vouch_notes",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(
                                  e: ReactKeyboardEvent<HTMLElement>,
                                ) => {
                                  handleKeyDownTable(e, index, thisCol, {
                                    isLastCol: true,
                                  });
                                }}
                              />
                            );
                          })()}
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Totals - شريط الإجماليات */}
      <div className="mt-1.5 bg-gray-50 rounded-lg p-1.5 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className={`flex items-center gap-2 ${textAlign}`}>
            <span className={`text-gray-700 font-medium ${textAlign}`}>
              {t("totals.totalDebit")}:
            </span>
            <span
              className={`font-semibold text-emerald-700 flex items-center gap-1 ${textAlign}`}
            >
              {formatAmount(totals.totalDebit)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className={`flex items-center gap-2 ${textAlign}`}>
            <span className={`text-gray-700 font-medium ${textAlign}`}>
              {t("totals.totalCredit")}:
            </span>
            <span
              className={`font-semibold text-red-700 flex items-center gap-1 ${textAlign}`}
            >
              {formatAmount(totals.totalCredit)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          {!isCashBalanced && (
            <div className={`flex items-center gap-2 ${textAlign}`}>
              <span className={`text-gray-700 font-medium ${textAlign}`}>
                {t("totals.cashDifference")}:
              </span>
              <span
                className={`font-semibold text-red-700 flex items-center gap-1 ${textAlign}`}
              >
                {formatAmount(Math.abs(cashBalance))}
                <span className="text-xs">
                  ({cashBalance > 0 ? t("totals.debit") : t("totals.credit")})
                </span>
                <RiyalIcon color="currentColor" />
              </span>
            </div>
          )}

          <div className={`flex items-center gap-2 ${textAlign}`}>
            <span className={`text-amber-800 font-medium ${textAlign}`}>
              {t("totals.totalDebitCalibrated")}:
            </span>
            <span
              className={`font-semibold text-yellow-600 flex items-center gap-1 ${textAlign}`}
            >
              {formatAmount(totals.totalDebitG)}
              <span className="text-xs text-yellow-500">
                {t("totals.gram")}
              </span>
            </span>
          </div>

          <div className={`flex items-center gap-2 ${textAlign}`}>
            <span className={`text-amber-800 font-medium ${textAlign}`}>
              {t("totals.totalCreditCalibrated")}:
            </span>
            <span
              className={`font-semibold text-yellow-600 flex items-center gap-1 ${textAlign}`}
            >
              {formatAmount(totals.totalCreditG)}
              <span className="text-xs text-yellow-500">
                {t("totals.gram")}
              </span>
            </span>
          </div>

          {!isGoldBalanced && (
            <div className={`flex items-center gap-2 ${textAlign}`}>
              <span className={`text-amber-800 font-medium ${textAlign}`}>
                {t("totals.goldDifference")}:
              </span>
              <span
                className={`font-semibold text-red-700 flex items-center gap-1 ${textAlign}`}
              >
                {formatAmount(Math.abs(goldBalance))}
                <span className="text-xs">
                  ({goldBalance > 0 ? t("totals.debit") : t("totals.credit")})
                </span>
                <span className="text-xs text-yellow-500">
                  {t("totals.gram")}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        cancelText={t("modals.cancel")}
        confirmColor="warning"
        confirmText={t("modals.confirm")}
        isOpen={showUnbalancedModal}
        message={
          <div className={`space-y-2 ${textAlign}`}>
            <p className={`text-gray-700 ${textAlign}`}>
              {t("modals.unbalancedMessage")}
            </p>
            <div className={`bg-gray-50 p-3 rounded-lg space-y-1 ${textAlign}`}>
              <p className={`font-semibold text-gray-800 ${textAlign}`}>
                {t("modals.unbalancedDetails.totalDebit", {
                  value: totals.totalDebit.toFixed(2),
                })}
              </p>
              <p className={`font-semibold text-gray-800 ${textAlign}`}>
                {t("modals.unbalancedDetails.totalCredit", {
                  value: totals.totalCredit.toFixed(2),
                })}
              </p>
              <p className={`font-semibold text-gray-800 ${textAlign}`}>
                {t("modals.unbalancedDetails.totalGoldDebit", {
                  value: totals.totalDebitG.toFixed(6),
                })}
              </p>
              <p className={`font-semibold text-gray-800 ${textAlign}`}>
                {t("modals.unbalancedDetails.totalGoldCredit", {
                  value: totals.totalCreditG.toFixed(6),
                })}
              </p>
            </div>
            <p className={`mt-3 text-gray-600 text-sm ${textAlign}`}>
              {t("modals.unbalancedQuestion")}
            </p>
          </div>
        }
        size="md"
        title={t("modals.unbalancedTitle")}
        onClose={handleUnbalancedCancel}
        onConfirm={handleUnbalancedConfirm}
      />

      {/* مودال توسيع البيان */}
      <Modal
        isOpen={isNotesModalOpen}
        scrollBehavior="inside"
        size="2xl"
        onClose={() => setIsNotesModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader className={`flex flex-col gap-1 ${textAlign}`}>
            <p className={`text-lg font-semibold ${textAlign}`}>
              {t("fields.notesModalTitle")}
            </p>
          </ModalHeader>
          <ModalBody>
            <Textarea
              classNames={{
                input: "resize-none",
              }}
              disabled={!isEditing}
              maxRows={12}
              minRows={6}
              placeholder={t("fields.notesModalPlaceholder")}
              value={voucher.vouch_notes || ""}
              onChange={(e) =>
                setVoucher((prev) => ({
                  ...prev,
                  vouch_notes: e.target.value,
                }))
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              variant="solid"
              onPress={() => setIsNotesModalOpen(false)}
            >
              {t("actions.saveNotes")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
