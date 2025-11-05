import { notFound } from "next/navigation";
import { Metadata } from "next";

import CurrencyFormClient from "../components/CurrencyFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import currencyService from "@/services/api/currency.service";

export const metadata: Metadata = {
  title: "عرض العملة - NafeesWeb",
  description: "عرض وتعديل بيانات العملة",
};

export default async function CurrencyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const searchParamsData = await searchParams;
  const mode = Array.isArray(searchParamsData.mode)
    ? searchParamsData.mode[0]
    : searchParamsData.mode;

  // تحديد الوضع: preview (افتراضي) أو edit
  const formMode = mode === "edit" ? "edit" : "view";

  const currencyId = parseInt(id);

  // التحقق من صحة المعرف
  if (isNaN(currencyId) || currencyId <= 0) {
    notFound();
  }

  // جلب بيانات العملة
  const currency = await currencyService.getCurrencyById(currencyId);

  if (!currency) {
    notFound();
  }

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "العملات", href: "/basic/currencies" },
          {
            name:
              formMode === "edit"
                ? `تعديل ${currency.cur_name || "العملة"}`
                : `عرض ${currency.cur_name || "العملة"}`,
          },
        ]}
      />
      <CurrencyFormClient initialCurrency={currency} mode={formMode} />
    </div>
  );
}

