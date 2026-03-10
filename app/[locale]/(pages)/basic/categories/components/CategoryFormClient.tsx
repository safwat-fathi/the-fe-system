"use client";

import type { Account } from "@/types/models/account";
import type {
  CategoryAccount,
  UpsertCategoryAccountPayload,
} from "@/types/models/category-account";

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
import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import {
  ensureCategoryAccountAction,
  saveCategoryAccountAction,
} from "@/app/actions/category-accounts.action";
import { FORM_ACTIONS } from "@/constants/ui";
import categoryService from "@/services/api/category.service";

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
  cat_status: string | number | boolean | null;
}

interface CatType {
  code_id: number;
  code_desc: string;
}

interface CatStatus {
  code_id: number;
  code_desc: string;
}

interface CategoryFormClientProps {
  mode: CategoryFormMode;
  initialCategory: Partial<Category>;
  boxes: { id: number; cust_name: string }[];
  catTypes: CatType[];
  catStatuses: CatStatus[];
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

// ACCOUNT_ROWS will be created inside component to use translations

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

const CategoryFormClient = ({
  mode,
  initialCategory,
  boxes,
  catTypes,
  companyId,
  initialAccounts,
  initialCategoryAccount,
  catStatuses,
}: CategoryFormClientProps) => {
  const router = useRouter();
  const t = useTranslations("basic.categories" as any) as any;
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [category, setCategory] = useState<Partial<Category>>(initialCategory);
  const [isSaving, setIsSaving] = useState(false);
  const [accountRecordId, setAccountRecordId] = useState<number | null>(
    initialCategoryAccount?.id ?? null,
  );
  const normalizedCatStatusValue = useMemo(() => {
    const raw = category.cat_status;

    if (raw === null || raw === undefined || raw === "") {
      return null;
    }

    if (typeof raw === "boolean") {
      return raw ? "1" : "0";
    }

    return String(raw);
  }, [category.cat_status]);

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

  const initialAccountForm = useMemo(
    () => mapAccountToFormState(initialCategoryAccount),
    [initialCategoryAccount],
  );
  const [accountForm, setAccountForm] =
    useState<CategoryAccountFormState>(initialAccountForm);
  const [, setAccountFormSnapshot] =
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

  const handleSave = async () => {
    if (!category.cat_name || !category.cat_name_e) {
      toast.error(t("messages.requiredFields"));

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
            console.error(t("messages.accountsSaveErrorGeneric"), error);
          }

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
            console.error(t("messages.accountsSaveErrorGeneric"), error);
            toast.error(t("messages.accountsSaveErrorGeneric"));

            return;
          }
        }

