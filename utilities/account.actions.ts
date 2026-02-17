import type { Account } from "@/types/models/account";
import type { VoucherDetail } from "@/types/voucher";

export const loadAccounts = (accounts: Account[]) => {
  return accounts.map((account) => ({
    label: `${account.acc_code || ""} - ${account.acc_name || ""}`,
    value: Number(account.id),
    account: account,
  }));
};

export const getAccountSelectValue = (
  detail: VoucherDetail,
  accounts: Account[],
) => {
  if (!detail.acc_id) {
    return null;
  }

  const account = accounts.find((acc) => acc.id === detail.acc_id);

  if (account) {
    return {
      label: `${account.acc_code || ""} - ${account.acc_name || ""}`,
      value: Number(account.id),
      account: account,
    };
  }
  if (detail.acc_code || detail.acc_name) {
    return {
      label: `${detail.acc_code || ""} - ${detail.acc_name || ""}`,
      value: Number(detail.acc_id),
      account: {
        id: Number(detail.acc_id),
        acc_id: String(detail.acc_id),
        acc_code: detail.acc_code,
        acc_name: detail.acc_name,
      } as any,
    };
  }

  return null;
};
