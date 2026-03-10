import {
  AuthenticationError,
  AuthorizationError,
} from "@/utilities/errors/Authentication";

export const CANONICAL_PERMISSION_ACTIONS = {
  VIEW: "view",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  PRINT: "print",
  EXPORT: "export",
  MANAGE: "manage",
} as const;

export type CanonicalAction =
  (typeof CANONICAL_PERMISSION_ACTIONS)[keyof typeof CANONICAL_PERMISSION_ACTIONS];

export interface BackendPermission {
  com: number;
  obj: number;
  obj_name: string;
  priv_status: boolean;
  obj_source: string;
  parent_obj_name: string;
  group: number;
  rule_name: string | null;
}

export type PermissionMap = Map<string, Set<CanonicalAction>>;
type UnknownRecord = Record<string, unknown>;

type RoutePermissionRequirement = {
  action: CanonicalAction;
  subject?: string;
  subjectPrefix?: string;
};

export interface RoutePolicy {
  match: "all" | "any";
  requirements: RoutePermissionRequirement[];
}

export const WILDCARD_ADMIN_SUBJECT = "all";
export const WILDCARD_ADMIN_ACTION: CanonicalAction = "manage";
const WILDCARD_ADMIN_SOURCE = `${WILDCARD_ADMIN_SUBJECT}.${WILDCARD_ADMIN_ACTION}`;

const ACTION_ALIASES: Record<string, CanonicalAction> = {
  view: "view",
  read: "view",
  create: "create",
  add: "create",
  update: "update",
  edit: "update",
  delete: "delete",
  print: "print",
  export: "export",
  manage: "manage",
};

const LEGACY_ACTIONS: Record<CanonicalAction, string> = {
  view: "view",
  create: "add",
  update: "edit",
  delete: "delete",
  print: "print",
  export: "export",
  manage: "manage",
};

const resolveModeAction = (
  mode: string | null | undefined,
): CanonicalAction | null => {
  const normalizedMode = toSafeString(mode);

  if (!normalizedMode) {
    return null;
  }

  if (normalizedMode === "new") {
    return "create";
  }

  if (normalizedMode === "edit") {
    return "update";
  }

  if (normalizedMode === "preview") {
    return "view";
  }

  return normalizeAction(normalizedMode);
};

const toSafeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
};

const deduplicate = <T,>(values: T[]) => Array.from(new Set(values));
const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasWildcardAdmin = (permissionMap: PermissionMap): boolean =>
  hasAction(permissionMap.get(WILDCARD_ADMIN_SUBJECT), WILDCARD_ADMIN_ACTION);

const hasAction = (
  actions: Set<CanonicalAction> | undefined,
  requiredAction: CanonicalAction,
): boolean => {
  if (!actions || actions.size === 0) {
    return false;
  }

  if (actions.has(requiredAction) || actions.has("manage")) {
    return true;
  }

  if (requiredAction === "view") {
    return actions.size > 0;
  }

  return false;
};

export const normalizeAction = (
  rawAction: string | null | undefined,
): CanonicalAction | null => {
  const normalized = toSafeString(rawAction);

  if (!normalized) {
    return null;
  }

  return ACTION_ALIASES[normalized] ?? null;
};

export const normalizePermissionActions = (actions: unknown): CanonicalAction[] => {
  if (!Array.isArray(actions)) {
    return [];
  }

  const normalized = actions
    .map((action) => normalizeAction(String(action)))
    .filter((action): action is CanonicalAction => action !== null);

  return deduplicate(normalized);
};

export const serializeActionForBackend = (action: string): string => {
  const normalized = normalizeAction(action);

  if (!normalized) {
    return action;
  }

  return LEGACY_ACTIONS[normalized];
};

export const serializePermissionActionsForBackend = (actions: unknown): string[] => {
  if (!Array.isArray(actions)) {
    return [];
  }

  const serialized = actions.map((action) =>
    serializeActionForBackend(String(action)),
  );

  return deduplicate(serialized.filter((action) => action.trim().length > 0));
};

export const buildPermissionMap = (permissions: BackendPermission[]): PermissionMap => {
  const map: PermissionMap = new Map();

  for (const permission of permissions) {
    if (!permission.priv_status || !permission.obj_source) {
      continue;
    }

    const sources = permission.obj_source.split(",").map((source) => source.trim());

    for (const source of sources) {
      const lastDot = source.lastIndexOf(".");

      if (lastDot === -1) {
        continue;
      }

      const subject = source.substring(0, lastDot).trim();
      const normalizedAction = normalizeAction(source.substring(lastDot + 1));

      if (!subject || !normalizedAction) {
        continue;
      }

      if (!map.has(subject)) {
        map.set(subject, new Set());
      }

      map.get(subject)?.add(normalizedAction);
    }
  }

  return map;
};

