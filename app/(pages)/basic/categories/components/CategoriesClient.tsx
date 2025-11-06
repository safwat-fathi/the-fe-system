"use client";

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

import {
  getCategoryAccountsAction,
  saveCategoryAccountAction,
} from "@/app/actions/category-accounts.action";
import { ConfirmationModal } from "@/components/Modal";
import categoryService from "@/services/api/category.service";
import type { Account } from "@/types/models/account";
import type {
  CategoryAccount,
  UpsertCategoryAccountPayload,
} from "@/types/models/category-account";

const columns = [
  { name: "رقم الفئة", uid: "id" },
  { name: "اسم الفئة", uid: "cat_name" },
  { name: "الاسم بالإنجليزي", uid: "cat_name_e" },
  { name: "العيار", uid: "k" },
  { name: "المعيارية", uid: "purity" },
  { name: "الصندوق", uid: "box" },
  { name: "الضريبة", uid: "tax_type" },
  { name: "نسبة الضريبة", uid: "tax" },
  { name: "النوع", uid: "cat_type" },
  { name: "حالة الفئة", uid: "cat_status" },
  { name: "", uid: "actions" },
] as const;

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

const ACCOUNT_ROWS: AccountRow[] = [
  { label: "حساب المشتروات", valueKey: "buy_acc", wageKey: "buy_acc2" },
  { label: "حساب المبيعات", valueKey: "sell_acc", wageKey: "sell_acc2" },
  {
    label: "حساب مردود المشتروات",
    valueKey: "back_buy",
    wageKey: "back_buy2",
  },
  {
    label: "حساب مردود المبيعات",
    valueKey: "back_sell",
    wageKey: "back_sell2",
  },
  { label: "حساب الاستلام", valueKey: "dist_acc", wageKey: "dist_acc2" },
  { label: "حساب التسليم", valueKey: "back_dist", wageKey: "back_dist2" },
  { label: "حساب المخزون", valueKey: "inv_acc", wageKey: "inv_acc2" },
  {
    label: "حساب تكلفة المبيعات",
    valueKey: "cost_acc",
    wageKey: "cost_acc2",
  },
];

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

interface Category {
  id: number;
  cat_name: string;
  cat_name_e: string;
  k: string;
  purity: string;
  box: number | null;
  tax_type: boolean;
  tax: number;
  cat_type: string;
  cat_status: boolean;
}

interface CategoriesClientProps {
  companyId: number;
  initialCategories: Category[];
  initialBoxes: { id: number; box_name: string }[];
  initialAccounts: Account[];
  initialCategoryAccounts: CategoryAccount[];
}

const mapAccountToFormState = (
  record: CategoryAccount | null | undefined,
): CategoryAccountFormState => {
  return ACCOUNT_KEYS.reduce((acc, field) => {
    const value = record?.[field as keyof CategoryAccount];
    let output = "";

    if (typeof value === "string") {
      output = value;
    } else if (typeof value === "number") {
      output = Number.isNaN(value) ? "" : String(value);
    }

    return { ...acc, [field]: output };
  }, { ...EMPTY_ACCOUNT_FORM });
};

