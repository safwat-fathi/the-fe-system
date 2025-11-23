"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Button, Spinner } from "@heroui/react";
import {
  UserGroupIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import GroupsList from "./GroupsList";
import GroupsTable from "./GroupsTable";
import GroupForm from "./GroupForm";
import { Group } from "../../types/groups";

export default function GroupsManager() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const { groupService } = await import("../../services");
      const groups = await groupService.getAll();
      setGroups(groups);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error("حدث خطأ أثناء جلب المجموعات");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = () => {
    setSelectedGroup(null);
    setIsFormOpen(true);
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedGroup(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    loadGroups();
    toast.success("تم حفظ المجموعة بنجاح");
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
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  إدارة المجموعات
                </h2>
                <p className="text-sm text-gray-600">
                  قم بإنشاء وإدارة مجموعات المستخدمين وتحديد صلاحياتهم
                </p>
              </div>
            </div>
            <Button
              color="primary"
              startContent={<PlusIcon className="h-5 w-5" />}
              onPress={handleAddGroup}
            >
              إضافة مجموعة
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Groups Table */}
      <GroupsTable
        groups={groups}
        onEdit={handleEditGroup}
        onRefresh={loadGroups}
      />

      {/* Group Form Modal */}
      {isFormOpen && (
        <GroupForm
          group={selectedGroup}
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