export const buildWildcardAdminPermissions = (): BackendPermission[] => [
  {
    com: 0,
    obj: 0,
    obj_name: WILDCARD_ADMIN_SUBJECT,
    priv_status: true,
    obj_source: WILDCARD_ADMIN_SOURCE,
    parent_obj_name: "",
    group: 0,
    rule_name: "implicit-admin",
  },
];

export interface ParsedUserPermissionPayload {
  permissions: BackendPermission[];
  costCenters: unknown[];
  hasPermissionsArray: boolean;
  hasCostCentersArray: boolean;
  isImplicitAdmin: boolean;
}

const getPermissionPayloadCandidate = (
  payload: unknown,
): UnknownRecord | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const nestedData = payload.data;
  const nestedIsRecord = isRecord(nestedData);

  const directHasKnownFields =
    Array.isArray(payload.permissions) ||
    Array.isArray(payload.user_cost_centers) ||
    Array.isArray(payload.cost_centers);
  const nestedHasKnownFields =
    nestedIsRecord &&
    (Array.isArray(nestedData.permissions) ||
      Array.isArray(nestedData.user_cost_centers) ||
      Array.isArray(nestedData.cost_centers));

  if (nestedHasKnownFields) {
    return nestedData;
  }

  if (directHasKnownFields) {
    return payload;
  }

  return payload;
};

export const parseUserPermissionPayload = (
  payload: unknown,
): ParsedUserPermissionPayload => {
  const candidate = getPermissionPayloadCandidate(payload);

  if (!candidate) {
    return {
      permissions: [],
      costCenters: [],
      hasPermissionsArray: false,
      hasCostCentersArray: false,
      isImplicitAdmin: false,
    };
  }

  const permissions = Array.isArray(candidate.permissions)
    ? (candidate.permissions as BackendPermission[])
    : [];

  const userCostCenters = Array.isArray(candidate.user_cost_centers)
    ? candidate.user_cost_centers
    : null;
  const costCenters = Array.isArray(candidate.cost_centers)
    ? candidate.cost_centers
    : null;
  const resolvedCostCenters = userCostCenters ?? costCenters ?? [];

  const hasPermissionsArray = Array.isArray(candidate.permissions);
  const hasCostCentersArray =
    Array.isArray(candidate.user_cost_centers) ||
    Array.isArray(candidate.cost_centers);
  const isImplicitAdmin =
    hasPermissionsArray &&
    hasCostCentersArray &&
    permissions.length === 0 &&
    resolvedCostCenters.length === 0;

  return {
    permissions,
    costCenters: resolvedCostCenters,
    hasPermissionsArray,
    hasCostCentersArray,
    isImplicitAdmin,
  };
};

export const resolvePermissionsFromPayload = (
  payload: unknown,
): ParsedUserPermissionPayload => {
  const parsed = parseUserPermissionPayload(payload);

  if (!parsed.isImplicitAdmin) {
    return parsed;
  }

  return {
    ...parsed,
    permissions: buildWildcardAdminPermissions(),
  };
};

export const isWildcardAdminPermissionMap = (
  permissionMap: PermissionMap,
): boolean => hasWildcardAdmin(permissionMap);

export const hasPermission = (
  permissionMap: PermissionMap,
  subject: string,
  action: CanonicalAction,
): boolean => {
  if (hasWildcardAdmin(permissionMap)) {
    return true;
  }

  return hasAction(permissionMap.get(subject), action);
};

const hasSubjectPrefixPermission = (
  permissionMap: PermissionMap,
  subjectPrefix: string,
  action: CanonicalAction,
): boolean => {
  if (hasWildcardAdmin(permissionMap)) {
    return true;
  }

  for (const [subject, actions] of permissionMap.entries()) {
    if (!subject.startsWith(subjectPrefix)) {
      continue;
    }

    if (hasAction(actions, action)) {
      return true;
    }
  }

  return false;
};

const isRequirementAuthorized = (
  permissionMap: PermissionMap,
  requirement: RoutePermissionRequirement,
): boolean => {
  if (requirement.subject) {
    return hasPermission(permissionMap, requirement.subject, requirement.action);
  }

  if (requirement.subjectPrefix) {
    return hasSubjectPrefixPermission(
      permissionMap,
      requirement.subjectPrefix,
      requirement.action,
    );
  }

  return false;
};

export const isRoutePolicyAuthorized = (
  permissionMap: PermissionMap,
  policy: RoutePolicy,
): boolean => {
  if (policy.match === "all") {
    return policy.requirements.every((requirement) =>
      isRequirementAuthorized(permissionMap, requirement),
    );
  }

  return policy.requirements.some((requirement) =>
    isRequirementAuthorized(permissionMap, requirement),
  );
};

export const resolveInvoiceSubject = (
  value: string | number | null | undefined,
): string => {
  const normalized = toSafeString(value);

  if (["1", "purchase"].includes(normalized)) {
    return "forms.purchase";
  }

  if (["3", "purchase-return"].includes(normalized)) {
    return "forms.purchase-return";
  }

  if (["4", "sale-return", "sales-return"].includes(normalized)) {
    return "forms.sale-return";
  }

  return "forms.sales";
};

