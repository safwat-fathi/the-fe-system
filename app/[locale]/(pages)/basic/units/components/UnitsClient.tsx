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
import { useTranslations } from "next-intl";

import unitService from "@/services/api/unit.service";
import { ConfirmationModal } from "@/components/Modal";
import { Can } from "@/components/providers/AbilityProvider";

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

export default function UnitsClient({ initialUnits }: UnitsClientProps) {
  const router = useRouter();
  const t = useTranslations("basic.units" as any) as any;
  const [units, setUnits] = useState<Unit[]>(initialUnits);

  const columns = useMemo(
    () => [
      { name: t("columns.id"), uid: "id" },
      { name: t("columns.unitName"), uid: "unit_name" },
      { name: t("columns.unitNameEn"), uid: "unit_name_e" },
      { name: t("columns.unitType"), uid: "unit_type" },
      { name: t("columns.unitStatus"), uid: "unit_status" },
      { name: t("columns.unitDefault"), uid: "unit_default" },
      { name: "", uid: "actions" },
    ],
    [t],
  );
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
      console.error(t("messages.loadError"), error);
      setUnits([]);
    }
  };

  const handleDeleteClick = (unit: Unit) => {
    if (!unit.id) {
      toast.error(t("messages.deleteErrorNoId"));

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
        toast.success(t("messages.deleteSuccess"));
        loadUnits();
      } else {
        toast.error(t("messages.deleteFailed"));
        loadUnits();
      }
    } catch (error) {
      console.error(t("messages.deleteError"), error);
      toast.error(t("messages.deleteError"));
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
      <Can I="view" a="basic.units">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={() => router.push(`/basic/units/${unit.id}`)}
        >
          <EyeIcon className="h-4 w-4 text-blue-500" />
        </Button>
      </Can>
      <Can I="update" a="basic.units">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={() => router.push(`/basic/units/${unit.id}?mode=edit`)}
        >
          <PencilIcon className="h-4 w-4 text-yellow-500" />
        </Button>
      </Can>
      <Can I="delete" a="basic.units">
        <Button
          isIconOnly
          color="danger"
          size="sm"
          variant="light"
          onPress={() => handleDeleteClick(unit)}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </Can>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 font-cairo">
      <div className="flex flex-wrap items-center gap-3">
        <Can I="create" a="basic.units">
          <Button
            className="bg-gray-100"
            variant="bordered"
            onPress={() => router.push("/basic/units/new")}
          >
            <PlusIcon className="h-3 w-3" />
            {t("actions.add")}
          </Button>
          <div className="h-8 w-px bg-gray-300" />
        </Can>
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={t("labels.searchPlaceholder")}
            size="sm"
            startContent={
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Table removeWrapper aria-label={t("labels.tableAriaLabel")}>
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

        <div className="flex flex-col items-start gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-gray-600">
            {t("labels.totalCount", { count: filtered.length })}
          </span>
          <Pagination
            color="primary"
            page={page}
            total={Math.ceil(filtered.length / rowsPerPage)}
            onChange={setPage}
          />
        </div>
      </div>

      <ConfirmationModal
        cancelText={t("modals.cancel")}
        confirmColor="danger"
        confirmText={t("modals.confirm")}
        isOpen={deleteModalOpen}
        message={t("modals.deleteMessage", { name: unitToDelete?.unit_name })}
        size="md"
        title={t("modals.deleteTitle")}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
