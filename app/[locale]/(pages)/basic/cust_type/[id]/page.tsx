import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CustomerTypeFormClient from "../components/CustomerTypeFormClient";
import { getLevel4Accounts } from "../getLevel4Accounts";

import Breadcrumb from "@/components/Breadcrumb";
import customerTypeService from "@/services/api/customer-type.service";
import { AuthenticationError } from "@/utilities/errors/Authentication";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getTranslations("basic.customerTypes" as any)) as any;

  return {
    title: `${t("titles.view", { name: t("titles.defaultName") })} - NafeesWeb`,
    description: t("titles.view", { name: t("titles.defaultName") }),
  };
}

export default async function CustomerTypeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const searchParamsData = await searchParams;
  const mode = Array.isArray(searchParamsData.mode)
    ? searchParamsData.mode[0]
    : searchParamsData.mode;

  // تحديد الوضع: preview (افتراضي) أو edit
  const formMode = mode === "edit" ? "edit" : "view";

  const typeId = Number.parseInt(id, 10);

  // التحقق من صحة المعرف
  if (isNaN(typeId) || typeId <= 0) {
    notFound();
  }

  let type = null;
  let statusOptions: Awaited<
    ReturnType<typeof customerTypeService.getCustTypeStatus>
  > = [];
  let levelFourAccounts: Awaited<ReturnType<typeof getLevel4Accounts>> = [];

  try {
    const [fetchedType, statusList, level4] = await Promise.all([
      customerTypeService.getCustomerTypeById(typeId),
      customerTypeService.getCustTypeStatus(),
      getLevel4Accounts(),
    ]);

    type = fetchedType;
    statusOptions = statusList;
    levelFourAccounts = level4;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/auth/login");
    }
    throw error;
  }

  if (!type) {
    notFound();
  }

  const t = (await getTranslations("basic.customerTypes" as any)) as any;
  const displayName = type.type_name || type.type_name_e || t("titles.defaultName");

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: t("labels.pageTitle"), href: "/basic/cust_type" },
          {
            name:
              formMode === "edit"
                ? t("titles.edit", { name: displayName })
                : t("titles.view", { name: displayName }),
          },
        ]}
      />
      <CustomerTypeFormClient
        accounts={levelFourAccounts}
        initialType={type}
        mode={formMode}
        statusOptions={statusOptions}
      />
    </div>
  );
}
