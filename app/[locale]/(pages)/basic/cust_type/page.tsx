import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CustomerTypesClient from "./components/CustomerTypesClient";

import Breadcrumb from "@/components/Breadcrumb";
import customerTypeService from "@/services/api/customer-type.service";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getTranslations("basic.customerTypes" as any)) as any;

  return {
    title: `${t("labels.pageTitle")} - NafeesWeb`,
    description: t("labels.pageTitle"),
  };
}

export default async function CustomerTypesPage() {
  // جلب البيانات على السيرفر
  const typesData = await customerTypeService
    .getAllCustomerTypes()
    .catch(() => []);

  const t = (await getTranslations("basic.customerTypes" as any)) as any;

  return (
    <div className="font-cairo">
      <Breadcrumb />
      <h1 className="text-xl font-bold mb-2">{t("labels.pageTitle")}</h1>

      <CustomerTypesClient initialTypes={typesData} />
    </div>
  );
}
