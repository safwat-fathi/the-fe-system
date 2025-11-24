import { Metadata } from "next";

import AccountFormClient from "../components/AccountFormClient";
import { normalizeAccountsTree } from "../utils/account-tree";

import Breadcrumb from "@/components/Breadcrumb";
import accountService from "@/services/api/account.service";
import { Account } from "@/types/models/account";
import { Currency } from "@/types/models/currency";

export const metadata: Metadata = {
  title: "إضافة حساب جديد - NafeesWeb",
  description: "إضافة حساب جديد إلى دليل الحسابات",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewAccountPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const parentIdParam = Array.isArray(params.parentId)
    ? params.parentId[0]
    : params.parentId;
  const suggestedAccIdParam = Array.isArray(params.suggestedAccId)
    ? params.suggestedAccId[0]
    : params.suggestedAccId;

  const parentId = parentIdParam ? Number(parentIdParam) : null;
  const suggestedAccId = suggestedAccIdParam || undefined;

  const rootRequestPayload = {
    id: 0,
    acc_id: "0",
    acc_code: "0",
    acc_name: "0",
    acc_name_e: null as string | null,
    parent: null,
    acc_level: 1,
  };

  const [accountsData, currenciesData] = await Promise.all([
    accountService
      .getAccountsTree(rootRequestPayload)
      .catch(() => [] as Account[]),
    accountService.getCurrencies().catch(() => [] as Currency[]),
  ]);

  const normalizedAccounts = normalizeAccountsTree(accountsData);

  const initialAccount: Partial<Account> = {
    parent: parentId,
    acc_type: parentId ? 2 : 1,
    acc_level: parentId ? 2 : 1,
  };

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "الحسابات", href: "/basic/accounts" },
          { name: "إضافة حساب جديد" },
        ]}
      />
      <AccountFormClient
        accounts={normalizedAccounts}
        currencies={currenciesData}
        initialAccount={initialAccount}
        mode="add"
        parentId={parentId}
        suggestedAccId={suggestedAccId}
      />
    </div>
  );
}
