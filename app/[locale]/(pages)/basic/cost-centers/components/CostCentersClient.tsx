"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import costCenterService from "@/services/api/cost-center.service";
import { revalidateTableData } from "@/app/actions/revalidate.action";
import { ConfirmationModal } from "@/components/Modal";

// Interface for cost centers
interface CostCenter {
  id: number;
  cost_name: string;
  cost_name_e: string;
  cost_type: number;
  cr_date: string;
  cr_user: number | null;
  upd_date: string | null;
  upd_user: number | null;
  cost_status: number;
  acc: number | null;
  parent: number | null;
}

interface Account {
  id: number;
  acc_name: string;
  acc_name_e?: string;
}

interface CostCentersClientProps {
  initialData: CostCenter[];
  initialAccounts: Account[];
  error: string | null;
}

export default function CostCentersClient({
  initialData,
  initialAccounts,
  error,
}: CostCentersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("basic.costCenters");
  const prevPathnameRef = useRef(pathname);

  // Dynamic text alignment classes based on locale
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const textAlignCenter = "text-center";

  const columns = useMemo(
    () => [
      { name: t("columns.id"), uid: "id" },
      { name: t("columns.costName"), uid: "cost_name" },
      { name: t("columns.costNameEn"), uid: "cost_name_e" },
      { name: t("columns.costType"), uid: "cost_type" },
      { name: t("columns.account"), uid: "acc" },
      { name: t("columns.parent"), uid: "parent" },
      { name: t("columns.status"), uid: "cost_status" },
      { name: t("columns.actions"), uid: "actions" },
    ],
    [t],
  );

  // Helper function to get cost center type label
  const getCostCenterTypeLabel = (type: number): string => {
    const types: Record<number, string> = {
      1: t("types.main"),
      2: t("types.sub"),
      3: t("types.activity"),
    };

    return types[type] || t("types.unknown", { type });
  };
  const [costCenters, setCostCenters] = useState<CostCenter[]>(initialData);
  const [accounts] = useState<Account[]>(initialAccounts);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [costCenterToDelete, setCostCenterToDelete] =
    useState<CostCenter | null>(null);

  const rowsPerPage = 10;

  // إعادة تحميل البيانات
  const loadCostCenters = useCallback(async () => {
    try {
      const data = await costCenterService.getAllCostCenters();

      setCostCenters(data);
    } catch {
      toast.error(t("messages.loadError"));
      setCostCenters([]);
    }
  }, [t]);

  // إعادة تحميل البيانات عند العودة للصفحة من صفحة أخرى
  useEffect(() => {
    if (
      pathname === "/basic/cost-centers" &&
      prevPathnameRef.current !== pathname
    ) {
      loadCostCenters();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, loadCostCenters]);

  const handleDeleteClick = (costCenter: CostCenter) => {
    if (!costCenter.id) {
      toast.error(t("messages.deleteErrorNoId"));

      return;
    }

    setCostCenterToDelete(costCenter);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!costCenterToDelete?.id) {
      setDeleteModalOpen(false);
      setCostCenterToDelete(null);

      return;
    }

    // Optimistic delete
    setCostCenters((prevCenters) =>
      prevCenters.filter((cc) => cc.id !== costCenterToDelete.id),
    );

    try {
      const result = await costCenterService.deleteCostCenter(
        costCenterToDelete.id,
      );

      if (result) {
        toast.success(t("messages.deleteSuccess"));

        // Revalidate cache
        await revalidateTableData("cost_centers_list");

        loadCostCenters();
      } else {
        toast.error(t("messages.deleteFailed"));
        loadCostCenters();
      }
    } catch {
      toast.error(t("messages.deleteError"));
      loadCostCenters();
    } finally {
      setDeleteModalOpen(false);
      setCostCenterToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setCostCenterToDelete(null);
  };

  const filtered = useMemo(() => {
    return costCenters.filter(
      (cc) =>
        cc.cost_name?.toLowerCase().includes(search.toLowerCase()) ||
        cc.cost_name_e?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [costCenters, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  // دالة مساعدة للحصول على اسم الحساب - في useMemo بدلاً من useCallback
  const accountsMap = useMemo(() => {
    return new Map(accounts.map((acc) => [acc.id, acc.acc_name]));
  }, [accounts]);

  // دالة مساعدة للحصول على اسم المركز الأب - في useMemo بدلاً من useCallback
  const costCentersMap = useMemo(() => {
    return new Map(costCenters.map((cc) => [cc.id, cc.cost_name]));
  }, [costCenters]);

  const getAccountName = (accId: number | null): string => {
    if (!accId) return "-";

    return accountsMap.get(accId) || `${accId}`;
  };

  const getParentName = (parentId: number | null): string => {
    if (!parentId) return "-";

    return costCentersMap.get(parentId) || `${parentId}`;
  };

  const renderActions = (costCenter: CostCenter) => (
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        title={t("actions.view")}
        variant="light"
        onPress={() => router.push(`/basic/cost-centers/${costCenter.id}`)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        title={t("actions.edit")}
        variant="light"
        onPress={() =>
          router.push(`/basic/cost-centers/${costCenter.id}?mode=edit`)
        }
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        title={t("actions.delete")}
        variant="light"
        onPress={() => handleDeleteClick(costCenter)}
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
        <Button color="primary" onClick={loadCostCenters}>
          {t("actions.retry")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <Button
          className="bg-gray-100"
          variant="bordered"
          onPress={() => router.push("/basic/cost-centers/new")}
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
          {paginated.map((costCenter) => (
            <TableRow key={costCenter.id}>
              <TableCell>{costCenter.id}</TableCell>
              <TableCell>{costCenter.cost_name}</TableCell>
              <TableCell>{costCenter.cost_name_e}</TableCell>
              <TableCell>
                {getCostCenterTypeLabel(costCenter.cost_type)}
              </TableCell>
              <TableCell>{getAccountName(costCenter.acc)}</TableCell>
              <TableCell>{getParentName(costCenter.parent)}</TableCell>
              <TableCell>
                <Checkbox isReadOnly isSelected={!!costCenter.cost_status} />
              </TableCell>
              <TableCell>{renderActions(costCenter)}</TableCell>
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
          name: costCenterToDelete?.cost_name || "",
        })}
        size="md"
        title={t("modals.deleteTitle")}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
