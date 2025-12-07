import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CustomerTypeFormClient from "../components/CustomerTypeFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import customerTypeService from "@/services/api/customer-type.service";

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

  const typeId = parseInt(id);

  // التحقق من صحة المعرف
  if (isNaN(typeId) || typeId <= 0) {
    notFound();
  }

  // جلب بيانات نوع العميل
  const type = await customerTypeService.getCustomerTypeById(typeId);

  if (!type) {
    notFound();
  }

  const t = (await getTranslations("basic.customerTypes" as any)) as any;

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: t("labels.pageTitle"), href: "/basic/cust_type" },
          {
            name:
              formMode === "edit"
                ? t("titles.edit", {
                    name: type.type_name || t("titles.defaultName"),
                  })
                : t("titles.view", {
                    name: type.type_name || t("titles.defaultName"),
                  }),
          },
        ]}
      />
      <CustomerTypeFormClient initialType={type} mode={formMode} />
    </div>
  );
}
