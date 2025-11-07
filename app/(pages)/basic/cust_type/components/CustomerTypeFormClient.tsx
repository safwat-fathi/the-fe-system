"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Checkbox } from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

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
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [type, setType] = useState<Partial<CustomerType>>(initialType);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!type.type_name || !type.type_name_e) {
      toast.error("❌ يجب ملء جميع الحقول المطلوبة");
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
          isAddMode ? "✅ تم إضافة النوع بنجاح" : "✅ تم تعديل النوع بنجاح",
        );
        router.push("/basic/cust_type");
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
    router.push(`/basic/cust_type/${type.id}?mode=edit`);
  };

  const getTitle = () => {
    if (isViewMode) return `عرض ${type.type_name || "نوع العميل"}`;
    if (isAddMode) return "إضافة نوع عميل جديد";
    return `تعديل ${type.type_name || "نوع العميل"}`;
  };

  const getDescription = () => {
    if (isViewMode) return "عرض تفاصيل نوع العميل";
    if (isAddMode) return "قم بإضافة نوع عميل جديد إلى النظام";
    return "قم بتعديل بيانات نوع العميل";
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
                onPress={() => router.push("/basic/cust_type")}
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
          label="نوع العميل"
          value={type.type_name || ""}
          onChange={(e) =>
            setType({ ...type, type_name: e.target.value })
          }
          isRequired
        />
        <Input
          isDisabled={isViewMode}
          label="نوع العميل بالإنجليزي"
          value={type.type_name_e || ""}
          onChange={(e) =>
            setType({ ...type, type_name_e: e.target.value })
          }
          isRequired
        />
        <Input
          isDisabled={isViewMode}
          label="الوصف"
          value={type.type_desc || ""}
          onChange={(e) =>
            setType({ ...type, type_desc: e.target.value })
          }
          className="md:col-span-2"
        />
        <Input
          isDisabled={true}
          label="تاريخ الإنشاء"
          value={type.cr_date || ""}
          className="md:col-span-2"
        />
        <div className="md:col-span-2">
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(type.type_status)}
            onValueChange={(val) =>
              setType({ ...type, type_status: val })
            }
          >
            الحالة مفعلة
          </Checkbox>
        </div>
      </div>
    </div>
  );
};

export default CustomerTypeFormClient;

