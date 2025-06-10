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
import { API_BASE_URL } from "@/utilities/api";

const API_URL = `${API_BASE_URL}units_list/`;
const CREATE_URL = `${API_BASE_URL}api_create_unit`;
const UPDATE_URL = (id: number) => `${API_BASE_URL}api_update_unit/${id}`;
const DELETE_URL = (id: number) => `${API_BASE_URL}api_delete_unit/${id}`;

interface Unit {
  id: number;
  unit_name: string;
  unit_name_e: string;
  unit_type: number;
  unit_status: boolean;
  unit_default: boolean;
}

const columns = [
  { name: "رقم الوحدة", uid: "id" },
  { name: "اسم الوحدة", uid: "unit_name" },
  { name: "الاسم بالإنجليزي", uid: "unit_name_e" },
  { name: "النوع", uid: "unit_type" },
  { name: "الوضع", uid: "unit_status" },
  { name: "افتراضية؟", uid: "unit_default" },
  { name: "", uid: "actions" },
];

export default function UnitsTable() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [currentUnit, setCurrentUnit] = useState<Partial<Unit>>({});

  const rowsPerPage = 10;

  const loadUnits = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data)) setUnits(data);
      else if (Array.isArray(data.results)) setUnits(data.results);
      else setUnits([]);
    } catch (err) {
      console.error("❌ خطأ في تحميل البيانات:", err);
    }
  }, []);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  const handleSave = async () => {
    try {
      const url = modalMode === "edit" && currentUnit.id ? UPDATE_URL(currentUnit.id) : CREATE_URL;
      const method = modalMode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentUnit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert("❌ فشل في العملية: " + (errorData?.detail || JSON.stringify(errorData)));
        return;
      }

      alert(modalMode === "edit" ? "✅ تم تعديل الوحدة بنجاح" : "✅ تم إضافة الوحدة بنجاح");
      setIsModalOpen(false);
      loadUnits();
    } catch (error) {
      console.error("❌ خطأ أثناء الحفظ:", error);
      alert("❌ حدث خطأ أثناء حفظ الوحدة");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذه الوحدة؟")) return;
    try {
      const response = await fetch(DELETE_URL(id), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error();
      alert("✅ تم حذف الوحدة بنجاح");
      loadUnits();
    } catch {
      alert("❌ حدث خطأ أثناء الحذف");
    }
  };

  const filtered = useMemo(() => {
    return units.filter((u) => u.unit_name?.toLowerCase().includes(search.toLowerCase()));
  }, [units, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  const openModal = (mode: "add" | "edit" | "view", unit: Partial<Unit> = {}) => {
    setModalMode(mode);
    setCurrentUnit(unit);
    setIsModalOpen(true);
  };

  const isViewMode = modalMode === "view";

  return (
    <div className="p-4 font-cairo">
        <h1 className="text-2xl font-bold mb-6">الوحدات</h1>
      <div className="flex justify-between mb-4">
        <Button onPress={() => openModal("add")}> <FaPlus /> إضافة وحدة </Button>
        <Input placeholder="بحث بالاسم..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-60" />
      </div>

      <Table aria-label="جدول الوحدات">
        <TableHeader>{columns.map(col => <TableColumn key={col.uid}>{col.name}</TableColumn>)}</TableHeader>
        <TableBody>
          {paginated.map((unit) => (
            <TableRow key={unit.id}>
              <TableCell>{unit.id}</TableCell>
              <TableCell>{unit.unit_name}</TableCell>
              <TableCell>{unit.unit_name_e}</TableCell>
              <TableCell>{unit.unit_type}</TableCell>
              <TableCell><Checkbox isSelected={!!unit.unit_status} isReadOnly /></TableCell>
              <TableCell><Checkbox isSelected={!!unit.unit_default} isReadOnly /></TableCell>
              <TableCell>
              <div className="flex gap-5">
                <Tooltip content="تعديل">
                  <Button isIconOnly size="sm" variant="flat" onPress={() => openModal("edit", unit)}><FaEdit /></Button>
                </Tooltip>
                <Tooltip content="عرض">
                  <Button isIconOnly size="sm" variant="flat" onPress={() => openModal("view", unit)}><FaEye /></Button>
                </Tooltip>
                <Tooltip content="حذف">
                  <Button isIconOnly size="sm" variant="flat" onPress={() => handleDelete(unit.id)}><FaTrash /></Button>
                </Tooltip>
              </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="py-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">عدد الوحدات: {filtered.length}</span>
        <Pagination color="primary" page={page} total={Math.ceil(filtered.length / rowsPerPage)} onChange={setPage} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} scrollBehavior="inside">
        <ModalContent className="font-cairo">
          <ModalHeader>
            {modalMode === "add" && "إضافة وحدة"}
            {modalMode === "edit" && "تعديل وحدة"}
            {modalMode === "view" && "عرض بيانات الوحدة"}
          </ModalHeader>

          <ModalBody className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
            <Input isDisabled={isViewMode} label="اسم الوحدة" value={currentUnit.unit_name || ""} onChange={(e) => setCurrentUnit({ ...currentUnit, unit_name: e.target.value })} />
            <Input isDisabled={isViewMode} label="اسم الوحدة بالإنجليزي" value={currentUnit.unit_name_e || ""} onChange={(e) => setCurrentUnit({ ...currentUnit, unit_name_e: e.target.value })} />
            <Input isDisabled={isViewMode} type="number" label="نوع الوحدة" value={currentUnit.unit_type?.toString() || ""} onChange={(e) => setCurrentUnit({ ...currentUnit, unit_type: parseInt(e.target.value) })} />
            <div className="col-span-2 flex gap-6 items-center">
              <Checkbox isDisabled={isViewMode} isSelected={currentUnit.unit_status || false} onValueChange={(val) => setCurrentUnit({ ...currentUnit, unit_status: val })}>مفعلة</Checkbox>
              <Checkbox isDisabled={isViewMode} isSelected={currentUnit.unit_default || false} onValueChange={(val) => setCurrentUnit({ ...currentUnit, unit_default: val })}>افتراضية</Checkbox>
            </div>
          </ModalBody>

          {modalMode !== "view" && (
            <ModalFooter className="flex justify-end gap-2">
              <Button color="danger" onPress={() => setIsModalOpen(false)}>إلغاء</Button>
              <Button color="success" onPress={handleSave}>{modalMode === "edit" ? "تحديث" : "حفظ"}</Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}