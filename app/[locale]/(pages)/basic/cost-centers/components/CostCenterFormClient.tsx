"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, SelectItem, Checkbox } from "@heroui/react";
import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";

import { FORM_ACTIONS } from "@/constants/ui";
import { getLocaleDir } from "@/i18n/config";
import costCenterService from "@/services/api/cost-center.service";
import { revalidateCostCenters } from "@/app/actions/cost-center.action";

type CostCenterFormMode = "view" | "edit" | "add";

interface CostCenter {
  id: number;
  cost_name: string;
  cost_name_e: string;
  cost_type: number;
  cr_date: string;
  cr_user: number | null;
  upd_date: string | null;
  upd_user: number | null;
  cost_status: number;
  acc: number | null;
  parent: number | null;
}

interface Account {
  id: number;
  acc_name: string;
  acc_name_e?: string;
}

interface CostCenterFormClientProps {
  mode: CostCenterFormMode;
  initialCostCenter: Partial<CostCenter>;
  accounts: Account[];
  costCenters: CostCenter[];
}

const CostCenterFormClient = ({
  mode,
  initialCostCenter,
  accounts,
  costCenters,
}: CostCenterFormClientProps) => {
  const router = useRouter();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("basic.costCenters");

  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [costCenter, setCostCenter] =
    useState<Partial<CostCenter>>(initialCostCenter);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!costCenter.cost_name || !costCenter.cost_name_e) {
      toast.error(t("messages.requiredFields"));

      return;
    }

    setIsSaving(true);

    try {
      let result: CostCenter | null = null;

      if (isAddMode) {
        result = await costCenterService.createCostCenter(
          costCenter as Omit<CostCenter, "id">,
        );
      } else if (costCenter.id) {
        result = await costCenterService.updateCostCenter(
          costCenter.id,
          costCenter,
        );
      }

      if (result) {
        await revalidateCostCenters();
        toast.success(
          isAddMode ? t("messages.addSuccess") : t("messages.updateSuccess"),
        );

        router.push("/basic/cost-centers");
        router.refresh();
      } else {
        toast.error(t("messages.operationFailed"));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("messages.saveError");

      console.error("Error saving cost center:", error);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    router.push(`/basic/cost-centers/${costCenter.id}?mode=edit`);
  };

  const getTitle = () => {
    if (isViewMode)
      return t("titles.view", {
        name: costCenter.cost_name || t("titles.defaultName"),
      });
    if (isAddMode) return t("titles.add");

    return t("titles.edit", {
      name: costCenter.cost_name || t("titles.defaultName"),
    });
  };

  const getDescription = () => {
    if (isViewMode) return t("descriptions.view");
    if (isAddMode) return t("descriptions.add");

    return t("descriptions.edit");
  };

  const parentOptions = costCenters.filter((cc) => cc.id !== costCenter.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className={textAlign}>
          <h2 className={`text-xl font-bold text-gray-900 ${textAlign}`}>
            {getTitle()}
          </h2>
          <p className={`text-sm text-gray-600 mt-1 ${textAlign}`}>
            {getDescription()}
          </p>
        </div>
        <div className={FORM_ACTIONS.wrapper}>
          <Button
            size={FORM_ACTIONS.size}
            startContent={<ArrowLeftIcon className={FORM_ACTIONS.back.iconSize} />}
            variant={FORM_ACTIONS.back.variant}
            onPress={() => router.push("/basic/cost-centers")}
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
          label={t("fields.costName")}
          value={costCenter.cost_name || ""}
          onChange={(e) =>
            setCostCenter({ ...costCenter, cost_name: e.target.value })
          }
        />
        <Input
          isRequired
          isDisabled={isViewMode}
          label={t("fields.costNameEn")}
          value={costCenter.cost_name_e || ""}
          onChange={(e) =>
            setCostCenter({ ...costCenter, cost_name_e: e.target.value })
          }
        />
        <Select
          isDisabled={isViewMode}
          label={t("fields.costType")}
          selectedKeys={
            costCenter.cost_type ? [String(costCenter.cost_type)] : []
          }
          onSelectionChange={(keys) => {
            const type = Number(Array.from(keys)[0]);

            setCostCenter({ ...costCenter, cost_type: type });
          }}
        >
          <SelectItem key="1">{t("types.main")}</SelectItem>
          <SelectItem key="2">{t("types.sub")}</SelectItem>
          <SelectItem key="3">{t("types.activity")}</SelectItem>
        </Select>
        <Select
          isDisabled={isViewMode}
          label={t("fields.account")}
          selectedKeys={
            costCenter.acc !== null && costCenter.acc !== undefined
              ? [String(costCenter.acc)]
              : []
          }
          onSelectionChange={(keys) => {
            const accId = Number(Array.from(keys)[0]);

            setCostCenter({ ...costCenter, acc: accId || null });
          }}
        >
          {accounts.map((acc) => (
            <SelectItem key={acc.id} textValue={acc.acc_name}>
              {acc.acc_name}
            </SelectItem>
          ))}
        </Select>
        <Select
          isDisabled={isViewMode}
          label={t("fields.parent")}
          selectedKeys={
            costCenter.parent !== null && costCenter.parent !== undefined
              ? [String(costCenter.parent)]
              : []
          }
          onSelectionChange={(keys) => {
            const parentId = Number(Array.from(keys)[0]);

            setCostCenter({ ...costCenter, parent: parentId || null });
          }}
        >
          {parentOptions.map((cc) => (
            <SelectItem key={cc.id} textValue={cc.cost_name}>
              {cc.cost_name}
            </SelectItem>
          ))}
        </Select>
        <div className="md:col-span-2">
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(costCenter.cost_status)}
            onValueChange={(val) =>
              setCostCenter({ ...costCenter, cost_status: val ? 1 : 0 })
            }
          >
            {t("labels.statusEnabled")}
          </Checkbox>
        </div>
      </div>
    </div>
  );
};

export default CostCenterFormClient;
