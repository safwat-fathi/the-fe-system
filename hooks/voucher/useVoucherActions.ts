/**
 * Hook for voucher actions (save, update, print)
 * العمليات على السند (حفظ، تحديث، طباعة)
 */

import type { Voucher, VoucherDetail } from "@/types/voucher";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { voucherService } from "@/services/api";
import {
  createVoucherAction,
  updateVoucherAction,
} from "@/app/actions/voucher.action";
import { formatAmount } from "@/utilities/formatAmount";

interface UseVoucherActionsProps {
  voucher: Voucher;
  setVoucher: (voucher: Voucher | ((prev: Voucher) => Voucher)) => void;
  details: VoucherDetail[];
  setDetails: (
    details: VoucherDetail[] | ((prev: VoucherDetail[]) => VoucherDetail[]),
  ) => void;
  originalDetails: VoucherDetail[];
  formMode: "new" | "edit" | "preview";
  voucherRecordId?: number | string | null;
  accounts: any[];
  totals: {
    totalDebit: number;
    totalCredit: number;
    totalDebitG: number;
    totalCreditG: number;
  };
  isCashBalanced: boolean;
  isGoldBalanced: boolean;
}

export const useVoucherActions = ({
  voucher,
  setVoucher,
  details,
  setDetails,
  originalDetails,
  formMode,
  voucherRecordId,
  accounts,
  totals,
  isCashBalanced,
  isGoldBalanced,
}: UseVoucherActionsProps) => {
  const router = useRouter();
  const t = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Save voucher
  const saveVoucher = async () => {
    const voucherDate = new Date(voucher.vouch_date);
    const today = new Date();

    today.setHours(23, 59, 59, 999);

    if (voucherDate > today) {
      toast.error("لا يمكن إنشاء قيد بتاريخ أكبر من تاريخ اليوم");

      return;
    }

    if (!isCashBalanced) {
      toast.error("يجب أن يكون إجمالي المدين مساوي لإجمالي الدائن (نقداً)");

      return;
    }

    if (!isGoldBalanced) {
      toast.error("يجب أن يكون إجمالي المدين مساوي لإجمالي الدائن (ذهباً)");

      return;
    }

    // إزالة السطر الأخير إذا كان فارغاً
    const currentDetails = [...details];

    if (currentDetails.length > 0) {
      const lastDetail = currentDetails[currentDetails.length - 1];
      const isEmpty =
        (!lastDetail.acc_id || lastDetail.acc_id === 0) &&
        (lastDetail.debit === undefined || lastDetail.debit === null) &&
        (lastDetail.credit === undefined || lastDetail.credit === null);

      if (isEmpty) {
        currentDetails.pop();
        setDetails(currentDetails);
      }
    }

    if (currentDetails.length === 0) {
      toast.error("يجب إضافة تفاصيل للقيد");

      return;
    }

    const emptyAccountDetails = currentDetails.filter(
      (detail) => !detail.acc_id || detail.acc_id === 0,
    );

    if (emptyAccountDetails.length > 0) {
      toast.error("يرجى اختيار حساب لجميع الصفوف قبل الحفظ");

      return;
    }

    const validDetails = currentDetails.filter(
      (detail) => detail.acc_id && detail.acc_id > 0,
    );

    if (validDetails.length === 0) {
      toast.error("يرجى إدخال حساب صحيح على الأقل");

      return;
    }

    if (
      !voucher.vouch_id ||
      Number(voucher.vouch_id) <= 0 ||
      !isFinite(Number(voucher.vouch_id))
    ) {
      toast.error("خطأ: رقم القيد غير صحيح. يرجى إعادة تحميل الصفحة.");

      return;
    }

    setIsLoading(true);
    try {
      const voucherData = {
        vouch_id: voucher.vouch_id,
        vouch_date: voucher.vouch_date,
        vouch_type: voucher.vouch_type,
        vouch_amt: 0,
        vouch_notes: voucher.vouch_notes || "",
        vouch_status: voucher.vouch_status || 1,
        pay_type: voucher.pay_type,
        ref_no: voucher.ref_no || "",
        opps_vouch: voucher.opps_vouch || 0,
        cost_id:
          voucher.cost_id !== undefined && voucher.cost_id !== null
            ? voucher.cost_id
            : null,
      };

      const detailsData = currentDetails
        .filter((detail) => detail.acc_id && detail.acc_id > 0)
        .map((detail) => ({
          id: detail.id || 0,
          vouch_id: voucher.vouch_id,
          acc_id: detail.acc_id,
          debit: detail.debit,
          credit: detail.credit,
          debit_base:
            detail.debit_base !== undefined ? detail.debit_base : detail.debit,
          credit_base:
            detail.credit_base !== undefined
              ? detail.credit_base
              : detail.credit,
          g_debit:
            detail.g_debit !== undefined ? detail.g_debit : detail.debit_g,
          g_credit:
            detail.g_credit !== undefined ? detail.g_credit : detail.credit_g,
          g_debit_base: detail.g_debit_base,
          g_credit_base: detail.g_credit_base,
          gauge: detail.gauge,
          vouch_notes: detail.vouch_notes || "",
          cost_id: detail.cost_id || null,
        }));

      const currentDetailIds = detailsData
        .map((d) => d.id)
        .filter((id) => id > 0);
      const originalDetailIds = originalDetails
        .map((d) => d.id)
        .filter((id) => id && id > 0) as number[];
      const deletedDetailIds = originalDetailIds.filter(
        (id) => !currentDetailIds.includes(id),
      );

      const result =
        formMode === "edit"
          ? await updateVoucherAction(
              voucherData,
              detailsData,
              deletedDetailIds,
              Number(voucherRecordId) || undefined,
            )
          : await createVoucherAction(voucherData, detailsData);

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
          router.push(`/forms/voucher/${realId}?mode=preview`);
        } else if (vouchId) {
          try {
            const vouchersResponse = await voucherService.getAll();

            if (vouchersResponse.success && vouchersResponse.data) {
              const foundVoucher = vouchersResponse.data.find(
                (v: any) => v.vouch_id === vouchId,
              );

              if (foundVoucher?.id) {
                router.push(`/forms/voucher/${foundVoucher.id}?mode=preview`);
              } else {
                router.push(`/forms/voucher`);
              }
            }
          } catch (searchError) {
            console.error("Error searching for voucher:", searchError);
            router.push(`/forms/voucher`);
          }
        } else {
          router.push(`/forms/voucher`);
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

  // Print voucher
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
              <title>قيد تسوية - ${voucher.vouch_id}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
                * { margin: 0; padding: 0; box-sizing: border-box; }
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
              </style>
            </head>
            <body>
              <div class="header">
                <h1>قيد تسوية</h1>
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
                    ? `<div class="voucher-notes"><strong>البيان:</strong> ${voucher.vouch_notes}</div>`
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
                      const debitG =
                        detail.g_debit !== undefined
                          ? detail.g_debit
                          : detail.debit_g || 0;
                      const creditG =
                        detail.g_credit !== undefined
                          ? detail.g_credit
                          : detail.credit_g || 0;
                      const gauge = detail.gauge || 875;

                      return `
                      <tr>
                        <td>${account?.acc_code || "-"}</td>
                        <td>${account?.acc_name || "-"}</td>
                        <td>${debit > 0 ? formatAmount(debit) : "-"}</td>
                        <td>${credit > 0 ? formatAmount(credit) : "-"}</td>
                        <td>${debitG > 0 ? formatAmount(debitG) : "-"}</td>
                        <td>${creditG > 0 ? formatAmount(creditG) : "-"}</td>
                        <td>${gauge}</td>
                        <td>${detail.vouch_notes || "-"}</td>
                      </tr>
                    `;
                    })
                    .join("")}
                  <tr class="totals">
                    <td colspan="2" style="text-align: right; padding-right: 20px; font-weight: 700;">الإجمالي</td>
                    <td>${formatAmount(totals.totalDebit)}</td>
                    <td>${formatAmount(totals.totalCredit)}</td>
                    <td>${formatAmount(totals.totalDebitG)}</td>
                    <td>${formatAmount(totals.totalCreditG)}</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
              <div class="footer">
                <p>تم طباعة هذا القيد بتاريخ ${new Date().toLocaleDateString("ar-SA")} - ${t("systemName")}</p>
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

  return {
    isLoading,
    isPrinting,
    saveVoucher,
    printVoucher,
  };
};
