import type { Voucher, VoucherDetail } from "@/types/voucher";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  calculateReverseCalibratedGold,
  calculateGaugeFromCalibrated,
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
  voucherRecordId,
  isNewVoucher = true,
  startInEditMode: propStartInEditMode,
}: UseBalanceVoucherFormProps) => {
  const router = useRouter();
  const t = useTranslations("common");

  // State Management
  const [voucher, setVoucher] = useState<Voucher>(() => {
    if (voucherData) {
      return {
        ...voucherData,
        cost_id: voucherData.cost_id ?? (voucherData as any).cost ?? null,
      };
    }

    return {
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
      cost_id: null,
    };
  });

  const [currentTime, setCurrentTime] = useState("");
  const [details, setDetails] = useState<VoucherDetail[]>(
    voucherDetailsData || [],
  );
  const [accounts, setAccounts] = useState<any[]>(formData.accounts || []);
  const [costCenters] = useState<any[]>(formData.costCenters || []);
  const [voucherTypes] = useState<any[]>(formData.voucherTypes || []);
  const [voucherStatuses] = useState<any[]>(formData.voucherStatuses || []);
  const [caratTypes] = useState<any[]>(formData.caratTypes || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditing, setIsEditing] = useState(
    isNewVoucher ? true : propStartInEditMode || false,
  );
  const [originalDetails, setOriginalDetails] = useState<VoucherDetail[]>(
    voucherDetailsData || [],
  );
  const [showUnbalancedModal, setShowUnbalancedModal] = useState(false);

  const previousVouchNotesRef = useRef<string>(voucherData?.vouch_notes || "");

  // حساب defaultAccountOptions مباشرة باستخدام useMemo بدلاً من useEffect + useState
  const defaultAccountOptions = useMemo(() => {
    if (accounts.length === 0) return [];

    return accounts.slice(0, 50).map((acc) => ({
      value: acc.id,
      label: `${acc.acc_code ?? acc.code ?? ""} - ${acc.acc_name ?? acc.name ?? ""}`,
      account: acc,
    }));
  }, [accounts]);

  // Initialize component
  useEffect(() => {
    updateCurrentTime();

    if (isNewVoucher && details.length === 0) {
      const newDetail: VoucherDetail = {
        id: 0,
        vouch_id: Number(voucher.vouch_id),
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
        cost_id: voucher.cost_id ?? 0,
        vouch_notes: "",
        cr_date: new Date().toISOString(),
      };

      setDetails([newDetail]);
    }

    if (!isNewVoucher && voucherDetailsData && voucherDetailsData.length > 0) {
      setOriginalDetails([...voucherDetailsData]);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(updateCurrentTime, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isNewVoucher) {
      setIsEditing(true);

      return;
    }

    setIsEditing(propStartInEditMode || false);
  }, [isNewVoucher, propStartInEditMode]);

  // تم نقل defaultAccountOptions إلى useMemo أعلاه لتحسين الأداء

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
      console.error("Error loading account options:", e);

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
    // التحقق مما إذا كان السطر الأخير فارغاً
    if (details.length > 0) {
      const lastDetail = details[details.length - 1];
      const isEmpty =
        (!lastDetail.acc_id || lastDetail.acc_id === 0) &&
        (lastDetail.debit === undefined || lastDetail.debit === null) &&
        (lastDetail.credit === undefined || lastDetail.credit === null) &&
        (lastDetail.g_debit === undefined || lastDetail.g_debit === null) &&
        (lastDetail.g_credit === undefined || lastDetail.g_credit === null);

      if (isEmpty) {
        return;
      }
    }

    const newDetail: VoucherDetail = {
      id: 0,
      vouch_id: Number(voucher.vouch_id),
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
      cost_id: voucher.cost_id ?? 0,
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
    if (field === "acc_id" && value) {
      const numericValue = Number(value);

      if (Number.isFinite(numericValue) && numericValue > 0) {
        const isDuplicate = details.some(
          (detail, detailIndex) =>
            detailIndex !== index && Number(detail.acc_id) === numericValue,
        );

        if (isDuplicate) {
          toast.error("⚠️ هذا الحساب مُدرج مسبقاً في القيد.", {
            id: "duplicate-account-warning",
          });

          return;
        }
      }
    }

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

            const baseGauge = 875;

            if (
              newDetail.g_debit !== undefined &&
              newDetail.g_debit !== null &&
              parseNumber(newDetail.g_debit) > 0
            ) {
              newDetail.g_debit_base = calculateCalibratedGold(
                parseNumber(newDetail.g_debit),
                gauge,
                baseGauge,
                2,
              );
            }

            if (
              newDetail.g_credit !== undefined &&
              newDetail.g_credit !== null &&
              parseNumber(newDetail.g_credit) > 0
            ) {
              newDetail.g_credit_base = calculateCalibratedGold(
                parseNumber(newDetail.g_credit),
                gauge,
                baseGauge,
                2,
              );
            }
          }
        }

        // حساب الذهب المعاير تلقائياً من g_debit/g_credit و gauge
        const baseGauge = 875;
        const currentGauge = newDetail.gauge || 875;

        // حساب g_debit_base من g_debit (منزلتان عشريتان فقط حسب متطلبات الـ backend)
        if (field === "g_debit") {
          const gDebitValue =
            value !== undefined && value !== null ? parseNumber(value) : 0;

          if (gDebitValue > 0 && currentGauge > 0) {
            newDetail.g_debit_base = calculateCalibratedGold(
              gDebitValue,
              currentGauge,
              baseGauge,
              2, // منزلتان عشريتان فقط
            );
          } else {
            newDetail.g_debit_base = undefined;
          }
        }

        // حساب g_credit_base من g_credit (منزلتان عشريتان فقط حسب متطلبات الـ backend)
        if (field === "g_credit") {
          const gCreditValue =
            value !== undefined && value !== null ? parseNumber(value) : 0;

          if (gCreditValue > 0 && currentGauge > 0) {
            newDetail.g_credit_base = calculateCalibratedGold(
              gCreditValue,
              currentGauge,
              baseGauge,
              2, // منزلتان عشريتان فقط
            );
          } else {
            newDetail.g_credit_base = undefined;
          }
        }

        // حساب g_debit من g_debit_base (الحساب العكسي)
        if (field === "g_debit_base") {
          const gDebitBaseValue =
            value !== undefined && value !== null ? parseNumber(value) : 0;

          if (gDebitBaseValue > 0) {
            const debitActual = parseNumber(
              newDetail.g_debit !== undefined && newDetail.g_debit !== null
                ? newDetail.g_debit
                : (newDetail as any).debit_g,
            );
            const normalizedBase = parseFloat(
              gDebitBaseValue.toFixed(2),
            ) as number;

            newDetail.g_debit_base = normalizedBase;

            if (debitActual > 0) {
              const derivedGauge = calculateGaugeFromCalibrated(
                normalizedBase,
                debitActual,
                baseGauge,
                3,
              );

              newDetail.gauge = derivedGauge;

              const creditActual = parseNumber(
                newDetail.g_credit !== undefined && newDetail.g_credit !== null
                  ? newDetail.g_credit
                  : (newDetail as any).credit_g,
              );

              if (creditActual > 0) {
                newDetail.g_credit_base = calculateCalibratedGold(
                  creditActual,
                  derivedGauge,
                  baseGauge,
                  2,
                );
              }
            } else if (currentGauge > 0) {
              const derivedDebit = calculateReverseCalibratedGold(
                normalizedBase,
                currentGauge,
                baseGauge,
              );

              newDetail.g_debit = derivedDebit > 0 ? derivedDebit : undefined;
            }
          } else {
            newDetail.g_debit_base = undefined;
          }
        }

        // حساب g_credit من g_credit_base (الحساب العكسي)
        if (field === "g_credit_base") {
          const gCreditBaseValue =
            value !== undefined && value !== null ? parseNumber(value) : 0;

          if (gCreditBaseValue > 0) {
            const creditActual = parseNumber(
              newDetail.g_credit !== undefined && newDetail.g_credit !== null
                ? newDetail.g_credit
                : (newDetail as any).credit_g,
            );
            const normalizedBase = parseFloat(
              gCreditBaseValue.toFixed(2),
            ) as number;

            newDetail.g_credit_base = normalizedBase;

            if (creditActual > 0) {
              const derivedGauge = calculateGaugeFromCalibrated(
                normalizedBase,
                creditActual,
                baseGauge,
                3,
              );

              newDetail.gauge = derivedGauge;

              const debitActual = parseNumber(
                newDetail.g_debit !== undefined && newDetail.g_debit !== null
                  ? newDetail.g_debit
                  : (newDetail as any).debit_g,
              );

              if (debitActual > 0) {
                newDetail.g_debit_base = calculateCalibratedGold(
                  debitActual,
                  derivedGauge,
                  baseGauge,
                  2,
                );
              }
            } else if (currentGauge > 0) {
              const derivedCredit = calculateReverseCalibratedGold(
                normalizedBase,
                currentGauge,
                baseGauge,
              );

              newDetail.g_credit =
                derivedCredit > 0 ? derivedCredit : undefined;
            }
          } else {
            newDetail.g_credit_base = undefined;
          }
        }

        // إعادة حساب g_debit_base و g_credit_base عند تغيير gauge إذا كان g_debit أو g_credit موجود
        // عند تعديل العيار، يتغير الوزن المعاير فقط (g_debit_base/g_credit_base)
        // ولا يتغير الوزن القائم (g_debit/g_credit)
        if (field === "gauge") {
          const newGauge = parseNumber(value) || 875;

          // إعادة حساب g_debit_base إذا كان g_debit موجود (من الوزن القائم)
          // منزلتان عشريتان فقط حسب متطلبات الـ backend
          if (
            newDetail.g_debit !== undefined &&
            newDetail.g_debit !== null &&
            newDetail.g_debit > 0 &&
            newGauge > 0
          ) {
            newDetail.g_debit_base = calculateCalibratedGold(
              newDetail.g_debit,
              newGauge,
              baseGauge,
              2, // منزلتان عشريتان فقط
            );
          }

          // إعادة حساب g_credit_base إذا كان g_credit موجود (من الوزن القائم)
          // منزلتان عشريتان فقط حسب متطلبات الـ backend
          if (
            newDetail.g_credit !== undefined &&
            newDetail.g_credit !== null &&
            newDetail.g_credit > 0 &&
            newGauge > 0
          ) {
            newDetail.g_credit_base = calculateCalibratedGold(
              newDetail.g_credit,
              newGauge,
              baseGauge,
              2, // منزلتان عشريتان فقط
            );
          }

          // لا نقوم بالحساب العكسي عند تغيير gauge
          // الاحتساب العكسي يعمل فقط عند إدخال الوزن المعاير مباشرة (g_debit_base/g_credit_base)
        }

        return newDetail;
      });

      return updated;
    });
  };

  const handleMasterCostChange = (costId: number | null) => {
    const previousCost =
      voucher.cost_id !== undefined && voucher.cost_id !== null
        ? voucher.cost_id
        : null;

    setVoucher((prev) => ({
      ...prev,
      cost_id: costId ?? null,
    }));

    setDetails((prev) =>
      prev.map((detail) => {
        const detailCost =
          detail.cost_id !== undefined && detail.cost_id !== null
            ? detail.cost_id
            : 0;

        if (
          detailCost > 0 &&
          previousCost !== null &&
          detailCost !== previousCost
        ) {
          return detail;
        }

        return {
          ...detail,
          cost_id: costId ?? 0,
        };
      }),
    );
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
      // ✅ استخدام دالة خاصة للتحقق بدون cache للدقة
      const openingEntry = await voucherService.checkExistingOpeningEntry("1");

      // ✅ إذا لم يتم العثور على قيد، لا يوجد قيد مسبق
      if (!openingEntry) {
        return null;
      }

      // ✅ فقط إذا كان قيد جديد، نعيد معرف القيد الموجود
      if (isNewVoucher) {
        const existingId = openingEntry.id || openingEntry.vouch_id;

        return existingId || null;
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
        // استخدام vouch_id إذا كان متاحاً، وإلا استخدم id
        // محاولة جلب القيد للبحث عن vouch_id
        try {
          const vouchersResponse = await voucherService.getAll({
            xvouch_type: "0",
            xcom_id: "1", // ✅ إضافة xcom_id بشكل صريح للفلترة حسب الفرع
          });

          if (vouchersResponse.success && vouchersResponse.data) {
            const vouchers = Array.isArray(vouchersResponse.data)
              ? vouchersResponse.data
              : [];
            const balanceVoucher = vouchers.find(
              (v: any) => {
                const matchesId =
                  v?.id === existingId || v?.vouch_id === existingId;
                const isCorrectType =
                  v?.vouch_type === 0 || v?.vouch_type === "0";
                // ✅ التحقق من أن القيد ينتمي لنفس الفرع (com = 1)
                const isCorrectBranch =
                  Number(v?.com_id ?? v?.com ?? 1) === 1;

                return matchesId && isCorrectType && isCorrectBranch;
              },
            );

            if (balanceVoucher) {
              const idToUse = balanceVoucher.vouch_id || existingId;
              router.push(`/forms/balance/${idToUse}`);
            } else {
              // ✅ إذا لم يتم العثور على القيد، لا تقم بالتوجيه
              console.warn(
                "Could not find existing balance voucher for redirect",
              );
            }
          } else {
            // ✅ إذا لم تكن هناك بيانات، لا تقم بالتوجيه
            console.warn("No voucher data found for redirect");
          }
        } catch (error) {
          console.error("Error fetching voucher for redirect:", error);
          // ✅ لا تقم بالتوجيه إذا حدث خطأ
        }

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
      setShowUnbalancedModal(true);

      return;
    }

    await proceedWithSave();
  };

  const proceedWithSave = async () => {
    // إزالة السطر الأخير إذا كان فارغاً
    let currentDetails = [...details];

    if (currentDetails.length > 0) {
      const lastDetail = currentDetails[currentDetails.length - 1];
      const isEmpty =
        (!lastDetail.acc_id || lastDetail.acc_id === 0) &&
        (lastDetail.debit === undefined || lastDetail.debit === null) &&
        (lastDetail.credit === undefined || lastDetail.credit === null) &&
        (lastDetail.g_debit === undefined || lastDetail.g_debit === null) &&
        (lastDetail.g_credit === undefined || lastDetail.g_credit === null);

      if (isEmpty) {
        currentDetails.pop();
        setDetails(currentDetails);
      }
    }

    // إزالة جميع الصفوف الفارغة الأخرى (الصفوف التي لا تحتوي على حساب ولا قيم)
    currentDetails = currentDetails.filter((detail) => {
      const hasAccount = detail.acc_id && detail.acc_id > 0;
      const hasDebit = detail.debit !== undefined && detail.debit !== null;
      const hasCredit = detail.credit !== undefined && detail.credit !== null;
      const hasGoldDebit =
        detail.g_debit !== undefined && detail.g_debit !== null;
      const hasGoldCredit =
        detail.g_credit !== undefined && detail.g_credit !== null;

      // الصف الفارغ: لا حساب ولا أي قيم
      const isEmpty =
        !hasAccount &&
        !hasDebit &&
        !hasCredit &&
        !hasGoldDebit &&
        !hasGoldCredit;

      return !isEmpty;
    });

    if (currentDetails.length === 0) {
      toast.error("يجب إضافة تفاصيل للقيد");

      return;
    }

    const detailsWithAccounts = currentDetails.filter(
      (detail) => detail.acc_id && detail.acc_id > 0,
    );
    const detailsWithoutAccounts = currentDetails.filter(
      (detail) => !detail.acc_id || detail.acc_id === 0,
    );

    if (detailsWithAccounts.length > 0 && detailsWithoutAccounts.length > 0) {
      toast.error("يرجى اختيار حساب لجميع الصفوف التي تحتوي على بيانات");

      return;
    }

    let finalVouchId = voucher.vouch_id;

    if (
      isNewVoucher &&
      (!finalVouchId ||
        Number(finalVouchId) <= 0 ||
        !isFinite(Number(finalVouchId)))
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

    if (
      !finalVouchId ||
      Number(finalVouchId) <= 0 ||
      !isFinite(Number(finalVouchId))
    ) {
      toast.error("خطأ: رقم القيد غير صحيح. يرجى إعادة تحميل الصفحة.");

      return;
    }

    setIsLoading(true);
    try {
      const masterCostId =
        voucher.cost_id !== undefined &&
        voucher.cost_id !== null &&
        voucher.cost_id > 0
          ? voucher.cost_id
          : null;

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
        cost_id: masterCostId,
      };

      const detailsData = currentDetails
        .filter((detail) => detail.acc_id && detail.acc_id > 0)
        .map((detail) => ({
          id: detail.id || 0,
          vouch_id: finalVouchId,
          acc_id: detail.acc_id,
          debit: detail.debit,
          credit: detail.credit,
          debit_base:
            detail.debit_base !== undefined ? detail.debit_base : detail.debit,
          credit_base:
            detail.credit_base !== undefined
              ? detail.credit_base
              : detail.credit,
          gauge: detail.gauge,
          g_debit:
            detail.g_debit !== undefined ? detail.g_debit : detail.debit_g,
          g_credit:
            detail.g_credit !== undefined ? detail.g_credit : detail.credit_g,
          // التأكد من أن g_debit_base و g_credit_base موجودة أو تساوي 0
          // تقريب إلى منزلتين عشريتين حسب متطلبات الـ backend
          g_debit_base:
            detail.g_debit_base !== undefined && detail.g_debit_base !== null
              ? parseFloat(Number(detail.g_debit_base ?? 0).toFixed(2))
              : 0,
          g_credit_base:
            detail.g_credit_base !== undefined && detail.g_credit_base !== null
              ? parseFloat(Number(detail.g_credit_base ?? 0).toFixed(2))
              : 0,
          vouch_notes: detail.vouch_notes || "",
          cost_id:
            detail.cost_id !== undefined &&
            detail.cost_id !== null &&
            detail.cost_id > 0
              ? detail.cost_id
              : masterCostId,
          tax: 0,
          tax_prc: 0,
          vat_no: 0,
        }));

      let result;

      if (isNewVoucher || !voucherRecordId) {
        result = await createVoucherAction(voucherData, detailsData as any);
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
          detailsData as any,
          deletedDetailIds,
          Number(voucherRecordId),
        );
      }

      if (result.success && result.data) {
        const realId = result.data.id || voucher.id || voucherRecordId;
        const vouchId = result.data.vouch_id || voucher.vouch_id;

        // ✅ بعد الحفظ الناجح، نعيّن commit: true في الـ state فقط (للعرض)
        // لأن createVoucherAction يقوم بترحيل القيد للـ GL تلقائياً
        // ملاحظة: commit في قاعدة البيانات قد لا يتغير، لكننا نعيّنه في الـ state للعرض
        setVoucher((prev) => ({
          ...prev,
          commit: true, // ✅ بعد الحفظ الناجح، commit: true في الـ state (للعرض فقط)
          post: false, // ✅ post لا يُستخدم حالياً، سيتم استخدامه لاحقاً
          id: realId,
          vouch_id: vouchId,
        }));

        toast.success(result.message);

        // ✅ إضافة timestamp للـ URL لإجبار إعادة جلب البيانات
        const timestamp = Date.now();
        
        // استخدام vouch_id في URL بدلاً من id
        if (vouchId && Number(vouchId) > 0) {
          // ✅ إضافة timestamp للـ URL لإجبار إعادة جلب البيانات
          router.push(`/forms/balance/${vouchId}?mode=preview&_t=${timestamp}`);
          // ✅ إعادة تحميل الصفحة بعد التوجيه لضمان جلب أحدث البيانات
          setTimeout(() => {
            router.refresh();
          }, 100);
        } else if (realId && Number(realId) > 0) {
          // ✅ إضافة timestamp للـ URL لإجبار إعادة جلب البيانات
          // Fallback إلى id إذا لم يكن vouch_id متاحاً
          router.push(`/forms/balance/${realId}?mode=preview&_t=${timestamp}`);
          // ✅ إعادة تحميل الصفحة بعد التوجيه لضمان جلب أحدث البيانات
          setTimeout(() => {
            router.refresh();
          }, 100);
        } else {
          // Fallback: إعادة تحميل الصفحة الحالية
          router.refresh();
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
          t("systemName"),
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

  const handleEditClick = async () => {
    // ✅ تحديث commit: false في قاعدة البيانات عند بدء التعديل
    if (voucherRecordId && Number(voucherRecordId) > 0) {
      try {
        const { voucherService } = await import("@/services/api");
        await voucherService.update(Number(voucherRecordId), {
          commit: false, // ✅ عند بدء التعديل، commit: false
        });
      } catch (error) {
        console.error("Error updating commit status on edit:", error);
        // لا نفشل العملية، فقط نسجل الخطأ
      }
    }

    setVoucher((prev) => ({
      ...prev,
      commit: false,
    }));

    // استخدام vouch_id في URL بدلاً من voucherRecordId
    const vouchIdToUse = voucher.vouch_id;

    if (vouchIdToUse && Number(vouchIdToUse) > 0) {
      router.push(`/forms/balance/${vouchIdToUse}?mode=edit`);
    } else if (voucherRecordId) {
      // Fallback إلى voucherRecordId إذا لم يكن vouch_id متاحاً
      router.push(`/forms/balance/${voucherRecordId}?mode=edit`);
    } else {
      // إذا لم يكن هناك معرف قيد، تفعيل وضع التعديل مباشرة
      setIsEditing(true);
      toast.success("✅ تم تفعيل وضع التعديل");
    }
  };

  const handleUnbalancedConfirm = async () => {
    setShowUnbalancedModal(false);
    await proceedWithSave();
  };

  const handleUnbalancedCancel = () => {
    setShowUnbalancedModal(false);
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
    showUnbalancedModal,
    defaultAccountOptions,

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
    handleMasterCostChange,
    saveVoucher,
    printVoucher,
    handleEditClick,
    handleUnbalancedConfirm,
    handleUnbalancedCancel,
  };
};
