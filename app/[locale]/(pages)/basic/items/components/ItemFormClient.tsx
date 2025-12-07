"use client";
import type { Category, ItemForm, ItemType, Unit } from "@/types/items";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
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
import { useTranslations } from "next-intl";

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
  companyId: _companyId,
}: ItemFormClientProps) => {
  const router = useRouter();
  const t = useTranslations("basic.items" as any) as any;
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
          toast.success(t("messages.addSuccess"));
          await revalidateItemsDataAction();
          router.push(`/basic/items/${result.id}`);
        } else {
          toast.error(t("messages.addError"));
        }
      } else {
        // تحديث صنف موجود
        result = await itemService.updateItem(item.id, item);

        if (result) {
          toast.success(t("messages.updateSuccess"));
          await revalidateItemsDataAction();
          router.push(`/basic/items/${item.id}`);
        } else {
          toast.error(t("messages.updateError"));
        }
      }
    } catch {
      toast.error(
        isAddMode ? t("messages.saveError") : t("messages.updateErrorGeneric"),
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
              ? t("titles.view")
              : isAddMode
                ? t("titles.add")
                : t("titles.edit")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isViewMode
              ? t("descriptions.view")
              : isAddMode
                ? t("descriptions.add")
                : t("descriptions.edit")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            startContent={<ArrowLeftIcon className="h-4 w-4" />}
            variant="bordered"
            onPress={handleCancel}
          >
            {t("actions.backToList")}
          </Button>
          {isViewMode && (
            <Button color="primary" onPress={handleEdit}>
              {t("actions.edit")}
            </Button>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-6">
        <fieldset className="rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
          <legend className="px-2 text-base font-semibold text-gray-800">
            {t("sections.basicInfo")}
          </legend>
          <p className="mb-4 text-sm text-gray-500">
            {t("sections.basicInfoDesc")}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Input
              className="input-field"
              isDisabled={isViewMode}
              label={t("fields.itemName")}
              value={item.item_name}
              onChange={handleInputChange("item_name")}
            />
            <Input
              className="input-field"
              isDisabled={isViewMode}
              label={t("fields.itemNameEn")}
              value={item.item_name_e}
              onChange={handleInputChange("item_name_e")}
            />
            <Input
              className="input-field"
              isDisabled={isViewMode}
              label={t("fields.itemPrice")}
              startContent={<span className="text-gray-400">﷼</span>}
              value={item.item_price ?? ""}
              onChange={handleInputChange("item_price")}
            />
            <Input
              className="input-field"
              isDisabled={isViewMode}
              label={t("fields.firstCost")}
              startContent={<span className="text-gray-400">﷼</span>}
              value={item.first_cost ?? ""}
              onChange={handleInputChange("first_cost")}
            />
            <Input
              className="input-field"
              isDisabled={isViewMode}
              label={t("fields.itemCode")}
              value={item.item_code}
              onChange={handleInputChange("item_code")}
            />
            <Input
              className="input-field"
              isDisabled={isViewMode}
              label={t("fields.itemBarcode")}
              value={item.item_barcode ?? ""}
              onChange={handleInputChange("item_barcode")}
            />
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
          <legend className="px-2 text-base font-semibold text-gray-800">
            {t("sections.technicalInfo")}
          </legend>
          <p className="mb-4 text-sm text-gray-500">
            {t("sections.technicalInfoDesc")}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Input
              className="input-field"
              isDisabled={isViewMode}
              label={t("fields.itemWeight")}
              value={item.item_weight ?? ""}
              onChange={handleInputChange("item_weight")}
            />
            <Input
              className="input-field"
              isDisabled={isViewMode}
              label={t("fields.itemGWeight")}
              value={item.item_g_weight ?? ""}
              onChange={handleInputChange("item_g_weight")}
            />
            <Input
              className="input-field"
              isDisabled={isViewMode}
              label={t("fields.stones")}
              value={item.stones ?? ""}
              onChange={handleInputChange("stones")}
            />
            <Input
              className="input-field"
              isDisabled={isViewMode}
              label={t("fields.model")}
              value={item.model ?? ""}
              onChange={handleInputChange("model")}
            />
            <Input
              className="input-field"
              isDisabled={isViewMode}
              label={t("fields.k")}
              value={item.k ?? ""}
              onChange={handleInputChange("k")}
            />
            <Input
              className="input-field"
              isDisabled={isViewMode}
              label={t("fields.purity")}
              value={item.purity ?? ""}
              onChange={handleInputChange("purity")}
            />
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
          <legend className="px-2 text-base font-semibold text-gray-800">
            {t("sections.classifications")}
          </legend>
          <p className="mb-4 text-sm text-gray-500">
            {t("sections.classificationsDesc")}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Select
              className="input-field"
              isDisabled={isViewMode}
              label={t("fields.category")}
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
              label={t("fields.itemType")}
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
              label={t("fields.unit")}
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
            {t("sections.itemImage")}
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
                    aria-label={t("imageUpload.removeImage")}
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
                    {t("actions.changeImage")}
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
                    {t("imageUpload.selectOrDrag")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("imageUpload.supportedFormats")}
                    <br />
                    {t("imageUpload.maxSize")}
                  </p>
                </div>

                {!isViewMode && (
                  <Button
                    className="border-gray-300 bg-white hover:bg-gray-50"
                    size="sm"
                    variant="bordered"
                    onPress={handleBrowseClick}
                  >
                    {t("actions.browseFiles")}
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
            {t("actions.cancel")}
          </Button>
          <Button
            className="btn-primary"
            color="success"
            isLoading={isSaving}
            onPress={handleSave}
          >
            {isAddMode ? t("actions.save") : t("actions.update")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ItemFormClient;
