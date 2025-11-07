import { notFound } from "next/navigation";
import { Metadata } from "next";

import CustomerTypeFormClient from "../components/CustomerTypeFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import customerTypeService from "@/services/api/customer-type.service";

export const metadata: Metadata = {
  title: "عرض نوع العميل - NafeesWeb",
  description: "عرض وتعديل بيانات نوع العميل",
};

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

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "أنواع العملاء", href: "/basic/cust_type" },
          {
            name:
              formMode === "edit"
                ? `تعديل ${type.type_name || "نوع العميل"}`
                : `عرض ${type.type_name || "نوع العميل"}`,
          },
        ]}
      />
      <CustomerTypeFormClient initialType={type} mode={formMode} />
    </div>
  );
}

