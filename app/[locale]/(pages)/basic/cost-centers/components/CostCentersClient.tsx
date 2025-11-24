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

const columns = [
  { name: "رقم المركز", uid: "id" },
  { name: "اسم مركز التكلفة", uid: "cost_name" },
  { name: "الاسم بالإنجليزي", uid: "cost_name_e" },
  { name: "نوع المركز", uid: "cost_type" },
  { name: "الحساب المرتبط", uid: "acc" },
  { name: "المركز الأب", uid: "parent" },
  { name: "الحالة", uid: "cost_status" },
  { name: "", uid: "actions" },
];

// Helper function to get cost center type label
const getCostCenterTypeLabel = (type: number): string => {
  const types: Record<number, string> = {
    1: "مركز تكلفة رئيسي",
    2: "مركز تكلفة فرعي",
    3: "مركز تكلفة نشاط",
  };

  return types[type] || `نوع ${type}`;
};

export default function CostCentersClient({
  initialData,
  initialAccounts,
  error,
}: CostCentersClientProps) {
  const router = useRouter();
  const [costCenters, setCostCenters] = useState<CostCenter[]>(initialData);
  const [accounts] = useState<Account[]>(initialAccounts);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [costCenterToDelete, setCostCenterToDelete] =
    useState<CostCenter | null>(null);

  const rowsPerPage = 10;

  // إعادة تحميل البيانات
  const loadCostCenters = async () => {
    try {
      const data = await costCenterService.getAllCostCenters();

      setCostCenters(data);
    } catch (error) {
      toast.error("فشل في جلب مراكز التكلفة");
      setCostCenters([]);
    }
  };

  const handleDeleteClick = (costCenter: CostCenter) => {
    if (!costCenter.id) {
      toast.error("❌ لا يمكن حذف مركز تكلفة بدون معرف");

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
        toast.success("✅ تم حذف مركز التكلفة بنجاح");

        // Revalidate cache
        await revalidateTableData("cost_centers_list");

        loadCostCenters();
      } else {
        toast.error("❌ فشل في حذف مركز التكلفة");
        loadCostCenters();
      }
    } catch (error) {
      toast.error("❌ حدث خطأ أثناء الحذف");
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
        variant="light"
        onPress={() => router.push(`/basic/cost-centers/${costCenter.id}`)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
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
        variant="light"
        onPress={() => handleDeleteClick(costCenter)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">لا يمكن تحميل البيانات: {error}</p>
        <Button color="primary" onClick={loadCostCenters}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h2 className="text-base font-semibold">إدارة مراكز التكلفة</h2>
        <div className="h-8 w-px bg-gray-300" />
        <Button
          className="bg-gray-100"
          variant="bordered"
          onPress={() => router.push("/basic/cost-centers/new")}
        >
          <PlusIcon className="h-3 w-3" />
          إضافة مركز تكلفة
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

      <Table aria-label="جدول مراكز التكلفة">
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
        <span className="text-sm text-gray-500">
          عدد مراكز التكلفة: {filtered.length}
        </span>
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
        message={`هل أنت متأكد من حذف مركز التكلفة "${costCenterToDelete?.cost_name}"؟`}
        size="md"
        title="تأكيد الحذف"
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
