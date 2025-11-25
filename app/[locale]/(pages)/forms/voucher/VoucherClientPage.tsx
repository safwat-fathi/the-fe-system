"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import AsyncCreatableSelect from "react-select/async-creatable";
import ReactSelect from "react-select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Button,
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
  BackwardIcon,
  ForwardIcon,
} from "@heroicons/react/24/outline";

import useEnterKeyNavigation from "@/app/[locale]/(pages)/forms/invoices/hooks/useEnterKeyNavigation";
import useKeyAsTab from "@/hooks/useKeyAsTab";
import { useVoucherForm } from "@/hooks/useVoucherForm";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";
import { formatDateTime } from "@/utilities/dateUtils";

import "bootstrap-icons/font/bootstrap-icons.css";

import type { Voucher, VoucherDetail } from "@/types/voucher";

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
    caratTypes,
    isLoading,
    isEditing,
    setIsEditing,
    isPrinting,
    showValidationErrors,
    isClient,
    currentRecord,
    totalRecords,
    searchTerm,
    setSearchTerm,
    selectedVoucher,
    setSelectedVoucher,
    vouchersList,
    isModalOpen,
    setIsModalOpen,
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
    navigateToVoucher,
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

  // Refs for keyboard navigation
  const selectorsRef = useRef<HTMLDivElement>(null);

  // Hook for Enter key navigation in top form fields
  const {
    handleKeyDown: handleKeyDownSelectors,
    handleF4KeyForSelect,
  } = useKeyAsTab({
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

  const toAmount = (value: unknown) => {
    const numeric = Number(value);

    return Number.isFinite(numeric) ? numeric : 0;
  };

  const navigationTargets = useMemo(
    () => ({
      previous: navigationInfo?.previous ?? -1,
      next: navigationInfo?.next ?? -1,
      first: navigationInfo?.first ?? -1,
      last: navigationInfo?.last ?? -1,
    }),
    [navigationInfo],
  );

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

  const PREVIEW_TOLERANCE = 0.01;

  const getPreviewAccountName = (
    accId: number | string | null | undefined,
    fallback?: string | null,
  ): string => {
    if (fallback && fallback.trim().length > 0) {
      return fallback;
    }

    if (accId === null || accId === undefined || accId === "") {
      return "";
    }

    const numericId = Number(accId);

    if (!Number.isFinite(numericId)) {
      return "";
    }

    const account = accounts?.find((acc: any) => {
      const candidate = acc?.acc_id ?? acc?.acc ?? acc?.account_no ?? acc?.id;

      return Number(candidate) === numericId;
    });

    return account?.acc_name || account?.name || account?.label || "";
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-2 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        {/* رأس القيد المرتب مثل الفواتير */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-2 mb-2 border border-slate-200">
          {/* الصف الأول: معلومات القيد */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span>
                    {voucherTypes.find(
                      (t) => (t.Id || t.id) === voucher.vouch_type,
                    )?.name ||
                      voucherTypes.find(
                        (t) => (t.Id || t.id) === voucher.vouch_type,
                      )?.["Code Desc"] ||
                      "قيد تسوية"}
                  </span>
                  <span className="text-slate-600 font-medium">
                    #
                    {voucher.vouch_id &&
                    voucher.vouch_id > 0 &&
                    isFinite(voucher.vouch_id)
                      ? voucher.vouch_id
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

            {/* البحث */}
            <div className="flex items-center gap-2">
              <input
                className="w-32 h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
                placeholder="بحث برقم القيد..."
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
                تعديل
              </Button>

              {/* زر "جديد" */}
              <Button
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 min-w-[90px]"
                size="sm"
                startContent={<PlusIcon className="h-4 w-4" />}
                variant="solid"
                onPress={() => {
                  // الانتقال إلى صفحة جديدة
                  router.push(newVoucherHref || "/forms/voucher");
                }}
              >
                جديد
              </Button>

              <Button
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 min-w-[90px]"
                isDisabled={!voucher.vouch_id || voucher.vouch_id <= 0}
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

              <Button
                className="bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 font-medium shadow-md hover:shadow-lg transition-all duration-200 min-w-[140px]"
                size="sm"
                startContent={<DocumentTextIcon className="h-4 w-4" />}
                variant="solid"
                onPress={() => setIsModalOpen(true)}
              >
                انشاء من قيد سابق
              </Button>

              {isCreatedFromPrevious && (
                <Button
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 min-w-[90px]"
                  size="sm"
                  startContent={<ArrowUturnLeftIcon className="h-4 w-4" />}
                  variant="solid"
                  onPress={resetToNew}
                >
                  تراجع
                </Button>
              )}

              <div className="flex items-center gap-1 border border-slate-200 rounded-md px-1.5 py-1 bg-white">
                <Button
                  isIconOnly
                  aria-label="أول قيد"
                  className="border border-transparent hover:border-slate-300 hover:bg-slate-100"
                  size="sm"
                  variant="light"
                  onPress={() => handleNavigate(navigationTargets.first)}
                >
                  <BackwardIcon className="h-4 w-4 text-slate-600" />
                </Button>
                <Button
                  isIconOnly
                  aria-label="السابق"
                  className="border border-transparent hover:border-slate-300 hover:bg-slate-100"
                  size="sm"
                  variant="light"
                  onPress={() => handleNavigate(navigationTargets.previous)}
                >
                  <ChevronRightIcon className="h-4 w-4 text-slate-600" />
                </Button>
                <Button
                  isIconOnly
                  aria-label="التالي"
                  className="border border-transparent hover:border-slate-300 hover:bg-slate-100"
                  size="sm"
                  variant="light"
                  onPress={() => handleNavigate(navigationTargets.next)}
                >
                  <ChevronLeftIcon className="h-4 w-4 text-slate-600" />
                </Button>
                <Button
                  isIconOnly
                  aria-label="آخر قيد"
                  className="border border-transparent hover:border-slate-300 hover:bg-slate-100"
                  size="sm"
                  variant="light"
                  onPress={() => handleNavigate(navigationTargets.last)}
                >
                  <ForwardIcon className="h-4 w-4 text-slate-600" />
                </Button>
              </div>
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

        {/* نموذج بيانات القيد */}
        <div className="bg-white rounded-lg border border-slate-200 mb-2">
          <div
            ref={selectorsRef}
            className="p-2"
            onKeyDownCapture={handleKeyDownSelectors}
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {/* رقم المرجع - أضيق */}
              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-sm font-medium text-slate-700">
                  رقم المرجع
                </label>
                <input
                  className="text-sm border border-slate-300 rounded-md px-3 py-2 h-10 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                  disabled={!isEditing}
                  placeholder="أدخل رقم المرجع"
                  readOnly={!isEditing}
                  value={voucher.ref_no || ""}
                  onChange={(e) =>
                    setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))
                  }
                />
              </div>

              {/* تاريخ ووقت القيد - تصغير قليلاً */}
              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-sm font-medium text-slate-700">
                  تاريخ ووقت القيد
                </label>
                <input
                  className="text-sm border border-slate-300 rounded-md px-3 py-2 h-10 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                  disabled={!isEditing}
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
              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-sm font-medium text-slate-700">
                  حالة القيد
                </label>
                <select
                  className="text-sm border border-slate-300 rounded-md px-3 py-2 h-10 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                  disabled={!isEditing}
                  value={String(voucher.vouch_status ?? 1)}
                  onChange={(e) =>
                    setVoucher((prev) => ({
                      ...prev,
                      vouch_status: parseInt(e.target.value),
                    }))
                  }
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
                        `حالة ${status.code_id ?? (status.id || status.Id)}`;

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
                      <option value="0">ملغي</option>
                      <option value="1">فعال</option>
                      <option value="2">معلق</option>
                      <option value="3">غير مكتمل</option>
                    </>
                  )}
                </select>
              </div>

              {/* نوع القيد - توسيع قليلاً */}
              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-sm font-medium text-slate-700">
                  نوع القيد
                </label>
                <select
                  className="text-sm border border-slate-300 rounded-md px-3 py-2 h-10 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                  disabled={!isEditing}
                  value={voucher.vouch_type || 2}
                  onChange={(e) => updateVoucherType(parseInt(e.target.value))}
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
                      <option value="1">قيد يومية</option>
                      <option value="2">قيد عكسي</option>
                      <option value="3">قيد تسوية</option>
                      <option value="4">قيد فوارق عملة</option>
                      <option value="5">قيد فوارق مخزون</option>
                      <option value="6">قيد مرتبات</option>
                    </>
                  )}
                </select>
              </div>

              {/* مركز التكلفة */}
              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-sm font-medium text-slate-700">
                  مركز التكلفة
                </label>
                <ReactSelect
                  isSearchable
                  className="text-sm"
                  classNamePrefix="react-select"
                  components={{ IndicatorSeparator: () => null }}
                  instanceId="voucher-cost-center-select"
                  isDisabled={!isEditing || costCenters.length === 0}
                  menuPortalTarget={
                    typeof window !== "undefined" ? document.body : null
                  }
                  menuPosition="fixed"
                  options={costCenterSelectOptions}
                  placeholder="اختر مركز التكلفة..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "40px",
                      height: "40px",
                      fontSize: "14px",
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    option: (base) => ({
                      ...base,
                      fontSize: "14px",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      fontSize: "14px",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      fontSize: "14px",
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
                />
              </div>
            </div>
          </div>
        </div>

        {/* البيان */}
        <div className="mb-2">
          <label className="text-sm font-medium text-slate-700">البيان</label>
          <div className="relative">
            <input
              className="text-sm border border-slate-300 rounded-md px-3 py-2 pr-10 h-10 w-full focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:cursor-not-allowed disabled:bg-slate-50"
              disabled={!isEditing}
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
            />
            {isEditing && (
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all duration-200"
                title="توسيع البيان"
                type="button"
                onClick={() => setIsNotesModalOpen(true)}
              >
                <ArrowsPointingOutIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* جدول تفاصيل القيد */}
        <div className="bg-white rounded-lg border border-slate-200 mb-2">
          <div className="p-1.5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800">
              تفاصيل القيد
            </h3>
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
                {!isBalanced && (
                  <span className="block text-xs mt-1">
                    {!isCashBalanced && "نقد"}
                    {!isCashBalanced && !isGoldBalanced && " + "}
                    {!isGoldBalanced && "ذهب"}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="p-1">
            <div className="flex justify-between mb-1">
              <button
                className="btn"
                disabled={!isEditing}
                type="button"
                onClick={addDetailRow}
              >
                + صف
              </button>
            </div>
            {/* رسالة تحذيرية للحسابات الفارغة - تظهر فقط بعد محاولة الحفظ */}
            {showValidationErrors &&
              details.some(
                (detail) => !detail.acc_id || detail.acc_id === 0,
              ) && (
                <div className="mb-1 p-1.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                  ⚠️ يرجى اختيار حساب لجميع الصفوف قبل الحفظ
                </div>
              )}

            <div className="overflow-x-auto mb-1 max-w-full">
              <table className="min-w-[1350px] border text-xs text-center table-fixed">
                <thead className="bg-gray-100 text-xs font-bold">
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
                    <th
                      className="w-40 p-0.5 font-bold text-slate-700 border"
                      rowSpan={2}
                    >
                      مركز التكلفة
                    </th>
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
                      مدين (جم معاير)
                    </th>
                    <th className="w-20 p-0.5 font-bold text-slate-700 border">
                      دائن (جم معاير)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail, index) => (
                    <tr
                      key={index}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${
                        showValidationErrors &&
                        (!detail.acc_id || detail.acc_id === 0)
                          ? "bg-red-50 border-red-200"
                          : ""
                      }`}
                    >
                      <td className="p-0 border bg-white">
                        <div
                          onKeyDownCapture={(e) => {
                            // معالجة F4 لفتح/إغلاق القائمة باستخدام الدالة العامة
                            if (handleF4KeyForSelect(e)) {
                              return;
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
                              `إضافة حساب جديد: "${inputValue}"`
                            }
                            instanceId={`account-select-${index}`}
                            isDisabled={!isEditing}
                            loadOptions={loadAccountOptions}
                            menuPortalTarget={
                              typeof window !== "undefined" ? document.body : null
                            }
                            menuPosition="fixed"
                            placeholder="اختر الحساب..."
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

                              if (!selected) return;

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
                          ref={(el) => setInputRef(index, 1, el)}
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
                          ref={(el) => setInputRef(index, 2, el)}
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
                          className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-amber-50 ${!isEditing ? "cursor-not-allowed" : ""}`}
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
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>

                      <td className="p-0 border bg-amber-50">
                        <input
                          className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-amber-50 ${!isEditing ? "cursor-not-allowed" : ""}`}
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
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>

                      <td className="p-0 border">
                        <input
                          readOnly
                          className="w-full h-full text-xs border-0 rounded-none text-center cursor-not-allowed"
                          placeholder="875"
                          type="text"
                          value={String(detail.gauge || 875)}
                        />
                      </td>

                      <td className="p-0 border bg-amber-50">
                        <input
                          disabled
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 cursor-not-allowed bg-amber-50"
                          placeholder="0.00"
                          step="0.000001"
                          title="يُحسب تلقائياً من الذهب القائم × (المعايرة / 875)"
                          type="number"
                          value={
                            detail.g_debit_base
                              ? String(detail.g_debit_base)
                              : ""
                          }
                        />
                      </td>

                      <td className="p-0 border bg-amber-50">
                        <input
                          disabled
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 cursor-not-allowed bg-amber-50"
                          placeholder="0.00"
                          step="0.000001"
                          title="يُحسب تلقائياً من الذهب القائم × (المعايرة / 875)"
                          type="number"
                          value={
                            detail.g_credit_base
                              ? String(detail.g_credit_base)
                              : ""
                          }
                        />
                      </td>

                      <td className="p-0 border">
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
                          placeholder="مركز التكلفة..."
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
                          }}
                        />
                      </td>

                      <td className="p-0 border">
                        <input
                          className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                          disabled={!isEditing}
                          placeholder="البيان"
                          readOnly={!isEditing}
                          type="text"
                          value={detail.vouch_notes || ""}
                          onChange={(e) =>
                            updateDetail(index, "vouch_notes", e.target.value)
                          }
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
                              ? "يجب أن يكون هناك سطرين على الأقل"
                              : "حذف السطر"
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

        {/* شريط الإجماليات */}
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

            <div className="flex items-center gap-2" />
          </div>
        </div>

        {/* نافذة القيود السابقة */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  اختر قيد سابق
                </h3>
              </div>

              <div className="p-4">
                <input
                  className="w-full mb-4 text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="بحث في القيود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-right p-2 font-medium text-slate-700">
                          رقم القيد
                        </th>
                        <th className="text-right p-2 font-medium text-slate-700">
                          التاريخ
                        </th>
                        <th className="text-right p-2 font-medium text-slate-700">
                          البيان
                        </th>
                        <th className="text-right p-2 font-medium text-slate-700">
                          الحالة
                        </th>
                        <th className="text-right p-2 font-medium text-slate-700">
                          إجراء
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
                                    0: "ملغي",
                                    1: "فعال",
                                    2: "معلق",
                                    3: "غير مكتمل",
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
                                        ? "غير محدد"
                                        : `حالة ${vouchStatusNum}`)
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
                                      ? "غير محدد"
                                      : `حالة ${vouchStatusNum}`)
                                  );
                                })()}
                              </span>
                            </td>
                            <td className="p-2">
                              <button
                                className="h-6 px-2 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 rounded-md shadow-sm"
                                onClick={() => {
                                  createFromPrevious(v);
                                }}
                              >
                                اختر
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="h-8 px-4 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm font-medium"
                    onClick={() => setIsModalOpen(false)}
                  >
                    إلغاء
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
    </>
  );
}
