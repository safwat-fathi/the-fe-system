import type { Voucher, VoucherDetail } from "@/types/voucher";
import type {
  SaveVoucherData,
  VoucherDetailData,
} from "@/app/actions/voucher/helpers/types";
import type { CostCenter } from "@/types/voucher-form";

import { useCallback, useState, useRef, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import {
  createAdjustmentVoucherAction,
  updateAdjustmentVoucherAction,
  getNextAdjustmentVoucherNumberAction,
} from "@/app/actions/adjustment-voucher";
import { adjustmentVoucherService } from "@/services/api/adjustment-voucher.service";
import { AuthenticationError } from "@/utilities/errors/Authentication";

export interface AdjustmentVoucherFormProps {
  formMode: "new" | "edit" | "preview";
  voucherDetailsData?: VoucherDetail[];
}

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
  commit: false,
  post: false,
  print: false,
};

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

export function useAdjustmentVoucherForm({
  formMode,
  initialVoucherNumber,
  voucherDetailsData = EMPTY_DETAILS,
}: AdjustmentVoucherFormProps & { initialVoucherNumber?: number }) {
  const router = useRouter();
  const locale = useLocale();
  const [voucher, setVoucher] = useState<Voucher>({
    ...initialVoucher,
    vouch_id: initialVoucherNumber || 0,
  });
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

  const [isVoucherBalanced, setIsVoucherBalanced] = useState(false);

  const checkVoucherBalance = useCallback(() => {
    const totalDebit = details.reduce(
      (acc, detail) => acc + (detail.debit || 0),
      0,
    );
    const totalCredit = details.reduce(
      (acc, detail) => acc + (detail.credit || 0),
      0,
    );

    setIsVoucherBalanced(totalDebit === totalCredit);
  }, [details]);

  useEffect(() => {
    checkVoucherBalance();
  }, [checkVoucherBalance, details]);

  const addDetailRow = useCallback(() => {
    setDetails((prev) => [
      ...prev,
      { ...initialDetail, vouch_id: voucher.vouch_id },
    ]);
  }, [voucher.vouch_id]);

  const removeDetailRow = useCallback((index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateDetail = useCallback(
    (index: number, newValues: Partial<VoucherDetail>) => {
      setDetails((prev) =>
        prev.map((detail, i) =>
          i === index ? { ...detail, ...newValues } : detail,
        ),
      );
    },
    [],
  );

  const handleSearch = useCallback(async () => {
    try {
      const response = await adjustmentVoucherService.getById(searchTerm);

      if (
        response.success &&
        response.data &&
        response.data.results.length > 0
      ) {
        router.push(`/forms/adjustment/${response.data.results[0].vouch_id}`);

        return;
      }

      toast.error(`لم يتم العثور على قيد تسوية برقم: ${searchTerm}`);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        router.push(`/${locale}/auth/login`);

        return;
      }
      console.error("Search error:", error);
      toast.error("حدث خطأ أثناء البحث");
    }
  }, [searchTerm, router, locale]);

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

  const validateVoucher = useCallback(() => {
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
      if (
        (detail.debit === undefined || detail.debit === null) &&
        (detail.credit === undefined || detail.credit === null)
      ) {
        toast.error("يجب إدخال مبلغ مدين أو دائن لكل سطر");

        return false;
      }
    }

    return true;
  }, [voucher.vouch_date, details]);

  const saveVoucher = useCallback(async () => {
    if (!validateVoucher()) return;

    setIsSaving(true);
    try {
      const voucherData: Omit<SaveVoucherData, "vouch_type"> = {
        vouch_id: voucher.vouch_id,
        vouch_date: voucher.vouch_date,
        vouch_amt: voucher.vouch_amt || 0,
        vouch_notes: voucher.vouch_notes || "",
        vouch_status: voucher.vouch_status || 1,
        ref_no: voucher.ref_no || "",
        cost_id: voucher.cost_id || null,
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
        // Ensure other fields are mapped if needed
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

      let result;

      if (formMode === "new") {
        result = await createAdjustmentVoucherAction(voucherData, detailsData);
      } else {
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
        router.push(`/${locale}/forms/adjustment/${result.data?.vouch_id}`);
      } else {
        toast.error(result.message || "حدث خطأ أثناء حفظ القيد");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsSaving(false);
    }
  }, [
    voucher,
    details,
    validateVoucher,
    formMode,
    originalDetails,
    router,
    locale,
  ]);

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (formMode === "new") {
      if (!initialVoucherNumber) {
        generateNextAdjustmentVoucherNumber();
      }
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

  return useMemo(() => {
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
    };
  }, [
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
  ]);
}
