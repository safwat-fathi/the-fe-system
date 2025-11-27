"use client";

import { Button } from "@heroui/react";
import Link from "next/link";

interface ActionButton {
  label: string;
  href: string;
  color?: "primary" | "secondary" | "success" | "warning" | "danger";
  variant?: "solid" | "bordered" | "light" | "flat" | "faded" | "shadow";
  icon?: React.ReactNode;
}

interface ActionButtonsProps {
  buttons: ActionButton[];
  className?: string;
}

export default function ActionButtons({
  buttons,
  className = "",
}: ActionButtonsProps) {
  const getButtonClasses = (color: string, _variant: string) => {
    const baseClasses =
      "font-medium px-4 py-2.5 rounded-lg transition-all duration-200";

    switch (color) {
      case "primary":
        return `${baseClasses} bg-primary-600 hover:bg-primary-700 text-white shadow-soft hover:shadow-medium`;
      case "secondary":
        return `${baseClasses} bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200`;
      case "success":
        return `${baseClasses} bg-success-600 hover:bg-success-700 text-white shadow-soft hover:shadow-medium`;
      case "warning":
        return `${baseClasses} bg-warning-600 hover:bg-warning-700 text-white shadow-soft hover:shadow-medium`;
      case "danger":
        return `${baseClasses} bg-danger-600 hover:bg-danger-700 text-white shadow-soft hover:shadow-medium`;
      default:
        return `${baseClasses} bg-primary-600 hover:bg-primary-700 text-white shadow-soft hover:shadow-medium`;
    }
  };

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {buttons.map((button, index) => (
        <Button
          key={index}
          as={Link}
          className={getButtonClasses(
            button.color || "primary",
            button.variant || "solid",
          )}
          color={button.color || "primary"}
          href={button.href}
          startContent={button.icon}
          variant={button.variant || "solid"}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
}
