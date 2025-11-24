"use client";

import type { BreadcrumbItem } from "@/components/Breadcrumb";

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

import Card from "../../../../../../components/Card";
import {
  findAccountById,
  flattenAccountTree,
  generateAccountId,
  normalizeAccountsTree,
  removeAccountFromTree,
} from "../utils/account-tree";

import accountService from "@/services/api/account.service";
import { revalidateTableData } from "@/app/actions/revalidate.action";
import Breadcrumb from "@/components/Breadcrumb";
import { Account } from "@/types/models/account";
import { Currency } from "@/types/models/currency";

// Simple icon components
const FolderEmoji = ({ className }: { className?: string }) => (
  <span className={className}>📁</span>
);
const DocumentEmoji = ({ className }: { className?: string }) => (
  <span className={className}>📄</span>
);

interface AccountsClientProps {
  initialAccounts: Account[];
  initialCurrencies: Currency[];
}

const ACCOUNT_TYPE_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "جميع الحسابات" },
  { key: "main", label: "الحسابات الرئيسية" },
  { key: "sub", label: "الحسابات الفرعية" },
];

const ACCOUNT_REPORT_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "كل أنواع التقارير" },
  { key: "pl", label: "الأرباح والخسائر" },
  { key: "balance", label: "الميزانية العمومية" },
];

const CONTENT_HEIGHT_CLASS = "min-h-[500px] h-[calc(100vh-280px)]";

