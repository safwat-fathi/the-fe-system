"use client";

import type { Selection } from "@react-types/shared";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Divider,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import toast from "react-hot-toast";

import {
  deleteUserCompanyAction,
  deleteUserCostCenterAction,
  loadUserAssignmentsAction,
  saveUserCompanyAction,
  saveUserCostCenterAction,
} from "@/app/actions/user-assignments.action";
import {
  UserCompanyRecord,
  UserCostCenterRecord,
} from "@/types/models/user-company";

type Option = {
  id: number;
  label: string;
  helper?: string | null;
};

type Props = {
  users: Option[];
  branches: Option[];
  costCenters: Option[];
  initialUserId: number | null;
  initialAssignments: {
    companies: UserCompanyRecord[];
    costCenters: UserCostCenterRecord[];
  };
};

export default function UserAssignmentsClient({
  users,
  branches,
  costCenters,
  initialUserId,
  initialAssignments,
}: Props) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    initialUserId ?? null,
  );
  const [companyAssignments, setCompanyAssignments] = useState<
    UserCompanyRecord[]
  >(initialAssignments.companies);
  const [costAssignments, setCostAssignments] = useState<
    UserCostCenterRecord[]
  >(initialAssignments.costCenters);
  const [selectedBranchKey, setSelectedBranchKey] = useState<string | null>(
    null,
  );
  const [selectedCostKey, setSelectedCostKey] = useState<string | null>(null);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isSavingCost, setIsSavingCost] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);

  useEffect(() => {
    setCompanyAssignments(initialAssignments.companies ?? []);
    setCostAssignments(initialAssignments.costCenters ?? []);
  }, [initialAssignments.companies, initialAssignments.costCenters]);

  const branchNameById = useMemo(() => {
    const map = new Map<number, string>();

    branches.forEach((branch) => {
      map.set(branch.id, branch.label);
    });

    return map;
  }, [branches]);

  const costCenterNameById = useMemo(() => {
    const map = new Map<number, string>();

    costCenters.forEach((costCenter) => {
      map.set(costCenter.id, costCenter.label);
    });

    return map;
  }, [costCenters]);

  const assignedBranchIds = useMemo(
    () =>
      new Set(companyAssignments.map((assignment) => Number(assignment.com))),
    [companyAssignments],
  );

  const assignedCostCenterIds = useMemo(
    () => new Set(costAssignments.map((assignment) => Number(assignment.cost))),
    [costAssignments],
  );

  const availableBranches = useMemo(
    () =>
      branches.filter((branch) => !assignedBranchIds.has(Number(branch.id))),
    [branches, assignedBranchIds],
  );

  const availableCostCenters = useMemo(
    () =>
      costCenters.filter(
        (costCenter) => !assignedCostCenterIds.has(Number(costCenter.id)),
      ),
    [costCenters, assignedCostCenterIds],
  );

  const noUsersAvailable = users.length === 0;
  const branchCount = companyAssignments.length;
  const costCenterCount = costAssignments.length;
  const selectedUser = selectedUserId
    ? (users.find((user) => user.id === selectedUserId) ?? null)
    : null;

  const refreshAssignments = async (userId: number, showSpinner = false) => {
    if (!userId) {
      setCompanyAssignments([]);
      setCostAssignments([]);

      return;
    }

    if (showSpinner) {
      setIsLoadingAssignments(true);
    }

    try {
      const result = await loadUserAssignmentsAction(userId);

      if (!result.success) {
        toast.error(result.error);

        return;
      }

      setCompanyAssignments(result.data?.companies ?? []);
      setCostAssignments(result.data?.costCenters ?? []);
    } catch (error) {
      console.error("Failed to refresh assignments:", error);
      toast.error("تعذر تحديث بيانات المستخدم المختار");
    } finally {
      if (showSpinner) {
        setIsLoadingAssignments(false);
      }
    }
  };

  const handleUserSelectionChange = async (keys: Selection) => {
    if (keys === "all") {
      return;
    }

    const firstKey = Array.from(keys)[0];

    if (!firstKey) {
      return;
    }

    const userId = Number(firstKey);

    if (Number.isNaN(userId)) {
      toast.error("المعرف المحدد للمستخدم غير صالح");

      return;
    }

    setSelectedUserId(userId);
    setSelectedBranchKey(null);
    setSelectedCostKey(null);
    await refreshAssignments(userId, true);
  };

  const handleAddCompany = async () => {
    if (!selectedUserId) {
      toast.error("يرجى اختيار مستخدم أولاً");

      return;
    }

    if (!selectedBranchKey) {
      toast.error("يرجى اختيار فرع للإضافة");

      return;
    }

    const branchId = Number(selectedBranchKey);

    if (Number.isNaN(branchId)) {
      toast.error("المعرف المحدد للفرع غير صالح");

      return;
    }

    if (assignedBranchIds.has(branchId)) {
      toast.error("هذا الفرع مرتبط بالفعل بالمستخدم");

      return;
    }

    setIsSavingCompany(true);

    try {
      const result = await saveUserCompanyAction({
        user: selectedUserId,
        com: branchId,
      });

      if (!result.success) {
        toast.error(result.error);

        return;
      }

      await refreshAssignments(selectedUserId);
      setSelectedBranchKey(null);
      toast.success("تم حفظ الفرع للمستخدم بنجاح");
    } catch (error) {
      console.error("Failed to save user company:", error);
      toast.error("حدث خطأ أثناء حفظ الفرع للمستخدم");
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleRemoveCompany = async (record: UserCompanyRecord) => {
    if (!selectedUserId) {
      return;
    }

    if (!confirm("هل أنت متأكد من حذف هذا الفرع من المستخدم؟")) {
      return;
    }

    setDeletingRecordId(record.id);

    try {
      const result = await deleteUserCompanyAction(record.id);

      if (!result.success) {
        toast.error(result.error);

        return;
      }

      await refreshAssignments(selectedUserId);
      toast.success("تم حذف الفرع من المستخدم");
    } catch (error) {
      console.error("Failed to delete user company:", error);
      toast.error("حدث خطأ أثناء حذف الفرع");
    } finally {
      setDeletingRecordId(null);
    }
  };

  const handleAddCostCenter = async () => {
    if (!selectedUserId) {
      toast.error("يرجى اختيار مستخدم أولاً");

      return;
    }

    if (!selectedCostKey) {
      toast.error("يرجى اختيار مركز تكلفة للإضافة");

      return;
    }

    const costId = Number(selectedCostKey);

    if (Number.isNaN(costId)) {
      toast.error("المعرف المحدد لمركز التكلفة غير صالح");

      return;
    }

    if (assignedCostCenterIds.has(costId)) {
      toast.error("هذا المركز مرتبط بالفعل بالمستخدم");

      return;
    }

    setIsSavingCost(true);

    try {
      const result = await saveUserCostCenterAction({
        user: selectedUserId,
        cost: costId,
      });

      if (!result.success) {
        toast.error(result.error);

        return;
      }

      await refreshAssignments(selectedUserId);
      setSelectedCostKey(null);
      toast.success("تم حفظ مركز التكلفة للمستخدم");
    } catch (error) {
      console.error("Failed to save user cost center:", error);
      toast.error("حدث خطأ أثناء حفظ مركز التكلفة للمستخدم");
    } finally {
      setIsSavingCost(false);
    }
  };

  const handleRemoveCostCenter = async (record: UserCostCenterRecord) => {
    if (!selectedUserId) {
      return;
    }

    if (!confirm("هل أنت متأكد من حذف مركز التكلفة من المستخدم؟")) {
      return;
    }

    setDeletingRecordId(record.id);

    try {
      const result = await deleteUserCostCenterAction(record.id);

      if (!result.success) {
        toast.error(result.error);

        return;
      }

      await refreshAssignments(selectedUserId);
      toast.success("تم حذف مركز التكلفة");
    } catch (error) {
      console.error("Failed to delete user cost center:", error);
      toast.error("حدث خطأ أثناء حذف مركز التكلفة");
    } finally {
      setDeletingRecordId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card shadow="sm">
        <CardBody className="space-y-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-gray-800 text-right">
              إدارة صلاحيات المستخدم للفروع ومراكز التكلفة
            </h2>
            <p className="text-sm text-gray-600 leading-6 text-right">
              اختر المستخدم المطلوب، ثم قم بتخصيص الفروع ومراكز التكلفة التي
              يُسمح له بالعمل عليها. يتم حفظ التغييرات فوراً بعد الإضافة أو
              الحذف.
            </p>
          </div>

          {noUsersAvailable ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-gray-500">
              لا توجد حسابات مستخدمين متاحة حالياً. يرجى إنشاء مستخدمين من إدارة
              الصلاحيات أولاً.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_1fr] items-start">
              <div className="space-y-2">
                <Select
                  label="المستخدم"
                  placeholder="اختر المستخدم"
                  selectedKeys={
                    selectedUserId !== null
                      ? new Set<string>([String(selectedUserId)])
                      : new Set<string>()
                  }
                  onSelectionChange={handleUserSelectionChange}
                >
                  {users.map((user) => (
                    <SelectItem
                      key={String(user.id)}
                      description={user.helper ?? undefined}
                      textValue={user.label}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{user.label}</span>
                        {user.helper ? (
                          <span className="text-xs text-gray-500">
                            {user.helper}
                          </span>
                        ) : null}
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    عدد الفروع المصرح بها
                  </p>
                  <p className="text-xl font-semibold text-slate-800">
                    {branchCount}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    عدد مراكز التكلفة المفعلة
                  </p>
                  <p className="text-xl font-semibold text-slate-800">
                    {costCenterCount}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">المستخدم الحالي</p>
                  <p className="text-sm font-medium text-slate-700">
                    {selectedUser?.label ?? " — "}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-full" shadow="sm">
          <CardBody className="space-y-5">
            <header className="flex items-start justify-between gap-4">
              <div className="space-y-1 text-right flex-1">
                <h3 className="text-lg font-semibold text-gray-800 text-right">
                  الفروع المصرح بها
                </h3>
                <p className="text-sm text-gray-600 text-right">
                  قم بإضافة الفروع التي يمكن للمستخدم العمل ضمنها، أو قم
                  بإزالتها عند الحاجة.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
                {branchCount} فرع
              </span>
            </header>

            {!selectedUserId ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-gray-500">
                يرجى اختيار مستخدم أولاً لعرض الفروع الخاصة به.
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
                  <Select
                    isDisabled={
                      availableBranches.length === 0 || isLoadingAssignments
                    }
                    label="اختر فرعاً للإضافة"
                    placeholder={
                      availableBranches.length === 0
                        ? "جميع الفروع مضافة"
                        : "اختر الفرع"
                    }
                    selectedKeys={
                      selectedBranchKey
                        ? new Set<string>([selectedBranchKey])
                        : new Set<string>()
                    }
                    onSelectionChange={(keys) => {
                      if (keys === "all") {
                        return;
                      }

                      const key = Array.from(keys)[0] as string | undefined;

                      setSelectedBranchKey(key ?? null);
                    }}
                  >
                    {availableBranches.map((branch) => (
                      <SelectItem
                        key={String(branch.id)}
                        textValue={branch.label}
                      >
                        {branch.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Button
                    className="self-end"
                    color="primary"
                    isDisabled={
                      !selectedBranchKey ||
                      availableBranches.length === 0 ||
                      isLoadingAssignments
                    }
                    isLoading={isSavingCompany}
                    onPress={handleAddCompany}
                  >
                    إضافة الفرع
                  </Button>
                </div>

                <Divider />

                <div className="rounded-lg border border-gray-200">
                  {isLoadingAssignments ? (
                    <div className="flex items-center justify-center py-10">
                      <Spinner label="جاري تحميل الفروع..." />
                    </div>
                  ) : (
                    <Table
                      removeWrapper
                      aria-label="الفروع المرتبطة بالمستخدم"
                      classNames={{
                        table: "min-h-[200px]",
                      }}
                    >
                      <TableHeader>
                        <TableColumn className="text-right">الفرع</TableColumn>
                        <TableColumn className="w-28 text-right">
                          إجراءات
                        </TableColumn>
                      </TableHeader>
                      <TableBody
                        emptyContent="لا توجد فروع مرتبطة بهذا المستخدم."
                        items={companyAssignments}
                      >
                        {(item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-right">
                              {branchNameById.get(Number(item.com)) ||
                                item.branch_name ||
                                `فرع رقم ${item.com}`}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                color="danger"
                                isLoading={
                                  deletingRecordId === item.id && !isSavingCost
                                }
                                size="sm"
                                variant="light"
                                onPress={() => handleRemoveCompany(item)}
                              >
                                حذف
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <Card className="h-full" shadow="sm">
          <CardBody className="space-y-5">
            <header className="flex items-start justify-between gap-4">
              <div className="space-y-1 text-right flex-1">
                <h3 className="text-lg font-semibold text-gray-800 text-right">
                  مراكز التكلفة المرتبطة
                </h3>
                <p className="text-sm text-gray-600 text-right">
                  حدّد مراكز التكلفة المتاحة للمستخدم ليتم عرضها تلقائياً داخل
                  سندات العمل.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
                {costCenterCount} مركز
              </span>
            </header>

            {!selectedUserId ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-gray-500">
                يرجى اختيار مستخدم أولاً لعرض مراكز التكلفة الخاصة به.
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
                  <Select
                    isDisabled={
                      availableCostCenters.length === 0 || isLoadingAssignments
                    }
                    label="اختر مركز تكلفة"
                    placeholder={
                      availableCostCenters.length === 0
                        ? "جميع المراكز مضافة"
                        : "اختر المركز"
                    }
                    selectedKeys={
                      selectedCostKey
                        ? new Set<string>([selectedCostKey])
                        : new Set<string>()
                    }
                    onSelectionChange={(keys) => {
                      if (keys === "all") {
                        return;
                      }

                      const key = Array.from(keys)[0] as string | undefined;

                      setSelectedCostKey(key ?? null);
                    }}
                  >
                    {availableCostCenters.map((costCenter) => (
                      <SelectItem
                        key={String(costCenter.id)}
                        textValue={costCenter.label}
                      >
                        {costCenter.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Button
                    className="self-end"
                    color="primary"
                    isDisabled={
                      !selectedCostKey ||
                      availableCostCenters.length === 0 ||
                      isLoadingAssignments
                    }
                    isLoading={isSavingCost}
                    onPress={handleAddCostCenter}
                  >
                    إضافة المركز
                  </Button>
                </div>

                <Divider />

                <div className="rounded-lg border border-gray-200">
                  {isLoadingAssignments ? (
                    <div className="flex items-center justify-center py-10">
                      <Spinner label="جاري تحميل مراكز التكلفة..." />
                    </div>
                  ) : (
                    <Table
                      removeWrapper
                      aria-label="مراكز التكلفة المرتبطة بالمستخدم"
                      classNames={{
                        table: "min-h-[200px]",
                      }}
                    >
                      <TableHeader>
                        <TableColumn className="text-right">
                          مركز التكلفة
                        </TableColumn>
                        <TableColumn className="w-28 text-right">
                          إجراءات
                        </TableColumn>
                      </TableHeader>
                      <TableBody
                        emptyContent="لا توجد مراكز تكلفة مرتبطة بهذا المستخدم."
                        items={costAssignments}
                      >
                        {(item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-right">
                              {costCenterNameById.get(Number(item.cost)) ||
                                item.cost_name ||
                                `مركز رقم ${item.cost}`}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                color="danger"
                                isLoading={
                                  deletingRecordId === item.id &&
                                  !isSavingCompany
                                }
                                size="sm"
                                variant="light"
                                onPress={() => handleRemoveCostCenter(item)}
                              >
                                حذف
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
