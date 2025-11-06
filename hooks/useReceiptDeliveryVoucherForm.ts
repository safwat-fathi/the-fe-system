import type { Voucher, VoucherBox, GVoucherDetail } from "@/types/voucher";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { voucherService, itemService, customerService } from "@/services/api";
import {
  createVoucherAction,
  updateVoucherAction,
} from "@/app/actions/voucher.action";
import { parseNumber, calculateCalibratedGold } from "@/utilities/voucherForm";

interface UseReceiptDeliveryVoucherFormProps {
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
  vouchType: number; // 111 للاستلام، 222 للتسليم
  formMode?: "new" | "edit" | "preview";
}

export const useReceiptDeliveryVoucherForm = ({
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
}: UseReceiptDeliveryVoucherFormProps) => {
  const router = useRouter();

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
  const [goldBoxes, setGoldBoxes] = useState<any[]>(
    initialGoldBoxes && initialGoldBoxes.length > 0
      ? initialGoldBoxes
      : initialBoxes,
  );
  const [costCenters, setCostCenters] = useState<any[]>(initialCostCenters);
  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  const [items, setItems] = useState<any[]>(initialItems);
  const [voucherTypes, setVoucherTypes] = useState<any[]>(initialVoucherTypes);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [defaultCustomerOptions, setDefaultCustomerOptions] = useState<any[]>(
    [],
  );
  const [originalBoxes, setOriginalBoxes] = useState<VoucherBox[]>([]);
  const [originalGoldDetails, setOriginalGoldDetails] = useState<
    GVoucherDetail[]
  >([]);

  const hasGeneratedVoucherNumber = useRef(false);

  // Initialize component
  useEffect(() => {
    setIsClient(true);
    updateCurrentTime();

    if (isNewVoucher) {
      generateNextVoucherNumber();
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

      if (voucherData?.cust_id) {
        const customer = customers.find((c) => c.id === voucherData.cust_id);

        if (customer) {
          setSelectedCustomer(customer);
        }
      }
    }

    if (initialCustomers && initialCustomers.length > 0) {
      const options = initialCustomers.map((customer: any) => ({
        value: customer.id,
        label: `${customer.cust_code || ""} - ${customer.cust_name || ""}`,
        customer: customer,
      }));

      setDefaultCustomerOptions(options);
    }
  }, []);

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
    if (initialGoldBoxes && initialGoldBoxes.length > 0) {
      setGoldBoxes(initialGoldBoxes);
    } else if (!initialGoldBoxes || initialGoldBoxes.length === 0) {
      setGoldBoxes(initialBoxes);
    }
  }, [initialGoldBoxes, initialBoxes]);

  useEffect(() => {
    if (formMode === "preview") {
      setIsEditing(false);
    } else if (formMode === "new") {
      setIsEditing(true);
    } else if (formMode === "edit") {
      setIsEditing(startInEditMode !== false);
    }
  }, [formMode, startInEditMode]);

  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(updateCurrentTime, 1000);

    return () => clearInterval(interval);
  }, [isClient]);

  // Helper Functions
  const updateCurrentTime = () => {
    const now = new Date();

    setCurrentTime(now.toLocaleTimeString("ar-EG"));
  };

  const generateNextVoucherNumber = async () => {
    try {
      const nextId = await voucherService.getNextNumber(vouchType);

      setVoucher((prev) => ({
        ...prev,
        vouch_id: nextId,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString(),
      }));
      hasGeneratedVoucherNumber.current = true;
    } catch (error) {
      setVoucher((prev) => ({
        ...prev,
        vouch_id: 1,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString(),
      }));
    }
  };

  // Load item options with pagination
  const loadItemOptions = async (
    search: string,
    loadedOptions: any[],
    { page }: { page: number },
  ) => {
    try {
      const trimmed = search.trim();
      const result = await itemService.searchItems({
        query: trimmed || "",
        page: page || 1,
        companyId: 1,
      });

      if (!result || !result.results) {
        return { options: [], hasMore: false, additional: { page: 1 } };
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

  // Load customer options
  const loadCustomerOptions = async (search: string = ""): Promise<any[]> => {
    try {
      let allCustomers =
        customers.length > 0 ? customers : initialCustomers || [];

      if (allCustomers.length === 0) {
        const apiCustomers = await customerService.getAllCustomers({
          xcom_id: 1,
        });

        if (Array.isArray(apiCustomers) && apiCustomers.length > 0) {
          allCustomers = apiCustomers;
          setCustomers(apiCustomers);
        }
      }

      const term = search.trim().toLowerCase();
      const filteredCustomers = term
        ? allCustomers.filter((customer: any) => {
            const custCode = String(customer.cust_code ?? "").toLowerCase();
            const custName = String(customer.cust_name ?? "").toLowerCase();

            return custCode.includes(term) || custName.includes(term);
          })
        : allCustomers;

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

  // Voucher Boxes Management
  const updateVoucherBox = (index: number, field: string, value: any) => {
    setVoucherBoxes((prev) => {
      const updated = prev.map((box, i) => {
        if (i === index) {
          const updatedBox = { ...box, [field]: value };

          if (field === "box_id" && (!value || value === 0)) {
            updatedBox.box = undefined;
          } else if (field === "box_id" && value && value > 0) {
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

  const removeVoucherBoxRow = (index: number) => {
    setVoucherBoxes((prev) => prev.filter((_, i) => i !== index));
  };

  // Gold Details Management with automatic total_work calculation
  const updateGoldDetail = (index: number, field: string, value: any) => {
    setGoldDetails((prev) => {
      const updated = prev.map((detail, i) => {
        if (i !== index) return detail;

        const newDetail = { ...detail, [field]: value };

        // حساب تلقائي للوزن المعاير: g_weight = weight * (k / 875)
        if (field === "weight" || field === "k") {
          const weight =
            field === "weight"
              ? parseNumber(value)
              : parseNumber(newDetail.weight);
          const k =
            field === "k" ? parseNumber(value) : parseNumber(newDetail.k);

          if (weight > 0 && k > 0) {
            newDetail.g_weight = calculateCalibratedGold(weight, k, 875);
          } else {
            newDetail.g_weight = undefined;
          }
        }

        // حساب تلقائي للأجور: total_work = work_amt * weight
        if (field === "work_amt" || field === "weight") {
          const workAmt =
            field === "work_amt"
              ? parseNumber(value)
              : parseNumber(newDetail.work_amt);
          const weight =
            field === "weight"
              ? parseNumber(value)
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
  };

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

  const removeGoldDetailRow = (index: number) => {
    setGoldDetails((prev) => prev.filter((_, i) => i !== index));
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

    const totalWork = goldDetails.reduce(
      (sum, detail) => sum + (detail.total_work || 0),
      0,
    );

    return { totalBoxes, totalGoldWeight, totalGoldGWeight, totalWork };
  }, [voucherBoxes, goldDetails]);

  // Save voucher
  const saveVoucher = async () => {
    const voucherDate = new Date(voucher.vouch_date);
    const today = new Date();

    today.setHours(23, 59, 59, 999);

    if (voucherDate > today) {
      toast.error("لا يمكن إنشاء قيد بتاريخ أكبر من تاريخ اليوم");

      return;
    }

    if (!voucher.cust_id || voucher.cust_id === 0) {
      toast.error("يرجى اختيار العميل");

      return;
    }

    const validBoxes = voucherBoxes.filter(
      (box) => box.box_id && box.box_id > 0 && box.amount && box.amount > 0,
    );

    if (validBoxes.length === 0) {
      toast.error("يرجى إدخال صندوق واحد على الأقل");

      return;
    }

    setIsLoading(true);

    try {
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
        cust_id: voucher.cust_id,
        handling: voucher.handling || "",
        cost_id: voucher.cost_id || null,
      };

      const boxesData = validBoxes.map((box) => ({
        id: box.id || 0,
        box_id: box.box_id,
        amount: box.amount,
        vouch_notes: box.vouch_notes || "",
        cost_id: box.cost_id || null,
        inv_id: box.inv_id || null,
        close_weight: box.close_weight || null,
      }));

      const goldDetailsData = goldDetails
        .filter((detail) => detail.item_id && detail.item_id > 0)
        .map((detail) => ({
          id: detail.id || 0,
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
        }));

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
        const realVouchId = result.data.vouch_id;

        console.log("Voucher saved successfully:", {
          realId,
          realVouchId,
          resultData: result.data,
          vouchType,
        });

        setVoucher((prev) => ({
          ...prev,
          commit: true,
          id: realId,
          vouch_id: realVouchId || voucher.vouch_id,
        }));

        toast.success(result.message);

        const basePath =
          vouchType === 111 ? "/forms/receipt" : "/forms/delivery";

        // استخدام id أولاً، وإذا لم يكن موجوداً، استخدام vouch_id
        const targetId = realId || realVouchId;
        
        console.log("Redirecting to:", `${basePath}/${targetId}?mode=preview`);
        
        if (targetId) {
          // إضافة delay صغير للتأكد من أن البيانات تم حفظها في قاعدة البيانات
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          router.push(`${basePath}/${targetId}?mode=preview`);
          router.refresh(); // إجبار Next.js على إعادة جلب البيانات من الخادم
        } else {
          console.error("No ID returned from save action:", result.data);
          toast.error("تم الحفظ ولكن لم يتم العثور على معرف السند");
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

  // Print voucher (simplified)
  const printVoucher = async () => {
    setIsPrinting(true);
    try {
      const printWindow = window.open("", "_blank");

      if (printWindow) {
        // Note: Full HTML/CSS will be moved to a separate utility function
        const voucherTypeName = vouchType === 111 ? "سند استلام" : "سند تسليم";

        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <meta charset="UTF-8">
              <title>${voucherTypeName} - ${voucher.vouch_id}</title>
            </head>
            <body>
              <h1>${voucherTypeName}</h1>
              <div>رقم السند: ${voucher.vouch_id || "-"}</div>
              <div>العميل: ${selectedCustomer?.cust_name || "-"}</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        setVoucher((prev) => ({ ...prev, print: true }));
      }
    } catch (error) {
      toast.error(
        `حدث خطأ أثناء الطباعة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return {
    // State
    voucher,
    setVoucher,
    voucherBoxes,
    setVoucherBoxes,
    goldDetails,
    setGoldDetails,
    accounts,
    boxes,
    goldBoxes,
    setGoldBoxes,
    costCenters,
    customers,
    setCustomers,
    items,
    setItems,
    voucherTypes,
    isLoading,
    isEditing,
    setIsEditing,
    isPrinting,
    selectedCustomer,
    setSelectedCustomer,
    defaultCustomerOptions,
    isClient,
    currentTime,

    // Totals
    totals,

    // Functions
    updateCurrentTime,
    generateNextVoucherNumber,
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
  };
};
