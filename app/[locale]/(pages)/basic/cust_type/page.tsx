import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import CustomerTypesClient from "./components/CustomerTypesClient";

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

  try {
    const allTypes = await customerTypeService.getAllCustomerTypes();

    typesData = !normalizedSearch
      ? allTypes
      : allTypes.filter((type) => {
          const fields = [
            String(type.id ?? ""),
            type.type_name ?? "",
            type.type_name_e ?? "",
            type.type_desc ?? "",
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
    <div className="font-cairo">
      <Breadcrumb />
      <h1 className="text-xl font-bold mb-2">{t("labels.pageTitle")}</h1>

      <CustomerTypesClient
        initialSearch={String(searchValue ?? "")}
        initialTypes={typesData}
        loadError={loadError}
      />
    </div>
  );
}
