import { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import VouchersReportClient from "./components/VouchersReportClient";

import AppLoading from "@/components/AppLoading";
import Breadcrumb from "@/components/Breadcrumb";
import { voucherService } from "@/services/api";
import { IParams } from "@/types/services/base";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reports.vouchers");
  
  return {
    title: `${t("title")} - NafeesWeb`,
    description: t("description"),
  };
}

export const revalidate = 3600;

export default async function VoucherReportsPage({
  searchParams,
}: {
  searchParams: Promise<IParams>;
}) {
  const queryParams = await searchParams;

  // جلب البيانات من API مع المعاملات الصحيحة
  const [vouchersResponse, typesResponse] = await Promise.all([
    voucherService.getAllWithTotals(queryParams),
    voucherService.getVoucherTypes(),
  ]);

  // معالجة البيانات
  const vouchers = vouchersResponse.success
    ? Array.isArray(vouchersResponse.pageData)
      ? vouchersResponse.pageData
      : []
    : [];

  const defaultTotals = { totalAmount: 0, totalGold: 0 };
  const voucherTotals = vouchersResponse.success
    ? vouchersResponse.totals || defaultTotals
    : defaultTotals;

  const voucherTypes =
    typesResponse.success && typesResponse.data
      ? Array.isArray(typesResponse.data)
        ? typesResponse.data
        : []
      : [];

  const count = vouchersResponse.success ? vouchersResponse.count || 0 : 0;
  const totalPages = vouchersResponse.success
    ? vouchersResponse.totalPages || 0
    : 0;

  return (
    <div className="font-cairo space-y-4 p-4">
      <Breadcrumb />
      <Suspense
        key={JSON.stringify(queryParams)}
        fallback={
          <div className="py-12">
            <AppLoading />
          </div>
        }
      >
        <VouchersReportClient
          initialVoucherTypes={voucherTypes}
          initialVouchers={vouchers}
          overallTotals={voucherTotals}
          searchParams={queryParams}
          totalPages={totalPages}
          totalVouchers={count}
        />
      </Suspense>
    </div>
  );
}
