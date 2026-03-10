import { Metadata } from "next";

import AccountsClient from "./components/AccountsClient";
import { ROOT_ACCOUNT_REQUEST_PAYLOAD } from "./utils/account-tree";

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

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const expandedParam = Array.isArray(params.expanded)
    ? params.expanded[0]
    : params.expanded;
  const selectedParam = Array.isArray(params.selected)
    ? params.selected[0]
    : params.selected;
  const initialExpandedIds = expandedParam
    ? expandedParam
        .split(",")
        .map((s) => Number(s.trim()))
        .filter(Number.isFinite)
    : undefined;
  const initialSelectedId = selectedParam ? Number(selectedParam) : undefined;

  try {
    const [accountsData, currenciesData, flatAccounts] = await Promise.all([
      accountService
        .getAccountsTree(ROOT_ACCOUNT_REQUEST_PAYLOAD)
        .catch(() => [] as Account[]),
      accountService.getCurrencies().catch(() => [] as Currency[]),
      accountService.getAllAccounts().catch(() => [] as Account[]),
    ]);

    const flatAccountsById = new Map<string, Account>();

    flatAccounts.forEach((account) => {
      flatAccountsById.set(String(account.id), account);
    });

    const mergeCurrencyLevelAndTypeIntoTree = (nodes: Account[]): Account[] =>
      nodes.map((node) => {
        const fallbackAccount = flatAccountsById.get(String(node.id));
        const resolvedCurrency =
          fallbackAccount?.cur ?? node.cur ?? null;
        const resolvedAccLevel =
          fallbackAccount?.acc_level ?? node.acc_level;
        const resolvedAccType =
          fallbackAccount?.acc_type ?? node.acc_type;

        const children = node.children?.length
          ? mergeCurrencyLevelAndTypeIntoTree(node.children)
          : node.children;

        return {
          ...node,
          cur: resolvedCurrency,
          acc_level: resolvedAccLevel,
          acc_type: resolvedAccType,
          children,
        };
      });

    const accountsWithCurrency =
      flatAccountsById.size > 0
        ? mergeCurrencyLevelAndTypeIntoTree(accountsData)
        : accountsData;

    return (
      <div className="responsive-container font-cairo flex flex-col min-h-[calc(100vh-4rem)]">
        <Breadcrumb />

        <div className="flex-1 flex flex-col min-h-0">
          <AccountsClient
          initialAccounts={accountsWithCurrency}
          initialCurrencies={currenciesData}
          initialExpandedIds={initialExpandedIds}
          initialSelectedId={initialSelectedId}
        />
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      await redirectToLogin();
    }

    throw error;
  }
}
