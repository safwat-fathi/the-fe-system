"use client";

import type { Voucher, VoucherDetail } from "@/types/voucher";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AsyncCreatableSelect from "react-select/async-creatable";
import ReactSelect from "react-select";
import { useTranslations, useLocale } from "next-intl";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Button,
} from "@heroui/react";

import { useAdjustmentVoucherForm } from "./hooks/useAdjustmentVoucherForm";
import useAdjustmentNavigationMetadata from "./hooks/useAdjustmentNavigationMetadata";
import useKeyboardNavigation from "./hooks/useKeyboardNavigation";
import VoucherHeader from "./components/AdjustmentHeader";

import { getLocaleDir } from "@/i18n/config";
import useEnterKeyNavigation from "@/app/[locale]/(pages)/forms/invoices/hooks/useEnterKeyNavigation";
import { useVoucherForm } from "@/hooks/useVoucherForm";
import { RiyalIcon } from "@/components/RiyalIcon";
import GLTransactionModal from "@/components/gl-transaction/GLTransactionModal";
import { formatAmount } from "@/utilities/formatAmount";
import { formatDateTime } from "@/utilities/dateUtils";

import "bootstrap-icons/font/bootstrap-icons.css";
import AdjustmentInfo from "./components/AdjustmentInfo";
import AdjustmentTable from "./components/AdjustmentTable";

interface VoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
  voucherVouchId?: number;
  navigationInfo?: {
    previous?: number | null;
    next?: number | null;
    first?: number | null;
    last?: number | null;
    vouchersCount?: number | null;
  };
  accounts: any[];
  costCenters: any[];
  voucherTypes: any[];
  voucherStatuses: any[];
  caratTypes?: any[];
  startInEditMode?: boolean;
  vouchType?: number;
  formMode?: "new" | "edit" | "preview";
  newVoucherHref?: string;
  initialVoucherNumber?: number;
}

