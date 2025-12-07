import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import TaxesClient from "./components/TaxesClient";

import Breadcrumb from "@/components/Breadcrumb";
import taxService from "@/services/api/tax.service";
import accountService from "@/services/api/account.service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings.taxes");

  return {
    title: `${t("labels.pageTitle")} - NafeesWeb`,
    description: t("labels.pageTitle"),
  };
}

export default async function TaxesPage() {
  const t = await getTranslations("settings.taxes");
  // جلب البيانات بالتوازي
  const [taxesData, accountsData] = await Promise.all([
    taxService.getAllTaxes().catch(() => []),
    accountService.getAllAccounts().catch(() => []),
  ]);

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">
        {t("labels.pageTitle")}
      </h1>

      <TaxesClient
        initialAccounts={accountsData as any}
        initialTaxes={taxesData as any}
      />
    </div>
  );
}
