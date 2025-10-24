"use client";

import { ReactNode } from "react";
import {
  Card as HeroCard,
  CardHeader,
  CardBody,
  CardFooter,
} from "@heroui/react";

// Re-export HeroUI components for convenience
export { CardHeader, CardBody, CardFooter };

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  variant?: "default" | "elevated" | "bordered";
  shadow?: "none" | "sm" | "md" | "lg";
}

export default function Card({
  title,
  subtitle,
  children,
  footer,
  className = "",
  headerActions,
  variant = "default",
  shadow = "sm",
}: CardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "elevated":
        return "shadow-large border-0";
      case "bordered":
        return "shadow-none border-2 border-gray-200";
      default:
        return `shadow-${shadow} border border-gray-100`;
    }
  };

  return (
    <HeroCard
      className={`bg-white rounded-xl transition-all duration-200 ${getVariantClasses()} ${className}`}
    >
      {(title || subtitle || headerActions) && (
        <CardHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between w-full">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {title}
                </h3>
              )}
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
            {headerActions && (
              <div className="flex items-center gap-2">{headerActions}</div>
            )}
          </div>
        </CardHeader>
      )}

      <CardBody className="p-6">{children}</CardBody>

      {footer && (
        <CardFooter className="pt-4 border-t border-gray-100 bg-gray-50">
          {footer}
        </CardFooter>
      )}
    </HeroCard>
  );
}

// Specialized card components
export function InfoCard({
  title,
  value,
  icon,
  trend,
  className = "",
}: {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-sm font-medium ${trend.isPositive ? "text-success-600" : "text-danger-600"}`}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-gray-500">من الشهر السابق</span>
            </div>
          )}
        </div>
        {icon && <div className="text-3xl text-gray-300">{icon}</div>}
      </div>
    </Card>
  );
}

export function MetricCard({
  title,
  value,
  description,
  icon,
  color = "blue",
  className = "",
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  className?: string;
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    yellow: "text-yellow-600 bg-yellow-50",
    red: "text-red-600 bg-red-50",
    purple: "text-purple-600 bg-purple-50",
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-4">
        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <div className="text-xl">{icon}</div>
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

// Re-export StatCard for convenience
export { default as StatCard } from "./StatCard";
