"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import CreatableSelect from "react-select/creatable";
import AsyncCreatableSelectRegular from "react-select/async-creatable";
import { withAsyncPaginate } from "react-select-async-paginate";
import toast from "react-hot-toast";

const AsyncPaginateCreatableSelect = withAsyncPaginate(CreatableSelect);

import { Voucher, VoucherBox, GVoucherDetail } from "@/types/voucher";
import { voucherService, itemService, customerService, glTransactionService } from "@/services/api";
import {
  createVoucherAction,
  updateVoucherAction,
} from "@/app/actions/voucher.action";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";
import { GLTransaction } from "@/types/models/gl-transaction";
import GLTransactionModal from "../components/GLTransactionModal";

import "bootstrap-icons/font/bootstrap-icons.css";

interface CustomerGoldVoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherBoxes?: VoucherBox[];
  goldDetailsData?: GVoucherDetail[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
  accounts: any[];
  boxes: any[];
  costCenters: any[];
  customers: any[];
  items: any[];
  voucherTypes: any[];
  startInEditMode?: boolean;
  vouchType: number; // 4 للقبض، 5 للصرف
  formMode?: "new" | "edit" | "preview";
}

export default function CustomerGoldVoucherClientPage({
  voucherData,
  voucherBoxes: initialVoucherBoxes = [],
  goldDetailsData: initialGoldDetails = [],
  isNewVoucher = true,
  voucherRecordId,
  accounts: initialAccounts,
  boxes: initialBoxes,
  costCenters: initialCostCenters,
  customers: initialCustomers,
  items: initialItems,
  voucherTypes: initialVoucherTypes,
  startInEditMode = false,
  vouchType,
  formMode = "new",
}: CustomerGoldVoucherClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State Management
  const [voucher, setVoucher] = useState<Voucher>(
    voucherData || {
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
      handling: voucherData?.handling || "",
    },
  );

  const [currentTime, setCurrentTime] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [voucherBoxes, setVoucherBoxes] = useState<VoucherBox[]>(
    initialVoucherBoxes || [],
  );
  const [goldDetails, setGoldDetails] = useState<GVoucherDetail[]>(
    initialGoldDetails || [],
  );
  const [accounts, setAccounts] = useState<any[]>(initialAccounts);
  const [boxes, setBoxes] = useState<any[]>(initialBoxes);
  const [costCenters, setCostCenters] = useState<any[]>(initialCostCenters);
  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  
  // State للمودال والقيد المحاسبي
  const [isGLModalOpen, setIsGLModalOpen] = useState(false);
  const [glTransactions, setGlTransactions] = useState<GLTransaction[]>([]);
  const [loadingGLTransactions, setLoadingGLTransactions] = useState(false);
  const [items, setItems] = useState<any[]>(initialItems);
  const [voucherTypes, setVoucherTypes] = useState<any[]>(initialVoucherTypes);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [originalBoxes, setOriginalBoxes] = useState<VoucherBox[]>([]);
  const [originalGoldDetails, setOriginalGoldDetails] = useState<
    GVoucherDetail[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [defaultCustomerOptions, setDefaultCustomerOptions] = useState<any[]>(
    [],
  );

  // Initialize component
  useEffect(() => {
    setIsClient(true);
    updateCurrentTime();

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

  const updateCurrentTime = () => {
    const now = new Date();

    setCurrentTime(now.toLocaleTimeString("ar-EG"));
  };

  useEffect(() => {
    const interval = setInterval(updateCurrentTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const generateNextVoucherNumber = async () => {
    try {
      const nextId = await voucherService.getNextNumber(vouchType);

      setVoucher((prev) => ({
        ...prev,
        vouch_id: nextId,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString(),
      }));
    } catch (error) {
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
            // تحديث k من الصنف
            if (selectedItem.k !== undefined && selectedItem.k !== null) {
              const itemK =
                typeof selectedItem.k === "number"
                  ? selectedItem.k
                  : parseFloat(String(selectedItem.k || "0")) || 0;

              if (itemK > 0) {
                newDetail.k = itemK;
              }
            }
            // تحديث weight من الصنف إذا كان موجوداً ولم يكن المستخدم قد أدخل وزن
            if (
              selectedItem.item_weight !== undefined &&
              selectedItem.item_weight !== null
            ) {
              const itemWeight =
                typeof selectedItem.item_weight === "number"
                  ? selectedItem.item_weight
                  : parseFloat(String(selectedItem.item_weight || "0")) || 0;

              if (
                itemWeight > 0 &&
                (!newDetail.weight || newDetail.weight === 0)
              ) {
                newDetail.weight = itemWeight;
              }
            }
          }

          // حساب g_weight بعد تحديث k و weight من الصنف
          const weight =
            typeof newDetail.weight === "number"
              ? newDetail.weight
              : parseFloat(String(newDetail.weight || "0")) || 0;
          const k =
            typeof newDetail.k === "number"
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
    loadedOptions: readonly any[] = [],
    additional: { page?: number } = { page: 1 },
  ) => {
    const trimmed = search.trim();
    const page = additional?.page || 1;

    try {
      // إذا لم يكن هناك بحث، جلب أول 20 صنف
      if (!trimmed) {
        const result = await itemService.searchItems({
          query: "0", // "0" للحصول على جميع الأصناف
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

        const options = normalizedResults.map((item: any) => ({
          value: item.id,
          label: `${item.item_code || ""} - ${item.item_name || ""}`,
          item: item,
        }));

        return {
          options,
          hasMore: Boolean(result.next),
          additional: { page: result.next ? page + 1 : page },
        };
      }

      // إذا كان هناك بحث، استدعي API للبحث مع pagination
      const result = await itemService.searchItems({
        query: trimmed,
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

      return {
        options,
        hasMore: Boolean(result.next),
        additional: { page: result.next ? page + 1 : page },
      };
    } catch (e) {
      console.error("Error loading item options:", e);

      return { options: [], hasMore: false, additional: { page: 1 } };
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
      toast.error("يرجى اختيار العميل");

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
        toast.error("يرجى اختيار العميل");

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
      };

      console.log("📤 Client - بيانات السند قبل الإرسال:", {
        cust_id: voucherData.cust_id,
        selectedCustomer: selectedCustomer?.id,
        voucher_cust_id: voucher.cust_id,
      });

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
        toast.error(result.message || "حدث خطأ أثناء الحفظ");
      }
    } catch (error) {
      console.error("Error saving voucher:", error);
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setIsLoading(false);
    }
  };

  // دالة جلب القيد المحاسبي (فقط للحركة الحالية)
  const loadGLTransactions = async () => {
    if (!voucher.vouch_id || voucher.vouch_id <= 0) {
      return;
    }

    setLoadingGLTransactions(true);
    try {
      const response = await glTransactionService.getAll({
        xtrans_id: voucher.vouch_id,
        xtrans_type: vouchType, // 4 للقبض، 5 للصرف
        xcom_id: 1,
        xyear_id: 0,
        xfrom_date: 0,
        xto_date: 0,
      });

      if (response.success && response.data) {
        const transactions = Array.isArray(response.data) ? response.data : [];
        const filteredTransactions = transactions.filter(
          (trans: GLTransaction) =>
            trans.trans_id === voucher.vouch_id && trans.trans_type === vouchType,
        );
        setGlTransactions(filteredTransactions);
      } else {
        setGlTransactions([]);
      }
    } catch (error) {
      console.error("Error loading GL transactions:", error);
      setGlTransactions([]);
    } finally {
      setLoadingGLTransactions(false);
    }
  };

  // فتح المودال عند الضغط على الزر
  const handleViewGLTransactions = async () => {
    setIsGLModalOpen(true);
    await loadGLTransactions();
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
        const validDetails = details.filter((d) => d.acc_id && d.acc_id > 0);
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
          const box = boxes.find((b) => b.id === boxId);

          return box?.cust_name || box?.name || `صندوق ${boxId}`;
        };

        const getCostCenterName = (costId: number | null | undefined) => {
          if (!costId || costId === 0) return "-";
          const center = costCenters.find((c) => c.id === costId);

          return center?.name || center?.cost_name || `مركز ${costId}`;
        };

        const getItemName = (itemId: number) => {
          const item = items.find((itm) => itm.id === itemId);

          return item?.item_name || `صنف ${itemId}`;
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
          vouchType === 4 ? "سند قبض عميل" : "سند صرف عميل";

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
                    <span class="header-info-label">رقم السند</span>
                    <span class="header-info-value">${voucher.vouch_id || "-"}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">التاريخ</span>
                    <span class="header-info-value">${formattedDate}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">العميل</span>
                    <span class="header-info-value">${getCustomerName()}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">عدد الذهب</span>
                    <span class="header-info-value">${validGoldDetails.length}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">عدد الصناديق</span>
                    <span class="header-info-value">${validBoxes.length}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">عدد الحسابات</span>
                    <span class="header-info-value">${validDetails.length}</span>
                  </div>
                </div>
                ${
                  voucher.vouch_notes
                    ? `
                <div class="voucher-notes">
                  <strong>البيان:</strong> ${voucher.vouch_notes}
                </div>
                `
                    : ""
                }
              </div>
              
              <!-- جدول الذهب -->
              <div class="table-section">
                <div class="table-section-title">الذهب</div>
                <table>
                  <thead>
                    <tr>
                      <th>رقم الصنف</th>
                      <th>اسم الصنف</th>
                      <th>معايرة</th>
                      <th>الوزن القائم</th>
                      <th>الوزن المعاير</th>
                      <th>الصندوق</th>
                      <th>البيان</th>
                      <th>فرق عيار</th>
                      <th>مبلغ التسكير</th>
                      <th>وزن التسكير</th>
                      <th>رقم الفاتورة</th>
                      <th>مركز التكلفة</th>
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
                          <td>${detail.close_weight ? detail.close_weight.toFixed(5) : "-"}</td>
                          <td>${detail.inv_id || "-"}</td>
                          <td style="text-align: right; font-size: 11px;">${costName}</td>
                        </tr>
                      `;
                      })
                      .join("")}
                    <tr class="totals">
                      <td colspan="3" style="text-align: right; padding-right: 20px; font-weight: 700;">إجمالي الذهب</td>
                      <td class="amount amount-gold">${totals.totalGoldWeight.toFixed(5)}</td>
                      <td class="amount amount-gold">${totals.totalGoldGWeight.toFixed(5)}</td>
                      <td colspan="7"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- جدول النقدية -->
              <div class="table-section">
                <div class="table-section-title">النقدية</div>
                <table>
                  <thead>
                    <tr>
                      <th>المبلغ</th>
                      <th>الصندوق</th>
                      <th>البيان</th>
                      <th>وزن التسكير</th>
                      <th>رقم الفاتورة</th>
                      <th>مركز التكلفة</th>
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
                          <td>${box.close_weight ? box.close_weight.toFixed(5) : "-"}</td>
                          <td>${box.inv_id || "-"}</td>
                          <td style="text-align: right; font-size: 11px;">${costName}</td>
                        </tr>
                      `;
                      })
                      .join("")}
                    <tr class="totals">
                      <td class="amount amount-cash">${formatAmount(totals.totalBoxes)}</td>
                      <td colspan="5" style="text-align: right; padding-right: 20px; font-weight: 700;">إجمالي النقدية</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- جدول التفاصيل -->
              <div class="table-section">
                <div class="table-section-title">الحسابات</div>
                <table>
                  <thead>
                    <tr>
                      <th>رقم الحساب</th>
                      <th>اسم الحساب</th>
                      <th>المبلغ</th>
                      <th>البيان</th>
                      <th>مركز التكلفة</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${validDetails
                      .map((detail) => {
                        const account = accounts.find(
                          (acc) => acc.id === detail.acc_id,
                        );
                        const amount =
                          vouchType === 4
                            ? detail.credit || 0
                            : detail.debit || 0;
                        const costName = getCostCenterName(detail.cost_id);

                        return `
                        <tr>
                          <td class="account-code">${account?.acc_code || "-"}</td>
                          <td class="account-name">${account?.acc_name || "-"}</td>
                          <td class="amount amount-cash">${amount > 0 ? formatAmount(amount) : "-"}</td>
                          <td style="text-align: right; font-size: 11px; color: #718096;">${detail.vouch_notes || "-"}</td>
                          <td style="text-align: right; font-size: 11px;">${costName}</td>
                        </tr>
                      `;
                      })
                      .join("")}
                    <tr class="totals">
                      <td colspan="2" style="text-align: right; padding-right: 20px; font-weight: 700;">إجمالي التفاصيل</td>
                      <td class="amount amount-cash">${formatAmount(totals.totalDetails)}</td>
                      <td colspan="2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="balance-status">
                الحالة: ${isBalanced ? "متزن ✓" : "غير متزن ✗"}
              </div>
              
              <div class="footer">
                <p>تم طباعة هذا السند بتاريخ ${new Date().toLocaleDateString("ar-SA")} - نظام NafeesWeb</p>
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
        `حدث خطأ أثناء الطباعة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
      );
      setIsPrinting(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim() === "") {
      toast.error("يرجى إدخال رقم السند للبحث");

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
              vouchType === 4 ? "سند قبض عميل" : "سند صرف عميل";

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

      const voucherTypeName = vouchType === 4 ? "سند قبض عميل" : "سند صرف عميل";

      toast.error(`لم يتم العثور على ${voucherTypeName} برقم: ${searchValue}`);
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
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const voucherTypeName =
    voucherTypes.find((t) => (t.Id || t.id) === vouchType)?.name ||
    (vouchType === 4 ? "سند قبض عميل" : "سند صرف عميل");

  return (
    <div className="p-3 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-4 border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-4">
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="h-7 px-3 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm disabled:opacity-50"
              disabled={isLoading || !isEditing}
              onClick={saveVoucher}
            >
              {isLoading ? (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  حفظ...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <i className="bi bi-check-circle w-4 h-4" />
                  حفظ
                </span>
              )}
            </button>

            <button
              className={`h-7 px-3 text-xs border rounded-md shadow-sm ${
                formMode === "new" || isEditing
                  ? "bg-gray-400 text-white border-gray-400 cursor-not-allowed opacity-50"
                  : "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
              }`}
              disabled={formMode === "new" || isEditing || isLoading}
              onClick={handleEditClick}
            >
              <i className="bi bi-pencil-square w-4 h-4 me-1" />
              تعديل
            </button>

            {/* زر "جديد" */}
            <button
              className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
              onClick={() => {
                const newPath =
                  vouchType === 4 ? "/forms/gvoucher4" : "/forms/gvoucher5";

                router.push(newPath);
              }}
            >
              <i className="bi bi-plus-circle w-4 h-4 me-1" />
              جديد
            </button>

            <button
              className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm disabled:opacity-50"
              disabled={isPrinting}
              onClick={printVoucher}
            >
              <i className="bi bi-printer w-4 h-4 me-1" />
              طباعة
            </button>
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

      {/* Form Fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            رقم المرجع
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            readOnly={!isEditing}
            type="text"
            value={voucher.ref_no || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            التاريخ والوقت
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
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

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            العميل
          </label>
          <AsyncCreatableSelectRegular
            cacheOptions
            isClearable
            isSearchable
            className="text-xs"
            classNamePrefix="select"
            defaultOptions={
              defaultCustomerOptions.length > 0 ? defaultCustomerOptions : true
            }
            isDisabled={!isEditing}
            loadOptions={loadCustomerOptions}
            menuPortalTarget={
              typeof window !== "undefined" ? document.body : null
            }
            menuPosition="fixed"
            placeholder="اختر العميل..."
            styles={{
              control: (provided, state) => ({
                ...provided,
                minHeight: "32px",
                height: "32px",
                fontSize: "12px",
                borderColor: state.isFocused ? "#64748b" : "#cbd5e1",
                boxShadow: state.isFocused
                  ? "0 0 0 1px #64748b"
                  : provided.boxShadow,
                "&:hover": {
                  borderColor: "#64748b",
                },
              }),
              valueContainer: (provided) => ({
                ...provided,
                height: "32px",
                padding: "0 8px",
              }),
              input: (provided) => ({
                ...provided,
                margin: "0px",
              }),
              indicatorsContainer: (provided) => ({
                ...provided,
                height: "32px",
              }),
              option: (provided, state) => ({
                ...provided,
                fontSize: "12px",
                backgroundColor: state.isSelected
                  ? "#64748b"
                  : state.isFocused
                    ? "#f1f5f9"
                    : "white",
                color: state.isSelected ? "white" : "#1e293b",
              }),
            }}
            value={getCustomerSelectValue()}
            onChange={(selectedOption: any) => {
              if (!isEditing) return;
              const opt: any = selectedOption;
              const selected =
                opt?.customer ||
                customers.find((cust) => cust.id === opt?.value);

              setSelectedCustomer(selected || null);

              // نسخ المناولة من العميل تلقائياً (مثل الفواتير)
              const handling = selected?.handling?.toString() || "";

              setVoucher((prev) => ({
                ...prev,
                cust_id: selected?.id ?? null,
                handling: handling,
              }));
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            مناولة
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            placeholder="مناولة"
            readOnly={!isEditing}
            type="text"
            value={voucher.handling || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, handling: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            البيان
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            readOnly={!isEditing}
            type="text"
            value={voucher.vouch_notes || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, vouch_notes: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Gold Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-800">الذهب</h3>
        </div>
        <div className="p-2">
          <div className="flex justify-between mb-2">
            <button
              className="btn"
              disabled={!isEditing}
              type="button"
              onClick={addGoldDetailRow}
            >
              + صف
            </button>
          </div>
          <div className="overflow-x-auto mb-3 max-w-full">
            <table className="min-w-[1000px] border text-sm text-center table-fixed">
              <thead className="bg-gray-100 text-xs font-bold">
                <tr>
                  <th className="w-48 p-2 border">رقم الصنف</th>
                  <th className="w-32 p-2 border">معايرة</th>
                  <th className="w-32 p-2 border">الوزن القائم</th>
                  <th className="w-32 p-2 border">الوزن المعاير</th>
                  <th className="w-48 p-2 border">الصندوق</th>
                  <th className="w-80 p-2 border">البيان</th>
                  <th className="w-32 p-2 border">فرق عيار</th>
                  <th className="w-32 p-2 border">مبلغ التسكير</th>
                  <th className="w-32 p-2 border">وزن التسكير</th>
                  <th className="w-32 p-2 border">رقم الفاتورة</th>
                  <th className="w-48 p-2 border">مركز التكلفة</th>
                  <th className="w-12 p-2 border">حذف</th>
                </tr>
              </thead>
              <tbody>
                {goldDetails.map((detail, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-0 border">
                      <AsyncPaginateCreatableSelect
                        defaultOptions
                        isClearable
                        isSearchable
                        additional={{ page: 1 }}
                        className="text-xs"
                        classNamePrefix="select"
                        components={{ IndicatorSeparator: () => null }}
                        instanceId={`item-select-${index}`}
                        isDisabled={!isEditing}
                        loadOptions={loadItemOptions}
                        menuPortalTarget={
                          typeof window !== "undefined" ? document.body : null
                        }
                        menuPosition="fixed"
                        placeholder="اختر الصنف..."
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
                        value={getItemSelectValue(detail)}
                        onChange={(selectedOption: any) => {
                          if (!isEditing) return;
                          const opt: any = selectedOption;
                          const selected =
                            opt?.item ||
                            items.find((itm) => itm.id === opt?.value);

                          if (!selected) return;

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
                          if (selected.k !== undefined && selected.k !== null) {
                            updateGoldDetail(index, "k", selected.k);
                          }
                        }}
                      />
                    </td>
                    <td className="p-0 border">
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
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
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
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
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
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
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                          }
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </td>
                    <td className="p-0 border">
                      <select
                        className="w-full h-full text-xs border-0 rounded-none focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        value={detail.box_id || ""}
                        onChange={(e) =>
                          updateGoldDetail(
                            index,
                            "box_id",
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          )
                        }
                      >
                        <option value="">اختر الصندوق</option>
                        {boxes.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.cust_name || b.name || `صندوق ${b.id}`}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-0 border">
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        readOnly={!isEditing}
                        type="text"
                        value={detail.notes || ""}
                        onChange={(e) =>
                          updateGoldDetail(index, "notes", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-0 border">
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
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
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
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
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
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
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                          }
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </td>
                    <td className="p-0 border">
                      <select
                        className="w-full h-full text-xs border-0 rounded-none focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        value={detail.cost_id || ""}
                        onChange={(e) =>
                          updateGoldDetail(
                            index,
                            "cost_id",
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          )
                        }
                      >
                        <option value="">مركز التكلفة</option>
                        {costCenters.map((center) => (
                          <option key={center.id} value={center.id}>
                            {center.name ||
                              center.cost_name ||
                              `مركز ${center.id}`}
                          </option>
                        ))}
                      </select>
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
      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-800">النقدية</h3>
        </div>
        <div className="p-2">
          <div className="flex justify-between mb-2">
            <button
              className="btn"
              disabled={!isEditing}
              type="button"
              onClick={addVoucherBoxRow}
            >
              + صف
            </button>
          </div>
          <div className="overflow-x-auto mb-3 max-w-full">
            <table className="min-w-[1000px] border text-sm text-center table-fixed">
              <thead className="bg-gray-100 text-xs font-bold">
                <tr>
                  <th className="w-32 p-2 border">المبلغ</th>
                  <th className="w-48 p-2 border">الصندوق</th>
                  <th className="w-80 p-2 border">البيان</th>
                  <th className="w-32 p-2 border">وزن التسكير</th>
                  <th className="w-32 p-2 border">رقم الفاتورة</th>
                  <th className="w-48 p-2 border">مركز التكلفة</th>
                  <th className="w-12 p-2 border">حذف</th>
                </tr>
              </thead>
              <tbody>
                {voucherBoxes.map((box, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-0 border">
                      <input
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
                            e.target.value ? parseFloat(e.target.value) : 0,
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                          }
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </td>
                    <td className="p-0 border">
                      <select
                        className="w-full h-full text-xs border-0 rounded-none focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        value={
                          box.box_id && box.box_id > 0 ? String(box.box_id) : ""
                        }
                        onChange={(e) => {
                          const selectedBoxId = e.target.value
                            ? parseInt(e.target.value)
                            : 0;

                          updateVoucherBox(index, "box_id", selectedBoxId);
                        }}
                      >
                        <option value="">اختر الصندوق</option>
                        {boxes.map((b) => (
                          <option key={b.id} value={String(b.id)}>
                            {b.cust_name ||
                              b.name ||
                              box.box?.cust_name ||
                              `صندوق ${b.id}`}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-0 border">
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        readOnly={!isEditing}
                        type="text"
                        value={box.vouch_notes || ""}
                        onChange={(e) =>
                          updateVoucherBox(index, "vouch_notes", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-0 border">
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        readOnly={!isEditing}
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        type="number"
                        value={box.close_weight || ""}
                        onChange={(e) =>
                          updateVoucherBox(
                            index,
                            "close_weight",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
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
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                          }
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </td>
                    <td className="p-0 border">
                      <select
                        className="w-full h-full text-xs border-0 rounded-none focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        value={box.cost_id || ""}
                        onChange={(e) =>
                          updateVoucherBox(
                            index,
                            "cost_id",
                            e.target.value ? parseInt(e.target.value) : null,
                          )
                        }
                      >
                        <option value="">مركز التكلفة</option>
                        {costCenters.map((center) => (
                          <option key={center.id} value={center.id}>
                            {center.name ||
                              center.cost_name ||
                              `مركز ${center.id}`}
                          </option>
                        ))}
                      </select>
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
      <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-amber-800 font-medium">
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
            <span className="text-gray-700 font-medium">إجمالي النقدية:</span>
            <span className="font-semibold text-blue-700 flex items-center gap-1">
              {formatAmount(totals.totalBoxes)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>
        </div>
      </div>

      {/* مودال عرض القيد المحاسبي */}
      <GLTransactionModal
        isOpen={isGLModalOpen}
        onClose={() => setIsGLModalOpen(false)}
        loading={loadingGLTransactions}
        transactions={glTransactions}
        voucherId={voucher.vouch_id || 0}
        refNo={voucher.ref_no}
      />
    </div>
  );
}
