"use client";

import type { Account } from "@/types/models/account";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";

import { FORM_ACTIONS } from "@/constants/ui";
import customerTypeService, {
  type CustomerType,
  type CustTypeStatusOption,
} from "@/services/api/customer-type.service";

type CustomerTypeFormMode = "view" | "edit" | "add";

interface CustomerTypeFormClientProps {
  mode: CustomerTypeFormMode;
  initialType: Partial<CustomerType>;
  statusOptions: CustTypeStatusOption[];
  accounts: Account[];
}

const CustomerTypeFormClient = ({
  mode,
  initialType,
  statusOptions,
  accounts,
}: CustomerTypeFormClientProps) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("basic.customerTypes" as any) as any;
  const safeT = (key: string, fallback: string) =>
    typeof t.has === "function" && t.has(key) ? t(key) : fallback;
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";

  const [type, setType] = useState<Partial<CustomerType>>(initialType);
  const [isSaving, setIsSaving] = useState(false);

  const displayName =
    type.type_name || type.type_name_e || t("titles.defaultName");

  const handleSave = async () => {
    const name = type.type_name?.trim() || type.type_name_e?.trim();

    if (!name) {
      toast.error(t("messages.requiredFields"));

      return;
    }

    setIsSaving(true);

    const payload = {
      ...type,
      type_name: name,
      type_name_e: name,
    };

    try {
      let result: CustomerType | null = null;

      if (isAddMode) {
        result = await customerTypeService.createCustomerType(
          payload as Omit<CustomerType, "id">,
        );
      } else if (type.id) {
        result = await customerTypeService.updateCustomerType(type.id, payload);
      }

      if (result) {
        toast.success(
          isAddMode ? t("messages.addSuccess") : t("messages.updateSuccess"),
        );
        router.push("/basic/cust_type");
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
    router.push(`/basic/cust_type/${type.id}?mode=edit`);
  };

  const getTitle = () => {
    if (isViewMode) return t("titles.view", { name: displayName });
    if (isAddMode) return t("titles.add");

    return t("titles.edit", { name: displayName });
  };

  const getDescription = () => {
    if (isViewMode) return t("descriptions.view");
    if (isAddMode) return t("descriptions.add");

    return t("descriptions.edit");
  };

  return (
    <div className="space-y-4">
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
            onPress={() => router.push("/basic/cust_type")}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          isRequired
          isDisabled={isViewMode}
          label={t("fields.typeName")}
          value={type.type_name || type.type_name_e || ""}
          onChange={(e) => {
            const v = e.target.value;

            setType({ ...type, type_name: v, type_name_e: v });
          }}
        />

        <Input
          className="md:col-span-2"
          isDisabled
          label={t("fields.typeDesc")}
          value={type.prefix ?? ""}
          placeholder="—"
        />
        <Input
          className="md:col-span-2"
          isDisabled
          label={t("fields.crDate")}
          value={type.cr_date || ""}
        />
        <div className="md:col-span-2">
          <Select
            isDisabled={isViewMode}
            label={safeT("fields.mainAccount", locale === "ar" ? "الحساب الرئيسي" : "Main Account")}
            placeholder={safeT(
              "fields.mainAccountPlaceholder",
              locale === "ar" ? "اختر الحساب الرئيسي" : "Select main account",
            )}
            selectedKeys={
              type.acc === null || type.acc === undefined
                ? []
                : [String(type.acc)]
            }
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0];

              if (key == null) {
                setType({ ...type, acc: null });

                return;
              }

              const selectedId = Number(key);

              if (Number.isFinite(selectedId)) {
                setType({ ...type, acc: selectedId });
              }
            }}
          >
            {accounts.map((account) => (
              <SelectItem
                key={String(account.id)}
                textValue={`${account.acc_id} - ${locale === "ar" ? account.acc_name : account.acc_name_e || account.acc_name}`}
              >
                {account.acc_id} -{" "}
                {locale === "ar"
                  ? account.acc_name
                  : account.acc_name_e || account.acc_name}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className="md:col-span-2">
          <Select
            isDisabled={isViewMode}
            label={t("fields.typeStatus")}
            selectedKeys={[String(type.type_status ? 1 : 0)]}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0];

              if (key != null)
                setType({ ...type, type_status: Number(key) === 1 });
            }}
          >
            {statusOptions.map((opt) => (
              <SelectItem
                key={String(opt.code_id)}
                textValue={
                  locale === "ar" ? opt.code_desc : opt.code_desc_l
                }
              >
                {locale === "ar" ? opt.code_desc : opt.code_desc_l}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
};

export default CustomerTypeFormClient;
