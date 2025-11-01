"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import { BalanceVoucherContainer } from "../components";

import { Voucher, VoucherDetail } from "@/types/voucher";
import { voucherService } from "@/services/api";
import { updateVoucherAction } from "@/app/actions/voucher.action";

import "bootstrap-icons/font/bootstrap-icons.css";

interface BalanceVoucherClientPageProps {
  voucherData: Voucher;
  voucherDetailsData: VoucherDetail[];
  formData: any;
  formMode: "new" | "edit" | "preview";
  voucherRecordId: number;
}

export default function BalanceVoucherClientPage({
  voucherData: initialVoucherData,
  voucherDetailsData: initialVoucherDetailsData,
  formData,
  formMode: initialFormMode,
  voucherRecordId,
}: BalanceVoucherClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || initialFormMode;
  const formMode = (
    mode === "new" ? "new" : mode === "edit" ? "edit" : "preview"
  ) as "new" | "edit" | "preview";
  const startInEditMode = formMode === "edit";

  // State Management
  const [voucher, setVoucher] = useState<Voucher>(initialVoucherData);
  const [currentTime, setCurrentTime] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [details, setDetails] = useState<VoucherDetail[]>(
    initialVoucherDetailsData.length > 0 ? initialVoucherDetailsData : [],
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
    initialVoucherDetailsData,
  );

  // Initialize component
  useEffect(() => {
    setIsClient(true);
    updateCurrentTime();

    // لا نضيف أسطر فارغة تلقائياً في القيد الموجود
    // التفاصيل تأتي من قاعدة البيانات

    // حفظ التفاصيل الأصلية
    if (initialVoucherDetailsData.length > 0) {
      setOriginalDetails([...initialVoucherDetailsData]);
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
      tax: undefined,
      tax_prc: undefined,
      vat_no: undefined,
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
              newDetail.gauge = 875;
            }
          }
        }

        return newDetail;
      });

      return updated;
    });
  };

  const calculateTotals = useCallback(() => {
    const totals = details.reduce(
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

    return totals;
  }, [details]);

  const totals = calculateTotals();
  const balance = totals.totalDebit - totals.totalCredit;
  const isBalanced = Math.abs(balance) < 0.01;

  const saveVoucher = async () => {
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
      toast("تم حفظ القيد رغم عدم التوازن", {
        icon: "⚠️",
        duration: 4000,
      });
    }

    // التحقق من وجود حسابات فارغة
    // السماح بحفظ قيد بدون تفاصيل أو بتفاصيل كلها فارغة
    // ولكن إذا كان هناك تفاصيل، يجب أن يكون لكل تفصيل حساب أو لا يوجد حساب لأي منها
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

    if (
      !voucher.vouch_id ||
      voucher.vouch_id <= 0 ||
      !isFinite(voucher.vouch_id)
    ) {
      toast.error("خطأ: رقم القيد غير صحيح. يرجى إعادة تحميل الصفحة.");

      return;
    }

    setIsLoading(true);
    try {
      const voucherData = {
        vouch_id: voucher.vouch_id,
        vouch_date: voucher.vouch_date,
        vouch_type: 0, // القيد الافتتاحي نوعه دائماً 0 (ثابت)
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
          vouch_id: voucher.vouch_id,
          acc_id: detail.acc_id,
          debit: detail.debit,
          credit: detail.credit,
          debit_g: detail.debit_g,
          credit_g: detail.credit_g,
          gauge: detail.gauge,
          vouch_notes: detail.vouch_notes || "",
          cost_id: detail.cost_id || null,
          // لا توجد ضريبة في القيد الافتتاحي
          tax: 0,
          tax_prc: 0,
          vat_no: 0,
        }));

      // تحديد التفاصيل المحذوفة
      const currentDetailIds = detailsData
        .map((d) => d.id)
        .filter((id) => id > 0);
      const originalDetailIds = originalDetails
        .map((d) => d.id)
        .filter((id) => id && id > 0) as number[];
      const deletedDetailIds = originalDetailIds.filter(
        (id) => !currentDetailIds.includes(id),
      );

      const result = await updateVoucherAction(
        voucherData,
        detailsData,
        deletedDetailIds,
        voucherRecordId, // تمرير الـ id الحقيقي مباشرة
      );

      if (result.success && result.data) {
        // استخدام voucherRecordId إذا كان متوفراً، وإلا استخدام result.data.id
        const realId = voucherRecordId || result.data.id;
        const vouchId = result.data.vouch_id || voucher.vouch_id;

        setVoucher((prev) => ({
          ...prev,
          commit: true,
          id: realId,
          vouch_id: vouchId,
        }));

        toast.success(result.message);

        // التوجيه إلى وضع preview بعد الحفظ
        // استخدام voucherRecordId دائماً إذا كان موجوداً (الأكثر موثوقية)
        const targetId = voucherRecordId || realId;
        if (targetId) {
          router.push(`/forms/balance/${targetId}?mode=preview`);
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
              <meta charset="UTF-8">
              <title>قيد افتتاحي - ${voucher.vouch_id}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
                
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                body {
                  font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
                  font-size: 13px;
                  line-height: 1.6;
                  color: #2d3748;
                  background: #ffffff;
                  padding: 40px 30px;
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
                  letter-spacing: 0.5px;
                }
                
                .header-info {
                  display: flex;
                  justify-content: center;
                  gap: 40px;
                  margin-top: 15px;
                  flex-wrap: wrap;
                }
                
                .header-info-item {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 5px;
                }
                
                .header-info-label {
                  font-size: 11px;
                  color: #718096;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                
                .header-info-value {
                  font-size: 15px;
                  color: #2d3748;
                  font-weight: 600;
                }
                
                .voucher-notes {
                  margin-top: 20px;
                  padding: 12px 20px;
                  background: #f7fafc;
                  border-right: 4px solid #4299e1;
                  border-radius: 6px;
                  font-size: 13px;
                  color: #4a5568;
                }
                
                table {
                  width: 100%;
                  border-collapse: separate;
                  border-spacing: 0;
                  margin: 25px 0;
                  background: #ffffff;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                }
                
                thead {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                
                th {
                  padding: 14px 10px;
                  text-align: center;
                  font-weight: 600;
                  font-size: 12px;
                  color: #ffffff;
                  text-transform: uppercase;
                  letter-spacing: 0.3px;
                  border: none;
                  white-space: nowrap;
                }
                
                tbody tr {
                  transition: background-color 0.2s;
                }
                
                tbody tr:nth-child(even) {
                  background-color: #f8fafc;
                }
                
                td {
                  padding: 12px 10px;
                  text-align: center;
                  border-bottom: 1px solid #e2e8f0;
                  border-left: 1px solid #e2e8f0;
                  font-size: 12.5px;
                  color: #4a5568;
                }
                
                .account-code {
                  font-weight: 600;
                  color: #2d3748;
                  font-family: 'Courier New', monospace;
                }
                
                .account-name {
                  text-align: right;
                  color: #4a5568;
                }
                
                .amount {
                  font-family: 'Courier New', monospace;
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
                  
                  .header {
                    margin-bottom: 25px;
                    padding-bottom: 20px;
                  }
                  
                  table {
                    margin: 20px 0;
                  }
                  
                  @page {
                    margin: 1cm;
                    size: A4;
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
      onEditClick={() => {
        setVoucher((prev) => ({ ...prev, commit: false }));
        router.push(`/forms/balance/${voucher.id}?mode=edit`);
      }}
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
