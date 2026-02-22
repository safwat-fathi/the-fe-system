import type { Voucher, VoucherDetail, AccountOption } from "@/types/voucher";
import type { VoucherDetailData } from "@/app/actions/voucher/types";
import type { Account } from "@/types/models/account";
import type { BalanceVoucherFormData } from "@/types/voucher-form";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

interface SortableAccountOption extends AccountOption {
  codeMatch: number;
  nameMatch: number;
}

interface UseBalanceVoucherFormProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  formData: BalanceVoucherFormData;
  formMode?: "new" | "edit" | "preview";
  voucherRecordId?: number | string | null;
  isNewVoucher?: boolean;
  startInEditMode?: boolean;
}

const BASE_GAUGE = 875;

const isEmptyDetail = (d: VoucherDetail) =>
  (!d.acc_id || d.acc_id === 0) &&
  d.debit == null &&
  d.credit == null &&
  d.g_debit == null &&
  d.g_credit == null;

const createEmptyDetail = (
  vouchId: number | string,
  costId: number | null,
): VoucherDetail => ({
  id: 0,
  vouch_id: Number(vouchId),
  acc_id: 0,
  acc_code: "",
  acc_name: "",
  debit: undefined,
  credit: undefined,
  base_debit: undefined,
  base_credit: undefined,
  gauge: BASE_GAUGE,
  debit_g: undefined,
  credit_g: undefined,
  cost_id: costId ?? 0,
  vouch_notes: "",
  cr_date: new Date().toISOString(),
});

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

  const [voucher, setVoucher] = useState<Voucher>(() => {
    if (voucherData) {
      return {
        ...voucherData,
        cost_id:
          voucherData.cost_id ?? (voucherData["cost"] as number | null) ?? null,
      };
    }

    return {
      vouch_id: 0,
      vouch_date: new Date().toISOString(),
      vouch_type: 0,
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

  const [details, setDetails] = useState<VoucherDetail[]>(
    voucherDetailsData || [],
  );
  const [accounts, setAccounts] = useState<Account[]>(formData.accounts || []);

  const costCenters = useMemo(
    () => formData.costCenters || [],
    [formData.costCenters],
  );
  const voucherTypes = useMemo(
    () => formData.voucherTypes || [],
    [formData.voucherTypes],
  );
  const voucherStatuses = useMemo(
    () => formData.voucherStatuses || [],
    [formData.voucherStatuses],
  );
  const caratTypes = useMemo(
    () => formData.caratTypes || [],
    [formData.caratTypes],
  );

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

  const voucherRef = useRef(voucher);

  voucherRef.current = voucher;
  const detailsRef = useRef(details);

  detailsRef.current = details;
  const originalDetailsRef = useRef(originalDetails);

  originalDetailsRef.current = originalDetails;

  const defaultAccountOptions = useMemo(() => {
    if (accounts.length === 0) return [];

    return accounts.slice(0, 50).map(
      (acc): AccountOption => ({
        value: acc.id,
        label: `${acc.acc_code ?? ""} - ${acc.acc_name ?? ""}`,
        account: acc,
      }),
    );
  }, [accounts]);

  useEffect(() => {
    if (isNewVoucher && details.length === 0) {
      setDetails([
        createEmptyDetail(voucher.vouch_id, voucher.cost_id ?? null),
      ]);
    }

    if (!isNewVoucher && voucherDetailsData && voucherDetailsData.length > 0) {
      setOriginalDetails([...voucherDetailsData]);
    }
  }, []);

  useEffect(() => {
    const currentNotes = voucher.vouch_notes || "";
    const previousNotes = previousVouchNotesRef.current;

    if (currentNotes === previousNotes) return;
    previousVouchNotesRef.current = currentNotes;

    if (!currentNotes) return;

    setDetails((prev) =>
      prev.map((detail) => {
        if (!detail.vouch_notes || detail.vouch_notes === previousNotes) {
          return { ...detail, vouch_notes: currentNotes };
        }

        return detail;
      }),
    );
  }, [voucher.vouch_notes]);

  const updateAccountsList = useCallback((newAccount: Account) => {
    setAccounts((prev) => {
      if (prev.find((acc) => acc.id === newAccount.id)) return prev;

      return [...prev, newAccount];
    });
  }, []);

  const loadAccountOptions = useCallback(
    async (search: string): Promise<AccountOption[]> => {
      try {
        const result = await searchAccountsAction(search);

        if (!result.success) return [];

        const term = search.toLowerCase();

        return result.data
          .map((acc: Record<string, unknown>): SortableAccountOption => {
            const accCode = String(acc.acc_code ?? acc.code ?? "");
            const accName = String(acc.acc_name ?? acc.name ?? "");

            return {
              value: acc.id as number,
              label: `${accCode || "غير معروف"} - ${accName}`,
              account: acc,
              codeMatch: accCode.toLowerCase().indexOf(term),
              nameMatch: accName.toLowerCase().indexOf(term),
            };
          })
          .sort((a, b) => {
            const aCode = a.codeMatch === -1 ? Infinity : a.codeMatch;
            const bCode = b.codeMatch === -1 ? Infinity : b.codeMatch;

            if (aCode !== bCode) return aCode - bCode;

            const aName = a.nameMatch === -1 ? Infinity : a.nameMatch;
            const bName = b.nameMatch === -1 ? Infinity : b.nameMatch;

            return aName - bName;
          })
          .map(
            ({ value, label, account }): AccountOption => ({
              value,
              label,
              account,
            }),
          );
      } catch {
        return [];
      }
    },
    [],
  );

  const getAccountSelectValue = useCallback(
    (detail: VoucherDetail) => {
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
    },
    [accounts],
  );

  const generateNextVoucherNumber = useCallback(async () => {
    try {
      const nextId = await getNextVoucherNumber(0);

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
  }, []);

  const addDetailRow = useCallback(() => {
    setDetails((prev) => {
      if (prev.length > 0 && isEmptyDetail(prev[prev.length - 1])) {
        return prev;
      }

      return [
        ...prev,
        createEmptyDetail(
          voucherRef.current.vouch_id,
          voucherRef.current.cost_id ?? null,
        ),
      ];
    });
  }, []);

  const removeDetailRow = useCallback((index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateDetail = useCallback(
    (
      index: number,
      field: keyof VoucherDetail,
      value: VoucherDetail[keyof VoucherDetail],
    ) => {
      setDetails((prev) => {
        if (field === "acc_id" && value) {
          const numericValue = Number(value);

          if (Number.isFinite(numericValue) && numericValue > 0) {
            const isDuplicate = prev.some(
              (detail, detailIndex) =>
                detailIndex !== index && Number(detail.acc_id) === numericValue,
            );

            if (isDuplicate) {
              toast.error("⚠️ هذا الحساب مُدرج مسبقاً في القيد.", {
                id: "duplicate-account-warning",
              });

              return prev;
            }
          }
        }

        const updated = prev.map((detail, i) => {
          if (i !== index) return detail;

          const newDetail = { ...detail, [field]: value };

          Object.assign(newDetail, clearOppositeField(field, value));

          if (field === "acc_id" && value) {
            const selectedAccount = accounts.find((acc) => acc.id === value);

            if (selectedAccount) {
              const gauge = getAccountGauge(selectedAccount, caratTypes);

              newDetail.gauge = gauge;

              if (
                newDetail.g_debit != null &&
                parseNumber(newDetail.g_debit) > 0
              ) {
                newDetail.g_debit_base = calculateCalibratedGold(
                  parseNumber(newDetail.g_debit),
                  gauge,
                  BASE_GAUGE,
                  2,
                );
              }
              if (
                newDetail.g_credit != null &&
                parseNumber(newDetail.g_credit) > 0
              ) {
                newDetail.g_credit_base = calculateCalibratedGold(
                  parseNumber(newDetail.g_credit),
                  gauge,
                  BASE_GAUGE,
                  2,
                );
              }
            }
          }

          const currentGauge = newDetail.gauge || BASE_GAUGE;

          if (field === "g_debit") {
            const gDebitValue = value != null ? parseNumber(value) : 0;

            newDetail.g_debit_base =
              gDebitValue > 0 && currentGauge > 0
                ? calculateCalibratedGold(
                    gDebitValue,
                    currentGauge,
                    BASE_GAUGE,
                    2,
                  )
                : undefined;
          }

          if (field === "g_credit") {
            const gCreditValue = value != null ? parseNumber(value) : 0;

            newDetail.g_credit_base =
              gCreditValue > 0 && currentGauge > 0
                ? calculateCalibratedGold(
                    gCreditValue,
                    currentGauge,
                    BASE_GAUGE,
                    2,
                  )
                : undefined;
          }

          if (field === "g_debit_base") {
            const gDebitBaseValue = value != null ? parseNumber(value) : 0;

            if (gDebitBaseValue > 0) {
              const debitActual = parseNumber(
                newDetail.g_debit ?? newDetail.debit_g,
              );
              const normalizedBase = parseFloat(gDebitBaseValue.toFixed(2));

              newDetail.g_debit_base = normalizedBase;

              if (debitActual > 0) {
                const derivedGauge = calculateGaugeFromCalibrated(
                  normalizedBase,
                  debitActual,
                  BASE_GAUGE,
                  3,
                );

                newDetail.gauge = derivedGauge;

                const creditActual = parseNumber(
                  newDetail.g_credit ?? newDetail.credit_g,
                );

                if (creditActual > 0) {
                  newDetail.g_credit_base = calculateCalibratedGold(
                    creditActual,
                    derivedGauge,
                    BASE_GAUGE,
                    2,
                  );
                }
              } else if (currentGauge > 0) {
                const derivedDebit = calculateReverseCalibratedGold(
                  normalizedBase,
                  currentGauge,
                  BASE_GAUGE,
                );

                newDetail.g_debit = derivedDebit > 0 ? derivedDebit : undefined;
              }
            } else {
              newDetail.g_debit_base = undefined;
            }
          }

          if (field === "g_credit_base") {
            const gCreditBaseValue = value != null ? parseNumber(value) : 0;

            if (gCreditBaseValue > 0) {
              const creditActual = parseNumber(
                newDetail.g_credit ?? newDetail.credit_g,
              );
              const normalizedBase = parseFloat(gCreditBaseValue.toFixed(2));

              newDetail.g_credit_base = normalizedBase;

              if (creditActual > 0) {
                const derivedGauge = calculateGaugeFromCalibrated(
                  normalizedBase,
                  creditActual,
                  BASE_GAUGE,
                  3,
                );

                newDetail.gauge = derivedGauge;

                const debitActual = parseNumber(
                  newDetail.g_debit ?? newDetail.debit_g,
                );

                if (debitActual > 0) {
                  newDetail.g_debit_base = calculateCalibratedGold(
                    debitActual,
                    derivedGauge,
                    BASE_GAUGE,
                    2,
                  );
                }
              } else if (currentGauge > 0) {
                const derivedCredit = calculateReverseCalibratedGold(
                  normalizedBase,
                  currentGauge,
                  BASE_GAUGE,
                );

                newDetail.g_credit =
                  derivedCredit > 0 ? derivedCredit : undefined;
              }
            } else {
              newDetail.g_credit_base = undefined;
            }
          }

          if (field === "gauge") {
            const newGauge = parseNumber(value) || BASE_GAUGE;

            if (
              newDetail.g_debit != null &&
              newDetail.g_debit > 0 &&
              newGauge > 0
            ) {
              newDetail.g_debit_base = calculateCalibratedGold(
                newDetail.g_debit,
                newGauge,
                BASE_GAUGE,
                2,
              );
            }
            if (
              newDetail.g_credit != null &&
              newDetail.g_credit > 0 &&
              newGauge > 0
            ) {
              newDetail.g_credit_base = calculateCalibratedGold(
                newDetail.g_credit,
                newGauge,
                BASE_GAUGE,
                2,
              );
            }
          }

          return newDetail;
        });

        return updated;
      });
    },
    [accounts, caratTypes],
  );

  const handleMasterCostChange = useCallback((costId: number | null) => {
    const previousCost = voucherRef.current.cost_id ?? null;

    setVoucher((prev) => ({ ...prev, cost_id: costId ?? null }));

    setDetails((prev) =>
      prev.map((detail) => {
        const detailCost = detail.cost_id ?? 0;

        if (
          detailCost > 0 &&
          previousCost !== null &&
          detailCost !== previousCost
        ) {
          return detail;
        }

        return { ...detail, cost_id: costId ?? 0 };
      }),
    );
  }, []);

  const totals = useMemo(
    () => calculateVoucherTotals(details, true),
    [details],
  );
  const cashBalance = totals.totalDebit - totals.totalCredit;
  const goldBalance = totals.totalDebitG - totals.totalCreditG;
  const isCashBalanced = Math.abs(cashBalance) < 0.01;
  const isGoldBalanced = Math.abs(goldBalance) < 0.01;
  const isBalanced = isCashBalanced && isGoldBalanced;

  const checkExistingBalanceVoucher = useCallback(async (): Promise<
    number | null
  > => {
    try {
      const openingEntry = await voucherService.checkExistingOpeningEntry("1");

      if (!openingEntry) return null;

      if (isNewVoucher) {
        return openingEntry.id || openingEntry.vouch_id || null;
      }

      return null;
    } catch {
      return null;
    }
  }, [isNewVoucher]);

  const proceedWithSave = useCallback(async () => {
    const currentDetails = detailsRef.current.filter((d) => !isEmptyDetail(d));

    if (currentDetails.length === 0) {
      toast.error("يجب إضافة تفاصيل للقيد");

      return;
    }

    const detailsWithAccounts = currentDetails.filter(
      (d) => d.acc_id && d.acc_id > 0,
    );
    const detailsWithoutAccounts = currentDetails.filter(
      (d) => !d.acc_id || d.acc_id === 0,
    );

    if (detailsWithAccounts.length > 0 && detailsWithoutAccounts.length > 0) {
      toast.error("يرجى اختيار حساب لجميع الصفوف التي تحتوي على بيانات");

      return;
    }

    const currentVoucher = voucherRef.current;
    let finalVouchId = currentVoucher.vouch_id;

    if (
      isNewVoucher &&
      (!finalVouchId ||
        Number(finalVouchId) <= 0 ||
        !isFinite(Number(finalVouchId)))
    ) {
      try {
        finalVouchId = await getNextVoucherNumber(0);
        setVoucher((prev) => ({ ...prev, vouch_id: finalVouchId }));
      } catch {
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
        currentVoucher.cost_id != null && currentVoucher.cost_id > 0
          ? currentVoucher.cost_id
          : null;

      const voucherPayload = {
        vouch_id: finalVouchId,
        vouch_date: currentVoucher.vouch_date,
        vouch_type: 0,
        vouch_amt: 0,
        vouch_notes: currentVoucher.vouch_notes || "",
        vouch_status: currentVoucher.vouch_status || 1,
        pay_type: currentVoucher.pay_type,
        ref_no: currentVoucher.ref_no || "",
        opps_vouch: currentVoucher.opps_vouch || 0,
        cost_id: masterCostId,
      };

      const detailsPayload = currentDetails
        .filter((d) => d.acc_id && d.acc_id > 0)
        .map((detail) => ({
          id: detail.id || 0,
          vouch_id: finalVouchId,
          acc_id: detail.acc_id,
          debit: detail.debit,
          credit: detail.credit,
          debit_base: detail.debit_base ?? detail.debit,
          credit_base: detail.credit_base ?? detail.credit,
          gauge: detail.gauge,
          g_debit: detail.g_debit ?? detail.debit_g,
          g_credit: detail.g_credit ?? detail.credit_g,
          g_debit_base:
            detail.g_debit_base != null
              ? parseFloat(Number(detail.g_debit_base).toFixed(2))
              : 0,
          g_credit_base:
            detail.g_credit_base != null
              ? parseFloat(Number(detail.g_credit_base).toFixed(2))
              : 0,
          vouch_notes: detail.vouch_notes || "",
          cost_id:
            detail.cost_id != null && detail.cost_id > 0
              ? detail.cost_id
              : masterCostId,
          tax: 0,
          tax_prc: 0,
          vat_no: 0,
        }));

      let result;

      if (isNewVoucher || !voucherRecordId) {
        result = await createVoucherAction(
          voucherPayload,
          detailsPayload as VoucherDetailData[],
        );
      } else {
        const currentDetailIds = detailsPayload
          .map((d) => d.id)
          .filter((id) => id > 0);
        const origDetails = originalDetailsRef.current;
        const originalDetailIds = origDetails
          .map((d) => d.id)
          .filter((id) => id && id > 0) as number[];
        const deletedDetailIds = originalDetailIds.filter(
          (id) => !currentDetailIds.includes(id),
        );

        result = await updateVoucherAction(
          voucherPayload,
          detailsPayload as VoucherDetailData[],
          deletedDetailIds,
          Number(voucherRecordId),
        );
      }

      if (result.success && result.data) {
        const realId = result.data.id || currentVoucher.id || voucherRecordId;
        const vouchId = result.data.vouch_id || currentVoucher.vouch_id;

        setVoucher((prev) => ({
          ...prev,
          commit: true,
          post: false,
          id: realId,
          vouch_id: vouchId,
        }));

        toast.success(result.message);

        const timestamp = Date.now();

        if (
          (vouchId && Number(vouchId) > 0) ||
          (realId && Number(realId) > 0)
        ) {
          router.push(`/forms/balance?mode=preview&_t=${timestamp}`);
          setTimeout(() => router.refresh(), 100);
        } else {
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
  }, [isNewVoucher, voucherRecordId, router]);

  const saveVoucher = useCallback(async () => {
    if (isNewVoucher) {
      const existingId = await checkExistingBalanceVoucher();

      if (existingId) {
        toast.error(
          "⚠️ يوجد قيد افتتاحي موجود مسبقاً. يرجى تعديل القيد الموجود بدلاً من إنشاء قيد جديد.",
          { duration: 6000 },
        );
        router.push("/forms/balance?mode=edit");

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
  }, [
    isNewVoucher,
    checkExistingBalanceVoucher,
    voucher.vouch_date,
    isBalanced,
    proceedWithSave,
    router,
  ]);

  const printVoucher = useCallback(async () => {
    setIsPrinting(true);
    try {
      const printWindow = window.open("", "_blank");

      if (printWindow) {
        const html = generateBalanceVoucherPrintHTML(
          voucherRef.current,
          detailsRef.current,
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
  }, [accounts, totals, t]);

  const handleEditClick = useCallback(async () => {
    if (voucherRecordId && Number(voucherRecordId) > 0) {
      try {
        const { voucherService } = await import("@/services/api");

        await voucherService.update(Number(voucherRecordId), { commit: false });
      } catch {
        // silent
      }
    }

    setVoucher((prev) => ({ ...prev, commit: false }));

    if ((voucher.vouch_id && Number(voucher.vouch_id) > 0) || voucherRecordId) {
      router.push("/forms/balance?mode=edit");
    } else {
      setIsEditing(true);
      toast.success("✅ تم تفعيل وضع التعديل");
    }
  }, [voucherRecordId, voucher.vouch_id, router]);

  const handleUnbalancedConfirm = useCallback(async () => {
    setShowUnbalancedModal(false);
    await proceedWithSave();
  }, [proceedWithSave]);

  const handleUnbalancedCancel = useCallback(() => {
    setShowUnbalancedModal(false);
  }, []);

  return {
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
    showUnbalancedModal,
    defaultAccountOptions,

    totals,
    cashBalance,
    goldBalance,
    isCashBalanced,
    isGoldBalanced,
    isBalanced,

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
