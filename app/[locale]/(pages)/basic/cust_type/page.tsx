import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import CustomerTypesClient from "./components/CustomerTypesClient";
import { getLevel4Accounts } from "./getLevel4Accounts";

import Breadcrumb from "@/components/Breadcrumb";
import customerTypeService from "@/services/api/customer-type.service";
import { AuthenticationError } from "@/utilities/errors/Authentication";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getTranslations("basic.customerTypes" as any)) as any;

  return {
    title: `${t("labels.pageTitle")} - NafeesWeb`,
    description: t("labels.pageTitle"),
  };
}

export default async function CustomerTypesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = (await getTranslations("basic.customerTypes" as any)) as any;
  const query = await searchParams;
  const searchValue = Array.isArray(query.search) ? query.search[0] : query.search;
  const normalizedSearch = String(searchValue ?? "").trim().toLowerCase();
  let typesData = [] as Awaited<
    ReturnType<typeof customerTypeService.getAllCustomerTypes>
  >;
  let loadError: string | null = null;

  let statusOptions = [] as Awaited<
    ReturnType<typeof customerTypeService.getCustTypeStatus>
  >;
  let levelFourAccounts: Awaited<ReturnType<typeof getLevel4Accounts>> = [];

  try {
    const [allTypes, statusList, level4] = await Promise.all([
      customerTypeService.getAllCustomerTypes(),
      customerTypeService.getCustTypeStatus(),
      getLevel4Accounts(),
    ]);

    statusOptions = statusList;
    levelFourAccounts = level4;
    typesData = !normalizedSearch
      ? allTypes
      : allTypes.filter((type) => {
          const fields = [
            String(type.id ?? ""),
            type.type_name ?? "",
            type.type_name_e ?? "",
            type.type_desc ?? "",
            type.prefix ?? "",
          ];

          return fields.some((field) =>
            field.toLowerCase().includes(normalizedSearch),
          );
        });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/auth/login");
    }

    loadError = t("messages.loadError");
    typesData = [];
  }

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <CustomerTypesClient
        accounts={levelFourAccounts}
        initialSearch={String(searchValue ?? "")}
        initialStatusOptions={statusOptions}
        initialTypes={typesData}
        loadError={loadError}
      />
    </div>
  );
}
