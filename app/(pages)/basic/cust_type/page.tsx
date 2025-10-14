import { Metadata } from "next";
import customerTypeService from "@/services/api/customer-type.service";
import CustomerTypesClient from "./components/CustomerTypesClient";

export const metadata: Metadata = {
  title: "أنواع العملاء - NafeesWeb",
  description: "إدارة أنواع العملاء",
};

export default async function CustomerTypesPage() {
  // جلب البيانات على السيرفر
  const typesData = await customerTypeService.getAllCustomerTypes().catch(() => []);

  return (
    <div className="responsive-container font-cairo">
      <h1 className="responsive-text-xl font-bold mb-6">أنواع العملاء</h1>
      
      <CustomerTypesClient initialTypes={typesData} />
    </div>
  );
}
