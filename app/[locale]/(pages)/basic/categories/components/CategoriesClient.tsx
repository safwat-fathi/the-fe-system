"use client";

import type { Account } from "@/types/models/account";
import type {
  CategoryAccount,
  UpsertCategoryAccountPayload,
} from "@/types/models/category-account";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Checkbox,
  Input,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import {
  EyeIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";

import { getLocaleDir } from "@/i18n/config";
import {
  getCategoryAccountsAction,
  ensureCategoryAccountAction,
  saveCategoryAccountAction,
} from "@/app/actions/category-accounts.action";
import { ConfirmationModal } from "@/components/Modal";
import categoryService from "@/services/api/category.service";

const ACCOUNT_KEYS = [
  "buy_acc",
  "sell_acc",
  "back_buy",
  "back_sell",
  "dist_acc",
  "back_dist",
  "inv_acc",
  "cost_acc",
  "buy_acc2",
  "sell_acc2",
  "back_buy2",
  "back_sell2",
  "dist_acc2",
  "back_dist2",
  "inv_acc2",
  "cost_acc2",
] as const;

type AccountFieldKey = (typeof ACCOUNT_KEYS)[number];

type AccountRow = {
  label: string;
  valueKey: AccountFieldKey;
  wageKey?: AccountFieldKey;
};

// ACCOUNT_ROWS will be created inside component to use translations

type CategoryAccountFormState = {
  [Key in AccountFieldKey]: string;
};

const EMPTY_ACCOUNT_FORM = ACCOUNT_KEYS.reduce(
  (acc, field) => ({
    ...acc,
    [field]: "",
  }),
  {} as CategoryAccountFormState,
);

type RawCategory = {
  id?: number | string;
  cat_name?: string;
  cat_name_e?: string;
  k?: string;
  K?: string;
  purity?: string | number | null;
  box?: number | string | null;
  cat_box?: number | string | null;
  tax_type?: boolean | number | null;
  tax?: number | string | null;
  cat_type?: string | number | null;
  catType?: string | number | null;
  cat_status?: string | number | boolean | null;
  catStatus?: string | number | boolean | null;
};

type CategoryRow = {
  id: number;
  cat_name: string;
  cat_name_e: string;
  k: string;
  purity: string;
  box_id: number | null;
  box_name: string;
  tax_type: boolean;
  tax: number;
  cat_type_id: string | number | null;
  cat_type_name: string;
  cat_status_id: string | number | null;
  cat_status_name: string;
};

type CategoryLookupOption = {
  id: string;
  name: string;
};

interface CategoriesClientProps {
  companyId: number;
  initialCategories: RawCategory[];
  initialBoxes: { id: number; box_name: string }[];
  catTypes: CategoryLookupOption[];
  catStatuses: CategoryLookupOption[];
  initialAccounts: Account[];
  initialCategoryAccounts: CategoryAccount[];
}

const mapAccountToFormState = (
  record: CategoryAccount | null | undefined,
): CategoryAccountFormState => {
  return ACCOUNT_KEYS.reduce(
    (acc, field) => {
      const value = record?.[field as keyof CategoryAccount];
      let output = "";

      if (typeof value === "string") {
        output = value;
      } else if (typeof value === "number") {
        output = Number.isNaN(value) ? "" : String(value);
      }

      return { ...acc, [field]: output };
    },
    { ...EMPTY_ACCOUNT_FORM },
  );
};

export default function CategoriesClient({
  companyId,
  initialCategories,
  initialBoxes,
  catTypes,
  catStatuses,
  initialAccounts,
  initialCategoryAccounts,
}: CategoriesClientProps) {
  const router = useRouter();
  const t = useTranslations("basic.categories" as any) as any;
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");

  const columns = useMemo(
    () => [
      { name: t("columns.id"), uid: "id" },
      { name: t("columns.catName"), uid: "cat_name" },
      { name: t("columns.catNameEn"), uid: "cat_name_e" },
      { name: t("columns.k"), uid: "k" },
      { name: t("columns.purity"), uid: "purity" },
      { name: t("columns.box"), uid: "box" },
      { name: t("columns.taxType"), uid: "tax_type" },
      { name: t("columns.tax"), uid: "tax" },
      { name: t("columns.catType"), uid: "cat_type" },
      { name: t("columns.catStatus"), uid: "cat_status" },
      { name: "", uid: "actions" },
    ],
    [t],
  );

  const ACCOUNT_ROWS: AccountRow[] = useMemo(
    () => [
      {
        label: t("accountRows.buyAcc"),
        valueKey: "buy_acc",
        wageKey: "buy_acc2",
      },
      {
        label: t("accountRows.sellAcc"),
        valueKey: "sell_acc",
        wageKey: "sell_acc2",
      },
      {
        label: t("accountRows.backBuy"),
        valueKey: "back_buy",
        wageKey: "back_buy2",
      },
      {
        label: t("accountRows.backSell"),
        valueKey: "back_sell",
        wageKey: "back_sell2",
      },
      {
        label: t("accountRows.distAcc"),
        valueKey: "dist_acc",
        wageKey: "dist_acc2",
      },
      {
        label: t("accountRows.backDist"),
        valueKey: "back_dist",
        wageKey: "back_dist2",
      },
      {
        label: t("accountRows.invAcc"),
        valueKey: "inv_acc",
        wageKey: "inv_acc2",
      },
      {
        label: t("accountRows.costAcc"),
        valueKey: "cost_acc",
        wageKey: "cost_acc2",
      },
    ],
    [t],
  );

  const boxMap = useMemo(() => {
    const map = new Map<number, string>();

    initialBoxes.forEach((box) => {
      if (box?.id !== undefined && box?.id !== null) {
        map.set(Number(box.id), box.box_name);
      }
    });

    return map;
  }, [initialBoxes]);

  const catTypeMap = useMemo(() => {
    const map = new Map<string, string>();

    catTypes.forEach((type) => {
      map.set(String(type.id), type.name);
    });

    return map;
  }, [catTypes]);

  const catStatusMap = useMemo(() => {
    const map = new Map<string, string>();

    catStatuses.forEach((status) => {
      map.set(String(status.id), status.name);
    });

    return map;
  }, [catStatuses]);

  const mapCategoryToRow = useCallback(
    (cat: RawCategory): CategoryRow => {
      const id = Number(cat.id ?? 0);
      const boxIdRaw = cat.box ?? cat.cat_box ?? null;
      const boxId =
        boxIdRaw === null || boxIdRaw === undefined || boxIdRaw === ""
          ? null
          : Number(boxIdRaw);
      const catTypeId = cat.cat_type ?? cat.catType ?? null;
      const rawStatusId = cat.cat_status ?? cat.catStatus ?? null;
      const catStatusId =
        typeof rawStatusId === "boolean" ? Number(rawStatusId) : rawStatusId;
      const taxTypeRaw = cat.tax_type;
      const isTaxable =
        typeof taxTypeRaw === "boolean"
          ? taxTypeRaw
          : Number(taxTypeRaw ?? 0) === 1;

      const normalizedCatTypeId =
        catTypeId === null || catTypeId === undefined || catTypeId === ""
          ? null
          : catTypeId;
      const normalizedCatStatusId =
        catStatusId === null || catStatusId === undefined || catStatusId === ""
          ? null
          : catStatusId;

      const statusKey =
        normalizedCatStatusId !== null
          ? String(normalizedCatStatusId)
          : undefined;
      const typeKey =
        normalizedCatTypeId !== null ? String(normalizedCatTypeId) : undefined;

      return {
        id,
        cat_name: cat.cat_name ?? "-",
        cat_name_e: cat.cat_name_e ?? "-",
        k: cat.k ?? cat.K ?? "-",
        purity:
          cat.purity !== null && cat.purity !== undefined
            ? String(cat.purity)
            : "-",
        box_id: boxId,
        box_name:
          (boxId !== null ? boxMap.get(boxId) : undefined) ??
          String(boxId ?? "-"),
        tax_type: isTaxable,
        tax: Number(cat.tax ?? 0),
        cat_type_id: normalizedCatTypeId,
        cat_type_name:
          (typeKey !== undefined ? catTypeMap.get(typeKey) : undefined) ??
          (normalizedCatTypeId !== null ? String(normalizedCatTypeId) : "-"),
        cat_status_id: normalizedCatStatusId,
        cat_status_name:
          (statusKey !== undefined ? catStatusMap.get(statusKey) : undefined) ??
          (normalizedCatStatusId !== null
            ? String(normalizedCatStatusId)
            : "-"),
      };
    },
    [boxMap, catStatusMap, catTypeMap],
  );

  const [categories, setCategories] = useState<CategoryRow[]>(() =>
    initialCategories.map(mapCategoryToRow),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryRow | null>(
    null,
  );
  const initialCategoryIdRaw = initialCategories?.[0]?.id ?? null;
  const initialCategoryId =
    initialCategoryIdRaw !== null && initialCategoryIdRaw !== undefined
      ? Number(initialCategoryIdRaw)
      : null;
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialCategoryId,
  );
  const [accountRecordId, setAccountRecordId] = useState<number | null>(
    initialCategoryAccounts?.[0]?.id ?? null,
  );
  const initialAccountFormState = mapAccountToFormState(
    initialCategoryAccounts?.[0],
  );
  const [accountForm, setAccountForm] = useState<CategoryAccountFormState>(
    initialAccountFormState,
  );
  const [accountFormSnapshot, setAccountFormSnapshot] =
    useState<CategoryAccountFormState>(initialAccountFormState);
  const [isAccountsLoading, setIsAccountsLoading] = useState(false);
  const [isSavingAccounts, setIsSavingAccounts] = useState(false);
  const hasHydratedInitialAccount = useRef(false);

  const accountOptions = useMemo(
    () =>
      initialAccounts.map((account) => {
        const code = account.acc_id;
        const label = code ? `${code} - ${account.acc_name}` : account.acc_name;

        return {
          id: account.id,
          key: String(account.id),
          name: account.acc_name,
          code,
          label,
        };
      }),
    [initialAccounts],
  );

  const getAccountOption = (value: string | null | undefined) => {
    if (!value) return null;
    const trimmed = value.trim();

    return (
      accountOptions.find(
        (option) =>
          option.code === trimmed ||
          option.name === trimmed ||
          option.key === trimmed ||
          option.label?.trim() === trimmed,
      ) ?? null
    );
  };

  const getAccountDisplayValue = (value: string | null | undefined) => {
    if (!value) return "";
    const option = getAccountOption(value);

    if (option) {
      const code = option.code ?? option.key;

      return code ? `${code} - ${option.name}` : option.name;
    }

    return value;
  };

  const loadData = async () => {
    try {
      const categoriesList = await categoryService.getAllCategories(companyId);
      const sanitized = categoriesList.map(mapCategoryToRow);

      setCategories(sanitized);
    } catch (error) {
      console.error(t("messages.loadError"), error);
      setCategories([]);
    }
  };


  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    const normalizedQuery = searchQuery.toLowerCase().trim();

    return categories.filter((cat) => {
      const valuesToSearch = [
        cat.id,
        cat.cat_name,
        cat.cat_name_e,
        cat.k,
        cat.purity,
        cat.box_name,
        cat.cat_type_name,
        cat.cat_status_name,
        cat.tax,
      ];

      return valuesToSearch.some((val) =>
        val?.toString().toLowerCase().includes(normalizedQuery),
      );
    });
  }, [searchQuery, categories]);

  const sortedCategories = useMemo(
    () => [...filteredCategories].sort((a, b) => a.id - b.id),
    [filteredCategories],
  );

  const pages = Math.max(Math.ceil(sortedCategories.length / rowsPerPage), 1);
  const paginated = sortedCategories.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const isAccountFormDirty = useMemo(
    () =>
      ACCOUNT_KEYS.some((key) => accountForm[key] !== accountFormSnapshot[key]),
    [accountForm, accountFormSnapshot],
  );

  const handleDeleteClick = (category: CategoryRow) => {
    if (!category.id) {
      toast.error(t("messages.deleteErrorNoId"));

      return;
    }

    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete?.id) {
      setDeleteModalOpen(false);
      setCategoryToDelete(null);

      return;
    }

    setCategories((prevCategories) =>
      prevCategories.filter((c) => c.id !== categoryToDelete.id),
    );

    try {
      const result = await categoryService.deleteCategory(categoryToDelete.id);

      if (result) {
        toast.success(t("messages.deleteSuccess"));
        await loadData();
      } else {
        toast.error(t("messages.deleteFailed"));
        await loadData();
      }
    } catch {
      toast.error(t("messages.deleteError"));
      await loadData();
    } finally {
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  useEffect(() => {
    if (categories.length === 0) {
      setSelectedCategoryId(null);

      return;
    }

    if (
      selectedCategoryId !== null &&
      categories.some((cat) => cat.id === selectedCategoryId)
    ) {
      return;
    }

    setSelectedCategoryId(categories[0]?.id ?? null);
  }, [categories, selectedCategoryId]);

  const handleCategorySelectionChange = (keys: any) => {
    const key = Array.from(keys)?.[0];

    if (!key) return;
    const categoryId = Number(key);

    if (Number.isNaN(categoryId)) return;
    setSelectedCategoryId(categoryId);
  };


  const loadCategoryAccounts = useCallback(
    async (categoryId: number) => {
      setIsAccountsLoading(true);
      try {
        const records = await getCategoryAccountsAction({
          companyId,
          categoryId,
        });

        let record =
          records.find((item) => Number(item.cat) === Number(categoryId)) ??
          records[0] ??
          null;

        if (!record) {
          record = await ensureCategoryAccountAction({
            companyId,
            categoryId,
          });
        }

        const formState = mapAccountToFormState(record);

        setAccountForm(formState);
        setAccountFormSnapshot(formState);
        setAccountRecordId(record?.id ?? null);
      } catch (error) {
        console.error(t("messages.accountsLoadError"), error);
        toast.error(t("messages.accountsLoadError"));
        setAccountForm({ ...EMPTY_ACCOUNT_FORM });
        setAccountFormSnapshot({ ...EMPTY_ACCOUNT_FORM });
        setAccountRecordId(null);
      } finally {
        setIsAccountsLoading(false);
      }
    },
    [companyId],
  );

  useEffect(() => {
    if (!selectedCategoryId) {
      setAccountForm({ ...EMPTY_ACCOUNT_FORM });
      setAccountFormSnapshot({ ...EMPTY_ACCOUNT_FORM });
      setAccountRecordId(null);

      return;
    }

    if (
      !hasHydratedInitialAccount.current &&
      initialCategoryAccounts?.length &&
      selectedCategoryId === initialCategoryId
    ) {
      const initialRecord =
        initialCategoryAccounts.find(
          (item) => Number(item.cat) === Number(selectedCategoryId),
        ) ?? initialCategoryAccounts[0];

      const initialForm = mapAccountToFormState(initialRecord);

      setAccountForm(initialForm);
      setAccountFormSnapshot(initialForm);
      setAccountRecordId(initialRecord?.id ?? null);
      hasHydratedInitialAccount.current = true;

      return;
    }

    void loadCategoryAccounts(selectedCategoryId);
  }, [
    selectedCategoryId,
    initialCategoryAccounts,
    initialCategoryId,
    loadCategoryAccounts,
  ]);

  const handleAccountFieldChange = (
    fieldKey: AccountFieldKey,
    value: string,
  ) => {
    setAccountForm((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleResetAccountForm = () => {
    setAccountForm({ ...accountFormSnapshot });
  };

  const handleSaveAccounts = async () => {
    if (!selectedCategoryId) {
      toast.error(t("messages.selectCategoryFirst"));

      return;
    }

    setIsSavingAccounts(true);
    try {
      const sanitizedPayload = ACCOUNT_KEYS.reduce((acc, key) => {
        const raw = accountForm[key]?.trim();

        if (!raw) {
          acc[key] = null;

          return acc;
        }

        const normalized = raw.includes("-")
          ? raw.split("-")[0].trim()
          : raw.trim();

        acc[key] = normalized || null;

        return acc;
      }, {} as Partial<UpsertCategoryAccountPayload>);

      const result = await saveCategoryAccountAction({
        id: accountRecordId ?? undefined,
        companyId,
        categoryId: selectedCategoryId,
        payload: sanitizedPayload,
      });

      if (result) {
        const nextState = mapAccountToFormState(result);

        setAccountForm(nextState);
        setAccountFormSnapshot(nextState);
        setAccountRecordId(result.id);
        toast.success(t("messages.accountsSaveSuccess"));
      } else {
        toast.error(t("messages.accountsSaveError"));
      }
    } catch (error) {
      console.error(t("messages.accountsSaveErrorGeneric"), error);
      toast.error(t("messages.accountsSaveErrorGeneric"));
    } finally {
      setIsSavingAccounts(false);
    }
  };

  const renderActions = (cat: CategoryRow) => (
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => router.push(`/basic/categories/${cat.id}`)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => router.push(`/basic/categories/${cat.id}?mode=edit`)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        variant="light"
        onPress={() => handleDeleteClick(cat)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 font-cairo">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="bg-gray-100"
          variant="bordered"
          onPress={() => router.push("/basic/categories/new")}
        >
          <PlusIcon className="h-3 w-3" />
          {t("actions.add")}
        </Button>
        <div className="h-8 w-px bg-gray-300" />
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={t("labels.searchPlaceholder")}
            size="sm"
            startContent={
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* حاوية اليسار: الجدول مع معلومات أساسية */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-2">
            <Table
              removeWrapper
              aria-label={t("labels.tableAriaLabel")}
              selectedKeys={
                selectedCategoryId
                  ? new Set([String(selectedCategoryId)])
                  : new Set()
              }
              selectionMode="single"
              onSelectionChange={handleCategorySelectionChange}
            >
              <TableHeader>
                {columns.map((col) => (
                  <TableColumn key={col.uid}>{col.name}</TableColumn>
                ))}
              </TableHeader>
              <TableBody emptyContent={t("labels.emptyContent")}>
                {paginated.map((cat) => (
                  <TableRow key={cat.id} className="cursor-pointer">
                    <TableCell>{cat.id}</TableCell>
                    <TableCell>{cat.cat_name}</TableCell>
                    <TableCell>{cat.cat_name_e}</TableCell>
                    <TableCell>{cat.purity}</TableCell>
                    <TableCell>{renderActions(cat)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-start gap-2 border-t border-gray-100 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-gray-600">
              {t("labels.totalCount", { count: filteredCategories.length })}
            </span>
            <Pagination
              color="primary"
              page={page}
              total={pages}
              onChange={setPage}
            />
          </div>
        </div>

        {/* حاوية اليمين: معلومات حساب الفئة */}
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t("labels.categoryAccounts")}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedCategory
                  ? t("labels.selectedCategory", {
                      name:
                        locale === "en" && selectedCategory.cat_name_e
                          ? selectedCategory.cat_name_e
                          : selectedCategory.cat_name,
                    })
                  : t("labels.selectCategory")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                isDisabled={
                  !isAccountFormDirty || isAccountsLoading || isSavingAccounts
                }
                variant="light"
                onPress={handleResetAccountForm}
              >
                {t("actions.reset")}
              </Button>
              <Button
                color="success"
                isDisabled={
                  !selectedCategoryId || isAccountsLoading || !isAccountFormDirty
                }
                isLoading={isSavingAccounts}
                onPress={handleSaveAccounts}
              >
                {t("actions.saveAccounts")}
              </Button>
            </div>
          </div>

          {!selectedCategoryId ? (
            <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
              {t("labels.selectCategoryHint")}
            </div>
          ) : isAccountsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner color="primary" label={t("labels.loadingAccounts")} />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div
                className="grid grid-cols-3 bg-gray-50 text-sm font-semibold text-gray-700"
                dir={dir}
              >
                <div className="border-l border-gray-200 px-4 py-2">
                  {t("labels.accounts")}
                </div>
                <div className="border-l border-gray-200 px-4 py-2">
                  {t("labels.value")}
                </div>
                <div className="px-4 py-2">{t("labels.wages")}</div>
              </div>

              <div className="divide-y divide-gray-100" dir={dir}>
                {ACCOUNT_ROWS.map(({ label, valueKey, wageKey }) => {
                  const valueSelected = accountForm[valueKey] ?? "";
                  const wageSelected = wageKey
                    ? (accountForm[wageKey] ?? "")
                    : "";

                  const renderAutocomplete = (
                    key: AccountFieldKey,
                    ariaLabel: string,
                    column: "value" | "wage",
                    text: string,
                  ) => {
                    const normalizedText = getAccountDisplayValue(text)
                      .trim()
                      .toLowerCase();
                    const filteredOptions = normalizedText
                      ? accountOptions.filter((option) => {
                          const target = option.label?.toLowerCase() ?? "";
                          const code = option.code?.toLowerCase() ?? "";

                          return (
                            target.includes(normalizedText) ||
                            code.includes(normalizedText)
                          );
                        })
                      : accountOptions;

                    return (
                      <Autocomplete
                        allowsCustomValue
                        aria-label={ariaLabel}
                        className="max-w-full text-right leading-tight"
                        classNames={{
                          selectorButton:
                            column === "wage"
                              ? "bg-amber-100 border-amber-300"
                              : "bg-white border-gray-200",
                          listbox: "text-right",
                        }}
                        inputValue={getAccountDisplayValue(text)}
                        items={filteredOptions}
                        menuTrigger="input"
                        placeholder={t("labels.accountPlaceholder")}
                        selectedKey={null}
                        variant="bordered"
                        onInputChange={(value) => {
                          const option = getAccountOption(value);

                          if (option) {
                            handleAccountFieldChange(
                              key,
                              option.code || option.name || option.key,
                            );

                            return;
                          }

                          handleAccountFieldChange(key, value);
                        }}
                        onSelectionChange={(selection) => {
                          if (!selection) {
                            handleAccountFieldChange(key, "");

                            return;
                          }

                          const option = accountOptions.find(
                            (item) => item.key === selection,
                          );

                          if (option) {
                            handleAccountFieldChange(
                              key,
                              option.code || option.name || option.key,
                            );
                          }
                        }}
                      >
                        {(option) => (
                          <AutocompleteItem
                            key={option.key}
                            textValue={option.label}
                          >
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium text-gray-800">
                                {option.name}
                              </span>
                              {option.code && (
                                <span className="text-xs text-gray-500">
                                  {option.code}
                                </span>
                              )}
                            </div>
                          </AutocompleteItem>
                        )}
                      </Autocomplete>
                    );
                  };

                  return (
                    <div
                      key={label}
                      className="grid grid-cols-3 bg-white text-sm text-gray-700"
                    >
                      <div className="border-l border-gray-100 px-3 py-1.5 font-medium text-gray-800">
                        {label}
                      </div>
                      <div className="border-l border-gray-100 px-3 py-1.5">
                        {renderAutocomplete(
                          valueKey,
                          `اختيار الحساب (قيمة) لـ ${label}`,
                          "value",
                          valueSelected,
                        )}
                      </div>
                      <div className="px-3 py-1.5">
                        {wageKey ? (
                          renderAutocomplete(
                            wageKey,
                            `اختيار الحساب (أجور) لـ ${label}`,
                            "wage",
                            wageSelected,
                          )
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400">
                            -
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        cancelText={t("modals.cancel")}
        confirmColor="danger"
        confirmText={t("modals.confirm")}
        isOpen={deleteModalOpen}
        message={t("modals.deleteMessage", {
          name: categoryToDelete?.cat_name,
        })}
        size="md"
        title={t("modals.deleteTitle")}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