export default function CategoriesClient({
  companyId,
  initialCategories,
  initialBoxes,
  initialAccounts,
  initialCategoryAccounts,
}: CategoriesClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [boxes] = useState<{ id: number; box_name: string }[]>(initialBoxes);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );
  const initialCategoryId = initialCategories?.[0]?.id ?? null;
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialCategoryId,
  );
  const [accountRecordId, setAccountRecordId] = useState<number | null>(
    initialCategoryAccounts?.[0]?.id ?? null,
  );
  const initialAccountFormState = mapAccountToFormState(
    initialCategoryAccounts?.[0],
  );
  const [accountForm, setAccountForm] =
    useState<CategoryAccountFormState>(initialAccountFormState);
  const [accountFormSnapshot, setAccountFormSnapshot] =
    useState<CategoryAccountFormState>(initialAccountFormState);
  const [isAccountsLoading, setIsAccountsLoading] = useState(false);
  const [isSavingAccounts, setIsSavingAccounts] = useState(false);
  const hasHydratedInitialAccount = useRef(false);

  const accountOptions = useMemo(
    () =>
      initialAccounts.map((account) => {
        const code = account.acc_id;
        const codeLabel = code ? ` (${code})` : "";

        return {
          id: account.id,
          key: String(account.id),
          name: account.acc_name,
          code: code,
          label: `${account.acc_name}${codeLabel}`,
        };
      }),
    [initialAccounts],
  );

  const sanitizeCategory = (cat: any): Category => ({
    id: cat.id ?? 0,
    cat_name: cat.cat_name ?? "-",
    cat_name_e: cat.cat_name_e ?? "-",
    k: cat.k ?? cat.K ?? "-",
    purity: cat.purity ?? "-",
    box: cat.box ?? cat.cat_box ?? null,
    tax_type: Boolean(cat.tax_type),
    tax: Number(cat.tax ?? 0),
    cat_type: cat.cat_type ?? "-",
    cat_status: Boolean(cat.cat_status),
  });

  const loadData = async () => {
    try {
      const categoriesList = await categoryService.getAllCategories(companyId);
      const sanitized = categoriesList.map(sanitizeCategory);
      setCategories(sanitized);
    } catch (error) {
      console.error("فشل في جلب البيانات:", error);
      setCategories([]);
    }
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

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    return categories.filter((cat) =>
      Object.values(cat).some((val) =>
        val?.toString().toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    );
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
    () =>
      categories.find((cat) => cat.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const isAccountFormDirty = useMemo(
    () =>
      ACCOUNT_KEYS.some((key) => accountForm[key] !== accountFormSnapshot[key]),
    [accountForm, accountFormSnapshot],
  );

  const handleDeleteClick = (category: Category) => {
    if (!category.id) {
      toast.error("❌ لا يمكن حذف فئة بدون معرف");
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
        toast.success("تم حذف الفئة بنجاح ✅");
        await loadData();
      } else {
        toast.error("فشل في الحذف ❌");
        await loadData();
      }
    } catch (error) {
      toast.error("خطأ أثناء الاتصال بالسيرفر");
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

        const record =
          records.find(
            (item) => Number(item.cat) === Number(categoryId),
          ) ?? records[0] ?? null;

        const formState = mapAccountToFormState(record);
        setAccountForm(formState);
        setAccountFormSnapshot(formState);
        setAccountRecordId(record?.id ?? null);
      } catch (error) {
        console.error("فشل في تحميل حسابات الفئة:", error);
        toast.error("فشل في تحميل حسابات الفئة ❌");
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
      toast.error("❌ يرجى اختيار فئة أولاً");
      return;
    }

    setIsSavingAccounts(true);
    try {
      const sanitizedPayload = ACCOUNT_KEYS.reduce(
        (acc, key) => {
          const raw = accountForm[key]?.trim();
          acc[key] = raw ? raw : null;

          return acc;
        },
        {} as Partial<UpsertCategoryAccountPayload>,
      );

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
        toast.success("تم حفظ حسابات الفئة بنجاح ✅");
      } else {
        toast.error("فشل في حفظ حسابات الفئة ❌");
      }
    } catch (error) {
      console.error("خطأ أثناء حفظ حسابات الفئة:", error);
      toast.error("حدث خطأ أثناء حفظ حسابات الفئة ❌");
    } finally {
      setIsSavingAccounts(false);
    }
  };

  const renderActions = (cat: Category) => (
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
        <h2 className="text-base font-semibold">إدارة الفئات</h2>
        <div className="h-8 w-px bg-gray-300" />
        <Button
          variant="bordered"
          className="bg-gray-100"
          onPress={() => router.push("/basic/categories/new")}
        >
          <PlusIcon className="h-3 w-3" />
          إضافة فئة
        </Button>
        <div className="h-8 w-px bg-gray-300" />
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="بحث بالاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            }
            size="sm"
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Table
          aria-label="جدول الفئات"
          selectionMode="single"
          selectedKeys={
            selectedCategoryId ? new Set([String(selectedCategoryId)]) : new Set()
          }
          onSelectionChange={handleCategorySelectionChange}
          removeWrapper
        >
          <TableHeader>
            {columns.map((col) => (
              <TableColumn key={col.uid}>{col.name}</TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent="لا توجد فئات مطابقة">
            {paginated.map((cat) => (
              <TableRow key={cat.id} className="cursor-pointer">
                <TableCell>{cat.id}</TableCell>
                <TableCell>{cat.cat_name}</TableCell>
                <TableCell>{cat.cat_name_e}</TableCell>
                <TableCell>{cat.k}</TableCell>
                <TableCell>{cat.purity}</TableCell>
                <TableCell>
                  {boxes.find((b) => b.id === cat.box)?.box_name || cat.box}
                </TableCell>
                <TableCell>
                  <Checkbox isReadOnly isSelected={cat.tax_type} />
                </TableCell>
                <TableCell>{cat.tax}</TableCell>
                <TableCell>{cat.cat_type}</TableCell>
                <TableCell>
                  <Checkbox isReadOnly isSelected={cat.cat_status} />
                </TableCell>
                <TableCell>{renderActions(cat)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-col items-start gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-gray-600">
            عدد الفئات: {filteredCategories.length}
          </span>
          <Pagination
            color="primary"
            page={page}
            total={pages}
            onChange={setPage}
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              حسابات الفئة
            </h3>
            <p className="text-sm text-gray-500">
              {selectedCategory
                ? `الفئة المحددة: ${selectedCategory.cat_name}`
                : "اختر فئة لاستعراض حساباتها"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="light"
              onPress={handleResetAccountForm}
              isDisabled={!isAccountFormDirty || isAccountsLoading || isSavingAccounts}
            >
              إعادة تعيين
            </Button>
            <Button
              color="success"
              onPress={handleSaveAccounts}
              isDisabled={
                !selectedCategoryId || isAccountsLoading || !isAccountFormDirty
              }
              isLoading={isSavingAccounts}
            >
              حفظ التعديلات
            </Button>
          </div>
        </div>

        {!selectedCategoryId ? (
          <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
            يرجى اختيار فئة من الجدول بالأعلى لاستعراض حساباتها.
          </div>
        ) : isAccountsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner color="primary" label="جار تحميل حسابات الفئة..." />
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div
              className="grid grid-cols-3 bg-gray-50 text-sm font-semibold text-gray-700"
              dir="rtl"
            >
              <div className="border-l border-gray-200 px-4 py-2">الحسابات</div>
              <div className="border-l border-gray-200 px-4 py-2">قيمة</div>
              <div className="px-4 py-2">أجور</div>
            </div>

            <div className="divide-y divide-gray-100" dir="rtl">
              {ACCOUNT_ROWS.map(({ label, valueKey, wageKey }) => {
                const valueSelected = accountForm[valueKey] ?? "";
                const wageSelected = wageKey ? accountForm[wageKey] ?? "" : "";

                const renderAutocomplete = (
                  key: AccountFieldKey,
                  ariaLabel: string,
                  column: "value" | "wage",
                  text: string,
                ) => {
                  const normalizedText = text.trim().toLowerCase();
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
                        trigger:
                          column === "wage"
                            ? "bg-amber-100 border-amber-300"
                            : "bg-white border-gray-200",
                        inputWrapper: "min-h-[36px]",
                        listbox: "text-right",
                      }}
                    inputValue={text}
                      items={filteredOptions}
                    menuTrigger="input"
                    selectedKey={null}
                    variant="bordered"
                    onInputChange={(value) => {
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
                    placeholder="اكتب اسم الحساب أو رقمه"
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
                      {wageKey
                        ? renderAutocomplete(
                            wageKey,
                            `اختيار الحساب (أجور) لـ ${label}`,
                            "wage",
                            wageSelected,
                          )
                        : (
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

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف الفئة "${categoryToDelete?.cat_name}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        confirmColor="danger"
        size="md"
      />
    </div>
  );
}
