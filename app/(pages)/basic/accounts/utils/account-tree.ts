import { Account } from "@/types/models/account";

const toNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? fallback : parsed;
};

const toStringSafe = (value: unknown, fallback = ""): string => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const stringified = String(value);

  return stringified.trim().length > 0 ? stringified : fallback;
};

const extractChildren = (node: any): any[] => {
  if (!node) return [];

  const candidates = [
    node.children,
    node.childs,
    node.child,
    node.children_list,
    node.Childs,
    node.Child,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const normalizeNode = (node: any, parentId: number | null = null): Account | null => {
  if (!node) {
    return null;
  }

  const id = toNumber(node.id ?? node.acc_id ?? Date.now());
  const accId = toStringSafe(node.acc_id ?? node.acc_code ?? id, String(id));
  const accName =
    toStringSafe(node.acc_name ?? node.name ?? node.acc_name_e, accId) || accId;
  const accLevel = toNumber(node.acc_level ?? node.level, parentId ? 2 : 1) || 1;
  const accKind = toNumber(node.acc_kind, 1) || 1;
  const accRep = toNumber(node.acc_rep ?? node.acc_report, 1) || 1;
  const accDigit = toNumber(node.acc_digit ?? node.acc_digits, 0) || 0;
  const accPriv = toNumber(node.acc_priv, 1) || 1;
  const accCat = toNumber(node.acc_cat, 1) || 1;
  const curValue =
    node.cur === null || node.cur === undefined ? null : toNumber(node.cur);
  const rawChildren = extractChildren(node);

  const normalizedChildren = rawChildren
    .map((child) => normalizeNode(child, id))
    .filter(Boolean) as Account[];

  let parentRawValue: number | null | undefined = undefined;

  if (node.parent !== undefined && node.parent !== null) {
    parentRawValue = toNumber(node.parent);
  } else if (node.acc_parent !== undefined && node.acc_parent !== null) {
    parentRawValue = toNumber(node.acc_parent);
  } else if (node.parent_id !== undefined && node.parent_id !== null) {
    parentRawValue = toNumber(node.parent_id);
  } else {
    parentRawValue = parentId ?? null;
  }

  const parentNormalized =
    parentRawValue === undefined || parentRawValue === null || parentRawValue === 0
      ? null
      : parentRawValue;

  const account: Account = {
    id,
    acc_id: accId,
    acc_name: accName,
    acc_name_e: toStringSafe(node.acc_name_e, ""),
    acc_type:
      node.acc_type !== undefined && node.acc_type !== null
        ? toNumber(node.acc_type, normalizedChildren.length > 0 ? 1 : 2) ||
          (normalizedChildren.length > 0 ? 1 : 2)
        : normalizedChildren.length > 0
        ? 1
        : 2,
    parent: parentNormalized,
    acc_level: accLevel,
    acc_kind: accKind,
    acc_rep: accRep,
    acc_digit: accDigit,
    acc_priv: accPriv,
    acc_cat: accCat,
    acc_notes: node.acc_notes ?? node.notes ?? "",
    cur: curValue,
    children: normalizedChildren,
  };

  return account;
};

export const normalizeAccountsTree = (tree: any): Account[] => {
  const nodes = Array.isArray(tree) ? tree : tree ? [tree] : [];

  const normalizedNodes = nodes
    .map((node) => normalizeNode(node))
    .filter(Boolean) as Account[];

  const flattenPlaceholders = (account: Account): Account[] => {
    const accIdLower = (account.acc_id ?? "").toString().toLowerCase();
    const isPlaceholder =
      accIdLower === "0" || accIdLower === "000" || accIdLower === "root";

    if (!isPlaceholder && account.id !== 0) {
      return [account];
    }

    return (account.children ?? []).flatMap((child) => {
      const normalizedChild = {
        ...child,
        parent:
          child.parent === account.id || child.parent === 0 ? null : child.parent,
      };

      return flattenPlaceholders(normalizedChild);
    });
  };

  const flattened = normalizedNodes.flatMap((account) => flattenPlaceholders(account));

  const accountMap = new Map<number, Account>();
  const roots: Account[] = [];

  flattened.forEach((account) => {
    accountMap.set(account.id, {
      ...account,
      children: [],
    });
  });

  flattened.forEach((account) => {
    const current = accountMap.get(account.id);

    if (!current) {
      return;
    }

    const parentId = account.parent ?? null;

    if (parentId && accountMap.has(parentId) && parentId !== account.id) {
      const parentAccount = accountMap.get(parentId)!;
      parentAccount.children = parentAccount.children
        ? [...parentAccount.children, current]
        : [current];
    } else {
      roots.push(current);
    }
  });

  return roots;
};

export const flattenAccountTree = (tree: Account[]): Account[] => {
  const result: Account[] = [];

  const traverse = (nodes: Account[]) => {
    nodes.forEach((node) => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(tree);

  return result;
};

export const removeAccountFromTree = (tree: Account[], accountId: number): Account[] =>
  tree
    .map((node) => ({
      ...node,
      children: node.children
        ? removeAccountFromTree(
            node.children.filter((child) => child.id !== accountId),
            accountId,
          )
        : undefined,
    }))
    .filter((node) => node.id !== accountId);

export const generateAccountId = (
  accounts: Account[],
  parentId: number | null,
): string => {
  const flatAccounts = flattenAccountTree(accounts);
  const parentAccount = flatAccounts.find((account) => account.id === parentId);
  const parentAccId = parentAccount ? parentAccount.acc_id : "";

  if (parentAccount && parentAccount.acc_level >= 5) {
    return "";
  }

  const siblings = flatAccounts.filter((account) => account.parent === parentId);
  const siblingCount = siblings.length;

  if (parentAccount && parentAccount.acc_level < 5 && siblingCount >= 9) {
    return "";
  }

  let newSuffix: string;

  if (parentAccount && parentAccount.acc_level < 4) {
    newSuffix = (siblingCount + 1).toString();
  } else if (parentAccount && parentAccount.acc_level === 4) {
    const siblingNumbers = siblings.map(
      (sibling) =>
        parseInt(sibling.acc_id.substring(parentAccId.length)) || 0,
    );

    newSuffix = (Math.max(...siblingNumbers, 0) + 1)
      .toString()
      .padStart(4, "0");
  } else {
    newSuffix = (siblingCount + 1).toString();
  }

  return `${parentAccId}${newSuffix}`;
};

export const findAccountById = (
  accounts: Account[],
  accountId: number,
): Account | undefined => flattenAccountTree(accounts).find((acc) => acc.id === accountId);

export const getAccountPath = (accounts: Account[], account: Account): Account[] => {
  const path: Account[] = [account];
  let currentAccount = account;

  while (currentAccount.parent && currentAccount.parent !== 0) {
    const parent = accounts.find((acc) => acc.id === currentAccount.parent);

    if (parent) {
      path.unshift(parent);
      currentAccount = parent;
    } else {
      break;
    }
  }

  return path;
};

