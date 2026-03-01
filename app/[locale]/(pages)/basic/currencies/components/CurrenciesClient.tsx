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

  // Dynamic text alignment classes based on locale
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

  const rowsPerPage = 12;

  // تحديث البيانات عند تغيير initialData
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

  // إعادة تحميل البيانات عند العودة للصفحة
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

    // Optimistic delete
    setCurrencies((prevCurrencies) =>
      prevCurrencies.filter((c) => c.id !== currencyToDelete.id),
    );

    try {
      const result = await currencyService.deleteCurrency(currencyToDelete.id);

      if (result) {
        toast.success(t("messages.deleteSuccess"));

        // Revalidate cache
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
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        title={t("actions.view")}
        variant="light"
        onPress={() => router.push(`/basic/currencies/${cur.id}`)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        title={t("actions.edit")}
        variant="light"
        onPress={() => router.push(`/basic/currencies/${cur.id}?mode=edit`)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        title={t("actions.delete")}
        variant="light"
        onPress={() => handleDeleteClick(cur)}
      >
        <TrashIcon className="h-4 w-4" />
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
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <Button
          className="bg-gray-100"
          variant="bordered"
          onPress={() => router.push("/basic/currencies/new")}
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

      <Table aria-label={t("labels.tableAriaLabel")}>
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

      <div className="flex justify-between items-center py-4">
        <span className={textAlign}>
          {t("labels.totalCount", { count: filtered.length })}
        </span>
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
        message={t("modals.deleteMessage", {
          name: currencyToDelete?.cur_name || "",
        })}
        size="md"
        title={t("modals.deleteTitle")}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
