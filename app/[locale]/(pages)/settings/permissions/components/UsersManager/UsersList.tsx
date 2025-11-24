"use client";

import { useState } from "react";
import { Card, CardBody, Button, Chip, Avatar, Badge } from "@heroui/react";
import {
  PencilIcon,
  TrashIcon,
  UserIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { User } from "../../types/users";

import UserPermissions from "./UserPermissions";

interface UsersListProps {
  users: User[];
  onEdit: (user: User) => void;
  onRefresh: () => void;
}

export default function UsersList({
  users,
  onEdit,
  onRefresh,
}: UsersListProps) {
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handlePermissions = (user: User) => {
    setSelectedUser(user);
    setPermissionsOpen(true);
  };
  const handleDelete = async (user: User) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${user.username}"؟`)) {
      return;
    }

    try {
      const { userService } = await import("../../services");

      await userService.delete(user.id);
      toast.success("تم حذف المستخدم بنجاح");
      onRefresh();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("حدث خطأ أثناء حذف المستخدم");
    }
  };

  if (users.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-20">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">لا يوجد مستخدمين</p>
          <p className="text-gray-400 text-sm">ابدأ بإضافة مستخدم جديد</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <Card
          key={user.id}
          className="transition-all duration-200 hover:shadow-lg"
        >
          <CardBody className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar
                  className={
                    user.is_staff
                      ? "bg-purple-100 text-purple-600"
                      : "bg-blue-100 text-blue-600"
                  }
                  icon={
                    user.is_staff ? (
                      <LockClosedIcon className="h-5 w-5" />
                    ) : (
                      <UserIcon className="h-5 w-5" />
                    )
                  }
                />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user.username}
                  </h3>
                  {user.email && (
                    <p className="text-xs text-gray-500">{user.email}</p>
                  )}
                </div>
              </div>
              {user.is_staff && (
                <Badge color="secondary" content="Admin" variant="solid">
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
              <div className="text-xs text-gray-500">
                <span>المجموعات: </span>
                <span className="font-medium">0</span>
                {/* TODO: Show actual group count */}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 mt-4">
              {!user.is_staff && (
                <Button
                  className="w-full"
                  color="primary"
                  size="sm"
                  startContent={<ShieldCheckIcon className="h-4 w-4" />}
                  variant="flat"
                  onPress={() => handlePermissions(user)}
                >
                  إدارة الصلاحيات
                </Button>
              )}
              <div className="flex items-center justify-between">
                <Chip
                  color={user.is_active ? "success" : "danger"}
                  size="sm"
                  variant="flat"
                >
                  {user.is_active ? "نشط" : "غير نشط"}
                </Chip>
                <div className="flex items-center gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onEdit(user)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    isIconOnly
                    color="danger"
                    size="sm"
                    variant="light"
                    onPress={() => handleDelete(user)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* User Permissions Modal */}
            {selectedUser && (
              <UserPermissions
                isOpen={permissionsOpen}
                user={selectedUser}
                onClose={() => {
                  setPermissionsOpen(false);
                  setSelectedUser(null);
                }}
                onSuccess={onRefresh}
              />
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
