import { Metadata } from "next";

import CustomerTypesClient from "./components/CustomerTypesClient";

import Breadcrumb from "@/components/Breadcrumb";
import customerTypeService from "@/services/api/customer-type.service";

export const metadata: Metadata = {
  title: "أنواع العملاء - NafeesWeb",
  description: "إدارة أنواع العملاء",
};

export default async function CustomerTypesPage() {
  // جلب البيانات على السيرفر
  const typesData = await customerTypeService
    .getAllCustomerTypes()
    .catch(() => []);

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">أنواع العملاء</h1>

      <CustomerTypesClient initialTypes={typesData} />
    </div>
  );
}
