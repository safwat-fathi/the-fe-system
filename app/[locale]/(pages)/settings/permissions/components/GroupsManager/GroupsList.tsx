"use client";

import { useState } from "react";
import { Card, CardBody, Button, Chip, Avatar } from "@heroui/react";
import {
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { Group } from "../../types/groups";

import GroupPermissions from "./GroupPermissions";
import GroupUsers from "./GroupUsers";

interface GroupsListProps {
  groups: Group[];
  onEdit: (group: Group) => void;
  onRefresh: () => void;
}

export default function GroupsList({
  groups,
  onEdit,
  onRefresh,
}: GroupsListProps) {
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const handlePermissions = (group: Group) => {
    setSelectedGroup(group);
    setPermissionsOpen(true);
  };

  const handleUsers = (group: Group) => {
    setSelectedGroup(group);
    setUsersOpen(true);
  };
  const handleDelete = async (group: Group) => {
    if (!confirm(`هل أنت متأكد من حذف المجموعة "${group.name}"؟`)) {
      return;
    }

    try {
      const { groupService } = await import("../../services");

      await groupService.remove(group.id);
      toast.success("تم حذف المجموعة بنجاح");
      onRefresh();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("حدث خطأ أثناء حذف المجموعة");
    }
  };

  if (groups.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-20">
          <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">لا توجد مجموعات</p>
          <p className="text-gray-400 text-sm">
            ابدأ بإنشاء مجموعة جديدة لإدارة الصلاحيات
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <Card
          key={group.id}
          className="transition-all duration-200 hover:shadow-lg"
        >
          <CardBody className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar
                  className="bg-blue-100 text-blue-600"
                  icon={<UserGroupIcon className="h-5 w-5" />}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  {group.name_en && (
                    <p className="text-xs text-gray-500">{group.name_en}</p>
                  )}
                </div>
              </div>
              {group.is_active !== false && (
                <Chip color="success" size="sm" variant="flat">
                  نشط
                </Chip>
              )}
            </div>

            {group.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {group.description}
              </p>
            )}

            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Button
                  color="primary"
                  size="sm"
                  startContent={<ShieldCheckIcon className="h-4 w-4" />}
                  variant="flat"
                  onPress={() => handlePermissions(group)}
                >
                  الصلاحيات
                </Button>
                <Button
                  color="secondary"
                  size="sm"
                  startContent={<UserIcon className="h-4 w-4" />}
                  variant="flat"
                  onPress={() => handleUsers(group)}
                >
                  المستخدمين
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>المستخدمين:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onEdit(group)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    isIconOnly
                    color="danger"
                    size="sm"
                    variant="light"
                    onPress={() => handleDelete(group)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}

      {/* Modals */}
      {selectedGroup && (
        <>
          <GroupPermissions
            group={selectedGroup}
            isOpen={permissionsOpen}
            onClose={() => {
              setPermissionsOpen(false);
              setSelectedGroup(null);
            }}
            onSuccess={onRefresh}
          />
          <GroupUsers
            group={selectedGroup}
            isOpen={usersOpen}
            onClose={() => {
              setUsersOpen(false);
              setSelectedGroup(null);
            }}
            onSuccess={onRefresh}
          />
        </>
      )}
    </div>
  );
}
