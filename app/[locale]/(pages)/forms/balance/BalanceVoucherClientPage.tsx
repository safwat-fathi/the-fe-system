"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
// import AsyncCreatableSelect from "react-select/async-creatable";
// import ReactSelect from "react-select";
import {
  Button,
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

import useEnterKeyNavigation from "../invoices/hooks/useEnterKeyNavigation";

import { ConfirmationModal } from "@/components/Modal";
import SearchableSelect from "@/components/SearchableSelect";
import { RiyalIcon } from "@/components/RiyalIcon";
import useKeyAsTab from "@/hooks/useKeyAsTab";
import { useBalanceVoucherForm } from "@/hooks/useBalanceVoucherForm";
import { formatAmount } from "@/utilities/formatAmount";

import "bootstrap-icons/font/bootstrap-icons.css";

interface BalanceVoucherClientPageProps {
  voucherData?: any;
  voucherDetailsData?: any[];
  formData: any;
  formMode?: "new" | "edit" | "preview";
  voucherRecordId?: number | string | null;
  isNewVoucher?: boolean;
  startInEditMode?: boolean;
}

export default function BalanceVoucherClientPage({
  voucherData,
  voucherDetailsData,
  formData,
  formMode: initialFormMode = "new",
  voucherRecordId,
  isNewVoucher = true,
  startInEditMode: propStartInEditMode,
}: BalanceVoucherClientPageProps) {
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
    isClient,
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

  const costCenterSelectOptions = useMemo(() => {
    return (costCenters || []).map((center) => ({
      value: String(center.id),
      label: center.name || center.cost_name || `مركز ${center.id}`,
    }));
  }, [costCenters]);

  // تحويل defaultAccountOptions إلى format مناسب
  const accountDefaultOptions = useMemo(() => {
    return defaultAccountOptions.map((opt: any) => ({
      value: opt.value,
      label: opt.label,
      account: opt.account,
    }));
  }, [defaultAccountOptions]);

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

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="p-2 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header - رأس القيد مع الأزرار */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-2 mb-2 border border-slate-200">
        {/* الصف الأول: معلومات القيد */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>
                  {voucherTypes.find((t) => t.id === voucher.vouch_type)
                    ?.name || "قيد افتتاحي"}
                </span>
                <span className="text-slate-600 font-medium">
                  #
                  {voucher.vouch_id &&
                  Number(voucher.vouch_id) > 0 &&
                  isFinite(Number(voucher.vouch_id))
                    ? Number(voucher.vouch_id)
                    : voucher.id
                      ? `DB-${voucher.id}`
                      : "جاري الترقيم..."}
                </span>
                <span className="text-sm text-slate-600 font-medium flex items-center gap-1">
                  <i className="bi bi-calendar3 w-4 h-4 text-slate-500" />
                  {new Date(voucher.vouch_date).toLocaleString("ar-EG")}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* الصف الثاني: الأزرار والحالة */}
        <div className="flex items-center justify-between mt-1">
          {/* الأزرار من اليسار لليمين */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 min-w-[90px]"
              isDisabled={!isEditing}
              isLoading={isLoading}
              size="sm"
              startContent={
                !isLoading ? <CheckIcon className="h-4 w-4" /> : undefined
              }
              variant="solid"
              onPress={saveVoucher}
            >
              حفظ
            </Button>

            <Button
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 min-w-[90px]"
              isDisabled={formMode === "new" || isEditing || isLoading}
              size="sm"
              startContent={<PencilIcon className="h-4 w-4" />}
              variant="solid"
              onPress={handleEditClick}
            >
              تعديل
            </Button>

            <Button
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 min-w-[90px]"
              isDisabled={!voucher.vouch_id || Number(voucher.vouch_id) <= 0}
              isLoading={isPrinting}
              size="sm"
              startContent={
                !isPrinting ? <PrinterIcon className="h-4 w-4" /> : undefined
              }
              variant="solid"
              onPress={printVoucher}
            >
              طباعة
            </Button>
          </div>

          {/* حالة القيد */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <input
                readOnly
                checked={voucher.commit}
                className="w-3 h-3 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                type="checkbox"
              />
              <span className="text-xs text-slate-600">حُفظ</span>
            </div>

            <div className="flex items-center gap-1">
              <input
                readOnly
                checked={voucher.post}
                className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                type="checkbox"
              />
              <span className="text-xs text-slate-600">مرحل</span>
            </div>

            <div className="flex items-center gap-1">
              <input
                readOnly
                checked={voucher.print}
                className="w-3 h-3 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
                type="checkbox"
              />
              <span className="text-xs text-slate-600">طُبع</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form - نموذج بيانات القيد */}
      <div className="bg-white rounded-lg border border-slate-200 mb-2">
        <div
          ref={selectorsRef}
          className="p-2"
          onKeyDownCapture={handleKeyDownSelectors}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            {/* رقم المرجع - أضيق */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="balance-ref-no"
              >
                رقم المرجع
              </label>
              <input
                className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                disabled={!isEditing}
                id="balance-ref-no"
                placeholder="أدخل رقم المرجع"
                readOnly={!isEditing}
                value={voucher.ref_no || ""}
                onChange={(e) =>
                  setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))
                }
              />
            </div>

            {/* تاريخ ووقت القيد - توسع قليلاً */}
            <div className="flex flex-col gap-1 md:col-span-3">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="balance-vouch-datetime"
              >
                تاريخ ووقت القيد
              </label>
              <input
                className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
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
              <div className="flex flex-col gap-1 md:col-span-2">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="balance-cost-center-select"
                >
                  مركز التكلفة
                </label>
                <div
                  onKeyDownCapture={(e) => {
                    const target = e.target as HTMLElement;
                    const selectButton = target.closest('[role="combobox"]');
                    const isInListbox = target.closest('[role="listbox"]');

                    if (isInListbox) {
                      return;
                    }

                    if (selectButton) {
                      const isExpanded =
                        selectButton.getAttribute("aria-expanded") === "true";

                      if (e.key === "Enter" && !isExpanded) {
                        e.preventDefault();
                        e.stopPropagation();
                        const notesInput = selectorsRef.current?.querySelector(
                          'input[placeholder*="بيان"]',
                        ) as HTMLInputElement;

                        if (notesInput) {
                          notesInput.focus();
                        }

                        return;
                      }

                      if (e.key === "Escape") {
                        return;
                      }
                    }
                  }}
                >
                  <SearchableSelect
                    className="text-sm"
                    disabled={!isEditing}
                    inputId="balance-cost-center-select"
                    options={costCenterSelectOptions}
                    placeholder="اختر مركز التكلفة..."
                    searchPlaceholder="ابحث عن مركز التكلفة..."
                    value={voucher.cost_id ? String(voucher.cost_id) : null}
                    onChange={(selectedValue) => {
                      if (!isEditing) return;
                      const selected = selectedValue
                        ? Number(selectedValue)
                        : null;

                      handleMasterCostChange(
                        selected !== null && Number.isFinite(selected)
                          ? selected
                          : null,
                      );
                    }}
                  />
                </div>
              </div>
            )}

            {/* البيان - أوسع مع زر توسيع */}
            <div
              className={`flex flex-col gap-1 ${
                costCenters.length > 0 ? "md:col-span-5" : "md:col-span-7"
              }`}
            >
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="balance-vouch-notes"
              >
                البيان
              </label>
              <div className="relative">
                <input
                  className="text-sm border border-slate-300 rounded-md px-3 py-2 pr-10 w-full focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  disabled={!isEditing}
                  id="balance-vouch-notes"
                  placeholder="أدخل بيان القيد (انقر نقرتين للكتابة المطولة)"
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
                  onKeyDown={(e) => {
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

                      return;
                    }
                  }}
                />
                {isEditing && (
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all duration-200"
                    data-skip-key-as-tab="true"
                    tabIndex={-1}
                    title="توسيع البيان"
                    type="button"
                    onClick={() => setIsNotesModalOpen(true)}
                  >
                    <ArrowsPointingOutIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Table - جدول تفاصيل القيد */}
      <div className="bg-white rounded-lg border border-slate-200 mb-2">
        <div className="p-1.5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-800">تفاصيل القيد</h3>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full font-bold ${
                isBalanced
                  ? "bg-emerald-200 text-emerald-900"
                  : "bg-red-200 text-red-900"
              }`}
            >
              <i
                className={`bi ${isBalanced ? "bi-check-circle" : "bi-exclamation-triangle"} me-1`}
              />
              {isBalanced ? "متزن" : "غير متزن"}
            </span>
          </div>
        </div>

        <div className="p-1">
          <div className="flex justify-between mb-1">
            <button
              className="btn"
              data-skip-key-as-tab="true"
              disabled={!isEditing}
              tabIndex={-1}
              type="button"
              onClick={addDetailRow}
            >
              + صف
            </button>
          </div>
          <div className="overflow-x-auto mb-1">
            <div className="max-h-[360px] overflow-y-auto">
              <table className="min-w-[1400px] border text-xs text-center table-fixed">
                <thead className="sticky top-0 z-10 bg-gray-100 text-xs font-bold">
                  <tr>
                    <th
                      className="w-64 p-0.5 font-bold text-slate-700 border"
                      rowSpan={2}
                    >
                      الحساب
                    </th>
                    <th
                      className="w-40 p-0.5 font-bold text-slate-700 border"
                      colSpan={2}
                    >
                      نقدي
                    </th>
                    <th
                      className="w-40 p-0.5 font-bold text-slate-700 border"
                      colSpan={2}
                    >
                      ذهب قائم (جم)
                    </th>
                    <th
                      className="w-20 p-0.5 font-bold text-slate-700 border"
                      rowSpan={2}
                    >
                      المعايرة
                    </th>
                    <th
                      className="w-40 p-0.5 font-bold text-slate-700 border"
                      colSpan={2}
                    >
                      ذهب معاير (جم)
                    </th>
                    {costCenters.length > 0 && (
                      <th
                        className="w-40 p-0.5 font-bold text-slate-700 border"
                        rowSpan={2}
                      >
                        مركز التكلفة
                      </th>
                    )}
                    <th
                      className="w-48 p-0.5 font-bold text-slate-700 border"
                      rowSpan={2}
                    >
                      البيان
                    </th>
                    <th
                      className="w-12 p-0.5 font-bold text-slate-700 border"
                      rowSpan={2}
                    >
                      حذف
                    </th>
                  </tr>
                  <tr>
                    <th className="w-20 p-0.5 font-bold text-slate-700 border">
                      مدين
                    </th>
                    <th className="w-20 p-0.5 font-bold text-slate-700 border">
                      دائن
                    </th>
                    <th className="w-20 p-0.5 font-bold text-slate-700 border">
                      مدين (جم)
                    </th>
                    <th className="w-20 p-0.5 font-bold text-slate-700 border">
                      دائن (جم)
                    </th>
                    <th className="w-20 p-0.5 font-bold text-slate-700 border">
                      مدين (جم)
                    </th>
                    <th className="w-20 p-0.5 font-bold text-slate-700 border">
                      دائن (جم)
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

                            // دالة البحث الديناميكي
                            const handleAccountSearch = async (
                              searchTerm: string,
                            ) => {
                              try {
                                // loadAccountOptions يتعامل مع البحث والترتيب داخلياً
                                // نمرر searchTerm حتى لو كان فارغاً (loadAccountOptions ستعيد defaultOptions)
                                const results =
                                  await loadAccountOptions(searchTerm);

                                if (!results || !Array.isArray(results)) {
                                  return [];
                                }

                                // loadAccountOptions تعيد بالفعل format صحيح {value, label, account}
                                return results;
                              } catch (error) {
                                console.error(
                                  "Error in handleAccountSearch:",
                                  error,
                                );

                                return [];
                              }
                            };

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
                                ref={(el) => {
                                  const refSetter = setInputRef(index, thisCol);

                                  if (el) {
                                    // البحث عن زر القائمة
                                    setTimeout(() => {
                                      const selectButton =
                                        document.querySelector(
                                          `#account-select-${index}`,
                                        ) as HTMLButtonElement;

                                      if (selectButton) {
                                        refSetter(
                                          (selectButton as unknown as HTMLInputElement) ||
                                            null,
                                        );
                                      } else {
                                        refSetter(null);
                                      }
                                    }, 50);
                                  } else {
                                    refSetter(null);
                                  }
                                }}
                                className="h-full"
                              >
                                <SearchableSelect
                                  className="text-xs h-full"
                                  defaultOptions={optionsWithSelected}
                                  disabled={!isEditing}
                                  emptyMessage="لا توجد حسابات"
                                  inputId={`account-select-${index}`}
                                  options={[]}
                                  placeholder="اختر الحساب..."
                                  searchPlaceholder="ابحث عن الحساب..."
                                  value={selectedAccountValue}
                                  onChange={(selectedValue) => {
                                    if (!isEditing) return;
                                    if (!selectedValue) {
                                      updateDetail(index, "acc_id", null);
                                      updateDetail(index, "acc_code", "");
                                      updateDetail(index, "acc_name", "");

                                      return;
                                    }

                                    // البحث عن الحساب المحدد في accounts أولاً
                                    let selected = accounts.find(
                                      (acc) => acc.id === selectedValue,
                                    );

                                    // إذا لم نجده، نبحث في defaultAccountOptions
                                    if (!selected) {
                                      const option = accountDefaultOptions.find(
                                        (opt) => opt.value === selectedValue,
                                      );

                                      if (option?.account) {
                                        selected = option.account;
                                      }
                                    }

                                    // إذا لم نجده بعد، نحاول البحث في loadedOptions من خلال loadAccountOptions
                                    if (!selected) {
                                      // نبحث في accounts مرة أخرى بعد تحديثها
                                      selected = accounts.find(
                                        (acc) => acc.id === selectedValue,
                                      );
                                    }

                                    if (selected) {
                                      updateAccountsList(selected);
                                      updateDetail(
                                        index,
                                        "acc_id",
                                        selected.id ?? null,
                                      );
                                      updateDetail(
                                        index,
                                        "acc_code",
                                        selected.acc_code ??
                                          selected.code ??
                                          "",
                                      );
                                      updateDetail(
                                        index,
                                        "acc_name",
                                        selected.acc_name ??
                                          selected.name ??
                                          "",
                                      );
                                    } else {
                                      // إذا لم نجد الحساب، نحفظ القيمة فقط
                                      // سيتم جلب بيانات الحساب من الخادم عند الحفظ
                                      updateDetail(
                                        index,
                                        "acc_id",
                                        selectedValue,
                                      );
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    const target =
                                      e.target as HTMLElement | null;

                                    // التحقق من وجود target
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
                                  }}
                                  onSearch={handleAccountSearch}
                                  onSelectComplete={() => {
                                    // الانتقال للحقل التالي بعد اختيار العنصر
                                    // نستخدم setTimeout لضمان تحديث state أولاً
                                    setTimeout(() => {
                                      // محاولة الانتقال للحقل التالي مباشرة
                                      const moved = focusNextField(
                                        index,
                                        thisCol,
                                      );

                                      if (!moved) {
                                        // إذا لم نتمكن من الانتقال مباشرة، نستخدم handleKeyDownTable
                                        const selectButton =
                                          document.querySelector(
                                            `#account-select-${index}`,
                                          ) as HTMLButtonElement;

                                        if (selectButton) {
                                          // إنشاء event حقيقي مع target صحيح
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
                                          } as React.KeyboardEvent;

                                          // استخدام handleKeyDownTable مع event صحيح
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
                                onKeyDown={(e) => {
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
                                onKeyDown={(e) => {
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
                                onKeyDown={(e) => {
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
                                onKeyDown={(e) => {
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
                                placeholder="875"
                                readOnly={!isEditing}
                                step="0.01"
                                style={{
                                  MozAppearance: "textfield",
                                  WebkitAppearance: "none",
                                  appearance: "none",
                                }}
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
                                onKeyDown={(e) => {
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
                                className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${
                                  isEditing
                                    ? "bg-amber-50"
                                    : "cursor-not-allowed bg-amber-100"
                                }`}
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
                                onKeyDown={(e) => {
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
                                className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${
                                  isEditing
                                    ? "bg-amber-50"
                                    : "cursor-not-allowed bg-amber-100"
                                }`}
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
                                onKeyDown={(e) => {
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
                                  ref={(el) => {
                                    const refSetter = setInputRef(
                                      index,
                                      thisCol,
                                    );

                                    if (el) {
                                      // حفظ ref مباشرة باستخدام setTimeout لضمان وجود DOM
                                      setTimeout(() => {
                                        const selectButton =
                                          document.querySelector(
                                            `#cost-center-detail-select-${index}`,
                                          ) as HTMLButtonElement;

                                        if (selectButton) {
                                          refSetter(
                                            (selectButton as unknown as HTMLInputElement) ||
                                              null,
                                          );
                                        } else {
                                          refSetter(null);
                                        }
                                      }, 100);

                                      // محاولة إضافية بعد وقت أطول
                                      setTimeout(() => {
                                        const selectButton =
                                          document.querySelector(
                                            `#cost-center-detail-select-${index}`,
                                          ) as HTMLButtonElement;

                                        if (selectButton) {
                                          refSetter(
                                            (selectButton as unknown as HTMLInputElement) ||
                                              null,
                                          );
                                        }
                                      }, 300);
                                    } else {
                                      refSetter(null);
                                    }
                                  }}
                                  onKeyDownCapture={(e) => {
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

                                      if (e.key === "Escape") {
                                        return;
                                      }
                                    }
                                  }}
                                >
                                  <SearchableSelect
                                    className="text-xs"
                                    disabled={!isEditing}
                                    inputId={`cost-center-detail-select-${index}`}
                                    options={costCenterSelectOptions}
                                    placeholder="مركز التكلفة..."
                                    searchPlaceholder="ابحث..."
                                    value={
                                      detail.cost_id
                                        ? String(detail.cost_id)
                                        : null
                                    }
                                    onChange={(selectedValue) => {
                                      if (!isEditing) return;
                                      updateDetail(
                                        index,
                                        "cost_id",
                                        selectedValue
                                          ? parseInt(String(selectedValue))
                                          : null,
                                      );
                                    }}
                                    onKeyDown={(e) => {
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
                                placeholder="البيان"
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
                                onKeyDown={(e) => {
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
                            title="حذف السطر"
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
      <div className="mt-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">إجمالي المدين:</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              {formatAmount(totals.totalDebit)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">إجمالي الدائن:</span>
            <span className="font-semibold text-red-700 flex items-center gap-1">
              {formatAmount(totals.totalCredit)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          {!isCashBalanced && (
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">فارق النقدية:</span>
              <span className="font-semibold text-red-700 flex items-center gap-1">
                {formatAmount(Math.abs(cashBalance))}
                <span className="text-xs">
                  ({cashBalance > 0 ? "مدين" : "دائن"})
                </span>
                <RiyalIcon color="currentColor" />
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-amber-800 font-medium">
              إجمالي المدين المعاير:
            </span>
            <span className="font-semibold text-yellow-600 flex items-center gap-1">
              {formatAmount(totals.totalDebitG)}
              <span className="text-xs text-yellow-500">جم</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-amber-800 font-medium">
              إجمالي الدائن المعاير:
            </span>
            <span className="font-semibold text-yellow-600 flex items-center gap-1">
              {formatAmount(totals.totalCreditG)}
              <span className="text-xs text-yellow-500">جم</span>
            </span>
          </div>

          {!isGoldBalanced && (
            <div className="flex items-center gap-2">
              <span className="text-amber-800 font-medium">فارق الذهب:</span>
              <span className="font-semibold text-red-700 flex items-center gap-1">
                {formatAmount(Math.abs(goldBalance))}
                <span className="text-xs">
                  ({goldBalance > 0 ? "مدين" : "دائن"})
                </span>
                <span className="text-xs text-yellow-500">جم</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        cancelText="إلغاء"
        confirmColor="warning"
        confirmText="متابعة والحفظ"
        isOpen={showUnbalancedModal}
        message={
          <div className="space-y-2 text-right">
            <p className="text-gray-700">القيد الحالي غير متزن:</p>
            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              <p className="font-semibold text-gray-800">
                إجمالي المدين: {totals.totalDebit.toFixed(2)}
              </p>
              <p className="font-semibold text-gray-800">
                إجمالي الدائن: {totals.totalCredit.toFixed(2)}
              </p>
              <p className="font-semibold text-gray-800">
                إجمالي الذهب المدين: {totals.totalDebitG.toFixed(6)} جم
              </p>
              <p className="font-semibold text-gray-800">
                إجمالي الذهب الدائن: {totals.totalCreditG.toFixed(6)} جم
              </p>
            </div>
            <p className="mt-3 text-gray-600 text-sm">
              هل ترغب بالمتابعة والحفظ رغم عدم التوازن؟
            </p>
          </div>
        }
        size="md"
        title="⚠️ القيد غير متزن"
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
          <ModalHeader className="flex flex-col gap-1">
            <p className="text-lg font-semibold">البيان</p>
          </ModalHeader>
          <ModalBody>
            <Textarea
              classNames={{
                input: "resize-none",
              }}
              disabled={!isEditing}
              maxRows={12}
              minRows={6}
              placeholder="أدخل بيان القيد..."
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
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
