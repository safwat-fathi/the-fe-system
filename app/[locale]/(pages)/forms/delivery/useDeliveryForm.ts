// ====================================
// Types & Imports
// ====================================
import type { Voucher, VoucherBox, GVoucherDetail } from "@/types/voucher";
import type { Customer } from "@/types/models/customer";
import type { CostCenter } from "@/types/voucher-form";
import type { Item } from "@/types/models/item";
import type { Category } from "@/types/items";
import type { Box } from "@/types/models/box";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";

import { itemService } from "@/services/api";
import {
  createDeliveryVoucherAction,
  updateDeliveryVoucherAction,
  getNextDeliveryVoucherNumberAction,
} from "@/app/actions/delivery";
import { calculateCalibratedGold, parseNumber } from "@/utilities/voucherForm";
// ====================================
// Type Definitions - تعريفات الأنواع
// ====================================

/** فئة التسليم مع خصائص الذهب */
export interface DeliveryCategory extends Category {
  cat_purity: number;
  k: number;
  carat: number;
  box_id: number;
  cat_box: number;
  gold_box: number;
  default_box: number;
  default_gold_box: number;
}

export interface DeliveryBox extends Box {
  box_name?: string;
  name?: string;
}

/** عنصر النموذج */
export type FormItem = {
  id: number;
  item_code: string | null;
  item_name: string | null;
  item_price?: number;
  item_weight?: number;
  item_g_weight?: number;
  work_price?: number;
  purity?: string;
  stones?: string | null;
  cat?: number;
  k?: number;
  qty?: number;
  code?: string;
  name?: string;
  category?: string;
  category_id?: number;
  cat_id?: number;
  weight?: number;
  item_k?: number;
  carat?: number;
  itemWeight?: number;
  g_weight?: number;
  gWeight?: number;
};

/** خيار اختيار الصنف */
export type ItemSelectOption = {
  value: number;
  label: string;
  item: FormItem;
};

/** خيار اختيار العميل */
export interface CustomerSelectOption {
  value: number;
  label: string;
  customer: Customer;
}

/** خيار اختيار مركز التكلفة */
export interface CostCenterSelectOption {
  value: number;
  label: string;
}

/** معاملات الـ Hook */
export interface UseDeliveryFormParams {
  voucherData?: Voucher;
  vouchType: number;
  voucherBoxes: VoucherBox[];
  goldDetailsData: GVoucherDetail[];
  formMode?: "new" | "edit" | "preview";
  voucherRecordId?: number;
  customers?: Customer[];
  costCenters?: CostCenter[];
  items?: Item[];
  categories?: DeliveryCategory[];
  boxes: Box[];
  goldBoxes?: Box[];
}

// ====================================
// Helper Functions - دوال مساعدة
// ====================================

/** إنشاء صف ذهب فارغ */
const createEmptyGoldDetail = (vouchId: number): GVoucherDetail => ({
  id: 0,
  vouch_id: vouchId,
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
});

/** إنشاء صف صندوق فارغ */
const createEmptyVoucherBox = (): VoucherBox => ({
  id: 0,
  vouch_id: 0,
  box_id: 0,
  amount: 0,
  vouch_notes: "",
  cost_id: undefined,
  inv_id: undefined,
  close_weight: undefined,
  cr_date: new Date().toISOString(),
});

