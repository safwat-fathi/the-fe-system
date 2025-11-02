"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import { BalanceVoucherContainer } from "./components";

import { Voucher, VoucherDetail } from "@/types/voucher";
import { getNextVoucherNumber } from "@/utilities/numbering";
import { voucherService } from "@/services/api";
import {
  createVoucherAction,
  updateVoucherAction,
} from "@/app/actions/voucher.action";

import "bootstrap-icons/font/bootstrap-icons.css";

interface BalanceVoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  formData: any;
  formMode?: "new" | "edit" | "preview";
  voucherRecordId?: number | string | null;
  isNewVoucher?: boolean;
  startInEditMode?: boolean;
}

export default function BalanceVoucherClientPage({
  voucherData,
  voucherDetailsData,
  formData,
  formMode: initialFormMode = "new",
  voucherRecordId,
  isNewVoucher = true,
  startInEditMode: propStartInEditMode,
}: BalanceVoucherClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || initialFormMode;
  const formMode = (
    mode === "new" ? "new" : mode === "edit" ? "edit" : "preview"
  ) as "new" | "edit" | "preview";
  // استخدام propStartInEditMode إذا كان متوفراً، وإلا استخدام المنطق الافتراضي
  const startInEditMode =
    propStartInEditMode !== undefined
      ? propStartInEditMode
      : formMode === "edit" || formMode === "new";

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
  const [taxRates, setTaxRates] = useState<number[]>(formData.taxRates || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [originalDetails, setOriginalDetails] = useState<VoucherDetail[]>(
    voucherDetailsData || [],
  );
  const previousVouchNotesRef = useRef<string>(
    voucherData?.vouch_notes || "",
  );

  // استخدام useRef لتتبع ما إذا تم استدعاء generateNextVoucherNumber مسبقاً
  const hasGeneratedVoucherNumber = useRef(false);

  // Initialize component
  useEffect(() => {
    setIsClient(true);
    updateCurrentTime();

    // إضافة سطر فارغ واحد عند التهيئة للقيد الجديد فقط
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

    // حفظ التفاصيل الأصلية للقيد الموجود
    if (!isNewVoucher && voucherDetailsData && voucherDetailsData.length > 0) {
      setOriginalDetails([...voucherDetailsData]);
    }

    // توليد رقم القيد التالي للقيد الجديد - مرة واحدة فقط
    if (isNewVoucher && !hasGeneratedVoucherNumber.current && (!voucher.vouch_id || voucher.vouch_id === 0)) {
      hasGeneratedVoucherNumber.current = true;
      generateNextVoucherNumber().catch((error) => {
        console.error("خطأ في توليد رقم القيد:", error);
        hasGeneratedVoucherNumber.current = false; // إعادة المحاولة في المرة القادمة
      });
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(updateCurrentTime, 60000);

    return () => clearInterval(interval);
  }, [isClient]);

  // تحديث isEditing عند تغيير formMode
  useEffect(() => {
    setIsEditing(startInEditMode);
  }, [startInEditMode]);

  // نقل البيان من القيد الرئيسي إلى التفاصيل تلقائياً
  useEffect(() => {
    const currentNotes = voucher.vouch_notes || "";
    const previousNotes = previousVouchNotesRef.current;

    // فقط عند تغيير البيان الرئيسي
    if (currentNotes === previousNotes) return;

    // تحديث المرجع للبيان السابق
    previousVouchNotesRef.current = currentNotes;

    // إذا كان البيان فارغاً، لا تقم بأي شيء
    if (!currentNotes) return;

    setDetails((prev) => {
      return prev.map((detail) => {
        // إذا كان البيان في التفصيل فارغاً أو مطابقاً للبيان السابق، قم بتحديثه
        // إذا كان المستخدم قد عدّل البيان يدوياً (مختلف عن البيان السابق)، اتركه كما هو
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

  // دالة تحديث الحسابات المحملة عند اختيار حساب جديد
  const updateAccountsList = (newAccount: any) => {
    if (!accounts.find((acc) => acc.id === newAccount.id)) {
      setAccounts([...accounts, newAccount]);
    }
  };

  const generateNextVoucherNumber = async () => {
    try {
      const nextId = await getNextVoucherNumber(0); // القيد الافتتاحي نوعه 0

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
      debit_g: undefined,
      credit_g: undefined,
      gauge: 875,
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

        // تصفير الحقل المقابل تلقائياً
        if (field === "debit" && value !== undefined && parseFloat(value) > 0) {
          newDetail.credit = undefined;
        } else if (
          field === "credit" &&
          value !== undefined &&
          parseFloat(value) > 0
        ) {
          newDetail.debit = undefined;
        } else if (
          field === "base_debit" &&
          value !== undefined &&
          parseFloat(value) > 0
        ) {
          newDetail.base_credit = undefined;
        } else if (
          field === "base_credit" &&
          value !== undefined &&
          parseFloat(value) > 0
        ) {
          newDetail.base_debit = undefined;
        } else if (
          field === "debit_g" &&
          value !== undefined &&
          parseFloat(value) > 0
        ) {
          newDetail.credit_g = undefined;
        } else if (
          field === "credit_g" &&
          value !== undefined &&
          parseFloat(value) > 0
        ) {
          newDetail.debit_g = undefined;
        }

        // عند اختيار الحساب، جلب المعايرة من caratTypes أو من الحساب
        if (field === "acc_id" && value) {
          const selectedAccount = accounts.find((acc) => acc.id === value);

          if (selectedAccount) {
            // البحث عن المعايرة المرتبطة بالحساب
            const accountGauge = selectedAccount.gauge || selectedAccount.carat;

            if (accountGauge && caratTypes.length > 0) {
              const matchedCaratType = caratTypes.find(
                (ct: any) =>
                  ct.id === accountGauge ||
                  ct.gauge === accountGauge ||
                  ct.value === accountGauge,
              );

              if (matchedCaratType) {
                newDetail.gauge =
                  matchedCaratType.gauge ||
                  matchedCaratType.value ||
                  matchedCaratType.id ||
                  875;
              } else {
                newDetail.gauge = accountGauge;
              }
            } else if (accountGauge) {
              newDetail.gauge = accountGauge;
            } else {
              // افتراضياً 875 إذا لم توجد معايرة
              newDetail.gauge = 875;
            }
          }
        }

        // حساب الذهب المعاير تلقائياً بناءً على المعادلة: debit_g = base_debit * (gauge / 875)
        // المعادلة: g_weight = weight * (gauge / 875)
        const baseGauge = 875; // المعيار الأساسي (21 قيراط)
        const currentGauge = newDetail.gauge || 875;

        // حساب debit_g من base_debit عند تغيير base_debit أو gauge
        if (field === "base_debit") {
          const baseDebit = value !== undefined && value !== null ? parseFloat(String(value)) : 0;
          if (baseDebit > 0 && currentGauge > 0) {
            const calculatedDebitG = (baseDebit * currentGauge) / baseGauge;
            newDetail.debit_g = parseFloat(calculatedDebitG.toFixed(6));
          } else {
            newDetail.debit_g = undefined;
          }
        } else if (field === "gauge" && newDetail.base_debit !== undefined && newDetail.base_debit !== null && newDetail.base_debit > 0) {
          // إعادة حساب debit_g عند تغيير المعايرة إذا كان هناك base_debit
          const newGauge = parseFloat(String(value)) || 875;
          const baseDebit = parseFloat(String(newDetail.base_debit)) || 0;
          if (baseDebit > 0 && newGauge > 0) {
            const calculatedDebitG = (baseDebit * newGauge) / baseGauge;
            newDetail.debit_g = parseFloat(calculatedDebitG.toFixed(6));
          }
        }

        // حساب credit_g من base_credit عند تغيير base_credit أو gauge
        if (field === "base_credit") {
          const baseCredit = value !== undefined && value !== null ? parseFloat(String(value)) : 0;
          if (baseCredit > 0 && currentGauge > 0) {
            const calculatedCreditG = (baseCredit * currentGauge) / baseGauge;
            newDetail.credit_g = parseFloat(calculatedCreditG.toFixed(6));
          } else {
            newDetail.credit_g = undefined;
          }
        } else if (field === "gauge" && newDetail.base_credit !== undefined && newDetail.base_credit !== null && newDetail.base_credit > 0) {
          // إعادة حساب credit_g عند تغيير المعايرة إذا كان هناك base_credit
          const newGauge = parseFloat(String(value)) || 875;
          const baseCredit = parseFloat(String(newDetail.base_credit)) || 0;
          if (baseCredit > 0 && newGauge > 0) {
            const calculatedCreditG = (baseCredit * newGauge) / baseGauge;
            newDetail.credit_g = parseFloat(calculatedCreditG.toFixed(6));
          }
        }

        return newDetail;
      });

      return updated;
    });
  };

  // تحسين: استخدام useMemo بدلاً من useCallback لحساب الإجماليات
  const totals = useMemo(() => {
    return details.reduce(
      (totals, detail) => {
        const debit =
          detail.debit !== undefined
            ? parseFloat(String(detail.debit)) || 0
            : 0;
        const credit =
          detail.credit !== undefined
            ? parseFloat(String(detail.credit)) || 0
            : 0;
        const debitG =
          detail.debit_g !== undefined
            ? parseFloat(String(detail.debit_g)) || 0
            : 0;
        const creditG =
          detail.credit_g !== undefined
            ? parseFloat(String(detail.credit_g)) || 0
            : 0;

        return {
          totalDebit: totals.totalDebit + debit,
          totalCredit: totals.totalCredit + credit,
          totalDebitG: totals.totalDebitG + debitG,
          totalCreditG: totals.totalCreditG + creditG,
          totalTax: 0,
          totalTaxPrc: 0,
        };
      },
      {
        totalDebit: 0,
        totalCredit: 0,
        totalDebitG: 0,
        totalCreditG: 0,
        totalTax: 0,
        totalTaxPrc: 0,
      },
    );
  }, [details]);
  
  // حساب الاتزان: النقدية و الذهب المعاير كلاهما يجب أن يكون متزناً
  const cashBalance = totals.totalDebit - totals.totalCredit;
  const goldBalance = totals.totalDebitG - totals.totalCreditG;
  const isCashBalanced = Math.abs(cashBalance) < 0.01;
  const isGoldBalanced = Math.abs(goldBalance) < 0.01;
  const isBalanced = isCashBalanced && isGoldBalanced;

  // التحقق من وجود قيد افتتاحي قبل الحفظ
  const checkExistingBalanceVoucher = async (): Promise<number | null> => {
    try {
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: "0", // قيد افتتاحي فقط
      });

      if (vouchersResponse.success && vouchersResponse.data) {
        const vouchers = Array.isArray(vouchersResponse.data)
          ? vouchersResponse.data
          : [];

        // إذا كان هناك قيد موجود ولم نكن في وضع التعديل
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
    // التحقق من وجود قيد افتتاحي قبل الحفظ (للقيود الجديدة فقط)
    if (isNewVoucher) {
      const existingId = await checkExistingBalanceVoucher();
      if (existingId) {
        toast.error(
          "⚠️ يوجد قيد افتتاحي موجود مسبقاً. يرجى تعديل القيد الموجود بدلاً من إنشاء قيد جديد.",
          { duration: 6000 },
        );
        // إعادة التوجيه إلى القيد الموجود
        router.push(`/forms/balance/${existingId}`);
        return;
      }
    }
    // التحقق من التاريخ - منع التواريخ المستقبلية
    const voucherDate = new Date(voucher.vouch_date);
    const today = new Date();

    today.setHours(23, 59, 59, 999);

    if (voucherDate > today) {
      toast.error("لا يمكن إنشاء قيد بتاريخ أكبر من تاريخ اليوم");

      return;
    }

    // في القيد الافتتاحي، يمكن الحفظ حتى لو كان غير متزن (فقط تنبيه)
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
      // عرض تنبيه فقط لكن لا نمنع الحفظ
      toast("تم حفظ القيد رغم عدم التوازن", {
        icon: "⚠️",
        duration: 4000,
      });
    }

    // التحقق من وجود حسابات فارغة
    const detailsWithAccounts = details.filter(
      (detail) => detail.acc_id && detail.acc_id > 0,
    );
    const detailsWithoutAccounts = details.filter(
      (detail) => !detail.acc_id || detail.acc_id === 0,
    );

    // إذا كان هناك مزيج من تفاصيل مع حسابات وبدون حسابات، هذا خطأ
    if (detailsWithAccounts.length > 0 && detailsWithoutAccounts.length > 0) {
      toast.error("يرجى اختيار حساب لجميع الصفوف التي تحتوي على بيانات");

      return;
    }

    // توليد رقم القيد إذا لم يكن موجوداً (للقيد الجديد فقط)
    let finalVouchId = voucher.vouch_id;
    if (isNewVoucher && (!finalVouchId || finalVouchId <= 0 || !isFinite(finalVouchId))) {
      try {
        finalVouchId = await getNextVoucherNumber(0); // القيد الافتتاحي نوعه 0
        // تحديث state فوراً
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

    // التحقق النهائي من رقم القيد
    if (!finalVouchId || finalVouchId <= 0 || !isFinite(finalVouchId)) {
      toast.error("خطأ: رقم القيد غير صحيح. يرجى إعادة تحميل الصفحة.");
      return;
    }

    setIsLoading(true);
    try {
      const voucherData = {
        vouch_id: finalVouchId,
        vouch_date: voucher.vouch_date,
        vouch_type: 0, // القيد الافتتاحي نوعه دائماً 0 (ثابت)
        vouch_amt: 0, // إبقاء المبلغ الإجمالي 0 دائماً
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
        result = await updateVoucherAction(
          Number(voucherRecordId),
          voucherData,
          detailsData,
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

        // التوجيه إلى وضع preview بعد الحفظ
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
        const formattedDate = voucher.vouch_date
          ? new Date(voucher.vouch_date).toLocaleDateString("ar-SA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "";

        const validDetails = details.filter((d) => d.acc_id && d.acc_id > 0);

        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <title>قيد افتتاحي - ${voucher.vouch_id}</title>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
              <link
                href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap"
                rel="stylesheet"
              />
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                body {
                  font-family: 'Cairo', sans-serif;
                  padding: 30px 20px;
                  background: #fff;
                  color: #2d3748;
                  line-height: 1.6;
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
                }
                
                .header-info {
                  display: flex;
                  justify-content: center;
                  gap: 40px;
                  flex-wrap: wrap;
                  margin-top: 20px;
                }
                
                .header-info-item {
                  display: flex;
                  flex-direction: column;
                  gap: 5px;
                }
                
                .header-info-label {
                  font-size: 12px;
                  color: #718096;
                  font-weight: 600;
                  text-transform: uppercase;
                }
                
                .header-info-value {
                  font-size: 16px;
                  color: #2d3748;
                  font-weight: 600;
                }
                
                .voucher-notes {
                  margin-top: 15px;
                  padding: 15px;
                  background: #f7fafc;
                  border-right: 4px solid #4299e1;
                  border-radius: 4px;
                  font-size: 14px;
                  color: #4a5568;
                }
                
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 30px 0;
                  font-size: 12px;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                
                th {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: #fff;
                  padding: 14px 10px;
                  text-align: center;
                  font-weight: 600;
                  border: 1px solid #4c51bf;
                  font-size: 12px;
                }
                
                td {
                  padding: 12px 10px;
                  text-align: center;
                  border: 1px solid #e2e8f0;
                  font-size: 11.5px;
                  color: #2d3748;
                }
                
                tr:nth-child(even) {
                  background-color: #f8f9fa;
                }
                
                tr:hover {
                  background-color: #f1f3f5;
                }
                
                .account-code {
                  font-family: 'Courier New', monospace;
                  font-weight: 600;
                  color: #4a5568;
                }
                
                .account-name {
                  text-align: right;
                  font-weight: 500;
                  color: #2d3748;
                }
                
                .amount-debit {
                  color: #059669;
                }
                
                .amount-credit {
                  color: #dc2626;
                }
                
                .amount-gold {
                  color: #d97706;
                  font-weight: 600;
                }
                
                .gauge {
                  font-family: 'Courier New', monospace;
                  color: #7c3aed;
                  font-weight: 500;
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
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>قيد افتتاحي</h1>
                <div class="header-info">
                  <div class="header-info-item">
                    <span class="header-info-label">رقم القيد</span>
                    <span class="header-info-value">${voucher.vouch_id || "-"}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">التاريخ</span>
                    <span class="header-info-value">${formattedDate}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">عدد البنود</span>
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
              
              <table>
                <thead>
                  <tr>
                    <th>رقم الحساب</th>
                    <th>اسم الحساب</th>
                    <th>مدين</th>
                    <th>دائن</th>
                    <th>مدين معاير</th>
                    <th>دائن معاير</th>
                    <th>المعايرة</th>
                    <th>البيان</th>
                  </tr>
                </thead>
                <tbody>
                  ${validDetails
                    .map((detail) => {
                      const account = accounts.find(
                        (acc) => acc.id === detail.acc_id,
                      );
                      const debit = detail.debit || 0;
                      const credit = detail.credit || 0;
                      const debitG = detail.debit_g || 0;
                      const creditG = detail.credit_g || 0;
                      const gauge = detail.gauge || 875;

                      return `
                      <tr>
                        <td class="account-code">${account?.acc_code || "-"}</td>
                        <td class="account-name">${account?.acc_name || "-"}</td>
                        <td class="amount amount-debit">${debit > 0 ? debit.toFixed(2) : "-"}</td>
                        <td class="amount amount-credit">${credit > 0 ? credit.toFixed(2) : "-"}</td>
                        <td class="amount amount-gold">${debitG > 0 ? debitG.toFixed(2) : "-"}</td>
                        <td class="amount amount-gold">${creditG > 0 ? creditG.toFixed(2) : "-"}</td>
                        <td class="gauge">${gauge}</td>
                        <td style="text-align: right; font-size: 11px; color: #718096;">${detail.vouch_notes || "-"}</td>
                      </tr>
                    `;
                    })
                    .join("")}
                  <tr class="totals">
                    <td colspan="2" style="text-align: right; padding-right: 20px; font-weight: 700;">الإجمالي</td>
                    <td class="amount amount-debit">${totals.totalDebit.toFixed(2)}</td>
                    <td class="amount amount-credit">${totals.totalCredit.toFixed(2)}</td>
                    <td class="amount amount-gold">${totals.totalDebitG.toFixed(2)}</td>
                    <td class="amount amount-gold">${totals.totalCreditG.toFixed(2)}</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
              
              <div class="footer">
                <p>تم طباعة هذا القيد بتاريخ ${new Date().toLocaleDateString("ar-SA")} - نظام NafeesWeb</p>
              </div>
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

  const handleEditClick = () => {
    // عند فتح وضع التعديل، نلغي commit (تصبح false) حتى يتم الحفظ
    setVoucher((prev) => ({
      ...prev,
      commit: false,
    }));

    // تغيير وضع الصفحة إلى edit باستخدام query params في نفس الصفحة
    if (voucherRecordId) {
      router.push(`/forms/balance?mode=edit`);
    } else {
      // إذا لم يكن هناك voucherRecordId، نفعّل التعديل مباشرة
      setIsEditing(true);
      toast.success("✅ تم تفعيل وضع التعديل");
    }
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen">
        جاري التحميل...
      </div>
    );
  }

  return (
    <BalanceVoucherContainer
      accounts={accounts}
      caratTypes={caratTypes}
      costCenters={costCenters}
      currentTime={currentTime}
      details={details}
      formMode={formMode}
      isBalanced={isBalanced}
      isEditing={isEditing}
      isLoading={isLoading}
      isPrinting={isPrinting}
      taxRates={taxRates}
      voucher={voucher}
      voucherStatuses={voucherStatuses}
      voucherTypes={voucherTypes}
      onAddRow={addDetailRow}
      onEditClick={handleEditClick}
      onPrint={printVoucher}
      onRemoveRow={removeDetailRow}
      onSave={saveVoucher}
      onUpdateAccountsList={updateAccountsList}
      onUpdateDetail={updateDetail}
      onVoucherChange={(field, value) =>
        setVoucher((prev) => ({ ...prev, [field]: value }))
      }
    />
  );
}

