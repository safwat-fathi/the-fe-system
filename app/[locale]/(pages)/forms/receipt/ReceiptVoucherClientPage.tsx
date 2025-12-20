"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import toast from "react-hot-toast";
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
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import clsx from "clsx";
import AsyncCreatableSelect from "react-select/async-creatable";
import ReactSelect, { type CSSObjectWithLabel } from "react-select";

import useEnterKeyNavigation from "@/app/[locale]/(pages)/forms/invoices/hooks/useEnterKeyNavigation";
import useKeyAsTab from "@/hooks/useKeyAsTab";
import { Voucher, VoucherBox, GVoucherDetail } from "@/types/voucher";
import { useReceiptDeliveryVoucherForm } from "@/hooks/useReceiptDeliveryVoucherForm";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";
import { getLocaleDir } from "@/i18n/config";

import "bootstrap-icons/font/bootstrap-icons.css";

interface ReceiptVoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherBoxes?: VoucherBox[];
  goldDetailsData?: GVoucherDetail[];
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
  goldBoxes?: any[];
  costCenters: any[];
  customers: any[];
  items: any[];
  voucherTypes: any[];
  startInEditMode?: boolean;
  vouchType: number; // 111 للاستلام
  formMode?: "new" | "edit" | "preview";
  categories?: any[];
}

