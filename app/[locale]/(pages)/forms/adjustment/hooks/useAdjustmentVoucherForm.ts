import type { Voucher, VoucherDetail } from "@/types/voucher";
import type {
  SaveVoucherData,
  VoucherDetailData,
} from "@/app/actions/voucher/helpers/types";
import type { CaratType, CostCenter } from "@/types/voucher-form";
import type { Account } from "@/types/models/account";

import { useCallback, useState, useRef, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import { calculateAdjustmentTotals } from "../utilities/adjustmentCalculations";

import { getAccountGauge } from "@/utilities/voucherForm";
import {
  createAdjustmentVoucherAction,
  updateAdjustmentVoucherAction,
  getNextAdjustmentVoucherNumberAction,
} from "@/app/actions/adjustment-voucher";
import { adjustmentVoucherService } from "@/services/api/adjustment-voucher.service";
import { redirectToLogin } from "@/app/actions/auth";

/**
 * Props for the AdjustmentVoucherForm hook.
 */
export interface AdjustmentVoucherFormProps {
  /** Mode of the form: new creation, editing existing, or previewing. */
  formMode: "new" | "edit" | "preview";
  /** Initial details for the voucher (rows). */
  voucherDetailsData?: VoucherDetail[];
  /** Initial voucher data (header). */
  voucherData?: Voucher | null;
  /** List of available accounts for selection. */
  accounts: Account[];
  /** List of carat types for gauge calculation. */
  caratTypes: CaratType[];
}

/**
 * Default initial state for a new voucher.
 */
export const initialVoucher: Voucher = {
  vouch_id: 0,
  vouch_type: 3, // Adjustment
  vouch_date: new Date().toISOString(),
  vouch_amt: 0,
  vouch_notes: "",
  vouch_status: 1, // Active/Draft
  cr_date: new Date().toISOString(),
  acc_id: null,
  cur_id: 1, // Default SAR
  cust_id: null,
  cust: null,
  cust_name: "",
  details: [],
  // Common fields often required or useful
  com: 1,
  com_id: 1,
  year_id: 1,
  post: false,
  print: false,
  pay_type: 1, // Default Cash
  cost_id: 1, // Default Main Cost Center
};

/**
 * Default initial state for a new voucher detail row.
 */
const initialDetail: VoucherDetail = {
  id: 0,
  vouch_id: 0,
  acc_id: 0,
  acc_code: "",
  acc_name: "",
  debit: undefined,
  credit: undefined,
  debit_g: undefined,
  credit_g: undefined,
  gauge: 875,
  cost_id: 0,
  vouch_notes: "",
  cr_date: new Date().toISOString(),
};

const EMPTY_DETAILS: VoucherDetail[] = [];

/**
 * Validates the voucher data before saving.
 * Checks dates, presence of details, and validity of rows.
 */
const validateAdjustmentVoucher = (
  voucher: Voucher,
  details: VoucherDetail[],
): boolean => {
  const today = new Date();

  today.setHours(23, 59, 59, 999);

  if (new Date(voucher.vouch_date) > today) {
    toast.error("لا يمكن إنشاء قيد بتاريخ أكبر من تاريخ اليوم");

    return false;
  }

  if (details.length === 0) {
    toast.error("يجب إضافة تفاصيل للقيد");

    return false;
  }

  for (const detail of details) {
    if (!detail.acc_id) {
      toast.error("يجب اختيار حساب لكل سطر");

      return false;
    }
    // Check if both debit and credit are missing/zero-ish (assuming undefined/null checks are sufficient)
    if (
      (detail.debit === undefined || detail.debit === null) &&
      (detail.credit === undefined || detail.credit === null)
    ) {
      toast.error("يجب إدخال مبلغ مدين أو دائن لكل سطر");

      return false;
    }
  }

  return true;
};

/**
 * Maps voucher and details to the structure expected by the API actions.
 */
const mapVoucherToApiData = (
  voucher: Voucher,
  details: VoucherDetail[],
): {
  voucherData: Omit<SaveVoucherData, "vouch_type">;
  detailsData: VoucherDetailData[];
} => {
  const voucherData: Omit<SaveVoucherData, "vouch_type"> = {
    vouch_id: voucher.vouch_id,
    vouch_date: voucher.vouch_date,
    vouch_amt: voucher.vouch_amt || 0,
    vouch_notes: voucher.vouch_notes || "",
    vouch_status: voucher.vouch_status || 1,
    ref_no: voucher.ref_no || "",
    cost_id: voucher.cost_id || 1, // Ensure cost_id is not null
    pay_type: voucher.pay_type || 1, // Required by API
  };

  const detailsData: VoucherDetailData[] = details.map((d) => ({
    id: d.id,
    vouch_id: voucher.vouch_id,
    acc_id: d.acc_id,
    debit: d.debit ?? undefined,
    credit: d.credit ?? undefined,
    gauge: d.gauge ?? undefined,
    vouch_notes: d.vouch_notes,
    cost_id: d.cost_id,
    // Ensure all necessary fields are mapped
    debit_base: d.debit_base,
    credit_base: d.credit_base,
    p_debit: d.p_debit ?? undefined,
    p_credit: d.p_credit ?? undefined,
    g_debit: d.g_debit,
    g_credit: d.g_credit,
    g_debit_base: d.g_debit_base,
    g_credit_base: d.g_credit_base,
    debit_g: d.debit_g,
    credit_g: d.credit_g,
  }));

  return { voucherData, detailsData };
};

/**
 * Custom hook to manage the state and logic for the Adjustment Voucher Form.
 * Handles voucher data, details grid, validation, saving, and searching.
 */
export function useAdjustmentVoucherForm({
  formMode,
  initialVoucherNumber,
  voucherDetailsData = EMPTY_DETAILS,
  voucherData,
  accounts,
  caratTypes,
}: AdjustmentVoucherFormProps & { initialVoucherNumber?: number }) {
  const router = useRouter();
  const locale = useLocale();

  // Initialize voucher state
  const [voucher, setVoucher] = useState<Voucher>(
    voucherData
      ? { ...initialVoucher, ...voucherData }
      : {
          ...initialVoucher,
          vouch_id: initialVoucherNumber || 0,
        },
  );

  const [details, setDetails] = useState<VoucherDetail[]>(voucherDetailsData);
  const [originalDetails, setOriginalDetails] = useState<VoucherDetail[]>([]);
  const isEditing = formMode === "edit" || formMode === "new";

  const [isLoading, setIsLoading] = useState(
    !initialVoucherNumber && formMode === "new",
  );
  const [isPrinting, setIsPrinting] = useState(false);
  const hasGeneratedVoucherNumber = useRef(!!initialVoucherNumber);

  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Memoized calculations
  const totals = useMemo(() => calculateAdjustmentTotals(details), [details]);

  // Derived state for balance check (Performance optimization: verify on render/memo instead of effect)
  const isVoucherBalanced = useMemo(() => {
    const totalDebit = details.reduce(
      (acc, detail) => acc + (detail.debit || 0),
      0,
    );
    const totalCredit = details.reduce(
      (acc, detail) => acc + (detail.credit || 0),
      0,
    );

    // Use a small epsilon for floating point comparison if necessary, but exact match is standard for currency if integers/fixed
    return Math.abs(totalDebit - totalCredit) < 0.001; // handling floating point errors
  }, [details]);

  /**
   * Adds a new empty row to the details grid.
   */
  const addDetailRow = useCallback(() => {
    setDetails((prev) => [
      ...prev,
      { ...initialDetail, vouch_id: voucher.vouch_id },
    ]);
  }, [voucher.vouch_id]);

  /**
   * Removes a row from the details grid by index.
   */
  const removeDetailRow = useCallback((index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Updates a specific row in the details grid.
   * Automatically recalculates gauge if account changes.
   */
  const updateDetail = useCallback(
    (index: number, newValues: Partial<VoucherDetail>) => {
      setDetails((prev) =>
        prev.map((detail, i) => {
          if (i !== index) return detail;

          const updatedDetail = { ...detail, ...newValues };

          // If account changed, update gauge automatically
          if (
            newValues.acc_id !== undefined &&
            newValues.acc_id !== detail.acc_id
          ) {
            const selectedAccount = accounts.find(
              (acc) => acc.id === newValues.acc_id,
            );
            const gauge = getAccountGauge(selectedAccount, caratTypes);

            updatedDetail.gauge = gauge;
          }

          return updatedDetail;
        }),
      );
    },
    [accounts, caratTypes],
  );

  /**
   * Search for a voucher by ID and navigate to it.
   */
  const handleSearch = useCallback(async () => {
    if (!searchTerm) return;
    try {
      const response = await adjustmentVoucherService.getById(searchTerm);

      if (
        response.success &&
        response.data &&
        response.data.results.length > 0
      ) {
        // Optimistic navigation: valid voucher found
        router.push(`/forms/adjustment/${response.data.results[0].vouch_id}`);

        return;
      }

      toast.error(`لم يتم العثور على قيد تسوية برقم: ${searchTerm}`);
    } catch (error) {
      await redirectToLogin();
      console.error("Search error:", error);
      toast.error("حدث خطأ أثناء البحث");
    }
  }, [searchTerm, router]);

  /**
   * Generates the next available voucher number from the server.
   */
  const generateNextAdjustmentVoucherNumber = useCallback(async () => {
    if (hasGeneratedVoucherNumber.current || formMode !== "new") return;

    try {
      setIsLoading(true);
      const nextNumber = await getNextAdjustmentVoucherNumberAction();

      if (nextNumber) {
        setVoucher((prev) => ({
          ...prev,
          vouch_id: nextNumber,
          vouch_date: new Date().toISOString(),
          cr_date: new Date().toISOString(),
        }));
        hasGeneratedVoucherNumber.current = true;
      }
    } catch (error) {
      console.error("Error generating next voucher number:", error);
    } finally {
      setIsLoading(false);
    }
  }, [formMode]);

  /**
   * Updates the cost center for the voucher header and all details.
   */
  const handleCostCenter = useCallback((costCenter: CostCenter) => {
    setVoucher((prev) => ({
      ...prev,
      cost_id: costCenter.id,
    }));
    setDetails((prev) =>
      prev.map((detail) => ({
        ...detail,
        cost_id: costCenter.id,
      })),
    );
  }, []);

  /**
   * Saves the voucher to the database (create or update).
   */
  const saveVoucher = useCallback(async () => {
    if (!validateAdjustmentVoucher(voucher, details)) return;

    setIsSaving(true);
    try {
      const { voucherData, detailsData } = mapVoucherToApiData(
        voucher,
        details,
      );

      let result;

      if (formMode === "new") {
        result = await createAdjustmentVoucherAction(voucherData, detailsData);
      } else {
        // Calculate deleted IDs for update
        const deletedDetailIds = originalDetails
          .filter(
            (od) => !details.some((d) => d.id === od.id && d.id !== undefined),
          )
          .map((d) => d.id)
          .filter((id): id is number => id !== undefined);

        result = await updateAdjustmentVoucherAction(
          voucherData,
          detailsData,
          deletedDetailIds,
          Number(voucher.id), // voucherRecordId
        );
      }

      if (result.success) {
        toast.success(
          formMode === "new"
            ? "تم إنشاء قيد التسوية بنجاح"
            : "تم تحديث قيد التسوية بنجاح",
        );
        router.push(
          `/${locale}/forms/adjustment/${result.data?.vouch_id}?mode=preview`,
        );
      } else {
        toast.error(result.message || "حدث خطأ أثناء حفظ القيد");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsSaving(false);
    }
  }, [voucher, details, formMode, originalDetails, router, locale]);

  /**
   * Handles the print action (visual feedback only for now).
   */
  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
    }, 1000);
  }, []);

  // Initialize new form: generate number and set default rows
  useEffect(() => {
    if (formMode === "new") {
      if (!initialVoucherNumber) {
        generateNextAdjustmentVoucherNumber();
      }
      // Populate with 2 empty rows by default for new vouchers
      setDetails([
        { ...initialDetail, vouch_id: initialVoucherNumber || 0 },
        { ...initialDetail, vouch_id: initialVoucherNumber || 0 },
      ]);
      if (voucherDetailsData && voucherDetailsData.length > 0) {
        setOriginalDetails([...voucherDetailsData]);
      }
    }
  }, [
    formMode,
    generateNextAdjustmentVoucherNumber,
    initialVoucherNumber,
    voucherDetailsData,
  ]);

  return {
    voucher,
    setVoucher,
    isEditing,
    isLoading,
    isPrinting,
    isSaving,
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
    totals,
  };
}
