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
} from "@heroui/react";
import { HeroModal as Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/Modal";
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import customerTypeService from "@/services/api/customer-type.service";

interface CustomerType {
  id: number;
  type_name: string;
  type_name_e: string;
  type_desc: string;
  cr_date: string;
  type_status: boolean;
}

interface CustomerTypesClientProps {
  initialTypes: CustomerType[];
}

const columns = [
  { name: "ID", uid: "id" },
  { name: "النوع", uid: "type_name" },
  { name: "النوع بالإنجليزي", uid: "type_name_e" },
  { name: "الوصف", uid: "type_desc" },
  { name: "التاريخ", uid: "cr_date" },
  { name: "الحالة", uid: "type_status" },
  { name: "", uid: "actions" },
];

export default function CustomerTypesClient({ initialTypes }: CustomerTypesClientProps) {
  const [types, setTypes] = useState<CustomerType[]>(initialTypes);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [currentType, setCurrentType] = useState<Partial<CustomerType>>({});

  const rowsPerPage = 12;

  const loadTypes = async () => {
    try {
      const data = await customerTypeService.getAllCustomerTypes();
      setTypes(data);
    } catch (error) {
      console.error("فشل في جلب أنواع العملاء:", error);
      setTypes([]);
    }
  };

  const handleSave = async () => {
    try {
      let result: CustomerType | null = null;

      if (modalMode === "edit" && currentType.id) {
        result = await customerTypeService.updateCustomerType(currentType.id, currentType);
      } else {
        result = await customerTypeService.createCustomerType(currentType as Omit<CustomerType, 'id'>);
      }

      if (result) {
        toast.success(
          modalMode === "edit"
            ? "✅ تم تعديل النوع بنجاح"
            : "✅ تم إضافة النوع بنجاح",
        );
        setIsModalOpen(false);
        loadTypes();
      } else {
        toast.error("❌ فشل في العملية");
      }
    } catch (error) {
      console.error("❌ خطأ أثناء الحفظ:", error);
      toast.error("❌ حدث خطأ أثناء الحفظ");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف نوع العميل؟")) return;
    try {
      const result = await customerTypeService.deleteCustomerType(id);

      if (result) {
        toast.success("✅ تم حذف النوع بنجاح");
        loadTypes();
      } else {
        toast.error("❌ فشل في حذف نوع العميل");
      }
    } catch (error) {
      console.error("❌ خطأ أثناء الحذف:", error);
      toast.error("❌ حدث خطأ أثناء الحذف");
    }
  };

  const renderActions = (type: CustomerType) => (
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openModal("view", type)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openModal("edit", type)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        color="danger"
        onPress={() => handleDelete(type.id)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  const filtered = useMemo(
    () =>
      types.filter((t) =>
        t.type_name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [types, search],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  const openModal = (
    mode: "add" | "edit" | "view",
    type: Partial<CustomerType> = {},
  ) => {
    setModalMode(mode);
    setCurrentType(type);
    setIsModalOpen(true);
  };

  const isViewMode = modalMode === "view";

  return (
    <div className="responsive-container font-cairo">
      <div className="responsive-filters">
        <Button onPress={() => openModal("add")}>
          <PlusIcon className="h-4 w-4" /> إضافة نوع
        </Button>
        <Input
          className="responsive-search"
          placeholder="بحث بالاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="responsive-table">
        <Table aria-label="جدول أنواع العملاء">
          <TableHeader>
            {columns.map((col) => (
              <TableColumn key={col.uid}>{col.name}</TableColumn>
            ))}
          </TableHeader>
          <TableBody>
            {paginated.map((type) => (
              <TableRow key={type.id}>
                <TableCell>{type.id}</TableCell>
                <TableCell>{type.type_name}</TableCell>
                <TableCell>{type.type_name_e}</TableCell>
                <TableCell>{type.type_desc}</TableCell>
                <TableCell>{type.cr_date}</TableCell>
                <TableCell>
                  <Checkbox isReadOnly isSelected={type.type_status} />
                </TableCell>
                <TableCell>{renderActions(type)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="responsive-pagination">
        <span>عدد الأنواع: {filtered.length}</span>
        <Pagination
          color="primary"
          page={page}
          total={Math.ceil(filtered.length / rowsPerPage)}
          onChange={setPage}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={() => setIsModalOpen(false)}
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            {modalMode === "add" && "إضافة نوع"}
            {modalMode === "edit" && "تعديل نوع"}
            {modalMode === "view" && "عرض النوع"}
          </ModalHeader>

          <ModalBody className="grid grid-cols-2 gap-4 max-h-[80vh] overflow-y-auto pr-2">
            <Input
              isDisabled={isViewMode}
              label="نوع العميل"
              value={currentType.type_name || ""}
              onChange={(e) =>
                setCurrentType({ ...currentType, type_name: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="نوع العميل بالإنجليزي"
              value={currentType.type_name_e || ""}
              onChange={(e) =>
                setCurrentType({ ...currentType, type_name_e: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الوصف"
              value={currentType.type_desc || ""}
              onChange={(e) =>
                setCurrentType({ ...currentType, type_desc: e.target.value })
              }
            />
            <Input
              isDisabled={true}
              label="تاريخ الإنشاء"
              value={currentType.cr_date || ""}
            />
            <div className="col-span-2">
              <Checkbox
                isDisabled={isViewMode}
                isSelected={Boolean(currentType.type_status)}
                onValueChange={(val) =>
                  setCurrentType({ ...currentType, type_status: val })
                }
              >
                الحالة مفعلة
              </Checkbox>
            </div>
          </ModalBody>

          {modalMode !== "view" && (
            <ModalFooter className="flex justify-end gap-2">
              <Button color="danger" onPress={() => setIsModalOpen(false)}>
                إلغاء
              </Button>
              <Button color="success" onPress={handleSave}>
                {modalMode === "edit" ? "تحديث" : "حفظ"}
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