export default function VoucherClientPage({
  voucherData,
  voucherDetailsData,
  isNewVoucher = true,
  voucherRecordId,
  voucherVouchId: _voucherVouchId,
  accounts: initialAccounts,
  costCenters,
  voucherTypes: initialVoucherTypes,
  voucherStatuses: initialVoucherStatuses,
  caratTypes: initialCaratTypes = [],
  startInEditMode = false,
  vouchType = 2,
  formMode = "new",
  newVoucherHref,
  navigationInfo,
  initialVoucherNumber,
}: VoucherClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("forms.adjustment");

  // Dynamic text alignment classes based on locale
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const textAlignCenter = "text-center";

  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  // حالة Modal القيود المحاسبية
  const [isGLModalOpen, setIsGLModalOpen] = useState(false);
  const isEditing = formMode === "edit" || formMode === "new";

  // Use the hook for all state management and business logic
  const {
    // State

    accounts,
    voucherTypes,
    voucherStatuses,

    showValidationErrors,
    isClient,

    vouchersList,
    isModalOpen,
    setIsModalOpen,

    // Totals and balances
    totals,
    isBalanced,

    // Functions

    createFromPrevious,

    loadAccountOptions,
    getAccountSelectValue,
    updateAccountsList,
  } = useVoucherForm({
    voucherData,
    voucherDetailsData,
    isNewVoucher,
    voucherRecordId,
    accounts: initialAccounts,
    voucherTypes: initialVoucherTypes,
    voucherStatuses: initialVoucherStatuses,
    caratTypes: initialCaratTypes,
    startInEditMode,
    vouchType,
    formMode,
    newVoucherHref,
    costCenters,
  });

  const {
    voucher,
    setVoucher,
    isLoading,
    isPrinting,
    saveVoucher,
    handleSearch,
    setSearchTerm,
    searchTerm,
    details,
    addDetailRow,
    removeDetailRow,
    updateDetail,
    handleCostCenter,
    handlePrint,
    isVoucherBalanced,
  } = useAdjustmentVoucherForm({
    formMode,
    initialVoucherNumber,
    voucherDetailsData,
  });

  // Focus reference number on load and when pathname changes
  useEffect(() => {
    // محاولة التركيز على حقل رقم المرجع عند تحميل الصفحة أو تغيير المسار
    const focusRefNo = () => {
      const refNoInput = document.getElementById("voucher-ref-no");

      if (refNoInput) {
        refNoInput.focus();
        // تحديد النص إذا كان الحقل فارغاً
        if (refNoInput instanceof HTMLInputElement && !refNoInput.value) {
          refNoInput.select();
        }
      }
    };

    // محاولة فورية
    const timer1 = setTimeout(focusRefNo, 50);
    // محاولة إضافية بعد تأخير أطول للتأكد
    const timer2 = setTimeout(focusRefNo, 200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname]);

  // Initialize keyboard navigation
  const { register: registerField, handleEnter: handleFieldEnter } =
    useKeyboardNavigation();

  const handleCreateClick = () => {
    router.push(`/forms/adjustment`);
  };

  const handleEditClick = () => {
    setVoucher((prev) => ({
      ...prev,
      commit: false,
    }));

    if (pathname) {
      const vouchIdToUse = voucher.vouch_id;

      if (vouchIdToUse && Number(vouchIdToUse) > 0) {
        router.push(`/forms/adjustment/${vouchIdToUse}?mode=edit`);
      }
    }
  };

  // Hook for Enter key navigation in table rows
  const {
    setInputRef,
    handleKeyDown: handleKeyDownTable,
    focusFirstInRow,
  } = useEnterKeyNavigation({
    rows: details,
    rowHasValue: (row) => {
      return !!(
        row?.acc_id ||
        (row?.debit && row.debit > 0) ||
        (row?.credit && row.credit > 0)
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

  // metadata للتنقل
  const navigationMetadata = useAdjustmentNavigationMetadata({
    navigationInfo,
  });

  // Navigation hook for Notes field

  // رقم السند الحالي
  const voucherNumber =
    voucher.vouch_id && Number(voucher.vouch_id) > 0
      ? String(voucher.vouch_id)
      : voucher.id
        ? `DB-${voucher.id}`
        : "";

  // Helper functions for cost center select (must be before any early return)
  const getCostCenterSelectValue = (costId: number | null | undefined) => {
    if (!costId || costId <= 0) {
      return null;
    }

    const center = costCenters.find((c) => {
      const centerId = c.id ?? c.Id;

      return centerId === costId;
    });

    if (!center) {
      return null;
    }

    return {
      value: String(center.id ?? center.Id),
      label:
        center.name || center.cost_name || `مركز ${center.id ?? center.Id}`,
    };
  };

  const costCenterSelectOptions = useMemo(() => {
    return (costCenters || []).map((center) => {
      const centerId = center.id ?? center.Id;

      return {
        value: String(centerId),
        label: center.name || center.cost_name || `مركز ${centerId}`,
      };
    });
  }, [costCenters]);

  if (!isClient) {
    return (
      <div
        className={`flex justify-center items-center h-screen ${textAlignCenter}`}
      >
        <div className={textAlignCenter}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className={`text-gray-600 ${textAlign}`}>{t("status.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-1 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        {/* رأس القيد المرتب مثل الفواتير */}
        <VoucherHeader
          textAlign={textAlign}
          title={t("title")}
          vouch_id={voucher.vouch_id}
          isEditing={isEditing}
          isLoading={isLoading}
          saveVoucher={saveVoucher}
          formMode={formMode}
          handleEditClick={handleEditClick}
          handleCreateClick={handleCreateClick}
          isPrinting={isPrinting}
          printVoucher={handlePrint}
          DBId={voucher.id}
          voucher_commit={voucher.commit}
          setIsGLModalOpen={setIsGLModalOpen}
          navigationMetadata={navigationMetadata}
          voucherNumber={voucherNumber}
          handleSearch={handleSearch}
          setSearchTerm={setSearchTerm}
          searchTerm={searchTerm}
        />
        <AdjustmentInfo
          textAlign={textAlign}
          isEditing={isEditing}
          voucher={voucher}
          voucherStatuses={voucherStatuses}
          setVoucher={setVoucher}
          voucherTypes={voucherTypes}
          costCenters={costCenters}
          handleCostCenter={handleCostCenter}
          focusFirstInRow={focusFirstInRow}
          setIsNotesModalOpen={setIsNotesModalOpen}
          registerField={registerField}
          handleFieldEnter={handleFieldEnter}
        />
        <AdjustmentTable
          isEditing={isEditing}
          addDetailRow={addDetailRow}
          textAlign={textAlign}
          isVoucherBalanced={isVoucherBalanced}
          details={details}
          initialAccounts={initialAccounts}
          updateDetail={updateDetail}
        />
        <tbody>
          {details.map((detail, index) => (
            <tr
              key={index}
              className={`border-b border-slate-100 hover:bg-slate-50 ${
                showValidationErrors && (!detail.acc_id || detail.acc_id === 0)
                  ? "bg-red-50 border-red-200"
                  : ""
              }`}
            >
              <td className="p-0 border bg-white">
                <div
                  id={`account-select-${index}`}
                  ref={(el) => {
                    const refSetter = setInputRef(index, 0);

                    if (el) {
                      // ✅ البحث عن combobox مباشرة
                      const findAndSetRef = () => {
                        const combobox = el.querySelector(
                          '[role="combobox"]',
                        ) as HTMLElement;

                        if (combobox) {
                          refSetter(combobox as unknown as HTMLInputElement);

                          return true;
                        }

                        return false;
                      };

                      // ✅ محاولة فورية
                      if (!findAndSetRef()) {
                        // ✅ محاولة بعد requestAnimationFrame
                        requestAnimationFrame(() => {
                          if (!findAndSetRef()) {
                            // ✅ محاولة بعد setTimeout
                            setTimeout(() => {
                              findAndSetRef();
                            }, 10);
                          }
                        });
                      }

                      // ✅ محاولات إضافية
                      setTimeout(() => {
                        findAndSetRef();
                      }, 50);

                      setTimeout(() => {
                        findAndSetRef();
                      }, 100);
                    } else {
                      refSetter(null);
                    }
                  }}
                >
                  <AsyncCreatableSelect
                    isClearable
                    isSearchable
                    className="text-xs"
                    classNamePrefix="select"
                    components={{ IndicatorSeparator: () => null }}
                    formatCreateLabel={(inputValue) =>
                      t("table.addAccountLabel", {
                        value: inputValue,
                      })
                    }
                    instanceId={`account-select-${index}`}
                    isDisabled={!isEditing}
                    loadOptions={loadAccountOptions}
                    menuPortalTarget={
                      typeof window !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                    placeholder={t("table.columns.accountPlaceholder")}
                    // ✅ ضمان أن combobox قابل للتركيز دائماً
                    onMenuOpen={() => {
                      // عند فتح القائمة، نتأكد من أن combobox مركّز
                      setTimeout(() => {
                        const combobox = document.querySelector(
                          `#account-select-${index} [role="combobox"]`,
                        ) as HTMLElement;

                        if (combobox && document.activeElement !== combobox) {
                          combobox.focus();
                        }
                      }, 0);
                    }}
                    styles={{
                      control: (base, _state) => ({
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
                      valueContainer: (base) => ({
                        ...base,
                        padding: "0.125rem 0.25rem",
                        height: "100%",
                      }),
                      input: (base) => ({
                        ...base,
                        margin: 0,
                        padding: 0,
                      }),
                      menuPortal: (base) => ({
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
                        accounts.find((acc) => acc.id === opt?.value);

                      if (!selected) {
                        // إذا تم مسح الحساب، ننتقل للحقل التالي
                        setTimeout(() => {
                          const moved = focusNextField(index, 0);

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
                        // محاولة الانتقال للحقل التالي مباشرة
                        const moved = focusNextField(index, 0);

                        if (!moved) {
                          // إذا لم نتمكن من الانتقال مباشرة، نستخدم handleKeyDownTable
                          const selectButton = document.querySelector(
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
                            } as unknown as React.KeyboardEvent;

                            // استخدام handleKeyDownTable مع event صحيح
                            handleKeyDownTable(syntheticEvent, index, 0, {
                              allowEnterDefaultWhenRowMissing: true,
                            });
                          }
                        }
                      }, 100);
                    }}
                    onKeyDown={(e) => {
                      const target = e.target as HTMLElement | null;

                      // التحقق من وجود target
                      if (!target) {
                        return;
                      }

                      const isInListbox = target.closest('[role="listbox"]');

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
                          selectButton?.getAttribute("aria-expanded") ===
                          "true";

                        // إذا كان combobox مفتوحاً، نسمح بالتفاعل الطبيعي مع القائمة
                        if (isExpanded) {
                          return; // لا نمنع - نسمح بالتفاعل الطبيعي
                        }

                        // إذا كان مغلقاً، ننتقل للحقل التالي
                        if (!isExpanded) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleKeyDownTable(e, index, 0, {
                            allowEnterDefaultWhenRowMissing: !detail?.acc_id,
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
                          selectButton?.getAttribute("aria-expanded") ===
                          "true";

                        // إذا كانت القائمة مغلقة، ننتقل للصف التالي/السابق أو الحقل التالي/السابق
                        if (!isExpanded) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleKeyDownTable(e, index, 0);

                          return;
                        }
                      }
                    }}
                  />
                </div>
              </td>

              <td className="p-0 border">
                <input
                  data-row={index}
                  data-col={1}
                  className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  disabled={!isEditing}
                  min="0"
                  placeholder="0.00"
                  readOnly={!isEditing}
                  ref={setInputRef(index, 1)}
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
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                    }
                    handleKeyDownTable(e, index, 1);
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </td>

              <td className="p-0 border">
                <input
                  data-row={index}
                  data-col={2}
                  className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  disabled={!isEditing}
                  min="0"
                  placeholder="0.00"
                  readOnly={!isEditing}
                  ref={setInputRef(index, 2)}
                  step="0.01"
                  style={{
                    MozAppearance: "textfield",
                    WebkitAppearance: "none",
                    appearance: "none",
                  }}
                  type="number"
                  value={detail.credit ? String(detail.credit) : ""}
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
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                    }
                    handleKeyDownTable(e, index, 2);
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </td>

              <td className="p-0 border bg-amber-50">
                <input
                  data-row={index}
                  data-col={3}
                  className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-amber-50 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  disabled={!isEditing}
                  min="0"
                  placeholder="0.00"
                  readOnly={!isEditing}
                  ref={setInputRef(index, 3)}
                  step="0.01"
                  style={{
                    MozAppearance: "textfield",
                    WebkitAppearance: "none",
                    appearance: "none",
                  }}
                  type="number"
                  value={detail.g_debit ? String(detail.g_debit) : ""}
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
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                    }
                    handleKeyDownTable(e, index, 3);
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </td>

              <td className="p-0 border bg-amber-50">
                <input
                  data-row={index}
                  data-col={4}
                  className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-amber-50 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  disabled={!isEditing}
                  min="0"
                  placeholder="0.00"
                  readOnly={!isEditing}
                  ref={setInputRef(index, 4)}
                  step="0.01"
                  style={{
                    MozAppearance: "textfield",
                    WebkitAppearance: "none",
                    appearance: "none",
                  }}
                  type="number"
                  value={detail.g_credit ? String(detail.g_credit) : ""}
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
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                    }
                    handleKeyDownTable(e, index, 4);
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </td>

              <td className="p-0 border">
                <input
                  data-row={index}
                  data-col={5}
                  className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  disabled={!isEditing}
                  min="0"
                  placeholder={t("table.columns.gaugePlaceholder")}
                  readOnly={!isEditing}
                  ref={setInputRef(index, 5)}
                  step="0.01"
                  style={{
                    MozAppearance: "textfield",
                    WebkitAppearance: "none",
                    appearance: "none",
                  }}
                  title={t("table.columns.gaugeTooltip")}
                  type="number"
                  value={detail.gauge ? String(detail.gauge) : "875"}
                  onChange={(e) => {
                    const val = e.target.value;

                    if (!val || parseFloat(val) >= 0) {
                      updateDetail(index, "gauge", val ? parseFloat(val) : 875);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                    }
                    handleKeyDownTable(e, index, 5);
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </td>

              <td className="p-0 border bg-amber-50">
                <input
                  data-row={index}
                  data-col={6}
                  className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-amber-50 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  disabled={!isEditing}
                  min="0"
                  placeholder="0.00"
                  readOnly={!isEditing}
                  ref={setInputRef(index, 6)}
                  step="0.000001"
                  style={{
                    MozAppearance: "textfield",
                    WebkitAppearance: "none",
                    appearance: "none",
                  }}
                  title={t("table.columns.gaugeTooltip")}
                  type="number"
                  value={
                    detail.g_debit_base !== undefined &&
                    detail.g_debit_base !== null
                      ? String(detail.g_debit_base)
                      : ""
                  }
                  onChange={(e) => {
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
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                    }
                    handleKeyDownTable(e, index, 6);
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </td>

              <td className="p-0 border bg-amber-50">
                <input
                  data-row={index}
                  data-col={7}
                  className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-amber-50 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  disabled={!isEditing}
                  min="0"
                  placeholder="0.00"
                  readOnly={!isEditing}
                  ref={setInputRef(index, 7)}
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
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                    }
                    handleKeyDownTable(e, index, 7);
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </td>

              <td className="p-0 border">
                <div
                  id={`cost-center-detail-select-${index}`}
                  ref={(el) => {
                    const refSetter = setInputRef(index, 8);

                    if (el) {
                      // ✅ البحث عن combobox مباشرة
                      const findAndSetRef = () => {
                        const combobox = el.querySelector(
                          '[role="combobox"]',
                        ) as HTMLElement;

                        if (combobox) {
                          refSetter(combobox as unknown as HTMLInputElement);

                          return true;
                        }

                        return false;
                      };

                      // ✅ محاولة فورية
                      if (!findAndSetRef()) {
                        setTimeout(() => {
                          findAndSetRef();
                        }, 100);
                      }
                    } else {
                      refSetter(null);
                    }
                  }}
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
                        handleKeyDownTable(e, index, 8);

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
                        handleKeyDownTable(e, index, 8);

                        return;
                      }

                      if (e.key === "Escape") {
                        return;
                      }
                    }
                  }}
                >
                  <ReactSelect
                    isSearchable
                    className="text-xs"
                    classNamePrefix="react-select"
                    components={{ IndicatorSeparator: () => null }}
                    instanceId={`cost-center-detail-select-${index}`}
                    isDisabled={!isEditing}
                    menuPortalTarget={
                      typeof window !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                    options={costCenterSelectOptions}
                    placeholder={t("table.columns.costCenterPlaceholder")}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: "32px",
                        height: "32px",
                        fontSize: "12px",
                        border: "none",
                        borderRadius: "0",
                        boxShadow: "none",
                        cursor: isEditing ? "pointer" : "not-allowed",
                        backgroundColor: "transparent",
                      }),
                      menuPortal: (base) => ({
                        ...base,
                        zIndex: 9999,
                      }),
                      option: (base) => ({
                        ...base,
                        fontSize: "12px",
                      }),
                      placeholder: (base) => ({
                        ...base,
                        fontSize: "12px",
                      }),
                      singleValue: (base) => ({
                        ...base,
                        fontSize: "12px",
                      }),
                    }}
                    value={getCostCenterSelectValue(detail.cost_id)}
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
                        // محاولة الانتقال للحقل التالي مباشرة
                        const moved = focusNextField(index, 8);

                        if (!moved) {
                          // إذا لم نتمكن من الانتقال مباشرة، نستخدم handleKeyDownTable
                          const selectButton = document.querySelector(
                            `#cost-center-detail-select-${index} [role="combobox"]`,
                          ) as HTMLElement;

                          if (selectButton) {
                            // إنشاء event حقيقي
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
                            } as unknown as React.KeyboardEvent;

                            handleKeyDownTable(syntheticEvent, index, 8);
                          }
                        }
                      }, 100);
                    }}
                    onKeyDown={(e) => {
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
                          handleKeyDownTable(e, index, 8);

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
                          handleKeyDownTable(e, index, 8);

                          return;
                        }
                      }

                      if (e.key === "Escape") {
                        return;
                      }
                    }}
                  />
                </div>
              </td>

              <td className="p-0 border">
                <input
                  data-row={index}
                  data-col={9}
                  className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  disabled={!isEditing}
                  placeholder={t("table.columns.notes")}
                  readOnly={!isEditing}
                  ref={setInputRef(index, 9)}
                  type="text"
                  value={detail.vouch_notes || ""}
                  onChange={(e) =>
                    updateDetail(index, "vouch_notes", e.target.value)
                  }
                  onKeyDown={(e) => {
                    handleKeyDownTable(e, index, 9, {
                      isLastCol: true,
                    });
                  }}
                />
              </td>

              <td className="p-1 border">
                <button
                  className={`font-bold ${
                    details.length <= 2
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-red-600"
                  }`}
                  disabled={!isEditing || details.length <= 2}
                  tabIndex={-1}
                  title={
                    details.length <= 2
                      ? t("table.minRowsError")
                      : t("actions.deleteRow")
                  }
                  onClick={() => removeDetailRow(index)}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>

        {/* شريط الإجماليات */}
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
          </div>
        </div>

        {/* نافذة القيود السابقة */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 p-4">
                <h3
                  className={`text-lg font-semibold text-slate-800 ${textAlign}`}
                >
                  {t("modals.previousVoucher.title")}
                </h3>
              </div>

              <div className="p-4">
                <input
                  className={`w-full mb-4 text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${textAlign}`}
                  placeholder={t("modals.previousVoucher.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th
                          className={`p-2 font-medium text-slate-700 ${textAlign}`}
                        >
                          {t("modals.previousVoucher.columns.voucherNumber")}
                        </th>
                        <th
                          className={`p-2 font-medium text-slate-700 ${textAlign}`}
                        >
                          {t("modals.previousVoucher.columns.date")}
                        </th>
                        <th
                          className={`p-2 font-medium text-slate-700 ${textAlign}`}
                        >
                          {t("modals.previousVoucher.columns.notes")}
                        </th>
                        <th
                          className={`p-2 font-medium text-slate-700 ${textAlign}`}
                        >
                          {t("modals.previousVoucher.columns.status")}
                        </th>
                        <th
                          className={`p-2 font-medium text-slate-700 ${textAlign}`}
                        >
                          {t("modals.previousVoucher.columns.action")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {vouchersList
                        .filter(
                          (v) =>
                            v.vouch_id.toString().includes(searchTerm) ||
                            v.vouch_date.includes(searchTerm) ||
                            v.vouch_notes?.includes(searchTerm),
                        )
                        .map((v, index) => (
                          <tr
                            key={
                              v.id || `${v.vouch_id}-${v.vouch_type}-${index}`
                            }
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="p-2 text-slate-800">{v.vouch_id}</td>
                            <td className="p-2 text-slate-600">
                              {v.vouch_date
                                ? formatDateTime(v.vouch_date).split(" :")[0]
                                : "-"}
                            </td>
                            <td className="p-2 text-slate-600 text-sm">
                              {v.vouch_notes || "-"}
                            </td>
                            <td className="p-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  Number(v.vouch_status) === 1
                                    ? "bg-emerald-100 text-emerald-800" // فعال
                                    : Number(v.vouch_status) === 0
                                      ? "bg-red-100 text-red-800" // ملغي
                                      : Number(v.vouch_status) === 2
                                        ? "bg-yellow-100 text-yellow-800" // معلق
                                        : "bg-gray-100 text-gray-800" // غير مكتمل أو أخرى
                                }`}
                              >
                                {(() => {
                                  const vouchStatusNum = Number(v.vouch_status);

                                  // خريطة افتراضية للحالات
                                  const defaultStatusMap: Record<
                                    number,
                                    string
                                  > = {
                                    0: t("statusOptions.cancelled"),
                                    1: t("statusOptions.active"),
                                    2: t("statusOptions.suspended"),
                                    3: t("statusOptions.incomplete"),
                                  };

                                  // إذا لم توجد حالات محملة، استخدم الخريطة الافتراضية
                                  if (
                                    !voucherStatuses ||
                                    !Array.isArray(voucherStatuses) ||
                                    voucherStatuses.length === 0
                                  ) {
                                    return (
                                      defaultStatusMap[vouchStatusNum] ||
                                      (isNaN(vouchStatusNum)
                                        ? t("statusOptions.unknown")
                                        : `${t("statusOptions.unknown")} ${vouchStatusNum}`)
                                    );
                                  }

                                  // البحث عن الحالة باستخدام code_id (من getVoucherStageList)
                                  // البيانات المتوقعة: { id: 102, code_id: 0, code_desc: "ملغي", ... }
                                  const status = voucherStatuses.find(
                                    (s: any) => {
                                      // محاولة قراءة code_id من عدة مصادر محتملة
                                      const statusCodeId =
                                        s.code_id !== undefined &&
                                        s.code_id !== null
                                          ? Number(s.code_id)
                                          : s.Id !== undefined && s.Id !== null
                                            ? Number(s.Id)
                                            : s.id !== undefined &&
                                                s.id !== null
                                              ? Number(s.id)
                                              : null;

                                      return (
                                        statusCodeId !== null &&
                                        statusCodeId === vouchStatusNum
                                      );
                                    },
                                  );

                                  if (status) {
                                    // محاولة قراءة النص من عدة مصادر محتملة
                                    const statusText =
                                      status.code_desc ||
                                      status["Code Desc"] ||
                                      status.name ||
                                      status.code_desc_l;

                                    if (
                                      statusText &&
                                      statusText.trim() !== ""
                                    ) {
                                      return statusText;
                                    }
                                  }

                                  // Fallback: استخدام الخريطة الافتراضية
                                  return (
                                    defaultStatusMap[vouchStatusNum] ||
                                    (isNaN(vouchStatusNum)
                                      ? t("statusOptions.unknown")
                                      : `${t("statusOptions.unknown")} ${vouchStatusNum}`)
                                  );
                                })()}
                              </span>
                            </td>
                            <td className="p-2">
                              <button
                                className={`h-6 px-2 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 rounded-md shadow-sm ${textAlign}`}
                                onClick={() => {
                                  createFromPrevious(v);
                                }}
                              >
                                {t("actions.select")}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className={`flex justify-end gap-2 mt-4 ${textAlign}`}>
                  <button
                    className={`h-8 px-4 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm font-medium ${textAlign}`}
                    onClick={() => setIsModalOpen(false)}
                  >
                    {t("actions.cancel")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* Modal القيود المحاسبية */}
      <GLTransactionModal
        isOpen={isGLModalOpen}
        onClose={() => setIsGLModalOpen(false)}
        transId={voucher.id && Number(voucher.id) > 0 ? Number(voucher.id) : 0}
        transType={vouchType || 3} // قيد تسوية
        voucherTitle={
          voucher.vouch_id && Number(voucher.vouch_id) > 0
            ? `قيد تسوية رقم ${voucher.vouch_id}`
            : voucher.id
              ? `قيد تسوية (DB-${voucher.id})`
              : undefined
        }
      />
    </>
  );
}
