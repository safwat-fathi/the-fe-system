import { Metadata } from "next";

import CustomerTypeFormClient from "../components/CustomerTypeFormClient";

import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "إضافة نوع عميل جديد - NafeesWeb",
  description: "إضافة نوع عميل جديد إلى النظام",
};

export default async function NewCustomerTypePage() {
  // إنشاء نوع عميل فارغ
  const emptyType = {
    id: 0,
    type_name: "",
    type_name_e: "",
    type_desc: "",
    cr_date: "",
    type_status: true,
  };

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "أنواع العملاء", href: "/basic/cust_type" },
          { name: "إضافة نوع عميل جديد" },
        ]}
      />
      <CustomerTypeFormClient initialType={emptyType} mode="add" />
    </div>
  );
}