export const resolveVoucherSubject = (
  voucherType: number | string | null | undefined,
): string => {
  const normalized = Number(voucherType);

  if (!Number.isFinite(normalized)) {
    return "forms.adjustment";
  }

  const voucherMap: Record<number, string> = {
    0: "forms.balance",
    1: "forms.cash-receipt",
    2: "forms.payment-receipt",
    3: "forms.adjustment",
    4: "forms.gvoucher4",
    5: "forms.gvoucher5",
    111: "forms.receipt",
    222: "forms.delivery",
  };

  return voucherMap[normalized] || "forms.adjustment";
};

export const resolveRoutePolicy = (
  pathnameWithoutLocale: string,
  searchParams: URLSearchParams,
  method: string,
): RoutePolicy | null => {
  const pathname = pathnameWithoutLocale.trim();

  if (!pathname || pathname === "/") {
    return null;
  }

  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/wa/messages") {
      return {
        match: "all",
        requirements: [
          { subject: "settings.integrations", action: "view" },
        ],
      };
    }

    if (
      pathname === "/api/wa/send-text" ||
      pathname === "/api/wa/send-template" ||
      pathname === "/api/wa/upload-media"
    ) {
      const action: CanonicalAction = method.toUpperCase() === "GET" ? "view" : "create";

      return {
        match: "all",
        requirements: [{ subject: "settings.integrations", action }],
      };
    }

    return null;
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  if (segments.length === 1) {
    const parent = segments[0];

    if (parent === "reports") {
      return {
        match: "any",
        requirements: [
          { subjectPrefix: "reports.", action: "view" },
          { subjectPrefix: "forms.", action: "view" },
        ],
      };
    }

    if (["settings", "basic", "forms"].includes(parent)) {
      return {
        match: "any",
        requirements: [{ subjectPrefix: `${parent}.`, action: "view" }],
      };
    }

    return null;
  }

  const [parent, resource, third] = segments;

  if (resource === "invoices" && (parent === "forms" || parent === "reports")) {
    const type = searchParams.get("type");
    const action =
      parent === "forms"
        ? resolveModeAction(searchParams.get("mode")) ?? "view"
        : "view";

    if (parent === "reports" && !type) {
      return {
        match: "any",
        requirements: [
          { subject: "forms.sales", action: "view" },
          { subject: "forms.purchase", action: "view" },
          { subject: "forms.sale-return", action: "view" },
          { subject: "forms.purchase-return", action: "view" },
        ],
      };
    }

    return {
      match: "all",
      requirements: [{ subject: resolveInvoiceSubject(type), action }],
    };
  }

  if (parent === "reports") {
    return {
      match: "all",
      requirements: [{ subject: `${parent}.${resource}`, action: "view" }],
    };
  }

  if (parent === "settings") {
    return {
      match: "all",
      requirements: [{ subject: `${parent}.${resource}`, action: "view" }],
    };
  }

  const modeAction = resolveModeAction(searchParams.get("mode"));
  let action: CanonicalAction = "view";

  if (modeAction) {
    action = modeAction;
  } else if (segments.length === 2) {
    action = "view";
  } else if (third === "new") {
    action = "create";
  } else {
    action = "update";
  }

  return {
    match: "all",
    requirements: [{ subject: `${parent}.${resource}`, action }],
  };
};

export const fetchUserPermissionMap = async ({
  username,
  companyId,
  token,
}: {
  username: string;
  companyId: string;
  token: string;
}): Promise<PermissionMap> => {
  const normalizedUsername = username.trim();
  const normalizedCompanyId = (companyId || "1").trim();
  const normalizedToken = token.replace(/['"]+/g, "").trim();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!normalizedUsername || !normalizedToken) {
    throw new AuthenticationError("Authentication required");
  }

  if (!baseUrl) {
    throw new AuthorizationError("NEXT_PUBLIC_API_BASE_URL is not defined");
  }

  const fetchUrl = `${baseUrl}/user_object_permissions?username=${normalizedUsername}&com=${normalizedCompanyId}`;

  const response = await fetch(fetchUrl, {
    headers: {
      Authorization: `Bearer ${normalizedToken}`,
      Accept: "application/json",
    },
    cache: "force-cache",
    next: {
      revalidate: 300,
      tags: [`user-permissions-${normalizedUsername}-${normalizedCompanyId}`],
    },
  });

  if (response.status === 401) {
    throw new AuthenticationError("Session expired");
  }

  if (!response.ok) {
    throw new AuthorizationError("Failed to fetch user permissions");
  }

  const json = await response.json();
  const parsedPayload = resolvePermissionsFromPayload(json);

  if (!parsedPayload.hasPermissionsArray) {
    return new Map();
  }

  return buildPermissionMap(parsedPayload.permissions);
};
