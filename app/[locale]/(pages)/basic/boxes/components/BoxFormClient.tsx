"use client";
import type { Box as BoxModel } from "@/types/models/box";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Checkbox } from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ReactSelect from "react-select";
import toast from "react-hot-toast";

import boxService from "@/services/api/box.service";

type BoxFormMode = "view" | "edit" | "add";

// Use shared Box model to avoid type drift
type Box = BoxModel;

interface BoxType {
  id: number;
  code_id: number;
  code_desc: string;
  code_desc_l: string | null;
  type_id: number;
}

interface BoxFormClientProps {
  mode: BoxFormMode;
  initialBox: Partial<Box>;
  boxTypes: BoxType[];
  accounts: any[];
  companyId: number;
}

const BoxFormClient = ({
  mode,
  initialBox,
  boxTypes,
  accounts,
  companyId,
}: BoxFormClientProps) => {
  const router = useRouter();
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [box, setBox] = useState<Partial<Box>>(initialBox);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange =
    (key: keyof Box) => (event: ChangeEvent<HTMLInputElement>) => {
      setBox({
        ...box,
        [key]: event.target.value,
      });
    };

  const handleCheckboxChange = (key: "expt" | "hide") => (value: boolean) => {
    setBox({
      ...box,
      [key]: value,
    });
  };

  const handleSave = async () => {
    if (!box.cust_name) {
      toast.error("⚠️ يرجى إدخال اسم الصندوق");

      return;
    }

    setIsSaving(true);

    try {
      const updatedBox = { ...box };

      if (!updatedBox.cust_code) {
        updatedBox.cust_code = updatedBox.id ? String(updatedBox.id) : "";
      }

      const { ...rest } = updatedBox;
      const normalizeNumberField = (value: unknown): number | undefined => {
        if (value === null || value === undefined || value === "") {
          return undefined;
        }

        const numeric = Number(value);

        return Number.isFinite(numeric) ? numeric : undefined;
      };

      const cleanedBox = {
        ...rest,
        acc: normalizeNumberField(updatedBox.acc),
        vat_no: normalizeNumberField(updatedBox.vat_no),
        cr_no: normalizeNumberField(updatedBox.cr_no),
        perc: normalizeNumberField(updatedBox.perc),
        cust_type: 99, // Boxes are always cust_type = 99
        expt: !!updatedBox.expt,
        hide: !!updatedBox.hide,
        post_code: updatedBox.post_code || "",
        com: companyId,
      };

      let result: Box | null = null;

      if (isAddMode) {
        result = await boxService.createBox(cleanedBox as Omit<Box, "id">);
      } else if (box.id) {
        result = await boxService.updateBox(box.id, cleanedBox);
      }

      if (result) {
        toast.success(
          isAddMode ? "✅ تم إضافة الصندوق بنجاح" : "✅ تم تعديل الصندوق بنجاح",
        );
        router.push("/basic/boxes");
        router.refresh();
      } else {
        toast.error("❌ فشل في العملية");
      }
    } catch (error) {
      let errorMessage = "❌ حدث خطأ أثناء حفظ الصندوق";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      const messages = errorMessage.split("\n");

      if (messages.length > 1) {
        toast.error(messages[0], { duration: 5000 });
        messages.slice(1).forEach((msg) => {
          if (msg.trim()) {
            toast.error(msg.trim(), { duration: 4000 });
          }
        });
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    router.push(`/basic/boxes/${box.id}?mode=edit`);
  };

  const getTitle = () => {
    if (isAddMode) return "إضافة صندوق جديد";
    if (isViewMode) return `عرض ${box.cust_name || box.cust_code || "الصندوق"}`;

    return `تعديل ${box.cust_name || box.cust_code || "الصندوق"}`;
  };

  const getDescription = () => {
    if (isViewMode) return "عرض تفاصيل الصندوق";
    if (isAddMode) return "قم بإضافة صندوق جديد إلى النظام";

    return "قم بتعديل بيانات الصندوق";
  };

  const boxTypeOptions = boxTypes.map((type) => ({
    value: String(type.code_id),
    label: type.code_desc,
  }));

  const accountOptions = accounts.map((acc) => ({
    value: String(acc.id),
    label: acc.acc_name || acc.acc_name_e || `حساب ${acc.id}`,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
          <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="light" onPress={() => router.push("/basic/boxes")}>
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
                onPress={() => router.push("/basic/boxes")}
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
          isDisabled={isViewMode}
          label="كود الصندوق"
          value={(box.cust_code as string) || ""}
          onChange={handleInputChange("cust_code")}
        />
        <Input
          isRequired
          isDisabled={isViewMode}
          label="اسم الصندوق"
          value={box.cust_name || ""}
          onChange={handleInputChange("cust_name")}
        />
        <Input
          isDisabled={isViewMode}
          label="الاسم بالإنجليزي"
          value={box.cust_name_e || ""}
          onChange={handleInputChange("cust_name_e")}
        />
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="box-type"
          >
            نوع الصندوق
          </label>
          <ReactSelect
            className="react-select-container"
            classNamePrefix="react-select"
            id="box-type"
            inputId="box-type"
            isDisabled={isViewMode}
            options={boxTypeOptions}
            placeholder="اختر نوع الصندوق"
            value={boxTypeOptions.find(
              (opt) => opt.value === String(box.box_type),
            )}
            onChange={(selected) =>
              setBox({ ...box, box_type: selected?.value || "" })
            }
          />
        </div>
        <Input
          isDisabled={isViewMode}
          label="الجوال"
          value={box.mobile?.toString() || ""}
          onChange={handleInputChange("mobile")}
        />
        <Input
          isDisabled={isViewMode}
          label="البريد الإلكتروني"
          type="email"
          value={box.email || ""}
          onChange={handleInputChange("email")}
        />
        <Input
          className="md:col-span-2"
          isDisabled={isViewMode}
          label="العنوان"
          value={box.address || ""}
          onChange={handleInputChange("address")}
        />
        <Input
          isDisabled={isViewMode}
          label="المحافظة"
          value={box.gov || ""}
          onChange={handleInputChange("gov")}
        />
        <Input
          isDisabled={isViewMode}
          label="المدينة"
          value={box.city || ""}
          onChange={handleInputChange("city")}
        />
        <Input
          isDisabled={isViewMode}
          label="المنطقة"
          value={box.area || ""}
          onChange={handleInputChange("area")}
        />
        <Input
          isDisabled={isViewMode}
          label="الشارع"
          value={box.street || ""}
          onChange={handleInputChange("street")}
        />
        <Input
          isDisabled={isViewMode}
          label="المبنى"
          value={box.build_no || ""}
          onChange={handleInputChange("build_no")}
        />
        <Input
          isDisabled={isViewMode}
          label="الرمز البريدي"
          value={box.post_code || ""}
          onChange={handleInputChange("post_code")}
        />
        <Input
          isDisabled={isViewMode}
          label="الهاتف"
          value={box.phone || ""}
          onChange={handleInputChange("phone")}
        />
        <Input
          isDisabled={isViewMode}
          label="الفاكس"
          value={box.fax || ""}
          onChange={handleInputChange("fax")}
        />
        <Input
          isDisabled={isViewMode}
          label="المحصل"
          value={box.handling || ""}
          onChange={handleInputChange("handling")}
        />
        <Input
          isDisabled={isViewMode}
          label="المحصل (بالإنجليزي)"
          value={box.handling_e || ""}
          onChange={handleInputChange("handling_e")}
        />
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="box-account"
          >
            الحساب المرتبط
          </label>
          <ReactSelect
            isClearable
            className="react-select-container"
            classNamePrefix="react-select"
            id="box-account"
            inputId="box-account"
            isDisabled={isViewMode}
            options={accountOptions}
            placeholder="اختر الحساب (اختياري)"
            value={accountOptions.find((opt) => opt.value === String(box.acc))}
            onChange={(selected) =>
              setBox({ ...box, acc: selected ? Number(selected.value) : null })
            }
          />
        </div>
        <div className="md:col-span-2 flex gap-6 items-center">
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(box.cust_status)}
            onValueChange={(val) =>
              setBox({ ...box, cust_status: val ? 1 : 0 })
            }
          >
            مفعلة
          </Checkbox>
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(box.expt)}
            onValueChange={handleCheckboxChange("expt")}
          >
            مستثنى من كشف الأرصدة
          </Checkbox>
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(box.hide)}
            onValueChange={handleCheckboxChange("hide")}
          >
            مخفي
          </Checkbox>
        </div>
      </div>
    </div>
  );
};

export default BoxFormClient;
