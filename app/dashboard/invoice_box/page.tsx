"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Tooltip,
} from "@heroui/react";
import { FaEdit, FaTrash, FaPlus, FaEye } from "react-icons/fa";
import { API_ENDPOINTS } from "@/utilities/api";

const {
  INVOICE_BOXES_LIST,
  CREATE_INVOICE_BOX,
  UPDATE_INVOICE_BOX,
  DELETE_INVOICE_BOX,
} = API_ENDPOINTS;

interface InvoiceBox {
  id: number;
  box_name: string;
  box_name_e: string;
  box_status: boolean;
}

const columns = [
  { name: "رقم الصندوق", uid: "id" },
  { name: "اسم الصندوق", uid: "box_name" },
  { name: "الاسم بالإنجليزي", uid: "box_name_e" },
  { name: "الحالة", uid: "box_status" },
  { name: "", uid: "actions" },
];

export default function InvoiceBoxPage() {
  const [boxes, setBoxes] = useState<InvoiceBox[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [currentBox, setCurrentBox] = useState<Partial<InvoiceBox>>({});

  const rowsPerPage = 10;

  const loadBoxes = useCallback(async () => {
    try {
      const res = await fetch(INVOICE_BOXES_LIST);
      const data = await res.json();
      if (Array.isArray(data)) setBoxes(data);
      else if (Array.isArray(data.results)) setBoxes(data.results);
      else setBoxes([]);
    } catch (err) {
      console.error("❌ خطأ في تحميل البيانات:", err);
    }
  }, []);

  useEffect(() => {
    loadBoxes();
  }, [loadBoxes]);

  const handleSave = async () => {
    try {
      const url =
        modalMode === "edit" && currentBox.id
          ? UPDATE_INVOICE_BOX(currentBox.id)
          : CREATE_INVOICE_BOX;
      const method = modalMode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentBox),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(
          "❌ فشل في العملية: " +
            (errorData?.detail || JSON.stringify(errorData))
        );
        return;
      }

      alert(
        modalMode === "edit"
          ? "✅ تم تعديل الصندوق بنجاح"
          : "✅ تم إضافة الصندوق بنجاح"
      );
      setIsModalOpen(false);
      loadBoxes();
    } catch (error) {
      console.error("❌ خطأ أثناء الحفظ:", error);
      alert("❌ حدث خطأ أثناء حفظ الصندوق");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذا الصندوق؟")) return;
    try {
      const response = await fetch(DELETE_INVOICE_BOX(id), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error();
      alert("✅ تم حذف الصندوق بنجاح");
      loadBoxes();
    } catch {
      alert("❌ حدث خطأ أثناء الحذف");
    }
  };

  const filtered = useMemo(() => {
    return boxes.filter((b) =>
      b.box_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [boxes, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  const openModal = (
    mode: "add" | "edit" | "view",
    box: Partial<InvoiceBox> = {}
  ) => {
    setModalMode(mode);
    setCurrentBox(box);
    setIsModalOpen(true);
  };

  const isViewMode = modalMode === "view";

  return (
    <div className="p-4 font-cairo">
      <h1 className="text-2xl font-bold mb-6">صناديق الفواتير</h1>
      <div className="flex justify-between mb-4">
        <Button onPress={() => openModal("add")}> <FaPlus /> إضافة صندوق </Button>
        <Input
          placeholder="بحث بالاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-60"
        />
      </div>

      <Table aria-label="جدول الصناديق">
        <TableHeader>
          {columns.map((col) => (
            <TableColumn key={col.uid}>{col.name}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {paginated.map((box) => (
            <TableRow key={box.id}>
              <TableCell>{box.id}</TableCell>
              <TableCell>{box.box_name}</TableCell>
              <TableCell>{box.box_name_e}</TableCell>
              <TableCell>
                <Checkbox isSelected={!!box.box_status} isReadOnly />
              </TableCell>
              <TableCell>
                <div className="flex gap-5">
                  <Tooltip content="تعديل">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => openModal("edit", box)}
                    >
                      <FaEdit />
                    </Button>
                  </Tooltip>
                  <Tooltip content="عرض">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => openModal("view", box)}
                    >
                      <FaEye />
                    </Button>
                  </Tooltip>
                  <Tooltip content="حذف">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => handleDelete(box.id)}
                    >
                      <FaTrash />
                    </Button>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="py-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          عدد الصناديق: {filtered.length}
        </span>
        <Pagination
          color="primary"
          page={page}
          total={Math.ceil(filtered.length / rowsPerPage)}
          onChange={setPage}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scrollBehavior="inside"
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            {modalMode === "add" && "إضافة صندوق"}
            {modalMode === "edit" && "تعديل صندوق"}
            {modalMode === "view" && "عرض بيانات الصندوق"}
          </ModalHeader>

          <ModalBody className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
            <Input
              isDisabled={isViewMode}
              label="اسم الصندوق"
              value={currentBox.box_name || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, box_name: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الاسم بالإنجليزي"
              value={currentBox.box_name_e || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, box_name_e: e.target.value })
              }
            />
            <div className="col-span-2 flex gap-6 items-center">
              <Checkbox
                isDisabled={isViewMode}
                isSelected={currentBox.box_status || false}
                onValueChange={(val) =>
                  setCurrentBox({ ...currentBox, box_status: val })
                }
              >
                مفعلة
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

