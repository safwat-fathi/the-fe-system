"use client";

import { useState } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  Chip,
  Divider,
} from "@heroui/react";
import {
  Squares2X2Icon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";

import { PERMISSION_TYPES } from "../../types/permissions";
import { SYSTEM_MAP } from "../../utils/system-map";
import {
  getPermissionLabel,
  getPermissionColor,
} from "../../utils/permission-formatters";

interface BulkPermissionsProps {
  selectedScreens: string[];
  currentPermissions: Record<string, string[]>;
  onApply: (permissions: Record<string, string[]>) => void;
  onClose: () => void;
}

export default function BulkPermissions({
  selectedScreens,
  currentPermissions,
  onApply,
  onClose,
}: BulkPermissionsProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const selectAll = () => {
    setSelectedPermissions(Object.values(PERMISSION_TYPES));
  };

  const clearAll = () => {
    setSelectedPermissions([]);
  };

  const handleApply = () => {
    if (selectedPermissions.length === 0) {
      return;
    }

    const newPermissions: Record<string, string[]> = {};
    selectedScreens.forEach((screenId) => {
      newPermissions[screenId] = [...selectedPermissions];
    });

    onApply(newPermissions);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <Squares2X2Icon className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-bold">تطبيق صلاحيات مجمعة</h3>
              <p className="text-sm text-gray-500 font-normal">
                {selectedScreens.length} شاشة محددة
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                اختر الصلاحيات المراد تطبيقها على جميع الشاشات المحددة
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="flat" onPress={selectAll}>
                  تحديد الكل
                </Button>
                <Button size="sm" variant="flat" onPress={clearAll}>
                  إلغاء الكل
                </Button>
              </div>
            </div>

            <Divider />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.values(PERMISSION_TYPES).map((permission) => {
                const isSelected = selectedPermissions.includes(permission);
                const color = getPermissionColor(permission);
                const label = getPermissionLabel(permission);

                return (
                  <div
                    key={permission}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? color === "primary"
                          ? "bg-blue-50 border-blue-200"
                          : color === "success"
                            ? "bg-green-50 border-green-200"
                            : color === "danger"
                              ? "bg-red-50 border-red-200"
                              : color === "warning"
                                ? "bg-amber-50 border-amber-200"
                                : "bg-gray-50 border-gray-200"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => togglePermission(permission)}
                  >
                    <Checkbox
                      isSelected={isSelected}
                      onValueChange={() => togglePermission(permission)}
                    >
                      <Chip
                        color={isSelected ? (color as any) : "default"}
                        variant={isSelected ? "flat" : "bordered"}
                        size="sm"
                      >
                        {label}
                      </Chip>
                    </Checkbox>
                  </div>
                );
              })}
            </div>

            {selectedScreens.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  سيتم تطبيق {selectedPermissions.length} صلاحية على{" "}
                  {selectedScreens.length} شاشة
                </p>
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
            onPress={handleApply}
            isDisabled={selectedPermissions.length === 0}
            startContent={<CheckBadgeIcon className="h-5 w-5" />}
          >
            تطبيق على {selectedScreens.length} شاشة
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

