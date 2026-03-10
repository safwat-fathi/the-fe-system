"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from "@heroui/react";
import {
  ShieldCheckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import { Group } from "../types/groups";
import { User } from "../types/users";
import { PERMISSION_TYPES } from "../types/permissions";
import { groupService, userService } from "../services/index";

import PermissionsTree from "./GroupsManager/PermissionsTree";

type ViewMode = "groups" | "users";

export default function PermissionsClient() {
  const t = useTranslations("settings.permissions");
  const [viewMode, setViewMode] = useState<ViewMode>("groups");
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Group | User | null>(null);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (viewMode === "groups") {
        const groupsData = await groupService.getAll();

        setGroups(Array.isArray(groupsData) ? groupsData : []);
      } else {
        try {
          const usersData = await userService.getAll();

          setUsers(Array.isArray(usersData) ? usersData : []);
        } catch {
          const { userService: globalUserService } = await import(
            "@/services/api"
          );
          const response = await globalUserService.getAllUsers();

          if (response.success && Array.isArray(response.data)) {
            setUsers(response.data);
          } else {
            setUsers([]);
          }
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("تعذر تحميل البيانات");
      if (viewMode === "groups") {
        setGroups([]);
      } else {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPermissions = async (item: Group | User) => {
    setSelectedItem(item);
    setPermissionsModalOpen(true);

    try {
      if (viewMode === "groups") {
        const groupPerms = await groupService.getPermissions(
          (item as Group).id,
        );
        const formatted: Record<string, string[]> = {};

        groupPerms.forEach((perm: any) => {
          formatted[perm.object_id || perm.screen_id] = perm.permissions || [];
        });
        setPermissions(formatted);
      } else {
        const userPerms = await userService.getPermissions((item as User).id);
        const formatted: Record<string, string[]> = {};

        userPerms.forEach((perm: any) => {
          formatted[perm.object_id || perm.screen_id] = perm.permissions || [];
        });
        setPermissions(formatted);
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
      setPermissions({});
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedItem) return;

    try {
      setSaving(true);
      const permissionsArray = Object.entries(permissions).map(
        ([screenId, perms]) => ({
          object_id: parseInt(screenId),
          screen_id: screenId,
          permissions: perms,
        }),
      );

      if (viewMode === "groups") {
        await groupService.updatePermissions(
          (selectedItem as Group).id,
          permissionsArray,
        );
      } else {
        await userService.updatePermissions(
          (selectedItem as User).id,
          permissionsArray,
        );
      }

      toast.success(t("messages.saveSuccess"));
      setPermissionsModalOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error(t("messages.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Group | User) => {
    if (!confirm(t("messages.deleteConfirm"))) return;

    try {
      if (viewMode === "groups") {
        await groupService.remove((item as Group).id);
      } else {
        await userService.remove((item as User).id);
      }
      toast.success(t("messages.deleteSuccess"));
      loadData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error(t("messages.deleteError"));
    }
  };

  const togglePermission = (screenId: string, permission: string) => {
    setPermissions((prev) => {
      const current = prev[screenId] || [];
      const updated = current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission];

      return {
        ...prev,
        [screenId]: updated,
      };
    });
  };

  const toggleAllPermissions = (screenId: string, checked: boolean) => {
    setPermissions((prev) => {
      if (checked) {
        return {
          ...prev,
          [screenId]: Object.values(PERMISSION_TYPES),
        };
      } else {
        const updated = { ...prev };

        delete updated[screenId];

        return updated;
      }
    });
  };

  const filteredItems =
    viewMode === "groups"
      ? groups.filter(
          (g) =>
            g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.name_en?.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : users.filter(
          (u) =>
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
        );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <ShieldCheckIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("labels.pageTitle")}
            </h1>
            <p className="text-sm text-gray-500">
              {viewMode === "groups" ? t("labels.groups") : t("labels.users")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            color={viewMode === "groups" ? "primary" : "default"}
            variant={viewMode === "groups" ? "solid" : "bordered"}
            onPress={() => setViewMode("groups")}
          >
            {t("labels.groups")}
          </Button>
          <Button
            color={viewMode === "users" ? "primary" : "default"}
            variant={viewMode === "users" ? "solid" : "bordered"}
            onPress={() => setViewMode("users")}
          >
            {t("labels.users")}
          </Button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3">
        <Button
          color="success"
          startContent={<PlusIcon className="h-5 w-5" />}
          onPress={() => {
            // TODO: Open add modal
            toast(t("messages.addFeature"));
          }}
        >
          {t("actions.add")}
        </Button>
        <Button
          startContent={<ArrowDownTrayIcon className="h-5 w-5" />}
          variant="bordered"
        >
          {t("actions.export")}
        </Button>
        <Input
          className="flex-1 max-w-xs"
          placeholder={t("actions.search")}
          startContent={
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          }
          value={searchTerm}
          variant="bordered"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Dropdown>
          <DropdownTrigger>
            <Button
              startContent={<FunnelIcon className="h-5 w-5" />}
              variant="bordered"
            >
              {t("actions.sort")}
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Sort options">
            <DropdownItem key="name">{t("sortOptions.name")}</DropdownItem>
            <DropdownItem key="level">{t("sortOptions.level")}</DropdownItem>
            <DropdownItem key="status">{t("sortOptions.status")}</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table
          aria-label={`${viewMode === "groups" ? "Groups" : "Users"} table`}
          classNames={{
            wrapper: "min-h-[400px]",
          }}
        >
          <TableHeader>
            <TableColumn>
              {viewMode === "groups"
                ? t("columns.name")
                : t("columns.userName")}
            </TableColumn>
            <TableColumn>{t("columns.level")}</TableColumn>
            <TableColumn>{t("columns.status")}</TableColumn>
            <TableColumn className={viewMode === "groups" ? "hidden" : ""}>
              {t("columns.type")}
            </TableColumn>
            <TableColumn>{t("columns.actions")}</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              viewMode === "groups"
                ? t("messages.emptyGroups")
                : t("messages.emptyUsers")
            }
          >
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  className="text-center py-8"
                  colSpan={viewMode === "users" ? 5 : 4}
                >
                  {viewMode === "groups"
                    ? t("messages.emptyGroups")
                    : t("messages.emptyUsers")}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        {viewMode === "groups" ? (
                          <ShieldCheckIcon className="h-5 w-5 text-white" />
                        ) : (item as User).is_staff ? (
                          <LockClosedIcon className="h-5 w-5 text-white" />
                        ) : (
                          <UserIcon className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {viewMode === "groups"
                            ? (item as Group).name
                            : (item as User).username}
                        </p>
                        {viewMode === "groups" && (item as Group).name_en && (
                          <p className="text-xs text-gray-500">
                            {(item as Group).name_en}
                          </p>
                        )}
                        {viewMode === "users" && (item as User).email && (
                          <p className="text-xs text-gray-500">
                            {(item as User).email}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      className="font-medium"
                      color="secondary"
                      size="sm"
                      variant="flat"
                    >
                      {t("labels.level", { level: item.id || 1 })}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={
                        viewMode === "groups"
                          ? (item as Group).is_active !== false
                            ? "success"
                            : "danger"
                          : (item as User).is_active
                            ? "success"
                            : "danger"
                      }
                      size="sm"
                      variant="flat"
                    >
                      {viewMode === "groups"
                        ? (item as Group).is_active !== false
                          ? t("status.active")
                          : t("status.inactive")
                        : (item as User).is_active
                          ? t("status.active")
                          : t("status.inactive")}
                    </Chip>
                  </TableCell>
                  <TableCell className={viewMode === "groups" ? "hidden" : ""}>
                    {viewMode === "users" && (
                      <>
                        {(item as User).is_staff ? (
                          <Chip color="secondary" size="sm" variant="flat">
                            {t("types.admin")}
                          </Chip>
                        ) : (
                          <Chip size="sm" variant="flat">
                            {t("types.user")}
                          </Chip>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        color="primary"
                        size="sm"
                        startContent={<ShieldCheckIcon className="h-4 w-4" />}
                        variant="flat"
                        onPress={() => handleOpenPermissions(item)}
                      >
                        {t("actions.permissions")}
                      </Button>
                      <Button
                        isIconOnly
                        color="default"
                        size="sm"
                        variant="light"
                        onPress={() => {
                          toast(t("messages.editFeature"));
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        isIconOnly
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={() => handleDelete(item)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Permissions Modal */}
      <Modal
        isOpen={permissionsModalOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={() => {
          setPermissionsModalOpen(false);
          setSelectedItem(null);
          setPermissions({});
        }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-lg font-bold">
                  {t("modals.permissionsTitle", {
                    name: selectedItem
                      ? viewMode === "groups"
                        ? (selectedItem as Group).name
                        : (selectedItem as User).username
                      : "",
                  })}
                </h3>
                <p className="text-sm text-gray-500 font-normal">
                  {t("modals.permissionsDesc")}
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedItem &&
            (selectedItem as User).is_staff &&
            viewMode === "users" ? (
              <div className="text-center py-8">
                <LockClosedIcon className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("modals.fullPermissions")}
                </h3>
                <p className="text-gray-600">
                  {t("modals.fullPermissionsDesc")}
                </p>
              </div>
            ) : (
              <PermissionsTree
                permissions={permissions}
                onPermissionChange={togglePermission}
                onSelectAll={toggleAllPermissions}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setPermissionsModalOpen(false);
                setSelectedItem(null);
                setPermissions({});
              }}
            >
              {t("actions.cancel")}
            </Button>
            {!(
              selectedItem &&
              (selectedItem as User).is_staff &&
              viewMode === "users"
            ) && (
              <Button
                color="primary"
                isLoading={saving}
                onPress={handleSavePermissions}
              >
                {t("actions.save")}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
