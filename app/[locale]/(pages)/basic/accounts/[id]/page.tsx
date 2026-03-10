import { Metadata } from "next";
import { notFound } from "next/navigation";

import AccountFormClient from "../components/AccountFormClient";
import {
  normalizeAccountsTree,
  findAccountById,
  ROOT_ACCOUNT_REQUEST_PAYLOAD,
} from "../utils/account-tree";

import Breadcrumb from "@/components/Breadcrumb";
import accountService from "@/services/api/account.service";
import { Account } from "@/types/models/account";
import { Currency } from "@/types/models/currency";

export const metadata: Metadata = {
  title: "تفاصيل الحساب - NafeesWeb",
  description: "استعراض وتعديل تفاصيل الحساب",
};

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AccountDetailsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const search = await searchParams;
  const modeParam = Array.isArray(search.mode) ? search.mode[0] : search.mode;
  const mode = modeParam === "edit" ? "edit" : "view";
  const expandedParam = Array.isArray(search.expanded)
    ? search.expanded[0]
    : search.expanded;
  const selectedParam = Array.isArray(search.selected)
    ? search.selected[0]
    : search.selected;

  const returnExpandedIds = expandedParam
    ? expandedParam
        .split(",")
        .map((s) => Number(s.trim()))
        .filter(Number.isFinite)
    : undefined;
  const returnSelectedId = selectedParam ? Number(selectedParam) : null;

  const accountId = Number(id);

  if (!Number.isFinite(accountId) || accountId <= 0) {
    notFound();
  }

  const [accountsData, currenciesData, flatAccounts] = await Promise.all([
    accountService
      .getAccountsTree(ROOT_ACCOUNT_REQUEST_PAYLOAD)
      .catch(() => [] as Account[]),
    accountService.getCurrencies().catch(() => [] as Currency[]),
    accountService.getAllAccounts().catch(() => [] as Account[]),
  ]);

  const normalizedAccounts = normalizeAccountsTree(accountsData);
  const accountFromTree = findAccountById(normalizedAccounts, accountId);

  if (!accountFromTree) {
    notFound();
  }

  const flatById = new Map(
    flatAccounts.map((a) => [String(a.id), a]),
  );
  const flatAccount = flatById.get(String(accountId));
  const account: Account = {
    ...accountFromTree,
    acc_level: flatAccount?.acc_level ?? accountFromTree.acc_level,
    cur: flatAccount?.cur ?? accountFromTree.cur ?? null,
  };

  const breadcrumbLabel =
    mode === "edit"
      ? `تعديل ${account.acc_name || account.acc_id}`
      : `عرض ${account.acc_name || account.acc_id}`;

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "الحسابات", href: "/basic/accounts" },
          { name: breadcrumbLabel },
        ]}
      />
      <AccountFormClient
        accounts={normalizedAccounts}
        currencies={currenciesData}
        initialAccount={account}
        mode={mode}
        parentId={account.parent ?? null}
        returnExpandedIds={returnExpandedIds}
        returnSelectedId={returnSelectedId}
      />
    </div>
  );
}