export default function ReceiptVoucherClientPage({
  voucherData,
  voucherBoxes: initialVoucherBoxes = [],
  goldDetailsData: initialGoldDetails = [],
  isNewVoucher = true,
  voucherRecordId,
  navigationInfo,
  accounts: initialAccounts,
  boxes: initialBoxes,
  goldBoxes: initialGoldBoxes = [],
  costCenters: initialCostCenters,
  customers: initialCustomers,
  items: initialItems,
  voucherTypes: initialVoucherTypes,
  startInEditMode = false,
  vouchType,
  formMode = "new",
  categories: initialCategories = [],
}: ReceiptVoucherClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("forms.customerGoldVoucher");
  const tReceipt = useTranslations("forms.receiptVoucher");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const textAlignCenter = dir === "rtl" ? "text-center" : "text-center";

  // Use the hook for all state management and business logic
  const {
    // State
    voucher,
    setVoucher,
    voucherBoxes,
    goldDetails,
    boxes,
    goldBoxes,
    costCenters,
    customers,
    items,
    voucherTypes,
    isLoading,
    isEditing,
    isPrinting,
    setSelectedCustomer,
    defaultCustomerOptions,
    isClient,

    // Totals
    totals,

    // Functions
    loadItemOptions,
    loadCustomerOptions,
    getCustomerSelectValue,
    getItemSelectValue,
    updateVoucherBox,
    addVoucherBoxRow,
    removeVoucherBoxRow,
    updateGoldDetail,
    addGoldDetailRow,
    removeGoldDetailRow,
    saveVoucher,
    printVoucher,
  } = useReceiptDeliveryVoucherForm({
    voucherData,
    voucherBoxes: initialVoucherBoxes,
    goldDetailsData: initialGoldDetails,
    isNewVoucher,
    voucherRecordId,
    accounts: initialAccounts,
    boxes: initialBoxes,
    goldBoxes: initialGoldBoxes,
    costCenters: initialCostCenters,
    customers: initialCustomers,
    items: initialItems,
    voucherTypes: initialVoucherTypes,
    startInEditMode,
    vouchType,
    formMode,
    categories: initialCategories,
  });

  // رقم السند الحالي
  const voucherNumber =
    voucher.vouch_id && Number(voucher.vouch_id) > 0
      ? String(voucher.vouch_id)
      : voucher.id
        ? `DB-${voucher.id}`
        : "";

  // دالة لبناء روابط التنقل
  const resolvePaginatedVoucherHref = useCallback((vouchId: number | null) => {
    if (!vouchId) return null;

    return `/forms/receipt/${vouchId}?mode=preview`;
  }, []);

  // metadata للتنقل
  const navigationMetadata = useMemo(() => {
    if (!navigationInfo) return null;

    return {
      nextVoucherHref: resolvePaginatedVoucherHref(navigationInfo.next ?? null),
      prevVoucherHref: resolvePaginatedVoucherHref(
        navigationInfo.previous ?? null,
      ),
      lastVoucherHref: resolvePaginatedVoucherHref(navigationInfo.last ?? null),
      firstVoucherHref: resolvePaginatedVoucherHref(
        navigationInfo.first ?? null,
      ),
      totalVouchers: navigationInfo.vouchersCount,
    };
  }, [navigationInfo, resolvePaginatedVoucherHref]);

  // Handle search
  const [searchTerm, setSearchTerm] = useState("");
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const numericVoucherId = Number(voucher.vouch_id ?? 0);
  const hasVoucherId =
    Number.isFinite(numericVoucherId) && numericVoucherId > 0;

  // Ref للحقول العلوية للتنقل
  const selectorsRef = useRef<HTMLDivElement>(null);

  // تركيز المؤشر على حقل رقم المرجع عند فتح الشاشة
  useEffect(() => {
    if (isClient && isEditing) {
      // استخدام setTimeout لضمان أن العنصر موجود في DOM
      const timer = setTimeout(() => {
        const refNoInput = document.getElementById(
          "receipt-ref-no",
        ) as HTMLInputElement;

        if (refNoInput && !refNoInput.disabled) {
          refNoInput.focus();
          refNoInput.select();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isClient, isEditing]);

  // Hook for Enter key navigation in top form fields
  const { handleKeyDown: handleKeyDownSelectors, handleF4KeyForSelect } =
    useKeyAsTab({
      keys: ["Enter"],
      containerRef: selectorsRef,
      disabled: !isEditing,
      focusableSelector:
        'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), [role="combobox"]',
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

        return true;
      },
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

        // ✅ السماح بالتنقل من حقل "البيان" (input[type="text"]) إلى الحقول التالية
        // إذا كان الحقل هو input[type="text"] وليس داخل combobox، نسمح بالتنقل
        if (tagName === "input" && target.getAttribute("type") === "text") {
          const isInCombobox = target.closest('[role="combobox"]');

          if (!isInCombobox) {
            return false; // Allow navigation
          }
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

        // Allow navigation through ReactSelect when closed
        const selectButton = target.closest('[role="combobox"]');

        if (selectButton) {
          const isExpanded =
            selectButton.getAttribute("aria-expanded") === "true";

          // إذا كانت القائمة مفتوحة، نسمح بالتفاعل الطبيعي
          // إذا كانت القائمة مغلقة، نسمح بالتنقل
          return isExpanded;
        }

        return false;
      },
      onBoundaryFocus: (direction) => {
        // عندما نصل لنهاية الحقول العلوية (بعد مركز التكلفة)، ننتقل لجدول الذهب
        if (direction === 1) {
          const currentElement = document.activeElement as HTMLElement;
          const isInSelectors = selectorsRef.current?.contains(currentElement);

          if (isInSelectors) {
            // ✅ التحقق من أننا في حقل مركز التكلفة تحديداً
            const costCenterSelect = document.getElementById(
              "receipt-cost-center-select",
            );
            const isInCostCenter = costCenterSelect?.contains(currentElement);

            if (isInCostCenter) {
              // ✅ إضافة صف جديد إذا لم يكن موجوداً
              if (goldDetails.length === 0) {
                addGoldDetailRow();
              }

              // ✅ الانتقال إلى أول حقل في جدول الذهب (حقل رقم الصنف)
              // استخدام polling لضمان العثور على العنصر بعد الريندر
              const focusToItemField = (attempt = 1) => {
                // محاولة العثور على الwrapper
                const wrapper = document.getElementById(
                  "item-select-wrapper-0",
                );

                if (wrapper) {
                  const input = wrapper.querySelector("input");

                  if (input) {
                    input.focus();
                    // التأكد من أن التركيز نجح
                    if (document.activeElement === input) {
                      return true;
                    }
                  }
                  // محاولة العثور على combobox
                  const combobox = wrapper.querySelector(
                    '[role="combobox"]',
                  ) as HTMLElement;

                  if (combobox) {
                    combobox.focus();

                    return true;
                  }
                }

                // إذا لم نجد العنصر أو لم ينجح التركيز، نعيد المحاولة
                if (attempt < 20) {
                  // المحاولة لمدة 1 ثانية تقريباً (20 * 50ms)
                  setTimeout(() => focusToItemField(attempt + 1), 50);
                }

                return false;
              };

              focusToItemField();

              return true;
            }
          }
        }

        return false;
      },
    });

  // Hook for Enter key navigation in gold details table
  const { setInputRef: setGoldInputRef, handleKeyDown: handleGoldKeyDownBase } =
    useEnterKeyNavigation({
      rows: goldDetails,
      rowHasValue: () => {
        // السماح بالتنقل حتى في الصفوف الفارغة
        return true;
      },
      onAddRow: addGoldDetailRow,
    });

  // Wrapper function للتحقق من الحقول المعطلة وتخطيها
  const handleGoldKeyDown = useCallback(
    (
      event: React.KeyboardEvent,
      rowIndex: number,
      colIndex: number,
      options?: any,
    ) => {
      const isLastRow = rowIndex === goldDetails.length - 1;
      const isLastCol = options?.isLastCol || colIndex >= 10; // آخر عمود هو 10 (مركز التكلفة)

      // عند الوصول لآخر حقل في آخر صف
      if (
        isLastRow &&
        isLastCol &&
        (event.key === "Enter" || event.key === "Tab")
      ) {
        // التحقق مما إذا كان الصف الحالي فارغاً
        const currentDetail = goldDetails[rowIndex];
        // نعتبر الصف فارغاً إذا لم يتم اختيار صنف ولم يتم إدخال وزن
        // هذا يسمح للمستخدم بالخروج من الجدول بالضغط على Enter في صف فارغ
        const isEmpty = !currentDetail.item_id && !currentDetail.weight;

        if (isEmpty) {
          event.preventDefault();
          event.stopPropagation();

          // الانتقال لأول حقل في جدول النقدية
          const focusToCashTable = () => {
            // إضافة صف للنقدية إذا لم يوجد
            if (voucherBoxes.length === 0) {
              addVoucherBoxRow();
            }

            setTimeout(() => {
              const firstCashInput = document.querySelector(
                'input[data-box-row="0"][data-box-col="0"]',
              ) as HTMLInputElement;

              if (firstCashInput) {
                firstCashInput.focus();
                firstCashInput.select();
              }
            }, 50);
          };

          focusToCashTable();

          return;
        }

        // إذا كان الصف يحتوي على بيانات، نترك السلوك الافتراضي (إضافة صف جديد)
        // useEnterKeyNavigation سيقوم بإضافة الصف
      }

      // ✅ حل مشكلة التوقف عند الوزن المعاير (Col 3) -> الصندوق (Col 4)
      if (
        colIndex === 3 &&
        (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey))
      ) {
        event.preventDefault();
        event.stopPropagation();

        const focusBox = () => {
          const wrapper = document.getElementById(
            `gold-box-wrapper-${rowIndex}`,
          );

          if (wrapper) {
            // محاولة العثور على input أو combobox
            const input = wrapper.querySelector("input");

            if (input) {
              input.focus();

              return;
            }
            const combobox = wrapper.querySelector(
              '[role="combobox"]',
            ) as HTMLElement;

            if (combobox) {
              combobox.focus();

              return;
            }
          }

          // Fallback: useEnterKeyNavigation default
          handleGoldKeyDownBase(event, rowIndex, colIndex, options);
        };

        focusBox();

        return;
      }

      // منع إضافة صف جديد عند الضغط على ArrowDown في آخر صف (جدول الذهب فقط)
      if (event.key === "ArrowDown" && isLastRow) {
        event.preventDefault();
        event.stopPropagation();

        // لا نفعل شيء - فقط نمنع إضافة الصف
        return;
      }

      // استدعاء الدالة الأصلية مع السماح بالتنقل حتى لو كان الحقل فارغاً
      handleGoldKeyDownBase(event, rowIndex, colIndex, {
        ...options,
        allowEnterDefaultWhenRowMissing: true,
      });
    },
    [handleGoldKeyDownBase, goldDetails, voucherBoxes.length],
  );

  // Hook for Enter key navigation in voucher boxes table
  const { setInputRef: setBoxInputRef, handleKeyDown: handleBoxKeyDownBase } =
    useEnterKeyNavigation({
      rows: voucherBoxes,
      rowHasValue: () => {
        // السماح بالتنقل حتى في الصفوف الفارغة
        return true;
      },
      onAddRow: addVoucherBoxRow,
    });

  const handleBoxKeyDown = useCallback(
    (
      event: React.KeyboardEvent,
      rowIndex: number,
      colIndex: number,
      options?: any,
    ) => {
      // ✅ حل مشكلة التوقف عند المبلغ (Col 0) -> الصندوق (Col 1) في جدول النقدية
      if (
        colIndex === 0 &&
        (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey))
      ) {
        event.preventDefault();
        event.stopPropagation();

        const focusBox = () => {
          const wrapper = document.getElementById(
            `cash-box-wrapper-${rowIndex}`,
          );

          if (wrapper) {
            // محاولة العثور على input أو combobox
            const input = wrapper.querySelector("input");

            if (input) {
              input.focus();

              return;
            }
            const combobox = wrapper.querySelector(
              '[role="combobox"]',
            ) as HTMLElement;

            if (combobox) {
              combobox.focus();

              return;
            }
          }

          // Fallback
          handleBoxKeyDownBase(event, rowIndex, colIndex, options);
        };

        focusBox();

        return;
      }

      handleBoxKeyDownBase(event, rowIndex, colIndex, options);
    },
    [handleBoxKeyDownBase],
  );

  // دالة البحث في الأصناف (خارج map لتجنب loop)
  // استخدام useRef لتخزين loadItemOptions لتجنب إعادة الإنشاء
  const loadItemOptionsRef = useRef(loadItemOptions);

  // تحديث refs عند تغيير الدوال
  useEffect(() => {
    loadItemOptionsRef.current = loadItemOptions;
  }, [loadItemOptions]);

  // دالة مساعدة للانتقال للحقل التالي في جدول الذهب
  const focusNextGoldField = useCallback(
    (rowIndex: number, colIndex: number) => {
      const nextCol = colIndex + 1;
      const nextInput = document.querySelector(
        `input[data-gold-row="${rowIndex}"][data-gold-col="${nextCol}"]`,
      ) as HTMLInputElement;

      if (nextInput) {
        nextInput.focus();
        nextInput.select();

        return true;
      }

      return false;
    },
    [],
  );

  // دالة مساعدة للانتقال للحقل التالي في جدول الصناديق
  const focusNextBoxField = useCallback(
    (rowIndex: number, colIndex: number) => {
      const nextCol = colIndex + 1;
      const nextInput = document.querySelector(
        `input[data-box-row="${rowIndex}"][data-box-col="${nextCol}"]`,
      ) as HTMLInputElement;

      if (nextInput) {
        nextInput.focus();
        nextInput.select();

        return true;
      }

      return false;
    },
    [],
  );

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim() === "") {
      toast.error(t("messages.searchErrorMissing"));

      return;
    }

    const searchValue = searchTerm.trim();

    try {
      const { voucherService } = await import("@/services/api");
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: "111",
        xvouch_id: searchValue,
        xcom_id: "1",
        xyear_id: "0",
      });

      if (vouchersResponse.success && vouchersResponse.data) {
        const vouchers = Array.isArray(vouchersResponse.data)
          ? vouchersResponse.data
          : [];

        let foundVoucher = vouchers.find(
          (v: any) =>
            v.vouch_id?.toString() === searchValue ||
            v.id?.toString() === searchValue,
        );

        if (!foundVoucher) {
          foundVoucher = vouchers.find(
            (v: any) =>
              v.vouch_id?.toString().includes(searchValue) ||
              v.id?.toString().includes(searchValue),
          );
        }

        if (foundVoucher) {
          // استخدام vouch_id في URL بدلاً من id
          const targetVouchId = foundVoucher.vouch_id;

          if (targetVouchId && Number(targetVouchId) > 0) {
            router.push(`/forms/receipt/${targetVouchId}?mode=preview`);
            setSearchTerm("");

            return;
          }
        }
      }

      toast.error(tReceipt("messages.notFound", { number: searchValue }));
    } catch (error) {
      console.error("Error searching voucher:", error);
      toast.error(t("messages.searchError"));
    }
  };

  // Handle edit click
  const handleEditClick = () => {
    setVoucher((prev) => ({
      ...prev,
      commit: false,
    }));

    if (pathname) {
      // استخدام vouch_id في URL بدلاً من voucherRecordId
      const vouchIdToUse = voucher.vouch_id;

      if (vouchIdToUse && Number(vouchIdToUse) > 0) {
        router.push(`/forms/receipt/${vouchIdToUse}?mode=edit`);
      }
    }
  };

  // Helper functions for box select
  const getBoxSelectValue = (
    boxId: number | null | undefined,
    boxList: any[],
  ) => {
    if (!boxId || boxId <= 0) {
      return null;
    }

    const box = boxList.find((b) => b.id === boxId);

    if (!box) {
      return null;
    }

    return {
      value: String(box.id),
      label: box.cust_name || box.name || box.box_name || `صندوق ${box.id}`,
    };
  };

  // Must be before any early return (Rules of Hooks)
  const goldBoxSelectOptions = useMemo(() => {
    return (goldBoxes || []).map((box) => ({
      value: String(box.id),
      label: box.cust_name || box.name || box.box_name || `صندوق ${box.id}`,
    }));
  }, [goldBoxes]);

  const cashBoxSelectOptions = useMemo(() => {
    return (boxes || []).map((box) => ({
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
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t("messages.loading")}</p>
        </div>
      </div>
    );
  }

  const voucherTypeName =
    voucherTypes.find((type) => (type.Id || type.id) === vouchType)?.name ||
    tReceipt("title");

  return (
    <div className="p-1 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-1.5 mb-1 border border-slate-200">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>{voucherTypeName}</span>
              <span className="text-slate-600 font-medium">
                #{hasVoucherId ? voucher.vouch_id : t("messages.numbering")}
              </span>
              <span className="text-sm text-slate-600 font-medium flex items-center gap-1">
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
              placeholder={t("messages.searchPlaceholder")}
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

        <div className="flex items-center justify-between">
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
              {t("buttons.save")}
            </Button>

            <Button
              className="h-7 px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
              isDisabled={formMode === "new" || isEditing || isLoading}
              startContent={<PencilIcon className="w-4 h-4 text-slate-500" />}
              variant="solid"
              onPress={handleEditClick}
            >
              {t("buttons.edit")}
            </Button>

            <Button
              className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
              startContent={<PlusIcon className="w-4 h-4" />}
              variant="solid"
              onPress={() => router.push("/forms/receipt")}
            >
              {t("buttons.new")}
            </Button>

            <Button
              className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              isDisabled={!hasVoucherId}
              isLoading={isPrinting}
              startContent={
                !isPrinting ? <PrinterIcon className="w-4 h-4" /> : undefined
              }
              variant="solid"
              onPress={printVoucher}
            >
              {t("buttons.print")}
            </Button>

            {/* أزرار التنقل - مثل الفواتير - ظاهرة دائماً */}
            {navigationMetadata && (
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
                <span
                  className={`text-xs text-slate-600 px-2 font-medium ${textAlign}`}
                >
                  {tCommon("navigation.position", {
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
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <Checkbox
                color="success"
                isDisabled
                isSelected={voucher.commit}
                size="sm"
              />
              <span className="text-xs text-slate-600">
                {t("status.saved")}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Checkbox
                color="warning"
                isDisabled
                isSelected={voucher.post}
                size="sm"
              />
              <span className="text-xs text-slate-600">
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
              <span className="text-xs text-slate-600">
                {t("status.printed")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields - Row 1 */}
      <div
        ref={selectorsRef}
        className="grid grid-cols-1 md:grid-cols-12 gap-1.5 mb-1.5"
        onKeyDownCapture={handleKeyDownSelectors}
      >
        {/* رقم المرجع - أضيق */}
        <div className="md:col-span-2">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="receipt-ref-no"
          >
            {t("fields.refNo")}
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            id="receipt-ref-no"
            readOnly={!isEditing}
            type="text"
            value={voucher.ref_no || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))
            }
          />
        </div>

        {/* التاريخ والوقت - توسع قليلاً */}
        <div className="md:col-span-3">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="receipt-datetime"
          >
            {t("fields.dateTime")}
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            id="receipt-datetime"
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

        {/* البيان - أوسع مع زر توسيع */}
        <div className="md:col-span-7">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="receipt-notes"
          >
            {t("fields.notes")}
          </label>
          <div className="relative">
            <input
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 pr-8"
              disabled={!isEditing}
              id="receipt-notes"
              placeholder={t("placeholders.notesInput")}
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
                if (e.key === "Enter" && !e.isDefaultPrevented()) {
                  e.preventDefault();
                  e.stopPropagation();
                  setTimeout(() => {
                    // البحث عن حقل العميل في الصفحة
                    const customerSelect = document.querySelector(
                      "#customer-select",
                    ) as HTMLElement;

                    if (customerSelect) {
                      const selectButton = customerSelect.closest(
                        '[role="combobox"]',
                      ) as HTMLElement;

                      if (selectButton) {
                        selectButton.focus();

                        return;
                      }
                      customerSelect.focus();
                    }
                  }, 50);
                }
              }}
            />
            {isEditing && (
              <button
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all duration-200"
                data-skip-key-as-tab="true"
                title={t("modals.notes.expandTitle")}
                type="button"
                onClick={() => setIsNotesModalOpen(true)}
              >
                <ArrowsPointingOutIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields - Row 2: العميل، مناولة، مركز التكلفة */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 mb-1.5">
        {/* العميل */}
        <div className="md:col-span-4">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="customer-select"
          >
            {t("fields.customer")}
          </label>
          <div
            onKeyDownCapture={(e) => {
              // معالجة F4 لفتح/إغلاق القائمة باستخدام الدالة العامة
              if (handleF4KeyForSelect(e)) {
                return;
              }

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
                  setTimeout(() => {
                    const handlingInput = document.getElementById(
                      "receipt-handling",
                    ) as HTMLInputElement;

                    if (handlingInput) {
                      handlingInput.focus();
                      handlingInput.select();
                    }
                  }, 50);

                  return;
                }

                if (e.key === "Escape") {
                  return;
                }
              }
            }}
          >
            <AsyncCreatableSelect
              isClearable
              isSearchable
              className="text-xs"
              classNamePrefix="react-select"
              components={{ IndicatorSeparator: () => null }}
              defaultOptions={defaultCustomerOptions}
              inputId="customer-select"
              instanceId="customer-select"
              isDisabled={!isEditing}
              loadOptions={async (inputValue: string) => {
                try {
                  const results = await loadCustomerOptions(inputValue);

                  return results || [];
                } catch (error) {
                  console.error("Error in customer search:", error);

                  return [];
                }
              }}
              menuPortalTarget={
                typeof window !== "undefined" ? document.body : null
              }
              menuPosition="fixed"
              placeholder={t("placeholders.selectCustomer")}
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
              value={getCustomerSelectValue()}
              onChange={(selectedOption: any) => {
                if (!isEditing) return;
                if (!selectedOption) {
                  setSelectedCustomer(null);
                  setVoucher((prev) => ({
                    ...prev,
                    cust_id: undefined,
                    handling: "",
                  }));

                  return;
                }

                const selected =
                  selectedOption?.customer ||
                  customers.find((cust) => cust.id === selectedOption?.value);

                setSelectedCustomer(selected || null);

                const handling = selected?.handling?.toString() || "";

                setVoucher((prev) => ({
                  ...prev,
                  cust_id: selected?.id ?? null,
                  handling: handling,
                }));
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
                    setTimeout(() => {
                      const handlingInput = document.getElementById(
                        "receipt-handling",
                      ) as HTMLInputElement;

                      if (handlingInput) {
                        handlingInput.focus();
                        handlingInput.select();
                      }
                    }, 50);
                  }

                  if (e.key === "Escape") {
                    return;
                  }
                }
              }}
            />
          </div>
        </div>

        {/* مناولة */}
        <div className="md:col-span-3">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="receipt-handling"
          >
            {t("fields.handling")}
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            id="receipt-handling"
            placeholder={t("placeholders.handling")}
            readOnly={!isEditing}
            type="text"
            value={voucher.handling || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, handling: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.isDefaultPrevented()) {
                e.preventDefault();
                e.stopPropagation();

                // البحث عن حقل مركز التكلفة - نفس الطريقة المستخدمة في CustomerGoldVoucherClientPage
                const focusToCostCenterSelect = (): boolean => {
                  try {
                    const costCenterSelectId = `#receipt-cost-center-select`;
                    const costCenterSelect =
                      document.querySelector(costCenterSelectId);

                    if (!costCenterSelect) {
                      return false;
                    }

                    // البحث عن combobox بطرق متعددة
                    let combobox = costCenterSelect.querySelector(
                      '[role="combobox"]',
                    ) as HTMLElement;

                    // إذا لم نجد combobox داخل costCenterSelect، نبحث مباشرة
                    if (!combobox) {
                      combobox = document.querySelector(
                        `#receipt-cost-center-select [role="combobox"]`,
                      ) as HTMLElement;
                    }

                    if (combobox) {
                      // التركيز مع محاولات متعددة
                      combobox.focus();

                      // التأكد من أن combobox قابل للتركيز
                      if (document.activeElement !== combobox) {
                        combobox.setAttribute("tabindex", "0");
                        combobox.focus();
                      }

                      return true;
                    }

                    return false;
                  } catch (error) {
                    console.error("Error in focusToCostCenterSelect:", error);

                    return false;
                  }
                };

                // محاولة فورية
                if (focusToCostCenterSelect()) {
                  return;
                }

                // محاولة بعد setTimeout
                setTimeout(() => {
                  if (focusToCostCenterSelect()) {
                    return;
                  }

                  // محاولة بعد setTimeout إضافي
                  setTimeout(() => {
                    focusToCostCenterSelect();
                  }, 50);
                }, 10);
              }
            }}
          />
        </div>

        {/* مركز التكلفة */}
        <div className="md:col-span-5">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="receipt-cost-center-select"
          >
            {t("fields.costCenter")}
          </label>
          <div
            id="receipt-cost-center-select"
            onKeyDownCapture={(e) => {
              // معالجة F4 لفتح/إغلاق القائمة باستخدام الدالة العامة
              if (handleF4KeyForSelect(e)) {
                return;
              }

              if (e.key === "Enter") {
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
                  if (isExpanded) {
                    return;
                  }

                  // ✅ إذا كانت القائمة مغلقة، ننتقل لجدول الذهب
                  e.preventDefault();
                  e.stopPropagation();

                  // ✅ إضافة صف جديد إذا لم يكن موجوداً
                  if (goldDetails.length === 0) {
                    addGoldDetailRow();
                  }

                  // ✅ الانتقال إلى أول حقل في جدول الذهب (حقل رقم الصنف)
                  // استخدام polling لضمان العثور على العنصر بعد الريندر
                  const focusToItemField = (attempt = 1) => {
                    // محاولة العثور على الwrapper
                    const wrapper = document.getElementById(
                      "item-select-wrapper-0",
                    );

                    if (wrapper) {
                      const input = wrapper.querySelector("input");

                      if (input) {
                        input.focus();
                        // التأكد من أن التركيز نجح
                        if (document.activeElement === input) {
                          return true;
                        }
                      }
                      // محاولة العثور على combobox
                      const combobox = wrapper.querySelector(
                        '[role="combobox"]',
                      ) as HTMLElement;

                      if (combobox) {
                        combobox.focus();

                        return true;
                      }
                    }

                    // إذا لم نجد العنصر أو لم ينجح التركيز، نعيد المحاولة
                    if (attempt < 20) {
                      // المحاولة لمدة 1 ثانية تقريباً (20 * 50ms)
                      setTimeout(() => focusToItemField(attempt + 1), 50);
                    }

                    return false;
                  };

                  focusToItemField();
                }
              }
            }}
          >
            <ReactSelect
              isSearchable
              className="text-xs"
              classNamePrefix="react-select"
              components={{ IndicatorSeparator: () => null }}
              inputId="receipt-cost-center-select"
              instanceId="receipt-cost-center-select"
              isDisabled={!isEditing || costCenters.length === 0}
              menuPortalTarget={
                typeof window !== "undefined" ? document.body : null
              }
              menuPosition="fixed"
              options={costCenterSelectOptions}
              placeholder={t("placeholders.selectCostCenter")}
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
                const costId = selectedOption?.value
                  ? parseInt(String(selectedOption.value))
                  : null;

                setVoucher((prev) => ({
                  ...prev,
                  cost_id: costId,
                }));

                // تعميم مركز التكلفة على جميع صفوف جدول الذهب
                goldDetails.forEach((_, index) => {
                  updateGoldDetail(index, "cost_id", costId);
                });

                // تعميم مركز التكلفة على جميع صفوف جدول النقدية
                voucherBoxes.forEach((_, index) => {
                  updateVoucherBox(index, "cost_id", costId);
                });
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

                  // ✅ عند الضغط على Enter والقائمة مغلقة، ننتقل لجدول الذهب
                  if (e.key === "Enter" && !isExpanded) {
                    e.preventDefault();
                    e.stopPropagation();

                    // ✅ إضافة صف جديد إذا لم يكن موجوداً
                    if (goldDetails.length === 0) {
                      addGoldDetailRow();
                    }

                    // ✅ الانتقال إلى أول حقل في جدول الذهب (حقل رقم الصنف)
                    const focusToItemField = (): boolean => {
                      try {
                        const itemSelectId = `#item-select-0`;
                        let itemSelect = document.querySelector(itemSelectId);

                        if (!itemSelect) {
                          const allSelects = document.querySelectorAll(
                            '[id^="item-select-"]',
                          );

                          itemSelect = allSelects[0] || null;
                        }

                        if (!itemSelect) {
                          return false;
                        }

                        let combobox = itemSelect.querySelector(
                          '[role="combobox"]',
                        ) as HTMLElement;

                        if (!combobox) {
                          combobox = document.querySelector(
                            `#item-select-0 [role="combobox"]`,
                          ) as HTMLElement;
                        }

                        if (!combobox) {
                          const allComboboxes =
                            document.querySelectorAll('[role="combobox"]');

                          for (let i = 0; i < allComboboxes.length; i += 1) {
                            const cb = allComboboxes[i] as HTMLElement;
                            const parent = cb.closest('[id^="item-select-"]');

                            if (parent && parent.id === "item-select-0") {
                              combobox = cb;
                              break;
                            }
                          }
                        }

                        if (combobox) {
                          combobox.focus();
                          if (document.activeElement !== combobox) {
                            combobox.setAttribute("tabindex", "0");
                            combobox.focus();
                          }

                          return true;
                        }

                        return false;
                      } catch (error) {
                        console.error("Error in focusToItemField:", error);

                        return false;
                      }
                    };

                    // محاولة فورية
                    if (focusToItemField()) {
                      return;
                    }

                    // محاولة بعد requestAnimationFrame
                    requestAnimationFrame(() => {
                      if (focusToItemField()) {
                        return;
                      }
                      setTimeout(() => {
                        if (focusToItemField()) {
                          return;
                        }
                        setTimeout(() => {
                          focusToItemField();
                        }, 50);
                      }, 10);
                    });

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
                    // السماح للتنقل الطبيعي
                    return;
                  }
                }

                if (e.key === "Escape") {
                  return;
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Gold Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-1.5">
        <div className="p-1 border-b border-slate-200 bg-slate-50">
          <h3 className={`text-xs font-semibold text-slate-800 ${textAlign}`}>
            {t("tables.gold.title")}
          </h3>
        </div>
        <div className="p-0.5">
          <div className="flex justify-between mb-0.5">
            <button
              className="text-xs px-2 py-0.5 btn"
              disabled={!isEditing}
              type="button"
              onClick={addGoldDetailRow}
            >
              {t("tables.gold.addRow")}
            </button>
          </div>
          <div className="overflow-x-auto mb-0.5 max-w-full">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="min-w-[1400px] border text-xs text-center table-fixed">
                <thead className="bg-gray-100 text-xs font-bold">
                  <tr>
                    <th className={`w-72 p-1 border ${textAlignCenter}`}>
                      {t("tables.gold.columns.itemNumber")}
                    </th>
                    <th className={`w-32 p-1 border ${textAlignCenter}`}>
                      {t("tables.gold.columns.weight")}
                    </th>
                    <th className={`w-32 p-1 border ${textAlignCenter}`}>
                      {t("tables.gold.columns.calibration")}
                    </th>
                    <th className={`w-32 p-1 border ${textAlignCenter}`}>
                      {t("tables.gold.columns.calibratedWeight")}
                    </th>
                    <th className={`w-32 p-1 border ${textAlignCenter}`}>
                      {tReceipt("tables.gold.columns.wageRate")}
                    </th>
                    <th className={`w-32 p-1 border ${textAlignCenter}`}>
                      {tReceipt("tables.gold.columns.wages")}
                    </th>
                    <th className={`w-48 p-1 border ${textAlignCenter}`}>
                      {t("tables.gold.columns.box")}
                    </th>
                    <th className={`w-80 p-1 border ${textAlignCenter}`}>
                      {t("tables.gold.columns.notes")}
                    </th>
                    <th className={`w-32 p-1 border ${textAlignCenter}`}>
                      {t("tables.gold.columns.caliberDifference")}
                    </th>
                    <th className={`w-32 p-1 border ${textAlignCenter}`}>
                      {t("tables.gold.columns.sealingAmount")}
                    </th>
                    <th className={`w-32 p-1 border ${textAlignCenter}`}>
                      {t("tables.gold.columns.sealingWeight")}
                    </th>
                    <th className={`w-32 p-1 border ${textAlignCenter}`}>
                      {t("tables.gold.columns.invoiceNumber")}
                    </th>
                    <th className={`w-48 p-1 border ${textAlignCenter}`}>
                      {t("tables.gold.columns.costCenter")}
                    </th>
                    <th className={`w-12 p-1 border ${textAlignCenter}`}>
                      {t("tables.gold.columns.delete")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {goldDetails.map((detail, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-0 border">
                        {(() => {
                          const thisCol = 0;
                          const itemValue = getItemSelectValue(detail);
                          const selectedItemValue = itemValue
                            ? typeof itemValue === "object"
                              ? itemValue.value
                              : itemValue
                            : null;

                          // إعداد defaultOptions (بدون useMemo لأننا داخل map)
                          const defaultItemOptions = (() => {
                            if (!selectedItemValue) return [];
                            const selectedItem = items.find(
                              (itm) => itm.id === selectedItemValue,
                            );

                            if (!selectedItem) return [];
                            // استخدام نفس الحقول التي نستخدمها في normalizedResults
                            const itemCode =
                              selectedItem.item_code ??
                              String(selectedItem.id ?? "");
                            const itemName = selectedItem.item_name ?? "";

                            return [
                              {
                                value: selectedItem.id,
                                label:
                                  `${itemCode} - ${itemName}` ||
                                  `صنف رقم: ${selectedItem.id}`,
                                item: selectedItem,
                              },
                            ];
                          })();

                          return (
                            <div
                              id={`item-select-wrapper-${index}`}
                              ref={(el) => {
                                const refSetter = setGoldInputRef(
                                  index,
                                  thisCol,
                                );

                                if (el) {
                                  setTimeout(() => {
                                    const selectButton = document.querySelector(
                                      `#item-select-${index}`,
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
                              <AsyncCreatableSelect
                                isClearable
                                isSearchable
                                className="text-xs"
                                classNamePrefix="select"
                                components={{ IndicatorSeparator: () => null }}
                                defaultOptions={defaultItemOptions}
                                instanceId={`item-select-${index}`}
                                isDisabled={!isEditing}
                                loadOptions={async (inputValue: string) => {
                                  try {
                                    const results = await loadItemOptions(
                                      inputValue,
                                      [],
                                      { page: 1 },
                                    );

                                    return Array.isArray(results)
                                      ? results
                                      : [];
                                  } catch (error) {
                                    console.error(
                                      "Error loading items:",
                                      error,
                                    );

                                    return [];
                                  }
                                }}
                                menuPortalTarget={
                                  typeof window !== "undefined"
                                    ? document.body
                                    : null
                                }
                                menuPosition="fixed"
                                placeholder={t(
                                  "tables.gold.placeholders.selectItem",
                                )}
                                styles={{
                                  control: (base) => ({
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
                                value={itemValue}
                                onChange={(selectedOption: any) => {
                                  if (!isEditing) return;
                                  if (!selectedOption) {
                                    updateGoldDetail(index, "item_id", null);
                                    updateGoldDetail(index, "item_code", "");
                                    updateGoldDetail(index, "item_name", "");

                                    return;
                                  }

                                  const selected =
                                    selectedOption?.item ||
                                    items.find(
                                      (itm) => itm.id === selectedOption?.value,
                                    );

                                  if (selected) {
                                    updateGoldDetail(
                                      index,
                                      "item_id",
                                      selected.id ?? null,
                                    );
                                    updateGoldDetail(
                                      index,
                                      "item_code",
                                      selected.item_code ?? "",
                                    );
                                    updateGoldDetail(
                                      index,
                                      "item_name",
                                      selected.item_name ?? "",
                                    );

                                    // تحديث k إذا كان موجوداً في الصنف
                                    if (
                                      selected.k !== undefined &&
                                      selected.k !== null
                                    ) {
                                      updateGoldDetail(index, "k", selected.k);
                                    }

                                    // الانتقال للحقل التالي بعد اختيار الصنف
                                    setTimeout(() => {
                                      focusNextGoldField(index, thisCol);
                                    }, 100);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  const target = e.target as HTMLElement | null;

                                  if (!target) return;

                                  const isInListbox =
                                    target.closest('[role="listbox"]');

                                  if (isInListbox) return;

                                  if (e.key === "Escape") return;

                                  // معالجة الأسهم للتنقل
                                  if (
                                    e.key === "ArrowRight" ||
                                    e.key === "ArrowLeft" ||
                                    e.key === "ArrowDown" ||
                                    e.key === "ArrowUp"
                                  ) {
                                    const selectButton =
                                      target.closest('[role="combobox"]');
                                    const isExpanded =
                                      selectButton?.getAttribute(
                                        "aria-expanded",
                                      ) === "true";

                                    if (!isExpanded) {
                                      // إذا كانت القائمة مغلقة، نستخدم التنقل
                                      handleGoldKeyDown(e, index, thisCol);

                                      return;
                                    }

                                    // إذا كانت القائمة مفتوحة، نترك الأسهم تعمل داخل القائمة
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
                                      handleGoldKeyDown(e, index, thisCol, {
                                        allowEnterDefaultWhenRowMissing:
                                          !detail?.item_id,
                                      });

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
                        <input
                          ref={setGoldInputRef(index, 1)}
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                          data-gold-col={1}
                          data-gold-row={index}
                          disabled={!isEditing}
                          readOnly={!isEditing}
                          style={{
                            MozAppearance: "textfield",
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                          type="number"
                          value={detail.weight || ""}
                          onChange={(e) =>
                            updateGoldDetail(
                              index,
                              "weight",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          onKeyDown={(e) => handleGoldKeyDown(e, index, 1)}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>
                      <td className="p-0 border">
                        <input
                          ref={setGoldInputRef(index, 2)}
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                          data-gold-col={2}
                          data-gold-row={index}
                          disabled={!isEditing}
                          readOnly={!isEditing}
                          style={{
                            MozAppearance: "textfield",
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                          type="number"
                          value={detail.k || ""}
                          onChange={(e) =>
                            updateGoldDetail(
                              index,
                              "k",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          onKeyDown={(e) => handleGoldKeyDown(e, index, 2)}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>
                      <td className="p-0 border">
                        <input
                          ref={setGoldInputRef(index, 3)}
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                          data-gold-col={3}
                          data-gold-row={index}
                          disabled={!isEditing}
                          readOnly={!isEditing}
                          style={{
                            MozAppearance: "textfield",
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                          type="number"
                          value={detail.g_weight || ""}
                          onChange={(e) =>
                            updateGoldDetail(
                              index,
                              "g_weight",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          onKeyDown={(e) => handleGoldKeyDown(e, index, 3)}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>
                      {/* معدل الأجور */}
                      <td className="p-0 border">
                        <input
                          ref={setGoldInputRef(index, 4)}
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                          data-gold-col={4}
                          data-gold-row={index}
                          disabled={!isEditing}
                          readOnly={!isEditing}
                          step="0.01"
                          style={{
                            MozAppearance: "textfield",
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                          type="number"
                          value={detail.work_amt || ""}
                          onChange={(e) =>
                            updateGoldDetail(
                              index,
                              "work_amt",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          onKeyDown={(e) => handleGoldKeyDown(e, index, 4)}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>
                      {/* الأجور (محسوبة تلقائياً) */}
                      <td className="p-0 border">
                        <input
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-yellow-50"
                          disabled={true}
                          readOnly={true}
                          step="0.01"
                          style={{
                            MozAppearance: "textfield",
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                          title="يُحسب تلقائياً من: معدل الأجور × الوزن القائم"
                          type="number"
                          value={detail.total_work || ""}
                        />
                      </td>
                      <td className="p-0 border">
                        {(() => {
                          const thisCol = 6;
                          const boxValue = getBoxSelectValue(
                            detail.box_id,
                            goldBoxes || [],
                          );

                          return (
                            <div
                              id={`gold-box-wrapper-${index}`}
                              ref={setGoldInputRef(index, thisCol)}
                              data-gold-col={6}
                              data-gold-row={index}
                              data-col={6}
                              data-row={index}
                              className="h-full"
                            >
                              <ReactSelect
                                isSearchable
                                className="text-xs"
                                classNamePrefix="react-select"
                                components={{ IndicatorSeparator: () => null }}
                                instanceId={`gold-box-select-${index}`}
                                isDisabled={
                                  !isEditing ||
                                  goldBoxSelectOptions.length === 0
                                }
                                menuPortalTarget={
                                  typeof window !== "undefined"
                                    ? document.body
                                    : null
                                }
                                menuPosition="fixed"
                                options={goldBoxSelectOptions}
                                placeholder={t(
                                  "tables.cash.placeholders.selectBox",
                                )}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: "32px",
                                    height: "32px",
                                    fontSize: "12px",
                                    border: "none",
                                    borderRadius: 0,
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
                                value={boxValue}
                                onChange={(selectedOption: any) => {
                                  if (!isEditing) return;
                                  updateGoldDetail(
                                    index,
                                    "box_id",
                                    selectedOption?.value
                                      ? parseInt(String(selectedOption.value))
                                      : undefined,
                                  );

                                  // الانتقال للحقل التالي بعد الاختيار
                                  setTimeout(() => {
                                    focusNextGoldField(index, thisCol);
                                  }, 100);
                                }}
                                onKeyDown={(e) => {
                                  const target = e.target as HTMLElement | null;

                                  if (!target) return;

                                  const isInListbox =
                                    target.closest('[role="listbox"]');

                                  if (isInListbox) return;

                                  if (e.key === "Escape") return;

                                  // معالجة الأسهم للتنقل
                                  if (
                                    e.key === "ArrowRight" ||
                                    e.key === "ArrowLeft" ||
                                    e.key === "ArrowDown" ||
                                    e.key === "ArrowUp"
                                  ) {
                                    const selectButton =
                                      target.closest('[role="combobox"]');
                                    const isExpanded =
                                      selectButton?.getAttribute(
                                        "aria-expanded",
                                      ) === "true";

                                    if (!isExpanded) {
                                      // إذا كانت القائمة مغلقة، نستخدم التنقل
                                      handleGoldKeyDown(e, index, thisCol);

                                      return;
                                    }

                                    // إذا كانت القائمة مفتوحة، نترك الأسهم تعمل داخل القائمة
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
                                      handleGoldKeyDown(e, index, thisCol, {
                                        allowEnterDefaultWhenRowMissing:
                                          !detail?.box_id,
                                      });

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
                        <input
                          ref={setGoldInputRef(index, 7)}
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                          data-gold-col={7}
                          data-gold-row={index}
                          disabled={!isEditing}
                          readOnly={!isEditing}
                          type="text"
                          value={detail.notes || ""}
                          onChange={(e) =>
                            updateGoldDetail(index, "notes", e.target.value)
                          }
                          onKeyDown={(e) => handleGoldKeyDown(e, index, 7)}
                        />
                      </td>
                      <td className="p-0 border">
                        <input
                          ref={setGoldInputRef(index, 8)}
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                          data-gold-col={8}
                          data-gold-row={index}
                          disabled={!isEditing}
                          readOnly={!isEditing}
                          style={{
                            MozAppearance: "textfield",
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                          type="number"
                          value={detail.diff || ""}
                          onChange={(e) =>
                            updateGoldDetail(
                              index,
                              "diff",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          onKeyDown={(e) => handleGoldKeyDown(e, index, 8)}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>
                      <td className="p-0 border">
                        <input
                          ref={setGoldInputRef(index, 9)}
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                          data-gold-col={9}
                          data-gold-row={index}
                          disabled={!isEditing}
                          readOnly={!isEditing}
                          style={{
                            MozAppearance: "textfield",
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                          type="number"
                          value={detail.close_amt || ""}
                          onChange={(e) =>
                            updateGoldDetail(
                              index,
                              "close_amt",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          onKeyDown={(e) => handleGoldKeyDown(e, index, 9)}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>
                      <td className="p-0 border">
                        <input
                          ref={setGoldInputRef(index, 10)}
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                          data-gold-col={10}
                          data-gold-row={index}
                          disabled={!isEditing}
                          readOnly={!isEditing}
                          style={{
                            MozAppearance: "textfield",
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                          type="number"
                          value={detail.close_weight || ""}
                          onChange={(e) =>
                            updateGoldDetail(
                              index,
                              "close_weight",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          onKeyDown={(e) => handleGoldKeyDown(e, index, 10)}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>
                      <td className="p-0 border">
                        <input
                          ref={setGoldInputRef(index, 11)}
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                          data-gold-col={11}
                          data-gold-row={index}
                          disabled={!isEditing}
                          min="0"
                          readOnly={!isEditing}
                          style={{
                            MozAppearance: "textfield",
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                          type="number"
                          value={detail.inv_id || ""}
                          onChange={(e) =>
                            updateGoldDetail(
                              index,
                              "inv_id",
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            )
                          }
                          onKeyDown={(e) =>
                            handleGoldKeyDown(e, index, 11, { isLastCol: true })
                          }
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>
                      <td className="p-0 border">
                        {(() => {
                          const thisCol = 12;
                          const costValue = getCostCenterSelectValue(
                            detail.cost_id,
                          );

                          return (
                            <div
                              ref={setGoldInputRef(index, thisCol)}
                              data-gold-col={12}
                              data-gold-row={index}
                              data-col={12}
                              data-row={index}
                              className="h-full"
                            >
                              <ReactSelect
                                isSearchable
                                className="text-xs"
                                classNamePrefix="react-select"
                                components={{ IndicatorSeparator: () => null }}
                                instanceId={`cost-center-gold-select-${index}`}
                                isDisabled={
                                  !isEditing || costCenters.length === 0
                                }
                                menuPortalTarget={
                                  typeof window !== "undefined"
                                    ? document.body
                                    : null
                                }
                                menuPosition="fixed"
                                options={costCenterSelectOptions}
                                placeholder={t(
                                  "tables.gold.placeholders.selectCostCenter",
                                )}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: "32px",
                                    height: "32px",
                                    fontSize: "12px",
                                    border: "none",
                                    borderRadius: 0,
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
                                value={costValue}
                                onChange={(selectedOption: any) => {
                                  if (!isEditing) return;
                                  updateGoldDetail(
                                    index,
                                    "cost_id",
                                    selectedOption?.value
                                      ? parseInt(String(selectedOption.value))
                                      : undefined,
                                  );

                                  // الانتقال للحقل التالي بعد الاختيار
                                  setTimeout(() => {
                                    focusNextGoldField(index, thisCol);
                                  }, 100);
                                }}
                                onKeyDown={(e) => {
                                  const target = e.target as HTMLElement | null;

                                  if (!target) return;

                                  const isInListbox =
                                    target.closest('[role="listbox"]');

                                  if (isInListbox) return;

                                  if (e.key === "Escape") return;

                                  // معالجة الأسهم للتنقل
                                  if (
                                    e.key === "ArrowRight" ||
                                    e.key === "ArrowLeft" ||
                                    e.key === "ArrowDown" ||
                                    e.key === "ArrowUp"
                                  ) {
                                    const selectButton =
                                      target.closest('[role="combobox"]');
                                    const isExpanded =
                                      selectButton?.getAttribute(
                                        "aria-expanded",
                                      ) === "true";

                                    if (!isExpanded) {
                                      handleGoldKeyDown(e, index, thisCol, {
                                        isLastCol: true,
                                      });

                                      return;
                                    }

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
                                      handleGoldKeyDown(e, index, thisCol, {
                                        allowEnterDefaultWhenRowMissing:
                                          !detail?.cost_id,
                                        isLastCol: true,
                                      });

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
                          onClick={() => removeGoldDetailRow(index)}
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

      {/* Cash Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-1.5">
        <div className="p-1 border-b border-slate-200 bg-slate-50">
          <h3 className={`text-xs font-semibold text-slate-800 ${textAlign}`}>
            {t("tables.cash.title")}
          </h3>
        </div>
        <div className="p-0.5">
          <div className="flex justify-between mb-0.5">
            <button
              className="text-xs px-2 py-0.5 btn"
              disabled={!isEditing}
              type="button"
              onClick={addVoucherBoxRow}
            >
              {t("tables.cash.addRow")}
            </button>
          </div>
          <div className="overflow-x-auto mb-0.5 max-w-full">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="min-w-[1000px] border text-xs text-center table-fixed">
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
                    <th className={`w-32 p-1 border ${textAlignCenter}`}>
                      {t("tables.cash.columns.invoiceNumber")}
                    </th>
                    <th className={`w-48 p-1 border ${textAlignCenter}`}>
                      {t("tables.cash.columns.costCenter")}
                    </th>
                    <th className={`w-12 p-1 border ${textAlignCenter}`}>
                      {t("tables.cash.columns.delete")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {voucherBoxes.map((box, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-0 border">
                        <input
                          ref={setBoxInputRef(index, 0)}
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                          data-box-col={0}
                          data-box-row={index}
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
                              e.target.value ? parseFloat(e.target.value) : 0,
                            )
                          }
                          onKeyDown={(e) => handleBoxKeyDown(e, index, 0)}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>
                      <td className="p-0 border">
                        {(() => {
                          const thisCol = 1;
                          const boxValue = getBoxSelectValue(
                            box.box_id,
                            boxes || [],
                          );

                          return (
                            <div
                              id={`cash-box-wrapper-${index}`}
                              ref={(el) => {
                                const refSetter = setBoxInputRef(
                                  index,
                                  thisCol,
                                );

                                if (el) {
                                  setTimeout(() => {
                                    const selectButton = document.querySelector(
                                      `#cash-box-select-${index}`,
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
                              <ReactSelect
                                isSearchable
                                className="text-xs"
                                classNamePrefix="react-select"
                                components={{ IndicatorSeparator: () => null }}
                                instanceId={`cash-box-select-${index}`}
                                isDisabled={
                                  !isEditing ||
                                  cashBoxSelectOptions.length === 0
                                }
                                menuPortalTarget={
                                  typeof window !== "undefined"
                                    ? document.body
                                    : null
                                }
                                menuPosition="fixed"
                                options={cashBoxSelectOptions}
                                placeholder={t(
                                  "tables.cash.placeholders.selectBox",
                                )}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: "32px",
                                    height: "32px",
                                    fontSize: "12px",
                                    border: "none",
                                    borderRadius: 0,
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
                                value={boxValue}
                                onChange={(selectedOption: any) => {
                                  if (!isEditing) return;
                                  const selectedBoxId = selectedOption?.value
                                    ? parseInt(String(selectedOption.value))
                                    : 0;

                                  updateVoucherBox(
                                    index,
                                    "box_id",
                                    selectedBoxId,
                                  );

                                  // الانتقال للحقل التالي بعد الاختيار
                                  setTimeout(() => {
                                    focusNextBoxField(index, thisCol);
                                  }, 100);
                                }}
                                onKeyDown={(e) => {
                                  const target = e.target as HTMLElement | null;

                                  if (!target) return;

                                  const isInListbox =
                                    target.closest('[role="listbox"]');

                                  if (isInListbox) return;

                                  if (e.key === "Escape") return;

                                  // معالجة الأسهم للتنقل
                                  if (
                                    e.key === "ArrowRight" ||
                                    e.key === "ArrowLeft" ||
                                    e.key === "ArrowDown" ||
                                    e.key === "ArrowUp"
                                  ) {
                                    const selectButton =
                                      target.closest('[role="combobox"]');
                                    const isExpanded =
                                      selectButton?.getAttribute(
                                        "aria-expanded",
                                      ) === "true";

                                    if (!isExpanded) {
                                      // إذا كانت القائمة مغلقة، نستخدم التنقل
                                      handleBoxKeyDown(e, index, thisCol);

                                      return;
                                    }

                                    // إذا كانت القائمة مفتوحة، نترك الأسهم تعمل داخل القائمة
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
                                      handleBoxKeyDown(e, index, thisCol, {
                                        allowEnterDefaultWhenRowMissing:
                                          !box?.box_id,
                                      });

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
                        <input
                          ref={setBoxInputRef(index, 2)}
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                          data-box-col={2}
                          data-box-row={index}
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
                          onKeyDown={(e) => handleBoxKeyDown(e, index, 2)}
                        />
                      </td>
                      <td className="p-0 border">
                        <input
                          ref={setBoxInputRef(index, 3)}
                          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                          data-box-col={3}
                          data-box-row={index}
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
                          onKeyDown={(e) =>
                            handleBoxKeyDown(e, index, 3, { isLastCol: true })
                          }
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>
                      <td className="p-0 border">
                        {(() => {
                          const thisCol = 4;
                          const costValue = getCostCenterSelectValue(
                            box.cost_id,
                          );

                          return (
                            <div
                              ref={setBoxInputRef(index, thisCol)}
                              data-box-col={4}
                              data-box-row={index}
                              data-col={4}
                              data-row={index}
                              className="h-full"
                            >
                              <ReactSelect
                                isSearchable
                                className="text-xs"
                                classNamePrefix="react-select"
                                components={{ IndicatorSeparator: () => null }}
                                instanceId={`cost-center-cash-select-${index}`}
                                isDisabled={
                                  !isEditing || costCenters.length === 0
                                }
                                menuPortalTarget={
                                  typeof window !== "undefined"
                                    ? document.body
                                    : null
                                }
                                menuPosition="fixed"
                                options={costCenterSelectOptions}
                                placeholder={t(
                                  "tables.gold.placeholders.selectCostCenter",
                                )}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: "32px",
                                    height: "32px",
                                    fontSize: "12px",
                                    border: "none",
                                    borderRadius: 0,
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
                                value={costValue}
                                onChange={(selectedOption: any) => {
                                  if (!isEditing) return;
                                  updateVoucherBox(
                                    index,
                                    "cost_id",
                                    selectedOption?.value
                                      ? parseInt(String(selectedOption.value))
                                      : null,
                                  );

                                  // الانتقال للحقل التالي بعد الاختيار
                                  setTimeout(() => {
                                    focusNextBoxField(index, thisCol);
                                  }, 100);
                                }}
                                onKeyDown={(e) => {
                                  const target = e.target as HTMLElement | null;

                                  if (!target) return;

                                  const isInListbox =
                                    target.closest('[role="listbox"]');

                                  if (isInListbox) return;

                                  if (e.key === "Escape") return;

                                  // معالجة الأسهم للتنقل
                                  if (
                                    e.key === "ArrowRight" ||
                                    e.key === "ArrowLeft" ||
                                    e.key === "ArrowDown" ||
                                    e.key === "ArrowUp"
                                  ) {
                                    const selectButton =
                                      target.closest('[role="combobox"]');
                                    const isExpanded =
                                      selectButton?.getAttribute(
                                        "aria-expanded",
                                      ) === "true";

                                    if (!isExpanded) {
                                      handleBoxKeyDown(e, index, thisCol, {
                                        isLastCol: true,
                                      });

                                      return;
                                    }

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
                                      handleBoxKeyDown(e, index, thisCol, {
                                        allowEnterDefaultWhenRowMissing:
                                          !box?.cost_id,
                                        isLastCol: true,
                                      });

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
                          onClick={() => removeVoucherBoxRow(index)}
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

      {/* Totals */}
      <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-200 mt-1.5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">
              {t("totals.totalGoldStanding")}:
            </span>
            <span className="font-semibold text-yellow-600">
              {totals.totalGoldWeight.toFixed(5)} {t("totals.unit")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-amber-800 font-medium">
              {t("totals.totalGoldCalibrated")}:
            </span>
            <span className="font-semibold text-yellow-600">
              {totals.totalGoldGWeight.toFixed(5)} {t("totals.unit")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-amber-800 font-medium">
              {t("totals.totalWages")}:
            </span>
            <span className="font-semibold text-yellow-600">
              {formatAmount(totals.totalWork)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">
              {t("totals.totalCash")}:
            </span>
            <span className="font-semibold text-blue-700 flex items-center gap-1">
              {formatAmount(totals.totalBoxes)}
              <RiyalIcon color="currentColor" />
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
          <ModalHeader className="flex flex-col gap-1">
            <p className="text-lg font-semibold">{t("modals.notes.title")}</p>
          </ModalHeader>
          <ModalBody>
            <Textarea
              classNames={{
                input: "resize-none",
              }}
              disabled={!isEditing}
              maxRows={12}
              minRows={6}
              placeholder={t("modals.notes.placeholder")}
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
              {t("modals.notes.save")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
