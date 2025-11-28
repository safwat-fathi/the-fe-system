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

import { Group } from "../types/groups";
import { User } from "../types/users";
import { PERMISSION_TYPES } from "../types/permissions";
import { groupService, userService } from "../services/index";

import PermissionsTree from "./GroupsManager/PermissionsTree";

type ViewMode = "groups" | "users";

export default function PermissionsClient() {
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
        // Mock data for groups until API is ready
        const mockGroups: Group[] = [
          {
            id: 1,
            name: "مديرين",
            name_en: "Administrators",
            description: "مجموعة المديرين - صلاحيات كاملة",
            is_active: true,
          },
          {
            id: 2,
            name: "محاسبين",
            name_en: "Accountants",
            description: "مجموعة المحاسبين - صلاحيات الحسابات",
            is_active: true,
          },
          {
            id: 3,
            name: "مستخدمين عاديين",
            name_en: "Regular Users",
            description: "مجموعة المستخدمين العاديين - صلاحيات محدودة",
            is_active: true,
          },
          {
            id: 4,
            name: "مشرفين",
            name_en: "Supervisors",
            description: "مجموعة المشرفين - صلاحيات متوسطة",
            is_active: true,
          },
        ];

        setGroups(mockGroups);
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

      toast.success("تم حفظ الصلاحيات بنجاح");
      setPermissionsModalOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("حدث خطأ أثناء حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Group | User) => {
    if (!confirm(`هل أنت متأكد من الحذف؟`)) return;

    try {
      if (viewMode === "groups") {
        await groupService.remove((item as Group).id);
      } else {
        await userService.remove((item as User).id);
      }
      toast.success("تم الحذف بنجاح");
      loadData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("حدث خطأ أثناء الحذف");
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
              إدارة الصلاحيات
            </h1>
            <p className="text-sm text-gray-500">
              {viewMode === "groups" ? "المجموعات" : "المستخدمين"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            color={viewMode === "groups" ? "primary" : "default"}
            variant={viewMode === "groups" ? "solid" : "bordered"}
            onPress={() => setViewMode("groups")}
          >
            المجموعات
          </Button>
          <Button
            color={viewMode === "users" ? "primary" : "default"}
            variant={viewMode === "users" ? "solid" : "bordered"}
            onPress={() => setViewMode("users")}
          >
            المستخدمين
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
            toast("ميزة الإضافة قيد التطوير");
          }}
        >
          إضافة جديد
        </Button>
        <Button
          startContent={<ArrowDownTrayIcon className="h-5 w-5" />}
          variant="bordered"
        >
          تصدير
        </Button>
        <Input
          className="flex-1 max-w-xs"
          placeholder="ابحث..."
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
              ترتيب
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Sort options">
            <DropdownItem key="name">حسب الاسم</DropdownItem>
            <DropdownItem key="level">حسب المستوى</DropdownItem>
            <DropdownItem key="status">حسب الحالة</DropdownItem>
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
              {viewMode === "groups" ? "اسم المجموعة" : "اسم المستخدم"}
            </TableColumn>
            <TableColumn>المستوى</TableColumn>
            <TableColumn>الحالة</TableColumn>
            <TableColumn className={viewMode === "groups" ? "hidden" : ""}>
              النوع
            </TableColumn>
            <TableColumn>الإجراءات</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={`لا يوجد ${viewMode === "groups" ? "مجموعات" : "مستخدمين"}`}
          >
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  className="text-center py-8"
                  colSpan={viewMode === "users" ? 5 : 4}
                >
                  لا يوجد {viewMode === "groups" ? "مجموعات" : "مستخدمين"}
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
                      المستوى {item.id || 1}
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
                          ? "نشط"
                          : "غير نشط"
                        : (item as User).is_active
                          ? "نشط"
                          : "غير نشط"}
                    </Chip>
                  </TableCell>
                  <TableCell className={viewMode === "groups" ? "hidden" : ""}>
                    {viewMode === "users" && (
                      <>
                        {(item as User).is_staff ? (
                          <Chip color="secondary" size="sm" variant="flat">
                            مدير
                          </Chip>
                        ) : (
                          <Chip size="sm" variant="flat">
                            مستخدم
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
                        الصلاحيات
                      </Button>
                      <Button
                        isIconOnly
                        color="default"
                        size="sm"
                        variant="light"
                        onPress={() => {
                          toast("ميزة التعديل قيد التطوير");
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
                  إدارة الصلاحيات:{" "}
                  {selectedItem &&
                    (viewMode === "groups"
                      ? (selectedItem as Group).name
                      : (selectedItem as User).username)}
                </h3>
                <p className="text-sm text-gray-500 font-normal">
                  حدد الصلاحيات المسموحة
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
                  صلاحيات كاملة
                </h3>
                <p className="text-gray-600">
                  هذا المستخدم لديه صلاحيات Admin - صلاحيات كاملة لجميع الشاشات
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
              إلغاء
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
                حفظ الصلاحيات
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
