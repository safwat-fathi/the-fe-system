"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useLocale, useTranslations } from "next-intl";

import { findAccountById, flattenAccountTree } from "../utils/account-tree";

import { FORM_ACTIONS } from "@/constants/ui";
import { getLocaleDir } from "@/i18n/config";
import accountService from "@/services/api/account.service";
import {
  revalidateTableData,
  revalidatePagePath,
} from "@/app/actions/revalidate.action";
import { Account } from "@/types/models/account";
import { Currency } from "@/types/models/currency";

type AccountFormMode = "add" | "edit" | "view";

type AccountFormClientProps = {
  mode: AccountFormMode;
  accounts: Account[];
  currencies: Currency[];
  initialAccount: Partial<Account>;
  parentId?: number | null;
  suggestedAccId?: string;
  /** معرّفات العقد المفتوحة في الشجرة عند الرجوع للقائمة */
  returnExpandedIds?: number[];
  /** معرّف الحساب المختار عند الرجوع للقائمة */
  returnSelectedId?: number | null;
};

type AccountFormState = {
  id?: number;
  acc_id: string;
  acc_name: string;
  acc_name_e: string;
  acc_type: number;
  parent: number | null;
  acc_kind: number;
  acc_rep: number;
  acc_digit: number;
  acc_priv: number;
  acc_cat: number;
  acc_notes: string;
  cur: number;
  acc_level: number;
};

const ACCOUNT_TYPES = {
  1: "main",
  2: "sub",
} as const;

const REPORT_TYPES_KEYS = {
  1: "profitLoss",
  2: "balanceSheet",
} as const;

