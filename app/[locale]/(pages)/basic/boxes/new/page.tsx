import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import BoxFormClient from "../components/BoxFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import boxService from "@/services/api/box.service";
import accountService from "@/services/api/account.service";

export const metadata: Metadata = {
  title: "إضافة صندوق جديد - NafeesWeb",
  description: "إضافة صندوق جديد إلى النظام",
};

export default async function NewBoxPage() {
  const branchParams = await getBranchParams();
  const parsedCompanyId = Number(branchParams.com ?? "1");
  const companyId =
    Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
      ? parsedCompanyId
      : 1;

  // جلب البيانات الأساسية
  const [boxTypesData, accountsData, itemsStatusData] = await Promise.all([
    boxService.getBoxTypes().catch(() => []),
    accountService.getAllAccounts(branchParams.com).catch(() => []),
    boxService.getItemsStatus().catch(() => []),
  ]);

  // إنشاء صندوق فارغ
  const emptyBox = {
    id: 0,
    cust_code: "",
    cust_name: "",
    cust_name_e: "",
    mobile: "",
    email: "",
    address: "",
    vat_no: null,
    cr_no: null,
    phone: "",
    fax: "",
    gov: "",
    city: "",
    area: "",
    street: "",
    build_no: "",
    post_code: "",
    cust_status: 1,
    acc: null,
    acc_name: "",
    cust_type: 99,
    box_type: "",
    handling: "",
    handling_e: "",
    perc: null,
    expt: false,
    hide: false,
  };

  const t = await getTranslations("basic.boxes");

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: t("breadcrumbs.list"), href: "/basic/boxes" },
          { name: t("breadcrumbs.add") },
        ]}
      />
      <BoxFormClient
        accounts={accountsData as any}
        boxTypes={boxTypesData as any}
        itemsStatus={itemsStatusData as any}
        companyId={companyId}
        initialBox={emptyBox}
        mode="add"
      />
    </div>
  );
}
