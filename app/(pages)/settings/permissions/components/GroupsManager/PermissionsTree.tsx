"use client";

import { useState } from "react";
import { Checkbox, Chip } from "@heroui/react";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  DocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

import { SYSTEM_MAP } from "../../utils/system-map";
import { PERMISSION_TYPES } from "../../types/permissions";
import {
  getPermissionLabel,
  getPermissionColor,
  getPermissionIcon,
} from "../../utils/permission-formatters";

interface PermissionsTreeProps {
  permissions: Record<string, string[]>;
  onPermissionChange: (screenId: string, permission: string, checked: boolean) => void;
  onSelectAll: (screenId: string, checked: boolean) => void;
  readOnly?: boolean;
}

export default function PermissionsTree({
  permissions,
  onPermissionChange,
  onSelectAll,
  readOnly = false,
}: PermissionsTreeProps) {
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(
    new Set(["accounting", "gold", "settings"]),
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  const toggleSystem = (systemId: string) => {
    setExpandedSystems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(systemId)) {
        newSet.delete(systemId);
      } else {
        newSet.add(systemId);
      }
      return newSet;
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const hasAllPermissions = (screenId: string): boolean => {
    const screenPerms = permissions[screenId] || [];
    return screenPerms.length === Object.values(PERMISSION_TYPES).length;
  };

  const hasSomePermissions = (screenId: string): boolean => {
    const screenPerms = permissions[screenId] || [];
    return (
      screenPerms.length > 0 &&
      screenPerms.length < Object.values(PERMISSION_TYPES).length
    );
  };

  const getBgColor = (isChecked: boolean, color: string) => {
    if (!isChecked) return "bg-white border-gray-200 hover:bg-gray-50";

    const colorMap: Record<string, string> = {
      default: "bg-gray-100 border-gray-300",
      primary: "bg-blue-100 border-blue-300",
      secondary: "bg-purple-100 border-purple-300",
      success: "bg-green-100 border-green-300",
      warning: "bg-amber-100 border-amber-300",
      danger: "bg-red-100 border-red-300",
    };

    return colorMap[color] || "bg-gray-100 border-gray-300";
  };

  return (
    <div className="space-y-2">
      {SYSTEM_MAP.systems.map((system) => {
        const isSystemExpanded = expandedSystems.has(system.id);

        return (
          <div
            key={system.id}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            {/* System Header */}
            <div
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 cursor-pointer transition-colors"
              onClick={() => toggleSystem(system.id)}
            >
              <div className="flex items-center gap-2 flex-1">
                {isSystemExpanded ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                )}
                <div
                  className={`w-3 h-3 rounded-full ${
                    system.color === "blue"
                      ? "bg-blue-500"
                      : system.color === "amber"
                        ? "bg-amber-500"
                        : "bg-slate-500"
                  }`}
                />
                <FolderIcon className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-900 text-lg">
                  {system.name}
                </span>
                <Chip size="sm" variant="flat" color="secondary">
                  {system.sections.length} أقسام
                </Chip>
              </div>
            </div>

            {/* System Sections */}
            {isSystemExpanded && (
              <div className="border-t border-gray-200">
                {system.sections.map((section) => {
                  const isSectionExpanded = expandedSections.has(section.id);

                  return (
                    <div
                      key={section.id}
                      className="border-b border-gray-200 last:border-b-0"
                    >
                      {/* Section Header */}
                      <div
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {isSectionExpanded ? (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                          )}
                          <DocumentIcon className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-800">
                            {section.name}
                          </span>
                          <Chip size="sm" variant="flat">
                            {section.screens.length} شاشات
                          </Chip>
                        </div>
                      </div>

                      {/* Section Screens */}
                      {isSectionExpanded && (
                        <div className="bg-white pl-8 pr-4 py-3 space-y-3">
                          {section.screens.map((screen) => {
                            const screenPerms = permissions[screen.id] || [];
                            const allSelected = hasAllPermissions(screen.id);
                            const someSelected = hasSomePermissions(screen.id);

                            return (
                              <div
                                key={screen.id}
                                className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                              >
                                {/* Screen Header */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      isSelected={allSelected}
                                      isIndeterminate={someSelected}
                                      onValueChange={(checked) =>
                                        onSelectAll(screen.id, checked)
                                      }
                                      isDisabled={readOnly}
                                    >
                                      <span className="font-medium text-gray-900">
                                        {screen.name}
                                      </span>
                                    </Checkbox>
                                    {screen.path && (
                                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                        {screen.path}
                                      </span>
                                    )}
                                  </div>
                                  {screenPerms.length > 0 && (
                                    <Chip
                                      size="sm"
                                      color="primary"
                                      variant="flat"
                                    >
                                      {screenPerms.length} صلاحية
                                    </Chip>
                                  )}
                                </div>

                                {/* Permissions Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mr-6">
                                  {Object.values(PERMISSION_TYPES).map(
                                    (permission) => {
                                      const isChecked =
                                        screenPerms.includes(permission);
                                      const color = getPermissionColor(permission);
                                      const icon = getPermissionIcon(permission);
                                      const label =
                                        getPermissionLabel(permission);

                                      return (
                                        <div
                                          key={permission}
                                          onClick={() =>
                                            !readOnly &&
                                            onPermissionChange(
                                              screen.id,
                                              permission,
                                              !isChecked,
                                            )
                                          }
                                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${getBgColor(
                                            isChecked,
                                            color,
                                          )} ${readOnly ? "cursor-not-allowed opacity-50" : ""}`}
                                        >
                                          <div
                                            className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${
                                              isChecked
                                                ? `bg-${color}-500 border-${color}-500`
                                                : "bg-white border-gray-300"
                                            }`}
                                            style={{
                                              backgroundColor: isChecked
                                                ? color === "primary"
                                                  ? "#3b82f6"
                                                  : color === "secondary"
                                                    ? "#a855f7"
                                                    : color === "success"
                                                      ? "#10b981"
                                                      : color === "warning"
                                                        ? "#f59e0b"
                                                        : color === "danger"
                                                          ? "#ef4444"
                                                          : "#6b7280"
                                                : "white",
                                              borderColor: isChecked
                                                ? color === "primary"
                                                  ? "#3b82f6"
                                                  : color === "secondary"
                                                    ? "#a855f7"
                                                    : color === "success"
                                                      ? "#10b981"
                                                      : color === "warning"
                                                        ? "#f59e0b"
                                                        : color === "danger"
                                                          ? "#ef4444"
                                                          : "#6b7280"
                                                : "#d1d5db",
                                            }}
                                          >
                                            {isChecked && (
                                              <CheckIcon className="h-3 w-3 text-white" />
                                            )}
                                          </div>
                                          <Chip
                                            color={
                                              isChecked
                                                ? (color as any)
                                                : "default"
                                            }
                                            variant={
                                              isChecked ? "flat" : "bordered"
                                            }
                                            size="sm"
                                            startContent={
                                              <span className="text-xs">
                                                {icon}
                                              </span>
                                            }
                                            className="flex-1 justify-center"
                                          >
                                            <span className="text-xs">
                                              {label}
                                            </span>
                                          </Chip>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