const AccountFormClient = ({
  mode,
  accounts,
  currencies,
  initialAccount,
  parentId,
  suggestedAccId,
  returnExpandedIds,
  returnSelectedId,
}: AccountFormClientProps) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("basic.accounts");
  const dir = getLocaleDir(locale as "ar" | "en");
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  const flattenedAccounts = useMemo(
    () => flattenAccountTree(accounts),
    [accounts],
  );

  const resolvedParentId = useMemo(() => {
    if (typeof parentId === "number") {
      return parentId;
    }

    if (typeof initialAccount.parent === "number") {
      return initialAccount.parent;
    }

    return null;
  }, [initialAccount.parent, parentId]);

  const resolvedParentAccount = useMemo(() => {
    if (resolvedParentId === null) {
      return null;
    }

    return findAccountById(accounts, resolvedParentId) ?? null;
  }, [accounts, resolvedParentId]);

  const initialState: AccountFormState = {
    id: initialAccount.id,
    acc_id: initialAccount.acc_id || suggestedAccId || "",
    acc_name: isAddMode ? "" : (initialAccount.acc_name || ""),
    acc_name_e: isAddMode ? "" : (initialAccount.acc_name_e || ""),
    acc_type: initialAccount.acc_type || (resolvedParentAccount ? 2 : 1),
    parent: resolvedParentAccount ? resolvedParentAccount.id : null,
    acc_kind: initialAccount.acc_kind ?? 1,
    acc_rep: initialAccount.acc_rep ?? 1,
    acc_digit: initialAccount.acc_digit ?? 4,
    acc_priv: initialAccount.acc_priv ?? 1,
    acc_cat: initialAccount.acc_cat ?? 1,
    acc_notes: initialAccount.acc_notes || "",
    cur: initialAccount.cur ?? currencies[0]?.id ?? 1,
    acc_level:
      initialAccount.acc_level ??
      (resolvedParentAccount ? resolvedParentAccount.acc_level + 1 : 1),
  };

  const [formData, setFormData] = useState<AccountFormState>(initialState);
  const [isSaving, setIsSaving] = useState(false);

  const excludedParentIds = useMemo(() => {
    if (!formData.id) {
      return new Set<number>();
    }

    const target = findAccountById(accounts, formData.id);

    if (!target) {
      return new Set<number>([formData.id]);
    }

    const collectDescendants = (
      node: Account | undefined,
      acc: number[],
    ): number[] => {
      if (!node || !node.children) {
        return acc;
      }

      return node.children.reduce((result, child) => {
        result.push(child.id);

        return collectDescendants(child, result);
      }, acc);
    };

    const descendants = collectDescendants(target, [target.id]);

    return new Set<number>(descendants);
  }, [accounts, formData.id]);

  const parentOptions = useMemo(() => {
    const options = flattenedAccounts
      .filter((account) => !excludedParentIds.has(account.id))
      .map((account) => {
        const name =
          locale === "en"
            ? (account.acc_name_e || account.acc_name)
            : account.acc_name;

        return {
          id: account.id,
          label: `${"— ".repeat(Math.max(account.acc_level - 1, 0))}${name}`,
        };
      });

    return options;
  }, [excludedParentIds, flattenedAccounts, locale]);

  const parentSelectItems = useMemo(
    () => [
      { id: "null", label: t("form.parentOptionRoot") },
      ...parentOptions.map((option) => ({
        id: String(option.id),
        label: option.label,
      })),
    ],
    [parentOptions, t],
  );

  const handleParentChange = (newParentId: number | null) => {
    const parentAccount =
      newParentId !== null ? findAccountById(accounts, newParentId) : null;

    if (parentAccount && parentAccount.acc_level >= 5) {
      toast.error(t("messages.maxLevelForm"));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      parent: parentAccount ? parentAccount.id : null,
      acc_type: parentAccount ? 2 : 1,
      acc_level: parentAccount ? parentAccount.acc_level + 1 : 1,
    }));
  };

  const validateForm = () => {
    if (!formData.acc_id.trim()) {
      toast.error(t("messages.accountNumberRequired"));

      return false;
    }

    if (!formData.acc_name.trim()) {
      toast.error(t("messages.accountNameRequired"));

      return false;
    }

    const normalizedLevel = Number.isFinite(formData.acc_level)
      ? formData.acc_level
      : 1;

    if (normalizedLevel < 1 || normalizedLevel > 5) {
      toast.error(t("messages.maxLevelForm"));

      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const normalizedLevel = Math.min(
        5,
        Math.max(1, Number.isFinite(formData.acc_level) ? formData.acc_level : 1),
      );

      const payload = {
        acc_id: formData.acc_id,
        acc_code: initialAccount.acc_code ?? formData.acc_id,
        acc_name: formData.acc_name,
        acc_name_e: formData.acc_name_e || "Unnamed Account",
        acc_type: formData.acc_type,
        parent: formData.parent,
        acc_kind: formData.acc_kind,
        acc_rep: formData.acc_rep,
        acc_digit: formData.acc_digit,
        acc_priv: formData.acc_priv,
        acc_cat: formData.acc_cat,
        acc_notes: formData.acc_notes,
        cur: formData.cur,
        cost: initialAccount.cost ?? formData.cur ?? 1,
        acc_level: normalizedLevel,
      } as Omit<Account, "id"> & { id?: number; cost?: number };

      let result: Account | null = null;

      if (isAddMode) {
        result = await accountService.createAccount(payload);
      } else if (isEditMode && formData.id) {
        result = await accountService.updateAccount(formData.id, {
          ...payload,
          id: formData.id,
        });
      }

      if (!result) {
        toast.error(t("messages.saveError"));

        return;
      }

      await revalidateTableData("accounts_list");
      await revalidatePagePath("/basic/accounts");

      toast.success(
        isAddMode ? t("messages.saveSuccessAdd") : t("messages.saveSuccessUpdate"),
      );
      handleBackToList();
      router.refresh();
    } catch (error) {
      console.error("Error saving account", error);
      toast.error(t("messages.connectionError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    if (!formData.id) {
      return;
    }

    router.push(`/basic/accounts/${formData.id}?mode=edit`);
  };

  const handleBackToList = () => {
    const params = new URLSearchParams();

    if (returnExpandedIds?.length) {
      params.set("expanded", returnExpandedIds.join(","));
    }

    if (returnSelectedId != null && returnSelectedId > 0) {
      params.set("selected", String(returnSelectedId));
    }

    const query = params.toString();

    router.push(query ? `/basic/accounts?${query}` : "/basic/accounts");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className={textAlign}>
          <h2 className={`text-xl font-bold text-gray-900 ${textAlign}`}>
            {isViewMode
              ? `${t("form.titleView")} ${initialAccount.acc_name || initialAccount.acc_id || t("form.accountFallback")}`
              : isAddMode
                ? t("form.titleAdd")
                : `${t("form.titleEdit")} ${initialAccount.acc_name || initialAccount.acc_id || t("form.accountFallback")}`}
          </h2>
          <p className={`text-sm text-gray-600 mt-1 ${textAlign}`}>
            {isViewMode
              ? t("form.subtitleView")
              : isAddMode
                ? t("form.subtitleAdd")
                : t("form.subtitleEdit")}
          </p>
        </div>
        <div className={`${FORM_ACTIONS.wrapper} ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
          <Button
            size={FORM_ACTIONS.size}
            startContent={<ArrowLeftIcon className={FORM_ACTIONS.back.iconSize} />}
            variant={FORM_ACTIONS.back.variant}
            onPress={handleBackToList}
          >
            {t("form.backToList")}
          </Button>
          {isViewMode ? (
            <Button
              size={FORM_ACTIONS.size}
              color={FORM_ACTIONS.edit.color}
              variant={FORM_ACTIONS.edit.variant}
              startContent={<PencilSquareIcon className={FORM_ACTIONS.back.iconSize} />}
              onPress={handleEdit}
            >
              {t("form.edit")}
            </Button>
          ) : (
            <Button
              size={FORM_ACTIONS.size}
              color={FORM_ACTIONS.save.color}
              className={FORM_ACTIONS.save.className}
              startContent={<CheckCircleIcon className={FORM_ACTIONS.save.iconSize} />}
              isLoading={isSaving}
              onPress={handleSave}
            >
              {isAddMode ? t("form.save") : t("form.update")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          fullWidth
          isRequired
          isDisabled={isViewMode}
          label={t("form.accountNumber")}
          value={formData.acc_id}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, acc_id: e.target.value }))
          }
        />

        <Input
          fullWidth
          isRequired
          isDisabled={isViewMode}
          label={t("form.accountName")}
          value={formData.acc_name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, acc_name: e.target.value }))
          }
        />

        <Input
          fullWidth
          isDisabled={isViewMode}
          label={t("form.accountNameEn")}
          value={formData.acc_name_e}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, acc_name_e: e.target.value }))
          }
        />

        <Select
          isDisabled={isViewMode}
          items={parentSelectItems}
          label={t("form.parentAccount")}
          placeholder={t("form.parentPlaceholder")}
          selectedKeys={
            formData.parent !== null ? [String(formData.parent)] : ["null"]
          }
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0];

            if (key === "null" || !key) {
              handleParentChange(null);
            } else {
              const parsed = Number(key);

              handleParentChange(Number.isNaN(parsed) ? null : parsed);
            }
          }}
        >
          {(item) => (
            <SelectItem key={item.id} textValue={item.label}>
              {item.label}
            </SelectItem>
          )}
        </Select>

        <Select
          isDisabled={isViewMode}
          label={t("fields.accountType")}
          selectedKeys={[String(formData.acc_type)]}
          onSelectionChange={(keys) => {
            const key = Number(Array.from(keys)[0]);

            setFormData((prev) => ({
              ...prev,
              acc_type: key,
            }));
          }}
        >
          {Object.entries(ACCOUNT_TYPES).map(([key, typeKey]) => (
            <SelectItem key={key}>{t(`types.${typeKey}`)}</SelectItem>
          ))}
        </Select>

        <Select
          isDisabled={isViewMode}
          label={t("form.reportType")}
          selectedKeys={[String(formData.acc_rep)]}
          onSelectionChange={(keys) => {
            const value = Number(Array.from(keys)[0]);

            setFormData((prev) => ({
              ...prev,
              acc_rep: value,
            }));
          }}
        >
          {Object.entries(REPORT_TYPES_KEYS).map(([key, reportKey]) => (
            <SelectItem key={key}>{t(`reportTypes.${reportKey}`)}</SelectItem>
          ))}
        </Select>

        <Select
          isDisabled={isViewMode}
          label={t("form.currency")}
          selectedKeys={[String(formData.cur)]}
          onSelectionChange={(keys) => {
            const value = Number(Array.from(keys)[0]);

            setFormData((prev) => ({
              ...prev,
              cur: value,
            }));
          }}
        >
          {currencies.map((currency) => {
            const displayName =
              locale === "en"
                ? (currency.cur_name_e || currency.cur_name)
                : currency.cur_name;

            return (
              <SelectItem key={currency.id} textValue={displayName}>
                {displayName}
              </SelectItem>
            );
          })}
        </Select>

        <Input
          isDisabled={isViewMode}
          label={t("form.decimalPlaces")}
          type="number"
          value={String(formData.acc_digit)}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              acc_digit: Number(e.target.value || 0),
            }))
          }
        />

        <Input
          isDisabled={isViewMode}
          label={t("form.accountLevel")}
          type="number"
          min={1}
          max={5}
          value={String(formData.acc_level)}
          onChange={(e) => {
            const value = Number(e.target.value);

            setFormData((prev) => ({
              ...prev,
              acc_level: Number.isFinite(value) ? value : prev.acc_level,
            }));
          }}
        />
      </div>

      <Textarea
        isDisabled={isViewMode}
        label={t("form.notes")}
        minRows={3}
        placeholder={t("form.notesPlaceholder")}
        value={formData.acc_notes}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, acc_notes: e.target.value }))
        }
      />
    </div>
  );
};

export default AccountFormClient;
