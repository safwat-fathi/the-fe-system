"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Checkbox,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import categoryService from "@/services/api/category.service";

const columns = [
  { name: "رقم الفئة", uid: "id" },
  { name: "اسم الفئة", uid: "cat_name" },
  { name: "الاسم بالإنجليزي", uid: "cat_name_e" },
  { name: "العيار", uid: "k" },
  { name: "المعيارية", uid: "purity" },
  { name: "الصندوق", uid: "box" },
  { name: "الضريبة", uid: "tax_type" },
  { name: "نسبة الضريبة", uid: "tax" },
  { name: "النوع", uid: "cat_type" },
  { name: "حالة الفئة", uid: "cat_status" },
  { name: "", uid: "actions" },
];

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

type ModalMode = "add" | "edit" | "view";

interface CategoriesClientProps {
  initialCategories: Category[];
  initialBoxes: { id: number; box_name: string }[];
}

export default function CategoriesClient({
  initialCategories,
  initialBoxes,
}: CategoriesClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "id",
    direction: "ascending",
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [boxes, setBoxes] =
    useState<{ id: number; box_name: string }[]>(initialBoxes);

  const [newCategory, setNewCategory] = useState<Category>({
    id: 0,
    cat_name: "",
    cat_name_e: "",
    k: "",
    purity: "",
    box: null,
    tax_type: false,
    tax: 0,
    cat_type: "",
    cat_status: true,
  });

  const sanitizeCategory = (cat: any): Category => ({
    id: cat.id ?? 0,
    cat_name: cat.cat_name ?? "-",
    cat_name_e: cat.cat_name_e ?? "-",
    k: cat.k ?? cat.K ?? "-",
    purity: cat.purity ?? "-",
    box: cat.box ?? cat.cat_box ?? null,
    tax_type: cat.tax_type ?? false,
    tax: cat.tax ?? 0,
    cat_type: cat.cat_type ?? "-",
    cat_status: cat.cat_status ?? false,
  });

  const loadData = async () => {
    try {
      const categoriesList = await categoryService.getAllCategories();
      const sanitized = categoriesList.map(sanitizeCategory);

      setCategories(sanitized);
    } catch (error) {
      console.error("فشل في جلب البيانات:", error);
      setCategories([]);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    return categories.filter((cat) =>
      Object.values(cat).some((val) =>
        val?.toString().toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    );
  }, [searchQuery, categories]);

  const handleAddCategory = async () => {
    try {
      const result = await categoryService.createCategory(newCategory);

      if (result) {
        toast.success("تمت إضافة الفئة بنجاح ✅");
        setIsAddModalOpen(false);
        setNewCategory({
          id: 0,
          cat_name: "",
          cat_name_e: "",
          k: "",
          purity: "",
          box: null,
          tax_type: false,
          tax: 0,
          cat_type: "",
          cat_status: true,
        });
        loadData();
      } else {
        toast.error("فشل في إضافة الفئة ❌");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الاتصال بالسيرفر");
    }
  };

  const handleUpdateCategory = async () => {
    try {
      const updatedCategory = {
        ...newCategory,
        tax: isNaN(Number(newCategory.tax)) ? 0 : Number(newCategory.tax),
        k: newCategory.k ?? "",
        purity: newCategory.purity ?? "",
      };

      const result = await categoryService.updateCategory(
        newCategory.id,
        updatedCategory,
      );

      if (result) {
        toast.success("تم تعديل الفئة بنجاح ✅");
        setIsAddModalOpen(false);
        loadData();
      } else {
        toast.error("فشل في تعديل الفئة ❌");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الاتصال بالسيرفر");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذه الفئة؟")) return;
    try {
      const result = await categoryService.deleteCategory(id);

      if (result) {
        toast.success("تم حذف الفئة بنجاح ✅");
        loadData();
      } else {
        toast.error("فشل في الحذف ❌");
      }
    } catch (error) {
      toast.error("خطأ أثناء الاتصال بالسيرفر");
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setNewCategory({
      id: 0,
      cat_name: "",
      cat_name_e: "",
      k: "",
      purity: "",
      box: null,
      tax_type: false,
      tax: 0,
      cat_type: "",
      cat_status: true,
    });
    setIsAddModalOpen(true);
  };

  const openViewModal = (cat: Category) => {
    setModalMode("view");
    setNewCategory(cat);
    setIsAddModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setModalMode("edit");
    setNewCategory({ ...cat });
    setIsAddModalOpen(true);
  };

  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof Category];
      const second = b[sortDescriptor.column as keyof Category];
      const cmp =
        (first || "") < (second || "")
          ? -1
          : (first || "") > (second || "")
            ? 1
            : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredCategories, sortDescriptor]);

  const pages = Math.ceil(sortedCategories.length / rowsPerPage);
  const paginated = sortedCategories.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const renderActions = (cat: Category) => (
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openViewModal(cat)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openEditModal(cat)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        variant="light"
        onPress={() => handleDelete(cat.id)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="responsive-container font-cairo">
      <div className="responsive-filters">
        <Button className="btn-primary" onPress={openAddModal}>
          <PlusIcon className="h-4 w-4" /> إضافة فئة
        </Button>
        <Input
          className="responsive-search"
          placeholder="بحث بالاسم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="responsive-table">
        <Table aria-label="جدول الفئات">
          <TableHeader>
            {columns.map((col) => (
              <TableColumn key={col.uid}>{col.name}</TableColumn>
            ))}
          </TableHeader>
          <TableBody>
            {paginated.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>{cat.id}</TableCell>
                <TableCell>{cat.cat_name}</TableCell>
                <TableCell>{cat.cat_name_e}</TableCell>
                <TableCell>{cat.k}</TableCell>
                <TableCell>{cat.purity}</TableCell>
                <TableCell>
                  {boxes.find((b) => b.id === cat.box)?.box_name || cat.box}
                </TableCell>
                <TableCell>
                  <Checkbox isReadOnly isSelected={cat.tax_type} />
                </TableCell>
                <TableCell>{cat.tax}</TableCell>
                <TableCell>{cat.cat_type}</TableCell>
                <TableCell>
                  <Checkbox isReadOnly isSelected={cat.cat_status} />
                </TableCell>
                <TableCell>{renderActions(cat)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="responsive-pagination">
        <span>عدد الفئات: {filteredCategories.length}</span>
        <Pagination
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>

      <Modal
        isDismissable={false}
        isOpen={isAddModalOpen}
        shouldBlockScroll={false}
        onClose={() => setIsAddModalOpen(false)}
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            {modalMode === "add" && "إضافة فئة جديدة"}
            {modalMode === "edit" && "تعديل فئة"}
            {modalMode === "view" && "عرض الفئة"}
          </ModalHeader>
          <ModalBody className="grid grid-cols-2 gap-4">
            <Input
              isDisabled={modalMode === "view"}
              label="اسم الفئة"
              value={newCategory.cat_name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, cat_name: e.target.value })
              }
            />
            <Input
              isDisabled={modalMode === "view"}
              label="الاسم بالإنجليزي"
              value={newCategory.cat_name_e}
              onChange={(e) =>
                setNewCategory({ ...newCategory, cat_name_e: e.target.value })
              }
            />
            <Input
              isDisabled={modalMode === "view"}
              label="العيار"
              value={newCategory.k}
              onChange={(e) =>
                setNewCategory({ ...newCategory, k: e.target.value })
              }
            />
            <Input
              isDisabled={modalMode === "view"}
              label="المعيارية"
              value={newCategory.purity}
              onChange={(e) =>
                setNewCategory({ ...newCategory, purity: e.target.value })
              }
            />
            <Select
              isDisabled={modalMode === "view"}
              label="الصندوق"
              popoverProps={{ shouldBlockScroll: false }}
              selectedKeys={
                newCategory.box !== null ? [String(newCategory.box)] : []
              }
              onSelectionChange={(keys) => {
                const id = Number(Array.from(keys)[0]);

                setNewCategory({ ...newCategory, box: id });
              }}
            >
              {boxes.map((b) => (
                <SelectItem key={b.id} textValue={b.box_name}>
                  {b.box_name}
                </SelectItem>
              ))}
            </Select>
            <Input
              isDisabled={modalMode === "view"}
              label="نسبة الضريبة"
              type="number"
              value={String(newCategory.tax)}
              onChange={(e) =>
                setNewCategory({
                  ...newCategory,
                  tax: parseFloat(e.target.value),
                })
              }
            />
            <Input
              isDisabled={modalMode === "view"}
              label="النوع"
              value={newCategory.cat_type}
              onChange={(e) =>
                setNewCategory({ ...newCategory, cat_type: e.target.value })
              }
            />
            <div className="col-span-2 flex gap-4">
              <Checkbox
                isDisabled={modalMode === "view"}
                isSelected={newCategory.tax_type}
                onValueChange={(val) =>
                  setNewCategory({ ...newCategory, tax_type: val })
                }
              >
                خاضعة للضريبة
              </Checkbox>
              <Checkbox
                isDisabled={modalMode === "view"}
                isSelected={newCategory.cat_status}
                onValueChange={(val) =>
                  setNewCategory({ ...newCategory, cat_status: val })
                }
              >
                مفعّلة
              </Checkbox>
            </div>
          </ModalBody>
          {modalMode !== "view" && (
            <ModalFooter>
              <Button color="danger" onPress={() => setIsAddModalOpen(false)}>
                إلغاء
              </Button>
              {modalMode === "add" && (
                <Button color="success" onPress={handleAddCategory}>
                  حفظ
                </Button>
              )}
              {modalMode === "edit" && (
                <Button color="primary" onPress={handleUpdateCategory}>
                  تحديث
                </Button>
              )}
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
