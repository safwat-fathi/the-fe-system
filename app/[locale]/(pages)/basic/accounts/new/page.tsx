import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import AccountFormClient from "../components/AccountFormClient";
import { normalizeAccountsTree, ROOT_ACCOUNT_REQUEST_PAYLOAD } from "../utils/account-tree";

import Breadcrumb from "@/components/Breadcrumb";
import accountService from "@/services/api/account.service";
import { Account } from "@/types/models/account";
import { Currency } from "@/types/models/currency";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("basic.accounts");

  return {
    title: `${t("form.titleAdd")} - NafeesWeb`,
    description: t("form.subtitleAdd"),
  };
}

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
  const expandedParam = Array.isArray(params.expanded)
    ? params.expanded[0]
    : params.expanded;
  const selectedParam = Array.isArray(params.selected)
    ? params.selected[0]
    : params.selected;

  const parentId = parentIdParam ? Number(parentIdParam) : null;
  const suggestedAccId = suggestedAccIdParam || undefined;
  const returnExpandedIds = expandedParam
    ? expandedParam
        .split(",")
        .map((s) => Number(s.trim()))
        .filter(Number.isFinite)
    : undefined;
  const returnSelectedId = selectedParam ? Number(selectedParam) : null;

  const [accountsData, currenciesData] = await Promise.all([
    accountService
      .getAccountsTree(ROOT_ACCOUNT_REQUEST_PAYLOAD)
      .catch(() => [] as Account[]),
    accountService.getCurrencies().catch(() => [] as Currency[]),
  ]);

  const normalizedAccounts = normalizeAccountsTree(accountsData);

  const t = await getTranslations("basic.accounts");
  const tNav = await getTranslations("navigation.breadcrumbs.segments");

  const initialAccount: Partial<Account> = {
    parent: parentId,
    acc_type: parentId ? 2 : 1,
    acc_level: parentId ? 2 : 1,
  };

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: tNav("accounts"), href: "/basic/accounts" },
          { name: t("form.titleAdd") },
        ]}
      />
      <AccountFormClient
        accounts={normalizedAccounts}
        currencies={currenciesData}
        initialAccount={initialAccount}
        mode="add"
        parentId={parentId}
        suggestedAccId={suggestedAccId}
        returnExpandedIds={returnExpandedIds}
        returnSelectedId={returnSelectedId}
      />
    </div>
  );
}
