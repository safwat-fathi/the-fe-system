"use client";

import React, { useState, useMemo } from "react";
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
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import costCenterService from "@/services/api/cost-center.service";
import { revalidateTableData } from "@/app/actions/revalidate.action";

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
  const [costCenters, setCostCenters] = useState<CostCenter[]>(initialData);
  const [accounts] = useState<Account[]>(initialAccounts);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [currentCostCenter, setCurrentCostCenter] = useState<
    Partial<CostCenter>
  >({});

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

  const handleSave = async () => {
    setCostCenters((prevCenters) => {
      const previousCostCenters = [...prevCenters];

      // Optimistic update for create
      if (modalMode === "add") {
        const optimisticId = Date.now();
        const optimisticCostCenter = {
          ...currentCostCenter,
          id: optimisticId,
          cr_date: new Date().toISOString(),
          cost_status: 1,
        } as CostCenter;

        return [...prevCenters, optimisticCostCenter];
      }

      return prevCenters;
    });

    try {
      let result: CostCenter | null = null;

      if (modalMode === "edit" && currentCostCenter.id) {
        result = await costCenterService.updateCostCenter(
          currentCostCenter.id,
          currentCostCenter,
        );
      } else {
        result = await costCenterService.createCostCenter(
          currentCostCenter as Omit<CostCenter, "id">,
        );
      }

      if (result) {
        toast.success(
          modalMode === "edit"
            ? "✅ تم تعديل مركز التكلفة بنجاح"
            : "✅ تم إضافة مركز التكلفة بنجاح",
        );

        // Revalidate cache
        await revalidateTableData("cost_centers_list");

        setIsModalOpen(false);
        loadCostCenters();
      } else {
        toast.error("❌ فشل في العملية");
        loadCostCenters();
      }
    } catch (error) {
      toast.error("❌ حدث خطأ أثناء حفظ مركز التكلفة");
      loadCostCenters();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف مركز التكلفة هذا؟")) return;

    // Optimistic delete
    setCostCenters((prevCenters) => prevCenters.filter((cc) => cc.id !== id));

    try {
      const result = await costCenterService.deleteCostCenter(id);

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
    }
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

  const openModal = (
    mode: "add" | "edit" | "view",
    costCenter: Partial<CostCenter> = {},
  ) => {
    setModalMode(mode);
    setCurrentCostCenter(costCenter);
    setIsModalOpen(true);
  };

  const isViewMode = modalMode === "view";

  const renderActions = (costCenter: CostCenter) => (
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openModal("view", costCenter)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openModal("edit", costCenter)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        variant="light"
        onPress={() => handleDelete(costCenter.id)}
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
      <div className="flex justify-between mb-4">
        <Button onPress={() => openModal("add")}>
          <PlusIcon className="h-4 w-4" /> إضافة مركز تكلفة
        </Button>
        <Input
          className="w-60"
          placeholder="بحث بالاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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

      <Modal
        isDismissable={false}
        isOpen={isModalOpen}
        scrollBehavior="inside"
        shouldBlockScroll={false}
        size="2xl"
        onClose={() => setIsModalOpen(false)}
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            {modalMode === "add" && "إضافة مركز تكلفة"}
            {modalMode === "edit" && "تعديل مركز تكلفة"}
            {modalMode === "view" && "عرض بيانات مركز التكلفة"}
          </ModalHeader>

          <ModalBody className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
            <Input
              isDisabled={isViewMode}
              label="اسم مركز التكلفة"
              value={currentCostCenter.cost_name || ""}
              onChange={(e) =>
                setCurrentCostCenter({
                  ...currentCostCenter,
                  cost_name: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الاسم بالإنجليزي"
              value={currentCostCenter.cost_name_e || ""}
              onChange={(e) =>
                setCurrentCostCenter({
                  ...currentCostCenter,
                  cost_name_e: e.target.value,
                })
              }
            />
            <Select
              isDisabled={isViewMode}
              label="نوع مركز التكلفة"
              placeholder="اختر نوع المركز"
              popoverProps={{ shouldBlockScroll: false }}
              selectedKeys={
                currentCostCenter.cost_type
                  ? [currentCostCenter.cost_type.toString()]
                  : []
              }
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0];

                setCurrentCostCenter({
                  ...currentCostCenter,
                  cost_type: selectedKey ? parseInt(selectedKey as string) : 1,
                });
              }}
            >
              <SelectItem key="1" textValue="مركز تكلفة رئيسي">
                مركز تكلفة رئيسي
              </SelectItem>
              <SelectItem key="2" textValue="مركز تكلفة فرعي">
                مركز تكلفة فرعي
              </SelectItem>
              <SelectItem key="3" textValue="مركز تكلفة نشاط">
                مركز تكلفة نشاط
              </SelectItem>
            </Select>
            <Select
              isDisabled={isViewMode}
              label="الحساب المرتبط"
              placeholder={
                accounts.length > 0
                  ? "اختر الحساب (اختياري)"
                  : "لا توجد حسابات متاحة"
              }
              popoverProps={{ shouldBlockScroll: false }}
              selectedKeys={
                currentCostCenter.acc ? [currentCostCenter.acc.toString()] : []
              }
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0];

                setCurrentCostCenter({
                  ...currentCostCenter,
                  acc: selectedKey ? parseInt(selectedKey as string) : null,
                });
              }}
            >
              {accounts.length > 0 ? (
                accounts.map((account) => (
                  <SelectItem
                    key={account.id.toString()}
                    textValue={`${account.acc_name} - ${account.id}`}
                  >
                    {account.acc_name} - {account.id}
                  </SelectItem>
                ))
              ) : (
                <SelectItem key="no-data" textValue="لا توجد حسابات">
                  لا توجد حسابات
                </SelectItem>
              )}
            </Select>
            <Select
              isDisabled={isViewMode}
              label="المركز الأب"
              placeholder="اختر المركز الأب (اختياري)"
              popoverProps={{ shouldBlockScroll: false }}
              selectedKeys={
                currentCostCenter.parent
                  ? [currentCostCenter.parent.toString()]
                  : []
              }
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0];

                setCurrentCostCenter({
                  ...currentCostCenter,
                  parent: selectedKey ? parseInt(selectedKey as string) : null,
                });
              }}
            >
              {costCenters
                .filter(
                  (cc) =>
                    !currentCostCenter.id || cc.id !== currentCostCenter.id,
                )
                .map((cc) => (
                  <SelectItem
                    key={cc.id.toString()}
                    textValue={`${cc.cost_name} - ${cc.id}`}
                  >
                    {cc.cost_name} - {cc.id}
                  </SelectItem>
                ))}
            </Select>
            <div className="col-span-2 flex gap-6 items-center">
              <Checkbox
                isDisabled={isViewMode}
                isSelected={!!currentCostCenter.cost_status}
                onValueChange={(val) =>
                  setCurrentCostCenter({
                    ...currentCostCenter,
                    cost_status: val ? 1 : 0,
                  })
                }
              >
                مفعل
              </Checkbox>
            </div>
          </ModalBody>

          {modalMode !== "view" && (
            <ModalFooter className="flex justify-end gap-2">
              <Button color="danger" onPress={() => setIsModalOpen(false)}>
                إلغاء
              </Button>
              <Button color="success" onPress={handleSave}>
                {modalMode === "edit" ? "تحديث" : "حفظ"}
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
