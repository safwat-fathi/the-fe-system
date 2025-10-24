"use client";

import { useState, useEffect, useCallback } from "react";

import { BalanceVoucherContainer } from "./components";

import { Voucher, VoucherDetail } from "@/types/voucher";
import {
  voucherService,
  accountService,
  costCenterService,
} from "@/services/api";
import { getNextVoucherNumber } from "@/utilities/numbering";

import "bootstrap-icons/font/bootstrap-icons.css";

export default function BalanceVoucherPage() {
  // State Management
  const [voucher, setVoucher] = useState<Voucher>({
    vouch_id: 0,
    vouch_date: new Date().toISOString(),
    vouch_type: 0, // قيد افتتاحي
    vouch_amt: 0,
    pay_type: 1,
    cr_date: new Date().toISOString(),
    vouch_status: 1,
  });

  const [currentTime, setCurrentTime] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [details, setDetails] = useState<VoucherDetail[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [voucherTypes, setVoucherTypes] = useState<any[]>([]);
  const [voucherStatuses, setVoucherStatuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Initialize component
  useEffect(() => {
    setIsClient(true);
    updateCurrentTime();
    loadInitialData();
  }, []);

  useEffect(() => {
    console.log("Creating new opening voucher, getting next ID...");
    generateNextVoucherNumber();
    addDetailRow();
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(updateCurrentTime, 60000);

    return () => clearInterval(interval);
  }, [isClient]);

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

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // استخدام النظام الجديد من services
      const [
        accountsResponse,
        costCentersResponse,
        voucherTypesResponse,
        voucherStagesResponse,
      ] = await Promise.all([
        accountService.getAllAccounts(),
        costCenterService.getAllCostCenters(),
        voucherService.getVoucherTypes(),
        voucherService.getVoucherStages(),
      ]);

      // معالجة الحسابات
      if (accountsResponse && Array.isArray(accountsResponse)) {
        const level5Accounts = accountsResponse.filter(
          (account: any) => account.acc_level === 5,
        );

        setAccounts(level5Accounts);
      } else {
        setAccounts([]);
      }

      // معالجة مراكز التكلفة
      if (costCentersResponse && Array.isArray(costCentersResponse)) {
        setCostCenters(costCentersResponse);
      } else {
        setCostCenters([]);
      }

      // معالجة أنواع السندات
      if (voucherTypesResponse.success && voucherTypesResponse.data) {
        setVoucherTypes(
          Array.isArray(voucherTypesResponse.data)
            ? voucherTypesResponse.data
            : [],
        );
      } else {
        setVoucherTypes([]);
      }

      // معالجة حالات السندات
      if (voucherStagesResponse.success && voucherStagesResponse.data) {
        setVoucherStatuses(
          Array.isArray(voucherStagesResponse.data)
            ? voucherStagesResponse.data
            : [],
        );
      } else {
        setVoucherStatuses([]);
      }
    } catch (error) {
      console.error("خطأ في تحميل البيانات الأولية:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNextVoucherNumber = async () => {
    try {
      const nextId = await getNextVoucherNumber(voucher.vouch_type);

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
      debit: 0,
      credit: 0,
      debit_g: 0,
      credit_g: 0,
      gauge: 875,
      cost_id: 0,
      vouch_notes: "",
      tax: 0,
      tax_prc: 0,
      vat_no: 0,
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
    console.log(`تحديث الصف ${index}, الحقل ${field}, القيمة:`, value);

    setDetails((prev) => {
      const updated = prev.map((detail, i) =>
        i === index ? { ...detail, [field]: value } : detail,
      );

      console.log(`الصف ${index} بعد التحديث:`, updated[index]);

      return updated;
    });
  };

  const updateVoucherType = async (newType: number) => {
    setVoucher((prev) => ({ ...prev, vouch_type: newType }));
    await generateNextVoucherNumber();
  };

  const calculateTotals = useCallback(() => {
    const totals = details.reduce(
      (totals, detail) => {
        const debit = parseFloat(String(detail.debit || 0)) || 0;
        const credit = parseFloat(String(detail.credit || 0)) || 0;
        const debitG = parseFloat(String(detail.debit_g || 0)) || 0;
        const creditG = parseFloat(String(detail.credit_g || 0)) || 0;
        const tax = parseFloat(String(detail.tax || 0)) || 0;
        const taxPrc = parseFloat(String(detail.tax_prc || 0)) || 0;

        return {
          totalDebit: totals.totalDebit + debit,
          totalCredit: totals.totalCredit + credit,
          totalDebitG: totals.totalDebitG + debitG,
          totalCreditG: totals.totalCreditG + creditG,
          totalTax: totals.totalTax + tax,
          totalTaxPrc: totals.totalTaxPrc + taxPrc,
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

    return totals;
  }, [details]);

  const totals = calculateTotals();
  const balance = totals.totalDebit - totals.totalCredit;
  const isBalanced = Math.abs(balance) < 0.01;

  const saveVoucher = async () => {
    if (!isBalanced) {
      alert("يجب أن يكون إجمالي المدين مساوي لإجمالي الدائن");

      return;
    }

    if (details.length === 0) {
      alert("يجب إضافة تفاصيل للقيد");

      return;
    }

    if (
      !voucher.vouch_id ||
      voucher.vouch_id <= 0 ||
      !isFinite(voucher.vouch_id)
    ) {
      console.error("Invalid voucher ID:", voucher.vouch_id);
      alert("خطأ: رقم القيد غير صحيح. يرجى إعادة تحميل الصفحة.");

      return;
    }

    setIsLoading(true);
    try {
      const voucherData: any = {
        vouch_id: voucher.vouch_id,
        vouch_date: voucher.vouch_date,
        vouch_type: voucher.vouch_type,
        vouch_amt: totals.totalDebit,
        vouch_notes: voucher.vouch_notes || "",
        vouch_status: voucher.vouch_status || 1,
        pay_type: voucher.pay_type,
        ref_no: voucher.ref_no || "",
        cr_date: new Date().toISOString(),
      };

      // حفظ السند الرئيسي
      const voucherResponse = await voucherService.create(voucherData);

      if (!voucherResponse.success || !voucherResponse.data) {
        throw new Error(voucherResponse.message || "خطأ في حفظ رأس القيد");
      }

      const savedVoucher = voucherResponse.data;
      const masterId = savedVoucher.vouch_id || savedVoucher.id;

      if (!masterId || !isFinite(masterId) || masterId <= 0) {
        throw new Error(
          `لم يتم الحصول على معرف القيد الصحيح من الخادم: ${masterId}`,
        );
      }

      // حفظ التفاصيل
      for (const detail of details) {
        if (!detail.acc_id || detail.acc_id === 0) {
          continue;
        }

        const detailData = {
          vouch: masterId,
          acc: detail.acc_id,
          debit: detail.debit || 0,
          credit: detail.credit || 0,
          debit_g: detail.debit_g || 0,
          credit_g: detail.credit_g || 0,
          gauge: detail.gauge || 875,
          vouch_notes: detail.vouch_notes || "",
          cost_id: detail.cost_id || null,
          tax: detail.tax || 0,
          tax_prc: detail.tax_prc || 0,
          vat_no: detail.vat_no || 0,
          cr_date: new Date().toISOString(),
        };

        const detailResponse = await voucherService.createDetail(
          detailData as any,
        );

        if (!detailResponse.success) {
          throw new Error(detailResponse.message || "خطأ في حفظ تفصيل القيد");
        }
      }

      setVoucher((prev) => ({ ...prev, commit: true, id: masterId }));

      alert("تم حفظ القيد الافتتاحي بنجاح");
    } catch (error) {
      alert(
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
        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <title>قيد افتتاحي - ${voucher.vouch_id}</title>
              <style>
                body { font-family: 'Cairo', sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #f5f5f5; }
                .header { text-align: center; margin-bottom: 20px; }
                .totals { font-weight: bold; background-color: #f0f0f0; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>قيد افتتاحي</h1>
                <p>رقم القيد: ${voucher.vouch_id}</p>
                <p>التاريخ: ${voucher.vouch_date}</p>
                <p>البيان: ${voucher.vouch_notes || ""}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>رقم الحساب</th>
                    <th>اسم الحساب</th>
                    <th>مدين</th>
                    <th>دائن</th>
                    <th>مدين ذهب</th>
                    <th>دائن ذهب</th>
                    <th>المعايرة</th>
                    <th>البيان</th>
                  </tr>
                </thead>
                <tbody>
                  ${details
                    .map((detail) => {
                      const account = accounts.find(
                        (acc) => acc.id === detail.acc_id,
                      );

                      return `
                      <tr>
                        <td>${account?.acc_code || ""}</td>
                        <td>${account?.acc_name || ""}</td>
                        <td>${detail.debit || 0}</td>
                        <td>${detail.credit || 0}</td>
                        <td>${detail.debit_g || 0}</td>
                        <td>${detail.credit_g || 0}</td>
                        <td>${detail.gauge || 875}</td>
                        <td>${detail.vouch_notes || ""}</td>
                      </tr>
                    `;
                    })
                    .join("")}
                  <tr class="totals">
                    <td colspan="2">الإجمالي</td>
                    <td>${totals.totalDebit}</td>
                    <td>${totals.totalCredit}</td>
                    <td>${totals.totalDebitG}</td>
                    <td>${totals.totalCreditG}</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();

        setVoucher((prev) => ({ ...prev, print: true }));
      }
    } catch (error) {
      alert(
        `حدث خطأ أثناء الطباعة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
      );
    } finally {
      setIsPrinting(false);
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
      costCenters={costCenters}
      currentTime={currentTime}
      details={details}
      isBalanced={isBalanced}
      isLoading={isLoading}
      isPrinting={isPrinting}
      voucher={voucher}
      voucherStatuses={voucherStatuses}
      voucherTypes={voucherTypes}
      onAddRow={addDetailRow}
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
