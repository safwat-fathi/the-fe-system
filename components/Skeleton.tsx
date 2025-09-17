"use client";

import { Skeleton as HeroUISkeleton } from "@heroui/react";
import clsx from "clsx";

interface SkeletonProps {
  className?: string;
  isLoaded?: boolean;
  children?: React.ReactNode;
}

export function Skeleton({ className, isLoaded = false, children }: SkeletonProps) {
  if (isLoaded) {
    return <>{children}</>;
  }

  return (
    <HeroUISkeleton 
      className={clsx(
        "rounded-lg bg-gray-200",
        className
      )}
    />
  );
}

export default Skeleton;