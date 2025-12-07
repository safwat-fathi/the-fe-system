import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CustomerTypeFormClient from "../components/CustomerTypeFormClient";

import Breadcrumb from "@/components/Breadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getTranslations("basic.customerTypes" as any)) as any;

  return {
    title: `${t("titles.add")} - NafeesWeb`,
    description: t("titles.add"),
  };
}

export default async function NewCustomerTypePage() {
  // إنشاء نوع عميل فارغ
  const emptyType = {
    id: 0,
    type_name: "",
    type_name_e: "",
    type_desc: "",
    cr_date: "",
    type_status: true,
  };

  const t = (await getTranslations("basic.customerTypes" as any)) as any;

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: t("labels.pageTitle"), href: "/basic/cust_type" },
          { name: t("titles.add") },
        ]}
      />
      <CustomerTypeFormClient initialType={emptyType} mode="add" />
    </div>
  );
}
