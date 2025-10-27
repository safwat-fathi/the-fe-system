import { Metadata } from "next";
import { Suspense } from "react";

import VouchersReportClient from "./components/VouchersReportClient";
import AppLoading from "@/components/AppLoading";

import { voucherService } from "@/services/api";
import { IParams } from "@/types/services/base";

export const metadata: Metadata = {
  title: "تقرير السندات - NafeesWeb",
  description: "تقرير شامل لجميع السندات",
};

export const revalidate = 3600;

export default async function VoucherReportsPage({
  searchParams,
}: {
  searchParams: Promise<IParams>;
}) {
  const queryParams = await searchParams;

  // جلب البيانات من API مع المعاملات الصحيحة
  const [vouchersResponse, typesResponse] = await Promise.all([
    voucherService.getAll(queryParams),
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

  const count = vouchersResponse.count || 0;
  const itemsPerPage = 20;
  const totalPages = count > 0 ? Math.ceil(count / itemsPerPage) : 0;

  return (
    <div className="font-cairo space-y-4 p-4">
      <Suspense
        key={JSON.stringify(queryParams)}
        fallback={
          <div className="py-12">
            <AppLoading />
          </div>
        }
      >
        <VouchersReportClient
          initialVouchers={vouchers}
          initialVoucherTypes={voucherTypes}
          searchParams={queryParams}
          totalVouchers={count}
          totalPages={totalPages}
        />
      </Suspense>
    </div>
  );
}
