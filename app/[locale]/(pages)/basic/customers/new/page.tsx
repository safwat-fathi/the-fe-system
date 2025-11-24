import { Metadata } from "next";

import CustomerFormClient from "../components/CustomerFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import helperService from "@/services/api/helper.service";
import accountService from "@/services/api/account.service";

export const metadata: Metadata = {
  title: "إضافة عميل جديد - NafeesWeb",
  description: "إضافة عميل جديد إلى النظام",
};

export default async function NewCustomerPage() {
  const branchParams = await getBranchParams();
  const parsedCompanyId = Number(branchParams.com ?? "1");
  const companyId =
    Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
      ? parsedCompanyId
      : 1;

  // جلب البيانات الأساسية
  const [customerTypesData, customerStatusData, accountsData, boxTypesData] =
    await Promise.all([
      helperService.getCustomerTypes().catch(() => []),
      helperService.getCustomerStatuses().catch(() => []),
      accountService.getAllAccounts().catch(() => []),
      helperService.getBoxTypes().catch(() => []),
    ]);

  // إنشاء عميل فارغ
  const emptyCustomer = {
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
    cust_type: undefined,
    box_type: "",
    handling: "",
    handling_e: "",
    perc: null,
    expt: false,
    hide: false,
  };

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "العملاء", href: "/basic/customers" },
          { name: "إضافة عميل جديد" },
        ]}
      />
      <CustomerFormClient
        accounts={accountsData as any}
        boxTypes={boxTypesData as any}
        companyId={companyId}
        customerStatus={customerStatusData as any}
        customerTypes={customerTypesData as any}
        initialCustomer={emptyCustomer}
        mode="add"
      />
    </div>
  );
}
