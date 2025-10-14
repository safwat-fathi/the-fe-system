import { Metadata } from "next";

import VouchersReportClient from "./components/VouchersReportClient";

import { voucherService } from "@/services/api";

export const metadata: Metadata = {
  title: "تقرير السندات - NafeesWeb",
  description: "تقرير شامل لجميع السندات",
};

export default async function VoucherReportsPage() {
  // جلب البيانات من API (الفرع والسنة ثابتين في service)
  const [vouchersResponse, typesResponse] = await Promise.all([
    voucherService.getAll(),
    voucherService.getVoucherTypes(),
  ]);

  // معالجة البيانات
  const vouchers =
    vouchersResponse.success && vouchersResponse.data
      ? Array.isArray(vouchersResponse.data)
        ? vouchersResponse.data
        : []
      : [];

  const voucherTypes =
    typesResponse.success && typesResponse.data
      ? Array.isArray(typesResponse.data)
        ? typesResponse.data
        : []
      : [];

  return (
    <VouchersReportClient
      initialVouchers={vouchers}
      initialVoucherTypes={voucherTypes}
    />
  );
}
