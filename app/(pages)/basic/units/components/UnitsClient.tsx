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
} from "@heroui/react";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import unitService from "@/services/api/unit.service";

interface Unit {
  id: number;
  unit_name: string;
  unit_name_e: string;
  unit_type: number;
  unit_status: boolean;
  unit_default: boolean;
}

interface UnitsClientProps {
  initialUnits: Unit[];
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

export default function UnitsClient({ initialUnits }: UnitsClientProps) {
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [currentUnit, setCurrentUnit] = useState<Partial<Unit>>({});

  const rowsPerPage = 10;

  const loadUnits = async () => {
    try {
      const data = await unitService.getAllUnits();

      setUnits(data);
    } catch (error) {
      console.error("فشل في جلب الوحدات:", error);
      setUnits([]);
    }
  };

  const handleSave = async () => {
    try {
      let result: Unit | null = null;

      if (modalMode === "edit" && currentUnit.id) {
        result = await unitService.updateUnit(currentUnit.id, currentUnit);
      } else {
        result = await unitService.createUnit(currentUnit as Omit<Unit, "id">);
      }

      if (result) {
        toast.success(
          modalMode === "edit"
            ? "✅ تم تعديل الوحدة بنجاح"
            : "✅ تم إضافة الوحدة بنجاح",
        );
        setIsModalOpen(false);
        loadUnits();
      } else {
        toast.error("❌ فشل في العملية");
      }
    } catch (error) {
      console.error("❌ خطأ أثناء الحفظ:", error);
      toast.error("❌ حدث خطأ أثناء حفظ الوحدة");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذه الوحدة؟")) return;
    try {
      const result = await unitService.deleteUnit(id);

      if (result) {
        toast.success("✅ تم حذف الوحدة بنجاح");
        loadUnits();
      } else {
        toast.error("❌ فشل في حذف الوحدة");
      }
    } catch (error) {
      console.error("❌ خطأ أثناء الحذف:", error);
      toast.error("❌ حدث خطأ أثناء الحذف");
    }
  };

  const filtered = useMemo(() => {
    return units.filter((u) =>
      u.unit_name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [units, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  const openModal = (
    mode: "add" | "edit" | "view",
    unit: Partial<Unit> = {},
  ) => {
    setModalMode(mode);
    setCurrentUnit(unit);
    setIsModalOpen(true);
  };

  const isViewMode = modalMode === "view";

  const renderActions = (unit: Unit) => (
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openModal("view", unit)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openModal("edit", unit)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        variant="light"
        onPress={() => handleDelete(unit.id)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="responsive-container font-cairo">
      <div className="responsive-filters">
        <Button onPress={() => openModal("add")}>
          <PlusIcon className="h-4 w-4" /> إضافة وحدة
        </Button>
        <Input
          className="responsive-search"
          placeholder="بحث بالاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="responsive-table">
        <Table aria-label="جدول الوحدات">
          <TableHeader>
            {columns.map((col) => (
              <TableColumn key={col.uid}>{col.name}</TableColumn>
            ))}
          </TableHeader>
          <TableBody>
            {paginated.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell>{unit.id}</TableCell>
                <TableCell>{unit.unit_name}</TableCell>
                <TableCell>{unit.unit_name_e}</TableCell>
                <TableCell>{unit.unit_type}</TableCell>
                <TableCell>
                  <Checkbox isReadOnly isSelected={!!unit.unit_status} />
                </TableCell>
                <TableCell>
                  <Checkbox isReadOnly isSelected={!!unit.unit_default} />
                </TableCell>
                <TableCell>{renderActions(unit)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="responsive-pagination">
        <span>عدد الوحدات: {filtered.length}</span>
        <Pagination
          color="primary"
          page={page}
          total={Math.ceil(filtered.length / rowsPerPage)}
          onChange={setPage}
        />
      </div>

      <Modal
        isDismissable={false}
        isOpen={isModalOpen}
        scrollBehavior="inside"
        onClose={() => setIsModalOpen(false)}
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            {modalMode === "add" && "إضافة وحدة"}
            {modalMode === "edit" && "تعديل وحدة"}
            {modalMode === "view" && "عرض بيانات الوحدة"}
          </ModalHeader>

          <ModalBody className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
            <Input
              isDisabled={isViewMode}
              label="اسم الوحدة"
              value={currentUnit.unit_name || ""}
              onChange={(e) =>
                setCurrentUnit({ ...currentUnit, unit_name: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="اسم الوحدة بالإنجليزي"
              value={currentUnit.unit_name_e || ""}
              onChange={(e) =>
                setCurrentUnit({ ...currentUnit, unit_name_e: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="نوع الوحدة"
              type="number"
              value={currentUnit.unit_type?.toString() || ""}
              onChange={(e) =>
                setCurrentUnit({
                  ...currentUnit,
                  unit_type: parseInt(e.target.value),
                })
              }
            />
            <div className="col-span-2 flex gap-6 items-center">
              <Checkbox
                isDisabled={isViewMode}
                isSelected={Boolean(currentUnit.unit_status)}
                onValueChange={(val) =>
                  setCurrentUnit({ ...currentUnit, unit_status: val })
                }
              >
                مفعلة
              </Checkbox>
              <Checkbox
                isDisabled={isViewMode}
                isSelected={Boolean(currentUnit.unit_default)}
                onValueChange={(val) =>
                  setCurrentUnit({ ...currentUnit, unit_default: val })
                }
              >
                افتراضية
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
