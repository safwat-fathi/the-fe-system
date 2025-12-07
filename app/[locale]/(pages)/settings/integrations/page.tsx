import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import IntegrationsClient from "./components/IntegrationsClient";

import Breadcrumb from "@/components/Breadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings.integrations");

  return {
    title: `${t("title")} - NafeesWeb`,
    description: t("description"),
  };
}

export default async function IntegrationsPage() {
  const t = await getTranslations("settings.integrations");

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">{t("header")}</h1>

      <IntegrationsClient />
    </div>
  );
}
