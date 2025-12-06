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

import { ConfirmationModal } from "@/components/Modal";
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

export default function CustomerTypesClient({
  initialTypes,
}: CustomerTypesClientProps) {
  const router = useRouter();
  const t = useTranslations("basic.customerTypes");
  const [types, setTypes] = useState<CustomerType[]>(initialTypes);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<CustomerType | null>(null);

  const rowsPerPage = 12;

  const columns = useMemo(
    () => [
      { name: "ID", uid: "id" },
      { name: t("columns.typeName"), uid: "type_name" },
      { name: t("columns.typeNameEn"), uid: "type_name_e" },
      { name: t("columns.typeDesc"), uid: "type_desc" },
      { name: t("columns.typeStatus"), uid: "type_status" },
      { name: "", uid: "actions" },
    ],
    [t],
  );

  const loadTypes = async () => {
    try {
      const data = await customerTypeService.getAllCustomerTypes();

      setTypes(data);
    } catch (error) {
      console.error(t("messages.loadError"), error);
      setTypes([]);
    }
  };

  const handleDeleteClick = (type: CustomerType) => {
    if (!type.id) {
      toast.error(t("messages.deleteErrorNoId"));

      return;
    }

    setTypeToDelete(type);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!typeToDelete?.id) {
      setDeleteModalOpen(false);
      setTypeToDelete(null);

      return;
    }

    // Optimistic delete
    setTypes((prevTypes) => prevTypes.filter((t) => t.id !== typeToDelete.id));

    try {
      const result = await customerTypeService.deleteCustomerType(
        typeToDelete.id,
      );

      if (result) {
        toast.success(t("messages.deleteSuccess"));
        loadTypes();
      } else {
        toast.error(t("messages.deleteFailed"));
        loadTypes();
      }
    } catch (error) {
      console.error(t("messages.deleteError"), error);
      toast.error(t("messages.deleteError"));
      loadTypes();
    } finally {
      setDeleteModalOpen(false);
      setTypeToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setTypeToDelete(null);
  };

  const renderActions = (type: CustomerType) => (
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => router.push(`/basic/cust_type/${type.id}`)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => router.push(`/basic/cust_type/${type.id}?mode=edit`)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        variant="light"
        onPress={() => handleDeleteClick(type)}
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

  return (
    <div className="responsive-container font-cairo">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h2 className="text-base font-semibold">{t("labels.manage")}</h2>
        <div className="h-8 w-px bg-gray-300" />
        <Button
          className="bg-gray-100"
          variant="bordered"
          onPress={() => router.push("/basic/cust_type/new")}
        >
          <PlusIcon className="h-3 w-3" />
          {t("actions.add")}
        </Button>
        <div className="h-8 w-px bg-gray-300" />
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

      <div className="responsive-table">
        <Table aria-label={t("labels.tableAriaLabel")}>
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
        <span>{t("labels.totalCount", { count: filtered.length })}</span>
        <Pagination
          color="primary"
          page={page}
          total={Math.ceil(filtered.length / rowsPerPage)}
          onChange={setPage}
        />
      </div>

      <ConfirmationModal
        cancelText={t("modals.cancel")}
        confirmColor="danger"
        confirmText={t("modals.confirm")}
        isOpen={deleteModalOpen}
        message={t("modals.deleteMessage", { name: typeToDelete?.type_name })}
        size="md"
        title={t("modals.deleteTitle")}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
