"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Checkbox,
} from "@heroui/react";
import toast from "react-hot-toast";

import { User } from "../../types/users";

interface UserFormProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserForm({
  user,
  isOpen,
  onClose,
  onSuccess,
}: UserFormProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    is_staff: false,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        is_staff: user.is_staff || false,
        is_active: user.is_active !== false,
      });
    } else {
      setFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        is_staff: false,
        is_active: true,
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      toast.error("يرجى إدخال اسم المستخدم");

      return;
    }

    if (!formData.email.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني");

      return;
    }

    try {
      setLoading(true);
      const { userService } = await import("../../services");

      if (user) {
        await userService.update(user.id, formData);
      } else {
        await userService.create(formData);
      }

      toast.success(
        user ? "تم تحديث المستخدم بنجاح" : "تم إنشاء المستخدم بنجاح",
      );
      onSuccess();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("حدث خطأ أثناء حفظ المستخدم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onClose={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            {user ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="اسم المستخدم"
                placeholder="أدخل اسم المستخدم"
                value={formData.username}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
              <Input
                isRequired
                label="البريد الإلكتروني"
                placeholder="example@email.com"
                type="email"
                value={formData.email}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="الاسم الأول"
                  placeholder="أدخل الاسم الأول"
                  value={formData.first_name}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                />
                <Input
                  label="اسم العائلة"
                  placeholder="أدخل اسم العائلة"
                  value={formData.last_name}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Checkbox
                  isSelected={formData.is_staff}
                  onValueChange={(value) =>
                    setFormData({ ...formData, is_staff: value })
                  }
                >
                  صلاحيات مدير (Admin)
                </Checkbox>
                <Checkbox
                  isSelected={formData.is_active}
                  onValueChange={(value) =>
                    setFormData({ ...formData, is_active: value })
                  }
                >
                  نشط
                </Checkbox>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              إلغاء
            </Button>
            <Button color="primary" isLoading={loading} type="submit">
              حفظ
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
