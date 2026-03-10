"use client";
import type {
  Category,
  ItemForm,
  ItemType,
  Unit,
  ItemStatus,
} from "@/types/items";

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
  ArrowLeftIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import { FORM_ACTIONS } from "@/constants/ui";
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
  itemStatus: ItemStatus[];
};

const ItemFormClient = ({
  mode,
  initialItem,
  categories,
  itemTypes,
  units,
  companyId: _companyId,
  itemStatus,
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
    (key: "cat" | "item_type" | "unit" | "item_status") =>
    (selection: Selection) => {
      const selectedKey = Array.from(selection)[0] as string | undefined;
      const numValue = selectedKey ? Number(selectedKey) : null;
      // item_status must stay number (0 or 1); default 1 when cleared
      const value =
        key === "item_status" && (numValue === null || Number.isNaN(numValue))
          ? 1
          : numValue;

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

  const cardClass =
    "rounded-lg border border-default-200 bg-default-50/50 p-3 flex flex-col min-h-0";
  const sectionTitleClass =
    "text-sm font-bold border-b border-default-200 pb-1.5 mb-2";
  const selectLabelClass = "block text-xs font-medium mb-1";

  return (
    <div className="flex flex-col gap-3 min-h-0 max-h-[calc(100vh-10rem)]">
      {/* Header - مثل شاشة العملاء */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2">
        <h2 className="text-lg font-bold">
          {isViewMode
            ? t("titles.view")
            : isAddMode
              ? t("titles.add")
              : t("titles.edit")}
        </h2>
        <div className={FORM_ACTIONS.wrapper}>
          <Button
            size={FORM_ACTIONS.size}
            startContent={<ArrowLeftIcon className={FORM_ACTIONS.back.iconSize} />}
            variant={FORM_ACTIONS.back.variant}
            onPress={handleCancel}
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

      {/* Form: 2x2 grid of section cards - أربعة مربعات مثل شاشة العملاء */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0 flex-1 overflow-auto">
        {/* 1. البيانات الأساسية */}
        <div className={cardClass}>
          <div className={sectionTitleClass}>
            {t("sections.basicInfo")}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 min-h-0">
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-name">
                {t("fields.itemName")}
              </label>
              <Input
                id="item-name"
                size="sm"
                isDisabled={isViewMode}
                value={item.item_name}
                onChange={handleInputChange("item_name")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-name-en">
                {t("fields.itemNameEn")}
              </label>
              <Input
                id="item-name-en"
                size="sm"
                isDisabled={isViewMode}
                value={item.item_name_e}
                onChange={handleInputChange("item_name_e")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-code">
                {t("fields.itemCode")}
              </label>
              <Input
                id="item-code"
                size="sm"
                isDisabled={isViewMode}
                value={item.item_code}
                onChange={handleInputChange("item_code")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-barcode">
                {t("fields.itemBarcode")}
              </label>
              <Input
                id="item-barcode"
                size="sm"
                isDisabled={isViewMode}
                value={item.item_barcode ?? ""}
                onChange={handleInputChange("item_barcode")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-price">
                {t("fields.itemPrice")}
              </label>
              <Input
                id="item-price"
                size="sm"
                isDisabled={isViewMode}
                startContent={<span className="text-default-400">﷼</span>}
                value={item.item_price ?? ""}
                onChange={handleInputChange("item_price")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-first-cost">
                {t("fields.firstCost")}
              </label>
              <Input
                id="item-first-cost"
                size="sm"
                isDisabled={isViewMode}
                startContent={<span className="text-default-400">﷼</span>}
                value={item.first_cost ?? ""}
                onChange={handleInputChange("first_cost")}
              />
            </div>
          </div>
        </div>

        {/* 2. البيانات الفنية */}
        <div className={cardClass}>
          <div className={sectionTitleClass}>
            {t("sections.technicalInfo")}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 min-h-0">
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-weight">
                {t("fields.itemWeight")}
              </label>
              <Input
                id="item-weight"
                size="sm"
                isDisabled={isViewMode}
                value={item.item_weight ?? ""}
                onChange={handleInputChange("item_weight")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-g-weight">
                {t("fields.itemGWeight")}
              </label>
              <Input
                id="item-g-weight"
                size="sm"
                isDisabled={isViewMode}
                value={item.item_g_weight ?? ""}
                onChange={handleInputChange("item_g_weight")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-stones">
                {t("fields.stones")}
              </label>
              <Input
                id="item-stones"
                size="sm"
                isDisabled={isViewMode}
                value={item.stones ?? ""}
                onChange={handleInputChange("stones")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-model">
                {t("fields.model")}
              </label>
              <Input
                id="item-model"
                size="sm"
                isDisabled={isViewMode}
                value={item.model ?? ""}
                onChange={handleInputChange("model")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-k">
                {t("fields.k")}
              </label>
              <Input
                id="item-k"
                size="sm"
                isDisabled={isViewMode}
                value={item.k ?? ""}
                onChange={handleInputChange("k")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-purity">
                {t("fields.purity")}
              </label>
              <Input
                id="item-purity"
                size="sm"
                isDisabled={isViewMode}
                value={item.purity ?? ""}
                onChange={handleInputChange("purity")}
              />
            </div>
          </div>
        </div>

        {/* 3. التصنيفات */}
        <div className={cardClass}>
          <div className={sectionTitleClass}>
            {t("sections.classifications")}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-h-0">
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-category">
                {t("fields.category")}
              </label>
              <Select
                id="item-category"
                size="sm"
                isDisabled={isViewMode}
                selectedKeys={item.cat ? [item.cat.toString()] : []}
                onSelectionChange={handleSelectChange("cat")}
              >
                {(categories || []).map((category) => (
                  <SelectItem key={category.id}>{category.cat_name}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-type">
                {t("fields.itemType")}
              </label>
              <Select
                id="item-type"
                size="sm"
                isDisabled={isViewMode}
                selectedKeys={item.item_type ? [item.item_type.toString()] : []}
                onSelectionChange={handleSelectChange("item_type")}
              >
                {(itemTypes || []).map((type) => (
                  <SelectItem key={type.id}>{type.type_name}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-unit">
                {t("fields.unit")}
              </label>
              <Select
                id="item-unit"
                size="sm"
                isDisabled={isViewMode}
                selectedKeys={item.unit ? [item.unit.toString()] : []}
                onSelectionChange={handleSelectChange("unit")}
              >
                {(units || []).map((unit) => (
                  <SelectItem key={unit.id}>{unit.unit_name}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="item-status">
                {t("fields.itemStatus")}
              </label>
              <Select
                id="item-status"
                size="sm"
                isDisabled={isViewMode}
                selectedKeys={
                  item.item_status != null
                    ? [String(item.item_status)]
                    : []
                }
                onSelectionChange={handleSelectChange("item_status")}
              >
                {(itemStatus || []).map((status) => (
                  <SelectItem key={String(status.code_id)} textValue={status.code_desc}>
                    {status.code_desc}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* 4. صورة الصنف */}
        <div className={cardClass}>
          <div className={sectionTitleClass}>
            {t("sections.itemImage")}
          </div>

          {imageSrc ? (
            <div className="relative">
              <div className="relative inline-block">
                <img
                  alt="معاينة الصورة"
                  className="h-40 w-40 rounded-xl border-2 border-default-200 object-cover shadow-sm"
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
                <div className="mt-3">
                  <Button
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
              className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
                isDragging
                  ? "border-primary bg-primary-50/30"
                  : "border-default-300 bg-default-50/50"
              } ${isViewMode ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-default-400"}`}
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

              <div className="flex flex-col items-center justify-center space-y-3">
                <div
                  className={`rounded-full p-3 transition-colors ${
                    isDragging ? "bg-primary-100" : "bg-default-100"
                  }`}
                >
                  <CloudArrowUpIcon
                    className={`h-10 w-10 ${
                      isDragging ? "text-primary" : "text-default-400"
                    }`}
                  />
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium text-default-700 mb-0.5">
                    {t("imageUpload.selectOrDrag")}
                  </p>
                  <p className="text-xs text-default-500">
                    {t("imageUpload.supportedFormats")}
                    <br />
                    {t("imageUpload.maxSize")}
                  </p>
                </div>

                {!isViewMode && (
                  <Button
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
        </div>
      </div>
    </div>
  );
};

export default ItemFormClient;
