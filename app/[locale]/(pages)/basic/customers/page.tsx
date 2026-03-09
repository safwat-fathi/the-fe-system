import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CustomersClient from "./components/CustomersClient";

import Breadcrumb from "@/components/Breadcrumb";
import customerService from "@/services/api/customer.service";
import helperService from "@/services/api/helper.service";
import accountService from "@/services/api/account.service";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getTranslations("basic.customers" as any)) as any;

  return {
    title: `${t("labels.pageTitle")} - NafeesWeb`,
    description: t("labels.pageTitle"),
  };
}

export default async function CustomersPage() {
  // جلب البيانات بالتوازي للأداء الأفضل
  const [
    customersData,
    customerTypesData,
    customerStatusData,
    accountsData,
    boxTypesData,
  ] = await Promise.all([
    customerService.getAllCustomers().catch(() => []),
    helperService.getCustomerTypes().catch(() => []),
    helperService.getCustomerStatuses().catch(() => []),
    accountService.getAllAccounts().catch(() => []),
    helperService.getBoxTypes().catch(() => []),
  ]);

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <CustomersClient
        initialAccounts={accountsData as any}
        initialBoxTypes={boxTypesData as any}
        initialCustomerStatus={customerStatusData as any}
        initialCustomerTypes={customerTypesData as any}
        initialCustomers={customersData as any}
      />
    </div>
  );
}