/** استخراج معرف الصندوق من الفئة */
const getCategoryBoxId = (category: DeliveryCategory): number | undefined => {
  if (!category) return undefined;

  const candidateKeys = [
    category.box_id,
    category.box,
    category.cat_box,
    category.gold_box,
    category.default_box,
    category.default_gold_box,
  ];

  for (const key of candidateKeys) {
    const parsed = Number(key);

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
};

// ====================================
// Main Hook - الـ Hook الرئيسي
// ====================================

export function useDeliveryForm({
  voucherData,
  vouchType,
  voucherBoxes: initialVoucherBoxes = [],
  goldDetailsData: initialGoldDetails = [],
  formMode = "new",
  voucherRecordId,
  customers: initialCustomers = [],
  costCenters: initialCostCenters = [],
  items: initialItems = [],
  categories: initialCategories = [],
  boxes: initialBoxes = [],
  goldBoxes: initialGoldBoxes = [],
}: UseDeliveryFormParams) {
  // ------------------------------------
  // Hooks & Refs - الهوكات والمراجع
  // ------------------------------------
  const router = useRouter();
  const t = useTranslations("forms.customerGoldVoucher");
  const tDelivery = useTranslations("forms.deliveryVoucher");
  const hasGeneratedVoucherNumber = useRef(false);

  // ------------------------------------
  // UI State - حالة واجهة المستخدم
  // ------------------------------------
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // ------------------------------------
  // Data State - حالة البيانات
  // ------------------------------------
  const [boxes] = useState<DeliveryBox[]>(initialBoxes);
  const [goldBoxes] = useState<DeliveryBox[]>(initialGoldBoxes);

  /** تحديد حالة التعديل */
  const isEditing = useMemo(() => {
    if (formMode === "preview") return false;
    if (formMode === "new") return true;
    if (formMode === "edit") return true;

    return false;
  }, [formMode]);

  // ------------------------------------
  // Items State - حالة الأصناف
  // ------------------------------------
  const [items, setItems] = useState<FormItem[]>(
    initialItems.map((item) => ({
      id: item.id,
      item_code: item.item_code,
      item_name: item.item_name,
      item_price:
        typeof item.item_price === "string"
          ? parseFloat(item.item_price) || 0
          : item.item_price,
      item_weight:
        typeof item.item_weight === "string"
          ? parseFloat(item.item_weight) || 0
          : Number(item.item_weight),
      item_g_weight:
        typeof item.item_g_weight === "string"
          ? parseFloat(item.item_g_weight) || 0
          : Number(item.item_g_weight),
      work_price: undefined,
      purity:
        typeof item.purity === "number"
          ? String(item.purity)
          : (item.purity ?? undefined),
      stones:
        typeof item.stones === "number" ? String(item.stones) : item.stones,
      cat: item.cat ?? undefined,
      k: typeof item.k === "string" ? parseInt(item.k) || undefined : undefined,
    })),
  );

  // ------------------------------------
  // Voucher State - حالة السند
  // ------------------------------------
  const initialVoucher = useMemo<Voucher>(
    () =>
      voucherData
        ? { ...voucherData, cost_id: voucherData.cost_id ?? null }
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
    [voucherData, vouchType],
  );

  const [voucher, setVoucher] = useState<Voucher>(initialVoucher);
  const [voucherBoxes, setVoucherBoxes] =
    useState<VoucherBox[]>(initialVoucherBoxes);
  const [goldDetails, setGoldDetails] =
    useState<GVoucherDetail[]>(initialGoldDetails);
  const [originalBoxes, setOriginalBoxes] = useState<VoucherBox[]>([]);
  const [originalGoldDetails, setOriginalGoldDetails] = useState<
    GVoucherDetail[]
  >([]);

  // ------------------------------------
  // Categories - الفئات
  // ------------------------------------
  const categories = useMemo(
    () => initialCategories || [],
    [initialCategories],
  );

  /** خريطة الفئات للوصول السريع */
  const categoryMap = useMemo(() => {
    const map = new Map<number, DeliveryCategory>();

    categories.forEach((cat: DeliveryCategory) => {
      if (cat.id) map.set(cat.id, cat);
    });

    return map;
  }, [categories]);

  // ------------------------------------
  // Customer State - حالة العميل
  // ------------------------------------
  const [customers] = useState<Customer[]>(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // ------------------------------------
  // Cost Centers - مراكز التكلفة
  // ------------------------------------
  const [costCenters] = useState<CostCenter[]>(initialCostCenters);

  // ------------------------------------
  // Select Options - خيارات القوائم المنسدلة
  // ------------------------------------
  const defaultCustomerOptions = useMemo<CustomerSelectOption[]>(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: `${customer.cust_code || ""} - ${customer.cust_name || ""}`,
        customer,
      })),
    [customers],
  );

  /** رقم السند */
  const voucherNumber = useMemo(() => {
    const vouchId = Number(voucher.vouch_id);

    if (vouchId > 0) return String(vouchId);

    if (voucher.id) return `DB-${voucher.id}`;

    return "";
  }, [voucher.vouch_id, voucher.id]);

  /** خيارات مراكز التكلفة */
  const costCenterSelectOptions = useMemo<CostCenterSelectOption[]>(
    () =>
      costCenters.map((cc) => ({
        value: cc.id,
        label: cc.cost_name || cc.cost_name_e || `${cc.id}`,
      })),
    [costCenters],
  );

  /** خيارات مراكز التكلفة بقيمة نصية */
  const costCenterOptionsWithStringValue = useMemo(
    () =>
      costCenterSelectOptions.map((opt) => ({
        ...opt,
        value: String(opt.value),
      })),
    [costCenterSelectOptions],
  );

  /** التحقق من وجود رقم سند */
  const hasVoucherId = useMemo(() => {
    const vouchId = Number(voucher.vouch_id ?? 0);

    return Number.isFinite(vouchId) && vouchId > 0;
  }, [voucher.vouch_id]);

  // ====================================
  // Voucher Number Generation - توليد رقم السند
  // ====================================

  /** توليد رقم السند التالي تلقائياً */
  const generateNextVoucherNumber = useCallback(async () => {
    if (hasGeneratedVoucherNumber.current) return;

    try {
      const nextId = await getNextDeliveryVoucherNumberAction();

      setVoucher((prev) => ({
        ...prev,
        vouch_id: nextId,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString(),
      }));
      hasGeneratedVoucherNumber.current = true;
    } catch (error) {
      console.error("Error generating next voucher number:", error);
      setVoucher((prev) => ({
        ...prev,
        vouch_id: 1,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString(),
      }));
    }
  }, []);

  // ====================================
  // Effects - التأثيرات
  // ====================================

  /** تحميل بيانات العميل عند تحميل السند */
  useEffect(() => {
    if (voucherData?.cust_id && customers.length > 0) {
      const customer = customers.find((c) => c.id === voucherData.cust_id);

      if (customer) {
        setSelectedCustomer(customer);
      }
    }
  }, [voucherData?.cust_id, customers]);

  /** تهيئة السند الجديد */
  useEffect(() => {
    if (formMode === "new" && !voucherData) {
      generateNextVoucherNumber();
      if (voucherBoxes.length === 0) {
        setVoucherBoxes([createEmptyVoucherBox()]);
      }
      if (goldDetails.length === 0) {
        setGoldDetails([createEmptyGoldDetail(0)]);
      }
    }
  }, [
    formMode,
    voucherData,
    generateNextVoucherNumber,
    voucherBoxes.length,
    goldDetails.length,
  ]);

  // ====================================
  // Customer Handlers - دوال العميل
  // ====================================

  /** تحميل خيارات العملاء مع البحث */
  const loadCustomerOptions = useCallback(
    async (search: string = ""): Promise<CustomerSelectOption[]> => {
      const term = search.trim().toLowerCase();
      const filteredCustomers = term
        ? customers.filter((customer) => {
            const custCode = String(customer.cust_code ?? "").toLowerCase();
            const custName = String(customer.cust_name ?? "").toLowerCase();

            return custCode.includes(term) || custName.includes(term);
          })
        : customers;

      return filteredCustomers.map((customer) => ({
        value: customer.id,
        label: `${customer.cust_code || ""} - ${customer.cust_name || ""}`,
        customer,
      }));
    },
    [customers],
  );

  const getCostomerOptions = useCallback(
    async (inputValue: string) => {
      try {
        const results = await loadCustomerOptions(inputValue);

        return results || [];
      } catch (error) {
        console.error("Error in customer search:", error);

        return [];
      }
    },
    [loadCustomerOptions],
  );

  /** الحصول على قيمة العميل المختار */
  const getCustomerSelectValue =
    useCallback((): CustomerSelectOption | null => {
      if (selectedCustomer) {
        return {
          value: selectedCustomer.id,
          label: `${selectedCustomer.cust_code || ""} - ${selectedCustomer.cust_name || ""}`,
          customer: selectedCustomer,
        };
      }
      if (voucher.cust_id) {
        const customer = customers.find((c) => c.id === voucher.cust_id);

        if (customer) {
          return {
            value: customer.id,
            label: `${customer.cust_code || ""} - ${customer.cust_name || ""}`,
            customer,
          };
        }
      }

      return null;
    }, [selectedCustomer, voucher.cust_id, customers]);

  // ====================================
  // Cost Center Handlers - دوال مراكز التكلفة
  // ====================================

  /** الحصول على قيمة مركز التكلفة */
  const getCostCenterSelectValue = useCallback(
    (costId: number | null | undefined): CostCenterSelectOption | null => {
      if (!costId) return null;
      const costCenter = costCenters.find((cc) => cc.id === costId);

      if (costCenter) {
        return {
          value: costCenter.id,
          label:
            costCenter.cost_name ||
            costCenter.cost_name_e ||
            `${costCenter.id}`,
        };
      }

      return null;
    },
    [costCenters],
  );

  // ====================================
  // Item Handlers - دوال الأصناف
  // ====================================

  /** تحميل خيارات الأصناف مع البحث */
  const loadItemOptions = useCallback(
    async (
      search: string,
      _loadedOptions: readonly ItemSelectOption[] = [],
      additional: { page?: number } = { page: 1 },
    ): Promise<ItemSelectOption[]> => {
      const trimmed = search.trim();
      const page = additional?.page || 1;

      if (trimmed.length === 0) {
        return initialItems.map((item) => ({
          value: item.id,
          label: `${item.item_code} - ${item.item_name}`,
          item: {
            id: item.id,
            item_code: item.item_code,
            item_name: item.item_name,
            item_price:
              typeof item.item_price === "string"
                ? parseFloat(item.item_price) || undefined
                : (item.item_price ?? undefined),
            item_weight:
              typeof item.item_weight === "string"
                ? parseFloat(item.item_weight) || 0
                : Number(item.item_weight),
            item_g_weight:
              typeof item.item_g_weight === "string"
                ? parseFloat(item.item_g_weight) || 0
                : Number(item.item_g_weight),
            work_price: undefined,
            purity:
              typeof item.purity === "number"
                ? String(item.purity)
                : (item.purity ?? undefined),
            stones:
              typeof item.stones === "number"
                ? String(item.stones)
                : item.stones,
            cat: item.cat ?? undefined,
            k:
              typeof item.k === "string"
                ? parseInt(item.k) || undefined
                : undefined,
          },
        }));
      }

      try {
        const result = await itemService.searchItemsVoucherList({
          query: trimmed || "0",
          page,
          companyId: 1,
        });

        if (!result?.results) return [];

        const normalizedResults: FormItem[] = result.results.map(
          (item: Record<string, unknown>) => ({
            id: Number(item.id ?? 0),
            item_code:
              (item.item_code as string) ??
              (item.code as string) ??
              String(item.id ?? ""),
            item_name:
              (item.item_name as string) ?? (item.name as string) ?? "",
            item_price:
              (item.item_price as number) ?? (item.price as number) ?? 0,
            item_weight:
              (item.item_weight as number) ?? (item.weight as number) ?? 0,
            item_g_weight:
              (item.item_g_weight as number) ??
              (item.g_weight as number) ??
              (item.item_weight as number) ??
              0,
            work_price:
              (item.work_price as number) ?? (item.price_w as number) ?? 0,
            purity: (item.purity as string) ?? (item.k as string) ?? "",
            stones: (item.stones as string) ?? (item.stone as string) ?? null,
            cat: (item.cat as number) ?? undefined,
            k: (item.k as number) ?? undefined,
          }),
        );

        setItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const additions = normalizedResults.filter(
            (item) => !existingIds.has(item.id),
          );

          return additions.length > 0 ? [...prev, ...additions] : prev;
        });

        return normalizedResults.map((item) => ({
          value: item.id,
          label: `${item.item_code} - ${item.item_name}`,
          item,
        }));
      } catch (error) {
        console.error("Error loading item options:", error);

        return [];
      }
    },
    [initialItems],
  );

  /** الحصول على قيمة الصنف المختار */
  const getItemSelectValue = useCallback(
    (goldDetail: GVoucherDetail): ItemSelectOption | null => {
      if (!goldDetail.item_id) return null;

      if (goldDetail.item_code && goldDetail.item_name) {
        return {
          value: goldDetail.item_id,
          label: `${goldDetail.item_code} - ${goldDetail.item_name}`,
          item: {
            id: goldDetail.item_id,
            item_code: goldDetail.item_code,
            item_name: goldDetail.item_name,
            k: goldDetail.k,
          },
        };
      }

      const item = items.find((itm) => itm.id === goldDetail.item_id);

      if (item) {
        return {
          value: goldDetail.item_id,
          label: `${item.item_code ?? ""} - ${item.item_name ?? ""}`,
          item,
        };
      }

      return null;
    },
    [items],
  );

  /** الحصول على الخيارات الافتراضية للصنف */
  const getDefaultItemOptions = useCallback(
    (goldDetail: GVoucherDetail): ItemSelectOption[] => {
      const selectedValue = getItemSelectValue(goldDetail);

      return selectedValue ? [selectedValue] : [];
    },
    [getItemSelectValue],
  );

  // ====================================
  // Search Handler - البحث عن السند
  // ====================================

  /** البحث عن سند برقم معين */
  const handleSearch = useCallback(async () => {
    if (!searchTerm || searchTerm.trim() === "") {
      toast.error(t("messages.searchErrorMissing"));

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
          (v: Record<string, unknown>) =>
            v.vouch_id?.toString() === searchValue ||
            v.id?.toString() === searchValue,
        );

        if (!foundVoucher) {
          foundVoucher = vouchers.find(
            (v: Record<string, unknown>) =>
              v.vouch_id?.toString().includes(searchValue) ||
              v.id?.toString().includes(searchValue),
          );
        }

        if (foundVoucher) {
          const targetVouchId = foundVoucher.vouch_id;

          if (targetVouchId && Number(targetVouchId) > 0) {
            router.push(`/forms/delivery/${targetVouchId}?mode=preview`);
            setSearchTerm("");

            return;
          }
        }
      }

      toast.error(tDelivery("messages.notFound", { number: searchValue }));
    } catch (error) {
      console.error("Error searching voucher:", error);
      toast.error("حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى");
    }
  }, [searchTerm, t, tDelivery, router]);

  // ====================================
  // Save Voucher - حفظ السند
  // ====================================

  /** حفظ السند (إنشاء أو تعديل) */
  const saveVoucher = useCallback(async () => {
    // التحقق من التاريخ
    const today = new Date();

    today.setHours(23, 59, 59, 999);

    if (new Date(voucher.vouch_date) > today) {
      toast.error("لا يمكن إنشاء قيد بتاريخ أكبر من تاريخ اليوم");

      return;
    }

    // التحقق من اختيار العميل
    if (!voucher.cust_id) {
      toast.error("يرجى اختيار العميل");

      return;
    }

    // تجهيز بيانات الصناديق
    const boxesData: Array<{
      id: number;
      box_id: number;
      amount: number;
      vouch_notes: string;
      cost_id: number | null;
      inv_id?: number;
      close_weight?: number;
    }> = [];
    const currentBoxIds: number[] = [];

    for (const box of voucherBoxes) {
      if (box.box_id > 0 && box.amount > 0) {
        const id = box.id || 0;

        boxesData.push({
          id,
          box_id: box.box_id,
          amount: box.amount,
          vouch_notes: box.vouch_notes || "",
          cost_id: box.cost_id ?? null,
          inv_id: box.inv_id ?? undefined,
          close_weight: box.close_weight ?? undefined,
        });
        if (id > 0) currentBoxIds.push(id);
      }
    }

    if (boxesData.length === 0) {
      toast.error("يرجى إدخال صندوق واحد على الأقل");

      return;
    }

    setIsLoading(true);

    try {
      const goldDetailsData: Array<{
        id: number;
        vouch_id: number | string;
        item_id: number;
        k?: number;
        weight?: number;
        g_weight?: number;
        weight2?: number;
        g_weight2?: number;
        box_id?: number;
        notes: string;
        diff?: number;
        close_amt?: number;
        close_weight?: number;
        inv_id?: number;
        cost_id?: number;
        work_amt?: number;
        total_work?: number;
        qty?: number;
      }> = [];
      const currentGoldDetailIds: number[] = [];

      for (const detail of goldDetails) {
        if (detail.item_id > 0) {
          const id = detail.id || 0;

          goldDetailsData.push({
            id,
            vouch_id: voucher.vouch_id,
            item_id: detail.item_id,
            k: detail.k,
            weight: detail.weight,
            g_weight: detail.g_weight,
            weight2: detail.weight2,
            g_weight2: detail.g_weight2,
            box_id: detail.box_id,
            notes: detail.notes || "",
            diff: detail.diff,
            close_amt: detail.close_amt,
            close_weight: detail.close_weight,
            inv_id: detail.inv_id,
            cost_id: detail.cost_id,
            work_amt: detail.work_amt,
            total_work: detail.total_work,
            qty: detail.qty,
          });
          if (id > 0) currentGoldDetailIds.push(id);
        }
      }

      const currentBoxIdSet = new Set(currentBoxIds);
      const currentGoldDetailIdSet = new Set(currentGoldDetailIds);

      const deletedBoxIds = originalBoxes
        .filter((b) => b.id && b.id > 0 && !currentBoxIdSet.has(b.id))
        .map((b) => b.id as number);

      const deletedGoldDetailIds = originalGoldDetails
        .filter((d) => d.id && d.id > 0 && !currentGoldDetailIdSet.has(d.id))
        .map((d) => d.id as number);

      const voucherPayload = {
        vouch_id: voucher.vouch_id,
        vouch_date: voucher.vouch_date,
        vouch_type: vouchType,
        vouch_amt: 0,
        vouch_notes: voucher.vouch_notes || "",
        vouch_status: voucher.vouch_status || 1,
        pay_type: voucher.pay_type,
        ref_no: voucher.ref_no || "",
        opps_vouch: voucher.opps_vouch || 0,
        cust_id: voucher.cust_id,
        handling: voucher.handling || "",
        cost: voucher.cost_id || null,
      };

      const result =
        formMode === "edit"
          ? await updateDeliveryVoucherAction(
              voucherPayload,
              [],
              [],
              voucherRecordId,
              boxesData,
              deletedBoxIds,
              goldDetailsData,
              deletedGoldDetailIds,
            )
          : await createDeliveryVoucherAction(
              voucherPayload,
              [],
              boxesData,
              goldDetailsData,
            );

      if (result.success && result.data) {
        const { id: realId, vouch_id: realVouchId } = result.data;
        const targetId = realId || realVouchId;

        if (!targetId) {
          console.error("No ID returned from save action:", result.data);
          toast.error("تم الحفظ ولكن لم يتم العثور على معرف السند");

          return;
        }

        setVoucher((prev) => ({
          ...prev,
          commit: true,
          id: realId,
          vouch_id: realVouchId || prev.vouch_id,
        }));

        toast.success(result.message);

        const basePath =
          vouchType === 111 ? "/forms/receipt" : "/forms/delivery";

        router.push(`${basePath}/${targetId}?mode=preview`);
      } else {
        toast.error(result.message || "حدث خطأ أثناء الحفظ");
      }
    } catch (error) {
      console.error("Error saving voucher:", error);
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setIsLoading(false);
    }
  }, [
    voucher,
    voucherBoxes,
    goldDetails,
    originalBoxes,
    originalGoldDetails,
    vouchType,
    formMode,
    voucherRecordId,
    router,
  ]);

  // ====================================
  // Gold Details Handlers - دوال تفاصيل الذهب
  // ====================================

  /** إضافة صف ذهب جديد */
  const addGoldDetailRow = useCallback(() => {
    setGoldDetails((prev) => [
      ...prev,
      createEmptyGoldDetail(Number(voucher.vouch_id) || 0),
    ]);
  }, [voucher.vouch_id]);

  /** حذف صف ذهب */
  const removeGoldDetailRow = useCallback((index: number) => {
    setGoldDetails((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateGoldDetail = useCallback(
    (index: number, object: Partial<GVoucherDetail>) => {
      setGoldDetails((prev) => {
        const updated = prev.map((detail, i) => {
          if (i !== index) return detail;

          const newDetail = { ...detail, ...object };

          if ("weight" in object || "k" in object) {
            const weight =
              "weight" in object
                ? parseNumber(object.weight)
                : parseNumber(newDetail.weight);
            const k =
              "k" in object ? parseNumber(object.k) : parseNumber(newDetail.k);

            if (weight > 0 && k > 0) {
              newDetail.g_weight = calculateCalibratedGold(weight, k, 875);
            } else {
              newDetail.g_weight = undefined;
            }
          }

          if ("item_id" in object && object.item_id) {
            const numericValue = Number(object.item_id);
            const selectedItem = items.find(
              (item) => Number(item.id) === numericValue,
            );

            if (selectedItem) {
              const itemId =
                Number(selectedItem.id ?? numericValue) || numericValue;

              newDetail.item_id = itemId;
              newDetail.item_code =
                selectedItem.item_code ??
                selectedItem.code ??
                newDetail.item_code ??
                "";
              newDetail.item_name =
                selectedItem.item_name ??
                selectedItem.name ??
                newDetail.item_name ??
                "";

              const rawCategoryId =
                selectedItem.cat ??
                selectedItem.category ??
                selectedItem.category_id ??
                selectedItem.cat_id;
              const categoryId = parseNumber(rawCategoryId);
              const linkedCategory =
                categoryId > 0 ? categoryMap.get(categoryId) : undefined;

              let resolvedK = 0;

              if (linkedCategory) {
                resolvedK =
                  parseNumber(linkedCategory?.purity) ||
                  parseNumber(linkedCategory?.cat_purity) ||
                  parseNumber(linkedCategory?.k) ||
                  parseNumber(linkedCategory?.gauge) ||
                  parseNumber(linkedCategory?.carat);

                const resolvedBoxId = getCategoryBoxId(linkedCategory);

                if (
                  resolvedBoxId &&
                  (!newDetail.box_id || newDetail.box_id === 0)
                ) {
                  newDetail.box_id = resolvedBoxId;
                }
              }

              if (resolvedK <= 0) {
                resolvedK =
                  parseNumber(selectedItem.k) ||
                  parseNumber(selectedItem.item_k) ||
                  parseNumber(selectedItem.purity) ||
                  parseNumber(selectedItem.carat);
              }

              if (resolvedK > 0) {
                newDetail.k = resolvedK;
              }

              const itemWeight =
                parseNumber(selectedItem.item_weight) ||
                parseNumber(selectedItem.weight) ||
                parseNumber(selectedItem.itemWeight);

              if (itemWeight > 0) {
                newDetail.weight = itemWeight;
              }

              const itemGoldWeight =
                parseNumber(selectedItem.item_g_weight) ||
                parseNumber(selectedItem.g_weight) ||
                parseNumber(selectedItem.gWeight);

              if (itemGoldWeight > 0) {
                newDetail.g_weight = parseFloat(itemGoldWeight.toFixed(5));
              } else if (
                parseNumber(newDetail.weight) > 0 &&
                parseNumber(newDetail.k) > 0
              ) {
                newDetail.g_weight = calculateCalibratedGold(
                  parseNumber(newDetail.weight),
                  parseNumber(newDetail.k),
                  875,
                );
              } else {
                newDetail.g_weight = undefined;
              }
            }
          }

          if ("work_amt" in object || "weight" in object) {
            const workAmt =
              "work_amt" in object
                ? parseNumber(object.work_amt)
                : parseNumber(newDetail.work_amt);
            const weight =
              "weight" in object
                ? parseNumber(object.weight)
                : parseNumber(newDetail.weight);

            if (workAmt > 0 && weight > 0) {
              newDetail.total_work = parseFloat((workAmt * weight).toFixed(2));
            } else {
              newDetail.total_work = undefined;
            }
          }

          return newDetail;
        });

        return updated;
      });
    },
    [categoryMap, items],
  );

  /** الحصول على قيمة مركز التكلفة لصف الذهب */
  const getCostCenterValueForGold = useCallback(
    (detail: GVoucherDetail) => {
      const val = getCostCenterSelectValue(detail.cost_id);

      return val ? { ...val, value: String(val.value) } : null;
    },
    [getCostCenterSelectValue],
  );

  /** تغيير مركز التكلفة لصف الذهب */
  const handleCostCenterChange = useCallback(
    (
      index: number,
      selectedOption: { value: string; label: string } | null,
    ) => {
      updateGoldDetail(index, {
        cost_id: selectedOption ? parseNumber(selectedOption.value) : undefined,
      });
    },
    [updateGoldDetail],
  );

  // ====================================
  // Voucher Box Handlers - دوال صناديق السند
  // ====================================

  /** إضافة صف صندوق جديد */
  const addVoucherBoxRow = useCallback(() => {
    setVoucherBoxes((prev) => [
      ...prev,
      {
        id: 0,
        vouch_id: voucher.id || 0,
        box_id: 0,
        amount: 0,
        vouch_notes: "",
        cost_id: undefined,
        inv_id: undefined,
        close_weight: undefined,
        cr_date: new Date().toISOString(),
      },
    ]);
  }, [voucher.id]);

  /** تحديث بيانات صف الصندوق */
  const updateVoucherBox = useCallback(
    (index: number, field: keyof VoucherBox, value: unknown) => {
      setVoucherBoxes((prev) =>
        prev.map((box, i) => (i === index ? { ...box, [field]: value } : box)),
      );
    },
    [],
  );

  /** حذف صف صندوق */
  const removeVoucherBoxRow = useCallback((index: number) => {
    setVoucherBoxes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ====================================
  // Box Select Options - خيارات الصناديق
  // ====================================

  /** خيارات صناديق النقدية */
  const cashBoxSelectOptions = useMemo(() => {
    return (boxes || []).map((box) => ({
      value: box.id as number,
      label: box.cust_name || box.name || box.box_name || `صندوق ${box.id}`,
    }));
  }, [boxes]);

  /** خيارات صناديق الذهب */
  const goldBoxSelectOptions = useMemo(() => {
    // إذا كانت صناديق الذهب موجودة نستخدمها، وإلا نستخدم الصناديق العادية
    const source = goldBoxes && goldBoxes.length > 0 ? goldBoxes : boxes;

    return (source || []).map((box) => ({
      value: box.id as number,
      label: box.cust_name || box.name || box.box_name || `صندوق ${box.id}`,
    }));
  }, [goldBoxes, boxes]);

  // ====================================
  // Totals Calculation - حساب الإجماليات
  // ====================================

  /** حساب إجماليات السند */
  const totals = useMemo(() => {
    const totalGoldWeight = goldDetails.reduce(
      (sum, item) => sum + (Number(item.weight) || 0),
      0,
    );
    const totalGoldGWeight = goldDetails.reduce(
      (sum, item) => sum + (Number(item.g_weight) || 0),
      0,
    );
    const totalWork = goldDetails.reduce(
      (sum, item) => sum + (Number(item.total_work) || 0),
      0,
    );
    const totalBoxes = voucherBoxes.reduce(
      (sum, box) => sum + (Number(box.amount) || 0),
      0,
    );

    return {
      totalGoldWeight,
      totalGoldGWeight,
      totalWork,
      totalBoxes,
    };
  }, [goldDetails, voucherBoxes]);

  // ====================================
  // Print Handler - الطباعة
  // ====================================

  /** طباعة السند */
  const printVoucher = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
    }, 1000);
  };

  // ====================================
  // Return Value - القيمة المرجعة
  // ====================================

  return useMemo(
    () => ({
      // Search & Save - البحث والحفظ
      handleSearch,
      saveVoucher,

      // UI State - حالة الواجهة
      isLoading,
      isEditing,
      isPrinting,
      printVoucher,
      searchTerm,
      setSearchTerm,

      // Voucher Data - بيانات السند
      voucher,
      setVoucher,
      voucherNumber,
      hasVoucherId,

      // Gold Details - تفاصيل الذهب
      goldDetails,
      setGoldDetails,
      addGoldDetailRow,
      removeGoldDetailRow,
      updateGoldDetail,
      getCostCenterValueForGold,
      handleCostCenterChange,

      // Voucher Boxes - صناديق السند
      voucherBoxes,
      setVoucherBoxes,
      addVoucherBoxRow,
      updateVoucherBox,
      removeVoucherBoxRow,
      setOriginalBoxes,
      setOriginalGoldDetails,

      // Items - الأصناف
      items,
      loadItemOptions,
      getItemSelectValue,
      getDefaultItemOptions,

      // Customers - العملاء
      customers,
      selectedCustomer,
      setSelectedCustomer,
      defaultCustomerOptions,
      loadCustomerOptions,
      getCustomerSelectValue,
      getCostomerOptions,

      // Cost Centers - مراكز التكلفة
      costCenters,
      costCenterSelectOptions,
      costCenterOptionsWithStringValue,
      getCostCenterSelectValue,

      // Box Options - خيارات الصناديق
      cashBoxSelectOptions,
      goldBoxSelectOptions,

      // Totals - الإجماليات
      totals,
    }),
    [
      // Search & Save
      handleSearch,
      saveVoucher,

      // UI State
      isLoading,
      isEditing,
      isPrinting,
      searchTerm,

      // Voucher Data
      voucher,
      voucherNumber,
      hasVoucherId,

      // Gold Details
      goldDetails,
      addGoldDetailRow,
      removeGoldDetailRow,
      updateGoldDetail,
      getCostCenterValueForGold,
      handleCostCenterChange,

      // Voucher Boxes
      voucherBoxes,
      addVoucherBoxRow,
      updateVoucherBox,
      removeVoucherBoxRow,

      // Items
      items,
      loadItemOptions,
      getItemSelectValue,
      getDefaultItemOptions,

      // Customers
      customers,
      selectedCustomer,
      defaultCustomerOptions,
      loadCustomerOptions,
      getCustomerSelectValue,
      getCostomerOptions,

      // Cost Centers
      costCenters,
      costCenterSelectOptions,
      costCenterOptionsWithStringValue,
      getCostCenterSelectValue,

      // Box Options
      cashBoxSelectOptions,
      goldBoxSelectOptions,

      // Totals
      totals,
    ],
  );
}