        toast.success(
          isAddMode ? t("messages.addSuccess") : t("messages.updateSuccess"),
        );
        router.push("/basic/categories");
        router.refresh();
      } else {
        toast.error(t("messages.operationFailed"));
      }
    } catch (error) {
      console.error(t("messages.saveError"), error);
      toast.error(t("messages.saveError"));
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
    if (isViewMode)
      return t("titles.view", {
        name: category.cat_name || t("titles.defaultName"),
      });
    if (isAddMode) return t("titles.add");

    return t("titles.edit", {
      name: category.cat_name || t("titles.defaultName"),
    });
  };

  const getDescription = () => {
    if (isViewMode) return t("descriptions.view");
    if (isAddMode) return t("descriptions.add");

    return t("descriptions.edit");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
          <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
        </div>
        <div className={FORM_ACTIONS.wrapper}>
          <Button
            size={FORM_ACTIONS.size}
            startContent={<ArrowLeftIcon className={FORM_ACTIONS.back.iconSize} />}
            variant={FORM_ACTIONS.back.variant}
            onPress={() => router.push("/basic/categories")}
          >
            {t("actions.back")}
          </Button>
          {isViewMode && (
            <Button
              size={FORM_ACTIONS.size}
              color={FORM_ACTIONS.edit.color}
              variant={FORM_ACTIONS.edit.variant}
              onPress={handleEdit}
            >
              {t("actions.edit")}
            </Button>
          )}
          {!isViewMode && (
            <Button
              size={FORM_ACTIONS.size}
              color={FORM_ACTIONS.save.color}
              className={FORM_ACTIONS.save.className}
              startContent={<CheckCircleIcon className={FORM_ACTIONS.save.iconSize} />}
              isLoading={isSaving}
              onPress={handleSave}
            >
              {isAddMode ? t("actions.save") : t("actions.update")}
            </Button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          isRequired
          isDisabled={isViewMode}
          label={t("fields.catName")}
          value={category.cat_name || ""}
          onChange={(e) =>
            setCategory({ ...category, cat_name: e.target.value })
          }
        />
        <Input
          isRequired
          isDisabled={isViewMode}
          label={t("fields.catNameEn")}
          value={category.cat_name_e || ""}
          onChange={(e) =>
            setCategory({ ...category, cat_name_e: e.target.value })
          }
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.k")}
          value={category.k || ""}
          onChange={(e) => setCategory({ ...category, k: e.target.value })}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.purity")}
          value={category.purity || ""}
          onChange={(e) => setCategory({ ...category, purity: e.target.value })}
        />
        <Select
          isDisabled={isViewMode}
          label={t("fields.box")}
          selectedKeys={category.box !== null ? [String(category.box)] : []}
          onSelectionChange={(keys) => {
            const id = Number(Array.from(keys)[0]);

            setCategory({ ...category, box: id });
          }}
        >
          {boxes.map((b) => (
            <SelectItem key={b.id} textValue={b.cust_name}>
              {b.cust_name}
            </SelectItem>
          ))}
        </Select>
        <Input
          isDisabled={isViewMode}
          label={t("fields.tax")}
          type="number"
          value={String(category.tax || 0)}
          onChange={(e) =>
            setCategory({
              ...category,
              tax: parseFloat(e.target.value) || 0,
            })
          }
        />
        <Select
          isDisabled={isViewMode}
          label={t("fields.catType")}
          selectedKeys={category.cat_type ? [String(category.cat_type)] : []}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0];

            setCategory({ ...category, cat_type: value ? String(value) : "" });
          }}
        >
          {catTypes.map((ct) => (
            <SelectItem key={ct.code_id} textValue={ct.code_desc}>
              {ct.code_desc}
            </SelectItem>
          ))}
        </Select>
        <Select
          isDisabled={isViewMode}
          label={t("fields.catStatus")}
          selectedKeys={normalizedCatStatusValue ? [normalizedCatStatusValue] : []}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0];

            setCategory({
              ...category,
              cat_status: value ? String(value) : null,
            });
          }}
        >
          {catStatuses.map((cs) => (
            <SelectItem key={String(cs.code_id)} textValue={cs.code_desc}>
              {cs.code_desc}
            </SelectItem>
          ))}
        </Select>
        <div className="md:col-span-2 flex gap-4">
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(category.tax_type)}
            onValueChange={(val) => setCategory({ ...category, tax_type: val })}
            classNames={{
              wrapper: "after:bg-blue-500 after:text-white",
              icon: "text-white",
            }}
          >
            {t("fields.taxType")}
          </Checkbox>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("labels.categoryAccounts")}
            </h3>
            <p className="text-sm text-gray-500">{t("sections.accountNote")}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="grid grid-cols-3 bg-gray-50 text-sm font-semibold text-gray-700">
            <div className="border-l border-gray-200 px-4 py-2">
              {t("labels.accounts")}
            </div>
            <div className="border-l border-gray-200 px-4 py-2">
              {t("labels.value")}
            </div>
            <div className="px-4 py-2">{t("labels.wages")}</div>
          </div>

          <div className="divide-y divide-gray-100">
            {ACCOUNT_ROWS.map(({ label, valueKey, wageKey }) => {
              const valueSelected = accountForm[valueKey] ?? "";
              const wageSelected = wageKey ? (accountForm[wageKey] ?? "") : "";

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
                const isWageColumn = column === "wage";
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
                      selectorButton:
                        isWageColumn
                          ? "bg-amber-100 border-amber-300"
                          : "bg-white border-gray-200",
                      listbox: "text-right",
                    }}
                    inputValue={getAccountDisplayValue(text)}
                    items={filteredOptions}
                    menuTrigger="input"
                    placeholder={t("labels.accountPlaceholder")}
                    popoverProps={{
                      placement: isWageColumn ? "bottom-start" : "bottom-end",
                      containerPadding: 12,
                      classNames: {
                        content: "max-w-[calc(100vw-2rem)] min-w-[12rem]",
                      },
                    }}
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
                        showDivider={false}
                        textValue={option.label}
                      >
                        <span className="block max-w-full truncate text-sm font-medium text-gray-800">
                          {option.name}
                        </span>
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

        {!isViewMode && (
          <div className="mt-3 text-xs text-gray-500">
            {t("sections.accountNote")}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryFormClient;
