"use client";

import type { ComponentType } from "react";

import {
  Bars3Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  CalculatorIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentTextIcon,
  DocumentCheckIcon,
  HomeIcon,
  TagIcon,
  UserGroupIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

type IconMap = Record<string, ComponentType<any>>;

const iconMap: IconMap = {
  HomeIcon,
  Bars3Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  CalculatorIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentTextIcon,
  DocumentCheckIcon,
  TagIcon,
  UserGroupIcon,
  LinkIcon,
};

interface IconRendererProps {
  iconName?: string;
  className?: string;
  size?: number;
}

export default function IconRenderer({
  iconName,
  className,
  size = 24,
}: IconRendererProps) {
  if (!iconName) {
    return <HomeIcon className={className} height={size} width={size} />;
  }

  // Normalize icon name
  const normalizedName = iconName.endsWith("Icon")
    ? iconName
    : `${iconName}Icon`;

  const IconComponent = iconMap[normalizedName];

  if (!IconComponent) {
    return <HomeIcon className={className} height={size} width={size} />;
  }

  return <IconComponent className={className} height={size} width={size} />;
}
