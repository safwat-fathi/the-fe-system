"use client";

import type { Voucher, VoucherDetail } from "@/types/voucher";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import AsyncCreatableSelect from "react-select/async-creatable";
import ReactSelect from "react-select";
import { useTranslations, useLocale } from "next-intl";
import { getLocaleDir } from "@/i18n/config";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Button,
  Checkbox,
} from "@heroui/react";
import {
  CheckIcon,
  PencilIcon,
  PrinterIcon,
  PlusIcon,
  ArrowsPointingOutIcon,
  ArrowUturnLeftIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  BackwardIcon,
  ForwardIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import clsx from "clsx";

import useEnterKeyNavigation from "@/app/[locale]/(pages)/forms/invoices/hooks/useEnterKeyNavigation";
import useKeyAsTab from "@/hooks/useKeyAsTab";
import { useVoucherForm } from "@/hooks/useVoucherForm";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";
import { formatDateTime } from "@/utilities/dateUtils";

import "bootstrap-icons/font/bootstrap-icons.css";

interface VoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
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
}

export default function VoucherClientPage({
  voucherData,
  voucherDetailsData,
  isNewVoucher = true,
  voucherRecordId,
  accounts: initialAccounts,
  costCenters: initialCostCenters,
  voucherTypes: initialVoucherTypes,
  voucherStatuses: initialVoucherStatuses,
  caratTypes: initialCaratTypes = [],
  startInEditMode = false,
  vouchType = 2,
  formMode = "new",
  newVoucherHref,
  navigationInfo,
}: VoucherClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("forms.adjustmentVoucher");
  
  // Dynamic text alignment classes based on locale
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const textAlignCenter = "text-center";
  
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
    voucherStatuses,
    isLoading,
    isEditing,
    isPrinting,
    showValidationErrors,
    isClient,
    searchTerm,
    setSearchTerm,
    vouchersList,
    isModalOpen,
    setIsModalOpen,

    // Totals and balances
    totals,
    isCashBalanced,
    isGoldBalanced,
    isBalanced,

    // Functions
    addDetailRow,
    removeDetailRow,
    updateDetail,
    updateVoucherType,
    saveVoucher,
    printVoucher,
    handleSearch,
    createFromPrevious,
    resetToNew,
    isCreatedFromPrevious,
    loadAccountOptions,
    getAccountSelectValue,
    updateAccountsList,
    handleMasterCostChange,
  } = useVoucherForm({
    voucherData,
    voucherDetailsData,
    isNewVoucher,
    voucherRecordId,
    accounts: initialAccounts,
    costCenters: initialCostCenters,
    voucherTypes: initialVoucherTypes,
    voucherStatuses: initialVoucherStatuses,
    caratTypes: initialCaratTypes,
    startInEditMode,
    vouchType,
    formMode,
    newVoucherHref,
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

  // Refs for keyboard navigation
  const selectorsRef = useRef<HTMLDivElement>(null);

  // Hook for Enter key navigation in top form fields
  const {
    handleKeyDown: handleKeyDownSelectors,
  } = useKeyAsTab({
    keys: ["Enter"],
    containerRef: selectorsRef,
    disabled: !isEditing,
    focusableSelector: [
      'a[href]',
      'area[href]',
      'button:not([tabindex="-1"])',
      'input:not([type="hidden"]):not([tabindex="-1"])',
      'select', // ✅ السماح بالمعطل
      'textarea:not([tabindex="-1"])',
      'iframe:not([tabindex="-1"])',
      'summary:not([tabindex="-1"])',
      '[contenteditable]:not([contenteditable="false"])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="combobox"]', // ✅ إضافة combobox للقوائم المنسدلة
    ].join(","),
    shouldIgnoreEvent: (event) => {
      const target = event.target as HTMLElement | null;

      if (!target) return false;

      // تجاهل العناصر المساعدة فقط
      if (target.closest("[data-skip-key-as-tab='true']")) {
        return true;
      }

      const tagName = target.tagName.toLowerCase();

      // تجاهل textareas و buttons المساعدة فقط
      if (
        tagName === "textarea" ||
        (tagName === "button" && target.hasAttribute("data-skip-key-as-tab"))
      ) {
        return true;
      }

      // ✅ معالجة خاصة لـ select العادي
      if (tagName === "select") {
        // ✅ نمنع فتح القائمة ونسمح بالتنقل فقط
        return false; // نسمح بالتنقل دائماً
      }

      // ✅ معالجة خاصة لـ ReactSelect (combobox)
      const selectButton = target.closest('[role="combobox"]');
      if (selectButton) {
        const isExpanded =
          selectButton.getAttribute("aria-expanded") === "true";

        // إذا كانت القائمة مفتوحة، نتجاهل Enter للسماح بالتفاعل الطبيعي
        if (isExpanded) {
          return true; // نسمح بالتفاعل الطبيعي (اختيار عنصر)
        }

        // ✅ إذا كانت القائمة مغلقة، نسمح بالتنقل
        return false; // نسمح بالتنقل
      }

      // ✅ تجاهل إذا كنا داخل قائمة منسدلة مفتوحة (listbox)
      const listboxElement = target.closest('[role="listbox"]');
      if (listboxElement) {
        return true; // نسمح بالتفاعل الطبيعي داخل القائمة
      }

      // ✅ تجاهل إذا كنا داخل popover أو dropdown
      const popoverElement = target.closest(
        '[role="dialog"], [role="menu"], [data-headlessui-state]',
      );
      if (popoverElement) {
        return true;
      }

      // ✅ في جميع الحالات الأخرى، نسمح بالتنقل
      return false;
    },
    filterElement: (element) => {
      // استبعاد العناصر المخفية فقط
      if (element.getAttribute("aria-hidden") === "true") {
        return false;
      }

      // استبعاد العناصر غير المرئية فقط
      const style = window.getComputedStyle(element);
      if (
        style.visibility === "hidden" ||
        style.display === "none" ||
        style.opacity === "0"
      ) {
        return false;
      }

      // استبعاد العناصر مع tabIndex={-1} فقط
      if (element.tabIndex === -1) {
        return false;
      }

      // ✅ معالجة خاصة لـ select العادي
      if (element.tagName.toLowerCase() === "select") {
        // ✅ نسمح بالتركيز على select حتى لو كان معطل
        return true;
      }

      // ✅ معالجة خاصة لـ ReactSelect (combobox)
      const combobox = element.closest('[role="combobox"]') as HTMLElement | null;
      if (combobox) {
        // ✅ نسمح بالتركيز على combobox حتى لو كان معطل
        // التأكد من أن tabIndex مناسب
        if (combobox.tabIndex < 0 && combobox.tabIndex !== undefined) {
          // إذا كان tabIndex سالب، نجعله 0 للسماح بالتركيز
          combobox.tabIndex = 0;
        }
        return true;
      }

      // ✅ معالجة خاصة لـ ReactSelect container
      // البحث عن container الذي يحتوي على combobox
      const reactSelectContainer = element.closest('.react-select__control, [class*="react-select"]');
      if (reactSelectContainer) {
        const comboboxInContainer = reactSelectContainer.querySelector('[role="combobox"]') as HTMLElement | null;
        if (comboboxInContainer) {
          // ✅ نسمح بالتركيز على container إذا كان يحتوي على combobox
          return true;
        }
      }

      // استبعاد الأزرار المساعدة فقط
      if (element.tagName.toLowerCase() === "button") {
        if (
          element.hasAttribute("data-skip-key-as-tab") ||
          element.closest("[data-skip-key-as-tab='true']")
        ) {
          return false;
        }
      }

      // ✅ السماح بجميع العناصر الأخرى (حتى لو كانت disabled)
      return true;
    },
  });

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

  const toAmount = (value: unknown) => {
    const numeric = Number(value);

    return Number.isFinite(numeric) ? numeric : 0;
  };

  // دالة لبناء روابط التنقل (مثل الفواتير)
  const resolvePaginatedVoucherHref = useCallback(
    (vouchId: number | null) => {
      if (!vouchId) return null;

      // تحديد نوع القيد من searchParams أو vouchType
      const currentType = searchParams?.get("type") || "adjustment";
      const searchParamsNew = new URLSearchParams({
        type: currentType,
        mode: "preview",
        id: String(vouchId),
      });

      return `/forms/voucher?${searchParamsNew.toString()}`;
    },
    [searchParams],
  );

  // metadata للتنقل (مثل الفواتير)
  const navigationMetadata = useMemo(() => {
    if (!navigationInfo) return null;

    return {
      nextVoucherHref: resolvePaginatedVoucherHref(navigationInfo.next ?? null),
      prevVoucherHref: resolvePaginatedVoucherHref(navigationInfo.previous ?? null),
      lastVoucherHref: resolvePaginatedVoucherHref(navigationInfo.last ?? null),
      firstVoucherHref: resolvePaginatedVoucherHref(navigationInfo.first ?? null),
      totalVouchers: navigationInfo.vouchersCount,
    };
  }, [navigationInfo, resolvePaginatedVoucherHref]);

  const navigationTargets = useMemo(
    () => ({
      previous: navigationInfo?.previous ?? -1,
      next: navigationInfo?.next ?? -1,
      first: navigationInfo?.first ?? -1,
      last: navigationInfo?.last ?? -1,
    }),
    [navigationInfo],
  );

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

  const handleNavigate = (targetId?: number | null) => {
    if (!targetId || targetId <= 0) {
      return;
    }

    const currentRecordId = voucher.id ?? voucher.vouch_id ?? null;

    if (currentRecordId && Number(currentRecordId) === targetId) {
      return;
    }

    router.push(`/forms/voucher/${targetId}?mode=preview`);
    router.refresh();
  };

  if (!isClient) {
    return (
      <div className={`flex justify-center items-center h-screen ${textAlignCenter}`}>
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
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-1.5 mb-1 border border-slate-200">
          {/* الصف الأول: معلومات القيد */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div>
                <h1 className={`text-lg font-bold text-slate-800 flex items-center gap-2 ${textAlign}`}>
                  <span>
                    {voucherTypes.find(
                      (type) => (type.Id || type.id) === voucher.vouch_type,
                    )?.name ||
                      voucherTypes.find(
                        (type) => (type.Id || type.id) === voucher.vouch_type,
                      )?.["Code Desc"] ||
                      t("messages.voucherType")}
                  </span>
                  <span className="text-slate-600 font-medium">
                    #
                    {voucher.vouch_id &&
                      Number(voucher.vouch_id) > 0 &&
                      isFinite(Number(voucher.vouch_id))
                      ? voucher.vouch_id
                      : voucher.id
                        ? `DB-${voucher.id}`
                        : t("status.numbering")}
                  </span>
                  <span className={`text-sm text-slate-600 font-medium flex items-center gap-1 ${textAlign}`}>
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

            {/* البحث */}
            <div className="flex items-center gap-2">
              <input
                className="w-32 h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
                placeholder={t("actions.search")}
                type="number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                className="h-7 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
                onClick={handleSearch}
              >
                <i className="bi bi-search w-4 h-4" />
              </button>
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
                onPress={() => {
                  // عند فتح وضع التعديل، نلغي commit (تصبح false) حتى يتم الحفظ
                  setVoucher((prev) => ({
                    ...prev,
                    commit: false,
                  }));

                  // تغيير الـ URL إلى وضع edit
                  if (pathname) {
                    // إذا كنا في صفحة [id]، نضيف mode=edit
                    if (
                      pathname.startsWith("/forms/voucher/") &&
                      pathname !== "/forms/voucher"
                    ) {
                      router.push(`${pathname}?mode=edit`);
                    } else {
                      // إذا كنا في صفحة أخرى، نستخدم searchParams
                      const currentUrl = new URL(window.location.href);

                      currentUrl.searchParams.set("mode", "edit");
                      router.push(currentUrl.pathname + currentUrl.search);
                    }
                  }
                }}
              >
                {t("actions.edit")}
              </Button>

              {/* زر "جديد" */}
              <Button
                className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
                startContent={<PlusIcon className="w-4 h-4" />}
                variant="solid"
                onPress={() => {
                  // الانتقال إلى صفحة جديدة
                  router.push(newVoucherHref || "/forms/voucher");
                }}
              >
                {t("actions.new")}
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

              <Button
                className="h-7 px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                startContent={<DocumentTextIcon className="w-4 h-4 text-slate-500" />}
                variant="solid"
                onPress={() => setIsModalOpen(true)}
              >
                <span className="hidden sm:inline">{t("actions.createFromPrevious")}</span>
              </Button>

              {isCreatedFromPrevious && (
                <Button
                  className="h-7 px-3 text-xs bg-orange-600 text-white hover:bg-orange-700 border border-orange-600 rounded-md shadow-sm"
                  startContent={<ArrowUturnLeftIcon className="w-4 h-4" />}
                  variant="solid"
                  onPress={resetToNew}
                >
                  {t("actions.revert")}
                </Button>
              )}

              {/* أزرار التنقل - مثل الفواتير - ظاهرة دائماً */}
              <div className="hidden md:flex items-center gap-1 mr-2">
                <Link
                  className={clsx(
                    "flex items-center justify-center h-7 w-12 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
                    {
                      "pointer-events-none opacity-40":
                        !navigationMetadata?.firstVoucherHref,
                    },
                  )}
                  href={navigationMetadata?.firstVoucherHref || ""}
                >
                  <ChevronDoubleRightIcon className="w-4 h-4" />
                </Link>
                <Link
                  className={clsx(
                    "flex items-center justify-center h-7 w-12 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
                    {
                      "pointer-events-none opacity-40":
                        !navigationMetadata?.prevVoucherHref,
                    },
                  )}
                  href={navigationMetadata?.prevVoucherHref || ""}
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>
                <span className={`text-xs text-slate-600 px-2 font-medium ${textAlign}`}>
                  {t("navigation.position", {
                    current: voucherNumber,
                    total: navigationMetadata?.totalVouchers ?? "?",
                  })}
                </span>
                <Link
                  className={clsx(
                    "flex items-center justify-center h-7 w-12 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
                    {
                      "pointer-events-none opacity-40":
                        !navigationMetadata?.nextVoucherHref,
                    },
                  )}
                  href={navigationMetadata?.nextVoucherHref || ""}
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Link>
                <Link
                  className={clsx(
                    "flex items-center justify-center h-7 w-12 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
                    {
                      "pointer-events-none opacity-40":
                        !navigationMetadata?.lastVoucherHref,
                    },
                  )}
                  href={navigationMetadata?.lastVoucherHref || ""}
                >
                  <ChevronDoubleLeftIcon className="w-4 h-4" />
                </Link>
              </div>
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

        {/* نموذج بيانات القيد */}
        <div className="bg-white rounded-lg border border-slate-200 mb-1.5">
          <div
            ref={selectorsRef}
            className="p-1"
            onKeyDownCapture={handleKeyDownSelectors}
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-1.5">
              {/* رقم المرجع - أضيق */}
              <div className="flex flex-col gap-0.5 md:col-span-1">
                <label
                  className={`text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
                  htmlFor="voucher-ref-no"
                >
                  {t("fields.refNo")}
                </label>
                <input
                  id="voucher-ref-no"
                  className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 disabled:cursor-not-allowed disabled:bg-slate-50"
                  disabled={!isEditing}
                  placeholder={t("fields.refNoPlaceholder")}
                  readOnly={!isEditing}
                  value={voucher.ref_no || ""}
                  onChange={(e) =>
                    setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))
                  }
                />
              </div>

              {/* تاريخ ووقت القيد - تصغير قليلاً */}
              <div className="flex flex-col gap-0.5 md:col-span-1">
                <label
                  className={`text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
                  htmlFor="voucher-date-time"
                >
                  {t("fields.dateTime")}
                </label>
                <input
                  className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 disabled:cursor-not-allowed disabled:bg-slate-50"
                  disabled={!isEditing}
                  id="voucher-date-time"
                  max={new Date().toISOString().slice(0, 16)}
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

              {/* حالة القيد - تصغير قليلاً */}
              <div className="flex flex-col gap-0.5 md:col-span-1">
                <label
                  className={`text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
                  htmlFor="voucher-status"
                >
                  {t("fields.status")}
                </label>
                <select
                  className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 disabled:cursor-not-allowed disabled:bg-slate-50"
                  disabled={!isEditing}
                  id="voucher-status"
                  value={String(voucher.vouch_status ?? 1)}
                  onChange={(e) =>
                    setVoucher((prev) => ({
                      ...prev,
                      vouch_status: parseInt(e.target.value),
                    }))
                  }
                  onKeyDown={(e) => {
                    // ✅ معالجة F4 لفتح/إغلاق القائمة
                    // ✅ منع فتح القائمة عند الضغط على Enter
                    if (e.key === "Enter") {
                      e.preventDefault(); // منع السلوك الافتراضي (فتح القائمة)
                      // useKeyAsTab سيتعامل مع التنقل تلقائياً
                    }
                  }}
                >
                  {voucherStatuses &&
                    Array.isArray(voucherStatuses) &&
                    voucherStatuses.length > 0 ? (
                    voucherStatuses.map((status) => {
                      const statusValue =
                        status.code_id !== undefined && status.code_id !== null
                          ? String(status.code_id)
                          : String(status.id || status.Id || "");
                      const statusLabel =
                        status.code_desc ||
                        status["Code Desc"] ||
                        status.name ||
                        "";

                      return (
                        <option
                          key={status.id || status.Id}
                          value={statusValue}
                        >
                          {statusLabel}
                        </option>
                      );
                    })
                  ) : (
                    <>
                      <option value="0">{t("statusOptions.cancelled")}</option>
                      <option value="1">{t("statusOptions.active")}</option>
                      <option value="2">{t("statusOptions.suspended")}</option>
                      <option value="3">{t("statusOptions.incomplete")}</option>
                    </>
                  )}
                </select>
              </div>

              {/* نوع القيد - توسيع قليلاً */}
              <div className="flex flex-col gap-0.5 md:col-span-1">
                <label
                  className={`text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
                  htmlFor="voucher-type"
                >
                  {t("fields.voucherType")}
                </label>
                <select
                  className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 disabled:cursor-not-allowed disabled:bg-slate-50"
                  disabled={!isEditing}
                  id="voucher-type"
                  value={voucher.vouch_type || 2}
                  onChange={(e) => updateVoucherType(parseInt(e.target.value))}
                  onKeyDown={(e) => {
                    // ✅ معالجة F4 لفتح/إغلاق القائمة
                    // ✅ منع فتح القائمة عند الضغط على Enter
                    if (e.key === "Enter") {
                      e.preventDefault();
                      // useKeyAsTab سيتعامل مع التنقل تلقائياً
                    }
                  }}
                >
                  {voucherTypes && voucherTypes.length > 0 ? (
                    voucherTypes.map((type) => (
                      <option
                        key={type.Id || type.id}
                        value={type.Id || type.id}
                      >
                        {type.name ||
                          type["Code Desc"] ||
                          type.type_name ||
                          `نوع ${type.Id || type.id}`}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="1">{t("voucherTypes.daily")}</option>
                      <option value="2">{t("voucherTypes.reverse")}</option>
                      <option value="3">{t("voucherTypes.adjustment")}</option>
                      <option value="4">{t("voucherTypes.currencyDiff")}</option>
                      <option value="5">{t("voucherTypes.inventoryDiff")}</option>
                      <option value="6">{t("voucherTypes.salary")}</option>
                    </>
                  )}
                </select>
              </div>

              {/* مركز التكلفة */}
              <div className="flex flex-col gap-0.5 md:col-span-1">
                <label
                  className={`text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
                  htmlFor="voucher-cost-center-select"
                >
                  {t("fields.costCenter")}
                </label>
                <ReactSelect
                  isSearchable
                  className="text-xs"
                  classNamePrefix="react-select"
                  components={{ IndicatorSeparator: () => null }}
                  inputId="voucher-cost-center-select"
                  instanceId="voucher-cost-center-select"
                  isDisabled={!isEditing || costCenters.length === 0}
                  menuPortalTarget={
                    typeof window !== "undefined" ? document.body : null
                  }
                  menuPosition="fixed"
                  options={costCenterSelectOptions}
                  placeholder={t("fields.costCenterPlaceholder")}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "32px",
                      height: "32px",
                      fontSize: "12px",
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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
                  onKeyDown={(e) => {
                    const target = e.target as HTMLElement | null;

                    if (!target) return;

                    const isInListbox = target.closest('[role="listbox"]');
                    if (isInListbox) {
                      return;
                    }

                    const selectButton = target.closest('[role="combobox"]');
                    if (selectButton) {
                      const isExpanded = selectButton.getAttribute("aria-expanded") === "true";

                      // إذا كانت القائمة مفتوحة، نسمح بالتفاعل الطبيعي
                      if (isExpanded && e.key !== "Escape") {
                        return;
                      }

                      if (e.key === "Enter" && !isExpanded) {
                        e.preventDefault();
                        e.stopPropagation();

                        // ✅ إضافة صف جديد إذا لم يكن موجوداً
                        if (details.length === 0) {
                          addDetailRow();
                        }

                        // ✅ دالة قوية للتركيز على حقل الحساب - تعمل بغض النظر عن أي شرط
                        const focusToAccountField = (): boolean => {
                          try {
                            const accountSelectId = `#account-select-0`;
                            let accountSelect = document.querySelector(accountSelectId);

                            // ✅ إذا لم نجد accountSelect، نبحث بطريقة أخرى
                            if (!accountSelect) {
                              // البحث عن أي div يحتوي على instanceId
                              const allSelects = document.querySelectorAll(
                                '[id^="account-select-"]',
                              );
                              accountSelect = allSelects[0] || null;
                            }

                            if (!accountSelect) {
                              return false;
                            }

                            // ✅ البحث عن combobox بطرق متعددة
                            let combobox = accountSelect.querySelector(
                              '[role="combobox"]',
                            ) as HTMLElement;

                            // ✅ إذا لم نجد combobox داخل accountSelect، نبحث مباشرة
                            if (!combobox) {
                              combobox = document.querySelector(
                                `#account-select-0 [role="combobox"]`,
                              ) as HTMLElement;
                            }

                            // ✅ إذا لم نجد، نبحث في كل الصفحة
                            if (!combobox) {
                              const allComboboxes = document.querySelectorAll(
                                '[role="combobox"]',
                              );
                              // نبحث عن combobox في أول صف (index 0)
                              for (let i = 0; i < allComboboxes.length; i += 1) {
                                const cb = allComboboxes[i] as HTMLElement;
                                const parent = cb.closest('[id^="account-select-"]');
                                if (parent && parent.id === "account-select-0") {
                                  combobox = cb;
                                  break;
                                }
                              }
                            }

                            if (combobox) {
                              // ✅ التركيز مع محاولات متعددة
                              combobox.focus();

                              // ✅ التأكد من أن combobox قابل للتركيز
                              if (document.activeElement !== combobox) {
                                combobox.setAttribute("tabindex", "0");
                                combobox.focus();
                              }

                              return true;
                            }

                            return false;
                          } catch (error) {
                            console.error("Error in focusToAccountField:", error);
                            return false;
                          }
                        };

                        // ✅ محاولة فورية
                        if (focusToAccountField()) {
                          return;
                        }

                        // ✅ محاولة بعد requestAnimationFrame
                        requestAnimationFrame(() => {
                          if (focusToAccountField()) {
                            return;
                          }

                          // ✅ محاولة بعد setTimeout قصير
                          setTimeout(() => {
                            if (focusToAccountField()) {
                              return;
                            }

                            // ✅ محاولة بعد setTimeout متوسط
                            setTimeout(() => {
                              if (focusToAccountField()) {
                                return;
                              }

                              // ✅ محاولة بعد setTimeout طويل
                              setTimeout(() => {
                                if (focusToAccountField()) {
                                  return;
                                }

                                // ✅ محاولة أخيرة مع focusFirstInRow
                                focusFirstInRow(0);
                              }, 100);
                            }, 50);
                          }, 10);
                        });

                        // ✅ محاولة باستخدام focusFirstInRow كحل بديل
                        focusFirstInRow(0);

                        // ✅ محاولات إضافية مع focusFirstInRow و focusToAccountField
                        setTimeout(() => {
                          focusFirstInRow(0);
                          focusToAccountField();
                        }, 20);

                        setTimeout(() => {
                          focusFirstInRow(0);
                          focusToAccountField();
                        }, 80);

                        setTimeout(() => {
                          focusFirstInRow(0);
                          focusToAccountField();
                        }, 150);

                        setTimeout(() => {
                          focusFirstInRow(0);
                          focusToAccountField();
                        }, 250);
                      }

                      if (e.key === "Escape") {
                        return;
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* البيان */}
        <div className="mb-1.5">
          <label
            className={`block text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
            htmlFor="voucher-notes"
          >
            {t("fields.notes")}
          </label>
          <div className="relative">
            <input
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 pr-8 disabled:cursor-not-allowed disabled:bg-slate-50"
              disabled={!isEditing}
              id="voucher-notes"
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
              onKeyDown={(e) => {
                // ✅ ضمان الانتقال السلس للجدول بغض النظر عن أي شروط
                if (e.key === "Enter" && !e.isDefaultPrevented() && isEditing) {
                  e.preventDefault();
                  e.stopPropagation();

                  // ✅ إضافة صف جديد إذا لم يكن موجوداً
                  if (details.length === 0) {
                    addDetailRow();
                  }

                  // ✅ دالة قوية للتركيز على حقل الحساب - تعمل بغض النظر عن أي شرط
                  const focusToAccountField = (): boolean => {
                    try {
                      const accountSelectId = `#account-select-0`;
                      let accountSelect = document.querySelector(accountSelectId);

                      // ✅ إذا لم نجد accountSelect، نبحث بطريقة أخرى
                      if (!accountSelect) {
                        // البحث عن أي div يحتوي على instanceId
                        const allSelects = document.querySelectorAll(
                          '[id^="account-select-"]',
                        );
                        accountSelect = allSelects[0] || null;
                      }

                      if (!accountSelect) {
                        return false;
                      }

                      // ✅ البحث عن combobox بطرق متعددة
                      let combobox = accountSelect.querySelector(
                        '[role="combobox"]',
                      ) as HTMLElement;

                      // ✅ إذا لم نجد combobox داخل accountSelect، نبحث مباشرة
                      if (!combobox) {
                        combobox = document.querySelector(
                          `#account-select-0 [role="combobox"]`,
                        ) as HTMLElement;
                      }

                      // ✅ إذا لم نجد، نبحث في كل الصفحة
                      if (!combobox) {
                        const allComboboxes = document.querySelectorAll(
                          '[role="combobox"]',
                        );
                        // نبحث عن combobox في أول صف (index 0)
                        for (let i = 0; i < allComboboxes.length; i += 1) {
                          const cb = allComboboxes[i] as HTMLElement;
                          const parent = cb.closest('[id^="account-select-"]');
                          if (parent && parent.id === "account-select-0") {
                            combobox = cb;
                            break;
                          }
                        }
                      }

                      if (combobox) {
                        // ✅ التركيز مع محاولات متعددة
                        combobox.focus();

                        // ✅ التأكد من أن combobox قابل للتركيز
                        if (document.activeElement !== combobox) {
                          combobox.setAttribute("tabindex", "0");
                          combobox.focus();
                        }

                        // ✅ فتح القائمة (اختياري - يمكن إزالته إذا لم نريد فتحها)
                        // combobox.click();

                        return true;
                      }

                      return false;
                    } catch (error) {
                      console.error("Error in focusToAccountField:", error);
                      return false;
                    }
                  };

                  // ✅ محاولة فورية
                  if (focusToAccountField()) {
                    return;
                  }

                  // ✅ محاولة بعد requestAnimationFrame
                  requestAnimationFrame(() => {
                    if (focusToAccountField()) {
                      return;
                    }

                    // ✅ محاولة بعد setTimeout قصير
                    setTimeout(() => {
                      if (focusToAccountField()) {
                        return;
                      }

                      // ✅ محاولة بعد setTimeout متوسط
                      setTimeout(() => {
                        if (focusToAccountField()) {
                          return;
                        }

                        // ✅ محاولة بعد setTimeout طويل
                        setTimeout(() => {
                          if (focusToAccountField()) {
                            return;
                          }

                          // ✅ محاولة أخيرة مع focusFirstInRow
                          focusFirstInRow(0);
                        }, 100);
                      }, 50);
                    }, 10);
                  });

                  // ✅ محاولة باستخدام focusFirstInRow كحل بديل
                  focusFirstInRow(0);

                  // ✅ محاولات إضافية مع focusFirstInRow و focusToAccountField
                  setTimeout(() => {
                    focusFirstInRow(0);
                    focusToAccountField();
                  }, 20);

                  setTimeout(() => {
                    focusFirstInRow(0);
                    focusToAccountField();
                  }, 80);

                  setTimeout(() => {
                    focusFirstInRow(0);
                    focusToAccountField();
                  }, 150);

                  setTimeout(() => {
                    focusFirstInRow(0);
                    focusToAccountField();
                  }, 250);
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

        {/* جدول تفاصيل القيد */}
        <div className="bg-white rounded-lg border border-slate-200 mb-1.5">
          <div className="p-0.5">
            <div className="flex justify-between items-center mb-0.5">
              <button
                className={`text-xs px-2 py-0.5 btn ${textAlign}`}
                disabled={!isEditing}
                type="button"
                onClick={addDetailRow}
              >
                {t("actions.addRow")}
              </button>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isBalanced
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
            {/* رسالة تحذيرية للحسابات الفارغة - تظهر فقط بعد محاولة الحفظ */}
            {showValidationErrors &&
              details.some(
                (detail) => !detail.acc_id || detail.acc_id === 0,
              ) && (
                <div className={`mb-0.5 p-1 bg-red-50 border border-red-200 rounded text-red-700 text-xs ${textAlign}`}>
                  {t("table.validationError")}
                </div>
              )}

            <div className="overflow-x-auto mb-0.5 max-w-full">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="min-w-[1350px] border text-xs text-center table-fixed">
                <thead className="bg-gray-100 text-xs font-bold">
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
                    <th
                      className={`w-40 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}
                      rowSpan={2}
                    >
                      {t("table.columns.costCenter")}
                    </th>
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
                    <th className={`w-20 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}>
                      {t("table.columns.cashDebit")}
                    </th>
                    <th className={`w-20 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}>
                      {t("table.columns.cashCredit")}
                    </th>
                    <th className={`w-20 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}>
                      {t("table.columns.goldStandingDebit")}
                    </th>
                    <th className={`w-20 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}>
                      {t("table.columns.goldStandingCredit")}
                    </th>
                    <th className={`w-20 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}>
                      {t("table.columns.goldCalibratedDebit")}
                    </th>
                    <th className={`w-20 p-0.5 font-bold text-slate-700 border ${textAlignCenter}`}>
                      {t("table.columns.goldCalibratedCredit")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail, index) => (
                    <tr
                      key={index}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${showValidationErrors &&
                        (!detail.acc_id || detail.acc_id === 0)
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
                                  refSetter(
                                    combobox as unknown as HTMLInputElement,
                                  );
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
                              control: (base, state) => ({
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
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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
                                  const selectButton =
                                    document.querySelector(
                                      `#account-select-${index}`,
                                    ) as HTMLButtonElement;

                                  if (selectButton) {
                                    // إنشاء event حقيقي مع target صحيح
                                    const syntheticEvent = {
                                      key: "Enter",
                                      preventDefault: () => { },
                                      stopPropagation: () => { },
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
                                    handleKeyDownTable(
                                      syntheticEvent,
                                      index,
                                      0,
                                      {
                                        allowEnterDefaultWhenRowMissing: true,
                                      },
                                    );
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
                              updateDetail(
                                index,
                                "gauge",
                                val ? parseFloat(val) : 875,
                              );
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
                                  refSetter(
                                    combobox as unknown as HTMLInputElement,
                                  );
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
                            const selectButton =
                              target.closest('[role="combobox"]');
                            const isInListbox = target.closest('[role="listbox"]');

                            if (isInListbox) {
                              return;
                            }

                            if (selectButton) {
                              const isExpanded =
                                selectButton.getAttribute("aria-expanded") ===
                                "true";

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
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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
                                      preventDefault: () => { },
                                      stopPropagation: () => { },
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
                          className={`font-bold ${details.length <= 2
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
              </table>
              </div>
            </div>
          </div>
        </div>

        {/* شريط الإجماليات */}
        <div className="mt-1.5 bg-gray-50 rounded-lg p-1.5 border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className={`flex items-center gap-2 ${textAlign}`}>
              <span className={`text-gray-700 font-medium ${textAlign}`}>
                {t("totals.totalDebit")}:
              </span>
              <span className={`font-semibold text-emerald-700 flex items-center gap-1 ${textAlign}`}>
                {formatAmount(totals.totalDebit)}
                <RiyalIcon color="currentColor" />
              </span>
            </div>

            <div className={`flex items-center gap-2 ${textAlign}`}>
              <span className={`text-gray-700 font-medium ${textAlign}`}>
                {t("totals.totalCredit")}:
              </span>
              <span className={`font-semibold text-red-700 flex items-center gap-1 ${textAlign}`}>
                {formatAmount(totals.totalCredit)}
                <RiyalIcon color="currentColor" />
              </span>
            </div>

            <div className={`flex items-center gap-2 ${textAlign}`}>
              <span className={`text-amber-800 font-medium ${textAlign}`}>
                {t("totals.totalDebitCalibrated")}:
              </span>
              <span className={`font-semibold text-yellow-600 flex items-center gap-1 ${textAlign}`}>
                {formatAmount(totals.totalDebitG)}
                <span className="text-xs text-yellow-500">{t("totals.gram")}</span>
              </span>
            </div>

            <div className={`flex items-center gap-2 ${textAlign}`}>
              <span className={`text-amber-800 font-medium ${textAlign}`}>
                {t("totals.totalCreditCalibrated")}:
              </span>
              <span className={`font-semibold text-yellow-600 flex items-center gap-1 ${textAlign}`}>
                {formatAmount(totals.totalCreditG)}
                <span className="text-xs text-yellow-500">{t("totals.gram")}</span>
              </span>
            </div>

          </div>
        </div>

        {/* نافذة القيود السابقة */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 p-4">
                <h3 className={`text-lg font-semibold text-slate-800 ${textAlign}`}>
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
                        <th className={`p-2 font-medium text-slate-700 ${textAlign}`}>
                          {t("modals.previousVoucher.columns.voucherNumber")}
                        </th>
                        <th className={`p-2 font-medium text-slate-700 ${textAlign}`}>
                          {t("modals.previousVoucher.columns.date")}
                        </th>
                        <th className={`p-2 font-medium text-slate-700 ${textAlign}`}>
                          {t("modals.previousVoucher.columns.notes")}
                        </th>
                        <th className={`p-2 font-medium text-slate-700 ${textAlign}`}>
                          {t("modals.previousVoucher.columns.status")}
                        </th>
                        <th className={`p-2 font-medium text-slate-700 ${textAlign}`}>
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
                                className={`text-xs px-2 py-1 rounded-full ${Number(v.vouch_status) === 1
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
    </>
  );
}
