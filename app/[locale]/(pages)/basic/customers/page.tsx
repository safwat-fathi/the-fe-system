import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CustomersClient from "./components/CustomersClient";

import Breadcrumb from "@/components/Breadcrumb";
import customerService from "@/services/api/customer.service";
import helperService from "@/services/api/helper.service";
import accountService from "@/services/api/account.service";
import { getBranchParams } from "@/app/actions/branch-params";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getTranslations("basic.customers" as any)) as any;

  return {
    title: `${t("labels.pageTitle")} - NafeesWeb`,
    description: t("labels.pageTitle"),
  };
}

export default async function CustomersPage() {
  // جلب معاملات الفرع
  const branchParams = await getBranchParams();
  const parsedCompanyId = Number(branchParams.com ?? "1");
  const companyId =
    Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
      ? parsedCompanyId
      : 1;

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

  const t = (await getTranslations("basic.customers" as any)) as any;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] font-cairo p-2">
      <div className="flex-shrink-0 mb-1">
        <Breadcrumb />
        <h1 className="text-lg font-bold">{t("labels.pageTitle")}</h1>
      </div>

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
