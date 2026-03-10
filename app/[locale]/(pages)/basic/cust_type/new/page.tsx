import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CustomerTypeFormClient from "../components/CustomerTypeFormClient";
import { getLevel4Accounts } from "../getLevel4Accounts";

import Breadcrumb from "@/components/Breadcrumb";
import customerTypeService from "@/services/api/customer-type.service";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getTranslations("basic.customerTypes" as any)) as any;

  return {
    title: `${t("titles.add")} - NafeesWeb`,
    description: t("titles.add"),
  };
}

export default async function NewCustomerTypePage() {
  const emptyType = {
    id: 0,
    type_name: "",
    type_name_e: "",
    type_desc: "",
    prefix: "",
    cr_date: "",
    type_status: true,
  };

  const t = (await getTranslations("basic.customerTypes" as any)) as any;

  const [statusOptions, levelFourAccounts] = await Promise.all([
    customerTypeService.getCustTypeStatus(),
    getLevel4Accounts(),
  ]);

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: t("labels.pageTitle"), href: "/basic/cust_type" },
          { name: t("titles.add") },
        ]}
      />
      <CustomerTypeFormClient
        accounts={levelFourAccounts}
        initialType={emptyType}
        mode="add"
        statusOptions={statusOptions}
      />
    </div>
  );
}
