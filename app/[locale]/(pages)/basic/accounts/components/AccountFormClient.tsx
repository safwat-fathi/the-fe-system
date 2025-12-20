"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useLocale } from "next-intl";

import {
  findAccountById,
  flattenAccountTree,
  generateAccountId,
} from "../utils/account-tree";

import { getLocaleDir } from "@/i18n/config";
import accountService from "@/services/api/account.service";
import { revalidateTableData } from "@/app/actions/revalidate.action";
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

const REPORT_TYPES = {
  1: "الأرباح والخسائر",
  2: "الميزانية العمومية",
} as const;

const ACCOUNT_TYPES = {
  1: "رئيسي",
  2: "فرعي",
} as const;

const AccountFormClient = ({
  mode,
  accounts,
  currencies,
  initialAccount,
  parentId,
  suggestedAccId,
}: AccountFormClientProps) => {
  const router = useRouter();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  // Dynamic text alignment classes based on locale
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
    acc_name: initialAccount.acc_name || "",
    acc_name_e: initialAccount.acc_name_e || "",
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
      .map((account) => ({
        id: account.id,
        label: `${"— ".repeat(Math.max(account.acc_level - 1, 0))}${account.acc_name}`,
      }));

    return options;
  }, [excludedParentIds, flattenedAccounts]);

  // Merge a static "no parent" option with computed options to use with Select's items API
  const parentSelectItems = useMemo(
    () => [
      { id: "null", label: "حساب رئيسي (بدون أب)" },
      ...parentOptions.map((option) => ({
        id: String(option.id),
        label: option.label,
      })),
    ],
    [parentOptions],
  );

  const handleParentChange = (newParentId: number | null) => {
    const parentAccount =
      newParentId !== null ? findAccountById(accounts, newParentId) : null;

    if (parentAccount && parentAccount.acc_level >= 5) {
      toast.error("لا يمكن إضافة حسابات تتجاوز المستوى الخامس.");

      return;
    }

    setFormData((prev) => ({
      ...prev,
      parent: parentAccount ? parentAccount.id : null,
      acc_type: parentAccount ? 2 : 1,
      acc_level: parentAccount ? parentAccount.acc_level + 1 : 1,
    }));
  };

  const handleGenerateAccountId = () => {
    const parentAccountId = formData.parent;

    if (parentAccountId) {
      const parentAccount = findAccountById(accounts, parentAccountId);

      if (parentAccount && parentAccount.acc_level >= 5) {
        toast.error("لا يمكن إضافة حسابات جديدة تحت المستوى الخامس.");

        return;
      }

      const siblings = flattenedAccounts.filter(
        (account) => account.parent === parentAccountId,
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

    const generatedId = generateAccountId(accounts, parentAccountId);

    if (!generatedId) {
      toast.error("تعذر توليد رقم حساب مناسب. الرجاء التحقق من المعطيات.");

      return;
    }

    setFormData((prev) => ({
      ...prev,
      acc_id: generatedId,
    }));
    toast.success("تم توليد رقم حساب مقترح.");
  };

  const validateForm = () => {
    if (!formData.acc_id.trim()) {
      toast.error("رقم الحساب مطلوب.");

      return false;
    }

    if (!formData.acc_name.trim()) {
      toast.error("اسم الحساب مطلوب.");

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
      const payload = {
        acc_id: formData.acc_id,
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
        acc_level: formData.parent
          ? (findAccountById(accounts, formData.parent)?.acc_level ?? 0) + 1
          : 1,
      } as Omit<Account, "id"> & { id?: number };

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
        toast.error("حدث خطأ أثناء حفظ الحساب.");

        return;
      }

      await revalidateTableData("accounts_list");

      toast.success(
        isAddMode ? "تمت إضافة الحساب بنجاح" : "تم تحديث الحساب بنجاح",
      );
      router.push("/basic/accounts");
      router.refresh();
    } catch (error) {
      console.error("Error saving account", error);
      toast.error("حدث خطأ أثناء الاتصال بالخادم.");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className={textAlign}>
          <h2 className={`text-xl font-bold text-gray-900 ${textAlign}`}>
            {isViewMode
              ? `عرض ${initialAccount.acc_name || initialAccount.acc_id || "الحساب"}`
              : isAddMode
                ? "إضافة حساب جديد"
                : `تعديل ${initialAccount.acc_name || initialAccount.acc_id || "الحساب"}`}
          </h2>
          <p className={`text-sm text-gray-600 mt-1 ${textAlign}`}>
            {isViewMode
              ? "استعراض تفاصيل الحساب المحدد"
              : isAddMode
                ? "قم بتعبئة البيانات لإضافة حساب جديد إلى دليل الحسابات"
                : "قم بتعديل بيانات الحساب وتحديثها"}
          </p>
        </div>
        <div className={`flex flex-wrap items-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
          <Button
            variant="light"
            onPress={() => {
              router.push("/basic/accounts");
            }}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            عودة للقائمة
          </Button>
          {isViewMode ? (
            <Button color="primary" onPress={handleEdit}>
              <PencilSquareIcon className="h-4 w-4" />
              تعديل
            </Button>
          ) : (
            <>
              <Button
                variant="light"
                onPress={() => router.push("/basic/accounts")}
              >
                إلغاء
              </Button>
              <Button color="success" isLoading={isSaving} onPress={handleSave}>
                {isAddMode ? "حفظ" : "تحديث"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex gap-2">
          <Input
            fullWidth
            isRequired
            isDisabled={isViewMode}
            label="رقم الحساب"
            value={formData.acc_id}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, acc_id: e.target.value }))
            }
          />
          {isViewMode ? null : (
            <Button
              isIconOnly
              className="mt-6"
              title="توليد رقم حساب"
              variant="bordered"
              onPress={handleGenerateAccountId}
            >
              <ArrowPathIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Input
          fullWidth
          isRequired
          isDisabled={isViewMode}
          label="اسم الحساب"
          value={formData.acc_name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, acc_name: e.target.value }))
          }
        />

        <Input
          fullWidth
          isDisabled={isViewMode}
          label="اسم الحساب (بالإنجليزي)"
          value={formData.acc_name_e}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, acc_name_e: e.target.value }))
          }
        />

        <Select
          isDisabled={isViewMode}
          items={parentSelectItems}
          label="الحساب الأب"
          placeholder="اختر الحساب الأب"
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
          label="نوع الحساب"
          selectedKeys={[String(formData.acc_type)]}
          onSelectionChange={(keys) => {
            const key = Number(Array.from(keys)[0]);

            setFormData((prev) => ({
              ...prev,
              acc_type: key,
            }));
          }}
        >
          {Object.entries(ACCOUNT_TYPES).map(([key, label]) => (
            <SelectItem key={key}>{label}</SelectItem>
          ))}
        </Select>

        <Select
          isDisabled={isViewMode}
          label="نوع التقرير"
          selectedKeys={[String(formData.acc_rep)]}
          onSelectionChange={(keys) => {
            const value = Number(Array.from(keys)[0]);

            setFormData((prev) => ({
              ...prev,
              acc_rep: value,
            }));
          }}
        >
          {Object.entries(REPORT_TYPES).map(([key, label]) => (
            <SelectItem key={key}>{label}</SelectItem>
          ))}
        </Select>

        <Select
          isDisabled={isViewMode}
          label="العملة"
          selectedKeys={[String(formData.cur)]}
          onSelectionChange={(keys) => {
            const value = Number(Array.from(keys)[0]);

            setFormData((prev) => ({
              ...prev,
              cur: value,
            }));
          }}
        >
          {currencies.map((currency) => (
            <SelectItem key={currency.id} textValue={currency.cur_name}>
              {currency.cur_name}
            </SelectItem>
          ))}
        </Select>

        <Input
          isDisabled={isViewMode}
          label="عدد الخانات العشرية"
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
          isDisabled
          label="مستوى الحساب"
          value={String(formData.acc_level)}
        />
      </div>

      <Textarea
        isDisabled={isViewMode}
        label="الملاحظات"
        minRows={3}
        placeholder="أدخل أي ملاحظات إضافية"
        value={formData.acc_notes}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, acc_notes: e.target.value }))
        }
      />
    </div>
  );
};

export default AccountFormClient;