export default function AccountsClient({
  initialAccounts,
  initialCurrencies,
}: AccountsClientProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>(
    normalizeAccountsTree(initialAccounts),
  );
  const [currencies, setCurrencies] = useState<Currency[]>(initialCurrencies);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterReport, setFilterReport] = useState<string>("all");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [displayAccounts, setDisplayAccounts] = useState<Account[]>(
    normalizeAccountsTree(initialAccounts),
  );
  const [searchResultsCount, setSearchResultsCount] = useState(0);

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

  // Build account tree on mount
  useEffect(() => {
    if (initialAccounts.length > 0) {
      const normalized = normalizeAccountsTree(initialAccounts);

      setAccounts(normalized);
      setDisplayAccounts(normalized);
    }
  }, [initialAccounts]);

  const fetchAccounts = async () => {
    try {
      const rootRequestPayload = {
        id: 0,
        acc_id: "0",
        acc_code: "0",
        acc_name: "0",
        acc_name_e: null as string | null,
        parent: null,
        acc_level: 1,
      };

      const allAccountsData = await accountService.getAccountsTree(
        rootRequestPayload,
        undefined,
        true,
      );

      if (!allAccountsData || !Array.isArray(allAccountsData)) {
        toast.error("فشل في تحميل الحسابات");

        return;
      }

      const accountsWithChildren = normalizeAccountsTree(allAccountsData);

      setAccounts(accountsWithChildren);
      setDisplayAccounts(accountsWithChildren);

      // الحسابات الرئيسية مقفلة افتراضياً
      setExpandedNodes(new Set());
    } catch (error) {
      toast.error("فشل في تحميل الحسابات");
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
        toast.error("لا يمكن إضافة حسابات جديدة تحت المستوى الخامس.");

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
        toast.error("لا يمكن إضافة أكثر من 9 حسابات في هذا المستوى.");

        return;
      }
    }

    const suggestedAccountId = generateAccountId(accounts, parentId);

    if (parentId && !suggestedAccountId) {
      toast.error("تعذر توليد رقم الحساب الجديد لهذا الحساب الأب.");

      return;
    }

    const searchParams = new URLSearchParams();

    if (parentId) {
      searchParams.set("parentId", String(parentId));
    }

    if (suggestedAccountId) {
      searchParams.set("suggestedAccId", suggestedAccountId);
    }

    router.push(
      searchParams.toString()
        ? `/basic/accounts/new?${searchParams.toString()}`
        : "/basic/accounts/new",
    );
  };

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    router.push(`/basic/accounts/${account.id}?mode=edit`);
  };

  const handleViewAccount = (account: Account) => {
    setSelectedAccount(account);
    router.push(`/basic/accounts/${account.id}`);
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm("هل أنت متأكد أنك تريد حذف هذا الحساب؟")) return;

    // Optimistic delete: remove from UI immediately
    const previousAccounts = [...accounts];

    // Remove account from tree optimistically
    const updatedAccounts = removeAccountFromTree(accounts, accountId);

    setAccounts(updatedAccounts);

    try {
      const result = await accountService.deleteAccount(accountId);

      if (!result) {
        // Rollback on failure
        setAccounts(previousAccounts);
        toast.error("حدث خطأ أثناء حذف الحساب");

        return;
      }

      toast.success("تم حذف الحساب بنجاح");

      // Revalidate cache
      await revalidateTableData("accounts_list");

      // Fetch fresh data from server
      fetchAccounts();
    } catch (error) {
      // Rollback on error
      setAccounts(previousAccounts);
      toast.error("خطأ في الاتصال بالخادم. تحقق من الرابط أو الإعدادات.");
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

      // التحقق من تطابق البحث
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
              ${level > 0 ? "mr-" + level * 4 : ""}
            `}
            onClick={() => {
              setSelectedAccount(account);
              // إذا كان الحساب يحتوي على حسابات فرعية، قم بتبديل حالة التوسعة
              if (hasChildren) {
                toggleNode(account.id);
              }
            }}
          >
            {hasChildren ? (
              <FolderEmoji className="w-4 h-4 text-blue-500" />
            ) : (
              <DocumentEmoji className="w-4 h-4 text-gray-500" />
            )}

            <div className="flex-1 min-w-0 text-right">
              <div className="font-medium text-gray-900 truncate">
                {account.acc_name}
              </div>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="mr-4 border-r border-gray-200">
              {renderAccountTree(account.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // دالة لجلب الحسابات الفرعية المباشرة فقط (المستوى التالي)
  const getDirectSubAccounts = (account: Account): Account[] => {
    if (account.children && account.children.length > 0) {
      return account.children;
    }

    return [account];
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
          <Button
            className="bg-gray-100 hover:bg-gray-200 border-gray-300"
            startContent={<PlusIcon className="h-4 w-4" />}
            variant="bordered"
            onPress={handleAddAccount}
          >
            إضافة حساب
          </Button>

          <div className="h-8 w-px bg-gray-300" />

          <div className="flex flex-wrap items-center gap-2 flex-1">
            <Select
              aria-label="تصفية حسب نوع الحساب"
              className="input-field flex-1 min-w-[140px]"
              placeholder="نوع الحساب"
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

            <Select
              aria-label="تصفية حسب نوع التقرير"
              className="input-field flex-1 min-w-[160px]"
              placeholder="نوع التقرير"
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

            <Button
              isIconOnly
              className="h-10"
              title="مسح الفلاتر"
              variant="bordered"
              onPress={clearFilters}
            >
              <FunnelIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-8 w-px bg-gray-300" />

          <div className="w-48">
            <Input
              aria-label="بحث في الحسابات"
              className="w-full"
              placeholder="بحث بالاسم..."
              startContent={
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="responsive-grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Tree Panel */}
          <div className="lg:col-span-1">
            <Card className={CONTENT_HEIGHT_CLASS}>
              <CardBody className="p-2">
                {/* Tree View */}
                <div className="overflow-y-auto max-h-[calc(100vh-320px)] text-right">
                  {searchTerm.trim().length > 0 && (
                    <div className="text-xs text-gray-500 mb-2 text-center">
                      {searchResultsCount > 0
                        ? `تم العثور على ${searchResultsCount} نتيجة`
                        : "لا توجد حسابات تطابق البحث"}
                    </div>
                  )}
                  {displayAccounts.length > 0 ? (
                    renderAccountTree(displayAccounts)
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <FolderEmoji className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">
                        {searchTerm.trim().length > 0
                          ? "لا توجد حسابات تطابق البحث"
                          : "لا توجد حسابات"}
                      </p>
                      {searchTerm.trim().length === 0 && (
                        <Button
                          className="mt-2"
                          color="primary"
                          size="sm"
                          variant="flat"
                          onClick={handleAddAccount}
                        >
                          إضافة أول حساب
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-2">
            <Card className={CONTENT_HEIGHT_CLASS}>
              <CardBody className="p-2">
                <div className="responsive-filters mb-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-gray-900 text-right">
                      {selectedAccount
                        ? `حسابات ${selectedAccount.acc_name}`
                        : "تفاصيل الحسابات"}
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
                  <div className="space-y-2">
                    {/* معلومات الحساب المختار */}
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-1 text-sm text-right">
                        معلومات الحساب المختار
                      </h3>
                      <div className="responsive-grid accounts-info-grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="text-right">
                          <span className="text-gray-600">رقم الحساب:</span>
                          <div className="font-medium">
                            {selectedAccount.acc_id}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600">اسم الحساب:</span>
                          <div className="font-medium">
                            {selectedAccount.acc_name}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600">نوع الحساب:</span>
                          <div className="font-medium">
                            {selectedAccount.acc_type === 1 ? "رئيسي" : "فرعي"}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600">العملة:</span>
                          <div className="font-medium">
                            {currencies.find(
                              (c) => c.id === selectedAccount.cur,
                            )?.cur_name || "غير محددة"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* جدول الحسابات الفرعية */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm text-right">
                        الحسابات الفرعية المباشرة
                      </h3>
                      <div className="responsive-table accounts-table-container overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 accounts-table">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-gray-300 px-2 py-1 text-right text-xs font-medium text-gray-700">
                                رقم الحساب
                              </th>
                              <th className="border border-gray-300 px-2 py-1 text-right text-xs font-medium text-gray-700">
                                اسم الحساب
                              </th>
                              <th className="border border-gray-300 px-2 py-1 text-right text-xs font-medium text-gray-700">
                                نوع الحساب
                              </th>
                              <th className="border border-gray-300 px-2 py-1 text-right text-xs font-medium text-gray-700">
                                نوع التقرير
                              </th>
                              <th className="border border-gray-300 px-2 py-1 text-right text-xs font-medium text-gray-700">
                                العملة
                              </th>
                              <th className="border border-gray-300 px-2 py-1 text-right text-xs font-medium text-gray-700">
                                الإجراءات
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {getDirectSubAccounts(selectedAccount)
                              .filter(
                                (account) => account.id !== selectedAccount.id,
                              )
                              .map((account) => (
                                <tr
                                  key={account.id}
                                  className="hover:bg-gray-50 cursor-pointer"
                                  title="انقر مزدوج للانتقال إلى المستوى التالي"
                                  onDoubleClick={() =>
                                    setSelectedAccount(account)
                                  }
                                >
                                  <td className="border border-gray-300 px-2 py-1 text-xs text-right">
                                    {account.acc_id}
                                  </td>
                                  <td className="border border-gray-300 px-2 py-1 text-xs font-medium text-right">
                                    {account.acc_name}
                                  </td>
                                  <td className="border border-gray-300 px-2 py-1 text-xs text-right">
                                    {account.acc_type === 1 ? "رئيسي" : "فرعي"}
                                  </td>
                                  <td className="border border-gray-300 px-2 py-1 text-xs text-right">
                                    {account.acc_rep === 1
                                      ? "الأرباح والخسائر"
                                      : "الميزانية العمومية"}
                                  </td>
                                  <td className="border border-gray-300 px-2 py-1 text-xs text-right">
                                    {currencies.find(
                                      (c) => c.id === account.cur,
                                    )?.cur_name || "غير محددة"}
                                  </td>
                                  <td className="border border-gray-300 px-2 py-1 text-xs">
                                    <div className="flex items-center justify-center gap-2">
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        title="عرض"
                                        variant="light"
                                        onPress={() => {
                                          handleViewAccount(account);
                                        }}
                                      >
                                        <EyeIcon className="h-4 w-4 text-blue-500" />
                                      </Button>
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        title="تعديل"
                                        variant="light"
                                        onPress={() => {
                                          handleEditAccount(account);
                                        }}
                                      >
                                        <PencilIcon className="h-4 w-4 text-yellow-500" />
                                      </Button>
                                      <Button
                                        isIconOnly
                                        color="danger"
                                        size="sm"
                                        title="حذف"
                                        variant="light"
                                        onPress={() => {
                                          handleDeleteAccount(account.id);
                                        }}
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            <tr>
                              <td className="border border-gray-300 px-2 py-1 text-xs text-right">
                                {selectedAccount.acc_id}
                              </td>
                              <td className="border border-gray-300 px-2 py-1 text-xs font-medium text-right">
                                {selectedAccount.acc_name}
                              </td>
                              <td className="border border-gray-300 px-2 py-1 text-xs text-right">
                                {selectedAccount.acc_type === 1
                                  ? "رئيسي"
                                  : "فرعي"}
                              </td>
                              <td className="border border-gray-300 px-2 py-1 text-xs text-right">
                                {selectedAccount.acc_rep === 1
                                  ? "الأرباح والخسائر"
                                  : "الميزانية العمومية"}
                              </td>
                              <td className="border border-gray-300 px-2 py-1 text-xs text-right">
                                {currencies.find(
                                  (c) => c.id === selectedAccount.cur,
                                )?.cur_name || "غير محددة"}
                              </td>
                              <td className="border border-gray-300 px-2 py-1 text-xs">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    title="عرض"
                                    variant="light"
                                    onPress={() => {
                                      handleViewAccount(selectedAccount);
                                    }}
                                  >
                                    <EyeIcon className="h-4 w-4 text-blue-500" />
                                  </Button>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    title="تعديل"
                                    variant="light"
                                    onPress={() => {
                                      handleEditAccount(selectedAccount);
                                    }}
                                  >
                                    <PencilIcon className="h-4 w-4 text-yellow-500" />
                                  </Button>
                                  <Button
                                    isIconOnly
                                    color="danger"
                                    size="sm"
                                    title="حذف"
                                    variant="light"
                                    onPress={() => {
                                      handleDeleteAccount(selectedAccount.id);
                                    }}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    <DocumentEmoji className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-right">
                      اختر حساباً لعرض تفاصيله والحسابات الفرعية
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
