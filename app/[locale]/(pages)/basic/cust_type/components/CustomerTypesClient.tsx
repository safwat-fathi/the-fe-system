"use client";

import type { Account } from "@/types/models/account";

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
import { useTranslations, useLocale } from "next-intl";

import { ConfirmationModal } from "@/components/Modal";
import customerTypeService, {
  type CustomerType,
  type CustTypeStatusOption,
} from "@/services/api/customer-type.service";
import { useQueryParams } from "@/utilities/hooks/useQueryParams";
import { getLocaleDir } from "@/i18n/config";
import {
  ACTION_BUTTONS,
  CONFIRM_MODAL,
  DEFAULT_PAGE_SIZE,
  PAGINATION_BAR,
  TABLE_STYLE,
  TOOLBAR,
} from "@/constants/ui";

interface CustomerTypesClientProps {
  initialTypes: CustomerType[];
  initialStatusOptions: CustTypeStatusOption[];
  initialSearch: string;
  accounts: Account[];
  loadError?: string | null;
}

type CustomerTypeQueryParams = {
  search: string;
};

export default function CustomerTypesClient({
  initialTypes,
  initialStatusOptions,
  initialSearch,
  accounts,
  loadError,
}: CustomerTypesClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const t = useTranslations("basic.customerTypes" as any) as any;
  const safeT = (key: string, fallback: string) =>
    typeof t.has === "function" && t.has(key) ? t(key) : fallback;
  const [isPending, startTransition] = useTransition();
  const [types, setTypes] = useState<CustomerType[]>(initialTypes);
  const [statusOptions] = useState<CustTypeStatusOption[]>(initialStatusOptions);
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<CustomerType | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rowsPerPage = DEFAULT_PAGE_SIZE;
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

  const displayName = (type: CustomerType) =>
    locale === "ar" ? type.type_name || type.type_name_e : type.type_name_e || type.type_name;

  const columns = useMemo(
    () => [
      { name: "ID", uid: "id" },
      { name: t("columns.typeName"), uid: "type_name" },
      { name: t("columns.typeDesc"), uid: "prefix" },
      { name: safeT("columns.mainAccount", locale === "ar" ? "الحساب الرئيسي" : "Main Account"), uid: "main_account" },
      { name: t("columns.typeStatus"), uid: "type_status" },
      { name: "", uid: "actions" },
    ],
    [locale, t],
  );

  const accountLabelById = useMemo(() => {
    return new Map(
      accounts.map((account) => [
        account.id,
        `${account.acc_id} - ${locale === "ar" ? account.acc_name : account.acc_name_e || account.acc_name}`,
      ]),
    );
  }, [accounts, locale]);

  const statusLabel = (type: CustomerType) => {
    const codeId = type.type_status ? 1 : 0;
    const opt = statusOptions.find((o) => o.code_id === codeId);

    return opt
      ? locale === "ar"
        ? opt.code_desc
        : opt.code_desc_l
      : "—";
  };

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
    <div className={ACTION_BUTTONS.wrapper}>
      <Button
        isIconOnly
        size={ACTION_BUTTONS.size}
        variant={ACTION_BUTTONS.variant}
        onPress={() => router.push(`/basic/cust_type/${type.id}`)}
      >
        <EyeIcon className={ACTION_BUTTONS.iconView} />
      </Button>
      <Button
        isIconOnly
        size={ACTION_BUTTONS.size}
        variant={ACTION_BUTTONS.variant}
        onPress={() => router.push(`/basic/cust_type/${type.id}?mode=edit`)}
      >
        <PencilIcon className={ACTION_BUTTONS.iconEdit} />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size={ACTION_BUTTONS.size}
        variant={ACTION_BUTTONS.variant}
        onPress={() => handleDeleteClick(type)}
      >
        <TrashIcon className={ACTION_BUTTONS.iconSize} />
      </Button>
    </div>
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return types.slice(start, start + rowsPerPage);
  }, [types, page]);

  return (
    <>
      <div className={TOOLBAR.root}>
        <Button
          className={TOOLBAR.addButton}
          variant={TOOLBAR.addButtonVariant}
          onPress={() => router.push("/basic/cust_type/new")}
        >
          <PlusIcon className={TOOLBAR.iconAdd} />
          {t("actions.add")}
        </Button>
        <div className={TOOLBAR.divider} />
        <div className={TOOLBAR.searchWrapper}>
          <Input
            placeholder={t("labels.searchPlaceholder")}
            size={TOOLBAR.inputSize}
            startContent={
              isPending ? (
                <div className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
              ) : (
                <MagnifyingGlassIcon className={TOOLBAR.iconSearch} />
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

      <Table
        aria-label={t("labels.tableAriaLabel")}
        classNames={TABLE_STYLE}
      >
        <TableHeader>
          {columns.map((col) => (
            <TableColumn key={col.uid}>{col.name}</TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent={t("labels.emptyContent")}>
          {paginated.map((type) => (
            <TableRow key={type.id}>
              <TableCell>{type.id}</TableCell>
              <TableCell>{displayName(type)}</TableCell>
              <TableCell>{type.prefix ?? "—"}</TableCell>
              <TableCell>
                {type.acc == null ? "—" : accountLabelById.get(type.acc) ?? "—"}
              </TableCell>
              <TableCell>{statusLabel(type)}</TableCell>
              <TableCell>{renderActions(type)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className={PAGINATION_BAR.root}>
        <span className={`${PAGINATION_BAR.countText} ${textAlign}`}>
          {t("labels.totalCount", { count: types.length })}
        </span>
        <Pagination
          color={PAGINATION_BAR.color}
          page={page}
          total={Math.max(1, Math.ceil(types.length / rowsPerPage))}
          onChange={setPage}
        />
      </div>

      <ConfirmationModal
        cancelText={t("modals.cancel")}
        confirmColor={CONFIRM_MODAL.confirmColor}
        confirmText={t("modals.confirm")}
        isOpen={deleteModalOpen}
        message={t("modals.deleteMessage", {
          name: typeToDelete ? displayName(typeToDelete) : "",
        })}
        size={CONFIRM_MODAL.size}
        title={t("modals.deleteTitle")}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
