"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, SelectItem, Checkbox } from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import costCenterService from "@/services/api/cost-center.service";

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

const getCostCenterTypeLabel = (type: number): string => {
  const types: Record<number, string> = {
    1: "مركز تكلفة رئيسي",
    2: "مركز تكلفة فرعي",
    3: "مركز تكلفة نشاط",
  };

  return types[type] || `نوع ${type}`;
};

const CostCenterFormClient = ({
  mode,
  initialCostCenter,
  accounts,
  costCenters,
}: CostCenterFormClientProps) => {
  const router = useRouter();
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [costCenter, setCostCenter] =
    useState<Partial<CostCenter>>(initialCostCenter);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!costCenter.cost_name || !costCenter.cost_name_e) {
      toast.error("❌ يجب ملء جميع الحقول المطلوبة");

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
        toast.success(
          isAddMode
            ? "✅ تم إضافة مركز التكلفة بنجاح"
            : "✅ تم تعديل مركز التكلفة بنجاح",
        );
        router.push("/basic/cost-centers");
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
    router.push(`/basic/cost-centers/${costCenter.id}?mode=edit`);
  };

  const getTitle = () => {
    if (isViewMode) return `عرض ${costCenter.cost_name || "مركز التكلفة"}`;
    if (isAddMode) return "إضافة مركز تكلفة جديد";

    return `تعديل ${costCenter.cost_name || "مركز التكلفة"}`;
  };

  const getDescription = () => {
    if (isViewMode) return "عرض تفاصيل مركز التكلفة";
    if (isAddMode) return "قم بإضافة مركز تكلفة جديد إلى النظام";

    return "قم بتعديل بيانات مركز التكلفة";
  };

  // Filter out current cost center from parent options
  const parentOptions = costCenters.filter((cc) => cc.id !== costCenter.id);

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
            onPress={() => router.push("/basic/cost-centers")}
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
                onPress={() => router.push("/basic/cost-centers")}
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

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          isRequired
          isDisabled={isViewMode}
          label="اسم مركز التكلفة"
          value={costCenter.cost_name || ""}
          onChange={(e) =>
            setCostCenter({ ...costCenter, cost_name: e.target.value })
          }
        />
        <Input
          isRequired
          isDisabled={isViewMode}
          label="الاسم بالإنجليزي"
          value={costCenter.cost_name_e || ""}
          onChange={(e) =>
            setCostCenter({ ...costCenter, cost_name_e: e.target.value })
          }
        />
        <Select
          isDisabled={isViewMode}
          label="نوع المركز"
          selectedKeys={
            costCenter.cost_type ? [String(costCenter.cost_type)] : []
          }
          onSelectionChange={(keys) => {
            const type = Number(Array.from(keys)[0]);

            setCostCenter({ ...costCenter, cost_type: type });
          }}
        >
          <SelectItem key="1" value="1">
            مركز تكلفة رئيسي
          </SelectItem>
          <SelectItem key="2" value="2">
            مركز تكلفة فرعي
          </SelectItem>
          <SelectItem key="3" value="3">
            مركز تكلفة نشاط
          </SelectItem>
        </Select>
        <Select
          isDisabled={isViewMode}
          label="الحساب المرتبط"
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
          label="المركز الأب"
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
            الحالة مفعلة
          </Checkbox>
        </div>
      </div>
    </div>
  );
};

export default CostCenterFormClient;
