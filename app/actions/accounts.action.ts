"use server";

import accountService from "@/services/api/account.service";

/**
 * Server Action لجلب الحسابات
 * يُستخدم من Client Components للحصول على الحسابات مع المصادقة الصحيحة
 */
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

/**
 * Server Action للبحث في الحسابات
 */
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

