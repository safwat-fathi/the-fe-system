"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  Input,
  Spinner,
  Chip,
} from "@heroui/react";
import { UserIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { Group } from "../../types/groups";
import { User } from "../../types/users";
import { groupService, userService } from "../../services/index";

interface GroupUsersProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GroupUsers({
  group,
  isOpen,
  onClose,
  onSuccess,
}: GroupUsersProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [groupUsers, setGroupUsers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, group]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [users, groupUsersData] = await Promise.all([
        userService.getAll(),
        groupService.getUsers(group.id),
      ]);

      setAllUsers(users);
      setGroupUsers(groupUsersData.map((u: any) => u.id || u.user_id));
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: number) => {
    setGroupUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Implement updateUsers method in groupService
      // await groupService.updateUsers(group.id, groupUsers);
      toast.error("هذه الميزة قيد التطوير");

      toast.success("تم تحديث مستخدمين المجموعة بنجاح");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving group users:", error);
      toast.error("حدث خطأ أثناء حفظ التغييرات");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = allUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
        <ModalContent>
          <ModalBody>
            <div className="flex justify-center items-center py-20">
              <Spinner color="primary" size="lg" />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <UserIcon className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-bold">
                مستخدمين المجموعة: {group.name}
              </h3>
              <p className="text-sm text-gray-500 font-normal">
                حدد المستخدمين الذين ينتمون لهذه المجموعة
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              placeholder="ابحث عن مستخدم..."
              startContent={
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              }
              value={searchTerm}
              variant="bordered"
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        isSelected={groupUsers.includes(user.id)}
                        onValueChange={() => toggleUser(user.id)}
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.username}
                        </p>
                        {user.email && (
                          <p className="text-xs text-gray-500">{user.email}</p>
                        )}
                      </div>
                    </div>
                    {user.is_staff && (
                      <Chip color="secondary" size="sm" variant="flat">
                        مدير
                      </Chip>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
              <span>إجمالي المستخدمين: {allUsers.length}</span>
              <span className="font-medium text-primary">
                المحددين: {groupUsers.length}
              </span>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            إلغاء
          </Button>
          <Button color="primary" isLoading={saving} onPress={handleSave}>
            حفظ التغييرات
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
