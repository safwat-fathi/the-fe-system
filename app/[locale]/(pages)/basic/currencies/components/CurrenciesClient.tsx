"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { useTranslations, useLocale } from "next-intl";

import { getLocaleDir } from "@/i18n/config";
import currencyService from "@/services/api/currency.service";
import { revalidateTableData } from "@/app/actions/revalidate.action";
import { ConfirmationModal } from "@/components/Modal";
import {
  ACTION_BUTTONS,
  CONFIRM_MODAL,
  PAGINATION_BAR,
  PAGE_SIZE_OVERRIDES,
  TABLE_STYLE,
  TOOLBAR,
} from "@/constants/ui";

interface Currency {
  id: number;
  cur_name: string;
  cur_name_e: string;
  cur_part: string;
  cur_part_e: string;
  cur_sign: string;
  cur_price: string;
  cur_tag: string;
  cr_date: string;
  cur_status: boolean;
}

interface CurrenciesClientProps {
  initialData: Currency[];
  error?: string | null;
}

export default function CurrenciesClient({
  initialData,
  error: _error,
}: CurrenciesClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("basic.currencies");

  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  const columns = useMemo(
    () => [
      { name: t("columns.name"), uid: "cur_name" },
      { name: t("columns.nameEn"), uid: "cur_name_e" },
      { name: t("columns.part"), uid: "cur_part" },
      { name: t("columns.partEn"), uid: "cur_part_e" },
      { name: t("columns.sign"), uid: "cur_sign" },
      { name: t("columns.price"), uid: "cur_price" },
      { name: t("columns.tag"), uid: "cur_tag" },
      { name: t("columns.status"), uid: "cur_status" },
      { name: t("columns.actions"), uid: "actions" },
    ],
    [t],
  );
  const [currencies, setCurrencies] = useState<Currency[]>(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currencyToDelete, setCurrencyToDelete] = useState<Currency | null>(
    null,
  );

  const rowsPerPage = PAGE_SIZE_OVERRIDES.currencies;

  useEffect(() => {
    setCurrencies(initialData);
  }, [initialData]);

  const loadCurrencies = useCallback(async () => {
    try {
      const data = await currencyService.getAllCurrencies();

      setCurrencies(data);
    } catch {
      toast.error(t("messages.loadError"));
      setCurrencies([]);
    }
  }, [t]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCurrencies();
      }
    };

    const handleFocus = () => {
      loadCurrencies();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadCurrencies]);

  const handleDeleteClick = (currency: Currency) => {
    if (!currency.id) {
      toast.error(t("messages.deleteErrorNoId"));

      return;
    }

    setCurrencyToDelete(currency);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currencyToDelete?.id) {
      setDeleteModalOpen(false);
      setCurrencyToDelete(null);

      return;
    }

    setCurrencies((prevCurrencies) =>
      prevCurrencies.filter((c) => c.id !== currencyToDelete.id),
    );

    try {
      const result = await currencyService.deleteCurrency(currencyToDelete.id);

      if (result) {
        toast.success(t("messages.deleteSuccess"));
        await revalidateTableData("currencies_list");

        loadCurrencies();
      } else {
        toast.error(t("messages.deleteFailed"));
        loadCurrencies();
      }
    } catch {
      toast.error(t("messages.deleteError"));
      loadCurrencies();
    } finally {
      setDeleteModalOpen(false);
      setCurrencyToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setCurrencyToDelete(null);
  };

  const renderActions = (cur: Currency) => (
    <div className={ACTION_BUTTONS.wrapper}>
      <Button
        isIconOnly
        size={ACTION_BUTTONS.size}
        title={t("actions.view")}
        variant={ACTION_BUTTONS.variant}
        onPress={() => router.push(`/basic/currencies/${cur.id}`)}
      >
        <EyeIcon className={ACTION_BUTTONS.iconView} />
      </Button>
      <Button
        isIconOnly
        size={ACTION_BUTTONS.size}
        title={t("actions.edit")}
        variant={ACTION_BUTTONS.variant}
        onPress={() => router.push(`/basic/currencies/${cur.id}?mode=edit`)}
      >
        <PencilIcon className={ACTION_BUTTONS.iconEdit} />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size={ACTION_BUTTONS.size}
        title={t("actions.delete")}
        variant={ACTION_BUTTONS.variant}
        onPress={() => handleDeleteClick(cur)}
      >
        <TrashIcon className={ACTION_BUTTONS.iconSize} />
      </Button>
    </div>
  );

  const filtered = useMemo(
    () =>
      currencies.filter((c) =>
        c.cur_name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [currencies, search],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  return (
    <>
      <div className={TOOLBAR.root}>
        <Button
          className={TOOLBAR.addButton}
          variant={TOOLBAR.addButtonVariant}
          onPress={() => router.push("/basic/currencies/new")}
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
          {paginated.map((cur) => (
            <TableRow key={cur.id}>
              <TableCell>{cur.cur_name}</TableCell>
              <TableCell>{cur.cur_name_e}</TableCell>
              <TableCell>{cur.cur_part}</TableCell>
              <TableCell>{cur.cur_part_e}</TableCell>
              <TableCell>{cur.cur_sign}</TableCell>
              <TableCell>{cur.cur_price}</TableCell>
              <TableCell>{cur.cur_tag}</TableCell>
              <TableCell>
                <Checkbox isReadOnly isSelected={cur.cur_status} />
              </TableCell>
              <TableCell>{renderActions(cur)}</TableCell>
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
          name: currencyToDelete?.cur_name || "",
        })}
        size={CONFIRM_MODAL.size}
        title={t("modals.deleteTitle")}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
