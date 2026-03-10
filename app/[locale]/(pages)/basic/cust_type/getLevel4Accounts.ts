import { Account } from "@/types/models/account";
import {
  getAccountsLevel4,
  ROOT_ACCOUNT_REQUEST_PAYLOAD,
} from "@/app/[locale]/(pages)/basic/accounts/utils/account-tree";
import accountService from "@/services/api/account.service";

/**
 * يجلب الحسابات ذات acc_level === 4 لعرضها في خانة الحساب الرئيسي.
 * يحاول أولاً من شجرة الحسابات، وإذا كانت فارغة يستخدم القائمة المسطحة (accounts_list).
 */
export async function getLevel4Accounts(): Promise<Account[]> {
  const accountsTree = await accountService
    .getAccountsTree(ROOT_ACCOUNT_REQUEST_PAYLOAD)
    .catch(() => []);

  const fromTree = getAccountsLevel4(accountsTree);

  if (fromTree.length > 0) return fromTree;

  const flatList = await accountService.getAllAccounts().catch(() => []);

  return flatList.filter((a) => {
    const level = Number((a as { acc_level?: number; level?: number }).acc_level ?? (a as { level?: number }).level ?? 0);

    return level === 4;
  });
}
