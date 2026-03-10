import { Account } from "@/types/models/account";

export const ROOT_ACCOUNT_REQUEST_PAYLOAD = {
  id: 0,
  acc_id: "0",
  acc_code: "0",
  acc_name: "0",
  acc_name_e: null as string | null,
  parent: null,
  acc_level: 1,
} as const;

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

interface RawNode {
  [key: string]: any;
}

const extractChildren = (node: RawNode | null): RawNode[] => {
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

const getParentRawValue = (
  node: RawNode,
  parentId: number | null,
): number | null => {
  if (node.parent !== undefined && node.parent !== null) {
    return toNumber(node.parent);
  }
  if (node.acc_parent !== undefined && node.acc_parent !== null) {
    return toNumber(node.acc_parent);
  }
  if (node.parent_id !== undefined && node.parent_id !== null) {
    return toNumber(node.parent_id);
  }

  return parentId;
};

const calculateAccType = (node: RawNode, hasChildren: boolean): number => {
  if (node.acc_type !== undefined && node.acc_type !== null) {
    const defaultType = hasChildren ? 1 : 2;

    return toNumber(node.acc_type, defaultType) || defaultType;
  }

  return hasChildren ? 1 : 2;
};

const normalizeNode = (
  node: RawNode | null,
  parentId: number | null = null,
): Account | null => {
  if (!node) {
    return null;
  }

  const id = toNumber(node.id ?? node.acc_id ?? Date.now());
  const accId = toStringSafe(node.acc_id ?? node.acc_code ?? id, String(id));
  const accName =
    toStringSafe(node.acc_name ?? node.name ?? node.acc_name_e, accId) || accId;
  const accLevel =
    toNumber(node.acc_level ?? node.level, parentId ? 2 : 1) || 1;
  const accKind = toNumber(node.acc_kind, 1) || 1;
  const accRep = toNumber(node.acc_rep ?? node.acc_report, 1) || 1;
  const accDigit = toNumber(node.acc_digit ?? node.acc_digits, 0) || 0;
  const accPriv = toNumber(node.acc_priv, 1) || 1;
  const accCat = toNumber(node.acc_cat, 1) || 1;
  const curValue =
    node.cur === null || node.cur === undefined ? null : toNumber(node.cur);
  const costValue =
    node.cost === null || node.cost === undefined
      ? null
      : toNumber(node.cost);
  const rawChildren = extractChildren(node);

  const normalizedChildren = rawChildren
    .map((child) => normalizeNode(child, id))
    .filter(Boolean) as Account[];

  const parentRawValue = getParentRawValue(node, parentId);

  const parentNormalized =
    parentRawValue === undefined ||
    parentRawValue === null ||
    parentRawValue === 0
      ? null
      : parentRawValue;

  const accType = calculateAccType(node, normalizedChildren.length > 0);

  const account: Account = {
    id,
    acc_code: node.acc_code ?? accId,
    acc_id: accId,
    acc_name: accName,
    acc_name_e: toStringSafe(node.acc_name_e, ""),
    acc_type: accType,
    parent: parentNormalized,
    acc_level: accLevel,
    acc_kind: accKind,
    acc_rep: accRep,
    acc_digit: accDigit,
    acc_priv: accPriv,
    acc_cat: accCat,
    acc_notes: node.acc_notes ?? node.notes ?? "",
    cur: curValue,
    cost: costValue ?? curValue ?? 1,
    children: normalizedChildren,
  };

  return account;
};

export const normalizeAccountsTree = (tree: any): Account[] => {
  let nodes: RawNode[] = [];

  if (Array.isArray(tree)) {
    nodes = tree;
  } else if (tree) {
    nodes = [tree];
  }

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
          child.parent === account.id || child.parent === 0
            ? null
            : child.parent,
      };

      return flattenPlaceholders(normalizedChild);
    });
  };

  const flattened = normalizedNodes.flatMap((account) =>
    flattenPlaceholders(account),
  );

  if (flattened.length === 0) {
    return [];
  }

  const accountsWithParents: Account[] = flattened.map((account) => ({
    ...account,
  }));

  const existingIds = new Set(accountsWithParents.map((acc) => acc.id));

  accountsWithParents.forEach((account) => {
    const parentId = account.parent ?? null;

    if (
      !parentId ||
      parentId === 0 ||
      parentId === account.id ||
      !existingIds.has(parentId)
    ) {
      account.parent = null;
    }
  });

  const inferParentsFromCodes = (input: Account[]): Account[] => {
    const cloned = input.map((acc) => ({ ...acc }));
    const sortedByCodeLength = [...cloned].sort(
      (a, b) =>
        (a.acc_id ?? "").toString().length -
        (b.acc_id ?? "").toString().length,
    );

    const idSet = new Set(sortedByCodeLength.map((acc) => acc.id));

    for (const acc of sortedByCodeLength) {
      // إذا كان لديه أب صالح بالفعل فلا نغيّره
      if (acc.parent && acc.parent !== 0 && idSet.has(acc.parent)) {
        continue;
      }

      const code = (acc.acc_id ?? "").toString().trim();

      if (!code) continue;

      let bestParent: Account | null = null;
      let bestLength = 0;

      for (const candidate of sortedByCodeLength) {
        if (candidate.id === acc.id) continue;

        const candidateCode = (candidate.acc_id ?? "").toString().trim();

        if (!candidateCode) continue;
        if (candidateCode.length >= code.length) continue;
        if (!code.startsWith(candidateCode)) continue;

        // نختار أطول بادئة ممكنة حتى يكون الهيكل صحيحاً قدر الإمكان
        if (candidateCode.length > bestLength) {
          bestParent = candidate;
          bestLength = candidateCode.length;
        }
      }

      if (bestParent) {
        acc.parent = bestParent.id;
      }
    }

    return cloned;
  };

  const finalAccounts = inferParentsFromCodes(accountsWithParents);

  const accountMap = new Map<number, Account>();
  const roots: Account[] = [];

  finalAccounts.forEach((account) => {
    accountMap.set(account.id, {
      ...account,
      children: [],
    });
  });

  finalAccounts.forEach((account) => {
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

/** يرجع الحسابات ذات المستوى الرابع فقط (للاستخدام في خانة الحساب الرئيسي مثلاً) */
export const getAccountsLevel4 = (rawTree: any): Account[] => {
  const normalized = normalizeAccountsTree(rawTree);
  const flat = flattenAccountTree(normalized);

  return flat.filter((account) => Number(account.acc_level) === 4);
};

export const removeAccountFromTree = (
  tree: Account[],
  accountId: number,
): Account[] =>
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

  const siblings = flatAccounts.filter(
    (account) => account.parent === parentId,
  );
  const siblingCount = siblings.length;

  if (parentAccount && parentAccount.acc_level < 5 && siblingCount >= 9) {
    return "";
  }

  let newSuffix: string;

  if (parentAccount && parentAccount.acc_level < 4) {
    newSuffix = (siblingCount + 1).toString();
  } else if (parentAccount && parentAccount.acc_level === 4) {
    const siblingNumbers = siblings.map(
      (sibling) => parseInt(sibling.acc_id.substring(parentAccId.length)) || 0,
    );

    newSuffix = (Math.max(...siblingNumbers, 0) + 1)
      .toString()
      .padStart(3, "0");
  } else {
    newSuffix = (siblingCount + 1).toString();
  }

  return `${parentAccId}${newSuffix}`;
};

export const findAccountById = (
  accounts: Account[],
  accountId: number,
): Account | undefined =>
  flattenAccountTree(accounts).find((acc) => acc.id === accountId);

export const getAccountPath = (
  accounts: Account[],
  account: Account,
): Account[] => {
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
