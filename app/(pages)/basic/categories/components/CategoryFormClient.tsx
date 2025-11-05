"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Checkbox, Select, SelectItem } from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import categoryService from "@/services/api/category.service";

type CategoryFormMode = "view" | "edit" | "add";

interface Category {
  id: number;
  cat_name: string;
  cat_name_e: string;
  k: string;
  purity: string;
  box: number | null;
  tax_type: boolean;
  tax: number;
  cat_type: string;
  cat_status: boolean;
}

interface CategoryFormClientProps {
  mode: CategoryFormMode;
  initialCategory: Partial<Category>;
  boxes: { id: number; box_name: string }[];
  companyId: number;
}

const CategoryFormClient = ({
  mode,
  initialCategory,
  boxes,
  companyId,
}: CategoryFormClientProps) => {
  const router = useRouter();
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [category, setCategory] = useState<Partial<Category>>(initialCategory);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!category.cat_name || !category.cat_name_e) {
      toast.error("❌ يجب ملء جميع الحقول المطلوبة");
      return;
    }

    setIsSaving(true);

    try {
      let result: Category | null = null;

      if (isAddMode) {
        result = await categoryService.createCategory(
          category as Omit<Category, "id">,
        );
      } else if (category.id) {
        result = await categoryService.updateCategory(category.id, category);
      }

      if (result) {
        toast.success(
          isAddMode
            ? "✅ تم إضافة الفئة بنجاح"
            : "✅ تم تعديل الفئة بنجاح",
        );
        router.push("/basic/categories");
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
    router.push(`/basic/categories/${category.id}?mode=edit`);
  };

  const getTitle = () => {
    if (isViewMode) return `عرض ${category.cat_name || "الفئة"}`;
    if (isAddMode) return "إضافة فئة جديدة";
    return `تعديل ${category.cat_name || "الفئة"}`;
  };

  const getDescription = () => {
    if (isViewMode) return "عرض تفاصيل الفئة";
    if (isAddMode) return "قم بإضافة فئة جديدة إلى النظام";
    return "قم بتعديل بيانات الفئة";
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
            onPress={() => router.push("/basic/categories")}
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
                onPress={() => router.push("/basic/categories")}
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
          label="اسم الفئة"
          value={category.cat_name || ""}
          onChange={(e) =>
            setCategory({ ...category, cat_name: e.target.value })
          }
          isRequired
        />
        <Input
          isDisabled={isViewMode}
          label="الاسم بالإنجليزي"
          value={category.cat_name_e || ""}
          onChange={(e) =>
            setCategory({ ...category, cat_name_e: e.target.value })
          }
          isRequired
        />
        <Input
          isDisabled={isViewMode}
          label="العيار"
          value={category.k || ""}
          onChange={(e) => setCategory({ ...category, k: e.target.value })}
        />
        <Input
          isDisabled={isViewMode}
          label="المعيارية"
          value={category.purity || ""}
          onChange={(e) =>
            setCategory({ ...category, purity: e.target.value })
          }
        />
        <Select
          isDisabled={isViewMode}
          label="الصندوق"
          selectedKeys={
            category.box !== null ? [String(category.box)] : []
          }
          onSelectionChange={(keys) => {
            const id = Number(Array.from(keys)[0]);
            setCategory({ ...category, box: id });
          }}
        >
          {boxes.map((b) => (
            <SelectItem key={b.id} textValue={b.box_name}>
              {b.box_name}
            </SelectItem>
          ))}
        </Select>
        <Input
          isDisabled={isViewMode}
          label="نسبة الضريبة"
          type="number"
          value={String(category.tax || 0)}
          onChange={(e) =>
            setCategory({
              ...category,
              tax: parseFloat(e.target.value) || 0,
            })
          }
        />
        <Input
          isDisabled={isViewMode}
          label="النوع"
          value={category.cat_type || ""}
          onChange={(e) =>
            setCategory({ ...category, cat_type: e.target.value })
          }
        />
        <div className="md:col-span-2 flex gap-4">
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(category.tax_type)}
            onValueChange={(val) =>
              setCategory({ ...category, tax_type: val })
            }
          >
            خاضعة للضريبة
          </Checkbox>
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(category.cat_status)}
            onValueChange={(val) =>
              setCategory({ ...category, cat_status: val })
            }
          >
            مفعّلة
          </Checkbox>
        </div>
      </div>
    </div>
  );
};

export default CategoryFormClient;

