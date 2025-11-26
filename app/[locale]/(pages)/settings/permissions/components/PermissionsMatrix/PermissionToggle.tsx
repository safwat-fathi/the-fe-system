"use client";

import { Checkbox, Chip } from "@heroui/react";

import { Screen } from "../../types/systems";
import { PERMISSION_TYPES } from "../../types/permissions";
import {
  getPermissionLabel,
  getPermissionColor,
  getPermissionIcon,
} from "../../utils/permission-formatters";

interface PermissionToggleProps {
  screen: Screen;
  permissions?: string[];
  onPermissionChange?: (permission: string, checked: boolean) => void;
  readOnly?: boolean;
}

export default function PermissionToggle({
  permissions = [],
  onPermissionChange,
  readOnly = false,
}: PermissionToggleProps) {
  const allPermissions = Object.values(PERMISSION_TYPES);

  const getBgColor = (isChecked: boolean, color: string) => {
    if (!isChecked) return "bg-gray-50 border-gray-200";

    const colorMap: Record<string, string> = {
      default: "bg-gray-50 border-gray-200",
      primary: "bg-blue-50 border-blue-200",
      secondary: "bg-purple-50 border-purple-200",
      success: "bg-green-50 border-green-200",
      warning: "bg-amber-50 border-amber-200",
      danger: "bg-red-50 border-red-200",
    };

    return colorMap[color] || "bg-gray-50 border-gray-200";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {allPermissions.map((permission) => {
        const isChecked = permissions.includes(permission);
        const color = getPermissionColor(permission);
        const icon = getPermissionIcon(permission);
        const label = getPermissionLabel(permission);

        return (
          <div
            key={permission}
            className={`flex items-center gap-2 p-2 rounded-lg border ${getBgColor(isChecked, color)}`}
          >
            <Checkbox
              isDisabled={readOnly}
              isSelected={isChecked}
              size="sm"
              onValueChange={(checked) =>
                !readOnly && onPermissionChange?.(permission, checked)
              }
            />
            <Chip
              color={isChecked ? (color as any) : "default"}
              size="sm"
              startContent={<span>{icon}</span>}
              variant={isChecked ? "flat" : "bordered"}
            >
              {label}
            </Chip>
          </div>
        );
      })}
    </div>
  );
}
