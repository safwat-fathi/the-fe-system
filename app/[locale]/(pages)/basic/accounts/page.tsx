import { Metadata } from "next";

import AccountsClient from "./components/AccountsClient";

import Breadcrumb from "@/components/Breadcrumb";
import accountService from "@/services/api/account.service";
import { Account } from "@/types/models/account";
import { Currency } from "@/types/models/currency";
import { redirectToLogin } from "@/app/actions/auth";
import { AuthenticationError } from "@/utilities/errors/Authentication";

export const metadata: Metadata = {
  title: "دليل الحسابات - NafeesWeb",
  description: "إدارة دليل الحسابات",
};

export default async function AccountsPage() {
  try {
    const rootRequestPayload = {
      id: 0,
      acc_id: "0",
      acc_code: "0",
      acc_name: "0",
      acc_name_e: null as string | null,
      parent: null,
      acc_level: 1,
    };

    // Fetch data on server-side in parallel for better performance
    const [accountsData, currenciesData] = await Promise.all([
      accountService
        .getAccountsTree(rootRequestPayload)
        .catch(() => [] as Account[]),
      accountService.getCurrencies().catch(() => [] as Currency[]),
    ]);

    return (
      <div className="responsive-container font-cairo">
        <Breadcrumb />
        <h1 className="responsive-text-xl font-bold mb-6">دليل الحسابات</h1>

        {/* Client Component للتفاعل */}
        <AccountsClient
          initialAccounts={accountsData}
          initialCurrencies={currenciesData}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      await redirectToLogin();
    }

    throw error;
  }
}
