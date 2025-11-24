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
  Textarea,
} from "@heroui/react";
import toast from "react-hot-toast";

import { Group } from "../../types/groups";

interface GroupFormProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GroupForm({
  group,
  isOpen,
  onClose,
  onSuccess,
}: GroupFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || "",
        name_en: group.name_en || "",
        description: group.description || "",
      });
    } else {
      setFormData({
        name: "",
        name_en: "",
        description: "",
      });
    }
  }, [group, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("يرجى إدخال اسم المجموعة");

      return;
    }

    try {
      setLoading(true);
      const { groupService } = await import("../../services");

      if (group) {
        await groupService.update(group.id, formData);
      } else {
        await groupService.create(formData);
      }

      toast.success(
        group ? "تم تحديث المجموعة بنجاح" : "تم إنشاء المجموعة بنجاح",
      );
      onSuccess();
    } catch (error) {
      console.error("Error saving group:", error);
      toast.error("حدث خطأ أثناء حفظ المجموعة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onClose={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            {group ? "تعديل المجموعة" : "إضافة مجموعة جديدة"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="اسم المجموعة (عربي)"
                placeholder="أدخل اسم المجموعة"
                value={formData.name}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Input
                label="اسم المجموعة (إنجليزي)"
                placeholder="Enter group name"
                value={formData.name_en}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, name_en: e.target.value })
                }
              />
              <Textarea
                label="الوصف"
                minRows={3}
                placeholder="أدخل وصف المجموعة"
                value={formData.description}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
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
