import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CurrencyFormClient from "../components/CurrencyFormClient";

import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "إضافة عملة جديدة - NafeesWeb",
  description: "إضافة عملة جديدة إلى النظام",
};

export default async function NewCurrencyPage() {
  // إنشاء عملة فارغة
  const emptyCurrency = {
    id: 0,
    cur_name: "",
    cur_name_e: "",
    cur_part: "",
    cur_part_e: "",
    cur_sign: "",
    cur_price: "",
    cur_tag: "",
    cr_date: "",
    cur_status: true,
  };

  const t = await getTranslations("basic.currencies");

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: t("breadcrumbs.list"), href: "/basic/currencies" },
          { name: t("breadcrumbs.add") },
        ]}
      />
      <CurrencyFormClient initialCurrency={emptyCurrency} mode="add" />
    </div>
  );
}
