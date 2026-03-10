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

import { getLocaleDir } from "@/i18n/config";
import { ConfirmationModal } from "@/components/Modal";
import boxService from "@/services/api/box.service";
import { revalidateBoxes } from "@/app/actions/revalidate.action";
import {
  ACTION_BUTTONS,
  CONFIRM_MODAL,
  DEFAULT_PAGE_SIZE,
  PAGINATION_BAR,
  TABLE_STYLE,
  TOOLBAR,
} from "@/constants/ui";

// Interface for customer boxes (customers with cust_type = 99)
interface CustomerBox {
  id: number;
  cust_code?: string;
  cust_name: string;
  cust_name_e: string;
  mobile: number | string;
  email: string;
  address: string;
  vat_no: number | null;
  cr_no: number | null;
  phone: string;
  fax: string;
  gov: string;
  city: string;
  area: string;
  street: string;
  build_no: string;
  post_code: string;
  cust_status: number;
  acc?: number;
  acc_name?: string;
  cust_type?: number;
  box_type: string;
  handling: string;
  handling_e?: string;
  perc?: number;
  expt?: boolean;
  hide?: boolean;
}

interface BoxesClientProps {
  initialData: CustomerBox[];
  error: string | null;
}

export default function BoxesClient({ initialData, error }: BoxesClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("basic.boxes");

  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const textAlignCenter = "text-center";

  const columns = useMemo(
    () => [
      { name: t("columns.id"), uid: "id" },
      { name: t("columns.code"), uid: "cust_code" },
      { name: t("columns.name"), uid: "cust_name" },
      { name: t("columns.nameEn"), uid: "cust_name_e" },
      { name: t("columns.type"), uid: "box_type" },
      { name: t("columns.status"), uid: "cust_status" },
      { name: t("columns.actions"), uid: "actions" },
    ],
    [t],
  );
  const [boxes, setBoxes] = useState<CustomerBox[]>(initialData);
  const [boxTypes, setBoxTypes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [boxToDelete, setBoxToDelete] = useState<CustomerBox | null>(null);

  const rowsPerPage = DEFAULT_PAGE_SIZE;

  const loadBoxTypes = async () => {
    try {
      const data = await boxService.getBoxTypes();

      setBoxTypes(data);
    } catch {
      toast.error(t("messages.typesLoadError"));
      setBoxTypes([]);
    }
  };

  React.useEffect(() => {
    loadBoxTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount only
  }, []);

  const handleDeleteClick = (box: CustomerBox) => {
    if (!box.id) {
      toast.error(t("messages.deleteErrorNoId"));

      return;
    }

    setBoxToDelete(box);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!boxToDelete?.id) {
      setDeleteModalOpen(false);
      setBoxToDelete(null);

      return;
    }

    setBoxes((prevBoxes) => prevBoxes.filter((b) => b.id !== boxToDelete.id));

    try {
      const result = await boxService.deleteBox(boxToDelete.id);

      if (result) {
        toast.success(t("messages.deleteSuccess"));
        await revalidateBoxes();
      } else {
        toast.error(t("messages.deleteFailed"));
        router.refresh();
      }
    } catch {
      toast.error(t("messages.deleteError"));
      router.refresh();
    } finally {
      setDeleteModalOpen(false);
      setBoxToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setBoxToDelete(null);
  };

  const filtered = useMemo(() => {
    return boxes.filter(
      (b) =>
        b.cust_name?.toLowerCase().includes(search.toLowerCase()) ||
        b.cust_code?.toString().toLowerCase().includes(search.toLowerCase()) ||
        b.cust_name_e?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [boxes, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  const renderActions = (box: CustomerBox) => (
    <div className={ACTION_BUTTONS.wrapper}>
      <Button
        isIconOnly
        size={ACTION_BUTTONS.size}
        title={t("actions.view")}
        variant={ACTION_BUTTONS.variant}
        onPress={() => router.push(`/basic/boxes/${box.id}`)}
      >
        <EyeIcon className={ACTION_BUTTONS.iconView} />
      </Button>
      <Button
        isIconOnly
        size={ACTION_BUTTONS.size}
        title={t("actions.edit")}
        variant={ACTION_BUTTONS.variant}
        onPress={() => router.push(`/basic/boxes/${box.id}?mode=edit`)}
      >
        <PencilIcon className={ACTION_BUTTONS.iconEdit} />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size={ACTION_BUTTONS.size}
        title={t("actions.delete")}
        variant={ACTION_BUTTONS.variant}
        onPress={() => handleDeleteClick(box)}
      >
        <TrashIcon className={ACTION_BUTTONS.iconSize} />
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className={`${textAlignCenter} py-8`}>
        <p className={`text-red-500 mb-4 ${textAlign}`}>
          {t("messages.cannotLoadData", { error })}
        </p>
        <Button color="primary">{t("actions.retry")}</Button>
      </div>
    );
  }

  return (
    <>
      <div className={TOOLBAR.root}>
        <Button
          className={TOOLBAR.addButton}
          variant={TOOLBAR.addButtonVariant}
          onPress={() => router.push("/basic/boxes/new")}
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
              <MagnifyingGlassIcon className={TOOLBAR.iconSearch} />
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Table
        aria-label={t("labels.tableAriaLabel")}
        classNames={TABLE_STYLE}
      >
        <TableHeader>
          {columns.map((col) => (
            <TableColumn key={col.uid}>{col.name}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {paginated.map((box) => (
            <TableRow key={box.id}>
              <TableCell>{box.id}</TableCell>
              <TableCell>{box.cust_code}</TableCell>
              <TableCell>{box.cust_name}</TableCell>
              <TableCell>{box.cust_name_e}</TableCell>
              <TableCell>
                {boxTypes.find((type) => type.code_id === Number(box.box_type))
                  ?.code_desc ||
                  box.box_type ||
                  "-"}
              </TableCell>
              <TableCell>
                {box.cust_status === 1
                  ? t("labels.active")
                  : t("labels.inactive")}
              </TableCell>
              <TableCell>{renderActions(box)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className={PAGINATION_BAR.root}>
        <span className={`${PAGINATION_BAR.countText} ${textAlign}`}>
          {t("labels.totalCount", { count: filtered.length })}
        </span>
        <Pagination
          color={PAGINATION_BAR.color}
          page={page}
          total={Math.ceil(filtered.length / rowsPerPage)}
          onChange={setPage}
        />
      </div>

      <ConfirmationModal
        cancelText={t("modals.cancel")}
        confirmColor={CONFIRM_MODAL.confirmColor}
        confirmText={t("modals.confirm")}
        isOpen={deleteModalOpen}
        message={t("modals.deleteMessage", {
          name: boxToDelete?.cust_name || "",
        })}
        size={CONFIRM_MODAL.size}
        title={t("modals.deleteTitle")}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
