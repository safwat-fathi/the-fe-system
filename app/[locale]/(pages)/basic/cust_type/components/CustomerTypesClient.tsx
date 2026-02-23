"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { useQueryParams } from "@/utilities/hooks/useQueryParams";

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
  initialSearch: string;
  loadError?: string | null;
}

type CustomerTypeQueryParams = {
  search: string;
};

export default function CustomerTypesClient({
  initialTypes,
  initialSearch,
  loadError,
}: CustomerTypesClientProps) {
  const router = useRouter();
  const t = useTranslations("basic.customerTypes" as any) as any;
  const [isPending, startTransition] = useTransition();
  const [types, setTypes] = useState<CustomerType[]>(initialTypes);
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<CustomerType | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rowsPerPage = 12;
  const { params, setParams } = useQueryParams<CustomerTypeQueryParams>(
    ["search"],
    {
      defaultValues: { search: "" },
      schema: {
        search: {
          parse: (value) => value ?? "",
          serialize: (value) => value ?? "",
          default: "",
        },
      },
      pushMode: "replace",
      refreshOnChange: true,
      debounce: 0,
    },
  );

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

  useEffect(() => {
    setTypes(initialTypes);
    setPage(1);
  }, [initialTypes]);

  useEffect(() => {
    setSearchValue(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (params.search !== searchValue) {
      setSearchValue(params.search);
    }
  }, [params.search, searchValue]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const updateSearchParam = (value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        setParams({ search: value });
      });
    }, 400);
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

    const previousTypes = types;

    setTypes((prevTypes) => prevTypes.filter((type) => type.id !== typeToDelete.id));

    try {
      const result = await customerTypeService.deleteCustomerType(
        typeToDelete.id,
      );

      if (result) {
        toast.success(t("messages.deleteSuccess"));
        router.refresh();
      } else {
        setTypes(previousTypes);
        toast.error(t("messages.deleteFailed"));
      }
    } catch {
      setTypes(previousTypes);
      toast.error(t("messages.deleteError"));
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

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return types.slice(start, start + rowsPerPage);
  }, [types, page]);

  return (
    <div className="flex flex-col gap-6 font-cairo">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="bg-gray-100"
          variant="bordered"
          onPress={() => router.push("/basic/cust_type/new")}
        >
          <PlusIcon className="h-3 w-3" />
          {t("actions.add")}
        </Button>
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={t("labels.searchPlaceholder")}
            size="sm"
            startContent={
              isPending ? (
                <div className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              )
            }
            value={searchValue}
            onChange={(e) => {
              const value = e.target.value;

              setSearchValue(value);
              setPage(1);
              updateSearchParam(value);
            }}
          />
        </div>
      </div>

      {loadError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Table removeWrapper aria-label={t("labels.tableAriaLabel")}>
          <TableHeader>
            {columns.map((col) => (
              <TableColumn key={col.uid}>{col.name}</TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent={t("labels.emptyContent")}>
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

        <div className="flex flex-col items-start gap-2 border-t border-gray-100 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-gray-600">
            {t("labels.totalCount", { count: types.length })}
          </span>
          <Pagination
            color="primary"
            page={page}
            total={Math.max(1, Math.ceil(types.length / rowsPerPage))}
            onChange={setPage}
          />
        </div>
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
