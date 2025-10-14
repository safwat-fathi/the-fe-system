import { Metadata } from "next";
import customerService from "@/services/api/customer.service";
import helperService from "@/services/api/helper.service";
import accountService from "@/services/api/account.service";
import CustomersClient from "./components/CustomersClient";

export const metadata: Metadata = {
  title: "العملاء - NafeesWeb",
  description: "إدارة العملاء",
};

export default async function CustomersPage() {
  // جلب البيانات بالتوازي للأداء الأفضل
  const [customersData, customerTypesData, customerStatusData, accountsData, boxTypesData] = await Promise.all([
    customerService.getAllCustomers().catch(() => []),
    helperService.getCustomerTypes().catch(() => []),
    helperService.getCustomerStatuses().catch(() => []),
    accountService.getAllAccounts().catch(() => []),
    helperService.getBoxTypes().catch(() => []),
  ]);

  return (
    <div className="responsive-container font-cairo">
      <h1 className="responsive-text-xl font-bold mb-6">العملاء</h1>

      <CustomersClient 
        initialCustomers={customersData as any}
        initialCustomerTypes={customerTypesData as any}
        initialCustomerStatus={customerStatusData as any}
        initialAccounts={accountsData as any}
        initialBoxTypes={boxTypesData as any}
      />
    </div>
  );
}
