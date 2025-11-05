"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
} from "@heroui/react";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import categoryService from "@/services/api/category.service";
import { ConfirmationModal } from "@/components/Modal";

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

interface CategoriesClientProps {
  companyId: number;
  initialCategories: Category[];
  initialBoxes: { id: number; box_name: string }[];
}

export default function CategoriesClient({
  companyId,
  initialCategories,
  initialBoxes,
}: CategoriesClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "id",
    direction: "ascending",
  });
  const [boxes] =
    useState<{ id: number; box_name: string }[]>(initialBoxes);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

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
      const categoriesList = await categoryService.getAllCategories(companyId);
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


  const handleDeleteClick = (category: Category) => {
    if (!category.id) {
      toast.error("❌ لا يمكن حذف فئة بدون معرف");
      return;
    }

    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete?.id) {
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      return;
    }

    // Optimistic delete
    setCategories((prevCategories) =>
      prevCategories.filter((c) => c.id !== categoryToDelete.id)
    );

    try {
      const result = await categoryService.deleteCategory(categoryToDelete.id);

      if (result) {
        toast.success("تم حذف الفئة بنجاح ✅");
        loadData();
      } else {
        toast.error("فشل في الحذف ❌");
        loadData();
      }
    } catch (error) {
      toast.error("خطأ أثناء الاتصال بالسيرفر");
      loadData();
    } finally {
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
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
        onPress={() => router.push(`/basic/categories/${cat.id}`)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => router.push(`/basic/categories/${cat.id}?mode=edit`)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        variant="light"
        onPress={() => handleDeleteClick(cat)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="responsive-container font-cairo">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h2 className="text-base font-semibold">إدارة الفئات</h2>
        <div className="h-8 w-px bg-gray-300" />
        <Button
          variant="bordered"
          className="bg-gray-100"
          onPress={() => router.push("/basic/categories/new")}
        >
          <PlusIcon className="h-3 w-3" />
          إضافة فئة
        </Button>
        <div className="h-8 w-px bg-gray-300" />
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="بحث بالاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
            size="sm"
          />
        </div>
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

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف الفئة "${categoryToDelete?.cat_name}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        confirmColor="danger"
        size="md"
      />
    </div>
  );
}
