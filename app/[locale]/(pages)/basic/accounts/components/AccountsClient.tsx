"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, CardBody, Input, Select, SelectItem } from "@heroui/react";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";

import {
  findAccountById,
  flattenAccountTree,
  generateAccountId,
  normalizeAccountsTree,
  removeAccountFromTree,
  ROOT_ACCOUNT_REQUEST_PAYLOAD,
} from "../utils/account-tree";

import Card from "@/components/Card";
import { getLocaleDir } from "@/i18n/config";
import accountService from "@/services/api/account.service";
import { revalidateTableData } from "@/app/actions/revalidate.action";
import Breadcrumb, { BreadcrumbItem } from "@/components/Breadcrumb";
import { Account } from "@/types/models/account";
import { Currency } from "@/types/models/currency";
import { Can } from "@/components/providers/AbilityProvider";
import { usePermissionStore } from "@/stores/permissionStore";

// Simple icon components
const FolderEmoji = ({ className }: { className?: string }) => (
  <span className={className}>📁</span>
);
const DocumentEmoji = ({ className }: { className?: string }) => (
  <span className={className}>📄</span>
);

type TranslateFn = (...args: any[]) => string;

const formatAccountType = (account: Account, t: TranslateFn): string =>
  account.acc_type === 1 ? t("types.main") : t("types.sub");

const formatReportType = (account: Account, t: TranslateFn): string =>
  account.acc_rep === 1
    ? t("reportTypes.profitLoss")
    : t("reportTypes.balanceSheet");

const formatCurrencyName = (
  currencies: Currency[],
  currencyId: number | string | null | undefined,
  t: TranslateFn,
): string => {
  if (currencyId === null || currencyId === undefined) {
    return t("states.currencyNotSet");
  }

  const normalizedId = Number(currencyId);

  if (!Number.isFinite(normalizedId)) {
    return t("states.currencyNotSet");
  }

  const matchedCurrency = currencies.find((currency) => {
    const currencyIdValue = Number(currency.id);

    if (!Number.isFinite(currencyIdValue)) {
      return false;
    }

    return currencyIdValue === normalizedId;
  });

  if (!matchedCurrency) {
    return t("states.currencyNotSet");
  }

  return matchedCurrency.cur_name || t("states.currencyNotSet");
};

interface AccountTableRowProps {
  account: Account;
  currencies: Currency[];
  t: TranslateFn;
  textAlign: string;
  onView: (account: Account) => void;
  onEdit: (account: Account) => void;
  onDelete: (accountId: number) => void;
  onDoubleClick?: (account: Account) => void;
  rowTitle?: string;
}

const AccountTableRow = ({
  account,
  currencies,
  t,
  textAlign,
  onView,
  onEdit,
  onDelete,
  onDoubleClick,
  rowTitle,
}: AccountTableRowProps) => {
  const hasChildren =
    account.children !== undefined && (account.children?.length ?? 0) > 0;

  return (
  <tr
    className={onDoubleClick ? "hover:bg-gray-50 cursor-pointer" : ""}
    title={rowTitle}
    onDoubleClick={
      onDoubleClick
        ? () => {
            onDoubleClick(account);
          }
        : undefined
    }
  >
    <td
      className={`border border-gray-300 px-2 py-1 text-xs ${textAlign}`}
    >
      {account.acc_id}
    </td>
    <td
      className={`border border-gray-300 px-2 py-1 text-xs font-medium ${textAlign}`}
    >
      {account.acc_name}
    </td>
    <td
      className={`border border-gray-300 px-2 py-1 text-xs ${textAlign}`}
    >
      {formatAccountType(account, t)}
    </td>
    <td
      className={`border border-gray-300 px-2 py-1 text-xs ${textAlign}`}
    >
      {account.acc_level}
    </td>
    <td
      className={`border border-gray-300 px-2 py-1 text-xs ${textAlign}`}
    >
      {formatReportType(account, t)}
    </td>
    <td
      className={`border border-gray-300 px-2 py-1 text-xs ${textAlign}`}
    >
      {formatCurrencyName(currencies, account.cur ?? null, t)}
    </td>
    <td className="border border-gray-300 px-2 py-1 text-xs">
      <div className="flex items-center justify-center gap-2">
        <Button
          isIconOnly
          size="sm"
          title={t("labels.view")}
          variant="light"
          onPress={() => {
            onView(account);
          }}
        >
          <EyeIcon className="h-4 w-4 text-blue-500" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          title={t("labels.edit")}
          variant="light"
          onPress={() => {
            onEdit(account);
          }}
        >
          <PencilIcon className="h-4 w-4 text-yellow-500" />
        </Button>
        <Button
          isIconOnly
          color="danger"
          size="sm"
          title={t("labels.delete")}
          variant="light"
          isDisabled={hasChildren}
          onPress={() => {
            if (!hasChildren) onDelete(account.id);
          }}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    </td>
  </tr>
  );
};

