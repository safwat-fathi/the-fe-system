"use client";

import { useState } from "react";
import { Button, Chip } from "@heroui/react";
import { EyeIcon } from "@heroicons/react/24/outline";

import { Group } from "../../types/groups";
import { SYSTEM_MAP } from "../../utils/system-map";
import {
  getPermissionLabel,
  getPermissionColor,
} from "../../utils/permission-formatters";

interface GroupPermissionsViewProps {
  group: Group;
  permissions: Record<string, string[]>;
}

export default function GroupPermissionsView({
  group,
  permissions,
}: GroupPermissionsViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

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

  return (
    <div className="space-y-4">
      {SYSTEM_MAP.systems.map((system) =>
        system.sections.map((section) => {
          const sectionScreens = section.screens.filter(
            (screen) => permissions[screen.id]?.length > 0,
          );

          if (sectionScreens.length === 0) return null;

          const isExpanded = expandedSections.has(section.id);

          return (
            <div
              key={section.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">
                    {section.name}
                  </span>
                  <Chip color="primary" size="sm" variant="flat">
                    {sectionScreens.length} شاشة
                  </Chip>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => toggleSection(section.id)}
                >
                  <EyeIcon
                    className={`h-4 w-4 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-3">
                  {sectionScreens.map((screen) => {
                    const screenPerms = permissions[screen.id] || [];

                    return (
                      <div
                        key={screen.id}
                        className="border border-gray-200 rounded-lg p-3 bg-white"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {screen.name}
                          </span>
                          <Chip color="secondary" size="sm" variant="flat">
                            {screenPerms.length} صلاحية
                          </Chip>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {screenPerms.map((permission) => {
                            const color = getPermissionColor(permission);
                            const label = getPermissionLabel(permission);

                            return (
                              <Chip
                                key={permission}
                                color={color as any}
                                size="sm"
                                variant="flat"
                              >
                                {label}
                              </Chip>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }),
      )}
    </div>
  );
}
