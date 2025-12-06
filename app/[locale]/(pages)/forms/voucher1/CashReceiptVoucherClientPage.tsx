"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import AsyncCreatableSelect from "react-select/async-creatable";
import ReactSelect from "react-select";
import toast from "react-hot-toast";
import {
  CheckIcon,
  PencilIcon,
  PrinterIcon,
  PlusIcon,
  ArrowsPointingOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  BackwardIcon,
  ForwardIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import clsx from "clsx";
import { useTranslations, useLocale } from "next-intl";
import { getLocaleDir } from "@/i18n/config";
import {
  Button,
  Checkbox,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
} from "@heroui/react";

import useEnterKeyNavigation from "@/app/[locale]/(pages)/forms/invoices/hooks/useEnterKeyNavigation";
import useKeyAsTab from "@/hooks/useKeyAsTab";
import { Voucher, VoucherDetail, VoucherBox } from "@/types/voucher";
import { useCashReceiptVoucherForm } from "@/hooks/useCashReceiptVoucherForm";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";
import { voucherService } from "@/services/api";

import "bootstrap-icons/font/bootstrap-icons.css";

interface CashReceiptVoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  voucherBoxes?: VoucherBox[];
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
  boxes: any[];
  costCenters: any[];
  voucherTypes: any[];
  voucherStatuses: any[];
  startInEditMode?: boolean;
  vouchType: number;
  formMode?: "new" | "edit" | "preview";
}

