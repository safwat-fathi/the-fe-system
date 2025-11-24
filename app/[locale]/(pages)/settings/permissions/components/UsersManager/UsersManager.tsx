"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Button, Spinner } from "@heroui/react";
import { UserIcon, PlusIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { User } from "../../types/users";

import UsersList from "./UsersList";
import UserForm from "./UserForm";

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Try to use local user service first, fallback to global
      try {
        const { userService } = await import("../../services");
        const users = await userService.getAll();

        setUsers(users);
      } catch {
        // Fallback to global user service
        const { userService } = await import("@/services/api");
        const response = await userService.getAllUsers();

        if (response.success && Array.isArray(response.data)) {
          setUsers(response.data);
        }
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("حدث خطأ أثناء جلب المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    loadUsers();
    toast.success("تم حفظ المستخدم بنجاح");
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
                <UserIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  إدارة المستخدمين
                </h2>
                <p className="text-sm text-gray-600">
                  قم بإدارة المستخدمين وتعيينهم للمجموعات
                </p>
              </div>
            </div>
            <Button
              color="primary"
              startContent={<PlusIcon className="h-5 w-5" />}
              onPress={handleAddUser}
            >
              إضافة مستخدم
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Users List */}
      <UsersList users={users} onEdit={handleEditUser} onRefresh={loadUsers} />

      {/* User Form Modal */}
      {isFormOpen && (
        <UserForm
          isOpen={isFormOpen}
          user={selectedUser}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
