"use client";

import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Squares2X2Icon, ArrowPathIcon } from "@heroicons/react/24/outline";

import { PERMISSION_TYPES } from "../../types/permissions";
import { getPermissionLabel } from "../../utils/permission-formatters";

interface QuickPermissionActionsProps {
  selectedScreens: string[];
  onApplyPermission: (permission: string) => void;
  onApplyAll: () => void;
  onClearAll: () => void;
}

export default function QuickPermissionActions({
  selectedScreens,
  onApplyPermission,
  onApplyAll,
  onClearAll,
}: QuickPermissionActionsProps) {
  if (selectedScreens.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <Squares2X2Icon className="h-5 w-5 text-blue-600" />
      <span className="text-sm font-medium text-blue-900 flex-1">
        {selectedScreens.length} شاشة محددة
      </span>
      <div className="flex gap-2">
        <Dropdown>
          <DropdownTrigger>
            <Button color="primary" size="sm" variant="flat">
              تطبيق صلاحية
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Quick Permission Actions"
            onAction={(key) => {
              if (key !== "all" && key !== "clear") {
                onApplyPermission(key as string);
              }
            }}
          >
            {Object.values(PERMISSION_TYPES).map((permission) => (
              <DropdownItem key={permission}>
                {getPermissionLabel(permission)}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
        <Button
          color="success"
          size="sm"
          startContent={<ArrowPathIcon className="h-4 w-4" />}
          variant="flat"
          onPress={onApplyAll}
        >
          تطبيق الكل
        </Button>
        <Button size="sm" variant="light" onPress={onClearAll}>
          إلغاء
        </Button>
      </div>
    </div>
  );
}
