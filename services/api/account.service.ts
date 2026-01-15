import { HttpService } from "@/services/base";
import { Account } from "@/types/models/account";
import { Currency } from "@/types/models/currency";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

class AccountService extends HttpService<Account> {
  constructor() {
    super("");
  }

  async getAllAccounts(xcom_id?: number | string): Promise<Account[]> {
    try {
      let companyId = xcom_id;

      if (!companyId) {
        try {
          const branchParams = await import("@/app/actions/branch-params").then(
            (m) => m.getBranchParams(),
          );

          companyId = branchParams.com || "1";
        } catch {
          companyId = "1";
        }
      }

      const response = await this.get<Account[]>(
        "accounts_list",
        {
          xcom_id: companyId || "1",
        },
        {
          next: {
            revalidate: 300, // Cache for 5 minutes
            tags: ["accounts", "accounts_list"],
          },
        },
      );

      if (response.success) {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray((response.data as any)?.results)) {
          return (response.data as any).results;
        }
      }

      return [];
    } catch (error) {
      console.error("Error fetching accounts:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب بيانات الحسابات");
    }
  }

  async getAccounts(xcom_id?: number | string): Promise<Account[]> {
    try {
      const response = await this.get<Account[]>(
        "getAccounts",
        {
          xcom_id: xcom_id || "1",
        },
        {
          next: {
            revalidate: 300,
            tags: ["getAccounts"],
          },
        },
      );

      if (response.success) {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray((response.data as any)?.results)) {
          return (response.data as any).results;
        }
      }

      return [];
    } catch (error) {
      console.error("Error fetching accounts:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب بيانات الحسابات");
    }
  }

  async createAccount(account: Omit<Account, "id">): Promise<Account | null> {
    try {
      const accountData = {
        ...account,
        acc_name_e: account.acc_name_e || "Unnamed Account",
        acc_vat: "0%",
      };

      const response = await this.post<Account>(
        "api_create_account",
        accountData,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as Account;
      }

      return null;
    } catch (error) {
      console.error("Error creating account:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء إنشاء الحساب");
    }
  }

  async updateAccount(
    id: number,
    account: Partial<Account>,
  ): Promise<Account | null> {
    try {
      const accountData = {
        ...account,
        acc_name_e: account.acc_name_e || "Unnamed Account",
        acc_vat: "0%",
      };

      const response = await this.put<Account>(
        `api_update_account/${id}`,
        accountData,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as Account;
      }

      return null;
    } catch (error) {
      console.error("Error updating account:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء تحديث الحساب");
    }
  }

  async deleteAccount(id: number): Promise<boolean> {
    try {
      const response = await this.delete(
        `api_delete_account/${id}`,
        undefined,
        {
          cache: "no-store",
        },
      );

      return response.success;
    } catch (error) {
      console.error("Error deleting account:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء حذف الحساب");
    }
  }

  async getAccountById(id: number): Promise<Account | null> {
    try {
      const accounts = await this.getAllAccounts();

      return accounts.find((account) => account.id === id) || null;
    } catch (error) {
      console.error("Error fetching account by ID:", error);

      return null;
    }
  }

  async getCurrencies(): Promise<Currency[]> {
    try {
      const response = await this.get<Currency[]>(
        "currencies_list",
        undefined,
        {
          next: {
            revalidate: 600, // Cache for 10 minutes (currencies don't change often)
            tags: ["currencies", "currencies_list"],
          },
        },
      );

      if (response.success) {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray((response.data as any)?.results)) {
          return (response.data as any).results;
        }
      }

      return [];
    } catch (error) {
      console.error("Error fetching currencies:", error);

      return [];
    }
  }

  async getAccountsTree(
    payload: {
      id: number;
      acc_id: string;
      acc_code: string;
      acc_name: string;
      acc_name_e: string | null;
      parent: number | null;
      acc_level: number;
    },
    xcom_id?: number | string,
    forceRefresh = false,
  ): Promise<Account[]> {
    try {
      let companyId = xcom_id;

      if (!companyId) {
        try {
          const branchParams = await import("@/app/actions/branch-params").then(
            (m) => m.getBranchParams(),
          );

          companyId = branchParams.com || "1";
        } catch {
          companyId = "1";
        }
      }

      const queryParams: Record<string, string | number> = {
        xcom_id: companyId || "1",
        id: payload.id ?? 0,
        acc_id: payload.acc_id ?? "0",
        acc_code: payload.acc_code ?? "0",
        acc_name: payload.acc_name ?? "0",
        acc_level: payload.acc_level ?? 1,
      };

      if (payload.acc_name_e) {
        queryParams.acc_name_e = payload.acc_name_e;
      }

      if (payload.parent !== undefined && payload.parent !== null) {
        queryParams.parent = payload.parent;
      }

      const requestOptions: RequestInit & {
        next?: {
          revalidate?: number;
          tags?: string[];
        };
      } = forceRefresh
        ? {
            cache: "no-store",
          }
        : {
            cache: "force-cache",
            next: {
              revalidate: 300,
              tags: [
                "accounts",
                "accounts-tree",
                `accounts-tree-company-${companyId || "1"}`,
              ],
            },
          };

      const response = await this.get<Account[]>(
        "getAccountsTree",
        queryParams,
        requestOptions,
      );

      if (response.success) {
        if (Array.isArray(response.data)) {
          return response.data;
        }

        if (response.data && typeof response.data === "object") {
          const dataObj = response.data as any;

          if (Array.isArray(dataObj.results)) {
            return dataObj.results;
          }

          if (
            Array.isArray(dataObj.children) ||
            Array.isArray(dataObj.childs) ||
            Array.isArray(dataObj.child) ||
            Array.isArray(dataObj.children_list)
          ) {
            return [dataObj as Account];
          }
        }
      }

      return [];
    } catch (error) {
      console.error("Error fetching accounts tree:", error);
      throw new Error("حدث خطأ أثناء جلب شجرة الحسابات");
    }
  }
}

export default new AccountService();
