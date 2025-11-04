import { Metadata } from "next";

import AccountStatementClient from "./components/AccountStatementClient";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "كشف حساب - NafeesWeb",
  description: "تقرير كشف الحساب",
};

export default async function AccountStatementPage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">كشف حساب</h1>
      <AccountStatementClient />
    </div>
  );
}
