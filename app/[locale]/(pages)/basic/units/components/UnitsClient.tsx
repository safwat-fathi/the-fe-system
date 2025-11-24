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

import unitService from "@/services/api/unit.service";
import { ConfirmationModal } from "@/components/Modal";

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
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);

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

  const handleDeleteClick = (unit: Unit) => {
    if (!unit.id) {
      toast.error("❌ لا يمكن حذف وحدة بدون معرف");

      return;
    }

    setUnitToDelete(unit);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!unitToDelete?.id) {
      setDeleteModalOpen(false);
      setUnitToDelete(null);

      return;
    }

    // Optimistic delete
    setUnits((prevUnits) => prevUnits.filter((u) => u.id !== unitToDelete.id));

    try {
      const result = await unitService.deleteUnit(unitToDelete.id);

      if (result) {
        toast.success("✅ تم حذف الوحدة بنجاح");
        loadUnits();
      } else {
        toast.error("❌ فشل في حذف الوحدة");
        loadUnits();
      }
    } catch (error) {
      console.error("❌ خطأ أثناء الحذف:", error);
      toast.error("❌ حدث خطأ أثناء الحذف");
      loadUnits();
    } finally {
      setDeleteModalOpen(false);
      setUnitToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setUnitToDelete(null);
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

  const renderActions = (unit: Unit) => (
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => router.push(`/basic/units/${unit.id}`)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => router.push(`/basic/units/${unit.id}?mode=edit`)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        variant="light"
        onPress={() => handleDeleteClick(unit)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="responsive-container font-cairo">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h2 className="text-base font-semibold">إدارة الوحدات</h2>
        <div className="h-8 w-px bg-gray-300" />
        <Button
          className="bg-gray-100"
          variant="bordered"
          onPress={() => router.push("/basic/units/new")}
        >
          <PlusIcon className="h-3 w-3" />
          إضافة وحدة
        </Button>
        <div className="h-8 w-px bg-gray-300" />
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="بحث بالاسم..."
            size="sm"
            startContent={
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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

      <ConfirmationModal
        cancelText="إلغاء"
        confirmColor="danger"
        confirmText="حذف"
        isOpen={deleteModalOpen}
        message={`هل أنت متأكد من حذف الوحدة "${unitToDelete?.unit_name}"؟`}
        size="md"
        title="تأكيد الحذف"
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
