import { Metadata } from "next";

import AccountsClient from "./components/AccountsClient";

import accountService from "@/services/api/account.service";

export const metadata: Metadata = {
  title: "دليل الحسابات - NafeesWeb",
  description: "إدارة دليل الحسابات",
};

interface Account {
  id: number;
  acc_id: string;
  acc_name: string;
  acc_name_e?: string;
  acc_type: number;
  parent: number | null;
  acc_level: number;
  acc_kind: number;
  acc_rep: number;
  acc_digit: number;
  acc_priv: number;
  acc_cat: number;
  acc_notes?: string;
  cur?: number;
  children?: Account[];
}

interface Currency {
  id: number;
  cur_name: string;
  cur_code: string;
}

export default async function AccountsPage() {
  // Fetch data on server-side in parallel for better performance
  const [accountsData, currenciesData] = await Promise.all([
    accountService.getAllAccounts().catch(() => [] as Account[]),
    accountService.getCurrencies().catch(() => [] as Currency[]),
  ]);

  return (
    <div className="responsive-container font-cairo">
      <h1 className="responsive-text-xl font-bold mb-6">دليل الحسابات</h1>

      {/* Client Component للتفاعل */}
      <AccountsClient
        initialAccounts={accountsData}
        initialCurrencies={currenciesData}
      />
    </div>
  );
}
