import { notFound } from "next/navigation";
import { Metadata } from "next";

import CustomerFormClient, {
  type CustomerFormValues,
} from "../components/CustomerFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import { getBranchParams } from "@/app/actions/branch-params";
import customerService from "@/services/api/customer.service";
import helperService from "@/services/api/helper.service";
import accountService from "@/services/api/account.service";

export const metadata: Metadata = {
  title: "عرض العميل - NafeesWeb",
  description: "عرض وتعديل بيانات العميل",
};

export default async function CustomerDetailPage({
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

  const customerId = parseInt(id);

  // التحقق من صحة المعرف
  if (isNaN(customerId) || customerId <= 0) {
    notFound();
  }

  const branchParams = await getBranchParams();
  const parsedCompanyId = Number(branchParams.com ?? "1");
  const companyId =
    Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
      ? parsedCompanyId
      : 1;

  // جلب بيانات العميل
  let customer = null;

  try {
    const customers = await customerService.getAllCustomers({
      xcom_id: companyId,
    });

    customer = customers.find((c) => c.id === customerId) || null;

    // إذا لم يتم العثور عليه، جرب البحث بدون فلتر
    if (!customer) {
      const allCustomers = await customerService.getAllCustomers();

      customer = allCustomers.find((c) => c.id === customerId) || null;
    }
  } catch (error) {
    console.error("Error fetching customer:", error);
  }

  if (!customer) {
    notFound();
  }

  // جلب البيانات الأساسية
  const [customerTypesData, customerStatusData, accountsData, boxTypesData] =
    await Promise.all([
      helperService.getCustomerTypes().catch(() => []),
      helperService.getCustomerStatuses().catch(() => []),
      accountService.getAllAccounts().catch(() => []),
      helperService.getBoxTypes().catch(() => []),
    ]);

  // تحويل Customer إلى CustomerForm
  const customerForm: Partial<CustomerFormValues> = {
    id: customer.id,
    cust_code: customer.cust_code?.toString() || "",
    cust_name: customer.cust_name || "",
    cust_name_e: customer.cust_name_e || "",
    mobile: customer.mobile?.toString() || "",
    email: customer.email || "",
    address: customer.address || "",
    vat_no: customer.vat_no || null,
    cr_no: Number(customer.cr_no) || null,
    phone: customer.phone || "",
    fax: customer.fax || "",
    gov: customer.gov || "",
    city: customer.city || "",
    area: customer.area || "",
    street: customer.street || "",
    build_no: customer.build_no || "",
    post_code: customer.post_code || "",
    cust_status: customer.cust_status || 1,
    acc: Number(customer.acc),
    acc_name: customer.acc_name || "",
    cust_type: customer.cust_type || undefined,
    box_type: String(customer.box_type) || "",
    handling: customer.handling || "",
    handling_e: customer.handling_e || "",
    perc: customer.perc || undefined,
    expt: customer.expt || false,
    hide: customer.hide || false,
  };

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "العملاء", href: "/basic/customers" },
          {
            name:
              formMode === "edit"
                ? `تعديل ${customer.cust_name || customer.cust_code || "العميل"}`
                : `عرض ${customer.cust_name || customer.cust_code || "العميل"}`,
          },
        ]}
      />
      <CustomerFormClient
        accounts={accountsData as any}
        boxTypes={boxTypesData as any}
        companyId={companyId}
        customerStatus={customerStatusData as any}
        customerTypes={customerTypesData as any}
        initialCustomer={customerForm}
        mode={formMode}
      />
    </div>
  );
}
