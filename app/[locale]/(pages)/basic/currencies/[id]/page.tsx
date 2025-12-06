import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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

  const t = await getTranslations("basic.currencies");

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: t("breadcrumbs.list"), href: "/basic/currencies" },
          {
            name:
              formMode === "edit"
                ? t("breadcrumbs.edit", {
                    name: currency.cur_name || t("titles.defaultName"),
                  })
                : t("breadcrumbs.view", {
                    name: currency.cur_name || t("titles.defaultName"),
                  }),
          },
        ]}
      />
      <CurrencyFormClient initialCurrency={currency} mode={formMode} />
    </div>
  );
}
