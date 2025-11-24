"use client";
import type { ChangeEvent, DragEvent } from "react";
import type { Category, ItemForm, ItemType, Unit } from "@/types/items";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Select,
  SelectItem,
  type Selection,
} from "@heroui/react";
import {
  CloudArrowUpIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import itemService from "@/services/api/item.service";
import { revalidateItemsDataAction } from "@/app/actions/item";

type ItemFormMode = "view" | "edit" | "add";

type ItemFormClientProps = {
  mode: ItemFormMode;
  initialItem: ItemForm & { item_img_url?: string | null };
  categories: Category[];
  itemTypes: ItemType[];
  units: Unit[];
  companyId: number;
};

const ItemFormClient = ({
  mode,
  initialItem,
  categories,
  itemTypes,
  units,
  companyId,
}: ItemFormClientProps) => {
  const router = useRouter();
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [item, setItem] = useState<ItemForm & { item_img_url?: string | null }>(
    initialItem,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange =
    (key: keyof ItemForm) => (event: ChangeEvent<HTMLInputElement>) => {
      setItem({
        ...item,
        [key]: event.target.value,
      });
    };

  const handleSelectChange =
    (key: "cat" | "item_type" | "unit") => (selection: Selection) => {
      const selectedKey = Array.from(selection)[0] as string | undefined;
      const value = selectedKey ? Number(selectedKey) : null;

      setItem({
        ...item,
        [key]: value,
      });
    };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (file && file.type.startsWith("image/")) {
      setItem({
        ...item,
        item_img: file,
        item_img_url: null, // Clear URL when new file is selected
      });
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isViewMode) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (isViewMode) return;

    const file = event.dataTransfer.files?.[0];

    if (file && file.type.startsWith("image/")) {
      setItem({
        ...item,
        item_img: file,
        item_img_url: null,
      });
    }
  };

  const handleBrowseClick = () => {
    if (!isViewMode && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = () => {
    setItem({
      ...item,
      item_img: null,
      item_img_url: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getImageSrc = () => {
    if (item.item_img instanceof File) {
      return URL.createObjectURL(item.item_img);
    }
    if (item.item_img_url) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${item.item_img_url}`;
    }
    if (typeof item.item_img === "string") {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${item.item_img}`;
    }

    return null;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let result;

      if (isAddMode || !item.id || item.id === 0) {
        // إنشاء صنف جديد
        result = await itemService.createItem(item);

        if (result) {
          toast.success("✅ تمت إضافة الصنف بنجاح");
          await revalidateItemsDataAction();
          router.push(`/basic/items/${result.id}`);
        } else {
          toast.error("❌ فشل في إضافة الصنف");
        }
      } else {
        // تحديث صنف موجود
        result = await itemService.updateItem(item.id, item);

        if (result) {
          toast.success("✅ تم تحديث الصنف بنجاح");
          await revalidateItemsDataAction();
          router.push(`/basic/items/${item.id}`);
        } else {
          toast.error("❌ فشل في تحديث الصنف");
        }
      }
    } catch (error) {
      toast.error(
        isAddMode
          ? "❌ حدث خطأ أثناء إضافة الصنف"
          : "❌ حدث خطأ أثناء تحديث الصنف",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    router.push(`/basic/items/${item.id}?mode=edit`);
  };

  const handleCancel = () => {
    router.push("/basic/items");
  };

  const imageSrc = getImageSrc();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isViewMode
              ? "عرض الصنف"
              : isAddMode
                ? "إضافة صنف جديد"
                : "تعديل الصنف"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isViewMode
              ? "عرض تفاصيل الصنف"
              : isAddMode
                ? "أدخل بيانات الصنف الجديد"
                : "قم بتعديل بيانات الصنف"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            startContent={<ArrowLeftIcon className="h-4 w-4" />}
            variant="bordered"
            onPress={handleCancel}
          >
            العودة للقائمة
          </Button>
          {isViewMode && (
            <Button color="primary" onPress={handleEdit}>
              تعديل
            </Button>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-6">
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
              selectedKeys={item.item_type ? [item.item_type.toString()] : []}
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

        <fieldset className="rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
          <legend className="px-2 text-base font-semibold text-gray-800">
            صورة الصنف
          </legend>

          {imageSrc ? (
            <div className="relative">
              <div className="relative inline-block">
                <img
                  alt="معاينة الصورة"
                  className="h-48 w-48 rounded-xl border-2 border-gray-200 object-cover shadow-md mx-auto"
                  src={imageSrc}
                />
                {!isViewMode && (
                  <button
                    aria-label="حذف الصورة"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                    type="button"
                    onClick={handleRemoveImage}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              {!isViewMode && (
                <div className="mt-4 text-center">
                  <Button
                    className="border-gray-300"
                    size="sm"
                    variant="bordered"
                    onPress={handleBrowseClick}
                  >
                    تغيير الصورة
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50/50"
              } ${isViewMode ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-gray-400"}`}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                disabled={isViewMode}
                type="file"
                onChange={handleFileChange}
              />

              <div className="flex flex-col items-center justify-center space-y-4">
                <div
                  className={`rounded-full p-4 transition-colors ${
                    isDragging ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <CloudArrowUpIcon
                    className={`h-12 w-12 ${
                      isDragging ? "text-blue-500" : "text-gray-400"
                    }`}
                  />
                </div>

                <div className="text-center">
                  <p className="text-base font-medium text-gray-700 mb-1">
                    اختر ملف أو اسحبه وأفلته هنا
                  </p>
                  <p className="text-sm text-gray-500">
                    صيغ مدعومة: JPEG, PNG, GIF, WebP
                    <br />
                    حجم أقصى: 10MB
                  </p>
                </div>

                {!isViewMode && (
                  <Button
                    className="border-gray-300 bg-white hover:bg-gray-50"
                    size="sm"
                    variant="bordered"
                    onPress={handleBrowseClick}
                  >
                    تصفح الملفات
                  </Button>
                )}
              </div>
            </div>
          )}
        </fieldset>
      </div>

      {/* Footer Actions */}
      {!isViewMode && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            className="btn-secondary"
            color="danger"
            variant="bordered"
            onPress={handleCancel}
          >
            إلغاء
          </Button>
          <Button
            className="btn-primary"
            color="success"
            isLoading={isSaving}
            onPress={handleSave}
          >
            {isAddMode ? "حفظ الصنف" : "حفظ التغييرات"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ItemFormClient;
