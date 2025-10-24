import { notFound } from "next/navigation";
import { Metadata } from "next";

import VoucherEditClient from "./components/VoucherEditClient";

import { voucherService } from "@/services/api";
import { accountService } from "@/services/api";
import { costCenterService } from "@/services/api";

export const metadata: Metadata = {
  title: "تعديل قيد تسوية - NafeesWeb",
  description: "عرض وتعديل قيد التسوية",
};

export default async function VoucherEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const voucherId = parseInt(id);

  // التحقق من صحة المعرف
  if (isNaN(voucherId) || voucherId <= 0) {
    notFound();
  }

  // جلب بيانات القيد (الفرع والسنة ثابتين في service)
  const [
    vouchersResponse,
    detailsResponse,
    accountsResponse,
    costCentersResponse,
    voucherTypesResponse,
    voucherStagesResponse,
  ] = await Promise.all([
    voucherService.getAll(),
    voucherService.getDetails(voucherId),
    accountService.getAllAccounts(),
    costCenterService.getAllCostCenters(),
    voucherService.getVoucherTypes(),
    voucherService.getVoucherStages(),
  ]);

  // البحث عن القيد المطلوب
  if (!vouchersResponse.success || !vouchersResponse.data) {
    notFound();
  }

  const vouchers = Array.isArray(vouchersResponse.data)
    ? vouchersResponse.data
    : [];
  const targetVoucher = vouchers.find(
    (v: any) => v.vouch_id === voucherId || v.id === voucherId,
  );

  if (!targetVoucher) {
    notFound();
  }

  // معالجة البيانات المساعدة
  const accounts = accountsResponse
    ? Array.isArray(accountsResponse)
      ? accountsResponse.filter((acc: any) => acc.acc_level === 5)
      : []
    : [];

  const costCenters =
    costCentersResponse && Array.isArray(costCentersResponse)
      ? costCentersResponse
      : [];

  const voucherTypes =
    voucherTypesResponse.success && voucherTypesResponse.data
      ? Array.isArray(voucherTypesResponse.data)
        ? voucherTypesResponse.data
        : []
      : [];

  const voucherStatuses =
    voucherStagesResponse.success && voucherStagesResponse.data
      ? Array.isArray(voucherStagesResponse.data)
        ? voucherStagesResponse.data
        : []
      : [];

  // معالجة تفاصيل القيد
  const details =
    detailsResponse.success && detailsResponse.data
      ? Array.isArray(detailsResponse.data)
        ? detailsResponse.data.map((detail: any) => {
            const account = accounts.find(
              (acc: any) => acc.id === (detail.acc_id || detail.acc),
            );

            return {
              ...detail,
              acc_id: detail.acc_id || detail.acc || 0,
              acc_code: account?.acc_code || detail.acc_code || "",
              acc_name: account?.acc_name || detail.acc_name || "",
              cost_id: detail.cost_id || 0,
              debit: detail.debit || 0,
              credit: detail.credit || 0,
              debit_g: detail.debit_g || 0,
              credit_g: detail.credit_g || 0,
              gauge: detail.gauge || 875,
              tax: detail.tax || 0,
              tax_prc: detail.tax_prc || 0,
              vat_no: detail.vat_no || 0,
              vouch_notes: detail.vouch_notes || "",
            };
          })
        : []
      : [];

  // تنسيق بيانات القيد
  const formattedVoucher = {
    ...targetVoucher,
    vouch_date: targetVoucher.vouch_date || new Date().toISOString(),
    cr_date: targetVoucher.cr_date || new Date().toISOString(),
    vouch_id: targetVoucher.vouch_id || 0,
    ref_no: targetVoucher.ref_no || "",
    vouch_notes: targetVoucher.vouch_notes || "",
    vouch_status: targetVoucher.vouch_status || 1,
    pay_type: targetVoucher.pay_type || 1,
  };

  return (
    <VoucherEditClient
      accounts={accounts}
      costCenters={costCenters}
      details={details}
      initialVoucher={formattedVoucher}
      vouchers={vouchers}
      voucherStatuses={voucherStatuses}
      voucherTypes={voucherTypes}
    />
  );
}


