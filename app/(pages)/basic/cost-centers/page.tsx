"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
} from "@heroui/react";
import { HeroModal as Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/Modal";
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import ActionButtons from "@/components/ActionButtons";
import costCenterService from "@/services/api/cost-center.service";

// تم إزالة API_ENDPOINTS واستبدالها بـ costCenterService

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

const columns = [
  { name: "رقم المركز", uid: "id" },
  { name: "اسم مركز التكلفة", uid: "cost_name" },
  { name: "الاسم بالإنجليزي", uid: "cost_name_e" },
  { name: "نوع المركز", uid: "cost_type" },
  { name: "الحالة", uid: "cost_status" },
  { name: "", uid: "actions" },
];

export default function CostCentersPage() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [currentCostCenter, setCurrentCostCenter] = useState<Partial<CostCenter>>({});
  const [accounts, setAccounts] = useState<any[]>([]);

  const rowsPerPage = 10;

  // تم إزالة useCrud واستبداله بـ costCenterService

  const loadCostCenters = useCallback(async () => {
    try {
      const data = await costCenterService.getAllCostCenters();
      setCostCenters(data);
    } catch (error) {
      console.error("فشل في جلب مراكز التكلفة:", error);
      setCostCenters([]);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await costCenterService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("❌ خطأ في تحميل الحسابات:", error);
      setAccounts([]);
    }
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          loadCostCenters(),
          loadAccounts(),
        ]);
      } catch (error) {
        console.error("خطأ في تحميل البيانات:", error);
      }
    };

    loadAllData();
  }, [loadCostCenters, loadAccounts]);

  // إعادة تحميل البيانات عند العودة للصفحة
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // إعادة تحميل البيانات عند العودة للصفحة
        loadCostCenters();
      }
    };

    const handleFocus = () => {
      // إعادة تحميل البيانات عند التركيز على النافذة
      loadCostCenters();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadCostCenters]);

  const handleSave = async () => {
    try {
      let result: CostCenter | null = null;

      if (modalMode === "edit" && currentCostCenter.id) {
        result = await costCenterService.updateCostCenter(currentCostCenter.id, currentCostCenter);
      } else {
        result = await costCenterService.createCostCenter(currentCostCenter as Omit<CostCenter, 'id'>);
      }

      if (result) {
        toast.success(
          modalMode === "edit"
            ? "✅ تم تعديل مركز التكلفة بنجاح"
            : "✅ تم إضافة مركز التكلفة بنجاح",
        );
        setIsModalOpen(false);
        loadCostCenters();
      } else {
        toast.error("❌ فشل في العملية");
      }
    } catch (error) {
      console.error("❌ خطأ أثناء الحفظ:", error);
      toast.error("❌ حدث خطأ أثناء حفظ مركز التكلفة");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف مركز التكلفة هذا؟")) return;
    try {
      const result = await costCenterService.deleteCostCenter(id);

      if (result) {
        toast.success("✅ تم حذف مركز التكلفة بنجاح");
        loadCostCenters();
      } else {
        toast.error("❌ فشل في حذف مركز التكلفة");
      }
    } catch (error) {
      console.error("❌ خطأ أثناء الحذف:", error);
      toast.error("❌ حدث خطأ أثناء الحذف");
    }
  };

  const filtered = useMemo(() => {
    return costCenters.filter((cc) =>
      cc.cost_name?.toLowerCase().includes(search.toLowerCase()) ||
      cc.cost_name_e?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [costCenters, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

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
        size="sm"
        variant="light"
        color="danger"
        onPress={() => handleDelete(costCenter.id)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="p-4 font-cairo">
      <h1 className="text-2xl font-bold mb-6">مراكز التكلفة</h1>
      <div className="flex justify-between mb-4">
        <Button onPress={() => openModal("add")}>
          {" "}
          <PlusIcon className="h-4 w-4" /> إضافة مركز تكلفة{" "}
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
              <TableCell>{costCenter.cost_type}</TableCell>
              <TableCell>
                <Checkbox isReadOnly isSelected={!!costCenter.cost_status} />
              </TableCell>
              <TableCell>
                {renderActions(costCenter)}
              </TableCell>
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
        isOpen={isModalOpen}
        scrollBehavior="inside"
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
                setCurrentCostCenter({ ...currentCostCenter, cost_name: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الاسم بالإنجليزي"
              value={currentCostCenter.cost_name_e || ""}
              onChange={(e) =>
                setCurrentCostCenter({ ...currentCostCenter, cost_name_e: e.target.value })
              }
            />
            <Select
              isDisabled={isViewMode}
              label="نوع مركز التكلفة"
              selectedKeys={currentCostCenter.cost_type ? [currentCostCenter.cost_type.toString()] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0];
                setCurrentCostCenter({ 
                  ...currentCostCenter, 
                  cost_type: selectedKey ? parseInt(selectedKey as string) : 1 
                });
              }}
            >
              <SelectItem key="1" textValue="نوع 1">
                نوع 1
              </SelectItem>
              <SelectItem key="2" textValue="نوع 2">
                نوع 2
              </SelectItem>
              <SelectItem key="3" textValue="نوع 3">
                نوع 3
              </SelectItem>
            </Select>
            <Input
              isDisabled={isViewMode}
              label="الحساب المرتبط (رقم الحساب)"
              type="number"
              value={currentCostCenter.acc?.toString() || ""}
              onChange={(e) =>
                setCurrentCostCenter({ 
                  ...currentCostCenter, 
                  acc: e.target.value ? parseInt(e.target.value) : null 
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="المركز الأب (رقم المركز)"
              type="number"
              value={currentCostCenter.parent?.toString() || ""}
              onChange={(e) =>
                setCurrentCostCenter({ 
                  ...currentCostCenter, 
                  parent: e.target.value ? parseInt(e.target.value) : null 
                })
              }
            />
            <div className="col-span-2 flex gap-6 items-center">
              <Checkbox
                isDisabled={isViewMode}
                isSelected={!!currentCostCenter.cost_status}
                onValueChange={(val) =>
                  setCurrentCostCenter({ ...currentCostCenter, cost_status: val ? 1 : 0 })
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
    </div>
  );
}
