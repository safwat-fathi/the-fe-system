"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Chip,
  Spinner,
} from "@heroui/react";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { Group } from "../../types/groups";
import { User } from "../../types/users";
import { groupService, userService } from "../../services/index";

interface CopyPermissionsProps {
  sourceType: "group" | "user";
  sourceId: number;
  targetType: "group" | "user";
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  allowCrossType?: boolean; // Allow copying from group to user or vice versa
}

export default function CopyPermissions({
  sourceType,
  sourceId,
  targetType,
  isOpen,
  onClose,
  onSuccess,
  allowCrossType = false,
}: CopyPermissionsProps) {
  const [targets, setTargets] = useState<(Group | User)[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTargets();
    }
  }, [isOpen, targetType]);

  const loadTargets = async () => {
    try {
      setLoading(true);

      if (allowCrossType) {
        // Load both groups and users if cross-type copying is allowed
        const [groups, users] = await Promise.all([
          groupService.getAll(),
          userService.getAll(),
        ]);

        // Combine both types
        const combined: (Group | User)[] = [];

        if (targetType === "group") {
          // Can copy from user to group, so show groups
          combined.push(
            ...groups.filter(
              (g) => g.id !== sourceId || sourceType !== "group",
            ),
          );
        } else {
          // Can copy from group to user, so show users
          combined.push(
            ...users.filter((u) => u.id !== sourceId || sourceType !== "user"),
          );
        }

        setTargets(combined);
      } else {
        // Load only same type
        if (targetType === "group") {
          const groups = await groupService.getAll();

          setTargets(groups.filter((g) => g.id !== sourceId));
        } else {
          const users = await userService.getAll();

          setTargets(users.filter((u) => u.id !== sourceId));
        }
      }
    } catch (error) {
      console.error("Error loading targets:", error);
      toast.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!selectedTarget) {
      toast.error("يرجى اختيار الهدف");

      return;
    }

    try {
      setCopying(true);

      // Get source permissions
      let sourcePermissions: any[] = [];

      if (sourceType === "group") {
        sourcePermissions = await groupService.getPermissions(sourceId);
      } else {
        sourcePermissions = await userService.getPermissions(sourceId);
      }

      // Apply to target
      if (targetType === "group") {
        await groupService.updatePermissions(
          parseInt(selectedTarget),
          sourcePermissions,
        );
      } else {
        await userService.updatePermissions(
          parseInt(selectedTarget),
          sourcePermissions,
        );
      }

      toast.success("تم نسخ الصلاحيات بنجاح");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error copying permissions:", error);
      toast.error("حدث خطأ أثناء نسخ الصلاحيات");
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} size="md" onClose={onClose}>
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
    <Modal isOpen={isOpen} size="md" onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <DocumentDuplicateIcon className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-bold">نسخ الصلاحيات</h3>
              <p className="text-sm text-gray-500 font-normal">
                نسخ الصلاحيات من {sourceType === "group" ? "مجموعة" : "مستخدم"}{" "}
                إلى {targetType === "group" ? "مجموعة" : "مستخدم"} آخر
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Select
              label={`اختر ${targetType === "group" ? "المجموعة" : "المستخدم"} الهدف`}
              placeholder="اختر..."
              selectedKeys={selectedTarget ? [selectedTarget] : []}
              variant="bordered"
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;

                setSelectedTarget(value);
              }}
            >
              {targets.map((target) => (
                <SelectItem
                  key={target.id.toString()}
                  textValue={"name" in target ? target.name : target.username}
                  value={target.id.toString()}
                >
                  <div className="flex items-center gap-2">
                    <span>
                      {"name" in target ? target.name : target.username}
                    </span>
                    {allowCrossType && (
                      <Chip color="secondary" size="sm" variant="flat">
                        {targetType === "group" ? "مجموعة" : "مستخدم"}
                      </Chip>
                    )}
                  </div>
                </SelectItem>
              ))}
            </Select>

            {targets.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                لا توجد {targetType === "group" ? "مجموعات" : "مستخدمين"} متاحة
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            إلغاء
          </Button>
          <Button
            color="primary"
            isDisabled={!selectedTarget || targets.length === 0}
            isLoading={copying}
            startContent={<DocumentDuplicateIcon className="h-5 w-5" />}
            onPress={handleCopy}
          >
            نسخ الصلاحيات
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
