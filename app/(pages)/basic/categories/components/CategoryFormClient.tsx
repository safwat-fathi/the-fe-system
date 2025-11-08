"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Input,
  Checkbox,
  Select,
  SelectItem,
} from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import {
  ensureCategoryAccountAction,
  saveCategoryAccountAction,
} from "@/app/actions/category-accounts.action";
import categoryService from "@/services/api/category.service";
import type { Account } from "@/types/models/account";
import type { CategoryAccount } from "@/types/models/category-account";
import type { UpsertCategoryAccountPayload } from "@/types/models/category-account";

type CategoryFormMode = "view" | "edit" | "add";

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

interface CategoryFormClientProps {
  mode: CategoryFormMode;
  initialCategory: Partial<Category>;
  boxes: { id: number; box_name: string }[];
  companyId: number;
  initialAccounts: Account[];
  initialCategoryAccount: CategoryAccount | null;
}

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

type CategoryAccountFormState = {
  [Key in AccountFieldKey]: string;
};

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

const EMPTY_ACCOUNT_FORM = ACCOUNT_KEYS.reduce(
  (acc, field) => ({
    ...acc,
    [field]: "",
  }),
  {} as CategoryAccountFormState,
);

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

const CategoryFormClient = ({
  mode,
  initialCategory,
  boxes,
  companyId,
  initialAccounts,
  initialCategoryAccount,
}: CategoryFormClientProps) => {
  const router = useRouter();
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [category, setCategory] = useState<Partial<Category>>(initialCategory);
  const [isSaving, setIsSaving] = useState(false);
  const [accountRecordId, setAccountRecordId] = useState<number | null>(
    initialCategoryAccount?.id ?? null,
  );

  const initialAccountForm = useMemo(
    () => mapAccountToFormState(initialCategoryAccount),
    [initialCategoryAccount],
  );
  const [accountForm, setAccountForm] =
    useState<CategoryAccountFormState>(initialAccountForm);
  const [accountFormSnapshot, setAccountFormSnapshot] =
    useState<CategoryAccountFormState>(initialAccountForm);

  useEffect(() => {
    const nextState = mapAccountToFormState(initialCategoryAccount);
    setAccountForm(nextState);
    setAccountFormSnapshot(nextState);
    setAccountRecordId(initialCategoryAccount?.id ?? null);
  }, [initialCategoryAccount]);

  const accountOptions = useMemo(() => {
    return initialAccounts.map((account) => {
      const code = account.acc_id;
      const codeLabel = code ? ` ${code}` : "";

      return {
        id: account.id,
        key: String(account.id),
        name: account.acc_name,
        code: code,
        label: code ? `${code} - ${account.acc_name}` : account.acc_name,
      };
    });
  }, [initialAccounts]);

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

  const isAccountFormDirty = useMemo(
    () =>
      ACCOUNT_KEYS.some(
        (key) => accountForm[key] !== accountFormSnapshot[key],
      ),
    [accountForm, accountFormSnapshot],
  );

  const handleSave = async () => {
    if (!category.cat_name || !category.cat_name_e) {
      toast.error("❌ يجب ملء جميع الحقول المطلوبة");
      return;
    }

    setIsSaving(true);

    try {
      let result: Category | null = null;
      let targetCategoryId = category.id ?? 0;

      if (isAddMode) {
        result = await categoryService.createCategory(
          category as Omit<Category, "id">,
        );
        targetCategoryId = result?.id ?? 0;
      } else if (category.id) {
        result = await categoryService.updateCategory(category.id, category);
        targetCategoryId = category.id;
      }

      if (result) {
        if (targetCategoryId > 0) {
          let ensuredRecord = initialCategoryAccount;

          try {
            ensuredRecord = await ensureCategoryAccountAction({
              companyId,
              categoryId: targetCategoryId,
            });
            setAccountRecordId(ensuredRecord?.id ?? accountRecordId);
          } catch (error) {
            console.error(
              "❌ خطأ أثناء ضمان وجود سجل حسابات الفئة:",
              error,
            );
          }

          const sanitizedPayload = ACCOUNT_KEYS.reduce(
            (acc, key) => {
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
            },
            {} as Partial<UpsertCategoryAccountPayload>,
          );

          try {
            const accountResult = await saveCategoryAccountAction({
              id: ensuredRecord?.id ?? accountRecordId ?? undefined,
              companyId,
              categoryId: targetCategoryId,
              payload: sanitizedPayload,
            });

            if (accountResult) {
              const normalized = mapAccountToFormState(accountResult);
              setAccountForm(normalized);
              setAccountFormSnapshot(normalized);
              setAccountRecordId(accountResult.id);
            }
          } catch (error) {
            console.error("❌ خطأ أثناء حفظ حسابات الفئة:", error);
            toast.error("❌ حدث خطأ أثناء حفظ حسابات الفئة");
            return;
          }
        }

        toast.success(
          isAddMode
            ? "✅ تم إضافة الفئة بنجاح"
            : "✅ تم تعديل الفئة بنجاح",
        );
        router.push("/basic/categories");
        router.refresh();
      } else {
        toast.error("❌ فشل في العملية");
      }
    } catch (error) {
      console.error("❌ خطأ أثناء الحفظ:", error);
      toast.error("❌ حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    router.push(`/basic/categories/${category.id}?mode=edit`);
  };

  const handleAccountFieldChange = (
    fieldKey: AccountFieldKey,
    value: string,
  ) => {
    setAccountForm((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const getTitle = () => {
    if (isViewMode) return `عرض ${category.cat_name || "الفئة"}`;
    if (isAddMode) return "إضافة فئة جديدة";
    return `تعديل ${category.cat_name || "الفئة"}`;
  };

  const getDescription = () => {
    if (isViewMode) return "عرض تفاصيل الفئة";
    if (isAddMode) return "قم بإضافة فئة جديدة إلى النظام";
    return "قم بتعديل بيانات الفئة";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
          <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="light"
            onPress={() => router.push("/basic/categories")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            رجوع
          </Button>
          {isViewMode && (
            <Button color="primary" onPress={handleEdit}>
              تعديل
            </Button>
          )}
          {!isViewMode && (
            <>
              <Button
                variant="light"
                onPress={() => router.push("/basic/categories")}
              >
                إلغاء
              </Button>
              <Button
                color="success"
                isLoading={isSaving}
                onPress={handleSave}
              >
                {isAddMode ? "حفظ" : "تحديث"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          isDisabled={isViewMode}
          label="اسم الفئة"
          value={category.cat_name || ""}
          onChange={(e) =>
            setCategory({ ...category, cat_name: e.target.value })
          }
          isRequired
        />
        <Input
          isDisabled={isViewMode}
          label="الاسم بالإنجليزي"
          value={category.cat_name_e || ""}
          onChange={(e) =>
            setCategory({ ...category, cat_name_e: e.target.value })
          }
          isRequired
        />
        <Input
          isDisabled={isViewMode}
          label="العيار"
          value={category.k || ""}
          onChange={(e) => setCategory({ ...category, k: e.target.value })}
        />
        <Input
          isDisabled={isViewMode}
          label="المعيارية"
          value={category.purity || ""}
          onChange={(e) =>
            setCategory({ ...category, purity: e.target.value })
          }
        />
        <Select
          isDisabled={isViewMode}
          label="الصندوق"
          selectedKeys={
            category.box !== null ? [String(category.box)] : []
          }
          onSelectionChange={(keys) => {
            const id = Number(Array.from(keys)[0]);
            setCategory({ ...category, box: id });
          }}
        >
          {boxes.map((b) => (
            <SelectItem key={b.id} textValue={b.box_name}>
              {b.box_name}
            </SelectItem>
          ))}
        </Select>
        <Input
          isDisabled={isViewMode}
          label="نسبة الضريبة"
          type="number"
          value={String(category.tax || 0)}
          onChange={(e) =>
            setCategory({
              ...category,
              tax: parseFloat(e.target.value) || 0,
            })
          }
        />
        <Input
          isDisabled={isViewMode}
          label="النوع"
          value={category.cat_type || ""}
          onChange={(e) =>
            setCategory({ ...category, cat_type: e.target.value })
          }
        />
        <div className="md:col-span-2 flex gap-4">
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(category.tax_type)}
            onValueChange={(val) =>
              setCategory({ ...category, tax_type: val })
            }
          >
            خاضعة للضريبة
          </Checkbox>
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(category.cat_status)}
            onValueChange={(val) =>
              setCategory({ ...category, cat_status: val })
            }
          >
            مفعّلة
          </Checkbox>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              حسابات الفئة
            </h3>
            <p className="text-sm text-gray-500">
              يتم حفظ التعديلات مع حفظ بيانات الفئة.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="grid grid-cols-3 bg-gray-50 text-sm font-semibold text-gray-700">
            <div className="border-l border-gray-200 px-4 py-2">الحسابات</div>
            <div className="border-l border-gray-200 px-4 py-2">قيمة</div>
            <div className="px-4 py-2">أجور</div>
          </div>

          <div className="divide-y divide-gray-100">
            {ACCOUNT_ROWS.map(({ label, valueKey, wageKey }) => {
              const valueSelected = accountForm[valueKey] ?? "";
              const wageSelected = wageKey ? accountForm[wageKey] ?? "" : "";

              if (isViewMode) {
                return (
                  <div
                    key={label}
                    className="grid grid-cols-3 bg-white text-sm text-gray-700"
                  >
                    <div className="border-l border-gray-100 px-3 py-1.5 font-medium text-gray-800">
                      {label}
                    </div>
                    <div className="border-l border-gray-100 px-3 py-1.5">
                      {getAccountDisplayValue(valueSelected) || "-"}
                    </div>
                    <div className="px-3 py-1.5">
                      {wageKey
                        ? getAccountDisplayValue(wageSelected) || "-"
                        : "-"}
                    </div>
                  </div>
                );
              }

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
                    inputValue={getAccountDisplayValue(text)}
                    items={filteredOptions}
                    menuTrigger="input"
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
                    placeholder="اكتب اسم الحساب أو رقمه"
                  >
                    {(option) => (
                      <AutocompleteItem key={option.key} textValue={option.label}>
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

        {!isViewMode && (
          <div className="mt-3 text-xs text-gray-500">
            ملاحظة: سيتم حفظ حسابات الفئة مع الضغط على زر الحفظ أعلاه.
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryFormClient;

