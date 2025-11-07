import { Metadata } from "next";

import TaxesClient from "./components/TaxesClient";

import Breadcrumb from "@/components/Breadcrumb";
import taxService from "@/services/api/tax.service";
import accountService from "@/services/api/account.service";

export const metadata: Metadata = {
  title: "إعدادات الضرائب - NafeesWeb",
  description: "إدارة إعدادات الضرائب",
};

export default async function TaxesPage() {
  // جلب البيانات بالتوازي
  const [taxesData, accountsData] = await Promise.all([
    taxService.getAllTaxes().catch(() => []),
    accountService.getAllAccounts().catch(() => []),
  ]);

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">الضرائب</h1>

      <TaxesClient
        initialAccounts={accountsData as any}
        initialTaxes={taxesData as any}
      />
    </div>
  );
}
