"use client";

import { Button, Chip } from "@heroui/react";

import { PERMISSION_TYPES } from "../../types/permissions";
import {
  getPermissionLabel,
  getPermissionColor,
} from "../../utils/permission-formatters";

interface PermissionFiltersProps {
  selectedPermissions: Set<string>;
  onTogglePermission: (permission: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export default function PermissionFilters({
  selectedPermissions,
  onTogglePermission,
  onSelectAll,
  onClearAll,
}: PermissionFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          تصفية حسب الصلاحية:
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="flat" onPress={onSelectAll}>
            تحديد الكل
          </Button>
          <Button size="sm" variant="light" onPress={onClearAll}>
            إلغاء الكل
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.values(PERMISSION_TYPES).map((permission) => {
          const isSelected = selectedPermissions.has(permission);
          const color = getPermissionColor(permission);
          const label = getPermissionLabel(permission);

          return (
            <Chip
              key={permission}
              isPressable
              className="cursor-pointer"
              color={isSelected ? (color as any) : "default"}
              variant={isSelected ? "flat" : "bordered"}
              onPress={() => onTogglePermission(permission)}
            >
              {label}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
