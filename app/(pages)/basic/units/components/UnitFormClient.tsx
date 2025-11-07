"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Checkbox } from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

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

const UnitFormClient = ({
  mode,
  initialUnit,
}: UnitFormClientProps) => {
  const router = useRouter();
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [unit, setUnit] = useState<Partial<Unit>>(initialUnit);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!unit.unit_name || !unit.unit_name_e) {
      toast.error("❌ يجب ملء جميع الحقول المطلوبة");
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
          isAddMode ? "✅ تم إضافة الوحدة بنجاح" : "✅ تم تعديل الوحدة بنجاح",
        );
        router.push("/basic/units");
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
    router.push(`/basic/units/${unit.id}?mode=edit`);
  };

  const getTitle = () => {
    if (isViewMode) return `عرض ${unit.unit_name || "الوحدة"}`;
    if (isAddMode) return "إضافة وحدة جديدة";
    return `تعديل ${unit.unit_name || "الوحدة"}`;
  };

  const getDescription = () => {
    if (isViewMode) return "عرض تفاصيل الوحدة";
    if (isAddMode) return "قم بإضافة وحدة جديدة إلى النظام";
    return "قم بتعديل بيانات الوحدة";
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
            onPress={() => router.push("/basic/units")}
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
                onPress={() => router.push("/basic/units")}
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
          label="اسم الوحدة"
          value={unit.unit_name || ""}
          onChange={(e) =>
            setUnit({ ...unit, unit_name: e.target.value })
          }
          isRequired
        />
        <Input
          isDisabled={isViewMode}
          label="اسم الوحدة بالإنجليزي"
          value={unit.unit_name_e || ""}
          onChange={(e) =>
            setUnit({ ...unit, unit_name_e: e.target.value })
          }
          isRequired
        />
        <Input
          isDisabled={isViewMode}
          label="نوع الوحدة"
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
            onValueChange={(val) =>
              setUnit({ ...unit, unit_status: val })
            }
          >
            مفعلة
          </Checkbox>
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(unit.unit_default)}
            onValueChange={(val) =>
              setUnit({ ...unit, unit_default: val })
            }
          >
            افتراضية
          </Checkbox>
        </div>
      </div>
    </div>
  );
};

export default UnitFormClient;

