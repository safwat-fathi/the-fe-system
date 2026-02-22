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

import {
  calculateVoucherTotals,
  isVoucherBalanced,
} from "@/utilities/voucher/balance";
import {
  getAccountGauge,
  calculateCalibratedGold,
  calculateReverseCalibratedGold,
  calculateGaugeFromCalibrated,
} from "@/utilities/voucherForm";
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
  cost_id: null, // Default to null (no cost center selected)
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

const parseNum = (val: any) =>
  val !== undefined && val !== null && val !== "" ? Number(val) : 0;

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

  const voucherRef = useRef(voucher);

  voucherRef.current = voucher;

  const detailsRef = useRef(details);

  detailsRef.current = details;

  const originalDetailsRef = useRef(originalDetails);

  originalDetailsRef.current = originalDetails;

  // Memoized calculations
  const totals = useMemo(() => calculateVoucherTotals(details), [details]);

  // Derived state for balance check
  const isBalanced = useMemo(() => isVoucherBalanced(totals), [totals]);

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

          if (newValues.debit !== undefined && parseNum(newValues.debit) > 0) {
            updatedDetail.credit = undefined;
          }
          if (
            newValues.credit !== undefined &&
            parseNum(newValues.credit) > 0
          ) {
            updatedDetail.debit = undefined;
          }

          if (
            newValues.g_debit !== undefined &&
            parseNum(newValues.g_debit) > 0
          ) {
            updatedDetail.g_credit = undefined;
          }
          if (
            newValues.g_credit !== undefined &&
            parseNum(newValues.g_credit) > 0
          ) {
            updatedDetail.g_debit = undefined;
          }

          if (
            newValues.g_debit_base !== undefined &&
            parseNum(newValues.g_debit_base) > 0
          ) {
            updatedDetail.g_credit_base = undefined;
          }
          if (
            newValues.g_credit_base !== undefined &&
            parseNum(newValues.g_credit_base) > 0
          ) {
            updatedDetail.g_debit_base = undefined;
          }

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

          const baseGauge = 875;
          const currentGauge = parseNum(updatedDetail.gauge) || baseGauge;

          // 1. If g_debit (Outstanding Debit) changed -> Calculate g_debit_base (Calibrated)
          if ("g_debit" in newValues) {
            const gDebit = parseNum(newValues.g_debit);

            if (gDebit > 0 && currentGauge > 0) {
              updatedDetail.g_debit_base = calculateCalibratedGold(
                gDebit,
                currentGauge,
                baseGauge,
                2,
              );
            } else {
              updatedDetail.g_debit_base = undefined;
            }
          }

          // 2. If g_credit (Outstanding Credit) changed -> Calculate g_credit_base (Calibrated)
          if ("g_credit" in newValues) {
            const gCredit = parseNum(newValues.g_credit);

            if (gCredit > 0 && currentGauge > 0) {
              updatedDetail.g_credit_base = calculateCalibratedGold(
                gCredit,
                currentGauge,
                baseGauge,
                2,
              );
            } else {
              updatedDetail.g_credit_base = undefined;
            }
          }

          // 3. If g_debit_base (Calibrated Debit) changed -> Calculate g_debit or Gauge
          if ("g_debit_base" in newValues) {
            const gDebitBase = parseNum(newValues.g_debit_base);

            if (gDebitBase > 0) {
              const currentGDebit = parseNum(updatedDetail.g_debit);

              // Normalize base to 2 decimals as per reference logic
              const normalizedBase = parseFloat(gDebitBase.toFixed(2));

              updatedDetail.g_debit_base = normalizedBase;

              if (currentGDebit > 0) {
                // Return Gauge from Calibrated
                updatedDetail.gauge = calculateGaugeFromCalibrated(
                  normalizedBase,
                  currentGDebit,
                  baseGauge,
                  3,
                );
              } else {
                // Calculate Reverse
                updatedDetail.g_debit = calculateReverseCalibratedGold(
                  normalizedBase,
                  currentGauge,
                  baseGauge,
                );
              }
            } else {
              // If base is cleared, but main value exists, keep main value?
              // The original logic clears base if main is cleared.
            }
          }

          // 4. If g_credit_base (Calibrated Credit) changed -> Calculate g_credit or Gauge
          if ("g_credit_base" in newValues) {
            const gCreditBase = parseNum(newValues.g_credit_base);

            if (gCreditBase > 0) {
              const currentGCredit = parseNum(updatedDetail.g_credit);

              // Normalize base to 2 decimals
              const normalizedBase = parseFloat(gCreditBase.toFixed(2));

              updatedDetail.g_credit_base = normalizedBase;

              if (currentGCredit > 0) {
                // Return Gauge from Calibrated
                updatedDetail.gauge = calculateGaugeFromCalibrated(
                  normalizedBase,
                  currentGCredit,
                  baseGauge,
                  3,
                );
              } else {
                // Calculate Reverse
                updatedDetail.g_credit = calculateReverseCalibratedGold(
                  normalizedBase,
                  currentGauge,
                  baseGauge,
                );
              }
            }
          }

          // 5. If Gauge changed -> Recalculate Bases
          if (parseNum(updatedDetail.gauge) !== parseNum(detail.gauge)) {
            const newGauge = parseNum(updatedDetail.gauge);

            if (newGauge > 0) {
              if (parseNum(updatedDetail.g_debit) > 0) {
                updatedDetail.g_debit_base = calculateCalibratedGold(
                  parseNum(updatedDetail.g_debit),
                  newGauge,
                  baseGauge,
                  2,
                );
              }
              if (parseNum(updatedDetail.g_credit) > 0) {
                updatedDetail.g_credit_base = calculateCalibratedGold(
                  parseNum(updatedDetail.g_credit),
                  newGauge,
                  baseGauge,
                  2,
                );
              }
            }
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
    const currentVoucher = voucherRef.current;
    const currentDetails = detailsRef.current;

    if (!validateAdjustmentVoucher(currentVoucher, currentDetails)) return;

    setIsSaving(true);
    try {
      const { voucherData, detailsData } = mapVoucherToApiData(
        currentVoucher,
        currentDetails,
      );

      let result;

      if (formMode === "new") {
        result = await createAdjustmentVoucherAction(voucherData, detailsData);
      } else {
        const currentOriginalDetails = originalDetailsRef.current;
        const deletedDetailIds = currentOriginalDetails
          .filter(
            (od) =>
              !currentDetails.some((d) => d.id === od.id && d.id !== undefined),
          )
          .map((d) => d.id)
          .filter((id): id is number => id !== undefined);

        result = await updateAdjustmentVoucherAction(
          voucherData,
          detailsData,
          deletedDetailIds,
          Number(currentVoucher.id),
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
  }, [formMode, router, locale]);

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

  /**
   * Update voucher type and regenerate number if needed.
   */
  const updateVoucherType = useCallback(
    async (newType: number) => {
      setVoucher((prev) => ({ ...prev, vouch_type: newType }));

      if (formMode === "new") {
        try {
          setIsLoading(true);
          const nextNumber = await getNextAdjustmentVoucherNumberAction();

          if (nextNumber) {
            setVoucher((prev) => ({
              ...prev,
              vouch_id: nextNumber,
            }));
          }
        } catch (error) {
          console.error("Error updating voucher type number:", error);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [formMode],
  );

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
    updateVoucherType,
    isVoucherBalanced: isBalanced,
    totals,
  };
}
