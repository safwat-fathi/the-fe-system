"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Checkbox } from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import unitService from "@/services/api/unit.service";

type UnitFormMode = "view" | "edit" | "add";

interface Unit {
  id: number;
  unit_name: string;
  unit_name_e: string;
  unit_type: number;
  unit_status: boolean;
  unit_default: boolean;
}

interface UnitFormClientProps {
  mode: UnitFormMode;
  initialUnit: Partial<Unit>;
}

const UnitFormClient = ({ mode, initialUnit }: UnitFormClientProps) => {
  const router = useRouter();
  const t = useTranslations("basic.units" as any) as any;
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [unit, setUnit] = useState<Partial<Unit>>(initialUnit);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!unit.unit_name || !unit.unit_name_e) {
      toast.error(t("messages.requiredFields"));

      return;
    }

    setIsSaving(true);

    try {
      let result: Unit | null = null;

      if (isAddMode) {
        result = await unitService.createUnit(unit as Omit<Unit, "id">);
      } else if (unit.id) {
        result = await unitService.updateUnit(unit.id, unit);
      }

      if (result) {
        toast.success(
          isAddMode ? t("messages.addSuccess") : t("messages.updateSuccess"),
        );
        router.push("/basic/units");
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
    router.push(`/basic/units/${unit.id}?mode=edit`);
  };

  const getTitle = () => {
    if (isViewMode)
      return t("titles.view", {
        name: unit.unit_name || t("titles.defaultName"),
      });
    if (isAddMode) return t("titles.add");

    return t("titles.edit", {
      name: unit.unit_name || t("titles.defaultName"),
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
          <Button variant="light" onPress={() => router.push("/basic/units")}>
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
                onPress={() => router.push("/basic/units")}
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
          label={t("fields.unitName")}
          value={unit.unit_name || ""}
          onChange={(e) => setUnit({ ...unit, unit_name: e.target.value })}
        />
        <Input
          isRequired
          isDisabled={isViewMode}
          label={t("fields.unitNameEn")}
          value={unit.unit_name_e || ""}
          onChange={(e) => setUnit({ ...unit, unit_name_e: e.target.value })}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.unitType")}
          type="number"
          value={unit.unit_type?.toString() || ""}
          onChange={(e) =>
            setUnit({
              ...unit,
              unit_type: parseInt(e.target.value) || 0,
            })
          }
        />
        <div className="md:col-span-2 flex gap-6 items-center">
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(unit.unit_status)}
            onValueChange={(val) => setUnit({ ...unit, unit_status: val })}
          >
            {t("fields.unitStatus")}
          </Checkbox>
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(unit.unit_default)}
            onValueChange={(val) => setUnit({ ...unit, unit_default: val })}
          >
            {t("fields.unitDefault")}
          </Checkbox>
        </div>
      </div>
    </div>
  );
};

export default UnitFormClient;
