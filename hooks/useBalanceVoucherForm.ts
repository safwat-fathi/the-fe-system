import type { Voucher, VoucherDetail } from "@/types/voucher";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { getNextVoucherNumber } from "@/utilities/numbering";
import { voucherService } from "@/services/api";
import {
  createVoucherAction,
  updateVoucherAction,
} from "@/app/actions/voucher.action";
import { searchAccountsAction } from "@/app/actions/accounts.action";
import { generateBalanceVoucherPrintHTML } from "@/utilities/voucherPrint";
import {
  parseNumber,
  clearOppositeField,
  getAccountGauge,
  calculateVoucherTotals,
  calculateCalibratedGold,
} from "@/utilities/voucherForm";

interface UseBalanceVoucherFormProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  formData: any;
  formMode?: "new" | "edit" | "preview";
  voucherRecordId?: number | string | null;
  isNewVoucher?: boolean;
  startInEditMode?: boolean;
}

export const useBalanceVoucherForm = ({
  voucherData,
  voucherDetailsData,
  formData,
  formMode: initialFormMode = "new",
  voucherRecordId,
  isNewVoucher = true,
  startInEditMode: propStartInEditMode,
}: UseBalanceVoucherFormProps) => {
  const router = useRouter();

  // State Management
  const [voucher, setVoucher] = useState<Voucher>(
    voucherData || {
      vouch_id: 0,
      vouch_date: new Date().toISOString(),
      vouch_type: 0, // قيد افتتاحي
      vouch_amt: 0,
      pay_type: 1,
      cr_date: new Date().toISOString(),
      vouch_status: 1,
      commit: false,
      post: false,
      print: false,
    },
  );

  const [currentTime, setCurrentTime] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [details, setDetails] = useState<VoucherDetail[]>(
    voucherDetailsData || [],
  );
  const [accounts, setAccounts] = useState<any[]>(formData.accounts || []);
  const [costCenters, setCostCenters] = useState<any[]>(
    formData.costCenters || [],
  );
  const [voucherTypes, setVoucherTypes] = useState<any[]>(
    formData.voucherTypes || [],
  );
  const [voucherStatuses, setVoucherStatuses] = useState<any[]>(
    formData.voucherStatuses || [],
  );
  const [caratTypes, setCaratTypes] = useState<any[]>(
    formData.caratTypes || [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditing, setIsEditing] = useState(propStartInEditMode || false);
  const [originalDetails, setOriginalDetails] = useState<VoucherDetail[]>(
    voucherDetailsData || [],
  );

  const previousVouchNotesRef = useRef<string>(voucherData?.vouch_notes || "");
  const hasGeneratedVoucherNumber = useRef(false);

  // Initialize component
  useEffect(() => {
    setIsClient(true);
    updateCurrentTime();

    if (isNewVoucher && details.length === 0) {
      const newDetail: VoucherDetail = {
        id: 0,
        vouch_id: voucher.vouch_id,
        acc_id: 0,
        acc_code: "",
        acc_name: "",
        debit: undefined,
        credit: undefined,
        base_debit: undefined,
        base_credit: undefined,
        gauge: 875,
        debit_g: undefined,
        credit_g: undefined,
        cost_id: 0,
        vouch_notes: "",
        cr_date: new Date().toISOString(),
      };

      setDetails([newDetail]);
    }

    if (!isNewVoucher && voucherDetailsData && voucherDetailsData.length > 0) {
      setOriginalDetails([...voucherDetailsData]);
    }

    if (
      isNewVoucher &&
      !hasGeneratedVoucherNumber.current &&
      (!voucher.vouch_id || voucher.vouch_id === 0)
    ) {
      hasGeneratedVoucherNumber.current = true;
      generateNextVoucherNumber().catch((error) => {
        console.error("خطأ في توليد رقم القيد:", error);
        hasGeneratedVoucherNumber.current = false;
      });
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(updateCurrentTime, 60000);

    return () => clearInterval(interval);
  }, [isClient]);

  useEffect(() => {
    setIsEditing(propStartInEditMode || false);
  }, [propStartInEditMode]);

  // نقل البيان من القيد الرئيسي إلى التفاصيل تلقائياً
  useEffect(() => {
    const currentNotes = voucher.vouch_notes || "";
    const previousNotes = previousVouchNotesRef.current;

    if (currentNotes === previousNotes) return;
    previousVouchNotesRef.current = currentNotes;

    if (!currentNotes) return;

    setDetails((prev) => {
      return prev.map((detail) => {
        if (!detail.vouch_notes || detail.vouch_notes === previousNotes) {
          return { ...detail, vouch_notes: currentNotes };
        }

        return detail;
      });
    });
  }, [voucher.vouch_notes]);

  // Helper Functions
  const updateCurrentTime = () => {
    const now = new Date();

    setCurrentTime(
      now.toLocaleTimeString("ar-SA", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  };

  const updateAccountsList = (newAccount: any) => {
    if (!accounts.find((acc) => acc.id === newAccount.id)) {
      setAccounts([...accounts, newAccount]);
    }
  };

  const loadAccountOptions = async (search: string): Promise<any[]> => {
    try {
      const result = await searchAccountsAction(search);

      if (!result.success) return [];

      const filteredAccounts = result.data;
      const term = search.toLowerCase();

      const options = filteredAccounts
        .map((acc: any) => {
          const accountCode = String(
            acc.acc_code ?? acc.code ?? "",
          ).toLowerCase();
          const accountName = String(
            acc.acc_name ?? acc.name ?? "",
          ).toLowerCase();
          const codeMatch = accountCode.indexOf(term);
          const nameMatch = accountName.indexOf(term);

          return {
            value: acc.id,
            label: `${acc.acc_code ?? acc.code ?? "غير معروف"} - ${acc.acc_name ?? acc.name ?? ""}`,
            account: acc,
            codeMatch,
            nameMatch,
          };
        })
        .sort((a: any, b: any) => {
          const aCode = a.codeMatch === -1 ? Infinity : a.codeMatch;
          const bCode = b.codeMatch === -1 ? Infinity : b.codeMatch;

          if (aCode !== bCode) return aCode - bCode;
          const aName = a.nameMatch === -1 ? Infinity : a.nameMatch;
          const bName = b.nameMatch === -1 ? Infinity : b.nameMatch;

          return aName - bName;
        })
        .map(({ value, label, account }: any) => ({ value, label, account }));

      return options;
    } catch (e) {
      console.error("failed to load accounts", e);

      return [];
    }
  };

  const getAccountSelectValue = (detail: VoucherDetail) => {
    if (!detail.acc_id) return null;

    if (detail.acc_code && detail.acc_name) {
      return {
        value: detail.acc_id,
        label: `${detail.acc_code} - ${detail.acc_name}`,
      };
    }

    const account = accounts.find((acc) => acc.id === detail.acc_id);

    if (account) {
      return {
        value: detail.acc_id,
        label: `${account.acc_code ?? ""} - ${account.acc_name ?? ""}`,
      };
    }

    return {
      value: detail.acc_id,
      label: `حساب رقم: ${detail.acc_id}`,
    };
  };

  const generateNextVoucherNumber = async () => {
    try {
      const nextId = await getNextVoucherNumber(0);

      setVoucher((prev) => ({
        ...prev,
        vouch_id: nextId,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString(),
      }));
    } catch (error) {
      console.error("خطأ في الحصول على رقم القيد التالي:", error);
      setVoucher((prev) => ({
        ...prev,
        vouch_id: 1,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString(),
      }));
    }
  };

  const addDetailRow = () => {
    const newDetail: VoucherDetail = {
      id: 0,
      vouch_id: voucher.vouch_id,
      acc_id: 0,
      acc_code: "",
      acc_name: "",
      debit: undefined,
      credit: undefined,
      base_debit: undefined,
      base_credit: undefined,
      gauge: 875,
      debit_g: undefined,
      credit_g: undefined,
      cost_id: 0,
      vouch_notes: "",
      cr_date: new Date().toISOString(),
    };

    setDetails((prev) => [...prev, newDetail]);
  };

  const removeDetailRow = (index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDetail = (
    index: number,
    field: keyof VoucherDetail,
    value: any,
  ) => {
    setDetails((prev) => {
      const updated = prev.map((detail, i) => {
        if (i !== index) return detail;

        const newDetail = { ...detail, [field]: value };

        // Clear opposite field
        const cleared = clearOppositeField(field, value);

        Object.assign(newDetail, cleared);

        // Get gauge from account when acc_id is selected
        if (field === "acc_id" && value) {
          const selectedAccount = accounts.find((acc) => acc.id === value);

          if (selectedAccount) {
            const gauge = getAccountGauge(selectedAccount, caratTypes);

            newDetail.gauge = gauge;
          }
        }

        // حساب الذهب المعاير تلقائياً من base_debit/base_credit و gauge
        const baseGauge = 875;
        const currentGauge = newDetail.gauge || 875;

        // حساب debit_g من base_debit
        if (field === "base_debit") {
          const baseDebit =
            value !== undefined && value !== null ? parseNumber(value) : 0;

          if (baseDebit > 0 && currentGauge > 0) {
            newDetail.debit_g = calculateCalibratedGold(
              baseDebit,
              currentGauge,
              baseGauge,
            );
          } else {
            newDetail.debit_g = undefined;
          }
        } else if (
          field === "gauge" &&
          newDetail.base_debit !== undefined &&
          newDetail.base_debit !== null &&
          newDetail.base_debit > 0
        ) {
          const newGauge = parseNumber(value) || 875;
          const baseDebit = parseNumber(newDetail.base_debit);

          if (baseDebit > 0 && newGauge > 0) {
            newDetail.debit_g = calculateCalibratedGold(
              baseDebit,
              newGauge,
              baseGauge,
            );
          }
        }

        // حساب credit_g من base_credit
        if (field === "base_credit") {
          const baseCredit =
            value !== undefined && value !== null ? parseNumber(value) : 0;

          if (baseCredit > 0 && currentGauge > 0) {
            newDetail.credit_g = calculateCalibratedGold(
              baseCredit,
              currentGauge,
              baseGauge,
            );
          } else {
            newDetail.credit_g = undefined;
          }
        } else if (
          field === "gauge" &&
          newDetail.base_credit !== undefined &&
          newDetail.base_credit !== null &&
          newDetail.base_credit > 0
        ) {
          const newGauge = parseNumber(value) || 875;
          const baseCredit = parseNumber(newDetail.base_credit);

          if (baseCredit > 0 && newGauge > 0) {
            newDetail.credit_g = calculateCalibratedGold(
              baseCredit,
              newGauge,
              baseGauge,
            );
          }
        }

        return newDetail;
      });

      return updated;
    });
  };

  // Calculate totals with base_debit and base_credit included
  const totals = useMemo(
    () => calculateVoucherTotals(details, true),
    [details],
  );
  const cashBalance = totals.totalDebit - totals.totalCredit;
  const goldBalance = totals.totalDebitG - totals.totalCreditG;
  const isCashBalanced = Math.abs(cashBalance) < 0.01;
  const isGoldBalanced = Math.abs(goldBalance) < 0.01;
  const isBalanced = isCashBalanced && isGoldBalanced;

  // التحقق من وجود قيد افتتاحي قبل الحفظ
  const checkExistingBalanceVoucher = async (): Promise<number | null> => {
    try {
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: "0",
      });

      if (vouchersResponse.success && vouchersResponse.data) {
        const vouchers = Array.isArray(vouchersResponse.data)
          ? vouchersResponse.data
          : [];

        if (vouchers.length > 0 && isNewVoucher) {
          const existingId = vouchers[0].id || vouchers[0].vouch_id;

          return existingId || null;
        }
      }

      return null;
    } catch (error) {
      console.error("Error checking existing balance voucher:", error);

      return null;
    }
  };

  const saveVoucher = async () => {
    if (isNewVoucher) {
      const existingId = await checkExistingBalanceVoucher();

      if (existingId) {
        toast.error(
          "⚠️ يوجد قيد افتتاحي موجود مسبقاً. يرجى تعديل القيد الموجود بدلاً من إنشاء قيد جديد.",
          { duration: 6000 },
        );
        router.push(`/forms/balance/${existingId}`);

        return;
      }
    }

    const voucherDate = new Date(voucher.vouch_date);
    const today = new Date();

    today.setHours(23, 59, 59, 999);

    if (voucherDate > today) {
      toast.error("لا يمكن إنشاء قيد بتاريخ أكبر من تاريخ اليوم");

      return;
    }

    if (!isBalanced) {
      const proceed = window.confirm(
        "⚠️ القيد غير متزن!\n\nإجمالي المدين: " +
          totals.totalDebit.toFixed(2) +
          "\nإجمالي الدائن: " +
          totals.totalCredit.toFixed(2) +
          "\n\nهل تريد المتابعة والحفظ رغم ذلك؟",
      );

      if (!proceed) {
        return;
      }

      toast("تم حفظ القيد رغم عدم التوازن", {
        icon: "⚠️",
        duration: 4000,
      });
    }

    const detailsWithAccounts = details.filter(
      (detail) => detail.acc_id && detail.acc_id > 0,
    );
    const detailsWithoutAccounts = details.filter(
      (detail) => !detail.acc_id || detail.acc_id === 0,
    );

    if (detailsWithAccounts.length > 0 && detailsWithoutAccounts.length > 0) {
      toast.error("يرجى اختيار حساب لجميع الصفوف التي تحتوي على بيانات");

      return;
    }

    let finalVouchId = voucher.vouch_id;

    if (
      isNewVoucher &&
      (!finalVouchId || finalVouchId <= 0 || !isFinite(finalVouchId))
    ) {
      try {
        finalVouchId = await getNextVoucherNumber(0);
        setVoucher((prev) => ({
          ...prev,
          vouch_id: finalVouchId,
        }));
      } catch (error) {
        console.error("خطأ في توليد رقم القيد:", error);
        toast.error("❌ فشل في توليد رقم القيد. يرجى المحاولة مرة أخرى.");

        return;
      }
    }

    if (!finalVouchId || finalVouchId <= 0 || !isFinite(finalVouchId)) {
      toast.error("خطأ: رقم القيد غير صحيح. يرجى إعادة تحميل الصفحة.");

      return;
    }

    setIsLoading(true);
    try {
      const voucherData = {
        vouch_id: finalVouchId,
        vouch_date: voucher.vouch_date,
        vouch_type: 0,
        vouch_amt: 0,
        vouch_notes: voucher.vouch_notes || "",
        vouch_status: voucher.vouch_status || 1,
        pay_type: voucher.pay_type,
        ref_no: voucher.ref_no || "",
        opps_vouch: voucher.opps_vouch || 0,
      };

      const detailsData = details
        .filter((detail) => detail.acc_id && detail.acc_id > 0)
        .map((detail) => ({
          id: detail.id || 0,
          vouch_id: finalVouchId,
          acc_id: detail.acc_id,
          debit: detail.debit,
          credit: detail.credit,
          base_debit: detail.base_debit,
          base_credit: detail.base_credit,
          gauge: detail.gauge,
          debit_g: detail.debit_g,
          credit_g: detail.credit_g,
          vouch_notes: detail.vouch_notes || "",
          cost_id: detail.cost_id || null,
          tax: 0,
          tax_prc: 0,
          vat_no: 0,
        }));

      let result;

      if (isNewVoucher || !voucherRecordId) {
        result = await createVoucherAction(voucherData, detailsData);
      } else {
        const currentDetailIds = detailsData
          .map((d) => d.id)
          .filter((id) => id > 0);
        const originalDetailIds = originalDetails
          .map((d) => d.id)
          .filter((id) => id && id > 0) as number[];
        const deletedDetailIds = originalDetailIds.filter(
          (id) => !currentDetailIds.includes(id),
        );

        result = await updateVoucherAction(
          voucherData,
          detailsData,
          deletedDetailIds,
          Number(voucherRecordId),
        );
      }

      if (result.success && result.data) {
        const realId = result.data.id;
        const vouchId = result.data.vouch_id || voucher.vouch_id;

        setVoucher((prev) => ({
          ...prev,
          commit: true,
          id: realId,
          vouch_id: vouchId,
        }));

        toast.success(result.message);

        if (realId) {
          router.push(`/forms/balance/${realId}?mode=preview`);
          router.refresh();
        } else {
          router.push(`/forms/balance`);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(
        `حدث خطأ أثناء حفظ القيد: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const printVoucher = async () => {
    setIsPrinting(true);
    try {
      const printWindow = window.open("", "_blank");

      if (printWindow) {
        const html = generateBalanceVoucherPrintHTML(
          voucher,
          details,
          accounts,
          totals,
        );

        printWindow.document.write(html);
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

  const handleEditClick = () => {
    setVoucher((prev) => ({
      ...prev,
      commit: false,
    }));

    if (voucherRecordId) {
      router.push(`/forms/balance?mode=edit`);
    } else {
      setIsEditing(true);
      toast.success("✅ تم تفعيل وضع التعديل");
    }
  };

  return {
    // State
    voucher,
    setVoucher,
    details,
    accounts,
    costCenters,
    voucherTypes,
    voucherStatuses,
    caratTypes,
    isLoading,
    isEditing,
    setIsEditing,
    isPrinting,
    currentTime,
    isClient,

    // Totals and balances
    totals,
    cashBalance,
    goldBalance,
    isCashBalanced,
    isGoldBalanced,
    isBalanced,

    // Functions
    updateCurrentTime,
    updateAccountsList,
    loadAccountOptions,
    getAccountSelectValue,
    generateNextVoucherNumber,
    addDetailRow,
    removeDetailRow,
    updateDetail,
    saveVoucher,
    printVoucher,
    handleEditClick,
  };
};
