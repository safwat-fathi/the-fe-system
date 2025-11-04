"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
} from "@heroui/react";
import {
  ChevronDownIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { Group } from "../../types/groups";
import GroupPermissions from "./GroupPermissions";
import GroupUsers from "./GroupUsers";

interface GroupsTableProps {
  groups: Group[];
  onEdit: (group: Group) => void;
  onRefresh: () => void;
}

export default function GroupsTable({
  groups,
  onEdit,
  onRefresh,
}: GroupsTableProps) {
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
      await groupService.delete(group.id);
      toast.success("تم حذف المجموعة بنجاح");
      onRefresh();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("حدث خطأ أثناء حذف المجموعة");
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.name_en?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="ابحث عن مجموعة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
          variant="bordered"
          className="flex-1"
        />
      </div>

      {/* Table */}
      <Table
        aria-label="Groups table"
        classNames={{
          wrapper: "min-h-[400px]",
        }}
      >
        <TableHeader>
          <TableColumn>اسم المجموعة</TableColumn>
          <TableColumn>المستوى</TableColumn>
          <TableColumn>الحالة</TableColumn>
          <TableColumn>المستخدمين</TableColumn>
          <TableColumn>الإجراءات</TableColumn>
        </TableHeader>
        <TableBody emptyContent="لا توجد مجموعات">
          {filteredGroups.map((group) => (
            <TableRow key={group.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <ShieldCheckIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{group.name}</p>
                    {group.name_en && (
                      <p className="text-xs text-gray-500">{group.name_en}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color="secondary"
                  className="font-medium"
                >
                  المستوى {group.id || 1}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip
                  color={group.is_active !== false ? "success" : "danger"}
                  size="sm"
                  variant="flat"
                >
                  {group.is_active !== false ? "نشط" : "غير نشط"}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">0</span>
                  {/* TODO: Show actual user count */}
                </div>
              </TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="light"
                      isIconOnly
                      size="sm"
                      className="text-gray-600"
                    >
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Group actions"
                    onAction={(key) => {
                      if (key === "edit") onEdit(group);
                      else if (key === "permissions") handlePermissions(group);
                      else if (key === "users") handleUsers(group);
                      else if (key === "delete") handleDelete(group);
                    }}
                  >
                    <DropdownItem
                      key="permissions"
                      startContent={<ShieldCheckIcon className="h-4 w-4" />}
                    >
                      إدارة الصلاحيات
                    </DropdownItem>
                    <DropdownItem
                      key="users"
                      startContent={<UserIcon className="h-4 w-4" />}
                    >
                      إدارة المستخدمين
                    </DropdownItem>
                    <DropdownItem
                      key="edit"
                      startContent={<PencilIcon className="h-4 w-4" />}
                    >
                      تعديل
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      color="danger"
                      startContent={<TrashIcon className="h-4 w-4" />}
                    >
                      حذف
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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

