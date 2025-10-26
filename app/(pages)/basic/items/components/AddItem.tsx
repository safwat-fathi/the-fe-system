"use client";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { Button, Input, Select, SelectItem, type Selection } from "@heroui/react";
import {
  HeroModal as Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/Modal";
import type { Category, ItemForm, ItemType, Unit } from "@/types/items";

type AddItemMode = "add" | "edit" | "view";

type AddItemProps = {
  isOpen: boolean;
  mode: AddItemMode;
  item: ItemForm;
  categories: Category[];
  itemTypes: ItemType[];
  units: Unit[];
  onClose: () => void;
  onChange: Dispatch<SetStateAction<ItemForm>>;
  onAdd: () => void;
  onUpdate: () => void;
};

const AddItem = ({
  isOpen,
  mode,
  item,
  categories,
  itemTypes,
  units,
  onClose,
  onChange,
  onAdd,
  onUpdate,
}: AddItemProps) => {
  const isViewMode = mode === "view";

  const handleInputChange =
    (key: keyof ItemForm) => (event: ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...item,
        [key]: event.target.value,
      } as ItemForm);
    };

  const handleSelectChange =
    (key: "cat" | "item_type" | "unit") => (selection: Selection) => {
      const selectedKey = Array.from(selection)[0] as string | undefined;
      const value = selectedKey ? Number(selectedKey) : null;

      onChange({
        ...item,
        [key]: value,
      });
    };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    onChange({
      ...item,
      item_img: file,
    });
  };

  return (
    <Modal
      isDismissable={false}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onClose={onClose}
    >
      <ModalContent className="font-cairo max-h-[90vh]">
        <ModalHeader>
          <div>
            <h3 className="text-xl font-bold">
              {mode === "add" && "إضافة صنف جديد"}
              {mode === "edit" && "تعديل صنف"}
              {mode === "view" && "عرض بيانات الصنف"}
            </h3>
            <p className="text-gray-500 text-sm">
              {mode === "add" && "أدخل بيانات الصنف الجديد"}
              {mode === "edit" && "قم بتعديل بيانات الصنف"}
              {mode === "view" && "عرض تفاصيل الصنف"}
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-6 max-h-[82vh] overflow-y-auto pr-1">
          <fieldset className="rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <legend className="px-2 text-base font-semibold text-gray-800">
              البيانات الأساسية
            </legend>
            <p className="mb-4 text-sm text-gray-500">
              أدخل المعلومات الرئيسية للصنف لضمان ظهورها بشكل صحيح في البحث.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Input
                className="input-field"
                isDisabled={isViewMode}
                label="اسم الصنف"
                value={item.item_name}
                onChange={handleInputChange("item_name")}
              />
              <Input
                className="input-field"
                isDisabled={isViewMode}
                label="اسم الصنف بالإنجليزية"
                value={item.item_name_e}
                onChange={handleInputChange("item_name_e")}
              />
              <Input
                className="input-field"
                isDisabled={isViewMode}
                label="السعر"
                startContent={<span className="text-gray-400">﷼</span>}
                value={item.item_price ?? ""}
                onChange={handleInputChange("item_price")}
              />
              <Input
                className="input-field"
                isDisabled={isViewMode}
                label="سعر التكلفة"
                startContent={<span className="text-gray-400">﷼</span>}
                value={item.first_cost ?? ""}
                onChange={handleInputChange("first_cost")}
              />
              <Input
                className="input-field"
                isDisabled={isViewMode}
                label="كود الصنف"
                value={item.item_code}
                onChange={handleInputChange("item_code")}
              />
              <Input
                className="input-field"
                isDisabled={isViewMode}
                label="باركود الصنف"
                value={item.item_barcode ?? ""}
                onChange={handleInputChange("item_barcode")}
              />
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <legend className="px-2 text-base font-semibold text-gray-800">
              البيانات الفنية
            </legend>
            <p className="mb-4 text-sm text-gray-500">
              ساعد الفريق في فهم تفاصيل الصنف الفنية بإدخال القيم بدقة.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Input
                className="input-field"
                isDisabled={isViewMode}
                label="الوزن"
                value={item.item_weight ?? ""}
                onChange={handleInputChange("item_weight")}
              />
              <Input
                className="input-field"
                isDisabled={isViewMode}
                label="الوزن بالجرام"
                value={item.item_g_weight ?? ""}
                onChange={handleInputChange("item_g_weight")}
              />
              <Input
                className="input-field"
                isDisabled={isViewMode}
                label="الحجر"
                value={item.stones ?? ""}
                onChange={handleInputChange("stones")}
              />
              <Input
                className="input-field"
                isDisabled={isViewMode}
                label="الموديل"
                value={item.model ?? ""}
                onChange={handleInputChange("model")}
              />
              <Input
                className="input-field"
                isDisabled={isViewMode}
                label="العيار (K)"
                value={item.k ?? ""}
                onChange={handleInputChange("k")}
              />
              <Input
                className="input-field"
                isDisabled={isViewMode}
                label="المعايرة"
                value={item.purity ?? ""}
                onChange={handleInputChange("purity")}
              />
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <legend className="px-2 text-base font-semibold text-gray-800">
              التصنيفات
            </legend>
            <p className="mb-4 text-sm text-gray-500">
              اختر التصنيفات المناسبة لضمان ظهور الصنف ضمن التقارير الصحيحة.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Select
                className="input-field"
                isDisabled={isViewMode}
                label="الفئة"
                selectedKeys={item.cat ? [item.cat.toString()] : []}
                onSelectionChange={handleSelectChange("cat")}
              >
                {(categories || []).map((category) => (
                  <SelectItem key={category.id}>{category.cat_name}</SelectItem>
                ))}
              </Select>
              <Select
                className="input-field"
                isDisabled={isViewMode}
                label="نوع الصنف"
                selectedKeys={
                  item.item_type ? [item.item_type.toString()] : []
                }
                onSelectionChange={handleSelectChange("item_type")}
              >
                {(itemTypes || []).map((type) => (
                  <SelectItem key={type.id}>{type.type_name}</SelectItem>
                ))}
              </Select>
              <Select
                className="input-field"
                isDisabled={isViewMode}
                label="الوحدة"
                selectedKeys={item.unit ? [item.unit.toString()] : []}
                onSelectionChange={handleSelectChange("unit")}
              >
                {(units || []).map((unit) => (
                  <SelectItem key={unit.id}>{unit.unit_name}</SelectItem>
                ))}
              </Select>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6 text-center shadow-sm backdrop-blur-sm">
            <legend className="px-2 text-base font-semibold text-gray-800">
              صورة الصنف
            </legend>
            <p className="mb-4 text-sm text-gray-500">
              ارفع صورة واضحة للصنف لسهولة تمييزه داخل النظام.
            </p>
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
              <input
                accept="image/*"
                className="input-field w-full md:max-w-md"
                disabled={isViewMode}
                required={!isViewMode && mode === "add"}
                type="file"
                onChange={handleFileChange}
              />
              {item.item_img && item.item_img instanceof File && (
                <img
                  alt="معاينة الصورة"
                  className="h-24 w-24 rounded-xl border border-gray-200 object-cover shadow-sm"
                  src={URL.createObjectURL(item.item_img)}
                />
              )}
            </div>
          </fieldset>
        </ModalBody>

        {!isViewMode && (
          <ModalFooter className="flex justify-end gap-3">
            <Button
              className="btn-secondary"
              color="danger"
              variant="bordered"
              onPress={onClose}
            >
              إلغاء
            </Button>
            <Button
              className="btn-primary"
              color="success"
              onPress={mode === "edit" ? onUpdate : onAdd}
            >
              {mode === "edit" ? "تحديث" : "حفظ"}
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AddItem;
