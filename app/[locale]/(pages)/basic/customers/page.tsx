import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CustomersClient from "./components/CustomersClient";

import Breadcrumb from "@/components/Breadcrumb";
import customerService, {
  GetCustomersPageParams,
} from "@/services/api/customer.service";
import helperService from "@/services/api/helper.service";
import { PAGE_SIZE_OVERRIDES } from "@/constants/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getTranslations("basic.customers" as any)) as any;

  return {
    title: `${t("labels.pageTitle")} - NafeesWeb`,
    description: t("labels.pageTitle"),
  };
}

type CustomersSearchParams = { page?: string; cust_type?: string };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<CustomersSearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const xcust_type = params?.cust_type ? Number(params.cust_type) : 0;

  const pageParams: GetCustomersPageParams = {
    page,
    xcust_type,
    xcust_code: 0,
  };

  const [customersPage, customerTypesData, customerStatusData] =
    await Promise.all([
      customerService.getCustomersPage(pageParams).catch(() => null),
      helperService.getCustomerTypes().catch(() => []),
      helperService.getCustomerStatuses().catch(() => []),
    ]);

  const pageSize = PAGE_SIZE_OVERRIDES.customers;
  const rawResults = customersPage?.results ?? [];
  const results = rawResults.slice(0, pageSize);
  const totalCount = customersPage?.count ?? 0;

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <CustomersClient
        initialCustomerStatus={customerStatusData as any}
        initialCustomerTypes={customerTypesData as any}
        initialCustomers={results as any}
        totalCount={totalCount}
        initialPage={page}
        initialCustType={xcust_type || null}
      />
    </div>
  );
}