export default function CashReceiptVoucherClientPage({
  voucherData,
  voucherDetailsData,
  voucherBoxes: initialVoucherBoxes = [],
  isNewVoucher = true,
  voucherRecordId,
  navigationInfo,
  accounts: initialAccounts,
  boxes: initialBoxes,
  costCenters: initialCostCenters,
  voucherTypes: initialVoucherTypes,
  voucherStatuses: initialVoucherStatuses,
  startInEditMode = false,
  vouchType,
  formMode = "new",
}: CashReceiptVoucherClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("forms.cashReceiptVoucher");
  
  // Dynamic text alignment classes based on locale
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const textAlignCenter = "text-center";

  // Handle search - must be before any conditional returns (Rules of Hooks)
  const [searchTerm, setSearchTerm] = useState("");
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const {
    // State
    voucher,
    setVoucher,
    voucherBoxes,
    details,
    accounts,
    boxes,
    costCenters,
    voucherTypes,
    voucherStatuses,
    isLoading,
    isEditing,
    isPrinting,
    isClient,
    // defaultAccountOptions,

    // Totals and balance
    totals,
    balance,
    isBalanced,

    // Functions
    updateVoucherBox,
    addVoucherBoxRow,
    removeVoucherBoxRow,
    updateDetail,
    addDetailRow,
    removeDetailRow,
    handleMasterCostChange,
    saveVoucher,
    printVoucher,
    loadAccountOptions,
    getAccountSelectValue,
    updateAccountsList,
  } = useCashReceiptVoucherForm({
    voucherData,
    voucherDetailsData,
    voucherBoxes: initialVoucherBoxes,
    isNewVoucher,
    voucherRecordId,
    accounts: initialAccounts,
    boxes: initialBoxes,
    costCenters: initialCostCenters,
    voucherTypes: initialVoucherTypes,
    voucherStatuses: initialVoucherStatuses,
    startInEditMode,
    vouchType,
    formMode,
  });

  // دالة لبناء روابط التنقل (مثل الفواتير)
  const resolvePaginatedVoucherHref = useCallback(
    (vouchId: number | null) => {
      if (!vouchId) return null;

      // تحديد المسار بناءً على pathname (voucher1 أو voucher2)
      const basePath = pathname?.includes("/voucher2")
        ? "/forms/voucher2"
        : "/forms/voucher1";

      return `${basePath}/${vouchId}?mode=preview`;
    },
    [pathname],
  );

  // metadata للتنقل (مثل الفواتير)
  const navigationMetadata = useMemo(() => {
    if (!navigationInfo) return null;

    const nav = navigationInfo;

    return {
      nextVoucherHref: resolvePaginatedVoucherHref(nav.next ?? null),
      prevVoucherHref: resolvePaginatedVoucherHref(nav.previous ?? null),
      lastVoucherHref: resolvePaginatedVoucherHref(nav.last ?? null),
      firstVoucherHref: resolvePaginatedVoucherHref(nav.first ?? null),
      totalVouchers: nav.vouchersCount,
    };
  }, [navigationInfo, resolvePaginatedVoucherHref]);

  const navigationTargets = useMemo(() => {
    return {
      previous: navigationInfo?.previous ?? -1,
      next: navigationInfo?.next ?? -1,
      first: navigationInfo?.first ?? -1,
      last: navigationInfo?.last ?? -1,
    };
  }, [navigationInfo]);

  const handleNavigate = (targetId?: number | null) => {
    if (!targetId || targetId <= 0) {
      return;
    }

    const currentRecordId = voucher.id ?? voucher.vouch_id ?? null;

    if (currentRecordId && Number(currentRecordId) === targetId) {
      return;
    }

    router.push(`/forms/voucher1/${targetId}?mode=preview`);
    router.refresh();
  };

  // رقم السند الحالي
  const voucherNumber = voucher.vouch_id ? String(voucher.vouch_id) : "";

  // Focus reference number on load and when pathname changes
  useEffect(() => {
    // محاولة التركيز على حقل رقم المرجع عند تحميل الصفحة أو تغيير المسار
    const focusRefNo = () => {
      const refNoInput = document.getElementById("cash-receipt-ref-no");

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
  const notesInputRef = useRef<HTMLInputElement>(null);
  const firstCashTableInputRef = useRef<HTMLInputElement>(null);
  const firstAccountTableInputRef = useRef<HTMLInputElement | null>(null);

  // Hook for Enter key navigation in top form fields
  const {
    handleKeyDown: handleKeyDownSelectors,
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

      // Allow navigation through all fields smoothly
      return false;
    },
    onBoundaryFocus: (direction) => {
      // When reaching the end of selectors (after الحالة), move to notes input
      if (direction === 1) {
        const currentElement = document.activeElement as HTMLElement;
        const isInSelectors = selectorsRef.current?.contains(currentElement);

        if (isInSelectors) {
          // Check if we're at the last field (الحالة)
          const allFocusable = Array.from(
            selectorsRef.current?.querySelectorAll(
              'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), [role="combobox"]',
            ) || [],
          ) as HTMLElement[];

          const currentIndex = allFocusable.indexOf(currentElement);

          if (currentIndex === allFocusable.length - 1) {
            // Move to notes input
            notesInputRef.current?.focus();
            return true;
          }
        }
      }

      return false;
    },
  });

  // Hook for Enter key navigation in cash table rows
  const {
    setInputRef: setCashInputRef,
    handleKeyDown: handleCashKeyDown,
    focusFirstInRow: focusFirstInCashRow,
  } = useEnterKeyNavigation({
    rows: voucherBoxes,
    rowHasValue: (row) => {
      return !!(
        (row?.box_id && row.box_id > 0) ||
        (row?.amount && row.amount > 0)
      );
    },
    onAddRow: addVoucherBoxRow,
    onLastCell: () => {
      // عندما نصل لأخر حقل في جدول النقدية، ننتقل لجدول الحسابات
      firstAccountTableInputRef.current?.focus();
    },
  });

  // Hook for Enter key navigation in accounts table rows
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

  const getBoxAccountName = (
    boxId: number | string | null | undefined,
  ): { name: string; code: string | number | null } => {
    if (boxId === null || boxId === undefined || boxId === "") {
      return { name: "", code: null };
    }

    const numericId = Number(boxId);

    if (!Number.isFinite(numericId)) {
      return { name: "", code: boxId };
    }

    const boxItem = boxes?.find((box: any) => {
      const candidate = box?.id ?? box?.box_id ?? box?.box;

      return Number(candidate) === numericId;
    });

    return {
      name: boxItem?.box_name || boxItem?.name || boxItem?.label || "",
      code: boxItem?.acc ?? boxItem?.acc_id ?? boxId,
    };
  };

  // Helper functions for box select
  const getBoxSelectValue = (boxId: number | null | undefined) => {
    if (!boxId || boxId <= 0) {
      return null;
    }

    const box = boxes.find((b) => b.id === boxId);

    if (!box) {
      return null;
    }

    return {
      value: String(box.id),
      label: box.cust_name || box.name || box.box_name || `صندوق ${box.id}`,
    };
  };

  const boxSelectOptions = useMemo(() => {
    return boxes.map((box) => ({
      value: String(box.id),
      label: box.cust_name || box.name || box.box_name || `صندوق ${box.id}`,
    }));
  }, [boxes]);

  // Helper functions for cost center select
  const getCostCenterSelectValue = (costId: number | null | undefined) => {
    if (!costId || costId <= 0) {
      return null;
    }

    const center = costCenters.find((c) => c.id === costId);

    if (!center) {
      return null;
    }

    return {
      value: String(center.id),
      label: center.name || center.cost_name || `مركز ${center.id}`,
    };
  };

  const costCenterSelectOptions = useMemo(() => {
    return (costCenters || []).map((center) => ({
      value: String(center.id),
      label: center.name || center.cost_name || `مركز ${center.id}`,
    }));
  }, [costCenters]);

  if (!isClient) {
    return (
      <div className={`flex justify-center items-center h-screen ${textAlignCenter}`}>
        {t("status.loading")}
      </div>
    );
  }

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim() === "") {
      toast.error(t("messages.searchError"));

      return;
    }

    const searchValue = searchTerm.trim();
    const searchNumber = Number(searchValue);

    if (!Number.isFinite(searchNumber) || searchNumber <= 0) {
      toast.error(t("messages.searchInvalid"));

      return;
    }

    try {
      // ✅ استخدام getVoucherById مباشرة (مثل الفواتير) - يبحث عن id أو vouch_id
      let foundVoucher = await voucherService.getVoucherById(searchNumber, {
        xvouch_type: vouchType.toString(), // 1 للقبض، 2 للصرف
      });

      // إذا لم نجد في النوع المحدد، جرب البحث في جميع الأنواع
      if (!foundVoucher) {
        foundVoucher = await voucherService.getVoucherById(searchNumber, {
          xvouch_type: "0", // جميع الأنواع
        });
      }

      if (foundVoucher) {
        const voucherWithId = foundVoucher as any;

        // التحقق من نوع السند
        if (voucherWithId.vouch_type !== vouchType) {
          const voucherTypeName =
            vouchType === 1
              ? t("messages.voucherTypeReceipt")
              : t("messages.voucherTypePayment");

          toast.error(
            t("messages.voucherWrongType", {
              id: voucherWithId.vouch_id,
              type: voucherTypeName,
            }),
          );

          return;
        }

        // ✅ استخدام id الحقيقي (primary key) فقط للانتقال - routing يتوقع id وليس vouch_id
        const targetId = voucherWithId.id;

        if (targetId && Number(targetId) > 0) {
          const basePath =
            vouchType === 1 ? "/forms/voucher1" : "/forms/voucher2";

          router.push(`${basePath}/${targetId}?mode=preview`);
          router.refresh();
          setSearchTerm(""); // مسح حقل البحث

          return;
        } else {
          console.error(
            "Voucher found but missing id (primary key):",
            voucherWithId,
          );
          toast.error(t("messages.voucherAccessError"));
        }
      }

      // إذا لم نجد السند نهائياً
      const voucherTypeName =
        vouchType === 1
          ? t("messages.voucherTypeReceipt")
          : t("messages.voucherTypePayment");

      toast.error(
        t("messages.voucherNotFound", {
          type: voucherTypeName,
          number: searchValue,
        }),
      );
    } catch (error) {
      console.error("Error searching voucher:", error);
      toast.error(t("messages.searchErrorGeneric"));
    }
  };

  // Handle edit click
  const handleEditClick = () => {
    setVoucher((prev) => ({
      ...prev,
      commit: false,
    }));

    if (pathname && voucherRecordId) {
      const basePath = vouchType === 1 ? "/forms/voucher1" : "/forms/voucher2";

      router.push(`${basePath}/${voucherRecordId}?mode=edit`);
    }
  };

  const voucherTypeName =
    voucherTypes.find((type) => (type.Id || type.id) === vouchType)?.name ||
    (vouchType === 1
      ? t("messages.voucherTypeReceipt")
      : t("messages.voucherTypePayment"));

  return (
    <div className="p-2 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-2 mb-2 border border-slate-200">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-3">
            <h1 className={`text-xl font-bold text-slate-800 flex items-center gap-2 ${textAlign}`}>
              <span>{voucherTypeName}</span>
              <span className="text-slate-600 font-medium">
                #
                {voucher.vouch_id && Number(voucher.vouch_id) > 0
                  ? voucher.vouch_id
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

          {/* البحث */}
          <div className="flex items-center gap-2">
            <input
              className="w-32 h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
              placeholder={t("actions.search")}
              type="number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <button
              className="h-7 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              onClick={handleSearch}
            >
              <i className="bi bi-search w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
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
              className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
              startContent={<PlusIcon className="w-4 h-4" />}
              variant="solid"
              onPress={() => {
                // تحديد المسار بناءً على pathname أو vouchType
                const basePath = pathname?.includes("/voucher2")
                  ? "/forms/voucher2"
                  : "/forms/voucher1";

                router.push(basePath);
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

      {/* Form Fields */}
      <div
        ref={selectorsRef}
        className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2"
        onKeyDownCapture={handleKeyDownSelectors}
      >
        {/* رقم المرجع */}
        <div className="md:col-span-1">
          <label
            className={`block text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
            htmlFor="cash-receipt-ref-no"
          >
            {t("fields.refNo")}
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            id="cash-receipt-ref-no"
            readOnly={!isEditing}
            type="text"
            value={voucher.ref_no || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))
            }
          />
        </div>

        {/* التاريخ والوقت */}
        <div className="md:col-span-1">
          <label
            className={`block text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
            htmlFor="cash-receipt-date-time"
          >
            {t("fields.dateTime")}
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            id="cash-receipt-date-time"
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
                vouch_date: new Date(e.target.value).toISOString(),
              }))
            }
          />
        </div>

        {costCenters.length > 0 && (
          <div className="md:col-span-1">
            <label
              className={`block text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
              htmlFor="cash-receipt-cost-center"
            >
              {t("fields.costCenter")}
            </label>
            <div>
              <ReactSelect
                isSearchable
                className="text-xs"
                classNamePrefix="react-select"
                components={{ IndicatorSeparator: () => null }}
                instanceId="voucher-cost-center-select"
                isDisabled={!isEditing}
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
                    const isExpanded =
                      selectButton.getAttribute("aria-expanded") === "true";

                    // إذا كانت القائمة مفتوحة، نسمح بالتفاعل الطبيعي
                    if (isExpanded && e.key !== "Escape") {
                      return;
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

        {/* الحالة */}
        <div className="md:col-span-1">
          <label
            className={`block text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
            htmlFor="cash-receipt-status"
          >
            {t("fields.status")}
          </label>
          <select
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            id="cash-receipt-status"
            value={String(voucher.vouch_status ?? 1)}
            onChange={(e) =>
              setVoucher((prev) => ({
                ...prev,
                vouch_status: parseInt(e.target.value) || 1,
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
                  "";

                return (
                  <option key={status.id || status.Id} value={statusValue}>
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
      </div>

      {/* البيان */}
      <div className="mb-2">
        <label
          className={`block text-xs font-medium text-slate-700 mb-0.5 ${textAlign}`}
          htmlFor="cash-receipt-notes"
        >
          {t("fields.notes")}
        </label>
        <div className="relative">
          <input
            ref={notesInputRef}
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 pr-8"
            disabled={!isEditing}
            id="cash-receipt-notes"
            placeholder={t("fields.notesPlaceholder")}
            readOnly={!isEditing}
            type="text"
            value={voucher.vouch_notes || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, vouch_notes: e.target.value }))
            }
            onDoubleClick={() => {
              if (isEditing) {
                setIsNotesModalOpen(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                // Move to first field in cash table
                firstCashTableInputRef.current?.focus();
              }
            }}
          />
          {isEditing && (
            <button
              className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all duration-200"
              data-skip-key-as-tab="true"
              title={t("actions.expandNotes")}
              type="button"
              onClick={() => setIsNotesModalOpen(true)}
            >
              <ArrowsPointingOutIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Cash Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-2">
        <div className="p-1.5 border-b border-slate-200 bg-slate-50">
          <h3 className={`text-sm font-semibold text-slate-800 ${textAlign}`}>
            {t("tables.cash.title")}
          </h3>
        </div>
        <div className="p-1">
          <div className="flex justify-between mb-1">
            <button
              className={`btn ${textAlign}`}
              data-skip-key-as-tab="true"
              disabled={!isEditing}
              type="button"
              onClick={addVoucherBoxRow}
            >
              {t("actions.addRow")}
            </button>
          </div>
          <div className="overflow-x-auto mb-1 max-w-full">
            <table className="min-w-[1200px] border text-xs text-center table-fixed">
              <thead className="bg-gray-100 text-xs font-bold">
                <tr>
                  <th className={`w-32 p-1 border ${textAlignCenter}`}>
                    {t("tables.cash.columns.amount")}
                  </th>
                  <th className={`w-48 p-1 border ${textAlignCenter}`}>
                    {t("tables.cash.columns.box")}
                  </th>
                  <th className={`w-80 p-1 border ${textAlignCenter}`}>
                    {t("tables.cash.columns.notes")}
                  </th>
                  <th className={`w-48 p-1 border ${textAlignCenter}`}>
                    {t("tables.cash.columns.costCenter")}
                  </th>
                  <th className={`w-32 p-1 border ${textAlignCenter}`}>
                    {t("tables.cash.columns.invoiceNumber")}
                  </th>
                  <th className={`w-12 p-1 border ${textAlignCenter}`}>
                    {t("tables.cash.columns.delete")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {voucherBoxes.map((box, index) => {
                  let currentColIndex = -1;

                  return (
                    <tr key={index} className="border-b">
                      <td className="p-0 border">
                        {(() => {
                          const thisCol = ++currentColIndex; // 0

                          return (
                            <input
                              ref={(el) => {
                                const refSetter = setCashInputRef(
                                  index,
                                  thisCol,
                                );

                                if (index === 0 && el) {
                                  (
                                    firstCashTableInputRef as React.MutableRefObject<HTMLInputElement | null>
                                  ).current = el;
                                }

                                refSetter(el);
                              }}
                              className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                              disabled={!isEditing}
                              min="0"
                              readOnly={!isEditing}
                              style={{
                                MozAppearance: "textfield",
                                WebkitAppearance: "none",
                                appearance: "none",
                              }}
                              type="number"
                              value={box.amount || ""}
                              onChange={(e) =>
                                updateVoucherBox(
                                  index,
                                  "amount",
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : 0,
                                )
                              }
                              onKeyDown={(e) => {
                                handleCashKeyDown(e, index, thisCol, {
                                  isLastCol: thisCol === 4,
                                });
                              }}
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          );
                        })()}
                      </td>
                      <td className="p-0 border">
                        {(() => {
                          const thisCol = ++currentColIndex; // 1

                          return (
                            <div
                              id={`box-select-${index}`}
                              ref={(el) => {
                                const refSetter = setCashInputRef(
                                  index,
                                  thisCol,
                                );

                                if (el) {
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

                                  if (!findAndSetRef()) {
                                    setTimeout(() => {
                                      findAndSetRef();
                                    }, 50);
                                  }
                                } else {
                                  refSetter(null);
                                }
                              }}
                              onKeyDownCapture={(e) => {
                                const target = e.target as HTMLElement;
                                const combobox =
                                  target.closest('[role="combobox"]');
                                const isInListbox =
                                  target.closest('[role="listbox"]');

                                if (isInListbox) {
                                  return;
                                }

                                if (combobox) {
                                  const isExpanded =
                                    combobox.getAttribute("aria-expanded") ===
                                    "true";

                                  if (e.key === "Enter" && !isExpanded) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleCashKeyDown(
                                      e as React.KeyboardEvent,
                                      index,
                                      thisCol,
                                      {
                                        isLastCol: thisCol === 4,
                                      },
                                    );
                                    return;
                                  }

                                  // معالجة الأسهم عندما تكون القائمة مغلقة
                                  if (
                                    (e.key === "ArrowUp" ||
                                      e.key === "ArrowDown" ||
                                      e.key === "ArrowLeft" ||
                                      e.key === "ArrowRight") &&
                                    !isExpanded
                                  ) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleCashKeyDown(
                                      e as React.KeyboardEvent,
                                      index,
                                      thisCol,
                                      {
                                        isLastCol: thisCol === 4,
                                      },
                                    );
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
                                instanceId={`box-select-${index}`}
                                isDisabled={!isEditing}
                                menuPortalTarget={
                                  typeof window !== "undefined"
                                    ? document.body
                                    : null
                                }
                                menuPosition="fixed"
                                options={boxSelectOptions}
                                placeholder={t("tables.cash.columns.boxPlaceholder")}
                                styles={{
                                  control: (base) => ({
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
                                value={getBoxSelectValue(box.box_id)}
                                onChange={(selectedOption: any) => {
                                  if (!isEditing) return;
                                  const selectedBoxId = selectedOption?.value
                                    ? parseInt(selectedOption.value)
                                    : 0;
                                  const selectedBox = boxes.find(
                                    (b) => b.id === selectedBoxId,
                                  );

                                  updateVoucherBox(
                                    index,
                                    "box_id",
                                    selectedBoxId,
                                  );
                                  // تحديث معلومات box object إذا كان الصندوق محدداً
                                  if (selectedBox) {
                                    updateVoucherBox(index, "box", {
                                      id: selectedBox.id,
                                      cust_name:
                                        selectedBox.cust_name ||
                                        selectedBox.name ||
                                        "",
                                      cust_code: selectedBox.cust_code || "",
                                      box_type: selectedBox.box_type,
                                    });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  // ✅ معالجة F4 لفتح/إغلاق القائمة
                                  const target = e.target as HTMLElement | null;

                                  if (!target) return;

                                  const isInListbox =
                                    target.closest('[role="listbox"]');
                                  if (isInListbox) {
                                    return;
                                  }

                                  const selectButton =
                                    target.closest('[role="combobox"]');
                                  if (selectButton) {
                                    const isExpanded =
                                      selectButton.getAttribute(
                                        "aria-expanded",
                                      ) === "true";

                                    // إذا كانت القائمة مفتوحة، نسمح بالتفاعل الطبيعي
                                    if (isExpanded && e.key !== "Escape") {
                                      return;
                                    }

                                    if (e.key === "Escape") {
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
                          const thisCol = ++currentColIndex; // 2

                          return (
                            <input
                              ref={setCashInputRef(index, thisCol)}
                              className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                              disabled={!isEditing}
                              readOnly={!isEditing}
                              type="text"
                              value={box.vouch_notes || ""}
                              onChange={(e) =>
                                updateVoucherBox(
                                  index,
                                  "vouch_notes",
                                  e.target.value,
                                )
                              }
                              onKeyDown={(e) => {
                                handleCashKeyDown(e, index, thisCol, {
                                  isLastCol: thisCol === 4,
                                });
                              }}
                            />
                          );
                        })()}
                      </td>
                      <td className="p-0 border">
                        {(() => {
                          const thisCol = ++currentColIndex; // 3

                          return (
                            <div
                              id={`cost-center-box-select-${index}`}
                              ref={(el) => {
                                const refSetter = setCashInputRef(
                                  index,
                                  thisCol,
                                );

                                if (el) {
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

                                  if (!findAndSetRef()) {
                                    setTimeout(() => {
                                      findAndSetRef();
                                    }, 50);
                                  }
                                } else {
                                  refSetter(null);
                                }
                              }}
                              onKeyDownCapture={(e) => {
                                const target = e.target as HTMLElement;
                                const combobox =
                                  target.closest('[role="combobox"]');
                                const isInListbox =
                                  target.closest('[role="listbox"]');

                                if (isInListbox) {
                                  return;
                                }

                                if (combobox) {
                                  const isExpanded =
                                    combobox.getAttribute("aria-expanded") ===
                                    "true";

                                  if (e.key === "Enter" && !isExpanded) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleCashKeyDown(
                                      e as React.KeyboardEvent,
                                      index,
                                      thisCol,
                                      {
                                        isLastCol: thisCol === 4,
                                      },
                                    );
                                    return;
                                  }

                                  // معالجة الأسهم عندما تكون القائمة مغلقة
                                  if (
                                    (e.key === "ArrowUp" ||
                                      e.key === "ArrowDown" ||
                                      e.key === "ArrowLeft" ||
                                      e.key === "ArrowRight") &&
                                    !isExpanded
                                  ) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleCashKeyDown(
                                      e as React.KeyboardEvent,
                                      index,
                                      thisCol,
                                      {
                                        isLastCol: thisCol === 4,
                                      },
                                    );
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
                                instanceId={`cost-center-box-select-${index}`}
                                isDisabled={!isEditing}
                                menuPortalTarget={
                                  typeof window !== "undefined"
                                    ? document.body
                                    : null
                                }
                                menuPosition="fixed"
                                options={costCenterSelectOptions}
                                placeholder={t("tables.cash.columns.costCenterPlaceholder")}
                                styles={{
                                  control: (base) => ({
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
                                value={getCostCenterSelectValue(box.cost_id)}
                                onChange={(selectedOption: any) => {
                                  if (!isEditing) return;
                                  updateVoucherBox(
                                    index,
                                    "cost_id",
                                    selectedOption?.value
                                      ? parseInt(selectedOption.value)
                                      : null,
                                  );
                                }}
                                onKeyDown={(e) => {
                                  // ✅ معالجة F4 لفتح/إغلاق القائمة
                                  const target = e.target as HTMLElement | null;

                                  if (!target) return;

                                  const isInListbox =
                                    target.closest('[role="listbox"]');
                                  if (isInListbox) {
                                    return;
                                  }

                                  const selectButton =
                                    target.closest('[role="combobox"]');
                                  if (selectButton) {
                                    const isExpanded =
                                      selectButton.getAttribute(
                                        "aria-expanded",
                                      ) === "true";

                                    // إذا كانت القائمة مفتوحة، نسمح بالتفاعل الطبيعي
                                    if (isExpanded && e.key !== "Escape") {
                                      return;
                                    }

                                    if (e.key === "Escape") {
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
                          const thisCol = ++currentColIndex; // 4

                          return (
                            <input
                              ref={setCashInputRef(index, thisCol)}
                              className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                              disabled={!isEditing}
                              min="0"
                              readOnly={!isEditing}
                              style={{
                                MozAppearance: "textfield",
                                WebkitAppearance: "none",
                                appearance: "none",
                              }}
                              type="number"
                              value={box.inv_id || ""}
                              onChange={(e) =>
                                updateVoucherBox(
                                  index,
                                  "inv_id",
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined,
                                )
                              }
                              onKeyDown={(e) => {
                                handleCashKeyDown(e, index, thisCol, {
                                  isLastCol: thisCol === 4,
                                });
                              }}
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          );
                        })()}
                      </td>
                      <td className="p-1 border">
                        <button
                          className="font-bold text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                          disabled={!isEditing}
                          onClick={() => removeVoucherBoxRow(index)}
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

      {/* Details Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-2">
        <div className="p-1.5 border-b border-slate-200 bg-slate-50">
          <h3 className={`text-sm font-semibold text-slate-800 ${textAlign}`}>
            {t("tables.accounts.title")}
          </h3>
        </div>
        <div className="p-1">
          <div className="flex justify-between mb-1">
            <button
              className={`btn ${textAlign}`}
              data-skip-key-as-tab="true"
              disabled={!isEditing}
              type="button"
              onClick={addDetailRow}
            >
              {t("actions.addRow")}
            </button>
          </div>
          <div className="overflow-x-auto mb-1 max-w-full">
            <table className="min-w-[1200px] border text-xs text-center table-fixed">
              <thead className="bg-gray-100 text-xs font-bold">
                <tr>
                  <th className={`w-80 p-2 border ${textAlignCenter}`}>
                    {t("tables.accounts.columns.account")}
                  </th>
                  <th className={`w-32 p-2 border ${textAlignCenter}`}>
                    {t("tables.accounts.columns.amount")}
                  </th>
                  <th className={`w-80 p-2 border ${textAlignCenter}`}>
                    {t("tables.accounts.columns.notes")}
                  </th>
                  <th className={`w-48 p-2 border ${textAlignCenter}`}>
                    {t("tables.accounts.columns.costCenter")}
                  </th>
                  <th className={`w-12 p-2 border ${textAlignCenter}`}>
                    {t("tables.accounts.columns.delete")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {details.map((detail, index) => {
                  let currentColIndex = -1;

                  return (
                    <tr key={index} className="border-b">
                      <td className="p-0 border">
                        {(() => {
                          const thisCol = ++currentColIndex; // 0

                          return (
                            <div
                              id={`account-select-${index}`}
                              ref={(el) => {
                                const refSetter = setInputRef(index, thisCol);

                                if (el) {
                                  const findAndSetRef = () => {
                                    const combobox = el.querySelector(
                                      '[role="combobox"]',
                                    ) as HTMLElement;

                                    if (combobox) {
                                      refSetter(
                                        combobox as unknown as HTMLInputElement,
                                      );
                                      // إضافة ref لأول حقل في جدول الحسابات
                                      if (index === 0) {
                                        (
                                          firstAccountTableInputRef as React.MutableRefObject<HTMLInputElement | null>
                                        ).current =
                                          combobox as unknown as HTMLInputElement;
                                      }
                                      return true;
                                    }
                                    return false;
                                  };

                                  if (!findAndSetRef()) {
                                    setTimeout(() => {
                                      findAndSetRef();
                                    }, 50);
                                  }
                                } else {
                                  refSetter(null);
                                }
                              }}
                              onKeyDownCapture={(e) => {
                                const target = e.target as HTMLElement;
                                const combobox =
                                  target.closest('[role="combobox"]');
                                const isInListbox =
                                  target.closest('[role="listbox"]');

                                if (isInListbox) {
                                  return;
                                }

                                if (combobox) {
                                  const isExpanded =
                                    combobox.getAttribute("aria-expanded") ===
                                    "true";

                                  // إذا كان combobox مفتوحاً، نسمح بالتفاعل الطبيعي مع القائمة
                                  if (isExpanded && e.key !== "Escape") {
                                    return; // لا نمنع - نسمح بالتفاعل الطبيعي
                                  }

                                  if (e.key === "Enter" && !isExpanded) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleKeyDownTable(
                                      e as React.KeyboardEvent,
                                      index,
                                      thisCol,
                                    );
                                    return;
                                  }

                                  // معالجة الأسهم عندما تكون القائمة مغلقة
                                  if (
                                    e.key === "ArrowUp" ||
                                    e.key === "ArrowDown" ||
                                    e.key === "ArrowLeft" ||
                                    e.key === "ArrowRight"
                                  ) {
                                    if (!isExpanded) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleKeyDownTable(
                                        e as React.KeyboardEvent,
                                        index,
                                        thisCol,
                                      );
                                      return;
                                    }
                                  }
                                }

                                if (e.key === "Escape") {
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
                                  t("tables.accounts.addAccountLabel", {
                                    value: inputValue,
                                  })
                                }
                                instanceId={`account-select-${index}`}
                                isDisabled={!isEditing}
                                loadOptions={loadAccountOptions}
                                menuPortalTarget={
                                  typeof window !== "undefined"
                                    ? document.body
                                    : null
                                }
                                menuPosition="fixed"
                                placeholder={t("tables.accounts.columns.accountPlaceholder")}
                                styles={{
                                  control: (base, state) => ({
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
                                    accounts.find(
                                      (acc) => acc.id === opt?.value,
                                    );

                                  if (!selected) return;

                                  updateAccountsList(selected);
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
                                }}
                                onKeyDown={(e) => {
                                  // ✅ معالجة F4 لفتح/إغلاق القائمة
                                  const target = e.target as HTMLElement | null;

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
                                      handleKeyDownTable(e, index, 0);

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
                                      handleKeyDownTable(e, index, 0);
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
                              className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                              disabled={!isEditing}
                              min="0"
                              placeholder="0.00"
                              readOnly={!isEditing}
                              style={{
                                MozAppearance: "textfield",
                                WebkitAppearance: "none",
                                appearance: "none",
                              }}
                              type="number"
                              value={
                                vouchType === 1
                                  ? detail.credit || ""
                                  : detail.debit || ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;

                                if (!val || parseFloat(val) >= 0) {
                                  if (vouchType === 1) {
                                    // سند قبض: المبلغ في credit
                                    updateDetail(
                                      index,
                                      "credit",
                                      val ? parseFloat(val) : undefined,
                                    );
                                    updateDetail(index, "debit", undefined);
                                  } else {
                                    // سند صرف: المبلغ في debit
                                    updateDetail(
                                      index,
                                      "debit",
                                      val ? parseFloat(val) : undefined,
                                    );
                                    updateDetail(index, "credit", undefined);
                                  }
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
                              className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                              disabled={!isEditing}
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
                                handleKeyDownTable(e, index, thisCol);
                              }}
                            />
                          );
                        })()}
                      </td>
                      <td className="p-0 border">
                        {(() => {
                          const thisCol = ++currentColIndex; // 3

                          return (
                            <div
                              id={`cost-center-detail-select-${index}`}
                              ref={(el) => {
                                const refSetter = setInputRef(index, thisCol);

                                if (el) {
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

                                  if (!findAndSetRef()) {
                                    setTimeout(() => {
                                      findAndSetRef();
                                    }, 50);
                                  }
                                } else {
                                  refSetter(null);
                                }
                              }}
                              onKeyDownCapture={(e) => {
                                const target = e.target as HTMLElement;
                                const combobox =
                                  target.closest('[role="combobox"]');
                                const isInListbox =
                                  target.closest('[role="listbox"]');

                                if (isInListbox) {
                                  return;
                                }

                                if (combobox) {
                                  const isExpanded =
                                    combobox.getAttribute("aria-expanded") ===
                                    "true";

                                  if (e.key === "Enter" && !isExpanded) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleKeyDownTable(
                                      e as React.KeyboardEvent,
                                      index,
                                      thisCol,
                                    );
                                    return;
                                  }

                                  // معالجة الأسهم عندما تكون القائمة مغلقة
                                  if (
                                    (e.key === "ArrowUp" ||
                                      e.key === "ArrowDown" ||
                                      e.key === "ArrowLeft" ||
                                      e.key === "ArrowRight") &&
                                    !isExpanded
                                  ) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleKeyDownTable(
                                      e as React.KeyboardEvent,
                                      index,
                                      thisCol,
                                    );
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
                                  typeof window !== "undefined"
                                    ? document.body
                                    : null
                                }
                                menuPosition="fixed"
                                options={costCenterSelectOptions}
                                placeholder={t("tables.cash.columns.costCenterPlaceholder")}
                                styles={{
                                  control: (base) => ({
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
                                }}
                                onKeyDown={(e) => {
                                  // ✅ معالجة F4 لفتح/إغلاق القائمة
                                  const target = e.target as HTMLElement | null;

                                  if (!target) return;

                                  const isInListbox =
                                    target.closest('[role="listbox"]');
                                  if (isInListbox) {
                                    return;
                                  }

                                  const selectButton =
                                    target.closest('[role="combobox"]');
                                  if (selectButton) {
                                    const isExpanded =
                                      selectButton.getAttribute(
                                        "aria-expanded",
                                      ) === "true";

                                    // إذا كانت القائمة مفتوحة، نسمح بالتفاعل الطبيعي
                                    if (isExpanded && e.key !== "Escape") {
                                      return;
                                    }

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

                                    if (e.key === "Escape") {
                                      return;
                                    }
                                  }
                                }}
                              />
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-1 border">
                        <button
                          className="font-bold text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                          disabled={!isEditing}
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

      {/* Totals */}
      <div className="mt-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className={`flex items-center gap-2 ${textAlign}`}>
            <span className={`text-gray-700 font-medium ${textAlign}`}>
              {t("totals.totalCash")}:
            </span>
            <span className={`font-semibold text-blue-700 flex items-center gap-1 ${textAlign}`}>
              {formatAmount(totals.totalBoxes)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className={`flex items-center gap-2 ${textAlign}`}>
            <span className={`text-gray-700 font-medium ${textAlign}`}>
              {t("totals.totalDetails")}:
            </span>
            <span className={`font-semibold text-green-700 flex items-center gap-1 ${textAlign}`}>
              {formatAmount(totals.totalDetails)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          {!isBalanced && (
            <div className={`flex items-center gap-2 ${textAlign}`}>
              <span className={`text-gray-700 font-medium ${textAlign}`}>
                {t("totals.difference")}:
              </span>
              <span className={`font-semibold text-red-700 flex items-center gap-1 ${textAlign}`}>
                {formatAmount(Math.abs(balance))}
                <RiyalIcon color="currentColor" />
                <span className="text-xs text-red-600">
                  ({balance > 0 ? t("totals.debit") : t("totals.credit")})
                </span>
              </span>
            </div>
          )}

          <div className={`flex items-center gap-2 ${textAlign}`}>
            <span className={`text-gray-700 font-medium ${textAlign}`}>
              {t("totals.status")}:
            </span>
            <span
              className={`font-semibold ${
                isBalanced ? "text-green-700" : "text-red-700"
              }`}
            >
              {isBalanced ? t("status.balanced") : t("status.unbalanced")}
            </span>
          </div>
        </div>
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
    </div>
  );
}
