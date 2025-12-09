"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Checkbox } from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import customerTypeService from "@/services/api/customer-type.service";

type CustomerTypeFormMode = "view" | "edit" | "add";

interface CustomerType {
  id: number;
  type_name: string;
  type_name_e: string;
  type_desc: string;
  cr_date: string;
  type_status: boolean;
}

interface CustomerTypeFormClientProps {
  mode: CustomerTypeFormMode;
  initialType: Partial<CustomerType>;
}

const CustomerTypeFormClient = ({
  mode,
  initialType,
}: CustomerTypeFormClientProps) => {
  const router = useRouter();
  const t = useTranslations("basic.customerTypes" as any) as any;
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [type, setType] = useState<Partial<CustomerType>>(initialType);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!type.type_name || !type.type_name_e) {
      toast.error(t("messages.requiredFields"));

      return;
    }

    setIsSaving(true);

    try {
      let result: CustomerType | null = null;

      if (isAddMode) {
        result = await customerTypeService.createCustomerType(
          type as Omit<CustomerType, "id">,
        );
      } else if (type.id) {
        result = await customerTypeService.updateCustomerType(type.id, type);
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
    if (isViewMode)
      return t("titles.view", {
        name: type.type_name || t("titles.defaultName"),
      });
    if (isAddMode) return t("titles.add");

    return t("titles.edit", {
      name: type.type_name || t("titles.defaultName"),
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
        <div className="flex gap-2">
          <Button
            variant="light"
            onPress={() => router.push("/basic/cust_type")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {t("actions.back")}
          </Button>
          {isViewMode && (
            <Button color="primary" onPress={handleEdit}>
              {t("actions.edit")}
            </Button>
          )}
          {!isViewMode && (
            <>
              <Button
                variant="light"
                onPress={() => router.push("/basic/cust_type")}
              >
                {t("actions.cancel")}
              </Button>
              <Button color="success" isLoading={isSaving} onPress={handleSave}>
                {isAddMode ? t("actions.save") : t("actions.update")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          isRequired
          isDisabled={isViewMode}
          label={t("fields.typeName")}
          value={type.type_name || ""}
          onChange={(e) => setType({ ...type, type_name: e.target.value })}
        />
        <Input
          isRequired
          isDisabled={isViewMode}
          label={t("fields.typeNameEn")}
          value={type.type_name_e || ""}
          onChange={(e) => setType({ ...type, type_name_e: e.target.value })}
        />
        <Input
          className="md:col-span-2"
          isDisabled={isViewMode}
          label={t("fields.typeDesc")}
          value={type.type_desc || ""}
          onChange={(e) => setType({ ...type, type_desc: e.target.value })}
        />
        <Input
          className="md:col-span-2"
          isDisabled={true}
          label={t("fields.crDate")}
          value={type.cr_date || ""}
        />
        <div className="md:col-span-2">
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(type.type_status)}
            onValueChange={(val) => setType({ ...type, type_status: val })}
          >
            {t("fields.typeStatus")}
          </Checkbox>
        </div>
      </div>
    </div>
  );
};

export default CustomerTypeFormClient;
