import { HttpService } from "@/services/base";

interface Account {
  id: number;
  acc_id: string;
  acc_name: string;
  acc_name_e?: string;
  acc_type: number; // 1 = رئيسي, 2 = فرعي
  parent: number | null;
  acc_level: number;
  acc_kind: number;
  acc_rep: number; // 1 = الأرباح والخسائر, 2 = الميزانية العمومية
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

class AccountService extends HttpService<Account> {
  constructor() {
    super("");
  }

  async getAllAccounts(): Promise<Account[]> {
    try {
      const response = await this.get<Account[]>("accounts_list", undefined, {
        next: {
          revalidate: 300, // Cache for 5 minutes
          tags: ["accounts", "accounts_list"],
        },
      });

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
}

export default new AccountService();
