/**
 * Hook for managing voucher details
 * إدارة تفاصيل السند
 */

import type { VoucherDetail } from "@/types/voucher";

import { useState, useEffect, useMemo } from "react";

import {
  parseNumber,
  clearOppositeField,
  getAccountGauge,
  calculateVoucherTotals,
  calculateCalibratedGold,
  calculateReverseCalibratedGold,
  calculateGaugeFromCalibrated,
} from "@/utilities/voucherForm";
import { isVoucherBalanced } from "@/utilities/voucher/balance";

interface UseVoucherDetailsProps {
  initialDetails?: VoucherDetail[];
  isNewVoucher?: boolean;
  voucherId: number;
  accounts: any[];
  caratTypes: any[];
}

export const useVoucherDetails = ({
  initialDetails = [],
  isNewVoucher = true,
  voucherId,
  accounts,
  caratTypes,
}: UseVoucherDetailsProps) => {
  const [details, setDetails] = useState<VoucherDetail[]>(initialDetails);
  const [originalDetails, setOriginalDetails] = useState<VoucherDetail[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Initialize details for new voucher
  useEffect(() => {
    if (isNewVoucher) {
      setDetails((prev) => {
        if (prev.length === 0) {
          const newDetail1: VoucherDetail = {
            id: 0,
            vouch_id: voucherId,
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
          const newDetail2: VoucherDetail = { ...newDetail1 };

          return [newDetail1, newDetail2];
        } else if (prev.length === 1) {
          const newDetail: VoucherDetail = {
            id: 0,
            vouch_id: voucherId,
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

          return [...prev, newDetail];
        }

        return prev;
      });
    }

    // حفظ التفاصيل الأصلية للقيد الموجود
    if (!isNewVoucher && initialDetails && initialDetails.length > 0) {
      setOriginalDetails([...initialDetails]);
    }
  }, [isNewVoucher, voucherId, initialDetails]);

  // Calculate totals
  const totals = useMemo(() => calculateVoucherTotals(details), [details]);
  const cashBalance = totals.totalDebit - totals.totalCredit;
  const goldBalance = totals.totalDebitG - totals.totalCreditG;
  const isCashBalanced = Math.abs(cashBalance) < 0.01;
  const isGoldBalanced = Math.abs(goldBalance) < 0.01;
  const isBalanced = isVoucherBalanced(totals);

  // Add detail row
  const addDetailRow = () => {
    // التحقق مما إذا كان السطر الأخير فارغاً
    if (details.length > 0) {
      const lastDetail = details[details.length - 1];
      const isEmpty =
        (!lastDetail.acc_id || lastDetail.acc_id === 0) &&
        (lastDetail.debit === undefined || lastDetail.debit === null) &&
        (lastDetail.credit === undefined || lastDetail.credit === null);

      if (isEmpty) {
        return;
      }
    }

    const newDetail: VoucherDetail = {
      id: 0,
      vouch_id: voucherId,
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

    setDetails((prev) => [...prev, newDetail]);
    setShowValidationErrors(false);
  };

  // Remove detail row
  const removeDetailRow = (index: number) => {
    if (details.length <= 2) {
      return { success: false, error: "يجب أن يكون هناك سطرين على الأقل" };
    }
    setDetails((prev) => prev.filter((_, i) => i !== index));

    return { success: true };
  };

  // Update detail
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
          const gauge = getAccountGauge(selectedAccount, caratTypes);

          newDetail.gauge = gauge;
        }

        const baseGauge = 875;
        const currentGauge = newDetail.gauge || baseGauge;

        if (field === "g_debit") {
          const gDebitValue =
            value !== undefined && value !== null ? parseNumber(value) : 0;

          if (gDebitValue > 0 && currentGauge > 0) {
            newDetail.g_debit_base = calculateCalibratedGold(
              gDebitValue,
              currentGauge,
              baseGauge,
              2,
            );
          } else {
            newDetail.g_debit_base = undefined;
          }
        }

        if (field === "g_credit") {
          const gCreditValue =
            value !== undefined && value !== null ? parseNumber(value) : 0;

          if (gCreditValue > 0 && currentGauge > 0) {
            newDetail.g_credit_base = calculateCalibratedGold(
              gCreditValue,
              currentGauge,
              baseGauge,
              2,
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
                : (newDetail as any).debit_g || 0,
            ) as number;

            // تقريب g_debit_base إلى منزلتين عشريتين
            const normalizedBase = parseFloat(
              gDebitBaseValue.toFixed(2),
            ) as number;

            newDetail.g_debit_base = normalizedBase;

            if (debitActual > 0) {
              // حساب المعايرة من القيمة المعايرة والقيمة الفعلية
              const derivedGauge = calculateGaugeFromCalibrated(
                normalizedBase,
                debitActual,
                baseGauge,
                3,
              );

              newDetail.gauge = derivedGauge;

              // إعادة حساب g_credit_base إذا كان g_credit موجود
              const creditActual = parseNumber(
                newDetail.g_credit !== undefined && newDetail.g_credit !== null
                  ? newDetail.g_credit
                  : (newDetail as any).credit_g || 0,
              ) as number;

              if (creditActual > 0) {
                newDetail.g_credit_base = calculateCalibratedGold(
                  creditActual,
                  derivedGauge,
                  baseGauge,
                  2,
                );
              }
            } else {
              // إذا لم يكن g_debit موجود، نحسبه من g_debit_base
              newDetail.g_debit = calculateReverseCalibratedGold(
                normalizedBase,
                currentGauge,
                baseGauge,
              );
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
                : (newDetail as any).credit_g || 0,
            ) as number;

            // تقريب g_credit_base إلى منزلتين عشريتين
            const normalizedBase = parseFloat(
              gCreditBaseValue.toFixed(2),
            ) as number;

            newDetail.g_credit_base = normalizedBase;

            if (creditActual > 0) {
              // حساب المعايرة من القيمة المعايرة والقيمة الفعلية
              const derivedGauge = calculateGaugeFromCalibrated(
                normalizedBase,
                creditActual,
                baseGauge,
                3,
              );

              newDetail.gauge = derivedGauge;

              // إعادة حساب g_debit_base إذا كان g_debit موجود
              const debitActual = parseNumber(
                newDetail.g_debit !== undefined && newDetail.g_debit !== null
                  ? newDetail.g_debit
                  : (newDetail as any).debit_g || 0,
              ) as number;

              if (debitActual > 0) {
                newDetail.g_debit_base = calculateCalibratedGold(
                  debitActual,
                  derivedGauge,
                  baseGauge,
                  2,
                );
              }
            } else {
              // إذا لم يكن g_credit موجود، نحسبه من g_credit_base
              newDetail.g_credit = calculateReverseCalibratedGold(
                normalizedBase,
                currentGauge,
                baseGauge,
              );
            }
          } else {
            newDetail.g_credit_base = undefined;
          }
        }

        if (field === "gauge") {
          const newGauge = parseNumber(value) || baseGauge;

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
              2,
            );
          }

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
              2,
            );
          }
        }

        return newDetail;
      });

      return updated;
    });
  };

  // Validate details
  const validateDetails = () => {
    if (details.length === 0) {
      return { isValid: false, error: "يجب إضافة تفاصيل للقيد" };
    }

    const emptyAccountDetails = details.filter(
      (detail) => !detail.acc_id || detail.acc_id === 0,
    );

    if (emptyAccountDetails.length > 0) {
      return {
        isValid: false,
        error: "يرجى اختيار حساب لجميع الصفوف قبل الحفظ",
      };
    }

    const validDetails = details.filter(
      (detail) => detail.acc_id && detail.acc_id > 0,
    );

    if (validDetails.length === 0) {
      return {
        isValid: false,
        error: "يرجى إدخال حساب صحيح على الأقل",
      };
    }

    if (!isCashBalanced) {
      return {
        isValid: false,
        error: "يجب أن يكون إجمالي المدين مساوي لإجمالي الدائن (نقداً)",
      };
    }

    if (!isGoldBalanced) {
      return {
        isValid: false,
        error: "يجب أن يكون إجمالي المدين مساوي لإجمالي الدائن (ذهباً)",
      };
    }

    return { isValid: true };
  };

  return {
    // State
    details,
    setDetails,
    originalDetails,
    setOriginalDetails,
    showValidationErrors,
    setShowValidationErrors,

    // Totals and balances
    totals,
    cashBalance,
    goldBalance,
    isCashBalanced,
    isGoldBalanced,
    isBalanced,

    // Functions
    addDetailRow,
    removeDetailRow,
    updateDetail,
    validateDetails,
  };
};
