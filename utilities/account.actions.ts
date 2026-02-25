import type { Account } from "@/types/models/account";
import type { VoucherDetail } from "@/types/voucher";

export interface AccountOption {
  label: string;
  value: number;
  account: Account;
}

const toComparableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : null;
};

const toComparableString = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();

  return normalized.length > 0 ? normalized : null;
};

const matchesAccount = (account: Account, candidate: unknown): boolean => {
  const candidateNumber = toComparableNumber(candidate);

  if (candidateNumber !== null) {
    const accountIdNumber = toComparableNumber(account.id);
    const accountNumber = toComparableNumber(account.acc_id);

    if (
      (accountIdNumber !== null && candidateNumber === accountIdNumber) ||
      (accountNumber !== null && candidateNumber === accountNumber)
    ) {
      return true;
    }
  }

  const candidateString = toComparableString(candidate);
  const accountNumberString = toComparableString(account.acc_id);

  if (
    candidateString !== null &&
    accountNumberString !== null &&
    candidateString === accountNumberString
  ) {
    return true;
  }

  return false;
};

const resolveDetailAccount = (
  detail: VoucherDetail,
  accounts: Account[],
): Account | null => {
  const rawAcc = (detail as VoucherDetail & { acc?: unknown }).acc;
  const candidates = [detail.acc_id, rawAcc, detail.acc_code];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") {
      continue;
    }

    const account = accounts.find((acc) => matchesAccount(acc, candidate));

    if (account) {
      return account;
    }
  }

  return null;
};

export const loadAccounts = (accounts: Account[]): AccountOption[] => {
  return accounts.map((account) => ({
    label: `${account.acc_code} - ${account.acc_name}`,
    value: Number(account.id),
    account: account,
  }));
};

export const getAccountSelectValue = (
  detail: VoucherDetail,
  accounts: Account[],
) => {
  const rawAcc = (detail as VoucherDetail & { acc?: unknown }).acc;

  if (!detail.acc_id && !rawAcc && !detail.acc_code) {
    return null;
  }

  const account = resolveDetailAccount(detail, accounts);

  if (account) {
    return {
      label: `${account.acc_code} - ${account.acc_name}`,
      value: Number(account.id),
      account: account,
    };
  }
  if (detail.acc_code && detail.acc_name) {
    const fallbackValue =
      toComparableNumber(detail.acc_id) ?? toComparableNumber(rawAcc) ?? 0;
    const fallbackAccountNumber =
      toComparableString(detail.acc_id ?? rawAcc ?? detail.acc_code) ?? "";

    return {
      label: `${detail.acc_code} - ${detail.acc_name}`,
      value: fallbackValue,
      account: {
        id: fallbackValue,
        acc_id: fallbackAccountNumber,
        acc_code: detail.acc_code,
        acc_name: detail.acc_name,
      } as Account,
    };
  }

  return null;
};
