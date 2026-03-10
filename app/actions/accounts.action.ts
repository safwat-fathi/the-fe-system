"use server";

import type { Account } from "@/types/models/account";

import accountService from "@/services/api/account.service";
import { revalidateTableData } from "@/app/actions/revalidate.action";


function getNextChildAccId(
  parentAccount: Account,
  flatAccounts: Account[],
): string | null {
  const parentId = parentAccount.id;
  const parentAccId = (parentAccount.acc_id ?? "").toString().trim();

  if (parentAccount.acc_level >= 5) {
    return null;
  }

  const siblings = flatAccounts.filter(
    (acc) => acc.parent === parentId || acc.parent === parentAccount.id,
  );

  if (parentAccount.acc_level < 5 && siblings.length >= 999) {
    return null;
  }

  let newSuffix: string;

  if (parentAccount.acc_level < 4) {
    newSuffix = (siblings.length + 1).toString();
  } else if (parentAccount.acc_level === 4) {
    const siblingNumbers = siblings.map(
      (sibling) =>
        parseInt(
          (sibling.acc_id ?? "").toString().substring(parentAccId.length),
          10,
        ) || 0,
    );

    newSuffix = (Math.max(0, ...siblingNumbers) + 1)
      .toString()
      .padStart(3, "0");
  } else {
    newSuffix = (siblings.length + 1).toString();
  }

  return `${parentAccId}${newSuffix}`;
}

export type CreateAccountAutoForCustomerResult =
  | { success: true; data: Account }
  | { success: false; error: string };


export async function createAccountAutoForCustomerAction(
  mainAccountId: number,
  accountName: string,
  companyId: number,
  accountNameEn?: string,
): Promise<CreateAccountAutoForCustomerResult> {
  try {
    const parentAccount = await accountService.getAccountById(mainAccountId);

    if (!parentAccount) {
      return {
        success: false,
        error: "الحساب الرئيسي لنوع العميل غير موجود",
      };
    }

    const allAccounts = await accountService.getAllAccounts(companyId);
    const nextAccId = getNextChildAccId(parentAccount, allAccounts);

    if (!nextAccId) {
      return {
        success: false,
        error: "تعذر توليد رقم الحساب التالي تحت هذا الحساب الرئيسي",
      };
    }

    const name = (accountName || "حساب عميل").trim();
    const nameEn = (accountNameEn ?? "").trim() || name || "Customer Account";
    const payload: Omit<Account, "id"> = {
      acc_id: nextAccId,
      acc_code: nextAccId,
      acc_name: name,
      acc_name_e: nameEn,
      acc_type: 2, // sub-account
      parent: parentAccount.id,
      acc_level: 5,
      acc_kind: parentAccount.acc_kind ?? 1,
      acc_rep: parentAccount.acc_rep ?? 1,
      acc_digit: parentAccount.acc_digit ?? 4,
      acc_priv: parentAccount.acc_priv ?? 1,
      acc_cat: parentAccount.acc_cat ?? 1,
      acc_notes: "",
      cur: parentAccount.cur ?? null,
      cost: parentAccount.cur ?? parentAccount.cost ?? 1,
    };

    const created = await accountService.createAccount(payload);

    if (!created) {
      return {
        success: false,
        error: "فشل إنشاء الحساب في النظام",
      };
    }

    await revalidateTableData("accounts_list");

    return { success: true, data: created };
  } catch (error) {
    console.error("createAccountAutoForCustomerAction:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إدراج الحساب تلقائياً",
    };
  }
}


export async function syncAccountNamesFromCustomerAction(
  accountId: number,
  acc_name: string,
  acc_name_e?: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const account = await accountService.getAccountById(accountId);

    if (!account) {
      return { success: false, error: "الحساب غير موجود" };
    }

    const name = (acc_name ?? "").trim() || account.acc_name;
    const nameEn =
      (acc_name_e ?? "").trim() || account.acc_name_e || "Unnamed Account";

    await accountService.updateAccount(accountId, {
      ...account,
      acc_name: name,
      acc_name_e: nameEn,
    });

    await revalidateTableData("accounts_list");

    return { success: true };
  } catch (error) {
    console.error("syncAccountNamesFromCustomerAction:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء مزامنة اسم الحساب",
    };
  }
}


export async function getAccountsAction() {
  try {
    const accounts = await accountService.getAllAccounts();

    return {
      success: true,
      data: accounts,
    };
  } catch (error) {
    console.error("❌ Error in getAccountsAction:", error);

    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "حدث خطأ في جلب الحسابات",
    };
  }
}


export async function searchAccountsAction(query: string) {
  try {
    const accounts = await accountService.getAllAccounts();
    const term = query.toLowerCase();

    const filtered = accounts.filter((acc: any) => {
      const accountCode = (acc.acc_code ?? "").toString().toLowerCase();
      const accountName = (acc.acc_name ?? "").toLowerCase();

      return accountCode.includes(term) || accountName.includes(term);
    });

    return {
      success: true,
      data: filtered,
    };
  } catch (error) {
    console.error("❌ Error in searchAccountsAction:", error);

    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "حدث خطأ في البحث",
    };
  }
}
