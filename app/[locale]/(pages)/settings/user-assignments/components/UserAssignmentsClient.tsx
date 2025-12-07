"use client";

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
import { useTranslations, useLocale } from "next-intl";
import clsx from "clsx";

import { getLocaleDir } from "@/i18n/config";
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

type SelectionValue = "all" | Set<React.Key>;

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
  const t = useTranslations("settings.userAssignments");
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
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
      toast.error(t("messages.failedToRefresh"));
    } finally {
      if (showSpinner) {
        setIsLoadingAssignments(false);
      }
    }
  };

  const handleUserSelectionChange = async (keys: SelectionValue) => {
    if (keys === "all") {
      return;
    }

    const firstKey = Array.from(keys)[0];

    if (!firstKey) {
      return;
    }

    const userId = Number(firstKey);

    if (Number.isNaN(userId)) {
      toast.error(t("messages.invalidUserId"));

      return;
    }

    setSelectedUserId(userId);
    setSelectedBranchKey(null);
    setSelectedCostKey(null);
    await refreshAssignments(userId, true);
  };

  const handleAddCompany = async () => {
    if (!selectedUserId) {
      toast.error(t("messages.pleaseSelectUser"));

      return;
    }

    if (!selectedBranchKey) {
      toast.error(t("messages.pleaseSelectBranch"));

      return;
    }

    const branchId = Number(selectedBranchKey);

    if (Number.isNaN(branchId)) {
      toast.error(t("messages.invalidBranchId"));

      return;
    }

    if (assignedBranchIds.has(branchId)) {
      toast.error(t("messages.branchAlreadyAssigned"));

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
      toast.success(t("messages.branchSavedSuccess"));
    } catch (error) {
      console.error("Failed to save user company:", error);
      toast.error(t("messages.failedToSaveBranch"));
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleRemoveCompany = async (record: UserCompanyRecord) => {
    if (!selectedUserId) {
      return;
    }

    if (!confirm(t("confirmations.deleteBranch"))) {
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
      toast.success(t("messages.branchDeletedSuccess"));
    } catch (error) {
      console.error("Failed to delete user company:", error);
      toast.error(t("messages.failedToDeleteBranch"));
    } finally {
      setDeletingRecordId(null);
    }
  };

  const handleAddCostCenter = async () => {
    if (!selectedUserId) {
      toast.error(t("messages.pleaseSelectUser"));

      return;
    }

    if (!selectedCostKey) {
      toast.error(t("messages.pleaseSelectCostCenter"));

      return;
    }

    const costId = Number(selectedCostKey);

    if (Number.isNaN(costId)) {
      toast.error(t("messages.invalidCostCenterId"));

      return;
    }

    if (assignedCostCenterIds.has(costId)) {
      toast.error(t("messages.costCenterAlreadyAssigned"));

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
      toast.success(t("messages.costCenterSavedSuccess"));
    } catch (error) {
      console.error("Failed to save user cost center:", error);
      toast.error(t("messages.failedToSaveCostCenter"));
    } finally {
      setIsSavingCost(false);
    }
  };

  const handleRemoveCostCenter = async (record: UserCostCenterRecord) => {
    if (!selectedUserId) {
      return;
    }

    if (!confirm(t("confirmations.deleteCostCenter"))) {
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
      toast.success(t("messages.costCenterDeletedSuccess"));
    } catch (error) {
      console.error("Failed to delete user cost center:", error);
      toast.error(t("messages.failedToDeleteCostCenter"));
    } finally {
      setDeletingRecordId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card shadow="sm">
        <CardBody className="space-y-5">
          <div className="flex flex-col gap-2">
            <h2
              className={clsx("text-xl font-semibold text-gray-800", textAlign)}
            >
              {t("labels.managementTitle")}
            </h2>
            <p className={clsx("text-sm text-gray-600 leading-6", textAlign)}>
              {t("labels.managementDescription")}
            </p>
          </div>

          {noUsersAvailable ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-gray-500">
              {t("messages.noUsersAvailable")}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_1fr] items-start">
              <div className="space-y-2">
                <Select
                  label={t("labels.user")}
                  placeholder={t("labels.selectUser")}
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
                    {t("labels.authorizedBranchesCount")}
                  </p>
                  <p className="text-xl font-semibold text-slate-800">
                    {branchCount}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    {t("labels.enabledCostCentersCount")}
                  </p>
                  <p className="text-xl font-semibold text-slate-800">
                    {costCenterCount}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    {t("labels.currentUser")}
                  </p>
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
              <div className={clsx("space-y-1 flex-1", textAlign)}>
                <h3
                  className={clsx(
                    "text-lg font-semibold text-gray-800",
                    textAlign,
                  )}
                >
                  {t("labels.authorizedBranches")}
                </h3>
                <p className={clsx("text-sm text-gray-600", textAlign)}>
                  {t("labels.authorizedBranchesDescription")}
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
                {branchCount} {t("labels.branchLabel")}
              </span>
            </header>

            {!selectedUserId ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-gray-500">
                {t("messages.selectUserFirst")}
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
                  <Select
                    isDisabled={
                      availableBranches.length === 0 || isLoadingAssignments
                    }
                    label={t("labels.selectBranch")}
                    placeholder={
                      availableBranches.length === 0
                        ? t("labels.allBranchesAdded")
                        : t("labels.selectBranchPlaceholder")
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
                    {t("actions.addBranch")}
                  </Button>
                </div>

                <Divider />

                <div className="rounded-lg border border-gray-200">
                  {isLoadingAssignments ? (
                    <div className="flex items-center justify-center py-10">
                      <Spinner label={t("messages.loadingBranches")} />
                    </div>
                  ) : (
                    <Table
                      removeWrapper
                      aria-label={t("table.branchesAriaLabel")}
                      classNames={{
                        table: "min-h-[200px]",
                      }}
                    >
                      <TableHeader>
                        <TableColumn className={textAlign}>
                          {t("labels.branch")}
                        </TableColumn>
                        <TableColumn className={clsx("w-28", textAlign)}>
                          {t("labels.actions")}
                        </TableColumn>
                      </TableHeader>
                      <TableBody
                        emptyContent={t("messages.noBranchesAssigned")}
                        items={companyAssignments}
                      >
                        {(item) => (
                          <TableRow key={item.id}>
                            <TableCell className={textAlign}>
                              {branchNameById.get(Number(item.com)) ||
                                item.branch_name ||
                                `فرع رقم ${item.com}`}
                            </TableCell>
                            <TableCell className={textAlign}>
                              <Button
                                color="danger"
                                isLoading={
                                  deletingRecordId === item.id && !isSavingCost
                                }
                                size="sm"
                                variant="light"
                                onPress={() => handleRemoveCompany(item)}
                              >
                                {t("actions.delete")}
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
              <div className={clsx("space-y-1 flex-1", textAlign)}>
                <h3
                  className={clsx(
                    "text-lg font-semibold text-gray-800",
                    textAlign,
                  )}
                >
                  {t("labels.linkedCostCenters")}
                </h3>
                <p className={clsx("text-sm text-gray-600", textAlign)}>
                  {t("labels.linkedCostCentersDescription")}
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
                {costCenterCount} {t("labels.costCenterLabel")}
              </span>
            </header>

            {!selectedUserId ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-gray-500">
                {t("messages.selectUserFirstCostCenters")}
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
                  <Select
                    isDisabled={
                      availableCostCenters.length === 0 || isLoadingAssignments
                    }
                    label={t("labels.selectCostCenter")}
                    placeholder={
                      availableCostCenters.length === 0
                        ? t("labels.allCostCentersAdded")
                        : t("labels.selectCostCenterPlaceholder")
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
                    {t("actions.addCostCenter")}
                  </Button>
                </div>

                <Divider />

                <div className="rounded-lg border border-gray-200">
                  {isLoadingAssignments ? (
                    <div className="flex items-center justify-center py-10">
                      <Spinner label={t("messages.loadingCostCenters")} />
                    </div>
                  ) : (
                    <Table
                      removeWrapper
                      aria-label={t("table.costCentersAriaLabel")}
                      classNames={{
                        table: "min-h-[200px]",
                      }}
                    >
                      <TableHeader>
                        <TableColumn className={textAlign}>
                          {t("labels.costCenter")}
                        </TableColumn>
                        <TableColumn className={clsx("w-28", textAlign)}>
                          {t("labels.actions")}
                        </TableColumn>
                      </TableHeader>
                      <TableBody
                        emptyContent={t("messages.noCostCentersAssigned")}
                        items={costAssignments}
                      >
                        {(item) => (
                          <TableRow key={item.id}>
                            <TableCell className={textAlign}>
                              {costCenterNameById.get(Number(item.cost)) ||
                                item.cost_name ||
                                `مركز رقم ${item.cost}`}
                            </TableCell>
                            <TableCell className={textAlign}>
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
                                {t("actions.delete")}
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
