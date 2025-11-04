"use client";

import { Chip, Tooltip } from "@heroui/react";
import {
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface PermissionIndicatorProps {
  source: "group" | "user" | "inherited" | "custom";
  groupName?: string;
}

export default function PermissionIndicator({
  source,
  groupName,
}: PermissionIndicatorProps) {
  const getColor = () => {
    switch (source) {
      case "group":
        return "secondary";
      case "inherited":
        return "warning";
      case "custom":
        return "primary";
      default:
        return "default";
    }
  };

  const getLabel = () => {
    switch (source) {
      case "group":
        return `من مجموعة: ${groupName || "غير محدد"}`;
      case "inherited":
        return "موروث من مجموعة";
      case "custom":
        return "مخصص";
      default:
        return "غير محدد";
    }
  };

  return (
    <Tooltip content={getLabel()}>
      <Chip
        size="sm"
        color={getColor()}
        variant="flat"
        startContent={<InformationCircleIcon className="h-3 w-3" />}
      >
        {source === "group" && "مجموعة"}
        {source === "inherited" && "موروث"}
        {source === "custom" && "مخصص"}
      </Chip>
    </Tooltip>
  );
}

