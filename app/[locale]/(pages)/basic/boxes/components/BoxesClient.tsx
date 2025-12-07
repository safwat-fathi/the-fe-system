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
import { useTranslations, useLocale } from "next-intl";

import { getLocaleDir } from "@/i18n/config";
import { ConfirmationModal } from "@/components/Modal";
import boxService from "@/services/api/box.service";
import { revalidateTableData } from "@/app/actions/revalidate.action";

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

  // Dynamic text alignment classes based on locale
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

  const rowsPerPage = 10;

  // إعادة تحميل البيانات
  // const loadBoxes = async () => {
  //   try {
  //     // const data = await boxService.getAllBoxes();
  //     const data = await boxesService.getBoxes();

  //     setBoxes(data as any[]);
  //   } catch (error) {
  //     toast.error("فشل في جلب الصناديق");
  //     setBoxes([]);
  //   }
  // };

  const loadBoxTypes = async () => {
    try {
      const data = await boxService.getBoxTypes();

      setBoxTypes(data);
    } catch {
      toast.error(t("messages.typesLoadError"));
      setBoxTypes([]);
    }
  };

  // تحميل أنواع الصناديق عند تحميل المكون
  React.useEffect(() => {
    loadBoxTypes();
  }, [t]);

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

    // Optimistic delete
    setBoxes((prevBoxes) => prevBoxes.filter((b) => b.id !== boxToDelete.id));

    try {
      const result = await boxService.deleteBox(boxToDelete.id);

      if (result) {
        toast.success(t("messages.deleteSuccess"));

        // Revalidate cache
        await revalidateTableData("boxes_list");
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
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        title={t("actions.view")}
        variant="light"
        onPress={() => router.push(`/basic/boxes/${box.id}`)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        title={t("actions.edit")}
        variant="light"
        onPress={() => router.push(`/basic/boxes/${box.id}?mode=edit`)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        title={t("actions.delete")}
        variant="light"
        onPress={() => handleDeleteClick(box)}
      >
        <TrashIcon className="h-4 w-4" />
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
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h2 className={`text-base font-semibold ${textAlign}`}>
          {t("labels.manage")}
        </h2>
        <div className="h-8 w-px bg-gray-300" />
        <Button
          className="bg-gray-100"
          variant="bordered"
          onPress={() => router.push("/basic/boxes/new")}
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
                <Checkbox isReadOnly isSelected={!!box.cust_status} />
              </TableCell>
              <TableCell>{renderActions(box)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="py-4 flex justify-between items-center">
        <span className={`text-sm text-gray-500 ${textAlign}`}>
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
          name: boxToDelete?.cust_name || "",
        })}
        size="md"
        title={t("modals.deleteTitle")}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
