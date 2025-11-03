"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Spinner,
  Badge,
  Checkbox,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Divider,
} from "@heroui/react";
import {
  ShieldCheckIcon,
  UserGroupIcon,
  UserIcon,
  LockClosedIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { userService } from "@/services/api";

interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  user_permissions: Array<{
    codename: string;
    name: string;
    content_type: number;
  }>;
}

interface Permission {
  codename: string;
  name: string;
  group: string;
}

// Group permissions by content type for better organization
const PERMISSION_GROUPS = {
  currencies: {
    name: "العملات",
    permissions: ["add_currencies", "change_currencies", "delete_currencies", "view_currencies"],
  },
  customers: {
    name: "العملاء",
    permissions: ["add_customers", "change_customers", "delete_customers", "view_customers"],
  },
  invoices: {
    name: "الفواتير",
    permissions: ["add_invoices", "change_invoices", "delete_invoices", "view_invoices"],
  },
} as const;

export default function PermissionsClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();

      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        toast.error("فشل جلب بيانات المستخدمين");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      // TODO: Save permissions via API
      toast.success("تم حفظ الصلاحيات بنجاح");
      await loadUsers(); // Reload to get updated data
      onClose();
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("فشل حفظ الصلاحيات");
    }
  };

  const getPermissionBadge = (permission: string) => {
    const action = permission.split("_")[0]; // Get action (add, change, delete, view)

    const colors: Record<string, string> = {
      add: "success",
      change: "primary",
      delete: "danger",
      view: "default",
    };

    const icons: Record<string, string> = {
      add: "+",
      change: "✏️",
      delete: "🗑️",
      view: "👁️",
    };

    return (
      <Chip
        key={permission}
        color={colors[action] as any}
        size="sm"
        startContent={<span>{icons[action]}</span>}
        variant="flat"
      >
        {action === "add" && "إضافة"}
        {action === "change" && "تعديل"}
        {action === "delete" && "حذف"}
        {action === "view" && "عرض"}
      </Chip>
    );
  };

  const hasPermissions = (userPermissions: string[], groupPermissions: string[]) => {
    return groupPermissions.every((perm) => userPermissions.includes(perm));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <CardBody className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                نظام إدارة الصلاحيات
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                هنا يمكنك إدارة صلاحيات المستخدمين وتحديد ما يمكن لكل مستخدم
                الوصول إليه في النظام. المستخدمين مع صلاحيات Admin يتمتعون بكامل
                الصلاحيات تلقائياً.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <Card
            key={user.id}
            className="transition-all duration-200 hover:shadow-lg"
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      user.is_staff
                        ? "bg-purple-100"
                        : "bg-blue-100"
                    }`}
                  >
                    {user.is_staff ? (
                      <LockClosedIcon className="h-5 w-5 text-purple-600" />
                    ) : (
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.username}</h3>
                    {user.email && (
                      <p className="text-xs text-gray-500">{user.email}</p>
                    )}
                  </div>
                </div>
                {user.is_staff && (
                  <Badge content="Admin" color="secondary" variant="solid">
                    <Chip color="secondary" size="sm" variant="flat">
                      مدير
                    </Chip>
                  </Badge>
                )}
              </div>

              {user.is_staff ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>صلاحيات كاملة</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>الصلاحيات:</span>
                    <span className="font-medium">
                      {user.user_permissions.length} صلاحية
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {user.user_permissions
                      .slice(0, 6)
                      .map((perm) => getPermissionBadge(perm.codename))}
                    {user.user_permissions.length > 6 && (
                      <Chip size="sm" variant="flat">
                        +{user.user_permissions.length - 6}
                      </Chip>
                    )}
                  </div>
                </div>
              )}

              <Divider className="my-4" />

              <div className="flex items-center justify-between text-xs">
                <Chip
                  color={user.is_active ? "success" : "danger"}
                  size="sm"
                  variant="flat"
                >
                  {user.is_active ? "نشط" : "غير نشط"}
                </Chip>
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => handleUserClick(user)}
                >
                  تعديل
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Permission Details Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              <span>إدارة صلاحيات: {selectedUser?.username}</span>
            </div>
            <p className="text-sm font-normal text-gray-500">
              {selectedUser?.is_staff
                ? "هذا المستخدم لديه صلاحيات Admin - صلاحيات كاملة"
                : "حدد الصلاحيات المطلوبة لكل عنصر"}
            </p>
          </ModalHeader>
          <ModalBody>
            {selectedUser?.is_staff ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-purple-100 p-6 rounded-full mb-4">
                  <LockClosedIcon className="h-16 w-16 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  صلاحيات كاملة
                </h3>
                <p className="text-gray-600">
                  المستخدمين مع صلاحيات Admin يتمتعون بوصول كامل لجميع أجزاء
                  النظام ولا يمكن تعديل صلاحياتهم من هذه الشاشة.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(PERMISSION_GROUPS).map(([key, group]) => (
                  <Card key={key} className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <UserGroupIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        <div className="flex-1" />
                        {hasPermissions(
                          selectedUser?.user_permissions.map((p) => p.codename) || [],
                          group.permissions,
                        ) && (
                          <Chip color="success" size="sm" variant="flat">
                            <CheckCircleIcon className="h-4 w-4" />
                            كامل
                          </Chip>
                        )}
                      </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {group.permissions.map((permission) => (
                          <div
                            key={permission}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                isSelected={selectedUser?.user_permissions.some(
                                  (p) => p.codename === permission,
                                )}
                                isReadOnly
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {permission === "add_currencies" && "إضافة عملات"}
                                {permission === "change_currencies" && "تعديل عملات"}
                                {permission === "delete_currencies" && "حذف عملات"}
                                {permission === "view_currencies" && "عرض عملات"}
                                {permission === "add_customers" && "إضافة عملاء"}
                                {permission === "change_customers" && "تعديل عملاء"}
                                {permission === "delete_customers" && "حذف عملاء"}
                                {permission === "view_customers" && "عرض عملاء"}
                                {permission === "add_invoices" && "إضافة فواتير"}
                                {permission === "change_invoices" && "تعديل فواتير"}
                                {permission === "delete_invoices" && "حذف فواتير"}
                                {permission === "view_invoices" && "عرض فواتير"}
                              </span>
                            </div>
                            {getPermissionBadge(permission)}
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                ))}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">ℹ️</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900 mb-1">
                        ملاحظة مهمة
                      </h4>
                      <p className="text-sm text-amber-800">
                        الصلاحيات مُعطاة حالياً من النظام. عند ربط جدول objects
                        والـ API الجديد، سيتم تفعيل نظام الصلاحيات الديناميكي الكامل
                        وسيمكن تعديل الصلاحيات من هنا.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              إلغاء
            </Button>
            {!selectedUser?.is_staff && (
              <Button color="primary" onPress={handleSavePermissions}>
                حفظ التغييرات
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