interface AccountsClientProps {
  initialAccounts: Account[];
  initialCurrencies: Currency[];
  /** معرّفات العقد المفتوحة في الشجرة (من رابط الرجوع للقائمة) */
  initialExpandedIds?: number[];
  /** معرّف الحساب المختار (من رابط الرجوع للقائمة) */
  initialSelectedId?: number;
}

const CONTENT_HEIGHT_CLASS = "min-h-0 flex-1 flex flex-col";

export default function AccountsClient({
  initialAccounts,
  initialCurrencies,
  initialExpandedIds,
  initialSelectedId,
}: AccountsClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("basic.accounts");

  const ability = usePermissionStore((state) => state.ability);
  const hasActionPermission =
    ability.can("view", "basic.accounts") ||
    ability.can("update", "basic.accounts") ||
    ability.can("delete", "basic.accounts");

  // Dynamic text alignment classes based on locale
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const textAlignCenter = "text-center";

  // Helper function to get margin class based on level and direction
  const getMarginClass = (level: number) => {
    if (level === 0) return "";
    const marginValue = level * 4;

    if (dir === "rtl") {
      const classes: Record<number, string> = {
        4: "mr-4",
        8: "mr-8",
        12: "mr-12",
        16: "mr-16",
        20: "mr-20",
      };

      return classes[marginValue] || "";
    } else {
      const classes: Record<number, string> = {
        4: "ml-4",
        8: "ml-8",
        12: "ml-12",
        16: "ml-16",
        20: "ml-20",
      };

      return classes[marginValue] || "";
    }
  };

  const ACCOUNT_TYPE_FILTERS = useMemo(
    () => [
      { key: "all", label: t("filters.type.all") },
      { key: "main", label: t("filters.type.main") },
      { key: "sub", label: t("filters.type.sub") },
    ],
    [t],
  );

  const ACCOUNT_REPORT_FILTERS = useMemo(
    () => [
      { key: "all", label: t("filters.report.all") },
      { key: "pl", label: t("filters.report.pl") },
      { key: "balance", label: t("filters.report.balance") },
    ],
    [t],
  );
  const [accounts, setAccounts] = useState<Account[]>(
    normalizeAccountsTree(initialAccounts),
  );
  const [currencies] = useState<Currency[]>(initialCurrencies);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(() =>
    initialExpandedIds?.length ? new Set(initialExpandedIds) : new Set(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterReport, setFilterReport] = useState<string>("all");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [displayAccounts, setDisplayAccounts] = useState<Account[]>(
    normalizeAccountsTree(initialAccounts),
  );
  const [searchResultsCount, setSearchResultsCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure Select components only render on client to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const accountBreadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    if (!selectedAccount) {
      return [];
    }

    const accountPath: Account[] = [];
    let current: Account | undefined = selectedAccount;

    const accountLookup = new Map(
      flattenAccountTree(accounts).map((acc) => [acc.id, acc] as const),
    );

    while (current) {
      accountPath.unshift(current);

      if (!current.parent) {
        break;
      }

      const parentAccount = accountLookup.get(current.parent);

      if (!parentAccount || parentAccount.id === current.id) {
        break;
      }

      current = parentAccount;
    }

    return accountPath.map((acc, index) => {
      const isLast = index === accountPath.length - 1;

      const item: BreadcrumbItem = {
        name: acc.acc_name,
      };

      if (!isLast) {
        item.onClick = () => setSelectedAccount(acc);
      }

      return item;
    });
  }, [accounts, selectedAccount]);

  useEffect(() => {
    if (initialAccounts.length > 0) {
      const normalized = normalizeAccountsTree(initialAccounts);

      setAccounts(normalized);
      setDisplayAccounts(normalized);
    }
  }, [initialAccounts]);

  useEffect(() => {
    if (
      initialSelectedId != null &&
      initialSelectedId > 0 &&
      accounts.length > 0
    ) {
      const account = findAccountById(accounts, initialSelectedId);

      if (account) {
        setSelectedAccount(account);
      }
    }
  }, [initialSelectedId, accounts]);

  const fetchAccounts = async () => {
    try {
      const allAccountsData = await accountService.getAccountsTree(
        ROOT_ACCOUNT_REQUEST_PAYLOAD,
        undefined,
        true,
      );

      if (!allAccountsData || !Array.isArray(allAccountsData)) {
        toast.error(t("messages.loadError"));

        return;
      }

      const accountsWithChildren = normalizeAccountsTree(allAccountsData);

      setAccounts(accountsWithChildren);
      setDisplayAccounts(accountsWithChildren);
    } catch {
      toast.error(t("messages.loadError"));
    }
  };

  const toggleNode = (accountId: number) => {
    const newExpanded = new Set(expandedNodes);

    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleAddAccount = () => {
    const parentId = selectedAccount?.id ?? null;

    if (parentId) {
      const parentAccount = findAccountById(accounts, parentId);

      if (parentAccount && parentAccount.acc_level >= 5) {
        toast.error(t("messages.maxLevelError"));

        return;
      }

      const flatAccounts = flattenAccountTree(accounts);
      const siblings = flatAccounts.filter(
        (account) => account.parent === parentId,
      );

      if (
        parentAccount &&
        parentAccount.acc_level < 5 &&
        siblings.length >= 9
      ) {
        toast.error(t("messages.maxSiblingsError"));

        return;
      }
    }

    const suggestedAccountId = generateAccountId(accounts, parentId);

    if (parentId && !suggestedAccountId) {
      toast.error(t("messages.generateIdError"));

      return;
    }

    const searchParams = new URLSearchParams();

    if (parentId) {
      searchParams.set("parentId", String(parentId));
    }

    if (suggestedAccountId) {
      searchParams.set("suggestedAccId", suggestedAccountId);
    }

    if (expandedNodes.size > 0) {
      searchParams.set("expanded", Array.from(expandedNodes).join(","));
    }

    if (selectedAccount?.id) {
      searchParams.set("selected", String(selectedAccount.id));
    }

    router.push(
      searchParams.toString()
        ? `/basic/accounts/new?${searchParams.toString()}`
        : "/basic/accounts/new",
    );
  };

  const handleEditAccount = (account: Account) => {
    const params = new URLSearchParams();

    if (expandedNodes.size > 0) {
      params.set("expanded", Array.from(expandedNodes).join(","));
    }

    if (selectedAccount?.id) {
      params.set("selected", String(selectedAccount.id));
    }

    router.push(
      `/basic/accounts/${account.id}?mode=edit&${params.toString()}`,
    );
  };

  const handleViewAccount = (account: Account) => {
    const params = new URLSearchParams();

    if (expandedNodes.size > 0) {
      params.set("expanded", Array.from(expandedNodes).join(","));
    }

    if (selectedAccount?.id) {
      params.set("selected", String(selectedAccount.id));
    }

    router.push(`/basic/accounts/${account.id}?${params.toString()}`);
  };

  const handleDeleteAccount = async (accountId: number) => {
    const account = findAccountById(accounts, accountId);
    const hasChildren =
      account?.children && account.children.length > 0;

    if (hasChildren) {
      toast.error(t("messages.deleteError"));

      return;
    }

    if (!confirm(t("messages.deleteConfirm"))) return;

    const previousAccounts = [...accounts];
    const updatedAccounts = removeAccountFromTree(accounts, accountId);

    setAccounts(updatedAccounts);

    try {
      const result = await accountService.deleteAccount(accountId);

      if (!result) {
        setAccounts(previousAccounts);
        toast.error(t("messages.deleteError"));

        return;
      }

      toast.success(t("messages.deleteSuccess"));
      await revalidateTableData("accounts_list");
      fetchAccounts();
    } catch {
      setAccounts(previousAccounts);
      toast.error(t("messages.serverError"));
    }
  };

  const clearFilters = () => {
    setFilterType("all");
    setFilterReport("all");
    setSearchTerm("");
    setExpandedNodes(new Set());
  };

  const renderAccountTree = (accounts: Account[], level: number = 0) => {
    return accounts.map((account) => {
      const hasChildren = account.children && account.children.length > 0;
      const isExpanded = expandedNodes.has(account.id);
      const isSelected = selectedAccount?.id === account.id;

      const matchesSearch =
        searchTerm &&
        (account.acc_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.acc_id.toLowerCase().includes(searchTerm.toLowerCase()));

      return (
        <div key={account.id} className="w-full">
          <div
            className={`
              flex items-center gap-2 p-1.5 text-xs rounded-lg cursor-pointer transition-all duration-200
              ${isSelected ? "bg-blue-50 border border-blue-200" : ""}
              ${matchesSearch ? "bg-yellow-100 border border-yellow-300" : ""}
              ${!isSelected && !matchesSearch ? "hover:bg-gray-50" : ""}
              ${getMarginClass(level)}
            `}
            role="button"
            tabIndex={0}
            onClick={() => {
              setSelectedAccount(account);
              // إذا كان الحساب يحتوي على حسابات فرعية، قم بتبديل حالة التوسعة
              if (hasChildren) {
                toggleNode(account.id);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedAccount(account);
                if (hasChildren) {
                  toggleNode(account.id);
                }
              }
            }}
          >
            {hasChildren ? (
              <FolderEmoji className="w-4 h-4 text-blue-500" />
            ) : (
              <DocumentEmoji className="w-4 h-4 text-gray-500" />
            )}

            <div className={`flex-1 min-w-0 ${textAlign}`}>
              <div className="font-medium text-gray-900 truncate">
                {account.acc_name}
              </div>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div
              className={`${dir === "rtl" ? "mr-4 border-r" : "ml-4 border-l"} border-gray-200`}
            >
              {renderAccountTree(account.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const getDirectSubAccounts = (account: Account | null): Account[] => {
    if (!account) return [];

    const nodeInTree = findAccountById(accounts, account.id);
    const target = nodeInTree ?? account;

    if (target.children && target.children.length > 0) {
      return target.children;
    }

    return [target];
  };

  useEffect(() => {
    const applyTypeFilter = (account: Account) => {
      if (filterType === "main") return account.acc_type === 1;
      if (filterType === "sub") return account.acc_type === 2;

      return true;
    };

    const applyReportFilter = (account: Account) => {
      if (filterReport === "pl") return account.acc_rep === 1;
      if (filterReport === "balance") return account.acc_rep === 2;

      return true;
    };

    const allAccounts = flattenAccountTree(accounts);
    const parentMap = new Map<number, number | null>();

    allAccounts.forEach((account) => {
      parentMap.set(account.id, account.parent ?? null);
    });

    const trimmedSearch = searchTerm.trim().toLowerCase();
    const matchingIds = new Set<number>();

    const matchesFilters = (account: Account) =>
      applyTypeFilter(account) && applyReportFilter(account);

    allAccounts.forEach((account) => {
      if (!matchesFilters(account)) {
        return;
      }

      if (trimmedSearch.length === 0) {
        matchingIds.add(account.id);
      } else {
        const matchesSearch =
          (account.acc_name || "").toLowerCase().includes(trimmedSearch) ||
          (account.acc_id || "").toLowerCase().includes(trimmedSearch);

        if (!matchesSearch) {
          return;
        }

        matchingIds.add(account.id);
      }

      let ancestorId = parentMap.get(account.id);

      while (ancestorId) {
        matchingIds.add(ancestorId);
        ancestorId = parentMap.get(ancestorId) ?? null;
      }
    });

    const rebuildTree = (nodes: Account[]): Account[] =>
      nodes
        .map((node) => {
          const childTree = node.children ? rebuildTree(node.children) : [];
          const includeSelf = matchingIds.has(node.id);

          if (!includeSelf && childTree.length === 0) {
            return null;
          }

          return {
            ...node,
            children: childTree,
          };
        })
        .filter(Boolean) as Account[];

    const filteredTree =
      trimmedSearch.length === 0 && matchingIds.size === 0
        ? accounts
        : rebuildTree(accounts);

    setDisplayAccounts(filteredTree);
    setSearchResultsCount(trimmedSearch.length > 0 ? matchingIds.size : 0);

    if (
      selectedAccount &&
      !matchingIds.has(selectedAccount.id) &&
      trimmedSearch.length > 0
    ) {
      setSelectedAccount(null);
    }

    if (trimmedSearch.length > 0 && matchingIds.size > 0) {
      setExpandedNodes((prev) => {
        const merged = new Set(prev);

        matchingIds.forEach((id) => {
          const parentId = parentMap.get(id);

          if (parentId) {
            merged.add(parentId);
          }
        });

        return merged;
      });
    }
  }, [accounts, searchTerm, filterType, filterReport, selectedAccount]);

  return (
    <div className="accounts-container bg-gray-50">
      <div className="max-w-7xl mx-auto pb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <Can I="create" a="basic.accounts">
            <Button
              className="bg-gray-100 hover:bg-gray-200 border-gray-300"
              startContent={<PlusIcon className="h-4 w-4" />}
              variant="bordered"
              onPress={handleAddAccount}
            >
              {t("labels.addAccount")}
            </Button>
          </Can>

          <div className="h-8 w-px bg-gray-300" />

          <div className="flex flex-wrap items-center gap-2 flex-1">
            {isMounted ? (
              <Select
                aria-label={t("labels.filterByAccountType")}
                className="input-field flex-1 min-w-[140px]"
                placeholder={t("placeholders.accountType")}
                selectedKeys={[filterType]}
                size="sm"
                variant="bordered"
                onSelectionChange={(keys) =>
                  setFilterType(Array.from(keys)[0] as string)
                }
              >
                {ACCOUNT_TYPE_FILTERS.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>
            ) : (
              <div className="input-field flex-1 min-w-[140px] h-10 bg-gray-100 rounded-lg animate-pulse" />
            )}

            {isMounted ? (
              <Select
                aria-label={t("labels.filterByReportType")}
                className="input-field flex-1 min-w-[160px]"
                placeholder={t("placeholders.reportType")}
                selectedKeys={[filterReport]}
                size="sm"
                variant="bordered"
                onSelectionChange={(keys) =>
                  setFilterReport(Array.from(keys)[0] as string)
                }
              >
                {ACCOUNT_REPORT_FILTERS.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>
            ) : (
              <div className="input-field flex-1 min-w-[160px] h-10 bg-gray-100 rounded-lg animate-pulse" />
            )}

            <Button
              isIconOnly
              className="h-10"
              title={t("labels.clearFilters")}
              variant="bordered"
              onPress={clearFilters}
            >
              <FunnelIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-8 w-px bg-gray-300" />

          <div className="w-48">
            <Input
              aria-label={t("labels.searchAccounts")}
              className="w-full"
              placeholder={t("placeholders.searchByName")}
              startContent={
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="responsive-grid grid-cols-1 lg:grid-cols-3 gap-2 flex-1 min-h-0 content-start">
          <div className="lg:col-span-1 min-h-0 flex flex-col">
            <Card className={CONTENT_HEIGHT_CLASS}>
              <CardBody className="p-2 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div
                  className={`overflow-y-auto flex-1 min-h-0 ${textAlign}`}
                >
                  {searchTerm.trim().length > 0 && (
                    <div
                      className={`text-xs text-gray-500 mb-2 ${textAlignCenter}`}
                    >
                      {searchResultsCount > 0
                        ? t("states.foundResults", {
                            count: searchResultsCount,
                          })
                        : t("states.noMatchingAccounts")}
                    </div>
                  )}
                  {displayAccounts.length > 0 ? (
                    renderAccountTree(displayAccounts)
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <FolderEmoji className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">
                        {searchTerm.trim().length > 0
                          ? t("states.noMatchingAccounts")
                          : t("states.noAccounts")}
                      </p>
                      {searchTerm.trim().length === 0 && (
                        <Button
                          className="mt-2"
                          color="primary"
                          size="sm"
                          variant="flat"
                          onClick={handleAddAccount}
                        >
                          {t("labels.addFirstAccount")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="lg:col-span-2 min-h-0 flex flex-col">
            <Card className={CONTENT_HEIGHT_CLASS}>
              <CardBody className="p-2 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="responsive-filters mb-2 shrink-0">
                  <div className="flex items-center gap-3">
                    <h2
                      className={`text-base font-semibold text-gray-900 ${textAlign}`}
                    >
                      {selectedAccount
                        ? t("sections.selectedAccountSubAccounts", {
                            name: selectedAccount.acc_name,
                          })
                        : t("sections.accountDetails")}
                    </h2>
                  </div>
                  {selectedAccount && (
                    <div className="mt-1">
                      <Breadcrumb
                        className="mb-1"
                        items={accountBreadcrumbItems}
                        showHome={false}
                      />
                    </div>
                  )}
                </div>

                {selectedAccount ? (
                  <div className="space-y-1.5 flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                      <h3
                        className={`font-semibold text-blue-900 mb-1 text-xs ${textAlign}`}
                      >
                        {t("sections.selectedAccountInfo")}
                      </h3>
                      <div className="responsive-grid accounts-info-grid grid-cols-2 md:grid-cols-4 gap-1.5 text-xs">
                        <div className={textAlign}>
                          <span className="text-gray-600">
                            {t("fields.accountNumber")}:
                          </span>
                          <div className="font-medium">
                            {selectedAccount.acc_id}
                          </div>
                        </div>
                        <div className={textAlign}>
                          <span className="text-gray-600">
                            {t("fields.accountName")}:
                          </span>
                          <div className="font-medium">
                            {selectedAccount.acc_name}
                          </div>
                        </div>
                        <div className={textAlign}>
                          <span className="text-gray-600">
                            {t("fields.accountType")}:
                          </span>
                          <div className="font-medium">
                            {formatAccountType(selectedAccount, t)}
                          </div>
                        </div>
                        <div className={textAlign}>
                          <span className="text-gray-600">
                            {t("form.accountLevel")}:
                          </span>
                          <div className="font-medium">
                            {selectedAccount.acc_level}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                      <h3
                        className={`font-semibold text-gray-900 mb-2 text-sm ${textAlign}`}
                      >
                        {t("sections.directSubAccounts")}
                      </h3>
                      <div className="responsive-table accounts-table-container overflow-auto flex-1 min-h-0">
                        <table className="w-full border-collapse border border-gray-300 accounts-table">
                          <thead className="bg-gray-100">
                            <tr>
                              <th
                                className={`border border-gray-300 px-2 py-1 ${textAlign} text-xs font-medium text-gray-700`}
                              >
                                {t("fields.accountNumber")}
                              </th>
                              <th
                                className={`border border-gray-300 px-2 py-1 ${textAlign} text-xs font-medium text-gray-700`}
                              >
                                {t("fields.accountName")}
                              </th>
                              <th
                                className={`border border-gray-300 px-2 py-1 ${textAlign} text-xs font-medium text-gray-700`}
                              >
                                {t("fields.accountType")}
                              </th>
                              <th
                                className={`border border-gray-300 px-2 py-1 ${textAlign} text-xs font-medium text-gray-700`}
                              >
                                {t("form.accountLevel")}
                              </th>
                              <th
                                className={`border border-gray-300 px-2 py-1 ${textAlign} text-xs font-medium text-gray-700`}
                              >
                                {t("fields.reportType")}
                              </th>
                              <th
                                className={`border border-gray-300 px-2 py-1 ${textAlign} text-xs font-medium text-gray-700`}
                              >
                                {t("fields.currency")}
                              </th>
                              {hasActionPermission && (
                                <th
                                  className={`border border-gray-300 px-2 py-1 ${textAlign} text-xs font-medium text-gray-700`}
                                >
                                  {t("fields.actions")}
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {getDirectSubAccounts(selectedAccount)
                              .filter(
                                (account) =>
                                  selectedAccount &&
                                  account.id !== selectedAccount.id,
                              )
                              .map((account) => (
                                <AccountTableRow
                                  key={account.id}
                                  account={account}
                                  currencies={currencies}
                                  t={t}
                                  textAlign={textAlign}
                                  onView={handleViewAccount}
                                  onEdit={handleEditAccount}
                                  onDelete={handleDeleteAccount}
                                  onDoubleClick={setSelectedAccount}
                                  rowTitle={t("tooltips.doubleClickToNavigate")}
                                />
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    <DocumentEmoji className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className={`text-sm ${textAlign}`}>
                      {t("states.selectAccountToView")}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
