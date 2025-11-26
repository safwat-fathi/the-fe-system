"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
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
} from "@heroicons/react/24/outline";

import useEnterKeyNavigation from "../invoices/hooks/useEnterKeyNavigation";

import useKeyAsTab from "@/hooks/useKeyAsTab";
import SearchableSelect from "@/components/SearchableSelect";
import { Voucher, VoucherBox, GVoucherDetail } from "@/types/voucher";
import { useReceiptDeliveryVoucherForm } from "@/hooks/useReceiptDeliveryVoucherForm";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";

import "bootstrap-icons/font/bootstrap-icons.css";

interface DeliveryVoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherBoxes?: VoucherBox[];
  goldDetailsData?: GVoucherDetail[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
  accounts: any[];
  boxes: any[];
  goldBoxes?: any[];
  costCenters: any[];
  customers: any[];
  items: any[];
  voucherTypes: any[];
  startInEditMode?: boolean;
  vouchType: number; // 222 للتسليم
  formMode?: "new" | "edit" | "preview";
  categories?: any[];
}

export default function DeliveryVoucherClientPage({
  voucherData,
  voucherBoxes: initialVoucherBoxes = [],
  goldDetailsData: initialGoldDetails = [],
  isNewVoucher = true,
  voucherRecordId,
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
}: DeliveryVoucherClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();

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
    loadMoreItems,
    hasMoreItems,
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

  // Handle search
  const [searchTerm, setSearchTerm] = useState("");
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  // Ref للحقول العلوية للتنقل
  const selectorsRef = useRef<HTMLDivElement>(null);

  // Hook for Enter key navigation in top form fields
  const { handleKeyDown: handleKeyDownSelectors } = useKeyAsTab({
    keys: ["Enter"],
    containerRef: selectorsRef,
    disabled: !isEditing,
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
      const isLastCol = options?.isLastCol || colIndex >= 12; // آخر عمود هو 12 (مركز التكلفة)

      // إذا كان الحقل الحالي هو معدل الأجور (colIndex 4) والضغط على Enter أو ArrowLeft
      // التخطي مباشرة إلى حقل الصندوق (colIndex 6) لأن حقل الأجور (colIndex 5) معطل
      if (
        colIndex === 4 &&
        (event.key === "Enter" || event.key === "ArrowLeft")
      ) {
        // التخطي مباشرة إلى الحقل الذي يليه (الصندوق - colIndex 6)
        event.preventDefault();
        event.stopPropagation();
        setTimeout(() => {
          const boxSelect = document.querySelector(
            `#gold-box-select-${rowIndex}`,
          ) as HTMLElement;

          if (boxSelect) {
            const selectButton = boxSelect.closest(
              '[role="combobox"]',
            ) as HTMLElement;

            if (selectButton) {
              selectButton.focus();

              return;
            }
            boxSelect.focus();

            return;
          }
        }, 50);

        return;
      }

      // عند الوصول لآخر حقل في آخر صف، الانتقال لجدول النقدية
      if (
        isLastRow &&
        isLastCol &&
        (event.key === "Enter" || event.key === "Tab")
      ) {
        event.preventDefault();
        event.stopPropagation();
        setTimeout(() => {
          // الانتقال لأول حقل في جدول النقدية
          const firstCashInput = document.querySelector(
            'input[data-box-row="0"][data-box-col="0"]',
          ) as HTMLInputElement;

          if (firstCashInput) {
            firstCashInput.focus();
            firstCashInput.select();

            return;
          }
        }, 50);

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
    [handleGoldKeyDownBase, goldDetails.length],
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

  const handleBoxKeyDown = handleBoxKeyDownBase;

  // دالة البحث في الأصناف (خارج map لتجنب loop)
  // استخدام useRef لتخزين loadItemOptions لتجنب إعادة الإنشاء
  const loadItemOptionsRef = useRef(loadItemOptions);
  const loadMoreItemsRef = useRef(loadMoreItems);
  const hasMoreItemsRef = useRef(hasMoreItems);

  // تحديث refs عند تغيير الدوال
  useEffect(() => {
    loadItemOptionsRef.current = loadItemOptions;
    loadMoreItemsRef.current = loadMoreItems;
    hasMoreItemsRef.current = hasMoreItems;
  }, [loadItemOptions, loadMoreItems, hasMoreItems]);

  // استخدام useRef لتخزين آخر searchTerm لتجنب البحث المتكرر
  const lastSearchTermRef = useRef<string>("");
  const searchInProgressRef = useRef<boolean>(false);
  const currentPageRef = useRef<number>(1);
  const hasMoreRef = useRef<boolean>(true);

  // State لتتبع hasMore لكل SearchableSelect
  const [itemsHasMore, setItemsHasMore] = useState<boolean>(true);

  const handleItemSearch = useCallback(async (searchTerm: string) => {
    const trimmed = searchTerm.trim();

    // إذا كان البحث نفسه، لا نعيد البحث
    if (trimmed === lastSearchTermRef.current && trimmed !== "") {
      return [];
    }

    // إذا كان البحث قيد التنفيذ، لا نبدأ بحث جديد
    if (searchInProgressRef.current) {
      return [];
    }

    // إذا كان البحث فارغاً، نحمل أول صفحة (عند فتح القائمة)
    if (!trimmed) {
      lastSearchTermRef.current = "";
      currentPageRef.current = 1;
      hasMoreRef.current = true;

      try {
        const results = await loadItemOptionsRef.current("", [], { page: 1 });
        // التحقق من وجود صفحات إضافية
        const hasMore = await hasMoreItemsRef.current(1, "");

        hasMoreRef.current = hasMore;
        setItemsHasMore(hasMore);

        // إزالة _hasNext من النتائج قبل الإرجاع
        const cleanResults = Array.isArray(results)
          ? results.map((r: any) => {
              const rest = { ...r };

              delete (rest as any)._hasNext;

              return rest;
            })
          : [];

        return cleanResults;
      } catch (error) {
        console.error("Error in handleItemSearch:", error);

        return [];
      }
    }

    try {
      searchInProgressRef.current = true;
      lastSearchTermRef.current = trimmed;
      currentPageRef.current = 1;

      // تحميل أول صفحة مع البحث
      const results = await loadItemOptionsRef.current(trimmed, [], {
        page: 1,
      });

      // التحقق من وجود صفحات إضافية
      const hasMore = await hasMoreItemsRef.current(1, trimmed);

      hasMoreRef.current = hasMore;
      setItemsHasMore(hasMore);

      // التأكد من أن النتائج هي array
      if (!results) {
        return [];
      }

      // إذا كانت النتائج array مباشر
      if (Array.isArray(results)) {
        // إزالة _hasNext من النتائج قبل الإرجاع
        return results.map((r: any) => {
          const rest = { ...r };

          delete (rest as any)._hasNext;

          return rest;
        });
      }

      // إذا كانت النتائج كائن به options
      if (results && typeof results === "object" && "options" in results) {
        const resultsObj = results as { options?: any[] };

        return Array.isArray(resultsObj.options) ? resultsObj.options : [];
      }

      return [];
    } catch (error) {
      console.error("Error in handleItemSearch:", error);

      return [];
    } finally {
      searchInProgressRef.current = false;
    }
  }, []); // لا dependencies لأننا نستخدم ref

  // دالة للتحميل التدريجي (Infinite Scroll)
  const handleLoadMoreItems = useCallback(
    async (page: number, searchTerm: string) => {
      try {
        const results = await loadMoreItemsRef.current(page, searchTerm);

        // التحقق من وجود صفحات إضافية
        const hasMore = await hasMoreItemsRef.current(page, searchTerm);

        hasMoreRef.current = hasMore;
        setItemsHasMore(hasMore);
        currentPageRef.current = page;

        // إزالة _hasNext من النتائج قبل الإرجاع
        const cleanResults = Array.isArray(results)
          ? results.map((r: any) => {
              const rest = { ...r };

              delete (rest as any)._hasNext;

              return rest;
            })
          : [];

        return cleanResults;
      } catch (error) {
        console.error("Error in handleLoadMoreItems:", error);

        return [];
      }
    },
    [],
  );

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
      toast.error("يرجى إدخال رقم السند للبحث");

      return;
    }

    const searchValue = searchTerm.trim();

    try {
      const { voucherService } = await import("@/services/api");
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: "222",
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
          const targetId = foundVoucher.id || foundVoucher.vouch_id;

          if (targetId) {
            router.push(`/forms/delivery/${targetId}?mode=preview`);
            setSearchTerm("");

            return;
          }
        }
      }

      toast.error(`لم يتم العثور على سند تسليم برقم: ${searchValue}`);
    } catch (error) {
      console.error("Error searching voucher:", error);
      toast.error("حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى");
    }
  };

  // Handle edit click
  const handleEditClick = () => {
    setVoucher((prev) => ({
      ...prev,
      commit: false,
    }));

    if (pathname && voucherRecordId) {
      router.push(`/forms/delivery/${voucherRecordId}?mode=edit`);
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
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const voucherTypeName =
    voucherTypes.find((t) => (t.Id || t.id) === vouchType)?.name || "سند تسليم";

  return (
    <div className="p-2 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-2 mb-2 border border-slate-200">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>{voucherTypeName}</span>
              <span className="text-slate-600 font-medium">
                #
                {voucher.vouch_id && voucher.vouch_id > 0
                  ? voucher.vouch_id
                  : "جاري الترقيم..."}
              </span>
              <span className="text-sm text-slate-600 font-medium flex items-center gap-1">
                <i className="bi bi-calendar3 w-4 h-4 text-slate-500" />
                {new Date(voucher.vouch_date).toLocaleString("ar-EG")}
              </span>
            </h1>
          </div>

          {/* البحث */}
          <div className="flex items-center gap-2">
            <input
              className="w-32 h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
              placeholder="بحث برقم السند..."
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
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 min-w-[90px]"
              size="sm"
              startContent={<PlusIcon className="h-4 w-4" />}
              variant="solid"
              onPress={() => router.push("/forms/delivery")}
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
          </div>

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

      {/* Form Fields - Row 1 */}
      <div
        ref={selectorsRef}
        className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2"
        onKeyDownCapture={handleKeyDownSelectors}
      >
        {/* رقم المرجع - أضيق */}
        <div className="md:col-span-2">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="delivery-ref-no"
          >
            رقم المرجع
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            id="delivery-ref-no"
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
            htmlFor="delivery-datetime"
          >
            التاريخ والوقت
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            id="delivery-datetime"
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
            htmlFor="delivery-notes"
          >
            البيان
          </label>
          <div className="relative">
            <input
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 pr-8"
              disabled={!isEditing}
              id="delivery-notes"
              placeholder="أدخل بيان القيد (انقر نقرتين للكتابة المطولة)"
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

                      return;
                    }
                  }, 50);

                  return;
                }
              }}
            />
            {isEditing && (
              <button
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all duration-200"
                data-skip-key-as-tab="true"
                title="توسيع البيان"
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2">
        {/* العميل */}
        <div className="md:col-span-4">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="customer-select"
          >
            العميل
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
                  setTimeout(() => {
                    const handlingInput = document.querySelector(
                      'input[placeholder*="مناولة"]',
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
            <SearchableSelect
              className="text-xs"
              defaultOptions={defaultCustomerOptions}
              disabled={!isEditing}
              emptyMessage="لا يوجد عملاء"
              inputId="customer-select"
              options={[]}
              placeholder="اختر العميل..."
              searchPlaceholder="ابحث عن العميل..."
              value={getCustomerSelectValue()?.value || null}
              onChange={(selectedValue) => {
                if (!isEditing) return;
                if (!selectedValue) {
                  setSelectedCustomer(null);
                  setVoucher((prev) => ({
                    ...prev,
                    cust_id: undefined,
                    handling: "",
                  }));

                  return;
                }

                const selected = customers.find(
                  (cust) => cust.id === selectedValue,
                );

                setSelectedCustomer(selected || null);

                const handling = selected?.handling?.toString() || "";

                setVoucher((prev) => ({
                  ...prev,
                  cust_id: selected?.id ?? null,
                  handling: handling,
                }));
              }}
              onSearch={async (searchTerm: string) => {
                try {
                  const results = await loadCustomerOptions(searchTerm);

                  return results || [];
                } catch (error) {
                  console.error("Error in customer search:", error);

                  return [];
                }
              }}
            />
          </div>
        </div>

        {/* مناولة */}
        <div className="md:col-span-3">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="delivery-handling"
          >
            مناولة
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            id="delivery-handling"
            placeholder="مناولة"
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
                setTimeout(() => {
                  const costCenterSelect = document.querySelector(
                    "#delivery-cost-center-select",
                  ) as HTMLElement;

                  if (costCenterSelect) {
                    const selectButton = costCenterSelect.closest(
                      '[role="combobox"]',
                    ) as HTMLElement;

                    if (selectButton) {
                      selectButton.focus();

                      return;
                    }
                    costCenterSelect.focus();

                    return;
                  }
                }, 50);

                return;
              }
            }}
          />
        </div>

        {/* مركز التكلفة */}
        <div className="md:col-span-5">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="delivery-cost-center-select"
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
                  setTimeout(() => {
                    // الانتقال لأول حقل في جدول الذهب (حقل الصنف - SearchableSelect)
                    const firstItemSelect = document.querySelector(
                      "#item-select-0",
                    ) as HTMLElement;

                    if (firstItemSelect) {
                      const selectButton = firstItemSelect.closest(
                        '[role="combobox"]',
                      ) as HTMLElement;

                      if (selectButton) {
                        selectButton.focus();

                        return;
                      }
                      firstItemSelect.focus();

                      return;
                    }
                    // إذا لم يوجد، نبحث عن أول input في الجدول
                    const firstGoldInput = document.querySelector(
                      'input[data-gold-row="0"][data-gold-col="0"]',
                    ) as HTMLInputElement;

                    if (firstGoldInput) {
                      firstGoldInput.focus();
                      firstGoldInput.select();

                      return;
                    }
                    // إذا لم يوجد، نبحث عن أول input في الجدول
                    const firstInput = document.querySelector(
                      'table input[data-gold-row="0"]',
                    ) as HTMLInputElement;

                    if (firstInput) {
                      firstInput.focus();
                      firstInput.select();
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
            <SearchableSelect
              className="text-xs"
              disabled={!isEditing}
              emptyMessage="لا يوجد مراكز تكلفة"
              inputId="delivery-cost-center-select"
              options={costCenterSelectOptions}
              placeholder="اختر مركز التكلفة..."
              searchPlaceholder="ابحث عن مركز التكلفة..."
              value={getCostCenterSelectValue(voucher.cost_id)?.value || null}
              onChange={(selectedValue) => {
                if (!isEditing) return;
                const costId = selectedValue
                  ? parseInt(String(selectedValue))
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
            />
          </div>
        </div>
      </div>

      {/* Gold Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-2">
        <div className="p-1.5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">الذهب</h3>
        </div>
        <div className="p-1">
          <div className="flex justify-between mb-1">
            <button
              className="btn"
              disabled={!isEditing}
              type="button"
              onClick={addGoldDetailRow}
            >
              + صف
            </button>
          </div>
          <div className="overflow-x-auto mb-1 max-w-full">
            <table className="min-w-[1400px] border text-xs text-center table-fixed">
              <thead className="bg-gray-100 text-xs font-bold">
                <tr>
                  <th className="w-72 p-1 border">رقم الصنف</th>
                  <th className="w-32 p-1 border">الوزن القائم</th>
                  <th className="w-32 p-1 border">معايرة</th>
                  <th className="w-32 p-1 border">الوزن المعاير</th>
                  <th className="w-32 p-1 border">معدل الأجور</th>
                  <th className="w-32 p-1 border">الأجور</th>
                  <th className="w-48 p-1 border">الصندوق</th>
                  <th className="w-80 p-1 border">البيان</th>
                  <th className="w-32 p-1 border">فرق عيار</th>
                  <th className="w-32 p-1 border">مبلغ التسكير</th>
                  <th className="w-32 p-1 border">وزن التسكير</th>
                  <th className="w-32 p-1 border">رقم الفاتورة</th>
                  <th className="w-48 p-1 border">مركز التكلفة</th>
                  <th className="w-12 p-1 border">حذف</th>
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
                            ref={(el) => {
                              const refSetter = setGoldInputRef(index, thisCol);

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
                            <SearchableSelect
                              className="text-xs h-full"
                              defaultOptions={defaultItemOptions}
                              disabled={!isEditing}
                              emptyMessage="لا توجد أصناف"
                              hasMore={itemsHasMore}
                              inputId={`item-select-${index}`}
                              options={[]}
                              placeholder="اختر الصنف..."
                              searchDebounceMs={500}
                              searchPlaceholder="ابحث عن الصنف..."
                              value={selectedItemValue}
                              onChange={(selectedValue) => {
                                if (!isEditing) return;
                                if (!selectedValue) {
                                  updateGoldDetail(index, "item_id", null);
                                  updateGoldDetail(index, "item_code", "");
                                  updateGoldDetail(index, "item_name", "");

                                  return;
                                }

                                const selected = items.find(
                                  (itm) => itm.id === selectedValue,
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
                              onLoadMore={handleLoadMoreItems}
                              onSearch={handleItemSearch}
                              onSelectComplete={() => {
                                setTimeout(() => {
                                  focusNextGoldField(index, thisCol);
                                }, 100);
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
                        const selectedBoxValue = boxValue
                          ? typeof boxValue === "object"
                            ? boxValue.value
                            : boxValue
                          : null;

                        return (
                          <div
                            ref={(el) => {
                              const refSetter = setGoldInputRef(index, thisCol);

                              if (el) {
                                setTimeout(() => {
                                  const selectButton = document.querySelector(
                                    `#gold-box-select-${index}`,
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
                              disabled={!isEditing}
                              emptyMessage="لا توجد صناديق"
                              inputId={`gold-box-select-${index}`}
                              options={goldBoxSelectOptions}
                              placeholder="اختر الصندوق..."
                              searchPlaceholder="ابحث عن الصندوق..."
                              value={selectedBoxValue}
                              onChange={(selectedValue) => {
                                if (!isEditing) return;
                                updateGoldDetail(
                                  index,
                                  "box_id",
                                  selectedValue
                                    ? parseInt(String(selectedValue))
                                    : undefined,
                                );
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
                              onSelectComplete={() => {
                                setTimeout(() => {
                                  focusNextGoldField(index, thisCol);
                                }, 100);
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
                        const selectedCostValue = costValue
                          ? typeof costValue === "object"
                            ? costValue.value
                            : costValue
                          : null;

                        return (
                          <div
                            ref={(el) => {
                              const refSetter = setGoldInputRef(index, thisCol);

                              if (el) {
                                setTimeout(() => {
                                  const selectButton = document.querySelector(
                                    `#cost-center-gold-select-${index}`,
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
                              disabled={!isEditing}
                              emptyMessage="لا يوجد مراكز تكلفة"
                              inputId={`cost-center-gold-select-${index}`}
                              options={costCenterSelectOptions}
                              placeholder="مركز التكلفة..."
                              searchPlaceholder="ابحث عن مركز التكلفة..."
                              value={selectedCostValue}
                              onChange={(selectedValue) => {
                                if (!isEditing) return;
                                updateGoldDetail(
                                  index,
                                  "cost_id",
                                  selectedValue
                                    ? parseInt(String(selectedValue))
                                    : undefined,
                                );
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
                              onSelectComplete={() => {
                                setTimeout(() => {
                                  focusNextGoldField(index, thisCol);
                                }, 100);
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

      {/* Cash Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-2">
        <div className="p-1.5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">النقدية</h3>
        </div>
        <div className="p-1">
          <div className="flex justify-between mb-1">
            <button
              className="btn"
              disabled={!isEditing}
              type="button"
              onClick={addVoucherBoxRow}
            >
              + صف
            </button>
          </div>
          <div className="overflow-x-auto mb-1 max-w-full">
            <table className="min-w-[1000px] border text-xs text-center table-fixed">
              <thead className="bg-gray-100 text-xs font-bold">
                <tr>
                  <th className="w-32 p-1 border">المبلغ</th>
                  <th className="w-48 p-1 border">الصندوق</th>
                  <th className="w-80 p-1 border">البيان</th>
                  <th className="w-32 p-1 border">رقم الفاتورة</th>
                  <th className="w-48 p-1 border">مركز التكلفة</th>
                  <th className="w-12 p-1 border">حذف</th>
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
                        const selectedBoxValue = boxValue
                          ? typeof boxValue === "object"
                            ? boxValue.value
                            : boxValue
                          : null;

                        return (
                          <div
                            ref={(el) => {
                              const refSetter = setBoxInputRef(index, thisCol);

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
                            <SearchableSelect
                              className="text-xs h-full"
                              disabled={!isEditing}
                              emptyMessage="لا توجد صناديق"
                              inputId={`cash-box-select-${index}`}
                              options={cashBoxSelectOptions}
                              placeholder="اختر الصندوق..."
                              searchPlaceholder="ابحث عن الصندوق..."
                              value={selectedBoxValue}
                              onChange={(selectedValue) => {
                                if (!isEditing) return;
                                const selectedBoxId = selectedValue
                                  ? parseInt(String(selectedValue))
                                  : 0;

                                updateVoucherBox(
                                  index,
                                  "box_id",
                                  selectedBoxId,
                                );
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
                              onSelectComplete={() => {
                                setTimeout(() => {
                                  focusNextBoxField(index, thisCol);
                                }, 100);
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
                          updateVoucherBox(index, "vouch_notes", e.target.value)
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
                        const costValue = getCostCenterSelectValue(box.cost_id);
                        const selectedCostValue = costValue
                          ? typeof costValue === "object"
                            ? costValue.value
                            : costValue
                          : null;

                        return (
                          <div
                            ref={(el) => {
                              const refSetter = setBoxInputRef(index, thisCol);

                              if (el) {
                                setTimeout(() => {
                                  const selectButton = document.querySelector(
                                    `#cost-center-cash-select-${index}`,
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
                              disabled={!isEditing}
                              emptyMessage="لا يوجد مراكز تكلفة"
                              inputId={`cost-center-cash-select-${index}`}
                              options={costCenterSelectOptions}
                              placeholder="مركز التكلفة..."
                              searchPlaceholder="ابحث عن مركز التكلفة..."
                              value={selectedCostValue}
                              onChange={(selectedValue) => {
                                if (!isEditing) return;
                                updateVoucherBox(
                                  index,
                                  "cost_id",
                                  selectedValue
                                    ? parseInt(String(selectedValue))
                                    : null,
                                );
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
                              onSelectComplete={() => {
                                setTimeout(() => {
                                  focusNextBoxField(index, thisCol);
                                }, 100);
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

      {/* Totals */}
      <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 mt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">
              إجمالي الذهب (القائم):
            </span>
            <span className="font-semibold text-yellow-600">
              {totals.totalGoldWeight.toFixed(5)} جم
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-amber-800 font-medium">
              إجمالي الذهب (المعاير):
            </span>
            <span className="font-semibold text-yellow-600">
              {totals.totalGoldGWeight.toFixed(5)} جم
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-amber-800 font-medium">إجمالي الأجور:</span>
            <span className="font-semibold text-yellow-600">
              {formatAmount(totals.totalWork)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">إجمالي النقدية:</span>
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
