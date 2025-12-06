"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
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
} from "@heroicons/react/24/outline";

import useEnterKeyNavigation from "@/app/[locale]/(pages)/forms/invoices/hooks/useEnterKeyNavigation";
import useKeyAsTab from "@/hooks/useKeyAsTab";
import AsyncCreatableSelect from "react-select/async-creatable";
import ReactSelect from "react-select";
import { Voucher, VoucherBox, GVoucherDetail } from "@/types/voucher";
import { voucherService, itemService, customerService } from "@/services/api";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";
import { getLocaleDir } from "@/i18n/config";

import "bootstrap-icons/font/bootstrap-icons.css";

interface CustomerGoldVoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherBoxes?: VoucherBox[];
  goldDetailsData?: GVoucherDetail[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
  accounts?: any[];
  boxes: any[];
  goldBoxes?: any[];
  costCenters: any[];
  customers: any[];
  items: any[];
  voucherTypes: any[];
  startInEditMode?: boolean;
  vouchType: number; // 4 للقبض، 5 للصرف
  formMode?: "new" | "edit" | "preview";
  categories?: any[];
}

export default function CustomerGoldVoucherClientPage({
  voucherData,
  voucherBoxes: initialVoucherBoxes = [],
  goldDetailsData: initialGoldDetails = [],
  isNewVoucher = true,
  voucherRecordId,
  accounts: initialAccounts = [],
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
}: CustomerGoldVoucherClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("forms.customerGoldVoucher");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dir = getLocaleDir(locale);
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const textAlignCenter = dir === "rtl" ? "text-center" : "text-center";

  // State Management
  const [voucher, setVoucher] = useState<Voucher>(
    voucherData
      ? {
        ...voucherData,
        cost_id: voucherData.cost_id ?? null,
      }
      : {
        vouch_id: 0,
        vouch_date: new Date().toISOString(),
        vouch_type: vouchType,
        vouch_amt: 0,
        pay_type: 1,
        cr_date: new Date().toISOString(),
        vouch_status: 1,
        commit: false,
        post: false,
        print: false,
        opps_vouch: 0,
        handling: "",
        cost_id: null,
      },
  );

  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [voucherBoxes, setVoucherBoxes] = useState<VoucherBox[]>(
    initialVoucherBoxes || [],
  );
  const [goldDetails, setGoldDetails] = useState<GVoucherDetail[]>(
    initialGoldDetails || [],
  );
  const [accounts] = useState<any[]>(initialAccounts);
  const [boxes] = useState<any[]>(initialBoxes);
  const [goldBoxOptions, setGoldBoxOptions] = useState<any[]>(
    initialGoldBoxes && initialGoldBoxes.length > 0
      ? initialGoldBoxes
      : initialBoxes,
  );
  const [costCenters] = useState<any[]>(initialCostCenters);
  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  const [items, setItems] = useState<any[]>(initialItems);
  const [voucherTypes] = useState<any[]>(initialVoucherTypes);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [originalBoxes, setOriginalBoxes] = useState<VoucherBox[]>([]);
  const [originalGoldDetails, setOriginalGoldDetails] = useState<
    GVoucherDetail[]
  >([]);

  const numericVoucherId = Number(voucher.vouch_id ?? 0);
  const hasVoucherId = Number.isFinite(numericVoucherId) && numericVoucherId > 0;
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [defaultCustomerOptions, setDefaultCustomerOptions] = useState<any[]>(
    [],
  );

  // Ref لحقل رقم المرجع
  const refNoInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(
    () => initialCategories || [],
    [initialCategories],
  );
  const categoryMap = useMemo(() => {
    const map = new Map<number, any>();

    categories.forEach((category: any) => {
      const rawId = category?.id ?? category?.cat ?? category?.cat_id;
      const parsedId = Number(rawId);

      if (Number.isFinite(parsedId) && parsedId > 0) {
        map.set(parsedId, category);
      }
    });

    return map;
  }, [categories]);

  const getCategoryBoxId = (category: any): number | undefined => {
    if (!category) return undefined;

    const candidates = [
      category.box_id,
      category.box,
      category.cat_box,
      category.gold_box,
      category.default_box,
      category.default_gold_box,
    ];

    for (const candidate of candidates) {
      const parsed = Number(candidate);

      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return undefined;
  };

  // Initialize component
  useEffect(() => {
    setIsClient(true);

    if (isNewVoucher) {
      generateNextVoucherNumber();
      // إضافة صف فارغ واحد على الأقل لكل جدول
      if (voucherBoxes.length === 0) {
        setVoucherBoxes([
          {
            id: 0,
            vouch_id: 0,
            box_id: 0,
            amount: 0,
            vouch_notes: "",
            cost_id: null,
            inv_id: undefined,
            close_weight: undefined,
            cr_date: new Date().toISOString(),
          },
        ]);
      }
      if (goldDetails.length === 0) {
        setGoldDetails([
          {
            id: 0,
            vouch_id: 0,
            item_id: 0,
            k: undefined,
            weight: undefined,
            g_weight: undefined,
            weight2: undefined,
            g_weight2: undefined,
            box_id: undefined,
            notes: "",
            diff: undefined,
            close_amt: undefined,
            close_weight: undefined,
            inv_id: undefined,
            cost_id: undefined,
            work_amt: undefined,
            total_work: undefined,
            qty: undefined,
            cr_date: new Date().toISOString(),
          },
        ]);
      }
    } else {
      setOriginalBoxes(initialVoucherBoxes || []);
      setOriginalGoldDetails(initialGoldDetails || []);

      // تعيين العميل المختار
      if (voucherData?.cust_id) {
        const customer = customers.find((c) => c.id === voucherData.cust_id);

        if (customer) {
          setSelectedCustomer(customer);
        }
      }
    }

    // تحميل الخيارات الافتراضية للعملاء
    if (initialCustomers && initialCustomers.length > 0) {
      const options = initialCustomers.map((customer: any) => ({
        value: customer.id,
        label: `${customer.cust_code || ""} - ${customer.cust_name || ""}`,
        customer: customer,
      }));

      setDefaultCustomerOptions(options);
    }
  }, []);

  useEffect(() => {
    if (initialGoldBoxes && initialGoldBoxes.length > 0) {
      setGoldBoxOptions(initialGoldBoxes);
    } else if (!initialGoldBoxes || initialGoldBoxes.length === 0) {
      setGoldBoxOptions(initialBoxes);
    }
  }, [initialGoldBoxes, initialBoxes]);

  // تحديث voucher عند تغيير voucherData (خاصة عند تحميل سند موجود)
  useEffect(() => {
    if (voucherData && !isNewVoucher) {
      setVoucher((prev) => ({
        ...prev,
        ...voucherData,
        cost_id: voucherData.cost_id ?? prev.cost_id ?? null,
      }));
    }
  }, [voucherData, isNewVoucher]);

  // تحميل العملاء عند تغيير initialCustomers
  useEffect(() => {
    if (
      initialCustomers &&
      initialCustomers.length > 0 &&
      customers.length === 0
    ) {
      setCustomers(initialCustomers);
      const options = initialCustomers.map((customer: any) => ({
        value: customer.id,
        label: `${customer.cust_code || ""} - ${customer.cust_name || ""}`,
        customer: customer,
      }));

      setDefaultCustomerOptions(options);
    }
  }, [initialCustomers]);

  useEffect(() => {
    if (formMode === "preview") {
      setIsEditing(false);
    } else if (formMode === "new") {
      setIsEditing(true);
    } else if (formMode === "edit") {
      setIsEditing(startInEditMode !== false);
    }
  }, [formMode, startInEditMode]);

  // تركيز المؤشر على حقل رقم المرجع عند فتح الشاشة
  useEffect(() => {
    if (isClient && isEditing) {
      // استخدام setTimeout لضمان أن العنصر موجود في DOM
      const timer = setTimeout(() => {
        const refNoInput = document.getElementById("gold-ref-no") as HTMLInputElement;
        if (refNoInput && !refNoInput.disabled) {
          refNoInput.focus();
          refNoInput.select();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isClient, isEditing]);

  const generateNextVoucherNumber = async () => {
    try {
      const nextId = await voucherService.getNextNumber(vouchType);

      setVoucher((prev) => ({
        ...prev,
        vouch_id: nextId,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString(),
      }));
    } catch {
      setVoucher((prev) => ({
        ...prev,
        vouch_id: 1,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString(),
      }));
    }
  };

  // Update voucher box
  const updateVoucherBox = (index: number, field: string, value: any) => {
    setVoucherBoxes((prev) => {
      const updated = prev.map((box, i) => {
        if (i === index) {
          const updatedBox = { ...box, [field]: value };

          // إذا تم تحديث box_id وكان 0، احذف box object
          if (field === "box_id" && (!value || value === 0)) {
            updatedBox.box = undefined;
          } else if (field === "box_id" && value && value > 0) {
            // عند اختيار صندوق، احفظ معلوماته في box object
            const selectedBox = boxes.find((b) => b.id === value);

            if (selectedBox) {
              updatedBox.box = {
                id: selectedBox.id,
                cust_name: selectedBox.cust_name || selectedBox.name || "",
                cust_code: selectedBox.cust_code || "",
                box_type: selectedBox.box_type,
              };
            }
          }

          return updatedBox;
        }

        return box;
      });

      return updated;
    });
  };

  // Update gold detail with automatic g_weight calculation (نفس منطق التسليم والاستلام)
  const updateGoldDetail = (index: number, field: string, value: any) => {
    setGoldDetails((prev) => {
      const updated = prev.map((detail, i) => {
        if (i !== index) return detail;

        const newDetail = { ...detail, [field]: value };

        // حساب تلقائي للوزن المعاير: g_weight = weight * (k / 875)
        // نفس منطق التسليم والاستلام بالضبط
        if (field === "weight" || field === "k") {
          const weight =
            field === "weight"
              ? typeof value === "number"
                ? value
                : parseFloat(String(value || "0")) || 0
              : typeof newDetail.weight === "number"
                ? newDetail.weight
                : parseFloat(String(newDetail.weight || "0")) || 0;
          const k =
            field === "k"
              ? typeof value === "number"
                ? value
                : parseFloat(String(value || "0")) || 0
              : typeof newDetail.k === "number"
                ? newDetail.k
                : parseFloat(String(newDetail.k || "0")) || 0;

          if (weight > 0 && k > 0) {
            // حساب الوزن المعاير: g_weight = weight * (k / 875)
            const calculatedGWeight = (weight * k) / 875;

            newDetail.g_weight = parseFloat(calculatedGWeight.toFixed(5));
          } else {
            newDetail.g_weight = undefined;
          }
        }

        // عند تغيير item_id، جلب k و weight من الصنف المحدد
        // ثم حساب g_weight إذا كان weight و k موجودان
        if (field === "item_id" && value) {
          const selectedItem = items.find((item) => item.id === value);

          if (selectedItem) {
            const toNumber = (input: unknown) => {
              const parsed = Number(input);

              return Number.isFinite(parsed) ? parsed : 0;
            };

            newDetail.item_id = selectedItem.id;
            newDetail.item_code =
              selectedItem.item_code ||
              selectedItem.code ||
              newDetail.item_code ||
              "";
            newDetail.item_name =
              selectedItem.item_name ||
              selectedItem.name ||
              newDetail.item_name ||
              "";

            const rawCategoryId =
              selectedItem.cat ??
              selectedItem.category ??
              selectedItem.category_id ??
              selectedItem.cat_id;
            const categoryId = toNumber(rawCategoryId);
            const linkedCategory =
              categoryId > 0 ? categoryMap.get(categoryId) : undefined;

            let resolvedK = 0;

            if (linkedCategory) {
              resolvedK =
                toNumber(linkedCategory?.purity) ||
                toNumber((linkedCategory as any)?.cat_purity) ||
                toNumber(linkedCategory?.k) ||
                toNumber(linkedCategory?.gauge) ||
                toNumber((linkedCategory as any)?.carat);

              const resolvedBoxId = getCategoryBoxId(linkedCategory);

              // تحديث الصندوق تلقائياً عند تغيير الصنف (دائماً، حتى لو كان موجوداً)
              if (resolvedBoxId) {
                newDetail.box_id = resolvedBoxId;
              }
            }

            if (resolvedK <= 0) {
              resolvedK =
                toNumber(selectedItem.k) ||
                toNumber((selectedItem as any).item_k) ||
                toNumber((selectedItem as any).purity) ||
                toNumber((selectedItem as any).carat);
            }

            if (resolvedK > 0) {
              newDetail.k = resolvedK;
            }

            const itemWeight =
              toNumber(selectedItem.item_weight) ||
              toNumber(selectedItem.weight) ||
              toNumber((selectedItem as any).itemWeight);

            if (itemWeight > 0) {
              newDetail.weight = itemWeight;
            }

            const itemGoldWeight =
              toNumber((selectedItem as any).item_g_weight) ||
              toNumber(selectedItem.g_weight) ||
              toNumber((selectedItem as any).gWeight);

            if (itemGoldWeight > 0) {
              newDetail.g_weight = parseFloat(itemGoldWeight.toFixed(5));
            } else if (
              typeof newDetail.weight === "number" &&
              newDetail.weight > 0 &&
              typeof newDetail.k === "number" &&
              newDetail.k > 0
            ) {
              newDetail.g_weight = parseFloat(
                ((newDetail.weight * newDetail.k) / 875).toFixed(5),
              );
            } else {
              newDetail.g_weight = undefined;
            }
          }

          const weight =
            typeof newDetail.weight === "number"
              ? newDetail.weight
              : parseFloat(String(newDetail.weight || "0")) || 0;
          const k =
            typeof newDetail.k === "number"
              ? newDetail.k
              : parseFloat(String(newDetail.k || "0")) || 0;

          if (weight > 0 && k > 0) {
            const calculatedGWeight = (weight * k) / 875;

            newDetail.g_weight = parseFloat(calculatedGWeight.toFixed(5));
          } else if (!newDetail.g_weight) {
            newDetail.g_weight = undefined;
          }
        }

        return newDetail;
      });

      return updated;
    });
  };

  // Add voucher box row
  const addVoucherBoxRow = () => {
    setVoucherBoxes((prev) => [
      ...prev,
      {
        id: 0,
        vouch_id: voucher.id || 0,
        box_id: 0,
        amount: 0,
        vouch_notes: "",
        cost_id: null,
        inv_id: undefined,
        vat_no: undefined,
        tax_prc: undefined,
        tax: undefined,
        close_weight: undefined,
        cr_date: new Date().toISOString(),
      },
    ]);
  };

  // Remove voucher box row
  const removeVoucherBoxRow = (index: number) => {
    setVoucherBoxes((prev) => prev.filter((_, i) => i !== index));
  };

  // Add gold detail row
  const addGoldDetailRow = () => {
    setGoldDetails((prev) => [
      ...prev,
      {
        id: 0,
        vouch_id: voucher.vouch_id || 0,
        item_id: 0,
        k: undefined,
        weight: undefined,
        g_weight: undefined,
        weight2: undefined,
        g_weight2: undefined,
        box_id: undefined,
        notes: "",
        diff: undefined,
        close_amt: undefined,
        close_weight: undefined,
        inv_id: undefined,
        cost_id: undefined,
        work_amt: undefined,
        total_work: undefined,
        qty: undefined,
        cr_date: new Date().toISOString(),
      },
    ]);
  };

  // Remove gold detail row
  const removeGoldDetailRow = (index: number) => {
    setGoldDetails((prev) => prev.filter((_, i) => i !== index));
  };

  // Load item options with pagination
  const loadItemOptions = async (
    search: string,
    _loadedOptions: readonly any[] = [],
    additional: { page?: number } = { page: 1 },
  ) => {
    const trimmed = search.trim();
    const page = additional?.page || 1;

    try {
      // استخدام SearchItemsVoucherList للبحث في الأصناف المرتبطة بفئات نوعها كسر وصافي
      const result = await itemService.searchItemsVoucherList({
        query: trimmed || "0", // "0" للحصول على جميع الأصناف، أو نص البحث
        page,
        companyId: 1,
      });

      if (!result || !result.results) {
        return {
          options: [],
          hasMore: false,
          additional: { page: 1 },
        };
      }

      const normalizedResults = result.results.map((item: any) => ({
        id: Number(item.id ?? 0),
        item_code: item.item_code ?? item.code ?? String(item.id ?? ""),
        item_name: item.item_name ?? item.name ?? "",
        item_price: item.item_price ?? item.price ?? 0,
        item_weight: item.item_weight ?? item.weight ?? 0,
        item_g_weight:
          item.item_g_weight ?? item.g_weight ?? item.item_weight ?? 0,
        work_price: item.work_price ?? item.price_w ?? 0,
        purity: item.purity ?? item.k ?? "",
        stones: item.stones ?? item.stone ?? null,
        cat: item.cat ?? undefined,
        k: item.k ?? undefined,
      }));

      // تحديث items في state
      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const additions = normalizedResults.filter(
          (item) => !existingIds.has(item.id),
        );

        return additions.length > 0 ? [...prev, ...additions] : prev;
      });

      const term = trimmed.toLowerCase();
      const options = normalizedResults
        .map((item: any) => {
          const itemCode = String(item.item_code ?? "").toLowerCase();
          const itemName = String(item.item_name ?? "").toLowerCase();
          const codeMatch = itemCode.indexOf(term);
          const nameMatch = itemName.indexOf(term);

          return {
            value: item.id,
            label: `${item.item_code || ""} - ${item.item_name || ""}`,
            item: item,
            codeMatch,
            nameMatch,
          };
        })
        .filter((entry) => entry.codeMatch !== -1 || entry.nameMatch !== -1)
        .sort((a, b) => {
          const aCode = a.codeMatch === -1 ? Infinity : a.codeMatch;
          const bCode = b.codeMatch === -1 ? Infinity : b.codeMatch;

          if (aCode !== bCode) return aCode - bCode;
          const aName = a.nameMatch === -1 ? Infinity : a.nameMatch;
          const bName = b.nameMatch === -1 ? Infinity : b.nameMatch;

          return aName - bName;
        })
        .map(({ value, label, item }) => ({ value, label, item }));

      return options;
    } catch (e) {
      console.error("Error loading item options:", e);

      return [];
    }
  };

  // Load customer options with search
  const loadCustomerOptions = async (search: string = ""): Promise<any[]> => {
    try {
      // استخدام customers من state أو initialCustomers
      let allCustomers =
        customers.length > 0 ? customers : initialCustomers || [];

      // إذا كانت القائمة فارغة، جلب من API
      if (allCustomers.length === 0) {
        const apiCustomers = await customerService.getAllCustomers({
          xcom_id: 1,
        });

        if (Array.isArray(apiCustomers) && apiCustomers.length > 0) {
          allCustomers = apiCustomers;
          setCustomers(apiCustomers);
        }
      }

      // فلترة العملاء بناءً على البحث
      const term = search.trim().toLowerCase();
      const filteredCustomers = term
        ? allCustomers.filter((customer: any) => {
          const custCode = String(customer.cust_code ?? "").toLowerCase();
          const custName = String(customer.cust_name ?? "").toLowerCase();

          return custCode.includes(term) || custName.includes(term);
        })
        : allCustomers;

      // تحويل العملاء إلى خيارات
      const options = filteredCustomers.map((customer: any) => ({
        value: customer.id,
        label: `${customer.cust_code || ""} - ${customer.cust_name || ""}`,
        customer: customer,
      }));

      return options;
    } catch (e) {
      console.error("Error loading customer options:", e);

      return [];
    }
  };

  // Get customer select value
  const getCustomerSelectValue = () => {
    if (selectedCustomer) {
      return {
        value: selectedCustomer.id,
        label: `${selectedCustomer.cust_code || ""} - ${selectedCustomer.cust_name || ""}`,
      };
    }
    if (voucher.cust_id) {
      const customer = customers.find((c) => c.id === voucher.cust_id);

      if (customer) {
        return {
          value: customer.id,
          label: `${customer.cust_code || ""} - ${customer.cust_name || ""}`,
        };
      }
    }

    return null;
  };

  // Get item select value
  const getItemSelectValue = (goldDetail: GVoucherDetail) => {
    if (!goldDetail.item_id) return null;
    if (goldDetail.item_code && goldDetail.item_name) {
      return {
        value: goldDetail.item_id,
        label: `${goldDetail.item_code} - ${goldDetail.item_name}`,
      };
    }
    const item = items.find((itm) => itm.id === goldDetail.item_id);

    if (item) {
      return {
        value: goldDetail.item_id,
        label: `${item.item_code ?? ""} - ${item.item_name ?? ""}`,
      };
    }

    return null;
  };

  // Helper functions for box and cost center select (must be before any early return)
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

  const goldBoxSelectOptions = useMemo(() => {
    return (goldBoxOptions || []).map((box) => ({
      value: String(box.id),
      label: box.cust_name || box.name || box.box_name || `صندوق ${box.id}`,
    }));
  }, [goldBoxOptions]);

  const cashBoxSelectOptions = useMemo(() => {
    return (boxes || []).map((box) => ({
      value: String(box.id),
      label: box.cust_name || box.name || box.box_name || `صندوق ${box.id}`,
    }));
  }, [boxes]);

  // Ref للحقول العلوية للتنقل
  const selectorsRef = useRef<HTMLDivElement>(null);

  // Hook for Enter key navigation in top form fields
  const {
    handleKeyDown: handleKeyDownSelectors,
    handleF4KeyForSelect,
  } = useKeyAsTab({
    keys: ["Enter"],
    containerRef: selectorsRef,
    disabled: !isEditing,
    focusableSelector: 'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), [role="combobox"]',
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
        if (isExpanded) {
          return true; // Allow normal interaction when open
        }

        // إذا كانت القائمة مغلقة، نسمح بالتنقل
        return false; // Allow navigation when closed
      }

      return false;
    },
    onBoundaryFocus: (direction) => {
      // عندما نصل لنهاية الحقول العلوية (بعد مركز التكلفة)، ننتقل لجدول الذهب
      if (direction === 1) {
        const currentElement = document.activeElement as HTMLElement;
        const isInSelectors = selectorsRef.current?.contains(currentElement);

        if (isInSelectors) {
          // التحقق من أننا في آخر حقل (مركز التكلفة)
          // نعتمد على الترتيب في DOM
          const allFocusable = Array.from(
            selectorsRef.current?.querySelectorAll(
              'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), [role="combobox"]',
            ) || [],
          ) as HTMLElement[];

          const currentIndex = allFocusable.indexOf(currentElement);

          // إذا لم نجد العنصر أو كان هو الأخير
          if (currentIndex === -1 || currentIndex === allFocusable.length - 1) {
            // ✅ إضافة صف جديد إذا لم يكن موجوداً
            if (goldDetails.length === 0) {
              addGoldDetailRow();
            }

            // ✅ الانتقال إلى أول حقل في جدول الذهب (حقل رقم الصنف)
            // استخدام polling لضمان العثور على العنصر بعد الريندر
            const focusToItemField = (attempt = 1) => {
              // محاولة العثور على الwrapper
              const wrapper = document.getElementById('item-select-wrapper-0');
              if (wrapper) {
                const input = wrapper.querySelector('input');
                if (input) {
                  input.focus();
                  // التأكد من أن التركيز نجح
                  if (document.activeElement === input) {
                    return true;
                  }
                }
                // محاولة العثور على combobox
                const combobox = wrapper.querySelector('[role="combobox"]') as HTMLElement;
                if (combobox) {
                  combobox.focus();
                  return true;
                }
              }

              // إذا لم نجد العنصر أو لم ينجح التركيز، نعيد المحاولة
              if (attempt < 20) { // المحاولة لمدة 1 ثانية تقريباً (20 * 50ms)
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
      if (colIndex === 3 && (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey))) {
        event.preventDefault();
        event.stopPropagation();

        const focusBox = () => {
          const wrapper = document.getElementById(`gold-box-wrapper-${rowIndex}`);
          if (wrapper) {
            // محاولة العثور على input أو combobox
            const input = wrapper.querySelector('input');
            if (input) {
              input.focus();
              return;
            }
            const combobox = wrapper.querySelector('[role="combobox"]') as HTMLElement;
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
      if (colIndex === 0 && (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey))) {
        event.preventDefault();
        event.stopPropagation();

        const focusBox = () => {
          const wrapper = document.getElementById(`cash-box-wrapper-${rowIndex}`);
          if (wrapper) {
            // محاولة العثور على input أو combobox
            const input = wrapper.querySelector('input');
            if (input) {
              input.focus();
              return;
            }
            const combobox = wrapper.querySelector('[role="combobox"]') as HTMLElement;
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

  // دالة البحث في الأصناف (خارج map لتجنب loop)
  // استخدام useRef لتخزين loadItemOptions لتجنب إعادة الإنشاء
  const loadItemOptionsRef = useRef(loadItemOptions);

  // تحديث refs عند تغيير الدوال
  useEffect(() => {
    loadItemOptionsRef.current = loadItemOptions;
  }, [loadItemOptions]);

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
        if (Array.isArray(results) && results.length > 0) {
          hasMoreRef.current = true;
          setItemsHasMore(true);
        } else {
          hasMoreRef.current = false;
          setItemsHasMore(false);
        }

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
      if (Array.isArray(results) && results.length > 0) {
        hasMoreRef.current = true;
        setItemsHasMore(true);
      } else {
        hasMoreRef.current = false;
        setItemsHasMore(false);
      }

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
        const results = await loadItemOptionsRef.current(searchTerm, [], {
          page,
        });

        // التحقق من وجود صفحات إضافية
        if (Array.isArray(results) && results.length > 0) {
          hasMoreRef.current = true;
          setItemsHasMore(true);
        } else {
          hasMoreRef.current = false;
          setItemsHasMore(false);
        }
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

  // Calculate totals
  const totals = useMemo(() => {
    const totalBoxes = voucherBoxes.reduce(
      (sum, box) => sum + (box.amount || 0),
      0,
    );

    const totalGoldWeight = goldDetails.reduce(
      (sum, detail) => sum + (detail.weight || 0),
      0,
    );

    const totalGoldGWeight = goldDetails.reduce(
      (sum, detail) => sum + (detail.g_weight || 0),
      0,
    );

    return { totalBoxes, totalGoldWeight, totalGoldGWeight };
  }, [voucherBoxes, goldDetails]);

  const isBalanced = useMemo(() => {
    const goldDiff = Math.abs(
      (totals.totalGoldWeight || 0) - (totals.totalGoldGWeight || 0),
    );
    const cashDiff = Math.abs(
      (totals.totalBoxes || 0) - Number(voucher.vouch_amt ?? 0),
    );

    return goldDiff < 0.00001 && cashDiff < 0.01;
  }, [totals.totalGoldWeight, totals.totalGoldGWeight, totals.totalBoxes, voucher.vouch_amt]);

  // Save voucher
  const saveVoucher = async () => {
    // التحقق من التاريخ
    const voucherDate = new Date(voucher.vouch_date);
    const today = new Date();

    today.setHours(23, 59, 59, 999);

    if (voucherDate > today) {
      toast.error("لا يمكن إنشاء قيد بتاريخ أكبر من تاريخ اليوم");

      return;
    }

    // التحقق من العميل
    if (!voucher.cust_id || voucher.cust_id === 0) {
      toast.error(t("messages.selectCustomer"));

      return;
    }

    // التحقق من وجود صناديق صالحة
    const validBoxes = voucherBoxes.filter(
      (box) => box.box_id && box.box_id > 0 && box.amount && box.amount > 0,
    );

    if (validBoxes.length === 0) {
      toast.error("يرجى إدخال صندوق واحد على الأقل");

      return;
    }

    setIsLoading(true);

    try {
      // التأكد من وجود cust_id من voucher أو selectedCustomer
      const custId = voucher.cust_id || selectedCustomer?.id || null;

      if (!custId || custId === 0) {
        toast.error(t("messages.selectCustomer"));

        return;
      }

      const voucherData = {
        vouch_id: voucher.vouch_id,
        vouch_date: voucher.vouch_date,
        vouch_type: vouchType,
        vouch_amt: 0,
        vouch_notes: voucher.vouch_notes || "",
        vouch_status: voucher.vouch_status || 1,
        pay_type: voucher.pay_type,
        ref_no: voucher.ref_no || "",
        opps_vouch: voucher.opps_vouch || 0,
        cust_id: custId, // استخدام custId الذي تأكدنا من وجوده
        handling: voucher.handling || null,
        cost_id: voucher.cost_id || null,
      };

      // تحضير بيانات الصناديق
      const boxesData = validBoxes.map((box) => ({
        id: box.id || 0,
        box_id: box.box_id,
        amount: box.amount,
        vouch_notes: box.vouch_notes || "",
        cost_id: box.cost_id || null,
        inv_id: box.inv_id || null,
        close_weight: box.close_weight || undefined,
      }));

      // تحضير بيانات الذهب
      const validGoldDetails = goldDetails.filter(
        (detail) => detail.item_id && detail.item_id > 0,
      );

      const goldDetailsData = validGoldDetails.map((detail) => ({
        id: detail.id || 0,
        item_id: detail.item_id,
        k: detail.k || undefined,
        weight: detail.weight || undefined,
        g_weight: detail.g_weight || undefined,
        weight2: detail.weight2 || undefined,
        g_weight2: detail.g_weight2 || undefined,
        box_id: detail.box_id || undefined,
        notes: detail.notes || "",
        diff: detail.diff || undefined,
        close_amt: detail.close_amt || undefined,
        close_weight: detail.close_weight || undefined,
        inv_id: detail.inv_id || undefined,
        cost_id: detail.cost_id || undefined,
        work_amt: detail.work_amt || undefined,
        total_work: detail.total_work || undefined,
        qty: detail.qty || undefined,
      }));

      // تحديد الصناديق والذهب المحذوفة
      const currentBoxIds = boxesData.map((b) => b.id).filter((id) => id > 0);
      const originalBoxIds = originalBoxes
        .map((b) => b.id)
        .filter((id) => id && id > 0) as number[];
      const deletedBoxIds = originalBoxIds.filter(
        (id) => !currentBoxIds.includes(id),
      );

      const currentGoldDetailIds = goldDetailsData
        .map((d) => d.id)
        .filter((id) => id > 0);
      const originalGoldDetailIds = originalGoldDetails
        .map((d) => d.id)
        .filter((id) => id && id > 0) as number[];
      const deletedGoldDetailIds = originalGoldDetailIds.filter(
        (id) => !currentGoldDetailIds.includes(id),
      );

      // Dynamic import for server actions to avoid bundling in client
      const { createVoucherAction, updateVoucherAction } = await import(
        "@/app/actions/voucher.action"
      );

      const result =
        formMode === "edit"
          ? await updateVoucherAction(
            voucherData,
            [],
            [],
            voucherRecordId as number | undefined,
            boxesData,
            deletedBoxIds,
            goldDetailsData,
            deletedGoldDetailIds,
          )
          : await createVoucherAction(
            voucherData,
            [],
            boxesData,
            goldDetailsData,
          );

      if (result.success && result.data) {
        const realId = result.data.id;

        setVoucher((prev) => ({
          ...prev,
          commit: true,
          id: realId,
          vouch_id: result.data.vouch_id || voucher.vouch_id,
        }));

        toast.success(result.message);

        // التوجيه إلى preview mode
        const basePath =
          vouchType === 4 ? "/forms/gvoucher4" : "/forms/gvoucher5";

        if (realId) {
          router.push(`${basePath}/${realId}?mode=preview`);
        }
      } else {
        toast.error(result.message || t("messages.saveError"));
      }
    } catch (error) {
      console.error("Error saving voucher:", error);
      toast.error(t("messages.saveError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Print voucher
  const printVoucher = async () => {
    setIsPrinting(true);
    try {
      const printWindow = window.open("", "_blank");

      if (printWindow) {
        // تنسيق التاريخ
        const formattedDate = voucher.vouch_date
          ? new Date(voucher.vouch_date).toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
          : "";

        // فلترة البيانات الصالحة
        const validBoxes = voucherBoxes.filter(
          (b) => b.box_id && b.box_id > 0 && b.amount && b.amount > 0,
        );
        const validGoldDetails = goldDetails.filter(
          (d) => d.item_id && d.item_id > 0,
        );

        // Helper functions
        const getBoxName = (boxId: number, boxObject?: VoucherBox["box"]) => {
          // استخدام box object إذا كان متوفراً (من حقل box في voucher_box)
          if (boxObject && boxObject.cust_name) {
            return boxObject.cust_name;
          }
          // البحث في قائمة الصناديق
          const box = goldBoxOptions.find((b) => b.id === boxId);

          return box?.cust_name || box?.name || `صندوق ${boxId}`;
        };

        const getCostCenterName = (costId: number | null | undefined) => {
          if (!costId || costId === 0) return "-";
          const center = costCenters.find((c) => c.id === costId);

          return center?.name || center?.cost_name || `مركز ${costId}`;
        };

        const getCustomerName = () => {
          if (selectedCustomer) {
            return selectedCustomer.cust_name || "";
          }
          if (voucher.cust_id) {
            const customer = customers.find((c) => c.id === voucher.cust_id);

            return customer?.cust_name || "";
          }

          return "-";
        };

        // تحديد نوع السند
        const voucherTypeName =
          vouchType === 4 ? t("title.receipt") : t("title.payment");

        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <meta charset="UTF-8">
              <title>${voucherTypeName} - ${voucher.vouch_id}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
                
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                body {
                  font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
                  font-size: 13px;
                  line-height: 1.6;
                  color: #2d3748;
                  background: #ffffff;
                  padding: 40px 30px;
                }
                
                .header {
                  text-align: center;
                  margin-bottom: 35px;
                  padding-bottom: 25px;
                  border-bottom: 3px solid #e2e8f0;
                }
                
                .header h1 {
                  font-size: 28px;
                  font-weight: 700;
                  color: #1a202c;
                  margin-bottom: 15px;
                  letter-spacing: 0.5px;
                }
                
                .header-info {
                  display: flex;
                  justify-content: center;
                  gap: 40px;
                  margin-top: 15px;
                  flex-wrap: wrap;
                }
                
                .header-info-item {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 5px;
                }
                
                .header-info-label {
                  font-size: 11px;
                  color: #718096;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                
                .header-info-value {
                  font-size: 15px;
                  color: #2d3748;
                  font-weight: 600;
                }
                
                .voucher-notes {
                  margin-top: 20px;
                  padding: 12px 20px;
                  background: #f7fafc;
                  border-right: 4px solid #4299e1;
                  border-radius: 6px;
                  font-size: 13px;
                  color: #4a5568;
                }
                
                .customer-info {
                  margin-top: 15px;
                  padding: 10px 20px;
                  background: #fef3c7;
                  border-right: 4px solid #f59e0b;
                  border-radius: 6px;
                  font-size: 13px;
                  color: #92400e;
                }
                
                .table-section {
                  margin: 25px 0;
                }
                
                .table-section-title {
                  font-size: 16px;
                  font-weight: 600;
                  color: #2d3748;
                  margin-bottom: 15px;
                  padding-bottom: 8px;
                  border-bottom: 2px solid #e2e8f0;
                }
                
                table {
                  width: 100%;
                  border-collapse: separate;
                  border-spacing: 0;
                  margin: 15px 0;
                  background: #ffffff;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                }
                
                thead {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                
                th {
                  padding: 14px 10px;
                  text-align: center;
                  font-weight: 600;
                  font-size: 12px;
                  color: #ffffff;
                  text-transform: uppercase;
                  letter-spacing: 0.3px;
                  border: none;
                  white-space: nowrap;
                }
                
                tbody tr {
                  transition: background-color 0.2s;
                }
                
                tbody tr:nth-child(even) {
                  background-color: #f8fafc;
                }
                
                tbody tr:hover {
                  background-color: #edf2f7;
                }
                
                td {
                  padding: 12px 10px;
                  text-align: center;
                  border-bottom: 1px solid #e2e8f0;
                  border-left: 1px solid #e2e8f0;
                  font-size: 12.5px;
                  color: #4a5568;
                }
                
                td:first-child {
                  border-right: none;
                }
                
                .item-code {
                  font-weight: 600;
                  color: #2d3748;
                  font-family: 'Courier New', monospace;
                }
                
                .item-name {
                  text-align: right;
                  color: #4a5568;
                }
                
                .account-code {
                  font-weight: 600;
                  color: #2d3748;
                  font-family: 'Courier New', monospace;
                }
                
                .account-name {
                  text-align: right;
                  color: #4a5568;
                }
                
                .amount {
                  font-family: 'Courier New', monospace;
                  font-weight: 500;
                  color: #2d3748;
                }
                
                .amount-cash {
                  color: #059669;
                  font-weight: 600;
                }
                
                .amount-gold {
                  color: #d97706;
                  font-weight: 600;
                }
                
                .totals {
                  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                  font-weight: 700;
                  border-top: 2px solid #f59e0b;
                  border-bottom: 2px solid #f59e0b;
                }
                
                .totals td {
                  padding: 16px 10px;
                  font-size: 13.5px;
                  color: #92400e;
                  border: none;
                }
                
                .totals td:first-child {
                  font-size: 14px;
                  text-align: right;
                  padding-right: 20px;
                }
                
                .balance-status {
                  margin-top: 25px;
                  padding: 15px 20px;
                  background: ${isBalanced ? "#d1fae5" : "#fee2e2"};
                  border: 2px solid ${isBalanced ? "#10b981" : "#ef4444"};
                  border-radius: 8px;
                  text-align: center;
                  font-weight: 600;
                  font-size: 14px;
                  color: ${isBalanced ? "#065f46" : "#991b1b"};
                }
                
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 2px solid #e2e8f0;
                  text-align: center;
                  color: #718096;
                  font-size: 11px;
                }
                
                @media print {
                  body {
                    padding: 20px 15px;
                  }
                  
                  .header {
                    margin-bottom: 25px;
                    padding-bottom: 20px;
                  }
                  
                  table {
                    margin: 20px 0;
                  }
                  
                  tbody tr:hover {
                    background-color: inherit;
                  }
                  
                  @page {
                    margin: 1cm;
                    size: A4;
                  }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${voucherTypeName}</h1>
                <div class="header-info">
                  <div class="header-info-item">
                    <span class="header-info-label">${t("fields.refNo")}</span>
                    <span class="header-info-value">${voucher.vouch_id || "-"}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">${t("fields.dateTime")}</span>
                    <span class="header-info-value">${formattedDate}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">${t("fields.customer")}</span>
                    <span class="header-info-value">${getCustomerName()}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">${t("tables.gold.title")}</span>
                    <span class="header-info-value">${validGoldDetails.length}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">${t("tables.cash.title")}</span>
                    <span class="header-info-value">${validBoxes.length}</span>
                  </div>
                </div>
                ${voucher.vouch_notes
            ? `
                <div class="voucher-notes">
                  <strong>${t("fields.notes")}:</strong> ${voucher.vouch_notes}
                </div>
                `
            : ""
          }
              </div>
              
              <!-- جدول الذهب -->
              <div class="table-section">
                <div class="table-section-title">${t("tables.gold.title")}</div>
                <table>
                  <thead>
                    <tr>
                      <th>${t("tables.gold.columns.itemNumber")}</th>
                      <th>${t("tables.gold.columns.itemName") || "اسم الصنف"}</th>
                      <th>${t("tables.gold.columns.calibration")}</th>
                      <th>${t("tables.gold.columns.weight")}</th>
                      <th>${t("tables.gold.columns.calibratedWeight")}</th>
                      <th>${t("tables.gold.columns.box")}</th>
                      <th>${t("tables.gold.columns.notes")}</th>
                      <th>${t("tables.gold.columns.caliberDifference")}</th>
                      <th>${t("tables.gold.columns.sealingAmount")}</th>
                      <th>${t("tables.gold.columns.invoiceNumber")}</th>
                      <th>${t("tables.gold.columns.costCenter")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${validGoldDetails
            .map((detail) => {
              const item = items.find(
                (itm) => itm.id === detail.item_id,
              );
              const boxName = detail.box_id
                ? getBoxName(detail.box_id)
                : "-";
              const costName = getCostCenterName(detail.cost_id);

              return `
                        <tr>
                          <td class="item-code">${detail.item_code || item?.item_code || "-"}</td>
                          <td class="item-name">${detail.item_name || item?.item_name || "-"}</td>
                          <td>${detail.k || "-"}</td>
                          <td class="amount amount-gold">${detail.weight ? detail.weight.toFixed(5) : "-"}</td>
                          <td class="amount amount-gold">${detail.g_weight ? detail.g_weight.toFixed(5) : "-"}</td>
                          <td style="text-align: right;">${boxName}</td>
                          <td style="text-align: right; font-size: 11px; color: #718096;">${detail.notes || "-"}</td>
                          <td>${detail.diff || "-"}</td>
                          <td class="amount">${detail.close_amt ? formatAmount(detail.close_amt) : "-"}</td>
                          <td>${detail.inv_id || "-"}</td>
                          <td style="text-align: right; font-size: 11px;">${costName}</td>
                        </tr>
                      `;
            })
            .join("")}
                    <tr class="totals">
                      <td colspan="3" style="text-align: right; padding-right: 20px; font-weight: 700;">${t("print.totalGold")}</td>
                      <td class="amount amount-gold">${totals.totalGoldWeight.toFixed(5)}</td>
                      <td class="amount amount-gold">${totals.totalGoldGWeight.toFixed(5)}</td>
                      <td colspan="7"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- جدول النقدية -->
              <div class="table-section">
                <div class="table-section-title">${t("tables.cash.title")}</div>
                <table>
                  <thead>
                    <tr>
                      <th>${t("tables.cash.columns.amount")}</th>
                      <th>${t("tables.cash.columns.box")}</th>
                      <th>${t("tables.cash.columns.notes")}</th>
                      <th>${t("tables.cash.columns.invoiceNumber")}</th>
                      <th>${t("tables.cash.columns.costCenter")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${validBoxes
            .map((box) => {
              const boxName = getBoxName(box.box_id, box.box);
              const costName = getCostCenterName(box.cost_id);

              return `
                        <tr>
                          <td class="amount amount-cash">${formatAmount(box.amount || 0)}</td>
                          <td style="text-align: right;">${boxName}</td>
                          <td style="text-align: right; font-size: 11px; color: #718096;">${box.vouch_notes || "-"}</td>
                          <td>${box.inv_id || "-"}</td>
                          <td style="text-align: right; font-size: 11px;">${costName}</td>
                        </tr>
                      `;
            })
            .join("")}
                    <tr class="totals">
                      <td class="amount amount-cash">${formatAmount(totals.totalBoxes)}</td>
                      <td colspan="4" style="text-align: right; padding-right: 20px; font-weight: 700;">${t("totals.totalCash")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              
              <div class="footer">
                <p>تم طباعة هذا السند بتاريخ ${new Date().toLocaleDateString("ar-SA")} - ${tCommon("systemName")}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        setIsPrinting(false);
        setVoucher((prev) => ({ ...prev, print: true }));
      }
    } catch (error) {
      toast.error(
        `${t("messages.printError")}: ${error instanceof Error ? error.message : t("messages.searchError")}`,
      );
      setIsPrinting(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim() === "") {
      toast.error(t("messages.searchErrorMissing"));

      return;
    }

    const searchValue = searchTerm.trim();

    try {
      // البحث في السندات بنفس النوع (4 أو 5)
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: vouchType.toString(),
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
            const basePath =
              vouchType === 4 ? "/forms/gvoucher4" : "/forms/gvoucher5";

            router.push(`${basePath}/${targetId}?mode=preview`);
            setSearchTerm("");

            return;
          }
        }
      }

      // إذا لم نجد في السندات من نفس النوع، نبحث في جميع أنواع السندات
      const allVouchersResponse = await voucherService.getAll({
        xvouch_type: "0",
        xvouch_id: searchValue,
        xcom_id: "1",
        xyear_id: "0",
      });

      if (allVouchersResponse.success && allVouchersResponse.data) {
        const allVouchers = Array.isArray(allVouchersResponse.data)
          ? allVouchersResponse.data
          : [];

        const foundAny = allVouchers.find(
          (v: any) =>
            v.vouch_id?.toString() === searchValue ||
            v.id?.toString() === searchValue,
        );

        if (foundAny) {
          if (foundAny.vouch_type !== vouchType) {
            const voucherTypeName =
              vouchType === 4 ? t("title.receipt") : t("title.payment");

            toast.error(
              `السند الموجود (${foundAny.vouch_id}) ليس من نوع ${voucherTypeName}`,
            );

            return;
          }

          const targetId = foundAny.id || foundAny.vouch_id;

          if (targetId) {
            const basePath =
              vouchType === 4 ? "/forms/gvoucher4" : "/forms/gvoucher5";

            router.push(`${basePath}/${targetId}?mode=preview`);
            setSearchTerm("");

            return;
          }
        }
      }

      const voucherTypeName = vouchType === 4 ? t("title.receipt") : t("title.payment");

      toast.error(t("messages.notFound", { type: voucherTypeName, number: searchValue }));
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

    if (pathname && voucherRecordId) {
      const basePath =
        vouchType === 4 ? "/forms/gvoucher4" : "/forms/gvoucher5";

      router.push(`${basePath}/${voucherRecordId}?mode=edit`);
    }
  };

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
    voucherTypes.find((t) => (t.Id || t.id) === vouchType)?.name ||
    (vouchType === 4 ? t("title.receipt") : t("title.payment"));

  return (
    <div className="p-1 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-1.5 mb-1 border border-slate-200">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>{voucherTypeName}</span>
              <span className="text-slate-600 font-medium">
                #
                {hasVoucherId ? voucher.vouch_id : t("messages.numbering")}
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
              حفظ
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

            {/* زر "جديد" */}
            <Button
              className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
              startContent={<PlusIcon className="w-4 h-4" />}
              variant="solid"
              onPress={() => {
                const newPath =
                  vouchType === 4 ? "/forms/gvoucher4" : "/forms/gvoucher5";

                router.push(newPath);
              }}
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
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <Checkbox
                color="success"
                isDisabled
                isSelected={voucher.commit}
                size="sm"
              />
              <span className="text-xs text-slate-600">{t("status.saved")}</span>
            </div>

            <div className="flex items-center gap-1">
              <Checkbox
                color="warning"
                isDisabled
                isSelected={voucher.post}
                size="sm"
              />
              <span className="text-xs text-slate-600">{t("status.posted")}</span>
            </div>

            <div className="flex items-center gap-1">
              <Checkbox
                color="warning"
                isDisabled
                isSelected={voucher.print}
                size="sm"
              />
              <span className="text-xs text-slate-600">{t("status.printed")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields - Row 1 & Row 2 */}
      <div
        ref={selectorsRef}
        onKeyDownCapture={handleKeyDownSelectors}
      >
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 mb-1.5">
          {/* رقم المرجع - أضيق */}
          <div className="md:col-span-2">
            <label
              className="block text-xs font-medium text-slate-700 mb-0.5"
              htmlFor="gold-ref-no"
            >
              {t("fields.refNo")}
            </label>
            <input
              ref={refNoInputRef}
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
              disabled={!isEditing}
              id="gold-ref-no"
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
              htmlFor="gold-datetime"
            >
              {t("fields.dateTime")}
            </label>
            <input
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
              disabled={!isEditing}
              id="gold-datetime"
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
              htmlFor="gold-notes"
            >
              {t("fields.notes")}
            </label>
            <div className="relative">
              <input
                className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 pr-8"
                disabled={!isEditing}
                id="gold-notes"
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

        {/* Row 2: العميل، مناولة، مركز التكلفة */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 mb-1.5">
          {/* العميل */}
          <div className="md:col-span-4">
            <label
              className="block text-xs font-medium text-slate-700 mb-0.5"
              htmlFor="gold-customer-select"
            >
              العميل
            </label>
            <div
              id="gold-customer-select"
              onKeyDownCapture={(e) => {
                // معالجة F4 لفتح/إغلاق القائمة باستخدام الدالة العامة
                if (handleF4KeyForSelect(e)) {
                  return;
                }

                const target = e.target as HTMLElement;
                const selectButton = target.closest('[role="combobox"]');
                const isInListbox = target.closest('[role="listbox"]');

                if (isInListbox) return;
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
                  if (e.key === "Escape") return;
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
                inputId="gold-customer-select"
                instanceId="gold-customer-select"
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
                        const handlingInput = document.querySelector(
                          'input[placeholder*="مناولة"]',
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
              htmlFor="gold-handling"
            >
              مناولة
            </label>
            <input
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
              disabled={!isEditing}
              id="gold-handling"
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

                  // البحث عن حقل مركز التكلفة - نفس الطريقة المستخدمة في VoucherClientPage
                  const focusToCostCenterSelect = (): boolean => {
                    try {
                      const costCenterSelectId = `#customer-cost-center-select`;
                      let costCenterSelect = document.querySelector(costCenterSelectId);

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
                          `#customer-cost-center-select [role="combobox"]`,
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

                  return;
                }
              }}
            />
          </div>

          {/* مركز التكلفة */}
          <div className="md:col-span-5">
            <label
              className="block text-xs font-medium text-slate-700 mb-0.5"
              htmlFor="gold-cost-center-select"
            >
              مركز التكلفة
            </label>
            <div
              id="customer-cost-center-select"
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
                      const wrapper = document.getElementById('item-select-wrapper-0');
                      if (wrapper) {
                        const input = wrapper.querySelector('input');
                        if (input) {
                          input.focus();
                          // التأكد من أن التركيز نجح
                          if (document.activeElement === input) {
                            return;
                          }
                        }
                        // محاولة العثور على combobox
                        const combobox = wrapper.querySelector('[role="combobox"]') as HTMLElement;
                        if (combobox) {
                          combobox.focus();
                          return;
                        }
                      }

                      // إذا لم نجد العنصر أو لم ينجح التركيز، نعيد المحاولة
                      if (attempt < 20) { // المحاولة لمدة 1 ثانية تقريباً (20 * 50ms)
                        setTimeout(() => focusToItemField(attempt + 1), 50);
                      }
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
                inputId="customer-cost-center-select"
                instanceId="customer-cost-center-select"
                isDisabled={!isEditing || costCenters.length === 0}
                menuPortalTarget={
                  typeof window !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                options={costCenterSelectOptions}
                placeholder={t("placeholders.selectCostCenter")}
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
                            const allComboboxes = document.querySelectorAll(
                              '[role="combobox"]',
                            );
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
      </div>

      {/* Gold Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-1.5">
        <div className="p-1 border-b border-slate-200 bg-slate-50">
          <h3 className={`text-xs font-semibold text-slate-800 ${textAlign}`}>{t("tables.gold.title")}</h3>
        </div>
        <div className="p-0.5">
          <div className="flex justify-between mb-0.5">
            <button
              className="btn text-xs px-2 py-0.5"
              disabled={!isEditing}
              type="button"
              onClick={addGoldDetailRow}
            >
              {t("tables.gold.addRow")}
            </button>
          </div>
          <div className="overflow-x-auto overflow-y-auto mb-0.5 max-w-full max-h-[200px]">
            <table className="min-w-[1000px] border text-xs text-center table-fixed">
              <thead className="bg-gray-100 text-xs font-bold">
                <tr>
                  <th className={`w-72 p-1 border ${textAlignCenter}`}>{t("tables.gold.columns.itemNumber")}</th>
                  <th className={`w-32 p-1 border ${textAlignCenter}`}>{t("tables.gold.columns.weight")}</th>
                  <th className={`w-32 p-1 border ${textAlignCenter}`}>{t("tables.gold.columns.calibration")}</th>
                  <th className={`w-32 p-1 border ${textAlignCenter}`}>{t("tables.gold.columns.calibratedWeight")}</th>
                  <th className={`w-48 p-1 border ${textAlignCenter}`}>{t("tables.gold.columns.box")}</th>
                  <th className={`w-80 p-1 border ${textAlignCenter}`}>{t("tables.gold.columns.notes")}</th>
                  <th className={`w-32 p-1 border ${textAlignCenter}`}>{t("tables.gold.columns.caliberDifference")}</th>
                  <th className={`w-32 p-1 border ${textAlignCenter}`}>{t("tables.gold.columns.sealingAmount")}</th>
                  <th className={`w-32 p-1 border ${textAlignCenter}`}>{t("tables.gold.columns.sealingWeight")}</th>
                  <th className={`w-32 p-1 border ${textAlignCenter}`}>{t("tables.gold.columns.invoiceNumber")}</th>
                  <th className={`w-48 p-1 border ${textAlignCenter}`}>{t("tables.gold.columns.costCenter")}</th>
                  <th className={`w-12 p-1 border ${textAlignCenter}`}>{t("tables.gold.columns.delete")}</th>
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

                                  return Array.isArray(results) ? results : [];
                                } catch (error) {
                                  console.error("Error loading items:", error);

                                  return [];
                                }
                              }}
                              menuPortalTarget={
                                typeof window !== "undefined"
                                  ? document.body
                                  : null
                              }
                              menuPosition="fixed"
                              placeholder={t("tables.gold.placeholders.selectItem")}
                              styles={{
                                control: (base) => ({
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
                        data-col={1}
                        data-row={index}
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
                        data-col={2}
                        data-row={index}
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
                        data-col={3}
                        data-row={index}
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
                    <td className="p-0 border">
                      {(() => {
                        const thisCol = 4;
                        const boxValue =
                          detail.box_id && detail.box_id > 0
                            ? goldBoxSelectOptions.find(
                              (opt) => opt.value === String(detail.box_id),
                            )
                            : null;
                        const selectedBoxValue = boxValue
                          ? typeof boxValue === "object"
                            ? boxValue.value
                            : boxValue
                          : null;

                        return (
                          <div
                            id={`gold-box-wrapper-${index}`}
                            ref={setGoldInputRef(index, thisCol)}
                            data-gold-col={4}
                            data-gold-row={index}
                            data-col={4}
                            data-row={index}
                            className="h-full"
                          >
                            <ReactSelect
                              isSearchable
                              className="text-xs"
                              classNamePrefix="react-select"
                              components={{ IndicatorSeparator: () => null }}
                              instanceId={`gold-box-select-${index}`}
                              isDisabled={!isEditing || goldBoxSelectOptions.length === 0}
                              menuPortalTarget={
                                typeof window !== "undefined"
                                  ? document.body
                                  : null
                              }
                              menuPosition="fixed"
                              options={goldBoxSelectOptions}
                              placeholder="اختر الصندوق..."
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "32px",
                                  height: "32px",
                                  fontSize: "12px",
                                  border: "none",
                                  borderRadius: 0,
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
                        ref={setGoldInputRef(index, 5)}
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        data-gold-col={5}
                        data-gold-row={index}
                        data-col={5}
                        data-row={index}
                        disabled={!isEditing}
                        readOnly={!isEditing}
                        type="text"
                        value={detail.notes || ""}
                        onChange={(e) =>
                          updateGoldDetail(index, "notes", e.target.value)
                        }
                        onKeyDown={(e) => handleGoldKeyDown(e, index, 5)}
                      />
                    </td>
                    <td className="p-0 border">
                      <input
                        ref={setGoldInputRef(index, 6)}
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        data-gold-col={6}
                        data-gold-row={index}
                        data-col={6}
                        data-row={index}
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
                        onKeyDown={(e) => handleGoldKeyDown(e, index, 6)}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </td>
                    <td className="p-0 border">
                      <input
                        ref={setGoldInputRef(index, 7)}
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        data-gold-col={7}
                        data-gold-row={index}
                        data-col={7}
                        data-row={index}
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
                        onKeyDown={(e) => handleGoldKeyDown(e, index, 7)}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </td>
                    <td className="p-0 border">
                      <input
                        ref={setGoldInputRef(index, 8)}
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        data-gold-col={8}
                        data-gold-row={index}
                        data-col={8}
                        data-row={index}
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
                        data-col={9}
                        data-row={index}
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
                          handleGoldKeyDown(e, index, 9, { isLastCol: true })
                        }
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </td>
                    <td className="p-0 border">
                      {(() => {
                        const thisCol = 10;
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
                            ref={setGoldInputRef(index, thisCol)}
                            data-gold-col={10}
                            data-gold-row={index}
                            data-col={10}
                            data-row={index}
                            className="h-full"
                          >
                            <ReactSelect
                              isSearchable
                              className="text-xs"
                              classNamePrefix="react-select"
                              components={{ IndicatorSeparator: () => null }}
                              instanceId={`cost-center-gold-select-${index}`}
                              isDisabled={!isEditing || costCenters.length === 0}
                              menuPortalTarget={
                                typeof window !== "undefined"
                                  ? document.body
                                  : null
                              }
                              menuPosition="fixed"
                              options={costCenterSelectOptions}
                              placeholder={t("tables.gold.placeholders.selectCostCenter")}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "32px",
                                  height: "32px",
                                  fontSize: "12px",
                                  border: "none",
                                  borderRadius: 0,
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

      {/* Cash Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-1.5">
        <div className="p-1 border-b border-slate-200 bg-slate-50">
          <h3 className={`text-xs font-semibold text-slate-800 ${textAlign}`}>{t("tables.cash.title")}</h3>
        </div>
        <div className="p-0.5">
          <div className="flex justify-between mb-0.5">
            <button
              className="btn text-xs px-2 py-0.5"
              disabled={!isEditing}
              type="button"
              onClick={addVoucherBoxRow}
            >
              {t("tables.gold.addRow")}
            </button>
          </div>
          <div className="overflow-x-auto overflow-y-auto mb-0.5 max-w-full max-h-[400px]">
            <table className="min-w-[880px] border text-xs text-center table-fixed">
              <thead className="bg-gray-100 text-xs font-bold">
                <tr>
                  <th className={`w-32 p-1 border ${textAlignCenter}`}>{t("tables.cash.columns.amount")}</th>
                  <th className={`w-48 p-1 border ${textAlignCenter}`}>{t("tables.cash.columns.box")}</th>
                  <th className={`w-80 p-1 border ${textAlignCenter}`}>{t("tables.cash.columns.notes")}</th>
                  <th className={`w-32 p-1 border ${textAlignCenter}`}>{t("tables.cash.columns.invoiceNumber")}</th>
                  <th className={`w-48 p-1 border ${textAlignCenter}`}>{t("tables.cash.columns.costCenter")}</th>
                  <th className={`w-12 p-1 border ${textAlignCenter}`}>{t("tables.cash.columns.delete")}</th>
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
                        data-col={0}
                        data-row={index}
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
                        const boxValue = getBoxSelectValue(box.box_id);
                        const selectedBoxValue = boxValue
                          ? typeof boxValue === "object"
                            ? boxValue.value
                            : boxValue
                          : null;

                        return (
                          <div
                            id={`cash-box-wrapper-${index}`}
                            ref={setBoxInputRef(index, thisCol)}
                            data-box-col={1}
                            data-box-row={index}
                            data-col={1}
                            data-row={index}
                            className="h-full"
                          >
                            <ReactSelect
                              isSearchable
                              className="text-xs"
                              classNamePrefix="react-select"
                              components={{ IndicatorSeparator: () => null }}
                              instanceId={`cash-box-select-${index}`}
                              isDisabled={!isEditing || cashBoxSelectOptions.length === 0}
                              menuPortalTarget={
                                typeof window !== "undefined"
                                  ? document.body
                                  : null
                              }
                              menuPosition="fixed"
                              options={cashBoxSelectOptions}
                              placeholder="اختر الصندوق..."
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "32px",
                                  height: "32px",
                                  fontSize: "12px",
                                  border: "none",
                                  borderRadius: 0,
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
                        data-col={2}
                        data-row={index}
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
                        data-col={3}
                        data-row={index}
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
                              isDisabled={!isEditing || costCenters.length === 0}
                              menuPortalTarget={
                                typeof window !== "undefined"
                                  ? document.body
                                  : null
                              }
                              menuPosition="fixed"
                              options={costCenterSelectOptions}
                              placeholder={t("tables.gold.placeholders.selectCostCenter")}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "32px",
                                  height: "32px",
                                  fontSize: "12px",
                                  border: "none",
                                  borderRadius: 0,
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

      {/* Totals */}
      <div className="mt-1.5 bg-gray-50 rounded-lg p-1.5 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-800 font-medium">
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
            <span className="text-gray-700 font-medium">{t("totals.totalCash")}:</span>
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
